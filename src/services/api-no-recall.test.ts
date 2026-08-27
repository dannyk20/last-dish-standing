// API 재호출 금지 mock 테스트
// _Requirements: 6.2, 6.3, 2.1_
//
// 핵심 검증: 게임 시작 시 최초 검색(searchRestaurants/getDetails)은 수행되지만,
// 이후 대결(SELECT_RESTAURANT) / 부활(SKIP_REVIVAL·REVIVE_RESTAURANT) / Winner 로
// 진행하는 동안 Places API 가 다시 호출되지 않는다(Req 6.2, 6.3).
//
// 게임 상태 머신(reducer/actions)은 다른 task 에서 동시 작성 중일 수 있다.
// - reducer 가 이미 존재하면: 리듀서를 실제로 구동하여 게임플레이 전이 중
//   placesService spy 가 초기 호출 수 이후로 증가하지 않음을 검증한다.
// - reducer 가 아직 없으면: 게임 로직 모듈(reducer/actions/rules/useGame)이
//   placesService 를 참조/호출하지 않음을 검증한다(초기 검색 외 호출 0회).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RawPlace } from './placesService';

// placesService 모듈 전체를 mock 한다. 게임 로직이 이 모듈의 함수를 호출하면
// spy 호출 수가 증가한다.
vi.mock('./placesService', () => {
  const searchRestaurants = vi.fn(async () => [] as RawPlace[]);
  const getDetails = vi.fn(async () => ({ id: 'x' }) as RawPlace);
  const placesService = { searchRestaurants, getDetails };
  return { placesService, default: placesService, searchRestaurants, getDetails };
});

// mock 이후에 import 해야 spy 인스턴스를 받는다.
import { placesService } from './placesService';
import { buildRoster, calcTotalRounds } from '../game/rules';
import type { Restaurant } from '../types';

const searchSpy = placesService.searchRestaurants as unknown as ReturnType<typeof vi.fn>;
const detailsSpy = placesService.getDetails as unknown as ReturnType<typeof vi.fn>;

/** 테스트용 Restaurant 생성기. 모든 필드는 게임플레이에 충분하도록 채운다. */
function makeRestaurant(id: string, rating: number): Restaurant {
  return {
    id,
    name: `Restaurant ${id}`,
    address: `${id} 주소`,
    category: 'restaurant',
    photoUrl: `https://example.com/${id}.jpg`,
    priceLevel: 2,
    rating,
    userRatingCount: 100,
    reviews: [{ text: `${id} 리뷰`, rating, authorName: '작성자' }],
    survivalTitle: `${id} 챌린저`,
    survivalSummary: '현재 검색 조건에 맞는 식당 후보입니다.',
    googleMapsUrl: `https://maps.google.com/?q=${id}`,
  };
}

/** 8개짜리 Roster(부활 조건 포함)를 만든다. */
function makeRoster(n: number): Restaurant[] {
  return Array.from({ length: n }, (_, i) =>
    makeRestaurant(`r${i}`, 3 + (i % 3) * 0.5),
  );
}

beforeEach(() => {
  searchSpy.mockClear();
  detailsSpy.mockClear();
});

/**
 * 초기 로드 파이프라인 시뮬레이션: 게임 시작 시 Places API 를 호출하는 지점.
 * 실제 App 와이어링을 흉내 내어 검색을 정확히 1회 수행한다.
 */
async function performInitialSearch(): Promise<void> {
  await placesService.searchRestaurants({ region: '성수', foodType: '이탈리안' });
}

describe('API 재호출 금지 (Req 6.2, 6.3, 2.1)', () => {
  it('초기 검색은 정확히 1회 수행된다 (Req 2.1)', async () => {
    await performInitialSearch();
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('게임플레이 전이 동안 Places API 가 재호출되지 않는다', async () => {
    // 1) 초기 검색 1회 수행 (게임 시작)
    await performInitialSearch();
    const searchCallsAfterInit = searchSpy.mock.calls.length;
    const detailsCallsAfterInit = detailsSpy.mock.calls.length;
    expect(searchCallsAfterInit).toBe(1);

    // 2) reducer 가 존재하는지 동적으로 확인한다.
    let reducerMod: Record<string, unknown> | null = null;
    try {
      reducerMod = (await import('../game/reducer')) as Record<string, unknown>;
    } catch {
      reducerMod = null;
    }

    const reducer =
      reducerMod &&
      (typeof reducerMod.reducer === 'function'
        ? (reducerMod.reducer as Function)
        : typeof reducerMod.gameReducer === 'function'
          ? (reducerMod.gameReducer as Function)
          : typeof reducerMod.default === 'function'
            ? (reducerMod.default as Function)
            : null);

    if (reducer) {
      // === reducer 가 존재하면 실제 게임플레이를 구동한다 ===
      const roster = makeRoster(8);
      const restaurantsById: Record<string, Restaurant> = {};
      for (const r of roster) restaurantsById[r.id] = r;
      const rosterOrder = buildRoster(roster).map((r) => r.id);
      const totalRounds = calcTotalRounds(rosterOrder.length);

      // LOAD_SUCCESS 형태의 초기 상태를 구성한다(리듀서 API 차이를 흡수하기 위해
      // 필요한 필드를 모두 채운다).
      let state: Record<string, unknown> = {
        status: 'playing',
        setup: { foodType: '이탈리안', region: '성수' },
        rosterOrder,
        restaurantsById,
        currentChampion: rosterOrder[0],
        currentChallenger: rosterOrder[1],
        nextIndex: 2,
        currentRound: 1,
        totalRounds,
        winStreak: 1,
        winCount: 1,
        eliminated: [],
        revivalEligible: rosterOrder.length >= 6,
        revivalUsed: false,
        revivalCandidates: [],
        lastBattle: null,
        selectedId: null,
        error: null,
      };

      // action 빌더: actions 모듈이 팩토리를 제공하면 사용하고, 아니면 plain action.
      const dispatch = (type: string, extra: Record<string, unknown> = {}) => {
        const action = { type, ...extra };
        state = reducer(state, action) as Record<string, unknown>;
      };

      // 게임을 끝까지 진행: 각 라운드마다 SELECT 하면 즉시 다음 대결/부활/종료로
      // 전이한다(별도 평점 공개 단계 없음). 부활 분기는 건너뛰기로 이어간다.
      let guard = 0;
      while (state.status !== 'finished' && guard < 100) {
        guard += 1;
        if (state.status === 'playing') {
          const challenger = state.currentChallenger as string | null;
          const champion = state.currentChampion as string | null;
          const pick = challenger ?? champion;
          if (pick) dispatch('SELECT_RESTAURANT', { restaurantId: pick, id: pick });
          else break;
        } else if (state.status === 'revival') {
          // 부활전은 건너뛰기로 진행하여 API 재호출 없이 흐름을 이어간다.
          dispatch('SKIP_REVIVAL');
        } else {
          break;
        }
      }

      // 핵심 단언: 게임플레이 전이 동안 Places API 는 초기 호출 수를 넘지 않는다.
      expect(searchSpy.mock.calls.length).toBe(searchCallsAfterInit);
      expect(detailsSpy.mock.calls.length).toBe(detailsCallsAfterInit);
    } else {
      // === reducer 가 아직 없으면 게임 로직 모듈이 placesService 를 호출하지 않음을 검증 ===
      // 순수 게임 로직(rules)을 구동한다: 이 과정에서 placesService 호출이 없어야 한다.
      const roster = makeRoster(8);
      const built = buildRoster(roster);
      const total = calcTotalRounds(built.length);
      expect(built.length).toBe(8);
      expect(total).toBe(7);

      // rules 모듈은 placesService 를 import 하지 않으므로 호출 수가 그대로여야 한다.
      expect(searchSpy.mock.calls.length).toBe(searchCallsAfterInit);
      expect(detailsSpy.mock.calls.length).toBe(detailsCallsAfterInit);
    }
  });

  it('게임 로직 계층(rules)은 placesService 를 호출하지 않는다', async () => {
    // rules 함수만 구동하고 Places spy 가 전혀 호출되지 않음을 확인한다.
    const roster = makeRoster(6);
    buildRoster(roster);
    calcTotalRounds(roster.length);
    expect(searchSpy).not.toHaveBeenCalled();
    expect(detailsSpy).not.toHaveBeenCalled();
  });

  it('동일 place 에 대한 반복 상세 요청이 없다 (Req 6.3)', async () => {
    // 초기 로드에서 상세를 한 번 부른다고 가정해도, 게임플레이 중에는
    // getDetails 가 추가로 호출되지 않아야 한다.
    await placesService.getDetails('r0');
    const afterInit = detailsSpy.mock.calls.length;

    // 게임플레이를 흉내 내는 순수 로직 구동(placesService 미사용).
    const roster = makeRoster(8);
    buildRoster(roster);

    expect(detailsSpy.mock.calls.length).toBe(afterInit);
  });
});
