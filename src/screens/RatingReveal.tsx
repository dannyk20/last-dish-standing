import type { Restaurant, RatingComparison } from '../types';
import { compareRatings } from '../game/rules';
import RestaurantCard from '../components/RestaurantCard';
import styles from './RatingReveal.module.css';

interface RatingRevealProps {
  /** 사용자가 선택하여 승자가 된 식당 */
  chosen: Restaurant;
  /** 대결에 참여한 다른(탈락한) 식당 */
  other: Restaurant;
  /**
   * 평점 비교 결과. 전달되지 않으면 compareRatings(chosen, other)로 계산한다.
   * 승패에는 영향을 주지 않는다(Requirement 10.6).
   */
  comparison?: RatingComparison;
  /** 다음 대결로 이동하는 CTA 콜백 (Requirement 10.6) */
  onNext: () => void;
  /** 게임을 중단하고 시작 화면(setup)으로 돌아간다. */
  onQuit?: () => void;
}

interface ComparisonMessage {
  title: string;
  body: string;
  muted: boolean;
}

/**
 * comparison.kind별 4종 메시지 (Requirements 10.2~10.5).
 * - higher : 대중적 평가와 사용자의 선택이 일치
 * - lower  : 평점보다 사용자의 취향이 선택 식당
 * - equal  : 평점은 같지만 사용자의 선택은 해당 식당
 * - insufficient : 평점 비교 정보 부족, 선택 기준으로 결과 유지
 */
function getComparisonMessage(
  comparison: RatingComparison,
  chosen: Restaurant,
): ComparisonMessage {
  switch (comparison.kind) {
    case 'higher':
      return {
        title: '대중의 선택과 일치했습니다',
        body: `${chosen.name}의 평점이 상대보다 높습니다. 대중적 평가와 사용자의 선택이 일치했습니다.`,
        muted: false,
      };
    case 'lower':
      return {
        title: '평점보다 나의 취향',
        body: `평점은 상대 식당이 더 높지만, 사용자의 취향은 ${chosen.name}이었습니다.`,
        muted: false,
      };
    case 'equal':
      return {
        title: '같은 평점, 나의 선택',
        body: `두 식당의 평점은 같지만, 사용자의 선택은 ${chosen.name}이었습니다.`,
        muted: false,
      };
    case 'insufficient':
    default:
      return {
        title: '평점 비교 정보가 부족합니다',
        body: '두 식당 중 하나 이상의 평점 정보가 없어 비교할 수 없습니다. 사용자의 선택을 기준으로 대결 결과를 유지합니다.',
        muted: true,
      };
  }
}

/**
 * RATING REVEAL 화면 (Game_Status: ratingReveal).
 *
 * 사용자가 선택한 이후 두 식당의 실제 평점과 리뷰 수를 동시에 공개하고
 * (Requirement 10.1), 평점 비교 결과에 따른 4종 메시지를 표시하며
 * (Requirements 10.2~10.5), 다음 대결로 이동하는 CTA를 제공한다(Requirement 10.6).
 *
 * - RestaurantCard를 showRating={true}로 재사용하여 평점·리뷰 수를 공개한다(Req 10.1).
 *   평점이 없는 경우 카드가 "평점 정보 없음"을 표시한다(Req 16.6).
 * - 선택 식당(chosen)에는 Spotlight 'on', 상대 식당(other)에는 'off'를 적용한다.
 * - comparison이 전달되지 않으면 compareRatings로 계산한다(승패에 영향 없음).
 */
function RatingReveal({
  chosen,
  other,
  comparison,
  onNext,
  onQuit,
}: RatingRevealProps) {
  const resolvedComparison = comparison ?? compareRatings(chosen, other);
  const message = getComparisonMessage(resolvedComparison, chosen);

  return (
    <section className={styles.root} aria-label="평점 공개">
      <div className={styles.topBar}>
        {onQuit && (
          <button type="button" className={styles.quitButton} onClick={onQuit}>
            ← 메인으로
          </button>
        )}
        <h1 className={styles.heading}>Rating Reveal</h1>
      </div>

      <div className={styles.cards}>
        <RestaurantCard restaurant={chosen} showRating spotlight="on" />
        <RestaurantCard restaurant={other} showRating spotlight="off" />
      </div>

      <div
        className={`${styles.message} ${message.muted ? styles.messageMuted : ''}`}
        role="status"
      >
        <p className={styles.messageTitle}>{message.title}</p>
        <p className={styles.messageBody}>{message.body}</p>
      </div>

      <button type="button" className={styles.nextButton} onClick={onNext}>
        다음 대결
      </button>
    </section>
  );
}

export default RatingReveal;
