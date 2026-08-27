// Feature: last-dish-standing, Property 13: 패자부활은 시작 Roster가 6 이상일 때만 게임당 최대 1회
//
// Property 13: 모든 Roster에 대해 게임을 끝까지 진행하면, 패자부활전 실행(=status가
// 'revival'로 진입한) 횟수는 시작 Roster 크기가 6 이상이면 최대 1회이고, 2~5이면 0회이다.
//
// Feature: last-dish-standing, Property 14: 패자부활은 누적 탈락 3개 이상에서만 실행되고 챔피언을 후보에서 제외
//
// Property 14: 모든 패자부활전 진입 시점에 대해, 그 시점의 누적 탈락 식당 수는 3개
// 이상이며 부활 후보 목록에는 현재 챔피언이 포함되지 않는다.
//
// Feature: last-dish-standing, Property 15: 패자부활 후보 수는 min(탈락 수, 3)
//
// Property 15: 모든 패자부활전 진입 상태에 대해, 후보 수는 탈락 식당이 3개를
// 초과하면 3개, 1~3개이면 탈락 식당 전부이다(= min(탈락 수, 3)).
//
// Validates: Requirements 12.1, 12.2, 12.3, 12.6, 13.1, 13.2, 13.3, 13.9

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { reducer, createInitialState } from './reducer';
import type { GameState, Restaurant } from '../types';

/** 최소 필드만 채운 Restaurant를 id로 생성한다(리듀서는 id만 사용한다). */
function makeRestaurant(id: string): Restaurant {
  return {
    id,
    name: `name-${id}`,
    reviews: [],
    survivalTitle: 'title',
    survivalSummary: 'summary',
  };
}

/** 크기 n(2..8)의 Roster를 유일한 id로 생성한다. */
function makeRoster(n: number): Restaurant[] {
  return Array.from({ length: n }, (_, i) => makeRestaurant(`r${i}`));
}

interface RevivalObservation {
  eliminatedCount: number;
  candidates: string[];
  champion: string | null;
}

interface PlaythroughResult {
  finalState: GameState;
  revivalEntries: number;
  observations: RevivalObservation[];
}

/**
 * 하나의 완전한 게임을 시뮬레이션한다.
 *
 * - START_GAME -> LOAD_SUCCESS(roster)로 playing에 진입한다.
 * - playing에서 choosePreferChampion에 따라 챔피언 또는 도전자를 선택(SELECT_RESTAURANT)하면
 *   선택 즉시 내부에서 revival/다음 도전자/finished 분기가 일어난다(별도 평점 공개 단계 없음).
 * - revival에 진입하면 관찰을 기록한 뒤 skipRevival 여부에 따라 SKIP_REVIVAL 또는
 *   첫 후보로 REVIVE_RESTAURANT를 dispatch한다.
 * - finished에 도달하면 종료한다.
 *
 * @param choices playing 상태에서 챔피언을 선택할지(true) 도전자를 선택할지(false)를 주는 시퀀스.
 * @param skipRevival revival 진입 시 건너뛸지(true) 부활시킬지(false).
 */
function playFullGame(
  roster: Restaurant[],
  choices: boolean[],
  skipRevival: boolean,
): PlaythroughResult {
  let state = createInitialState();
  state = reducer(state, {
    type: 'START_GAME',
    setup: { foodType: '한식', region: '강남' },
  });
  state = reducer(state, { type: 'LOAD_SUCCESS', roster });

  const observations: RevivalObservation[] = [];
  let revivalEntries = 0;
  let choiceIdx = 0;

  // 무한 루프 방지 상한(대결 수는 최대 roster.length + 부활 1회 정도이므로 여유있게).
  const maxSteps = roster.length * 4 + 20;
  let steps = 0;

  while (state.status !== 'finished' && steps < maxSteps) {
    steps += 1;

    if (state.status === 'playing') {
      const preferChampion = choices[choiceIdx % choices.length];
      choiceIdx += 1;
      const chosen = preferChampion
        ? state.currentChampion
        : state.currentChallenger;
      // 방어: 둘 중 하나는 항상 존재해야 한다.
      const id = chosen ?? state.currentChampion ?? state.currentChallenger!;
      // 선택 시 곧바로 부활 트리거가 판정된다. 3개 초과 시 무작위 선정 경로도
      // 태우기 위해, 현재 탈락 목록에 이번 패자(=선택되지 않은 쪽)를 더해 역순으로
      // 셔플된 후보 힌트를 주입한다(리듀서가 최종 eliminated로 필터링한다).
      const loser =
        id === state.currentChampion
          ? state.currentChallenger
          : state.currentChampion;
      const shuffledEliminated = [
        ...(loser ? [loser] : []),
        ...state.eliminated,
      ].reverse();
      state = reducer(state, {
        type: 'SELECT_RESTAURANT',
        id,
        shuffledEliminated,
      });
      // 방금 선택으로 revival에 진입했다면 관찰을 기록한다.
      if (state.status === 'revival') {
        revivalEntries += 1;
        observations.push({
          eliminatedCount: state.eliminated.length,
          candidates: [...state.revivalCandidates],
          champion: state.currentChampion,
        });
      }
      continue;
    }

    if (state.status === 'revival') {
      if (skipRevival || state.revivalCandidates.length === 0) {
        state = reducer(state, { type: 'SKIP_REVIVAL' });
      } else {
        state = reducer(state, {
          type: 'REVIVE_RESTAURANT',
          id: state.revivalCandidates[0],
        });
      }
      continue;
    }

    // 기타 상태(error 등)에서는 진행 불가 - 루프 종료.
    break;
  }

  return { finalState: state, revivalEntries, observations };
}

/** Roster 크기(2..8), 선택 시퀀스(bool 배열), 부활 스킵 여부 arbitrary. */
const scenarioArb = fc.record({
  size: fc.integer({ min: 2, max: 8 }),
  choices: fc.array(fc.boolean(), { minLength: 1, maxLength: 16 }),
  skipRevival: fc.boolean(),
});

describe('reducer revival - Property 13: 패자부활은 시작 Roster가 6 이상일 때만 게임당 최대 1회', () => {
  it('완전한 게임에서 revival 진입 횟수는 Roster>=6이면 <=1, 2~5이면 0이다', () => {
    fc.assert(
      fc.property(scenarioArb, ({ size, choices, skipRevival }) => {
        const roster = makeRoster(size);
        const { finalState, revivalEntries } = playFullGame(
          roster,
          choices,
          skipRevival,
        );

        // 게임은 반드시 종료되어야 한다(무한 루프 없음).
        expect(finalState.status).toBe('finished');

        if (size >= 6) {
          expect(revivalEntries).toBeLessThanOrEqual(1);
        } else {
          expect(revivalEntries).toBe(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('reducer revival - Property 14: 누적 탈락 3개 이상 + 챔피언 제외', () => {
  it('revival 진입 시점마다 탈락 수 >= 3 이고 후보에 현재 챔피언이 없다', () => {
    fc.assert(
      fc.property(scenarioArb, ({ size, choices, skipRevival }) => {
        const roster = makeRoster(size);
        const { observations } = playFullGame(roster, choices, skipRevival);

        for (const obs of observations) {
          // 누적 탈락 3개 이상에서만 부활 진입.
          expect(obs.eliminatedCount).toBeGreaterThanOrEqual(3);
          // 현재 챔피언은 후보에서 제외.
          if (obs.champion !== null) {
            expect(obs.candidates).not.toContain(obs.champion);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('reducer revival - Property 15: 후보 수는 min(탈락 수, 3)', () => {
  it('revival 진입 상태의 후보 수는 min(탈락 수, 3)과 같다', () => {
    fc.assert(
      fc.property(scenarioArb, ({ size, choices, skipRevival }) => {
        const roster = makeRoster(size);
        const { observations } = playFullGame(roster, choices, skipRevival);

        for (const obs of observations) {
          expect(obs.candidates.length).toBe(Math.min(obs.eliminatedCount, 3));
        }
      }),
      { numRuns: 200 },
    );
  });
});
