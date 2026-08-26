import styles from './RoundIndicator.module.css';

interface RoundIndicatorProps {
  current: number;
  total: number;
}

/**
 * 현재 라운드 / 전체 라운드를 표시한다(동적 값).
 * 전체 라운드 수는 `참가 식당 수 - 1`로 계산된 동적 값(1~7)이며,
 * 이 컴포넌트는 하드코딩 없이 전달받은 값을 그대로 표시한다.
 * Requirement 7.3: 전체 라운드 수를 동적 값으로 표시한다.
 *
 * 예: "ROUND 2 / 5"
 */
function RoundIndicator({ current, total }: RoundIndicatorProps) {
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
