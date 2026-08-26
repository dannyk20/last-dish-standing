import type { ReactNode } from 'react';
import styles from './Spotlight.module.css';

type SpotlightState = 'on' | 'off' | 'neutral';

interface SpotlightProps {
  state: SpotlightState;
  children?: ReactNode;
  /** 'on' 상태에서 카드 위에 표시할 배지 문구. 기본값 'SELECTED'. */
  badgeLabel?: string;
}

const stateClassName: Record<SpotlightState, string> = {
  on: styles.on,
  off: styles.off,
  neutral: styles.neutral,
};

/**
 * "이 식당이 선택됐다"를 강조하는 래퍼.
 * - 'on'      : 선택(승자) 강조. Gold Glow/Border + 테두리를 훑는 라이트 스윕 +
 *               카드 전체 펄스 + 'SELECTED' 배지 스탬프.
 * - 'off'     : 미선택(패자). 어둡게/채도 감소(Gray 계열)로 뒤로 물러난다.
 * - 'neutral' : 기본 상태(강조 없음).
 *
 * 시각 상태(on/off/neutral)를 CSS 클래스로 설정한다.
 * 모든 연출은 2D CSS(gradient/box-shadow/filter/opacity/transform 2D)만 사용하며
 * WebGL/3D 변환은 사용하지 않는다(Requirement 19.5). 등장/전환은 200~600ms 범위의
 * CSS transition/animation을 쓰고, prefers-reduced-motion 시 애니메이션을
 * 비활성화하고 최종 상태만 표시한다.
 * Requirements 19.2(GOLD=Winner, GRAY=미선택), 19.3(선택 시 승자 ON/패자 OFF),
 * 19.4(공용 컴포넌트 Spotlight), 19.5(2D CSS만, WebGL/3D 금지).
 */
function Spotlight({ state, children, badgeLabel = 'SELECTED' }: SpotlightProps) {
  return (
    <div
      className={`${styles.root} ${stateClassName[state]}`}
      data-spotlight={state}
    >
      {/* 테두리를 훑고 지나가는 골드 라이트 스윕(회전 conic 보더). on 상태에서만 보인다. */}
      <span className={styles.frame} aria-hidden="true" />
      {children}
      {state === 'on' && (
        <span className={styles.badge} aria-hidden="true">
          {badgeLabel}
        </span>
      )}
    </div>
  );
}

export default Spotlight;
