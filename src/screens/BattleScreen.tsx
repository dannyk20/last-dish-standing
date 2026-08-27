import { useEffect, useRef, useState } from 'react';
import type { Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import VersusIndicator from '../components/VersusIndicator';
import RoundIndicator from '../components/RoundIndicator';
import { playSound } from '../lib/sound';
import styles from './BattleScreen.module.css';

interface BattleScreenProps {
  champion: Restaurant;
  challenger: Restaurant;
  round: number;
  totalRounds: number;
  onSelect: (id: string) => void;
  /** 게임을 중단하고 시작 화면(setup)으로 돌아간다. */
  onQuit?: () => void;
}

/**
 * 선택 하이라이트 연출을 화면에 유지하는 시간(ms). 승자 카드 Spotlight ON /
 * 패자 OFF 를 충분히 보여준 뒤 다음 대결로 진행한다.
 * 개별 CSS transition/animation 자체는 200~600ms 범위(Req 19.5)를 지키며,
 * 이 값은 강조된 상태를 사용자가 인지하도록 머무르게 하는 대기 시간이다.
 */
const SELECT_HIGHLIGHT_MS = 1200;

/**
 * BATTLE 화면 (Game_Status = 'playing').
 *
 * 두 식당(챔피언 vs 도전자)을 1:1로 비교하며 사용자가 하나를 선택한다.
 * - 별명·이미지·식당명·카테고리·위치·가격대·한 줄 소개·대표 리뷰는 RestaurantCard가 표시한다.
 * - 평점은 렌더링하지 않는다: RestaurantCard에 showRating={false}를 넘겨 평점 영역
 *   자체를 DOM에서 제외한다(CSS 숨김 아님). Requirements 8.2, 8.3.
 * - 각 카드는 선택 UI를 가진다. 선택하면 승자 카드에 Spotlight ON(Gold Glow),
 *   패자 카드에 Spotlight OFF(어둡게)를 잠시 보여준 뒤 onSelect(id)로 다음 대결을
 *   진행한다(Req 9.6, 19.3). 별도의 평점 공개 단계는 없다.
 * - RoundIndicator에 현재/전체 라운드(동적 값)를 표시한다. Requirements 7.3.
 *
 * 레이아웃: PC는 champion | VS | challenger 좌우 배치.
 * Requirements 7.3, 8.1, 8.2, 8.3, 8.4, 9.6, 19.3.
 */
function BattleScreen({
  champion,
  challenger,
  round,
  totalRounds,
  onSelect,
  onQuit,
}: BattleScreenProps) {
  // 선택된 승자 id. 하이라이트 연출 동안 유지되며, 연출 후 onSelect 를 호출한다.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // 대결(챔피언/도전자)이 바뀌면 선택 상태를 초기화한다(다음 라운드 진입 시).
  useEffect(() => {
    setSelectedId(null);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [champion.id, challenger.id]);

  // 언마운트 시 타이머 정리.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handlePick = (id: string) => {
    // 중복 클릭 가드: 이미 선택했으면 무시한다.
    if (selectedId !== null) return;

    // 효과음: 클릭(선택) 즉시 일반 선택음을 재생한다(하이라이트 연출을 기다리지 않는다).
    // 마지막 라운드 선택이라도 여기서는 일반 선택음을 내고, 최종 우승 "두둥"은
    // 우승자 발표(ChampionReveal) 등장 시점에 재생한다.
    playSound('select');

    setSelectedId(id);

    // 하이라이트 연출을 잠시 보여준 뒤 상위로 선택을 전달한다.
    timerRef.current = window.setTimeout(() => {
      onSelect(id);
    }, SELECT_HIGHLIGHT_MS);
  };

  // 선택 상태에 따른 각 카드의 Spotlight 상태.
  const spotlightFor = (id: string): 'on' | 'off' | 'neutral' => {
    if (selectedId === null) return 'neutral';
    return id === selectedId ? 'on' : 'off';
  };

  const hasSelected = selectedId !== null;

  return (
    <section className={styles.stage}>
      <header className={styles.header}>
        {onQuit && (
          <button
            type="button"
            className={styles.quitButton}
            onClick={onQuit}
            disabled={hasSelected}
          >
            ← 메인으로
          </button>
        )}
        <RoundIndicator current={round} total={totalRounds} />
      </header>

      <div className={styles.arena}>
        <div className={styles.side}>
          <RestaurantCard
            restaurant={champion}
            showRating={false}
            spotlight={spotlightFor(champion.id)}
          />
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => handlePick(champion.id)}
            disabled={hasSelected}
          >
            이 식당 선택
          </button>
        </div>

        <div className={styles.versus}>
          <VersusIndicator />
        </div>

        <div className={styles.side}>
          <RestaurantCard
            restaurant={challenger}
            showRating={false}
            spotlight={spotlightFor(challenger.id)}
          />
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => handlePick(challenger.id)}
            disabled={hasSelected}
          >
            이 식당 선택
          </button>
        </div>
      </div>
    </section>
  );
}

export default BattleScreen;
