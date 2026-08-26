// Feature: last-dish-standing, Property 11: 평점 비교는 실제 대소·누락 관계를 정확히 분류
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { compareRatings } from './rules';
import type { Restaurant } from '../types';

/**
 * Property 11: 평점 비교는 실제 대소·누락 관계를 정확히 분류
 *
 * 모든 두 식당의 평점 조합에 대해, `compareRatings`는 두 평점이 모두 존재할 때
 * 선택 식당(chosen)이 더 높으면 'higher', 낮으면 'lower', 같으면 'equal'을
 * 반환하고, 하나 이상 누락되면 'insufficient'를 반환한다.
 *
 * **Validates: Requirements 10.2, 10.3, 10.4, 10.5**
 */

/** 최소 Restaurant 객체를 주어진 평점(옵션)으로 생성한다. */
function makeRestaurant(id: string, rating: number | undefined): Restaurant {
  return {
    id,
    name: `Restaurant ${id}`,
    reviews: [],
    survivalTitle: '오늘의 도전자',
    survivalSummary: '현재 검색 조건에 맞는 식당 후보입니다.',
    ...(rating === undefined ? {} : { rating }),
  };
}

// 평점 생성기: 실제 평점 범위를 고려한 유한 소수, 또는 undefined(누락).
const ratingArb = fc.option(
  fc.double({ min: 0, max: 5, noNaN: true, noDefaultInfinity: true }),
  { nil: undefined },
);

describe('compareRatings property (Property 11)', () => {
  it('두 평점의 실제 대소·누락 관계를 정확히 분류한다', () => {
    fc.assert(
      fc.property(ratingArb, ratingArb, (chosenRating, otherRating) => {
        const chosen = makeRestaurant('chosen', chosenRating);
        const other = makeRestaurant('other', otherRating);

        const result = compareRatings(chosen, other);

        if (chosenRating === undefined || otherRating === undefined) {
          // 한쪽 이상 평점이 누락되면 insufficient (Req 10.5)
          expect(result.kind).toBe('insufficient');
        } else if (chosenRating > otherRating) {
          // 선택 식당 평점이 더 높음 (Req 10.2)
          expect(result.kind).toBe('higher');
        } else if (chosenRating < otherRating) {
          // 선택 식당 평점이 더 낮음 (Req 10.3)
          expect(result.kind).toBe('lower');
        } else {
          // 두 평점이 동일 (Req 10.4)
          expect(result.kind).toBe('equal');
        }
      }),
      { numRuns: 200 },
    );
  });
});
