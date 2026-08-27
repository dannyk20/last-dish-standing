import { useCallback, useEffect, useRef, useState } from 'react';

import { useGame } from './game/useGame';
import type { SetupInput, Restaurant } from './types';

import { placesService } from './services/placesService';
import { normalizePlace } from './services/normalizer';
import type { RawPlace } from './services/placesService';
import { passesQualityGate, buildRoster } from './game/rules';
import { generateSurvivalText } from './lib/generator';
import { shuffle } from './lib/shuffle';
import { playSound, primeAudio } from './lib/sound';

import StartScreen from './screens/StartScreen';
import BattleScreen from './screens/BattleScreen';
import RevivalRound from './screens/RevivalRound';
import RevivalReveal from './screens/RevivalReveal';
import ChampionReveal from './screens/ChampionReveal';
import WinnerScreen from './screens/WinnerScreen';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

/**
 * 후보 심화 상세(getDetails)를 시도할 최대 개수.
 *
 * Text Search 결과 상위 후보에 대해서만 상세를 보강하여, 리뷰/사진 등 부족한
 * 정보를 채운다(Req 6.3/6.4: 동일 place 반복 요청 없이 필요한 경우에만 1회).
 * Roster 최대 크기(8)에 여유를 두어, 품질 게이트 통과 후보가 8개 이상 확보되도록 한다.
 */
const MAX_DETAIL_LOOKUPS = 12;

/**
 * 게임 시작(로딩) 파이프라인.
 *
 * 검색 → (필요 시) 상세 보강 → 정규화 → 품질 검증 → 별명/소개 생성 →
 * Roster 확정 → 셔플 순으로 진행하여, 등장 순서가 무작위로 재배치된 참가 식당
 * 배열을 반환한다. 이 함수는 게임 시작 시 1회만 Places API 를 호출하며,
 * 이후 게임플레이 중에는 호출되지 않는다(Req 6.2).
 *
 * 반환된 roster 길이가 2 미만이면 상위에서 LOAD_ERROR 로 처리한다(Req 4.3).
 *
 * _Requirements: 2.1, 4.1, 4.2, 4.4, 4.5, 6.1, 6.3, 6.4_
 */
async function runLoadPipeline(setup: SetupInput): Promise<Restaurant[]> {
  // 1) 지역 + 음식 종류로 후보 검색 (Req 2.1).
  const rawPlaces: RawPlace[] = await placesService.searchRestaurants({
    region: setup.region,
    foodType: setup.foodType,
  });

  // 2) 상세 보강 대상 선정: 상위 후보에 한해 getDetails 로 리뷰/사진 등을 보강한다.
  //    동일 place 를 중복 요청하지 않도록 place id 기준으로 1회만 조회한다(Req 6.3).
  const detailTargets = rawPlaces.slice(0, MAX_DETAIL_LOOKUPS);
  const detailsById = new Map<string, RawPlace>();
  await Promise.all(
    detailTargets.map(async (place) => {
      if (!place.id || detailsById.has(place.id)) return;
      try {
        const details = await placesService.getDetails(place.id);
        detailsById.set(place.id, details);
      } catch {
        // 상세 조회 실패는 치명적이지 않다. Text Search 결과만으로 정규화한다.
      }
    }),
  );

  // 3) 정규화 → 품질 검증 → 별명/소개 생성으로 완전한 Restaurant 를 구성한다.
  const candidates: Restaurant[] = [];
  for (const place of rawPlaces) {
    const normalized = normalizePlace(place, detailsById.get(place.id));

    // 품질 게이트: 사진·리뷰·가격대 중 2개 이상 확보한 후보만 통과 (Req 3.x).
    if (!passesQualityGate(normalized)) continue;

    // 규칙 기반 별명·한 줄 소개 생성 (Req 5.x). 여기서 완전한 Restaurant 가 된다.
    const { survivalTitle, survivalSummary } = generateSurvivalText({
      category: normalized.category,
      region: setup.region,
      priceLevel: normalized.priceLevel,
      reviews: normalized.reviews,
    });

    candidates.push({ ...normalized, survivalTitle, survivalSummary });
  }

  // 4) Roster 확정.
  //    품질 통과 후보가 8개를 초과하면, 매 게임 "같은 앞 8개"만 반복 선정되지 않도록
  //    확정 전에 후보 전체를 먼저 무작위로 섞는다. 이렇게 하면 잘려나간 후보도
  //    다음 게임에서 선정될 기회를 갖는다(랜덤성 개선). buildRoster 가 중복 제거 후
  //    앞에서 최대 8개를 선정하므로, 사전 셔플이 곧 무작위 표본 추출이 된다
  //    (Req 4.1/4.2/4.4). 반환된 Roster 는 이미 셔플된 상태이므로 등장 순서도
  //    무작위이다(Req 4.5).
  const roster = buildRoster(shuffle(candidates));
  return roster;
}

/**
 * 루트 컴포넌트.
 *
 * `useGame` 훅을 단일 진실 공급원으로 소유하고(Req 17.4), `state.status` 값에
 * 따라 렌더링할 화면을 스위칭한다. 화면은 상태를 직접 변경하지 않고 콜백을 통해
 * action 을 dispatch 한다.
 *
 * 게임 시작(`START_GAME`)과 같은 조건 다시하기(`RESTART_SAME`)는 모두 상태를
 * `loading` 으로 전이시키며, 두 경로 모두 하나의 로딩 이펙트를 통해 동일한
 * 파이프라인을 실행한다.
 *
 * _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4, 6.1, 6.4, 17.4_
 */
function App() {
  const { state, dispatch } = useGame();

  // ChampionReveal 연출 완료 여부를 나타내는 UI 전용 상태(Req 17.4: 게임 상태는
  // 리듀서가 단일 진실 공급원이므로, 순수 연출 진행도는 리듀서 밖에서 관리한다).
  // status 가 'finished' 이고 아직 연출이 끝나지 않았으면 ChampionReveal 을,
  // 연출이 끝나면 WinnerScreen 을 렌더링한다. 새 게임 시작 시 false 로 초기화되어
  // 다음 종료에서 연출이 다시 재생된다.
  const [championRevealed, setChampionRevealed] = useState(false);

  // 부활 연출 전용 UI 상태(Req 17.4: 게임 상태는 리듀서가 단일 진실 공급원이므로
  // 순수 연출 진행도는 리듀서 밖에서 관리한다). 패자부활전에서 후보를 선택하면
  // 곧바로 dispatch 하지 않고, 먼저 이 id 로 RevivalReveal 연출을 보여준 뒤
  // 연출 완료 콜백에서 REVIVE_RESTAURANT 를 dispatch 한다.
  const [pendingRevivalId, setPendingRevivalId] = useState<string | null>(null);

  // finished 가 아닌 상태(예: 다시 시작으로 loading/setup 전이)에서는 연출 플래그를
  // 초기화하여, 다음번 finished 진입 시 ChampionReveal 이 다시 재생되도록 한다.
  useEffect(() => {
    if (state.status !== 'finished' && championRevealed) {
      setChampionRevealed(false);
    }
  }, [state.status, championRevealed]);

  // 부활 연출 대기 중 상태가 revival 을 벗어나면(예: 연출 완료 후 playing 전이,
  // 또는 다시 시작으로 setup/loading 전이) 대기 id 를 초기화한다.
  useEffect(() => {
    if (state.status !== 'revival' && pendingRevivalId !== null) {
      setPendingRevivalId(null);
    }
  }, [state.status, pendingRevivalId]);

  // 현재 로딩 에피소드를 식별하는 토큰. loading 진입 시마다 증가시켜, 같은
  // 에피소드에 대해 파이프라인이 중복 실행(예: StrictMode 이중 마운트)되지 않도록 한다.
  const loadTokenRef = useRef(0);
  const runningTokenRef = useRef<number | null>(null);

  // status 가 loading 이 아닐 때는 토큰을 증가시켜, 다음 loading 진입을 새 에피소드로 취급한다.
  if (state.status !== 'loading') {
    loadTokenRef.current += 1;
  }

  // START_GAME / RESTART_SAME 로 loading 에 진입하면 동일 파이프라인을 실행한다.
  useEffect(() => {
    if (state.status !== 'loading') return;

    const token = loadTokenRef.current;
    // 이미 이 에피소드의 파이프라인이 진행 중이면 재실행하지 않는다.
    if (runningTokenRef.current === token) return;
    runningTokenRef.current = token;

    let cancelled = false;
    (async () => {
      try {
        const roster = await runLoadPipeline(state.setup);
        if (cancelled) return;
        if (roster.length >= 2) {
          dispatch({ type: 'LOAD_SUCCESS', roster });
        } else {
          dispatch({
            type: 'LOAD_ERROR',
            message:
              '대결을 진행할 식당이 부족합니다. 다른 지역이나 음식 종류를 선택해 주세요.',
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : '식당 정보를 불러오는 중 오류가 발생했습니다.';
        dispatch({ type: 'LOAD_ERROR', message });
      }
    })();

    return () => {
      cancelled = true;
    };
    // state.setup 은 loading 진입 시 확정되어 변하지 않는다. status 전이가 트리거이다.
  }, [state.status, state.setup, dispatch]);

  const handleStart = useCallback(
    (setup: SetupInput) => {
      // 첫 사용자 제스처(START 클릭)에서 오디오 컨텍스트를 미리 준비해 두면
      // 이후 효과음이 자동재생 정책에 막히지 않고 지연 없이 재생된다.
      primeAudio();
      dispatch({ type: 'START_GAME', setup });
    },
    [dispatch],
  );

  const handleSelect = useCallback(
    (id: string) => {
      // 선택 효과음은 BattleScreen 에서 클릭 즉시 재생한다(타이밍을 앞당기기 위함).
      // 여기서는 선택 결과만 dispatch 한다. 부활 트리거가 걸릴 경우 후보를 무작위
      // 3개로 선정할 수 있도록 셔플된 탈락 목록을 함께 전달한다.
      dispatch({
        type: 'SELECT_RESTAURANT',
        id,
        shuffledEliminated: shuffle(state.eliminated),
      });
    },
    [dispatch, state.eliminated],
  );

  // 패자부활전에서 후보를 부활 선택했을 때: 부활 효과음('revive', 중간 강도)을
  // 재생하고 연출을 시작한다.
  const handleRevive = useCallback((id: string) => {
    playSound('revive');
    setPendingRevivalId(id);
  }, []);

  const handleRestartSame = useCallback(() => {
    // 다시 시작 시 연출 플래그를 즉시 초기화하여 다음 종료에서 재생되도록 한다.
    setChampionRevealed(false);
    setPendingRevivalId(null);
    dispatch({ type: 'RESTART_SAME' });
  }, [dispatch]);

  const handleRestartNew = useCallback(() => {
    setChampionRevealed(false);
    setPendingRevivalId(null);
    dispatch({ type: 'RESTART_NEW' });
  }, [dispatch]);

  switch (state.status) {
    case 'setup':
      return <StartScreen onStart={handleStart} />;

    case 'loading':
      return <LoadingScreen />;

    case 'playing': {
      const champion =
        state.currentChampion !== null
          ? state.restaurantsById[state.currentChampion]
          : undefined;
      const challenger =
        state.currentChallenger !== null
          ? state.restaurantsById[state.currentChallenger]
          : undefined;

      // 방어: 대결에 필요한 두 식당이 없으면 로딩 표시로 폴백한다(정상 흐름에선 발생하지 않음).
      if (!champion || !challenger) {
        return <LoadingScreen />;
      }

      return (
        <BattleScreen
          champion={champion}
          challenger={challenger}
          round={state.currentRound}
          totalRounds={state.totalRounds}
          onSelect={handleSelect}
          onQuit={handleRestartNew}
        />
      );
    }

    case 'revival': {
      // 부활 후보를 선택해 연출 대기 중이면, 먼저 RevivalReveal 연출을 보여주고
      // 연출 완료 콜백에서 REVIVE_RESTAURANT 를 dispatch 한다(다음 대결로 진행).
      if (pendingRevivalId !== null) {
        const reviving = state.restaurantsById[pendingRevivalId];
        if (reviving) {
          return (
            <RevivalReveal
              revived={reviving}
              onRevealComplete={() =>
                dispatch({ type: 'REVIVE_RESTAURANT', id: pendingRevivalId })
              }
            />
          );
        }
        // 방어: 대상이 없으면 대기 상태를 무시하고 후보 목록으로 폴백한다.
      }

      // 부활 후보 id를 인메모리 저장소를 통해 Restaurant로 매핑한다(API 재호출 없음).
      // 저장소에 없는 id는 방어적으로 제외한다.
      const candidates = state.revivalCandidates
        .map((id) => state.restaurantsById[id])
        .filter((r): r is Restaurant => Boolean(r));

      return (
        <RevivalRound
          candidates={candidates}
          onRevive={handleRevive}
          onSkip={() => dispatch({ type: 'SKIP_REVIVAL' })}
        />
      );
    }

    case 'finished': {
      const winner =
        state.currentChampion !== null
          ? state.restaurantsById[state.currentChampion]
          : undefined;

      // 방어: 최종 Winner 가 존재하지 않으면(정상 흐름에선 발생하지 않음) 폴백한다.
      if (!winner) {
        return <LoadingScreen />;
      }

      // 최종 확정 순간엔 먼저 ChampionReveal 스포트라이트 연출을 보여주고,
      // 연출이 끝나면 WinnerScreen 상세를 노출한다(Req 14.1).
      if (!championRevealed) {
        return (
          <ChampionReveal
            winner={winner}
            onRevealComplete={() => setChampionRevealed(true)}
          />
        );
      }

      // 탈락한 식당 목록(등장/탈락 순서 유지). 후면 캐러셀에서 확인할 수 있다.
      // 저장소에 없는 id 는 방어적으로 제외한다.
      const eliminatedRestaurants = state.eliminated
        .map((id) => state.restaurantsById[id])
        .filter((r): r is Restaurant => Boolean(r));

      return (
        <WinnerScreen
          winner={winner}
          eliminated={eliminatedRestaurants}
          winStreak={state.winStreak}
          winCount={state.winCount}
          totalRounds={state.totalRounds}
          onRestartSame={handleRestartSame}
          onRestartNew={handleRestartNew}
        />
      );
    }

    case 'error':
      return (
        <ErrorScreen
          message={state.error ?? '알 수 없는 오류가 발생했습니다.'}
          onRetry={handleRestartSame}
          onNewGame={handleRestartNew}
        />
      );

    default:
      return <StartScreen onStart={handleStart} />;
  }
}

export default App;
