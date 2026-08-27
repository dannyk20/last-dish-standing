import styles from './RoundIndicator.module.css';

interface RoundIndicatorProps {
  current: number;
  total: number;
}

/**
 * 현재 라운드 / 전체 라운드를 표시한다(동적 값).
 * 전체 라운드 수는 `참가 식당 수 - 1`(부활 사용 시 +1)로 계산된 동적 값이며,
 * 이 컴포넌트는 하드코딩 없이 전달받은 값을 그대로 표시한다.
 *
 * 단, 현재 라운드가 마지막 라운드(current === total)이면 "FINAL ROUND"로 표시한다.
 * (마지막 대결은 부활 사용 여부와 무관하게 current === total 로 판정된다.)
 * Requirement 7.3: 전체 라운드 수를 동적 값으로 표시한다.
 *
 * 예: "ROUND 2 / 5", 마지막 라운드일 때 "FINAL ROUND"
 */
function RoundIndicator({ current, total }: RoundIndicatorProps) {
  // total 이 유효하고(>0) 현재가 마지막 라운드에 도달하면 최종 라운드로 표시한다.
  const isFinalRound = total > 0 && current >= total;

  if (isFinalRound) {
    return (
      <div className={styles.root} aria-label="마지막 라운드">
        <span className={styles.finalLabel}>FINAL ROUND</span>
      </div>
    );
  }

  return (
    <div
      className={styles.root}
      aria-label={`전체 ${total} 라운드 중 ${current} 라운드`}
    >
      <span className={styles.label}>ROUND</span>
      <span className={styles.current}>{current}</span>
      <span className={styles.separator} aria-hidden="true">
        /
      </span>
      <span className={styles.total}>{total}</span>
    </div>
  );
}

export default RoundIndicator;
