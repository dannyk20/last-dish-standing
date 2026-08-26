// Google Places API (New) 서비스
// 설계 문서 "Google Places 서비스 인터페이스" 섹션 기준
//
// - Text Search: POST https://places.googleapis.com/v1/places:searchText
// - Place Details: GET  https://places.googleapis.com/v1/places/{placeId}
// - 필드 마스킹: X-Goog-FieldMask 헤더로 화면·게임 로직에 필요한 필드만 요청한다.
// - API Key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY (하드코딩 금지)
//
// 화면·로직에서 사용하는 필드:
//   식당명(displayName), 카테고리(types), 주소(formattedAddress), 대표 사진(photos),
//   가격대(priceLevel), 평점(rating), 리뷰 수(userRatingCount), 리뷰(reviews),
//   Google Maps 링크(googleMapsUri). place id(id)는 식별자로 항상 필요하다.
//
// RawPlace / RawPlaceDetails 는 Places API (New) 응답의 원본 형태를 표현한다.
// 이 타입들은 정규화기(normalizer, task 5.2)에서 Restaurant 로 변환된다.
// API 응답의 필드는 누락될 수 있으므로 대부분 optional 로 선언한다.

// ---------------------------------------------------------------------------
// Raw API shapes (Places API New)
// ---------------------------------------------------------------------------

/** 지역화된 텍스트 (예: displayName, review text) */
export interface RawLocalizedText {
  text?: string;
  languageCode?: string;
}

/** 사진 리소스. name 은 "places/{placeId}/photos/{photoRef}" 형태이다. */
export interface RawPhoto {
  name?: string;
  widthPx?: number;
  heightPx?: number;
}

/** 리뷰 작성자 정보 */
export interface RawAuthorAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

/** 리뷰 리소스 */
export interface RawReview {
  name?: string;
  rating?: number;
  text?: RawLocalizedText;
  originalText?: RawLocalizedText;
  authorAttribution?: RawAuthorAttribution;
  relativePublishTimeDescription?: string;
}

/**
 * priceLevel 은 New API 에서 열거형 문자열로 반환된다.
 * 정규화기에서 숫자 등으로 변환하며, 여기서는 원본 문자열을 그대로 보존한다.
 */
export type RawPriceLevel =
  | 'PRICE_LEVEL_UNSPECIFIED'
  | 'PRICE_LEVEL_FREE'
  | 'PRICE_LEVEL_INEXPENSIVE'
  | 'PRICE_LEVEL_MODERATE'
  | 'PRICE_LEVEL_EXPENSIVE'
  | 'PRICE_LEVEL_VERY_EXPENSIVE';

/**
 * Text Search 결과의 개별 place. 화면·로직에 필요한 필드만 포함한다.
 * Field Mask 로 요청하므로 실제 응답에는 요청한 필드만 존재하며,
 * 데이터가 없으면 필드 자체가 생략될 수 있다.
 */
export interface RawPlace {
  id: string;
  displayName?: RawLocalizedText;
  types?: string[];
  primaryType?: string;
  formattedAddress?: string;
  photos?: RawPhoto[];
  priceLevel?: RawPriceLevel;
  rating?: number;
  userRatingCount?: number;
  reviews?: RawReview[];
  googleMapsUri?: string;
}

/**
 * Place Details 응답. Text Search 로 부족한 필드(리뷰/사진 등)를
 * 필요한 경우에만 보강하기 위한 형태이며 RawPlace 와 동일한 필드 셋을 가진다.
 */
export type RawPlaceDetails = RawPlace;

/** Text Search 응답 래퍼 */
interface SearchTextResponse {
  places?: RawPlace[];
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface PlacesSearchParams {
  region: string; // 지역(직접 입력 또는 프리셋)
  foodType: string; // 음식 종류
}

export interface PlacesService {
  // Text Search: 지역 + 음식 종류로 후보 목록 확보
  searchRestaurants(params: PlacesSearchParams): Promise<RawPlace[]>;
  // Place Details: 리뷰/사진 등 부족한 필드를 필요한 경우에만 보강
  getDetails(placeId: string): Promise<RawPlaceDetails>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACES_BASE_URL = 'https://places.googleapis.com/v1';
const SEARCH_TEXT_URL = `${PLACES_BASE_URL}/places:searchText`;

// Field Mask: 화면·게임 로직에서 사용하는 필드만 지정한다.
// Text Search 는 응답이 places 배열로 감싸지므로 "places." 접두사를 붙인다.
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.types',
  'places.primaryType',
  'places.formattedAddress',
  'places.photos',
  'places.priceLevel',
  'places.rating',
  'places.userRatingCount',
  'places.reviews',
  'places.googleMapsUri',
].join(',');

// Place Details 는 단일 place 를 반환하므로 접두사 없이 필드명을 지정한다.
const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'types',
  'primaryType',
  'formattedAddress',
  'photos',
  'priceLevel',
  'rating',
  'userRatingCount',
  'reviews',
  'googleMapsUri',
].join(',');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      'VITE_GOOGLE_MAPS_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.',
    );
  }
  return key;
}

/** 응답이 실패면 상세 메시지를 담아 throw 한다. */
async function ensureOk(res: Response, context: string): Promise<void> {
  if (res.ok) return;
  let detail = '';
  try {
    detail = await res.text();
  } catch {
    // 본문 읽기 실패는 무시하고 상태 코드만 사용한다.
  }
  throw new Error(
    `Google Places ${context} 요청 실패 (HTTP ${res.status} ${res.statusText})` +
      (detail ? `: ${detail}` : ''),
  );
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Text Search 로 지역 + 음식 종류에 해당하는 식당 후보 목록을 확보한다.
 * Field Mask 로 화면·로직에 필요한 필드만 요청한다.
 */
async function searchRestaurants(
  params: PlacesSearchParams,
): Promise<RawPlace[]> {
  const apiKey = getApiKey();
  const textQuery = `${params.region} ${params.foodType} 맛집`.trim();

  let res: Response;
  try {
    res = await fetch(SEARCH_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'ko',
        regionCode: 'KR',
      }),
    });
  } catch (err) {
    throw new Error(
      `Google Places Text Search 네트워크 오류: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  await ensureOk(res, 'Text Search');

  const data = (await res.json()) as SearchTextResponse;
  return data.places ?? [];
}

/**
 * Place Details 로 특정 place 의 부족한 필드(리뷰/사진 등)를 보강한다.
 * 매 라운드 호출이 아니라 필요한 경우에만 호출하도록 상위 계층에서 제어한다.
 */
async function getDetails(placeId: string): Promise<RawPlaceDetails> {
  const apiKey = getApiKey();
  const url = `${PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    });
  } catch (err) {
    throw new Error(
      `Google Places Place Details 네트워크 오류: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  await ensureOk(res, 'Place Details');

  return (await res.json()) as RawPlaceDetails;
}

export const placesService: PlacesService = {
  searchRestaurants,
  getDetails,
};

export default placesService;
