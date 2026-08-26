// App 통합/상호작용 테스트 (task 9.3: 부활 흐름 와이어링 + ChampionReveal 통합)
// _Requirements: 12.x, 13.x, 14.1, 17.4_
//
// 검증 목표:
//  1) 핵심 루프가 App 상태 머신과 연결되어 START → 대결 → 평점 공개 → 최종 확정까지
//     동작한다.
//  2) 최종 확정(finished) 시 ChampionReveal 스포트라이트 연출이 먼저 표시되고,
//     연출 완료 후 WinnerScreen 상세가 노출된다(Req 14.1).
//  3) 다시 시작(RESTART_SAME) 후 다시 종료되면 ChampionReveal 연출이 재생된다
//     (championRevealed UI 전용 플래그 초기화, Req 17.4).
//
// placesService 는 mock 하여 네트워크 없이 2개짜리 Roster 로 게임을 구동한다.
// 2개 Roster 는 부활 자격(>=6) 미만이므로 1라운드 후 곧바로 최종 확정으로 이어져
// finished 흐름을 가볍게 검증할 수 있다.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { RawPlace } from './services/placesService';

// 품질 게이트(사진·리뷰·가격대 중 2개 이상)를 통과하도록 완전한 RawPlace 를 만든다.
function makeRawPlace(id: string, rating: number): RawPlace {
  return {
    id,
    displayName: { text: `식당 ${id}`, languageCode: 'ko' },
    types: ['restaurant'],
    primaryType: 'restaurant',
    formattedAddress: `${id} 주소`,
    photos: [{ name: `places/${id}/photos/p`, widthPx: 400, heightPx: 300 }],
    priceLevel: 'PRICE_LEVEL_MODERATE',
    rating,
    userRatingCount: 100,
    reviews: [
      { text: { text: `${id} 아주 맛있고 분위기 좋아요`, languageCode: 'ko' }, rating },
    ],
    googleMapsUri: `https://maps.google.com/?q=${id}`,
  };
}

const RAW_PLACES: RawPlace[] = [makeRawPlace('a', 4.5), makeRawPlace('b', 4.0)];

vi.mock('./services/placesService', () => {
  const searchRestaurants = vi.fn(async () => RAW_PLACES);
  const getDetails = vi.fn(async (id: string) => {
    const found = RAW_PLACES.find((p) => p.id === id);
    return found ?? ({ id } as RawPlace);
  });
  const placesService = { searchRestaurants, getDetails };
  return { placesService, default: placesService, searchRestaurants, getDetails };
});

import App from './App';

/** START 화면에서 음식/지역을 고르고 게임을 시작한다. */
function startGame() {
  fireEvent.click(screen.getByRole('radio', { name: '한식' }));
  fireEvent.click(screen.getByRole('button', { name: '성수' }));
  fireEvent.click(screen.getByRole('button', { name: 'START' }));
}

/**
 * 최초 대결에서 챔피언(첫 카드)을 선택하고, 평점 공개 후 다음으로 진행한다.
 * 참가 식당이 2개이므로 이 1회 대결 후 최종 Winner 가 확정된다.
 */
async function playToFinish() {
  // playing 진입까지 대기: 선택 버튼(카드의 선택 UI)이 나타난다.
  const selectButtons = await screen.findAllByRole('button', { name: /선택/ });
  fireEvent.click(selectButtons[0]);

  // ratingReveal: 다음 대결 CTA 를 누른다.
  const nextButton = await screen.findByRole('button', { name: /다음/ });
  fireEvent.click(nextButton);
}

beforeEach(() => {
  vi.useRealTimers();
});

describe('App finished 흐름 - ChampionReveal → WinnerScreen 통합', () => {
  it('최종 확정 시 ChampionReveal 연출을 먼저 보여주고, 완료 후 WinnerScreen 을 노출한다', async () => {
    render(<App />);
    startGame();
    await playToFinish();

    // ChampionReveal 연출 단계: NEW CHAMPION eyebrow 가 먼저 나타난다.
    expect(await screen.findByText('NEW CHAMPION')).toBeInTheDocument();

    // 연출 타이머가 끝나면 WinnerScreen(FINAL WINNER) 이 나타난다.
    await waitFor(
      () => {
        expect(screen.getByText('FINAL WINNER')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('RESTART_SAME 후 다시 종료되면 ChampionReveal 연출이 재생된다', async () => {
    render(<App />);
    startGame();
    await playToFinish();

    // 1차 종료: WinnerScreen 까지 도달.
    await waitFor(
      () => expect(screen.getByText('FINAL WINNER')).toBeInTheDocument(),
      { timeout: 3000 },
    );

    // 같은 조건으로 다시하기 → loading → playing 재진입.
    fireEvent.click(screen.getByRole('button', { name: /같은 조건으로 다시하기/ }));

    await playToFinish();

    // 재종료 시 ChampionReveal 연출이 다시 재생되어야 한다.
    expect(await screen.findByText('NEW CHAMPION')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText('FINAL WINNER')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
