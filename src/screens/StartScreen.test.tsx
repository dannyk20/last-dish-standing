// Feature: last-dish-standing — StartScreen 컴포넌트/상호작용 테스트
// Requirements 1.4, 1.5 (음식 종류 단일 선택, 시작 버튼 활성/비활성, onStart 호출)
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

describe('StartScreen', () => {
  it('음식 종류·지역 미지정이면 START 버튼이 비활성화된다 (Req 1.4)', () => {
    render(<StartScreen onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'START' })).toBeDisabled();
  });

  it('음식 종류만 선택하면 여전히 비활성화된다 (Req 1.4)', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: '한식' }));

    expect(screen.getByRole('button', { name: 'START' })).toBeDisabled();
  });

  it('지역만 입력하면 여전히 비활성화된다 (Req 1.4)', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={vi.fn()} />);

    await user.type(screen.getByLabelText('지역 직접 입력'), '연남동');

    expect(screen.getByRole('button', { name: 'START' })).toBeDisabled();
  });

  it('음식 종류와 지역이 모두 지정되면 START 버튼이 활성화된다 (Req 1.5)', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: '한식' }));
    await user.click(screen.getByRole('button', { name: '성수' }));

    expect(screen.getByRole('button', { name: 'START' })).toBeEnabled();
  });

  it('START 클릭 시 선택한 setup으로 onStart를 호출한다 (Req 1.5)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    await user.click(screen.getByRole('radio', { name: '일식' }));
    await user.type(screen.getByLabelText('지역 직접 입력'), '연남동');
    await user.click(screen.getByRole('button', { name: 'START' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({ foodType: '일식', region: '연남동' });
  });

  it('음식 종류는 단일 선택으로 유지된다 (Req 1.2)', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={vi.fn()} />);

    const korean = screen.getByRole('radio', { name: '한식' });
    const japanese = screen.getByRole('radio', { name: '일식' });

    await user.click(korean);
    expect(korean).toHaveAttribute('aria-checked', 'true');

    await user.click(japanese);
    expect(japanese).toHaveAttribute('aria-checked', 'true');
    // 이전 선택은 해제되어 한 번에 하나만 선택 상태로 유지된다.
    expect(korean).toHaveAttribute('aria-checked', 'false');
  });

  it('disabled prop이 true이면 조건이 충족되어도 비활성화된다 (Req 16.1 로딩 중 재입력 차단)', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={vi.fn()} disabled />);

    await user.click(screen.getByRole('radio', { name: '한식' }));
    await user.click(screen.getByRole('button', { name: '성수' }));

    expect(screen.getByRole('button', { name: 'START' })).toBeDisabled();
  });
});
