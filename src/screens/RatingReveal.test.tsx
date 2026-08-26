// Feature: last-dish-standing — RatingReveal 컴포넌트/상호작용 테스트
// Requirements 10.1 (평점 공개), 10.2~10.5 (비교 메시지), 10.6 (다음 대결 CTA)
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingReveal from './RatingReveal';
import { makeRestaurant } from '../test/fixtures';

describe('RatingReveal', () => {
  it('평점 영역을 렌더링하여 평점을 공개한다 (Req 10.1)', () => {
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 4.5, userRatingCount: 300 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당', rating: 3.0, userRatingCount: 100 });

    render(<RatingReveal chosen={chosen} other={other} onNext={vi.fn()} />);

    // showRating=true 이므로 평점 영역이 두 카드 모두에 존재한다.
    expect(screen.getAllByTestId('rating-area')).toHaveLength(2);
    expect(screen.getByText('★ 4.5')).toBeInTheDocument();
    expect(screen.getByText('★ 3.0')).toBeInTheDocument();
  });

  it('선택 식당 평점이 더 높으면 higher 메시지를 표시한다 (Req 10.2)', () => {
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 4.5 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당', rating: 3.0 });

    render(<RatingReveal chosen={chosen} other={other} onNext={vi.fn()} />);

    expect(screen.getByText('대중의 선택과 일치했습니다')).toBeInTheDocument();
  });

  it('선택 식당 평점이 더 낮으면 lower 메시지를 표시한다 (Req 10.3)', () => {
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 3.0 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당', rating: 4.5 });

    render(<RatingReveal chosen={chosen} other={other} onNext={vi.fn()} />);

    expect(screen.getByText('평점보다 나의 취향')).toBeInTheDocument();
  });

  it('평점이 같으면 equal 메시지를 표시한다 (Req 10.4)', () => {
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 4.0 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당', rating: 4.0 });

    render(<RatingReveal chosen={chosen} other={other} onNext={vi.fn()} />);

    expect(screen.getByText('같은 평점, 나의 선택')).toBeInTheDocument();
  });

  it('한쪽 평점이 없으면 insufficient 메시지를 표시한다 (Req 10.5)', () => {
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 4.0 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당' }); // rating 없음

    render(<RatingReveal chosen={chosen} other={other} onNext={vi.fn()} />);

    expect(screen.getByText('평점 비교 정보가 부족합니다')).toBeInTheDocument();
  });

  it('다음 대결 CTA 클릭 시 onNext를 호출한다 (Req 10.6)', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const chosen = makeRestaurant({ id: 'a', name: '선택 식당', rating: 4.5 });
    const other = makeRestaurant({ id: 'b', name: '상대 식당', rating: 3.0 });

    render(<RatingReveal chosen={chosen} other={other} onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: '다음 대결' }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
