import type { Restaurant } from '../types';
import PhotoWithFallback from './PhotoWithFallback';
import PriceLevel from './PriceLevel';
import ReviewBox from './ReviewBox';
import Spotlight from './Spotlight';
import styles from './RestaurantCard.module.css';

type SpotlightState = 'on' | 'off' | 'neutral';

interface RestaurantCardProps {
  restaurant: Restaurant;
  showRating: boolean;
  spotlight?: SpotlightState;
  /** 사진 하단 썸네일 미리보기 표시 여부(기본 true). false면 내부 슬라이드만 남긴다. */
  showPhotoThumbnails?: boolean;
}

/**
 * 서바이벌 참가자 카드.
 * 별명(survivalTitle), 대표 사진, 식당명, 카테고리·지역, 가격대, 한 줄 소개(survivalSummary),
 * 대표 리뷰(reviews[0])를 표시한다.
 *
 * 평점 영역은 `showRating`이 true일 때만 조건부로 **렌더링**한다.
 * CSS로 숨기지 않고 아예 렌더링하지 않는다(설계 "선택 전 평점 미렌더링").
 * - `playing` 상태에서는 showRating=false → 평점 컴포넌트 자체가 렌더링되지 않는다.
 * - `ratingReveal` 상태에서만 showRating=true가 된다.
 * - 평점이 없으면(rating === undefined) "평점 정보 없음"을 표시한다(Requirement 16.6).
 *
 * Requirements 8.1, 8.2, 8.3, 16.6.
 */
function RestaurantCard({
  restaurant,
  showRating,
  spotlight = 'neutral',
  showPhotoThumbnails = true,
}: RestaurantCardProps) {
  const {
    name,
    category,
    address,
    photoUrl,
    photoUrls,
    priceLevel,
    survivalTitle,
    survivalSummary,
    reviews,
    rating,
    userRatingCount,
  } = restaurant;

  // 대표 리뷰: 제공된 리뷰 중 첫 번째만 사용한다(API 미제공 정보 생성 금지).
  const representativeReview = reviews.length > 0 ? reviews[0] : undefined;

  return (
    <Spotlight state={spotlight}>
      <article className={styles.card}>
        <p className={styles.survivalTitle}>{survivalTitle}</p>

        <div className={styles.photo}>
          <PhotoWithFallback
            photoUrl={photoUrl}
            photoUrls={photoUrls}
            alt={`${name} 대표 이미지`}
            showThumbnails={showPhotoThumbnails}
          />
        </div>

        <div className={styles.body}>
          <h2 className={styles.name}>{name}</h2>

          <div className={styles.meta}>
            {category && <span className={styles.category}>{category}</span>}
            {address && <span className={styles.address}>{address}</span>}
          </div>

          <div className={styles.price}>
            <PriceLevel priceLevel={priceLevel} />
          </div>

          <p className={styles.summary}>{survivalSummary}</p>

          <div className={styles.review}>
            <ReviewBox review={representativeReview} />
          </div>

          {/*
            평점 영역: showRating이 true일 때만 조건부로 렌더링한다.
            showRating이 false이면 이 블록은 DOM에 존재하지 않는다(CSS 숨김 아님).
          */}
          {showRating && (
            <div className={styles.rating} data-testid="rating-area">
              {rating === undefined ? (
                <span className={styles.ratingNone}>평점 정보 없음</span>
              ) : (
                <>
                  <span className={styles.ratingValue}>★ {rating.toFixed(1)}</span>
                  {userRatingCount !== undefined && (
                    <span className={styles.ratingCount}>
                      리뷰 {userRatingCount.toLocaleString()}개
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </article>
    </Spotlight>
  );
}

export default RestaurantCard;
