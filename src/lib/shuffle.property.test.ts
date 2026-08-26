// Feature: last-dish-standing, Property 4: 순서 재배치는 참가 식당 집합을 보존
//
// Property 4: 모든 Roster에 대해, 등장 순서를 무작위로 재배치해도
// 재배치 전후의 식당 집합(멀티셋)과 길이는 동일하다.
//
// Validates: Requirements 4.5

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { shuffle } from './shuffle';

/**
 * 배열을 정렬 가능한 형태로 만들어 멀티셋 비교에 사용한다.
 * 임의 값을 안정적으로 비교하기 위해 JSON 문자열로 정규화한 뒤 정렬한다.
 */
function sortedKeys<T>(arr: readonly T[]): string[] {
  return arr.map((v) => JSON.stringify(v)).sort();
}

describe('shuffle - Property 4: 순서 재배치는 참가 식당 집합을 보존', () => {
  it('재배치 결과는 원본과 동일한 길이와 멀티셋을 가지며 원본을 변경하지 않는다', () => {
    fc.assert(
      fc.property(fc.array(fc.jsonValue()), (arr) => {
        const original = arr.slice();
        const result = shuffle(arr);

        // 길이 보존
        expect(result.length).toBe(arr.length);

        // 멀티셋(원소 집합) 보존: 양쪽을 정렬하여 동일한지 비교
        expect(sortedKeys(result)).toEqual(sortedKeys(arr));

        // 입력 배열은 변경되지 않는다
        expect(arr).toEqual(original);
      }),
      { numRuns: 200 },
    );
  });
});
