import styles from './PriceLevel.module.css';

interface PriceLevelProps {
  priceLevel?: number;
}

// Google Places 가격대는 0~4 범위(0=무료/매우 저렴 ~ 4=매우 비쌈)로 제공된다.
const MAX_PRICE_LEVEL = 4;

/**
 * 가격대 단계별 1인 기준 대략적 금액 범위(원화). Google Places 가 절대 금액을
 * 제공하지 않으므로, 단계에 대응하는 "대략적인" 안내 문구로만 표시한다.
 * (실제 가격이 아니라 참고용 범위임을 문구로 명확히 한다.)
 */
const PRICE_RANGE_HINT: Record<number, string> = {
  0: '무료 또는 매우 저렴',
  1: '약 1만 원 이하',
  2: '약 1만~3만 원',
  3: '약 3만~6만 원',
  4: '약 6만 원 이상',
};

/**
 * 식당 가격대를 ₩ 심벌로 표시한다.
 * priceLevel이 undefined이면 "가격 정보 없음"을 표시한다.
 * 심벌 영역에 마우스를 올리면(hover/focus) 해당 단계의 대략적 금액 범위를
 * 툴팁으로 안내한다(1인 기준, 참고용).
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

  const rangeHint =
    PRICE_RANGE_HINT[priceLevel] ?? PRICE_RANGE_HINT[activeCount];
  const tooltipText = `1인 기준 ${rangeHint} (참고용)`;

  return (
    <span
      className={styles.root}
      tabIndex={0}
      // 네이티브 툴팁(접근성/키보드 폴백) + 커스텀 시각 툴팁 병행.
      title={tooltipText}
      aria-label={`가격대 ${activeCount}단계 (최대 ${MAX_PRICE_LEVEL}단계). ${tooltipText}`}
    >
      {symbols}
      <span className={styles.tooltip} role="tooltip">
        {tooltipText}
      </span>
    </span>
  );
}

export default PriceLevel;
