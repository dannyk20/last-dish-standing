// Feature: last-dish-standing — 정보 누락 fallback 렌더링 테스트
// Requirements 16.1~16.6
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhotoWithFallback from './PhotoWithFallback';
import PriceLevel from './PriceLevel';
import ReviewBox from './ReviewBox';
import RestaurantCard from './RestaurantCard';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import { makeRestaurant } from '../test/fixtures';

describe('PhotoWithFallback (Req 16.3)', () => {
  it('photoUrl이 없으면 placeholder를 표시한다', () => {
    render(<PhotoWithFallback alt="테스트 식당 대표 이미지" />);
    expect(screen.getByText('이미지 없음')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '테스트 식당 대표 이미지' })).toBeInTheDocument();
  });

  it('photoUrl이 있으면 실제 이미지를 렌더링한다', () => {
    render(<PhotoWithFallback photoUrl="https://example.com/a.jpg" alt="식당 이미지" />);
    const img = screen.getByRole('img', { name: '식당 이미지' });
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(screen.queryByText('이미지 없음')).toBeNull();
  });
});

describe('PriceLevel (Req 16.5)', () => {
  it('priceLevel이 undefined이면 "가격 정보 없음"을 표시한다', () => {
    render(<PriceLevel />);
    expect(screen.getByText('가격 정보 없음')).toBeInTheDocument();
  });

  it('priceLevel이 있으면 가격 심벌을 표시한다', () => {
    render(<PriceLevel priceLevel={2} />);
    expect(screen.queryByText('가격 정보 없음')).toBeNull();
    expect(screen.getByLabelText(/가격대 2단계/)).toBeInTheDocument();
  });
});

describe('ReviewBox (Req 16.4)', () => {
  it('리뷰가 없으면 안내 문구를 표시한다', () => {
    render(<ReviewBox />);
    expect(screen.getByText('표시할 수 있는 리뷰가 없습니다')).toBeInTheDocument();
  });

  it('빈 텍스트 리뷰도 안내 문구를 표시한다', () => {
    render(<ReviewBox review={{ text: '   ' }} />);
    expect(screen.getByText('표시할 수 있는 리뷰가 없습니다')).toBeInTheDocument();
  });

  it('리뷰가 있으면 리뷰 텍스트를 표시한다', () => {
    render(<ReviewBox review={{ text: '정말 맛있어요', authorName: '홍길동' }} />);
    expect(screen.getByText('정말 맛있어요')).toBeInTheDocument();
    expect(screen.getByText('— 홍길동')).toBeInTheDocument();
  });
});

describe('RestaurantCard rating fallback (Req 16.6)', () => {
  it('showRating이지만 rating이 없으면 "평점 정보 없음"을 표시한다', () => {
    const restaurant = makeRestaurant({ id: 'x', name: '평점없음 식당' }); // rating 없음
    render(<RestaurantCard restaurant={restaurant} showRating />);
    expect(screen.getByTestId('rating-area')).toBeInTheDocument();
    expect(screen.getByText('평점 정보 없음')).toBeInTheDocument();
  });
});

describe('LoadingScreen (Req 16.1)', () => {
  it('로딩 인디케이터와 안내 문구를 렌더링한다', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('도전자 소집 중')).toBeInTheDocument();
    expect(screen.getByText('조건에 맞는 식당을 찾고 있습니다...')).toBeInTheDocument();
  });

  it('message prop이 있으면 해당 메시지를 표시한다', () => {
    render(<LoadingScreen message="잠시만 기다려 주세요" />);
    expect(screen.getByText('잠시만 기다려 주세요')).toBeInTheDocument();
  });
});

describe('ErrorScreen (Req 16.2)', () => {
  it('오류 메시지와 다른 조건 선택 안내를 표시한다', () => {
    render(<ErrorScreen message="대결을 진행할 식당이 부족합니다." onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('대결을 진행할 식당이 부족합니다.')).toBeInTheDocument();
    expect(
      screen.getByText('다른 지역이나 음식 종류를 선택하면 더 많은 식당을 만날 수 있습니다.'),
    ).toBeInTheDocument();
  });
});
