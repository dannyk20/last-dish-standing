import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  /** 선택적 로딩 안내 메시지. 없으면 기본 문구를 사용한다. */
  message?: string;
}

/**
 * Google Places API 요청이 진행되는 `loading` 상태에서 표시하는 화면.
 * StartScreen을 대체하여 렌더링되므로 시작 버튼을 다시 누를 수 없다.
 * Requirement 16.1: 로딩 상태를 표시하고 게임 시작 버튼 재입력을 차단한다.
 *
 * 어두운 무대(Stage) 테마를 유지하며, 인디케이터는 "돌아가는 접시" 연출을 사용한다.
 * 접시(플레이트)가 천천히 회전하고 그 위 음식 이모지가 반대로 돌며 항상 정면을 향한다.
 * 전부 2D CSS 애니메이션만 사용한다(WebGL/3D 금지).
 */
function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className={styles.stage} role="status" aria-live="polite">
      <div className={styles.plateWrap} aria-hidden="true">
        <div className={styles.plate}>
          <div className={styles.plateRim} />
          <div className={styles.plateInner} />
          <span className={styles.food} role="img" aria-label="접시">
            🍽
          </span>
        </div>
        <div className={styles.shadow} />
      </div>
      <p className={styles.title}>도전자 소집 중</p>
      <p className={styles.message}>
        {message ?? '조건에 맞는 식당을 찾고 있습니다...'}
      </p>
    </div>
  );
}

export default LoadingScreen;
