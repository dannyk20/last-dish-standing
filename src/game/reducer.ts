// 게임 상태 머신 리듀서 (LAST DISH STANDING)
// 설계 문서 "상태 머신 정의"(GameState 형태, 액션 표, 패자부활 트리거 규칙,
// 연승 규칙)와 "게임 상태 다이어그램" 기준.
//
// reducer 는 순수 함수 (state, action) => GameState 이다. 부수 효과가 없으며
// 동일 입력에 대해 항상 동일 출력을 반환한다. 무작위성이 필요한 경우(부활 후보
// 3개 초과 선정)에는 이미 셔플된 목록을 action payload 로 주입받는다.
//
// _Requirements: 4.3, 4.5, 6.1, 6.4, 9.1~9.6, 11.1~11.5, 13.1, 13.2, 13.3,
// 13.5, 13.6, 13.8, 13.9, 14.1, 15.1, 15.2, 17.1, 17.2, 17.3_
import type { Restaurant, GameState, SetupInput, BattleResult } from '../types';
import type { GameAction } from './actions';
import { calcTotalRounds, shouldTriggerRevival } from './rules';

/** 게임 시작 시 Roster 크기가 이 값 이상이면 패자부활전 자격이 부여된다. */
const REVIVAL_ELIGIBLE_MIN = 6;
/** 패자부활 후보 최대 수. */
const MAX_REVIVAL_CANDIDATES = 3;

const EMPTY_SETUP: SetupInput = { foodType: '', region: '' };

/**
 * 초기 상태 팩토리.
 *
 * 전체 상태를 `setup` 단계로 초기화한다. 선택적으로 setup(지역·음식) 값을
 * 미리 채울 수 있다. 매 호출마다 새로운 객체를 생성하여 참조 공유로 인한
 * 상태 오염을 방지한다.
 */
export function createInitialState(setup: SetupInput = EMPTY_SETUP): GameState {
  return {
    status: 'setup',
    setup: { ...setup },
    rosterOrder: [],
    restaurantsById: {},
    currentChampion: null,
    currentChallenger: null,
    nextIndex: 0,
    currentRound: 0,
    totalRounds: 0,
    winStreak: 0,
    winCount: 0,
    eliminated: [],
    revivalEligible: false,
    revivalUsed: false,
    revivalCandidates: [],
    lastBattle: null,
    selectedId: null,
    error: null,
  };
}

/** 리듀서 초기 상태(참조 공유 방지를 위해 팩토리 사용을 권장). */
export const initialState: GameState = createInitialState();

/**
 * LOAD_SUCCESS: 확정·셔플된 Roster 로 playing 상태를 구성한다.
 * champion = roster[0], challenger = roster[1], nextIndex = 2, round = 1.
 */
function startPlaying(state: GameState, roster: Restaurant[]): GameState {
  const rosterOrder = roster.map((r) => r.id);
  const restaurantsById: Record<string, Restaurant> = {};
  for (const r of roster) restaurantsById[r.id] = r;

  const participantCount = rosterOrder.length;

  return {
    ...state,
    status: 'playing',
    rosterOrder,
    restaurantsById,
    currentChampion: rosterOrder[0],
    currentChallenger: rosterOrder[1],
    nextIndex: 2,
    currentRound: 1,
    totalRounds: calcTotalRounds(participantCount),
    winStreak: 0,
    winCount: 0,
    eliminated: [],
    revivalEligible: participantCount >= REVIVAL_ELIGIBLE_MIN,
    revivalUsed: false,
    revivalCandidates: [],
    lastBattle: null,
    selectedId: null,
    error: null,
  };
}

/**
 * 다음 일반 도전자로 진행하거나(nextIndex 사용) 남은 도전자가 없으면 종료한다.
 * `revival` 또는 `ratingReveal` 이후 공용으로 사용된다.
 */
function advanceToNextChallenger(state: GameState): GameState {
  if (state.nextIndex < state.rosterOrder.length) {
    return {
      ...state,
      status: 'playing',
      currentChallenger: state.rosterOrder[state.nextIndex],
      nextIndex: state.nextIndex + 1,
      currentRound: state.currentRound + 1,
      revivalCandidates: [],
    };
  }
  // 남은 도전자가 없으면 현재 챔피언을 Winner로 확정.
  return {
    ...state,
    status: 'finished',
    currentChallenger: null,
    revivalCandidates: [],
  };
}

/**
 * 탈락 식당에서 패자부활 후보를 산출한다.
 * - 현재 챔피언은 후보에서 제외한다.
 * - 후보가 MAX(3)개를 초과하면 주입된 셔플 목록으로 무작위 3개를, 없으면
 *   탈락 등록 순서 기준 앞에서 3개를 선정한다.
 */
function computeRevivalCandidates(
  state: GameState,
  shuffledEliminated?: string[],
): string[] {
  const pool = (shuffledEliminated ?? state.eliminated).filter(
    (id) => id !== state.currentChampion && state.eliminated.includes(id),
  );
  return pool.slice(0, MAX_REVIVAL_CANDIDATES);
}

/**
 * 게임 상태 머신 리듀서.
 */
export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      // setup → loading. 선택한 지역·음식 저장.
      return {
        ...createInitialState(action.setup),
        status: 'loading',
        error: null,
      };
    }

    case 'LOAD_SUCCESS': {
      // loading → playing. Roster/저장소/챔피언·첫 도전자 세팅.
      if (action.roster.length < 2) {
        // 방어: 2개 미만은 게임을 시작하지 않는다(LOAD_ERROR 경로가 정상).
        return {
          ...state,
          status: 'error',
          error: '대결을 진행할 식당이 부족합니다.',
        };
      }
      return startPlaying(state, action.roster);
    }

    case 'LOAD_ERROR': {
      // loading → error. 확보 데이터는 유지한 채 안내 메시지 저장.
      return {
        ...state,
        status: 'error',
        error: action.message,
      };
    }

    case 'SELECT_RESTAURANT': {
      // 중복/이중 클릭 가드: playing 이 아니면 무시.
      if (state.status !== 'playing') return state;
      if (state.currentChampion === null || state.currentChallenger === null) {
        return state;
      }

      const { id } = action;
      // 선택 id 는 챔피언 또는 도전자 중 하나여야 한다. 그 외 입력은 무시.
      if (id !== state.currentChampion && id !== state.currentChallenger) {
        return state;
      }

      const winnerId = id;
      const loserId =
        id === state.currentChampion
          ? state.currentChallenger
          : state.currentChampion;

      // 연승 규칙: 승자가 직전 챔피언과 동일하면 유지(증가), 아니면 교체(리셋).
      const championRetained = winnerId === state.currentChampion;
      const winStreak = championRetained ? state.winStreak + 1 : 1;
      const winCount = championRetained ? state.winCount + 1 : 1;

      const lastBattle: BattleResult = {
        winnerId,
        loserId,
        round: state.currentRound,
      };

      return {
        ...state,
        status: 'ratingReveal',
        currentChampion: winnerId,
        // 도전자는 평점 공개 단계에서도 참조 가능하도록 유지한다.
        currentChallenger: state.currentChallenger,
        eliminated: [...state.eliminated, loserId],
        winStreak,
        winCount,
        lastBattle,
        selectedId: winnerId,
      };
    }

    case 'REVEAL_NEXT': {
      // ratingReveal 에서만 처리.
      if (state.status !== 'ratingReveal') return state;

      // 패자부활 트리거 판정.
      const trigger = shouldTriggerRevival({
        rosterSize: state.rosterOrder.length,
        revivalEligible: state.revivalEligible,
        revivalUsed: state.revivalUsed,
        eliminatedCount: state.eliminated.length,
      });

      if (trigger) {
        // ratingReveal → revival. 후보 산출.
        const revivalCandidates = computeRevivalCandidates(
          state,
          action.shuffledEliminated,
        );
        return {
          ...state,
          status: 'revival',
          revivalCandidates,
        };
      }

      // 트리거 미충족 시 다음 일반 도전자 또는 종료.
      return advanceToNextChallenger(state);
    }

    case 'ENTER_REVIVAL': {
      // ratingReveal → revival 명시 전이(REVEAL_NEXT 내부 분기와 동일 결과).
      if (state.status !== 'ratingReveal') return state;
      const revivalCandidates = computeRevivalCandidates(
        state,
        action.shuffledEliminated,
      );
      return {
        ...state,
        status: 'revival',
        revivalCandidates,
      };
    }

    case 'REVIVE_RESTAURANT': {
      // revival → playing. 선택 식당을 다음 도전자로.
      if (state.status !== 'revival') return state;
      if (!state.revivalCandidates.includes(action.id)) return state;

      // 부활 식당은 일반 Roster(참가 수 - 1) 밖의 "추가 대결"이므로,
      // 실제 진행 총 라운드에 이 대결을 포함하도록 totalRounds도 함께 증가시킨다.
      // (게임당 최대 1회이므로 최대 +1. Req 14.1: 일반 도전자 + 필요한 부활 대결.)
      return {
        ...state,
        status: 'playing',
        currentChallenger: action.id,
        eliminated: state.eliminated.filter((id) => id !== action.id),
        revivalUsed: true,
        revivalCandidates: [],
        currentRound: state.currentRound + 1,
        totalRounds: state.totalRounds + 1,
      };
    }

    case 'SKIP_REVIVAL': {
      // revival → playing(다음 일반 도전자) 또는 finished. revivalUsed 확정.
      if (state.status !== 'revival') return state;
      const used: GameState = { ...state, revivalUsed: true };
      return advanceToNextChallenger(used);
    }

    case 'FINISH': {
      // ratingReveal → finished. 현재 챔피언을 Winner로 확정.
      if (state.status !== 'ratingReveal') return state;
      return {
        ...state,
        status: 'finished',
        currentChallenger: null,
        revivalCandidates: [],
      };
    }

    case 'RESTART_SAME': {
      // finished/error → loading. 지역·음식 유지, 순서 재셔플은 로딩 파이프라인에서.
      return {
        ...createInitialState(state.setup),
        status: 'loading',
        error: null,
      };
    }

    case 'RESTART_NEW': {
      // 전체 상태 초기화 → setup.
      return createInitialState();
    }

    default:
      return state;
  }
}
