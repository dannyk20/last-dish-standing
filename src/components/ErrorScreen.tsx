import styles from './ErrorScreen.module.css';

interface ErrorScreenProps {
  /** 후보 부족 또는 검색/네트워크 오류를 안내하는 메시지. */
  message: string;
  /** 같은 조건 또는 설정으로 다시 시도(다른 조건 선택 화면으로 복귀). */
  onRetry: () => void;
  /** 선택적: 지역·음식 종류를 초기화하고 새 게임을 시작. */
  onNewGame?: () => void;
}

/**
 * `error` 상태에서 표시하는 화면.
 * 품질 조건을 만족한 식당이 2개 미만이거나 검색/네트워크 오류가 발생했을 때,
 * 대결 진행 식당이 부족하다는 메시지와 다른 조건(지역/음식 종류) 선택 안내를 표시한다.
 * Requirement 16.2: 후보 부족 메시지 + 다른 조건 선택 안내.
 * Requirement 4.3: 후보 2개 미만 시 playing으로 전환하지 않고 안내 메시지를 표시한다.
 *
 * 어두운 무대(Stage) 테마를 유지하며, 오류 강조에 RED accent를 사용한다.
 */
function ErrorScreen({ message, onRetry, onNewGame }: ErrorScreenProps) {
  return (
    <div className={styles.stage} role="alert">
      <div className={styles.icon} aria-hidden="true">
        ⚠
      </div>
      <p className={styles.title}>대결을 시작할 수 없습니다</p>
      <p className={styles.message}>{message}</p>
      <p className={styles.guidance}>
        다른 지역이나 음식 종류를 선택하면 더 많은 식당을 만날 수 있습니다.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          다른 조건으로 다시 시도
        </button>
        {onNewGame ? (
          <button
            type="button"
            className={styles.newGameButton}
            onClick={onNewGame}
          >
            새 게임 시작
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ErrorScreen;
