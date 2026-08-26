import styles from './PriceLevel.module.css';

interface PriceLevelProps {
  priceLevel?: number;
}

// Google Places 가격대는 0~4 범위(0=무료/매우 저렴 ~ 4=매우 비쌈)로 제공된다.
const MAX_PRICE_LEVEL = 4;

/**
 * 식당 가격대를 ₩ 심벌로 표시한다.
 * priceLevel이 undefined이면 "가격 정보 없음"을 표시한다.
 * Requirement 16.5: 식당의 가격대가 없으면 가격 정보 없음을 표시한다.
 */
function PriceLevel({ priceLevel }: PriceLevelProps) {
  if (priceLevel === undefined) {
    return <span className={styles.none}>가격 정보 없음</span>;
  }

  // 표시 최소 1단계 보장(0단계도 최소 하나의 심벌로 인지 가능하게 처리).
  const activeCount = Math.max(1, Math.min(priceLevel, MAX_PRICE_LEVEL));

  const symbols = Array.from({ length: MAX_PRICE_LEVEL }, (_, index) => {
    const isActive = index < activeCount;
    return (
      <span
        key={index}
        className={isActive ? styles.symbolActive : styles.symbolInactive}
        aria-hidden="true"
      >
        ₩
      </span>
    );
  });

  return (
    <span
      className={styles.root}
      aria-label={`가격대 ${activeCount}단계 (최대 ${MAX_PRICE_LEVEL}단계)`}
    >
      {symbols}
    </span>
  );
}

export default PriceLevel;
