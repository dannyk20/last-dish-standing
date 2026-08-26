import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * 스캐폴딩 스모크 테스트.
 * Vitest + fast-check 개발 의존성과 테스트 스크립트(vitest --run)가
 * 정상 동작하는지 확인한다. 이후 게임 로직 작업(3~4)에서 실제
 * Correctness Property 테스트가 추가된다.
 */
describe('scaffolding', () => {
  it('runs a basic Vitest assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('runs a basic fast-check property (min 100 runs)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 },
    );
  });
});
