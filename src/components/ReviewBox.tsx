import type { RestaurantReview } from '../types';
import styles from './ReviewBox.module.css';

interface ReviewBoxProps {
  review?: RestaurantReview;
}

/**
 * 식당의 대표 리뷰를 표시한다.
 * 리뷰가 없으면 "표시할 수 있는 리뷰가 없습니다" 안내를 표시한다.
 * Requirement 16.4: 식당의 리뷰가 없으면 표시할 수 있는 리뷰가 없다는 안내를 표시한다.
 */
function ReviewBox({ review }: ReviewBoxProps) {
  if (!review || review.text.trim() === '') {
    return <div className={styles.empty}>표시할 수 있는 리뷰가 없습니다</div>;
  }

  return (
    <blockquote className={styles.root}>
      <p className={styles.text}>{review.text}</p>
      {review.authorName && (
        <cite className={styles.author}>— {review.authorName}</cite>
      )}
    </blockquote>
  );
}

export default ReviewBox;
