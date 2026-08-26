// useGame 훅 (LAST DISH STANDING)
// 설계 문서 "게임 상태와 UI 상태의 분리" 기준.
//
// `useReducer` 를 래핑하여 게임 상태의 단일 진실 공급원(single source of truth)을
// 제공한다. `App` 컴포넌트가 이 훅을 소유하고, `state.status` 값에 따라 렌더링할
// 화면을 선택한다. 화면(Screen)은 상태를 직접 변경하지 않고 `dispatch` 로 action
// 만 올려보낸다.
//
// _Requirements: 17.4_
import { useReducer } from 'react';
import type { Dispatch } from 'react';
import type { GameState, SetupInput } from '../types';
import type { GameAction } from './actions';
import { reducer, createInitialState } from './reducer';

/** useGame 훅의 반환 형태. */
export interface UseGameResult {
  /** 게임 상태(읽기 전용으로 사용). */
  state: GameState;
  /** 게임 상태 머신에 action 을 전달하는 dispatch 함수. */
  dispatch: Dispatch<GameAction>;
}

/**
 * 게임 상태 머신을 구동하는 훅.
 *
 * `useReducer(reducer, createInitialState())` 를 래핑하여 `{ state, dispatch }`
 * 를 반환한다. 선택적으로 초기 setup(지역·음식) 값을 주입할 수 있다.
 *
 * 초기 상태는 lazy initializer 로 생성하여 매 렌더마다 새 객체를 만들지 않도록 한다.
 *
 * @param initialSetup 초기 setup(지역·음식) 값(선택).
 * @returns `{ state, dispatch }`
 */
export function useGame(initialSetup?: SetupInput): UseGameResult {
  const [state, dispatch] = useReducer(
    reducer,
    initialSetup,
    (setup) => createInitialState(setup),
  );

  return { state, dispatch };
}
