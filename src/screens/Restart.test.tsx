// Feature: last-dish-standing — 다시 시작(RESTART_SAME / RESTART_NEW) 버튼 와이어링
// 및 최종 fallback 마무리 검증 (task 10.3)
// _Requirements: 15.1, 15.2, 16.3, 16.4, 16.5, 16.6, 16.7_
//
// 검증 목표:
//  1) WinnerScreen 의 "같은 조건으로 다시하기" / "새 게임 시작" 버튼이 각각
//     onRestartSame / onRestartNew 콜백을 호출한다(App 에서 RESTART_SAME / RESTART_NEW
//     로 연결됨).
//  2) ErrorScreen 의 "다른 조건으로 다시 시도" / "새 게임 시작" 버튼이 각각
//     onRetry / onNewGame 콜백을 호출한다.
//  3) RESTART_SAME 은 지역·음식 조건을 유지하고, RESTART_NEW 는 조건을 초기화하여
//     setup 으로 복귀한다(reducer 레벨, Req 15.1 / 15.2).
//  4) 사진/리뷰/가격/평점이 일부 누락된 식당도 WinnerScreen 에서 정상적으로
//     렌더링된다(fallback 노출, Req 16.3~16.6). 정보 일부가 없어도 화면이 깨지지
//     않고 진행 가능함을 확인한다(Req 16.7).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import WinnerScreen from './WinnerScreen';
import ErrorScreen from '../components/ErrorScreen';
import { reducer, createInitialState } from '../game/reducer';
import { makeRestaurant } from '../test/fixtures';

describe('WinnerScreen 다시 시작 버튼 (Req 15.1, 15.2)', () => {
  it('"같은 조건으로 다시하기" 클릭 시 onRestartSame 을 호출한다', () => {
    const onRestartSame = vi.fn();
    const onRestartNew = vi.fn();
    render(
      <WinnerScreen
        winner={makeRestaurant({ id: 'w', name: '우승 식당', rating: 4.7 })}
        winStreak={3}
        winCount={3}
        totalRounds={5}
        onRestartSame={onRestartSame}
        onRestartNew={onRestartNew}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /같은 조건으로 다시하기/ }),
    );
    expect(onRestartSame).toHaveBeenCalledTimes(1);
    expect(onRestartNew).not.toHaveBeenCalled();
  });

  it('"새 게임 시작" 클릭 시 onRestartNew 를 호출한다', () => {
    const onRestartSame = vi.fn();
    const onRestartNew = vi.fn();
    render(
      <WinnerScreen
        winner={makeRestaurant({ id: 'w', name: '우승 식당', rating: 4.7 })}
        winStreak={1}
        winCount={1}
        totalRounds={2}
        onRestartSame={onRestartSame}
        onRestartNew={onRestartNew}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /새 게임 시작/ }));
    expect(onRestartNew).toHaveBeenCalledTimes(1);
    expect(onRestartSame).not.toHaveBeenCalled();
  });

  it('사진/리뷰/가격/평점이 모두 누락된 우승 식당도 fallback 과 함께 정상 렌더링한다 (Req 16.3~16.7)', () => {
    // 최소 필드만 가진 식당: photoUrl / priceLevel / rating / reviews 모두 없음.
    const bareWinner = makeRestaurant({
      id: 'bare',
      name: '정보부족 식당',
    });

    render(
      <WinnerScreen
        winner={bareWinner}
        winStreak={1}
        winCount={1}
        totalRounds={1}
        onRestartSame={vi.fn()}
        onRestartNew={vi.fn()}
      />,
    );

    // 화면이 깨지지 않고 핵심 정보와 fallback 이 노출된다.
    expect(screen.getByText('정보부족 식당')).toBeInTheDocument();
    expect(screen.getByText('이미지 없음')).toBeInTheDocument(); // 사진 fallback (16.3)
    expect(screen.getByText('가격 정보 없음')).toBeInTheDocument(); // 가격 fallback (16.5)
    expect(screen.getByText('평점 정보 없음')).toBeInTheDocument(); // 평점 fallback (16.6)
    // 다시 시작 버튼도 정상적으로 제공된다.
    expect(
      screen.getByRole('button', { name: /같은 조건으로 다시하기/ }),
    ).toBeInTheDocument();
  });
});

describe('ErrorScreen 다시 시작 버튼', () => {
  it('"다른 조건으로 다시 시도" 클릭 시 onRetry 를 호출한다', () => {
    const onRetry = vi.fn();
    const onNewGame = vi.fn();
    render(
      <ErrorScreen
        message="대결을 진행할 식당이 부족합니다."
        onRetry={onRetry}
        onNewGame={onNewGame}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /다른 조건으로 다시 시도/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onNewGame).not.toHaveBeenCalled();
  });

  it('"새 게임 시작" 클릭 시 onNewGame 을 호출한다', () => {
    const onRetry = vi.fn();
    const onNewGame = vi.fn();
    render(
      <ErrorScreen
        message="오류가 발생했습니다."
        onRetry={onRetry}
        onNewGame={onNewGame}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /새 게임 시작/ }));
    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });
});

describe('reducer RESTART_SAME / RESTART_NEW (Req 15.1, 15.2)', () => {
  it('RESTART_SAME 은 지역·음식 조건을 유지한 채 loading 으로 전이한다 (Req 15.1)', () => {
    const setup = { foodType: '한식', region: '성수' };
    // 임의의 진행 상태(finished 가정)를 구성한다.
    const finished = {
      ...createInitialState(setup),
      status: 'finished' as const,
      winStreak: 4,
      winCount: 4,
      eliminated: ['x', 'y'],
    };

    const next = reducer(finished, { type: 'RESTART_SAME' });

    expect(next.status).toBe('loading');
    expect(next.setup).toEqual(setup); // 조건 유지
    // 상태 초기화 확인: 순서·진행도·연승 등이 초기값으로 리셋된다.
    expect(next.rosterOrder).toEqual([]);
    expect(next.winStreak).toBe(0);
    expect(next.eliminated).toEqual([]);
    expect(next.currentRound).toBe(0);
    expect(next.error).toBeNull();
  });

  it('RESTART_NEW 는 조건을 초기화하고 setup 으로 복귀한다 (Req 15.2)', () => {
    const setup = { foodType: '한식', region: '성수' };
    const finished = {
      ...createInitialState(setup),
      status: 'finished' as const,
    };

    const next = reducer(finished, { type: 'RESTART_NEW' });

    expect(next.status).toBe('setup');
    expect(next.setup).toEqual({ foodType: '', region: '' }); // 조건 초기화
    expect(next.rosterOrder).toEqual([]);
  });
});
