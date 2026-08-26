// 정규화기 (normalizer)
// 설계 문서 "정규화기(normalizer)" 섹션 기준
//
// RawPlace / RawPlaceDetails (Places API New 응답) 를 게임용 Restaurant 로 변환한다.
//
// 원칙 (Requirements 2.2, 2.4):
// - 화면·게임 로직에서 사용하는 필드만 매핑한다.
// - 사진·리뷰·가격대·평점 등은 누락될 수 있으므로 optional 로 매핑한다.
// - Google Places API 가 제공하지 않는 실제 식당 정보는 생성하지 않는다.
//   (누락 필드는 undefined 로 두거나 빈 배열로 처리하고, 임의의 값을 지어내지 않는다.)
// - Google Places API 를 통해 제공받은 리뷰만 사용한다.
//
// survivalTitle / survivalSummary 는 규칙 기반 생성기(Rule_Based_Generator)가
// 별도로 채우므로 여기서는 생성하지 않는다. 반환 타입에서 두 필드를 제외한다.

import type {
  RawPlace,
  RawPlaceDetails,
  RawPriceLevel,
  RawReview,
} from './placesService';
import type { Restaurant, RestaurantReview } from '../types';

/** normalizePlace 의 반환 타입: survivalTitle/survivalSummary 는 이후 단계에서 채운다. */
export type NormalizedRestaurant = Omit<
  Restaurant,
  'survivalTitle' | 'survivalSummary'
>;

/**
 * RawPriceLevel(열거형 문자열) 을 0..4 숫자로 변환한다.
 * UNSPECIFIED 또는 값이 없으면 undefined 를 반환한다(정보 없음).
 */
function mapPriceLevel(priceLevel?: RawPriceLevel): number | undefined {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return 0;
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    // 'PRICE_LEVEL_UNSPECIFIED' 및 undefined 는 정보 없음으로 처리한다.
    default:
      return undefined;
  }
}

/**
 * types/primaryType 에서 사람이 읽을 수 있는 카테고리를 하나 고른다.
 * 값이 전혀 없으면 undefined(정보 없음). API 가 제공한 값만 사용하며 지어내지 않는다.
 */
function mapCategory(
  primaryType?: string,
  types?: string[],
): string | undefined {
  const raw = primaryType ?? types?.find((t) => t.length > 0);
  if (!raw) return undefined;
  // Places 의 타입은 "korean_restaurant" 같은 snake_case 이므로 읽기 쉽게 정리한다.
  const cleaned = raw
    .replace(/_/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/** 갤러리에서 표시할 사진 최대 장수. */
const MAX_PHOTOS = 5;

/**
 * 단일 photo.name 으로 Places Photo media URL 을 만든다.
 * API 키가 없으면 undefined.
 * 참조: https://places.googleapis.com/v1/{photo.name}/media?maxWidthPx=...&key=...
 */
function photoMediaUrl(name: string, apiKey: string): string {
  const maxWidthPx = 800;
  return (
    `https://places.googleapis.com/v1/${name}/media` +
    `?maxWidthPx=${maxWidthPx}&key=${apiKey}`
  );
}

/**
 * photos 배열로부터 최대 MAX_PHOTOS(5)장의 Places Photo media URL 목록을 만든다.
 * 사진이 없거나 API 키가 없으면 빈 배열(정보 없음)을 반환한다.
 * 존재하는 사진만 사용하며 임의로 지어내지 않는다.
 */
function buildPhotoUrls(photos?: RawPlace['photos']): string[] {
  if (!photos || photos.length === 0) return [];

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const urls: string[] = [];
  for (const photo of photos) {
    if (urls.length >= MAX_PHOTOS) break;
    const name = photo?.name;
    if (!name) continue;
    urls.push(photoMediaUrl(name, apiKey));
  }
  return urls;
}

/**
 * RawReview[] 를 RestaurantReview[] 로 변환한다.
 * 텍스트가 없는 리뷰는 제외한다(표시할 내용이 없으므로).
 * 리뷰가 전혀 없으면 빈 배열을 반환한다.
 */
function mapReviews(reviews?: RawReview[]): RestaurantReview[] {
  if (!reviews || reviews.length === 0) return [];

  const result: RestaurantReview[] = [];
  for (const raw of reviews) {
    const text = raw.text?.text;
    if (!text) continue; // API 가 텍스트를 제공하지 않은 리뷰는 사용하지 않는다.

    const review: RestaurantReview = { text };
    if (raw.rating !== undefined) review.rating = raw.rating;
    const authorName = raw.authorAttribution?.displayName;
    if (authorName) review.authorName = authorName;

    result.push(review);
  }
  return result;
}

/**
 * 두 원본(raw, details) 중 값이 존재하는 것을 고른다.
 * 둘 다 존재하면 details 를 우선한다(더 완전한 상세 응답).
 */
function pick<T>(rawValue: T | undefined, detailsValue: T | undefined): T | undefined {
  return detailsValue !== undefined ? detailsValue : rawValue;
}

/**
 * RawPlace(및 선택적 RawPlaceDetails) 를 Restaurant(별명/소개 제외) 로 변환한다.
 * 두 원본이 모두 있으면 각 필드에서 details 를 우선한다.
 * API 가 제공하지 않는 정보는 생성하지 않는다.
 */
export function normalizePlace(
  raw: RawPlace,
  details?: RawPlaceDetails,
): NormalizedRestaurant {
  // id 는 항상 raw 에서 온다(식별자). details 에 있으면 그것을 우선한다.
  const id = details?.id ?? raw.id;

  const displayName = pick(raw.displayName?.text, details?.displayName?.text);
  const name = displayName ?? '';

  const category = mapCategory(
    pick(raw.primaryType, details?.primaryType),
    pick(raw.types, details?.types),
  );

  const address = pick(raw.formattedAddress, details?.formattedAddress);

  const photoUrls = buildPhotoUrls(pick(raw.photos, details?.photos));
  // 대표 사진은 갤러리의 첫 장으로 유지한다(하위 호환/단일 표시용).
  const photoUrl = photoUrls[0];

  const priceLevel = mapPriceLevel(pick(raw.priceLevel, details?.priceLevel));

  const rating = pick(raw.rating, details?.rating);

  const userRatingCount = pick(raw.userRatingCount, details?.userRatingCount);

  const reviews = mapReviews(pick(raw.reviews, details?.reviews));

  const googleMapsUrl = pick(raw.googleMapsUri, details?.googleMapsUri);

  const restaurant: NormalizedRestaurant = {
    id,
    name,
    reviews,
  };

  // 누락 가능한 필드는 값이 있을 때만 설정한다(API 미제공 정보를 지어내지 않는다).
  if (category !== undefined) restaurant.category = category;
  if (address !== undefined) restaurant.address = address;
  if (photoUrl !== undefined) restaurant.photoUrl = photoUrl;
  if (photoUrls.length > 0) restaurant.photoUrls = photoUrls;
  if (priceLevel !== undefined) restaurant.priceLevel = priceLevel;
  if (rating !== undefined) restaurant.rating = rating;
  if (userRatingCount !== undefined) restaurant.userRatingCount = userRatingCount;
  if (googleMapsUrl !== undefined) restaurant.googleMapsUrl = googleMapsUrl;

  return restaurant;
}

export default normalizePlace;
