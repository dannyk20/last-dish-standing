// 게임 상태 머신 action 타입 정의 (LAST DISH STANDING)
// 설계 문서 "상태 머신 정의 > 액션 / 이벤트" 표 및 상태 다이어그램 기준.
//
// 리듀서는 순수 함수 (state, action) => GameState 이며, 아래 action 들만
// 상태 전이의 입력이 된다. 화면(Screen)은 상태를 직접 변경하지 않고 이
// action 들을 dispatch 한다.
import type { Restaurant, SetupInput } from '../types';

/**
 * Setup 화면에서 시작 버튼 클릭.
 * `setup` → `loading`. 선택한 지역·음식 종류를 저장한다.
 * _Requirements: 6.1_
 */
export interface StartGameAction {
  type: 'START_GAME';
  setup: SetupInput;
}

/**
 * 검색·정규화·품질검증·Roster·별명 생성이 모두 완료(참가 2개 이상)된 시점.
 * `loading` → `playing`. 이미 buildRoster + shuffle 로 확정·셔플된 참가 식당
 * 배열을 payload 로 전달한다(리듀서는 여기서 다시 셔플하지 않는다).
 * _Requirements: 4.3, 6.4, 11.1, 11.2, 17.1_
 */
export interface LoadSuccessAction {
  type: 'LOAD_SUCCESS';
  /** buildRoster + shuffle 를 거친 참가 식당(등장 순서대로). 길이 >= 2. */
  roster: Restaurant[];
}

/**
 * 검색 실패 또는 품질 통과 식당 2개 미만.
 * `loading` → `error`. 안내 메시지를 저장한다(확보 데이터는 유지).
 * _Requirements: 4.3_
 */
export interface LoadErrorAction {
  type: 'LOAD_ERROR';
  message: string;
}

/**
 * `playing` 상태에서 식당 선택. `status !== 'playing'` 이면 무시된다(중복 클릭 가드).
 * 선택 식당=승자, 상대=탈락. `playing` → `ratingReveal`.
 * _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.3, 11.4, 17.2_
 */
export interface SelectRestaurantAction {
  type: 'SELECT_RESTAURANT';
  /** 사용자가 선택한(=승자) 식당 id. 챔피언 또는 도전자 중 하나여야 한다. */
  id: string;
}

/**
 * `ratingReveal`에서 다음 CTA. 내부에서 부활 트리거/다음 도전자/종료를 분기한다.
 * 부활 후보 산출 시 무작위 선택이 필요하면 셔플된 후보 id 목록을 주입할 수 있다.
 * _Requirements: 9.6, 13.1, 13.2, 13.3, 17.2, 17.3_
 */
export interface RevealNextAction {
  type: 'REVEAL_NEXT';
  /**
   * 부활 후보가 3개를 초과할 때 무작위 3개를 선정하기 위한, 이미 셔플된
   * 탈락 식당 id 목록(선택). 미제공 시 탈락 등록 순서 기준으로 앞에서 선정한다.
   */
  shuffledEliminated?: string[];
}

/**
 * `REVEAL_NEXT` 내부 분기에서 부활 조건 충족 시 진입. `ratingReveal` → `revival`.
 * 탈락 식당에서 후보(최대 3개, 챔피언 제외)를 산출한다.
 * _Requirements: 13.1, 13.2, 13.3_
 */
export interface EnterRevivalAction {
  type: 'ENTER_REVIVAL';
  /** 후보가 3개 초과일 때 무작위 3개 선정을 위한 셔플된 탈락 id 목록(선택). */
  shuffledEliminated?: string[];
}

/**
 * 부활 후보 선택. 선택 식당을 다음 도전자로, `revivalUsed=true`.
 * `revival` → `playing` (`currentRound++`).
 * _Requirements: 13.5, 13.6, 13.8, 13.9_
 */
export interface ReviveRestaurantAction {
  type: 'REVIVE_RESTAURANT';
  /** 부활시킬 탈락 식당 id. revivalCandidates 중 하나여야 한다. */
  id: string;
}

/**
 * 부활 건너뛰기. `revivalUsed=true`, 다음 일반 도전자로 진행(없으면 종료).
 * `revival` → `playing` (`currentRound++`) 또는 `finished`.
 * _Requirements: 13.8, 13.9_
 */
export interface SkipRevivalAction {
  type: 'SKIP_REVIVAL';
}

/**
 * 모든 대결 종료. `ratingReveal` → `finished`. 현재 챔피언을 Winner로 확정.
 * _Requirements: 14.1_
 */
export interface FinishAction {
  type: 'FINISH';
}

/**
 * 같은 조건으로 다시 시작. 지역·음식 유지, 순서 재셔플을 위해 `loading`으로 초기화.
 * _Requirements: 15.1_
 */
export interface RestartSameAction {
  type: 'RESTART_SAME';
}

/**
 * 새 게임. 전체 상태 초기화 → `setup`.
 * _Requirements: 15.2_
 */
export interface RestartNewAction {
  type: 'RESTART_NEW';
}

/**
 * 게임 상태 머신 action 유니온.
 */
export type GameAction =
  | StartGameAction
  | LoadSuccessAction
  | LoadErrorAction
  | SelectRestaurantAction
  | RevealNextAction
  | EnterRevivalAction
  | ReviveRestaurantAction
  | SkipRevivalAction
  | FinishAction
  | RestartSameAction
  | RestartNewAction;

export type GameActionType = GameAction['type'];
