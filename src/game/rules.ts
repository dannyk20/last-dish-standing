// 게임 로직 순수 함수 (LAST DISH STANDING)
// 설계 문서 "Quality Gate / Roster Builder / 라운드 계산" 섹션 기준
import type { Restaurant, RestaurantReview } from '../types';

/**
 * 후보 품질 검증 (Quality_Gate).
 *
 * 대표 사진(photoUrl), 리뷰(reviews), 가격대(priceLevel) 세 가지를 핵심 비교
 * 정보로 판정하고, 이 중 2개 이상을 확보한 식당만 게임 후보(true)로 판정한다.
 * 1개 이하만 확보한 식당은 후보에서 제외한다(false).
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4_
 */
export function passesQualityGate(r: {
  photoUrl?: string;
  reviews: RestaurantReview[];
  priceLevel?: number;
}): boolean {
  const hasPhoto = !!r.photoUrl;
  const hasReview = r.reviews.length > 0;
  const hasPrice = r.priceLevel !== undefined;
  return [hasPhoto, hasReview, hasPrice].filter(Boolean).length >= 2;
}
/**
 * Roster 구성 (Roster_Builder).
 *
 * 후보 배열에서 게임에 참가할 Roster를 확정한다. 동일 Place ID(id)를 가진
 * 중복 후보는 최초 등장 항목만 남기고 제거한 뒤, 최대 8개까지만 선정한다.
 *
 * - 중복 제거 후 8개 이상이면 앞에서 8개를 선정한다.
 * - 중복 제거 후 2~7개이면 전부 사용한다.
 * - 조건 미달 후보를 임의로 채워 넣지 않는다.
 *
 * 반환 Roster 내 각 Place ID는 유일하며, 길이는 [0, 8] 범위이다.
 * (등장 순서 무작위 셔플은 리듀서 단계에서 별도로 수행한다.)
 *
 * _Requirements: 4.1, 4.2, 4.4_
 */
export function buildRoster(candidates: Restaurant[]): Restaurant[] {
  const seen = new Set<string>();
  const deduped: Restaurant[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    deduped.push(candidate);
  }
  return deduped.slice(0, 8);
}

/**
 * 전체 일반 대결 수 계산.
 *
 * 참가 식당 수에서 1을 뺀 값을 반환한다. 대결 수를 상수로 하드코딩하지 않고
 * 참가 식당 수에 종속되도록 계산한다.
 *
 * _Requirements: 7.1, 7.2, 7.4_
 */
export function calcTotalRounds(participantCount: number): number {
  return participantCount - 1;
}

/**
 * 패자부활 트리거 평가 함수.
 *
 * 리듀서(`REVEAL_NEXT` 내부 분기)에서 패자부활전 진입 여부를 판정하기 위한
 * 순수 함수이다. 기본 조건은 `revivalEligible && !revivalUsed &&
 * eliminatedCount >= 3`이며, 여기에 시작 Roster 크기별 실행 시점 규칙을
 * 추가로 적용한다.
 *
 * - Roster 8개: 누적 탈락이 4개에 도달한 시점(4번째 일반 대결 종료)에 실행.
 * - Roster 6~7개: 누적 탈락이 3개에 도달한 직후 시점에 실행.
 * - Roster 6 미만이거나 위 조건 미충족 시 실행하지 않는다.
 * - 이미 1회 사용(revivalUsed)했으면 실행하지 않는다.
 *
 * _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
 */
export function shouldTriggerRevival(params: {
  rosterSize: number;
  revivalEligible: boolean;
  revivalUsed: boolean;
  eliminatedCount: number;
}): boolean {
  const { rosterSize, revivalEligible, revivalUsed, eliminatedCount } = params;

  // 기본 조건: 부활 자격이 있고, 아직 사용하지 않았으며, 누적 탈락 3개 이상.
  if (!revivalEligible || revivalUsed || eliminatedCount < 3) {
    return false;
  }

  // 시작 Roster 크기별 실행 시점 규칙.
  if (rosterSize >= 8) {
    // Roster 8개: 누적 탈락 4개 도달 시점에 실행.
    return eliminatedCount >= 4;
  }
  if (rosterSize >= 6) {
    // Roster 6~7개: 누적 탈락 3개 도달 직후 실행.
    return eliminatedCount >= 3;
  }

  // Roster 6 미만은 부활전을 실행하지 않는다.
  return false;
}
