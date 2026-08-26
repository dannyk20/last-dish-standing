// Feature: last-dish-standing, Property 2: Roster 크기는 항상 [2, 8] 범위이며 후보 수에 종속
//
// Property 2: 모든 후보 배열에 대해, (중복 제거 후) 후보 수가 8개 이상이면
// 확정 Roster 크기는 정확히 8이고, 2~7개이면 중복 제거된 후보 수와 같으며,
// 조건 미달 식당이 임의로 추가되지 않는다(모든 Roster 원소는 입력에서 유래).
//
// Feature: last-dish-standing, Property 3: Roster 내 Place ID 유일성
//
// Property 3: 모든 (중복을 포함할 수 있는) 후보 배열에 대해, 확정 Roster 내
// 각 Place ID는 유일하다(id 집합의 크기 == Roster 길이).
//
// Validates: Requirements 4.1, 4.2, 4.4

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildRoster } from './rules';
import type { Restaurant } from '../types';

/**
 * 임의의 Restaurant를 생성하는 arbitrary.
 *
 * id는 의도적으로 좁은 풀에서 뽑아 중복 id가 자주 등장하도록 하여
 * 중복 제거(dedupe) 로직과 Place ID 유일성을 강하게 검증한다.
 */
const restaurantArb: fc.Arbitrary<Restaurant> = fc.record({
  // 좁은 id 풀 -> 중복 id가 빈번하게 생성됨
  id: fc.integer({ min: 0, max: 12 }).map((n) => `place-${n}`),
  name: fc.string(),
  category: fc.option(fc.string(), { nil: undefined }),
  photoUrl: fc.option(fc.webUrl(), { nil: undefined }),
  priceLevel: fc.option(fc.integer({ min: 0, max: 4 }), { nil: undefined }),
  rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), {
    nil: undefined,
  }),
  userRatingCount: fc.option(fc.nat(), { nil: undefined }),
  reviews: fc.array(
    fc.record({
      text: fc.string(),
      rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
      authorName: fc.option(fc.string(), { nil: undefined }),
    }),
    { maxLength: 3 },
  ),
  survivalTitle: fc.string(),
  survivalSummary: fc.string(),
});

/** 입력에서 중복 id를 제거한 유일 id 개수. */
function dedupedCount(candidates: Restaurant[]): number {
  return new Set(candidates.map((c) => c.id)).size;
}

describe('buildRoster - Property 2: Roster 크기는 후보 수에 종속하며 조건 미달 식당을 추가하지 않는다', () => {
  it('중복 제거 후 8개 이상이면 크기 8, 2~7개이면 그 수와 같고, 모든 원소는 입력에서 유래한다', () => {
    fc.assert(
      fc.property(fc.array(restaurantArb, { maxLength: 40 }), (candidates) => {
        const result = buildRoster(candidates);
        const deduped = dedupedCount(candidates);

        // 크기는 min(dedupedCount, 8)
        expect(result.length).toBe(Math.min(deduped, 8));

        // 반환 크기는 항상 [0, 8] 범위 (buildRoster 자체 계약)
        expect(result.length).toBeGreaterThanOrEqual(0);
        expect(result.length).toBeLessThanOrEqual(8);

        // 조건 미달 식당을 추가하지 않는다: 모든 Roster 원소는 입력에 존재한다
        const inputIds = new Set(candidates.map((c) => c.id));
        for (const r of result) {
          expect(inputIds.has(r.id)).toBe(true);
        }
        // 결과 원소는 실제 입력 객체 참조여야 한다(새 항목을 지어내지 않음)
        for (const r of result) {
          expect(candidates.includes(r)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('buildRoster - Property 3: Roster 내 Place ID 유일성', () => {
  it('확정 Roster의 id 집합 크기는 Roster 길이와 같다', () => {
    fc.assert(
      fc.property(fc.array(restaurantArb, { maxLength: 40 }), (candidates) => {
        const result = buildRoster(candidates);
        const ids = result.map((r) => r.id);

        // id 유일성: 집합 크기 == Roster 길이
        expect(new Set(ids).size).toBe(result.length);
      }),
      { numRuns: 200 },
    );
  });
});
