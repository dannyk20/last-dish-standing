// Feature: last-dish-standing, Property 6: 일반 대결 수는 참가 식당 수 - 1
//
// Property 6: 일반 대결 수는 참가 식당 수 - 1
// 모든 2~8 범위의 참가 식당 수 n에 대해, 계산된 전체 일반 대결 수는 n - 1이다.
// Validates: Requirements 7.1, 7.4
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { calcTotalRounds } from './rules';

describe('calcTotalRounds (Property 6)', () => {
  it('모든 참가 식당 수 n(2~8)에 대해 calcTotalRounds(n) === n - 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 8 }), (n) => {
        return calcTotalRounds(n) === n - 1;
      }),
      { numRuns: 100 },
    );
  });
});
