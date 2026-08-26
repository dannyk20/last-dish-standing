import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { passesQualityGate } from './rules';
import type { RestaurantReview } from '../types';

// Feature: last-dish-standing, Property 1: 품질 검증은 핵심 정보 2개 이상과 동치
//
// 모든 식당에 대해, passesQualityGate가 true를 반환하는 것은 대표 사진(photoUrl),
// 리뷰(reviews.length > 0), 가격대(priceLevel)의 확보 개수가 2개 이상인 경우와
// 정확히 동치이다.
//
// Validates: Requirements 3.2, 3.3

// 리뷰 항목 arbitrary.
const reviewArb: fc.Arbitrary<RestaurantReview> = fc.record(
  {
    text: fc.string(),
    rating: fc.option(fc.double({ min: 0, max: 5, noNaN: true }), {
      nil: undefined,
    }),
    authorName: fc.option(fc.string(), { nil: undefined }),
  },
  { requiredKeys: ['text'] },
);

// 핵심 정보 세 가지의 임의 조합을 생성한다.
// - photoUrl: 존재하는 문자열이거나 undefined
// - reviews: 임의 길이의 리뷰 배열(빈 배열 포함)
// - priceLevel: 정의된 숫자이거나 undefined
const qualityInputArb = fc.record({
  photoUrl: fc.option(fc.string(), { nil: undefined }),
  reviews: fc.array(reviewArb, { maxLength: 5 }),
  priceLevel: fc.option(fc.integer({ min: 0, max: 4 }), { nil: undefined }),
});

describe('passesQualityGate — Property 1', () => {
  it('returns true IFF at least 2 of the 3 core info items are confirmed (min 100 runs)', () => {
    fc.assert(
      fc.property(qualityInputArb, (input) => {
        const hasPhoto = !!input.photoUrl;
        const hasReview = input.reviews.length > 0;
        const hasPrice = input.priceLevel !== undefined;
        const confirmedCount = [hasPhoto, hasReview, hasPrice].filter(
          Boolean,
        ).length;

        const expected = confirmedCount >= 2;
        expect(passesQualityGate(input)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });
});
