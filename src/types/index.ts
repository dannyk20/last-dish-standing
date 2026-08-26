// 공용 타입 정의 (LAST DISH STANDING)
// 설계 문서 "Data Models" 및 "상태 머신 정의" 섹션 기준

export interface RestaurantReview {
  text: string;
  rating?: number;
  authorName?: string;
}

export interface Restaurant {
  id: string; // Google Place ID
  name: string;
  address?: string;
  category?: string;
  photoUrl?: string; // 대표 사진(photoUrls[0]과 동일). 하위 호환/단일 표시용.
  photoUrls?: string[]; // 최대 5장의 사진 URL(있는 경우). 갤러리 표시용.
  priceLevel?: number;
  rating?: number;
  userRatingCount?: number;
  reviews: RestaurantReview[];
  survivalTitle: string; // 게임용 별명 (6~18자, 또는 fallback)
  survivalSummary: string; // 게임용 한 줄 소개 (또는 fallback)
  googleMapsUrl?: string;
}

export type GameStatus =
  | 'setup'
  | 'loading'
  | 'playing'
  | 'ratingReveal'
  | 'revival'
  | 'finished'
  | 'error';

export interface SetupInput {
  foodType: string; // 한식 | 일식 | 중식 | 이탈리안 | 프렌치 | 양식 | 카페 | 디저트
  region: string; // 직접 입력 또는 프리셋(성수/강남/홍대/잠실/이태원)
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  round: number;
}

export type RatingComparison =
  | { kind: 'higher' } // 선택 식당 평점이 더 높음 (대중 평가와 일치)
  | { kind: 'lower' } // 선택 식당 평점이 더 낮음 (평점보다 내 취향)
  | { kind: 'equal' } // 평점 동일
  | { kind: 'insufficient' }; // 한쪽 이상 평점 없음

export interface GameState {
  status: GameStatus; // setup | loading | playing | ratingReveal | revival | finished | error
  setup: SetupInput; // { foodType, region }
  rosterOrder: string[]; // 확정된 참가 식당 id를 등장 순서대로 (셔플된 상태)
  restaurantsById: Record<string, Restaurant>; // 인메모리 저장소
  currentChampion: string | null; // 현재 챔피언 id
  currentChallenger: string | null; // 현재 도전자 id
  nextIndex: number; // rosterOrder에서 다음 도전자를 가리키는 인덱스
  currentRound: number; // 현재 일반 대결 번호 (1부터)
  totalRounds: number; // 참가 식당 수 - 1
  winStreak: number; // 현재 챔피언 연승
  winCount: number; // 현재 챔피언 누적 승리 횟수
  eliminated: string[]; // 탈락 식당 id 누적
  revivalEligible: boolean; // 게임 시작 시 Roster >= 6 이면 true
  revivalUsed: boolean; // 게임 세션당 1회 제한
  revivalCandidates: string[]; // 패자부활 후보(최대 3개)
  lastBattle: BattleResult | null; // 직전 대결 결과(승자/패자 id)
  selectedId: string | null; // 직전 선택된 식당 id
  error: string | null;
}
