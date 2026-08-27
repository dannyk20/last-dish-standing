// Feature: last-dish-standing — BattleScreen 컴포넌트/상호작용 테스트
// Requirements 8.2, 8.3 (선택 전 평점 미렌더링), 8.4 (선택 시 onSelect 호출)
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BattleScreen from './BattleScreen';
import { makeRestaurant } from '../test/fixtures';

const champion = makeRestaurant({
  id: 'champ',
  name: '챔피언 식당',
  rating: 4.8,
  userRatingCount: 1200,
});
const challenger = makeRestaurant({
  id: 'chall',
  name: '도전자 식당',
  rating: 3.2,
  userRatingCount: 88,
});

describe('BattleScreen', () => {
  it('두 식당 카드를 렌더링한다', () => {
    render(
      <BattleScreen
        champion={champion}
        challenger={challenger}
        round={1}
        totalRounds={5}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('챔피언 식당')).toBeInTheDocument();
    expect(screen.getByText('도전자 식당')).toBeInTheDocument();
  });

  it('평점 영역이 DOM에 존재하지 않는다 (Req 8.2, 8.3)', () => {
    render(
      <BattleScreen
        champion={champion}
        challenger={challenger}
        round={1}
        totalRounds={5}
        onSelect={vi.fn()}
      />,
    );

    // showRating=false 이므로 평점 블록 자체가 렌더링되지 않는다.
    expect(screen.queryByTestId('rating-area')).toBeNull();
    // 평점 수치도 화면에 노출되지 않는다.
    expect(screen.queryByText(/★/)).toBeNull();
    expect(screen.queryByText('★ 4.8')).toBeNull();
    expect(screen.queryByText('★ 3.2')).toBeNull();
  });

  it('챔피언 선택 버튼 클릭 시 하이라이트 연출 후 챔피언 id로 onSelect를 호출한다 (Req 8.4, 9.6)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BattleScreen
        champion={champion}
        challenger={challenger}
        round={1}
        totalRounds={5}
        onSelect={onSelect}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: '이 식당 선택' });
    await user.click(buttons[0]);

    // 선택 하이라이트 연출(약 1.2s)을 보여준 뒤 onSelect 가 호출된다.
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1), {
      timeout: 2500,
    });
    expect(onSelect).toHaveBeenCalledWith('champ');
  });

  it('도전자 선택 버튼 클릭 시 하이라이트 연출 후 도전자 id로 onSelect를 호출한다 (Req 8.4, 9.6)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BattleScreen
        champion={champion}
        challenger={challenger}
        round={1}
        totalRounds={5}
        onSelect={onSelect}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: '이 식당 선택' });
    await user.click(buttons[1]);

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1), {
      timeout: 2500,
    });
    expect(onSelect).toHaveBeenCalledWith('chall');
  });

  it('선택 후 추가 클릭은 무시되어 onSelect가 한 번만 호출된다 (Req 9.5)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BattleScreen
        champion={champion}
        challenger={challenger}
        round={1}
        totalRounds={5}
        onSelect={onSelect}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: '이 식당 선택' });
    // 첫 클릭 후 버튼이 비활성화되므로 두 번째 클릭은 무시된다.
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1), {
      timeout: 2500,
    });
    expect(onSelect).toHaveBeenCalledWith('champ');
  });
});
