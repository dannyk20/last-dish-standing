// 정규화기 단위 테스트 (normalizePlace)
// _Requirements: 2.2, 2.4_
//
// normalizePlace 의 구체적 필드 매핑과 누락 필드 처리를 검증한다.
// - displayName.text -> name
// - priceLevel 열거형 -> 숫자
// - photos -> photoUrl (photo name 포함)
// - reviews 매핑 (text / rating / authorName)
// - googleMapsUri -> googleMapsUrl
// - 누락 필드는 undefined 또는 빈 배열, 임의 값 생성 금지
// - raw 와 details 가 모두 있으면 details 우선
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizePlace } from './normalizer';
import type { RawPlace, RawPlaceDetails } from './placesService';

// buildPhotoUrl 은 VITE_GOOGLE_MAPS_API_KEY 환경 변수에 의존한다.
// 테스트에서 안정적인 결과를 얻기 위해 고정 키를 주입한다.
const TEST_API_KEY = 'TEST_API_KEY';

beforeEach(() => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', TEST_API_KEY);
});

/** 완전한 필드를 가진 RawPlace 예시. */
function fullRawPlace(): RawPlace {
  return {
    id: 'place-1',
    displayName: { text: '성수 파스타집', languageCode: 'ko' },
    primaryType: 'italian_restaurant',
    types: ['italian_restaurant', 'restaurant'],
    formattedAddress: '서울 성동구 성수동 1가',
    photos: [{ name: 'places/place-1/photos/PHOTO_REF_A', widthPx: 1200, heightPx: 800 }],
    priceLevel: 'PRICE_LEVEL_MODERATE',
    rating: 4.3,
    userRatingCount: 512,
    reviews: [
      {
        rating: 5,
        text: { text: '분위기가 정말 좋아요', languageCode: 'ko' },
        authorAttribution: { displayName: '김리뷰' },
      },
    ],
    googleMapsUri: 'https://maps.google.com/?cid=123',
  };
}

describe('normalizePlace - 구체적 필드 매핑', () => {
  it('displayName.text 를 name 으로 매핑한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.name).toBe('성수 파스타집');
  });

  it('id 를 그대로 보존한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.id).toBe('place-1');
  });

  it('priceLevel 열거형을 숫자로 매핑한다 (MODERATE -> 2)', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.priceLevel).toBe(2);
  });

  it('priceLevel 열거형 전체를 0..4 로 매핑한다', () => {
    const cases: Array<[RawPlace['priceLevel'], number]> = [
      ['PRICE_LEVEL_FREE', 0],
      ['PRICE_LEVEL_INEXPENSIVE', 1],
      ['PRICE_LEVEL_MODERATE', 2],
      ['PRICE_LEVEL_EXPENSIVE', 3],
      ['PRICE_LEVEL_VERY_EXPENSIVE', 4],
    ];
    for (const [enumValue, expected] of cases) {
      const raw = { ...fullRawPlace(), priceLevel: enumValue };
      expect(normalizePlace(raw).priceLevel).toBe(expected);
    }
  });

  it('photos 로부터 photoUrl 을 만들며 photo name 을 포함한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.photoUrl).toBeDefined();
    expect(result.photoUrl).toContain('places/place-1/photos/PHOTO_REF_A');
    expect(result.photoUrl).toContain(TEST_API_KEY);
  });

  it('reviews 를 text/rating/authorName 을 포함해 매핑한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0]).toEqual({
      text: '분위기가 정말 좋아요',
      rating: 5,
      authorName: '김리뷰',
    });
  });

  it('googleMapsUri 를 googleMapsUrl 로 매핑한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.googleMapsUrl).toBe('https://maps.google.com/?cid=123');
  });

  it('rating / userRatingCount / address 를 매핑한다', () => {
    const result = normalizePlace(fullRawPlace());
    expect(result.rating).toBe(4.3);
    expect(result.userRatingCount).toBe(512);
    expect(result.address).toBe('서울 성동구 성수동 1가');
  });

  it('category 를 primaryType 으로부터 읽기 쉽게 매핑한다', () => {
    const result = normalizePlace(fullRawPlace());
    // snake_case 가 공백으로 정리된다.
    expect(result.category).toBe('italian restaurant');
  });

  it('survivalTitle / survivalSummary 는 생성하지 않는다', () => {
    const result = normalizePlace(fullRawPlace());
    expect('survivalTitle' in result).toBe(false);
    expect('survivalSummary' in result).toBe(false);
  });
});

describe('normalizePlace - 누락 필드 처리 (임의 값 생성 금지)', () => {
  it('사진이 없으면 photoUrl 은 undefined', () => {
    const raw: RawPlace = { id: 'p', displayName: { text: 'A' } };
    const result = normalizePlace(raw);
    expect(result.photoUrl).toBeUndefined();
  });

  it('reviews 가 없으면 빈 배열', () => {
    const raw: RawPlace = { id: 'p', displayName: { text: 'A' } };
    const result = normalizePlace(raw);
    expect(result.reviews).toEqual([]);
  });

  it('priceLevel 이 없으면 undefined', () => {
    const raw: RawPlace = { id: 'p', displayName: { text: 'A' } };
    const result = normalizePlace(raw);
    expect(result.priceLevel).toBeUndefined();
  });

  it('PRICE_LEVEL_UNSPECIFIED 는 정보 없음(undefined)으로 처리한다', () => {
    const raw: RawPlace = {
      id: 'p',
      displayName: { text: 'A' },
      priceLevel: 'PRICE_LEVEL_UNSPECIFIED',
    };
    const result = normalizePlace(raw);
    expect(result.priceLevel).toBeUndefined();
  });

  it('rating 이 없으면 undefined', () => {
    const raw: RawPlace = { id: 'p', displayName: { text: 'A' } };
    const result = normalizePlace(raw);
    expect(result.rating).toBeUndefined();
  });

  it('텍스트가 없는 리뷰는 결과에서 제외한다', () => {
    const raw: RawPlace = {
      id: 'p',
      displayName: { text: 'A' },
      reviews: [
        { rating: 4 }, // 텍스트 없음 -> 제외
        { text: { text: '맛있어요' }, rating: 5 }, // 유지
      ],
    };
    const result = normalizePlace(raw);
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].text).toBe('맛있어요');
  });

  it('리뷰에 rating/authorName 이 없으면 해당 필드를 생성하지 않는다', () => {
    const raw: RawPlace = {
      id: 'p',
      displayName: { text: 'A' },
      reviews: [{ text: { text: '조용한 곳' } }],
    };
    const result = normalizePlace(raw);
    expect(result.reviews[0]).toEqual({ text: '조용한 곳' });
    expect('rating' in result.reviews[0]).toBe(false);
    expect('authorName' in result.reviews[0]).toBe(false);
  });

  it('displayName 이 없으면 name 은 빈 문자열', () => {
    const raw: RawPlace = { id: 'p' };
    const result = normalizePlace(raw);
    expect(result.name).toBe('');
  });

  it('category 정보가 없으면 undefined', () => {
    const raw: RawPlace = { id: 'p', displayName: { text: 'A' } };
    const result = normalizePlace(raw);
    expect(result.category).toBeUndefined();
  });

  it('API 키가 없으면 사진이 있어도 photoUrl 은 undefined', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    const raw: RawPlace = {
      id: 'p',
      displayName: { text: 'A' },
      photos: [{ name: 'places/p/photos/REF' }],
    };
    const result = normalizePlace(raw);
    expect(result.photoUrl).toBeUndefined();
  });
});

describe('normalizePlace - details 우선 규칙', () => {
  it('raw 와 details 가 모두 있으면 각 필드에서 details 를 우선한다', () => {
    const raw: RawPlace = {
      id: 'raw-id',
      displayName: { text: 'RAW 이름' },
      rating: 3.0,
      priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
      formattedAddress: 'RAW 주소',
      userRatingCount: 10,
      googleMapsUri: 'https://maps.google.com/raw',
    };
    const details: RawPlaceDetails = {
      id: 'details-id',
      displayName: { text: 'DETAILS 이름' },
      rating: 4.8,
      priceLevel: 'PRICE_LEVEL_EXPENSIVE',
      formattedAddress: 'DETAILS 주소',
      userRatingCount: 999,
      googleMapsUri: 'https://maps.google.com/details',
    };

    const result = normalizePlace(raw, details);

    expect(result.id).toBe('details-id');
    expect(result.name).toBe('DETAILS 이름');
    expect(result.rating).toBe(4.8);
    expect(result.priceLevel).toBe(3); // EXPENSIVE -> 3
    expect(result.address).toBe('DETAILS 주소');
    expect(result.userRatingCount).toBe(999);
    expect(result.googleMapsUrl).toBe('https://maps.google.com/details');
  });

  it('details 에 특정 필드가 없으면 raw 값으로 대체(fallback)한다', () => {
    const raw: RawPlace = {
      id: 'raw-id',
      displayName: { text: 'RAW 이름' },
      rating: 3.7,
      reviews: [{ text: { text: 'RAW 리뷰' } }],
    };
    // details 에는 rating/reviews 가 없다.
    const details: RawPlaceDetails = {
      id: 'raw-id',
      displayName: { text: 'DETAILS 이름' },
    };

    const result = normalizePlace(raw, details);

    expect(result.name).toBe('DETAILS 이름'); // details 우선
    expect(result.rating).toBe(3.7); // details 없음 -> raw
    expect(result.reviews).toHaveLength(1); // details 없음 -> raw
    expect(result.reviews[0].text).toBe('RAW 리뷰');
  });
});
