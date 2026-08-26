import styles from './VersusIndicator.module.css';

/**
 * 두 식당 대결 사이 중앙에 표시하는 "VS" 배지.
 * VS/Battle 의미에 따라 RED(var(--color-red))로 강조한다.
 * Requirement 19.2: RED는 VS/Battle에 사용한다.
 */
function VersusIndicator() {
  return (
    <div className={styles.root} role="img" aria-label="VS (대결)">
      <span className={styles.text} aria-hidden="true">
        VS
      </span>
    </div>
  );
}

export default VersusIndicator;
