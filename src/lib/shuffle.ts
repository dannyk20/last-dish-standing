// 무작위 순서 재배치 (LAST DISH STANDING)
// 설계 문서 "폴더 구조" 및 Correctness Property 4 기준
//
// 참가 식당 집합(멀티셋)과 길이를 보존하며 등장 순서만 무작위로 재배치한다.

/**
 * 0 이상 1 미만의 난수를 반환하는 함수. 기본값은 Math.random이며,
 * 테스트에서 결정적 동작을 위해 주입할 수 있다.
 */
export type Rng = () => number;

/**
 * Fisher-Yates 알고리즘으로 배열의 순서를 무작위로 재배치한다.
 *
 * 입력 배열을 변경하지 않고(mutate 하지 않고) 동일한 원소 멀티셋과 길이를 갖는
 * 새 배열을 반환한다. 이를 통해 참가 식당 집합을 보존하면서 대결 등장 순서만
 * 재배치한다.
 *
 * @param arr 재배치할 원본 배열 (변경되지 않음)
 * @param rng 0 이상 1 미만의 난수를 반환하는 함수 (기본값: Math.random)
 * @returns 원본과 동일한 멀티셋·길이를 갖는, 순서가 재배치된 새 배열
 *
 * _Requirements: 4.5_
 */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
