// Feature: last-dish-standing, Property 7: 모든 참가 식당은 게임 중 최소 1회 등장하고 최종 Winner는 정확히 1개
// Feature: last-dish-standing, Property 8: 선택 식당은 평점과 무관하게 항상 승자가 된다
// Feature: last-dish-standing, Property 9: 선택 확정(ratingReveal) 이후 추가 선택 입력은 무시된다
// Feature: last-dish-standing, Property 10: 선택은 즉시 ratingReveal 로, 다음 진행은 playing 으로 전이한다
// Feature: last-dish-standing, Property 12: 연승은 챔피언 유지 시 증가하고 교체 시 1로 리셋된다
//
// Validates: Requirements 7.4, 9.1~9.6, 10.6, 11.3, 11.4, 11.5, 14.1, 17.2
//
// 리듀서(순수 상태 머신)를 사용해 START_GAME -> LOAD_SUCCESS -> (SELECT_RESTAURANT ->
// REVEAL_NEXT)* -> finished 의 핵심 루프를 시뮬레이션한다. 부활 분기(Roster >= 6 에서
// 발생 가능)는 SKIP_REVIVAL 로 건너뛰어 핵심 루프 검증을 단순하게 유지한다.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { reducer, createInitialState } from './reducer';
import type { Restaurant, GameState, SetupInput } from '../types';

/** 최소한의 Restaurant 객체를 생성한다(평점은 일부 undefined 포함). */
function makeRestaurant(id: string, rating: number | undefined): Restaurant {
  return {
    id,
    name: `name-${id}`,
    reviews: [],
    survivalTitle: `title-${id}`,
    survivalSummary: `summary-${id}`,
    rating,
  };
}

/**
 * 임의 크기(2..8)의 Roster arbitrary. id 는 유일하며 평점은 일부 undefined 를
 * 포함하도록 생성하여 "평점 무관 승자" 프로퍼티를 강하게 검증한다.
 */
const rosterArb: fc.Arbitrary<Restaurant[]> = fc
  .integer({ min: 2, max: 8 })
  .chain((size) =>
    fc.array(
      fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
      { minLength: size, maxLength: size },
    ),
  )
  .map((ratings) =>
    ratings.map((rating, i) => makeRestaurant(`r${i}`, rating)),
  );

const SETUP: SetupInput = { foodType: '한식', region: '성수' };

/** 게임을 playing 상태로 진입시킨다. */
function startGame(roster: Restaurant[]): GameState {
  let state = createInitialState();
  state = reducer(state, { type: 'START_GAME', setup: SETUP });
  state = reducer(state, { type: 'LOAD_SUCCESS', roster });
  return state;
}

/**
 * 한 번의 대결을 진행한다: playing 상태에서 챔피언 또는 도전자를 선택한다.
 * chooseChampion=true 면 챔피언을, false 면 도전자를 승자로 선택한다.
 */
function chosenIdFor(state: GameState, chooseChampion: boolean): string {
  return chooseChampion
    ? (state.currentChampion as string)
    : (state.currentChallenger as string);
}

describe('reducer core loop - Property 7: 모든 참가 식당 최소 1회 등장 + 최종 Winner 1개', () => {
  it('finished 에서 정확히 하나의 챔피언이 남고, 모든 Roster 식당이 챔피언/도전자로 최소 1회 등장한다', () => {
    fc.assert(
      fc.property(
        rosterArb,
        // 매 대결의 선택(챔피언 유지 or 도전자 승리)을 결정하는 불리언 스트림
        fc.array(fc.boolean(), { minLength: 8, maxLength: 32 }),
        (roster, choices) => {
          let state = startGame(roster);

          // 등장 추적: LOAD_SUCCESS 직후 챔피언/도전자를 등장으로 기록.
          const appeared = new Set<string>();
          if (state.currentChampion) appeared.add(state.currentChampion);
          if (state.currentChallenger) appeared.add(state.currentChallenger);

          let step = 0;
          let guard = 0;
          while (state.status !== 'finished' && guard < 200) {
            guard += 1;
            if (state.status === 'playing') {
              const chooseChampion = choices[step % choices.length];
              step += 1;
              const chosen = chosenIdFor(state, chooseChampion);
              state = reducer(state, { type: 'SELECT_RESTAURANT', id: chosen });
            } else if (state.status === 'ratingReveal') {
              state = reducer(state, { type: 'REVEAL_NEXT' });
              // 부활 분기로 들어가면 건너뛴다.
              if (state.status === 'revival') {
                state = reducer(state, { type: 'SKIP_REVIVAL' });
              }
              // 새 도전자가 등장했으면 기록.
              if (state.currentChallenger) appeared.add(state.currentChallenger);
            } else {
              break;
            }
          }

          // 게임이 종료되어야 한다.
          expect(state.status).toBe('finished');

          // 정확히 하나의 챔피언(Winner)이 남는다.
          expect(state.currentChampion).not.toBeNull();
          expect(state.currentChallenger).toBeNull();

          // 모든 Roster 식당이 최소 1회 등장했다.
          for (const r of roster) {
            expect(appeared.has(r.id)).toBe(true);
          }

          // Winner 는 Roster 소속이며, 탈락 목록에는 나머지 전부가 있다.
          const winner = state.currentChampion as string;
          expect(roster.map((r) => r.id)).toContain(winner);
          expect(new Set(state.eliminated).size).toBe(roster.length - 1);
          expect(state.eliminated).not.toContain(winner);
        },
      ),
      { numRuns: 150 },
    );
  });
});

describe('reducer core loop - Property 8: 선택 식당은 평점 무관 항상 승자', () => {
  it('SELECT 이후 선택한 id 가 currentChampion 이고 상대는 eliminated 에 추가된다(평점과 무관)', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.array(fc.boolean(), { minLength: 8, maxLength: 32 }),
        (roster, choices) => {
          let state = startGame(roster);
          let step = 0;
          let guard = 0;

          while (state.status !== 'finished' && guard < 200) {
            guard += 1;
            if (state.status === 'playing') {
              const chooseChampion = choices[step % choices.length];
              step += 1;
              const chosen = chosenIdFor(state, chooseChampion);
              const other =
                chosen === state.currentChampion
                  ? (state.currentChallenger as string)
                  : (state.currentChampion as string);
              const prevEliminatedLen = state.eliminated.length;

              const next = reducer(state, {
                type: 'SELECT_RESTAURANT',
                id: chosen,
              });

              // 선택 식당은 평점과 무관하게 승자(챔피언)가 된다.
              expect(next.currentChampion).toBe(chosen);
              // 상대는 탈락 목록에 추가된다.
              expect(next.eliminated).toContain(other);
              expect(next.eliminated.length).toBe(prevEliminatedLen + 1);
              // selectedId 는 승자 id 로 기록된다.
              expect(next.selectedId).toBe(chosen);

              state = next;
            } else if (state.status === 'ratingReveal') {
              state = reducer(state, { type: 'REVEAL_NEXT' });
              if (state.status === 'revival') {
                state = reducer(state, { type: 'SKIP_REVIVAL' });
              }
            } else {
              break;
            }
          }
          expect(state.status).toBe('finished');
        },
      ),
      { numRuns: 150 },
    );
  });
});

describe('reducer core loop - Property 9: 선택 후 추가 입력 무시', () => {
  it('ratingReveal 에서 SELECT_RESTAURANT 를 다시 dispatch 해도 상태가 변하지 않는다', () => {
    fc.assert(
      fc.property(rosterArb, fc.boolean(), (roster, chooseChampion) => {
        let state = startGame(roster);
        expect(state.status).toBe('playing');

        // 첫 선택 -> ratingReveal
        const chosen = chosenIdFor(state, chooseChampion);
        state = reducer(state, { type: 'SELECT_RESTAURANT', id: chosen });
        expect(state.status).toBe('ratingReveal');

        // ratingReveal 에서 다시 SELECT (챔피언/도전자 모두 시도) -> 무시(동일 참조 반환).
        const beforeChampion = reducer(state, {
          type: 'SELECT_RESTAURANT',
          id: state.currentChampion as string,
        });
        expect(Object.is(beforeChampion, state)).toBe(true);

        if (state.currentChallenger) {
          const beforeChallenger = reducer(state, {
            type: 'SELECT_RESTAURANT',
            id: state.currentChallenger,
          });
          expect(Object.is(beforeChallenger, state)).toBe(true);
        }

        // 임의 id 로도 무시된다.
        const beforeArbitrary = reducer(state, {
          type: 'SELECT_RESTAURANT',
          id: 'non-existent-id',
        });
        expect(Object.is(beforeArbitrary, state)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});

describe('reducer core loop - Property 10: 선택은 즉시 ratingReveal, 다음은 playing', () => {
  it('playing 에서 SELECT 하면 ratingReveal 이고, 남은 도전자가 있으면 REVEAL_NEXT 후 playing 이다', () => {
    fc.assert(
      fc.property(rosterArb, fc.boolean(), (roster, chooseChampion) => {
        let state = startGame(roster);
        expect(state.status).toBe('playing');

        const chosen = chosenIdFor(state, chooseChampion);
        state = reducer(state, { type: 'SELECT_RESTAURANT', id: chosen });

        // 선택은 즉시 ratingReveal.
        expect(state.status).toBe('ratingReveal');

        // 다음 진행: 남은 도전자가 있으면 playing, 없으면 finished.
        // roster 크기 >= 3 이면 첫 대결 후에도 nextIndex(2) < rosterOrder.length 이므로 도전자가 남는다.
        let afterReveal = reducer(state, { type: 'REVEAL_NEXT' });
        // 부활 분기(Roster >= 6)면 건너뛰고 다음 일반 진행을 확인한다.
        if (afterReveal.status === 'revival') {
          afterReveal = reducer(afterReveal, { type: 'SKIP_REVIVAL' });
        }

        if (roster.length >= 3) {
          expect(afterReveal.status).toBe('playing');
          expect(afterReveal.currentChallenger).not.toBeNull();
        } else {
          // roster 길이 2: 도전자가 남지 않아 종료된다.
          expect(afterReveal.status).toBe('finished');
        }
      }),
      { numRuns: 150 },
    );
  });
});

describe('reducer core loop - Property 12: 연승 유지 시 증가·교체 시 1', () => {
  it('승자가 직전 챔피언과 같으면 winStreak 가 +1, 도전자가 이기면 1 로 리셋된다', () => {
    fc.assert(
      fc.property(
        rosterArb,
        fc.array(fc.boolean(), { minLength: 8, maxLength: 32 }),
        (roster, choices) => {
          let state = startGame(roster);
          let step = 0;
          let guard = 0;

          while (state.status !== 'finished' && guard < 200) {
            guard += 1;
            if (state.status === 'playing') {
              const chooseChampion = choices[step % choices.length];
              step += 1;
              const prevChampion = state.currentChampion as string;
              const prevStreak = state.winStreak;
              const chosen = chosenIdFor(state, chooseChampion);

              const next = reducer(state, {
                type: 'SELECT_RESTAURANT',
                id: chosen,
              });

              if (chosen === prevChampion) {
                // 챔피언 유지 -> 연승 증가.
                expect(next.winStreak).toBe(prevStreak + 1);
              } else {
                // 챔피언 교체(도전자 승리) -> 연승 리셋(1).
                expect(next.winStreak).toBe(1);
              }

              state = next;
            } else if (state.status === 'ratingReveal') {
              state = reducer(state, { type: 'REVEAL_NEXT' });
              if (state.status === 'revival') {
                state = reducer(state, { type: 'SKIP_REVIVAL' });
              }
            } else {
              break;
            }
          }
          expect(state.status).toBe('finished');
        },
      ),
      { numRuns: 150 },
    );
  });
});
