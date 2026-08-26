// Feature: last-dish-standing, Property 5: 별명 길이는 6~18자 범위
//
// Property 5: 모든 별명 생성 입력에 대해, 생성된 survivalTitle의 길이는
// 6자 이상 18자 이하이다(정보가 부족한 경우의 fallback 포함).
//
// 추가로, 정보가 전혀 없는 빈 입력에서는 설계 문서의 fallback
// (별명 "오늘의 도전자", 한 줄 소개 "현재 검색 조건에 맞는 식당 후보입니다.")을
// 사용함을 단위 테스트로 검증한다.
//
// Validates: Requirements 5.3, 5.5

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateSurvivalText, type GeneratorInput } from './generator';
import type { RestaurantReview } from '../types';

const TITLE_MIN = 6;
const TITLE_MAX = 18;

// 카테고리 후보: 실제 서비스에서 사용하는 음식 종류 + 빈/공백 케이스.
const categoryArb = fc.option(
  fc.oneof(
    fc.constantFrom('한식', '일식', '중식', '이탈리안', '프렌치', '양식', '카페', '디저트'),
    fc.string(), // 임의 문자열(빈 문자열/공백 포함)
    fc.constantFrom('', '   '),
  ),
  { nil: undefined },
);

// 지역 후보: 프리셋 + 임의 문자열 + 빈/공백 문자열.
const regionArb = fc.oneof(
  fc.constantFrom('성수', '강남', '홍대', '잠실', '이태원'),
  fc.string(),
  fc.constantFrom('', '   '),
);

// 가격대 후보: Google Places priceLevel 0~4 + 없음.
const priceLevelArb = fc.option(fc.integer({ min: 0, max: 4 }), { nil: undefined });

// 리뷰 후보: 키워드가 포함될 수 있는 텍스트와 임의/빈 텍스트를 섞는다.
const reviewTextArb = fc.oneof(
  fc.string(),
  fc.constantFrom(
    '분위기가 정말 좋아요',
    '가성비 최고, 데이트하기 좋음',
    '웨이팅이 길지만 친절했어요',
    '파스타랑 와인이 잘 어울려요',
    '조용하고 아늑한 뷰 맛집',
    '디저트가 신선하고 좋아요',
    '',
    '   ',
  ),
);

const reviewArb: fc.Arbitrary<RestaurantReview> = fc.record(
  {
    text: reviewTextArb,
    rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
    authorName: fc.option(fc.string(), { nil: undefined }),
  },
  { requiredKeys: ['text'] },
);

const generatorInputArb: fc.Arbitrary<GeneratorInput> = fc.record(
  {
    category: categoryArb,
    region: regionArb,
    priceLevel: priceLevelArb,
    reviews: fc.array(reviewArb, { maxLength: 6 }), // 빈 배열 포함
  },
  { requiredKeys: ['region', 'reviews'] },
);

describe('generateSurvivalText - Property 5: 별명 길이는 6~18자 범위', () => {
  it('모든 입력에 대해 survivalTitle 길이는 6자 이상 18자 이하이다 (fallback 포함)', () => {
    fc.assert(
      fc.property(generatorInputArb, (input) => {
        const { survivalTitle } = generateSurvivalText(input);
        expect(survivalTitle.length).toBeGreaterThanOrEqual(TITLE_MIN);
        expect(survivalTitle.length).toBeLessThanOrEqual(TITLE_MAX);
      }),
      { numRuns: 200 },
    );
  });
});

describe('generateSurvivalText - 빈 정보 fallback (단위 테스트)', () => {
  it('정보가 전혀 없으면 별명·한 줄 소개 fallback을 사용한다', () => {
    const input: GeneratorInput = {
      region: '',
      reviews: [],
    };

    const { survivalTitle, survivalSummary } = generateSurvivalText(input);

    expect(survivalTitle).toBe('오늘의 도전자');
    expect(survivalSummary).toBe('현재 검색 조건에 맞는 식당 후보입니다.');

    // fallback 별명도 6~18자 범위를 만족해야 한다.
    expect(survivalTitle.length).toBeGreaterThanOrEqual(TITLE_MIN);
    expect(survivalTitle.length).toBeLessThanOrEqual(TITLE_MAX);
  });
});
