import type { Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import styles from './RevivalRound.module.css';

interface RevivalRoundProps {
  /**
   * 탈락한 식당 중 부활 후보(최대 3개, 챔피언 제외).
   * 상위(리듀서)에서 이미 3개 이하로 산출되어 전달되지만, 방어적으로 화면에서도
   * 최대 3개까지만 렌더링한다(Requirement 13.2).
   */
  candidates: Restaurant[];
  /** 후보 하나를 부활시키는 콜백 (Requirement 13.5) */
  onRevive: (id: string) => void;
  /** 부활을 건너뛰는 콜백 (Requirement 13.8) */
  onSkip: () => void;
}

/**
 * REVIVAL ROUND 화면 (Game_Status: revival). 패자부활전.
 *
 * 탈락한 식당 중 최대 3개의 부활 후보를 카드로 표시하고(Requirements 13.3, 13.4),
 * 각 후보에 "부활" 선택 액션을(Requirement 13.5), 하단에 "건너뛰기" 액션을
 * (Requirement 13.8) 제공한다.
 *
 * - 후보는 대결과 동일한 룩을 유지하기 위해 RestaurantCard를 재사용하되,
 *   부활 후보는 아직 평점을 공개하는 단계가 아니므로 showRating={false}로 렌더링한다.
 * - Revival Round는 RED accent를 사용한다(design.md 컬러 시스템: Revival -> RED).
 */
function RevivalRound({ candidates, onRevive, onSkip }: RevivalRoundProps) {
  // 방어: 후보가 3개를 초과해 전달되어도 최대 3개까지만 노출한다(Requirement 13.2).
  const visibleCandidates = candidates.slice(0, 3);

  return (
    <section className={styles.root} aria-label="패자부활전">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Revival Round</p>
        <h1 className={styles.heading}>패자부활전</h1>
        <p className={styles.description}>
          탈락한 식당들에게 마지막 기회를 줍니다. 다시 무대에 세우고 싶은 식당을
          선택하거나, 그대로 건너뛸 수 있습니다.
        </p>
      </header>

      <div className={styles.cards} data-count={visibleCandidates.length}>
        {visibleCandidates.map((restaurant) => (
          <div key={restaurant.id} className={styles.candidate}>
            <RestaurantCard
              restaurant={restaurant}
              showRating={false}
              spotlight="neutral"
            />
            <button
              type="button"
              className={styles.reviveButton}
              onClick={() => onRevive(restaurant.id)}
            >
              부활
            </button>
          </div>
        ))}
      </div>

      <button type="button" className={styles.skipButton} onClick={onSkip}>
        건너뛰기
      </button>
    </section>
  );
}

export default RevivalRound;
