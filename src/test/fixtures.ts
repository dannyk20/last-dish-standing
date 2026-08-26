// 테스트용 최소 Restaurant 픽스처 헬퍼.
import type { Restaurant } from '../types';

/**
 * 필수 필드(id, name, reviews, survivalTitle, survivalSummary)를 채운 최소 Restaurant를
 * 생성한다. overrides로 선택 필드(rating, priceLevel, photoUrl 등)를 덮어쓸 수 있다.
 */
export function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    name: '테스트 식당',
    reviews: [],
    survivalTitle: '오늘의 도전자',
    survivalSummary: '현재 검색 조건에 맞는 식당 후보입니다.',
    ...overrides,
  };
}
