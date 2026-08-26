# Requirements Document

## Introduction

LAST DISH STANDING("Only One Restaurant Survives.")은 사용자가 지역과 음식 종류를 선택한 뒤 여러 식당을 1:1로 비교하며 자신의 취향에 맞는 최종 식당 한 곳을 선택하는 게임형 맛집 탐색 웹서비스이다. 내부 게임 용어로는 "Restaurant Survival"로 표기되며, 제품명은 LAST DISH STANDING이다.

일반 맛집 검색과 달리 선택 전에는 평점을 숨겨 사진, 가격대, 대표 리뷰, 게임용 별명, 한 줄 소개를 근거로 사용자가 직접 판단하게 하고, 선택 후 두 식당의 실제 평점을 공개하여 대중적 평가와 자신의 취향을 비교하게 한다. 선택된 식당은 살아남아 새로운 도전자와 계속 경쟁하고, 마지막까지 살아남은 식당을 최종 Winner로 결정한다.

본 문서는 하루 안에 구현하는 단기 프로젝트의 요구사항을 정의하며, 세 개의 원본 문서(requirements.md, constraints.md, design-prompt.md)에 정의된 내용에만 근거한다. 원본에 없는 기능은 추가하지 않는다.

기술 스택은 React, TypeScript, Vite, Google Places API, HTML, CSS를 기본으로 하며, 스타일링 방식은 하나로 통일하고 불필요한 라이브러리를 추가하지 않는다.

## Glossary

- **LAST_DISH_STANDING**: 본 웹서비스 전체를 지칭하는 시스템. 제품명이자 게임 진행 주체.
- **Setup_Screen**: 음식 종류와 지역을 선택하고 게임을 시작하는 시작 화면(START / Lobby).
- **Places_Service**: Google Places API에서 식당을 검색하고 상세 정보를 확보하는 시스템 구성요소.
- **Quality_Gate**: 검색 결과 중 게임 참가 자격을 판정하는 후보 품질 검증 구성요소.
- **Roster**: 게임에 실제로 참가하도록 확정된 참가 식당의 집합(최소 2개, 최대 8개).
- **Battle_Screen**: 두 식당을 1:1로 비교하고 사용자가 하나를 선택하는 대결 화면.
- **Rating_Reveal**: 사용자가 선택한 이후 두 식당의 실제 평점과 비교 메시지를 공개하는 상태/화면.
- **CHAMPION**: 현재까지 살아남은 식당(CURRENT CHAMPION). 다음 도전자와 계속 경쟁한다.
- **CHALLENGER**: 현재 챔피언과 대결하는 새로운 도전자 식당.
- **WIN_STREAK**: 현재 챔피언의 연속 승리 횟수. 새로운 챔피언의 연승은 1부터 시작한다.
- **ELIMINATION**: 대결에서 선택받지 못해 탈락하는 것.
- **REVIVAL_ROUND**: 탈락 식당 중 하나를 부활시킬 수 있는 패자부활전. 조건 충족 시 게임당 최대 1회 제공.
- **SURVIVAL_TITLE**: 각 식당의 게임용 별명(survivalTitle). 실제 공식 별명이 아니다.
- **Survival_Summary**: 각 식당의 한 줄 소개(survivalSummary).
- **WINNER**: 모든 대결이 종료된 후 마지막까지 살아남은 최종 식당.
- **Rule_Based_Generator**: 규칙 기반(키워드/템플릿) 별명 및 한 줄 소개 생성 구성요소.
- **Restaurant**: 게임에서 사용하는 식당 데이터 구조. 필드: id, name, address?, category?, photoUrl?, priceLevel?, rating?, userRatingCount?, reviews(text, rating?, authorName?), survivalTitle, survivalSummary, googleMapsUrl?.
- **Game_Status**: 게임 상태 값 집합. `setup` | `loading` | `playing` | `ratingReveal` | `revival` | `finished` | `error`.

## Requirements

### Requirement 1: 음식 종류 및 지역 선택

**User Story:** 사용자로서 나는 음식 종류와 지역을 지정하고 싶다, 그래야 원하는 조건으로 게임을 시작할 수 있다.

#### Acceptance Criteria

1. THE Setup_Screen SHALL 한식, 일식, 중식, 이탈리안, 프렌치, 양식, 카페, 디저트 중 하나의 음식 종류를 선택할 수 있는 UI를 제공한다.
2. THE Setup_Screen SHALL 한 번에 하나의 음식 종류만 선택 상태로 유지한다.
3. THE Setup_Screen SHALL 사용자가 지역을 직접 입력하거나 미리 제공된 지역(성수, 강남, 홍대, 잠실, 이태원) 중 하나를 선택할 수 있는 UI를 제공한다.
4. WHILE 음식 종류와 지역 중 하나 이상이 지정되지 않은 상태, THE Setup_Screen SHALL 게임 시작 버튼을 비활성화한다.
5. WHILE 음식 종류와 지역이 모두 지정된 상태, THE Setup_Screen SHALL 게임 시작 버튼을 활성화한다.

### Requirement 2: Google Places 식당 검색 및 데이터 확보

**User Story:** 사용자로서 나는 실제 식당 데이터로 게임하고 싶다, 그래야 신뢰할 수 있는 정보로 선택할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 게임 시작 버튼을 누른다, THE Places_Service SHALL 지정된 지역과 음식 종류를 기반으로 Google Places API에서 식당을 검색한다.
2. THE Places_Service SHALL 식당명, 카테고리, 주소, 대표 사진, 가격대, 평점, 리뷰 수, 리뷰, Google Maps 링크를 확보 대상 정보로 요청한다.
3. WHERE 요청이 Field Mask를 지원한다, THE Places_Service SHALL 화면과 게임 로직에서 사용하는 필드만 지정하여 요청한다.
4. THE Places_Service SHALL Google Places API가 제공하지 않는 실제 식당 정보를 생성하지 않고, Google Places API를 통해 제공받은 리뷰만 사용한다.

### Requirement 3: 후보 품질 검증

**User Story:** 사용자로서 나는 비교할 정보가 충분한 식당만 만나고 싶다, 그래야 의미 있는 선택을 할 수 있다.

#### Acceptance Criteria

1. THE Quality_Gate SHALL 대표 사진, 리뷰, 가격대 세 가지를 핵심 비교 정보로 판정한다.
2. WHERE 한 식당이 대표 사진, 리뷰, 가격대 중 2개 이상을 확보하였다, THE Quality_Gate SHALL 해당 식당을 게임 후보로 판정한다.
3. IF 한 식당이 대표 사진, 리뷰, 가격대 중 1개 이하만 확보하였다, THEN THE Quality_Gate SHALL 해당 식당을 게임 후보에서 제외한다.
4. THE Quality_Gate SHALL 후보 수를 채우기 위해 품질 조건을 완화하거나 조건 미달 식당을 추가하지 않는다.

### Requirement 4: 동적 참가 식당 수 결정

**User Story:** 사용자로서 나는 확보된 식당 수만큼 게임을 진행하고 싶다, 그래야 조건이 부족해도 플레이할 수 있다.

#### Acceptance Criteria

1. WHERE 품질 조건을 만족한 식당이 8개 이상이다, THE LAST_DISH_STANDING SHALL 품질 조건을 만족한 식당 중 8개를 선정하여 Roster를 정확히 8개로 확정한다.
2. WHERE 품질 조건을 만족한 식당이 2개 이상 7개 이하이다, THE LAST_DISH_STANDING SHALL 품질 조건을 만족한 모든 식당(2개~7개)만으로 Roster를 확정하고 조건 미달 식당을 추가하지 않는다.
3. IF 품질 조건을 만족한 식당이 2개 미만이다, THEN THE LAST_DISH_STANDING SHALL Game_Status를 `playing`으로 전환하지 않고, 확보된 식당 데이터를 유지한 상태로 다른 지역이나 음식 종류 선택을 안내하는 메시지를 표시한다.
4. THE LAST_DISH_STANDING SHALL 동일 Place ID를 가진 식당이 Roster에 두 번 이상 포함되지 않도록 하여, Roster 내 각 Place ID가 유일하도록 한다.
5. WHEN Roster가 확정된다, THE LAST_DISH_STANDING SHALL 확정된 모든 참가 식당(2개~8개)을 포함하는 상태에서 참가 식당의 대결 등장 순서를 무작위로 재배치한다.

### Requirement 5: 별명 및 한 줄 소개 생성

**User Story:** 사용자로서 나는 각 식당의 게임용 별명과 한 줄 소개를 보고 싶다, 그래야 경연 참가자처럼 식당을 판단할 수 있다.

#### Acceptance Criteria

1. WHEN Roster가 확정된다, THE Rule_Based_Generator SHALL 각 식당에 대해 규칙 기반(키워드/템플릿)으로 SURVIVAL_TITLE과 Survival_Summary를 게임 시작 전에 생성한다.
2. THE Rule_Based_Generator SHALL 별명과 한 줄 소개 생성에 음식 카테고리, 지역, 가격대, Google Places 리뷰, 리뷰에서 확인 가능한 특징만 사용한다.
3. THE Rule_Based_Generator SHALL SURVIVAL_TITLE을 6자에서 18자 범위 내로 생성한다.
4. THE Rule_Based_Generator SHALL 존재하지 않는 메뉴, 서비스, 시설, 셰프 정보, 수상 기록을 생성하지 않고, 사실 확인이 어려운 최상급 표현(예: "서울 최고", "미슐랭급")을 사용하지 않는다.
5. IF 특징을 판단할 정보가 부족하다, THEN THE Rule_Based_Generator SHALL 별명 fallback(예: "오늘의 도전자")과 한 줄 소개 fallback(예: "현재 검색 조건에 맞는 식당 후보입니다.")을 사용한다.
6. THE LAST_DISH_STANDING SHALL 별명과 한 줄 소개가 게임용 표현임을 알리는 안내를 서비스 내 적절한 위치에 1회 이상 표시한다.

### Requirement 6: 게임 데이터 메모리 저장 및 API 재호출 금지

**User Story:** 사용자로서 나는 게임이 빠르고 API 비용이 낮기를 원한다, 그래야 원활하게 플레이할 수 있다.

#### Acceptance Criteria

1. WHEN Roster와 별명·한 줄 소개가 생성된다, THE LAST_DISH_STANDING SHALL Restaurant 데이터를 현재 게임 세션의 클라이언트 메모리에 저장한다.
2. WHILE 대결, 평점 공개, 패자부활전, Winner 화면이 진행되는 상태, THE Places_Service SHALL Google Places API를 다시 호출하지 않는다.
3. THE Places_Service SHALL 동일 Place ID에 대해 같은 정보를 반복 요청하지 않는다.
4. WHILE 게임이 진행되는 상태, THE LAST_DISH_STANDING SHALL 메모리에 저장된 Restaurant 데이터를 재사용한다.

### Requirement 7: 동적 라운드 구성

**User Story:** 사용자로서 나는 참가 식당 수에 맞는 라운드로 진행하고 싶다, 그래야 게임 진행 정보가 정확하다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL 일반 대결 수를 `참가 식당 수 - 1`로 계산하며, 참가 식당 수가 2개~8개인 경우 일반 대결 수는 1~7이 되도록 한다.
2. THE LAST_DISH_STANDING SHALL 참가 식당 수나 전체 일반 라운드 수를 코드에 고정 값(예: 8, 7)으로 하드코딩하지 않고, 확정된 참가 식당 수로부터 계산한다.
3. WHEN Roster가 확정되어 대결이 시작된다, THE Battle_Screen SHALL 전체 라운드 수를 `참가 식당 수 - 1`로 계산된 동적 값(1~7)으로 표시한다.
4. WHERE 참가 식당 수가 2개에서 8개 사이이다, THE LAST_DISH_STANDING SHALL 참가 식당 수와 무관하게 대결 수를 `참가 식당 수 - 1`로 계산하고, 모든 참가 식당이 최소 한 번 대결에 등장하도록 하며, 마지막에 한 개의 WINNER를 결정한다.

### Requirement 8: 대결 화면 및 선택 전 정보 공개

**User Story:** 사용자로서 나는 평점 없이 두 식당을 비교하고 싶다, 그래야 평점 편향 없이 직관으로 선택할 수 있다.

#### Acceptance Criteria

1. WHILE 대결이 진행되는 `playing` 상태, THE Battle_Screen SHALL 두 식당의 SURVIVAL_TITLE, 대표 이미지, 식당명, 카테고리, 위치, 가격대, Survival_Summary, 대표 리뷰를 표시한다.
2. WHILE 대결이 진행되는 `playing` 상태, THE Battle_Screen SHALL 평점, 리뷰 평균 점수, 평점 비교 결과를 표시하지 않는다.
3. WHILE 대결이 진행되는 `playing` 상태, THE Battle_Screen SHALL 평점 컴포넌트를 렌더링하지 않는다.
4. THE Battle_Screen SHALL 각 식당에 대해 하나의 선택 UI를 제공한다.

### Requirement 9: 식당 선택 및 승자 결정

**User Story:** 사용자로서 나는 마음에 드는 식당을 직접 선택하고 싶다, 그래야 내 취향이 결과에 반영된다.

#### Acceptance Criteria

1. WHEN 사용자가 대결(playing 상태)에서 두 식당 중 하나를 선택한다, THE LAST_DISH_STANDING SHALL 선택한 식당을 해당 대결의 승자로 결정한다.
2. THE LAST_DISH_STANDING SHALL 두 식당의 평점 값과 무관하게 사용자가 선택한 식당을 항상 승자로 결정한다.
3. WHEN 한 식당이 승자로 결정된다, THE LAST_DISH_STANDING SHALL 대결에 참여한 다른 한 식당을 탈락(ELIMINATION) 상태로 처리한다.
4. THE LAST_DISH_STANDING SHALL 한 대결에서 사용자 선택을 정확히 한 번만 처리하고, 시스템이 승자를 자동으로 선택하거나 최종 식당을 자동 추천하지 않는다.
5. IF 한 대결에서 이미 선택이 한 번 처리된 이후 추가 선택 입력이 발생한다, THEN THE LAST_DISH_STANDING SHALL 해당 추가 입력을 무시하고 최초로 처리된 선택 결과를 변경하지 않는다.
6. WHEN 대결에서 선택이 처리된다, THE LAST_DISH_STANDING SHALL 다음 대결로 이동하지 않고 먼저 ratingReveal 상태로 전환한다.

### Requirement 10: 선택 후 평점 공개 및 비교 메시지

**User Story:** 사용자로서 나는 선택 후 평점을 확인하고 싶다, 그래야 내 취향과 대중 평가를 비교할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 대결에서 식당을 선택한다, THE Rating_Reveal SHALL 대결에 참여한 두 식당의 실제 평점과 각 식당의 리뷰 수를 동시에 공개한다.
2. IF 두 식당의 평점이 모두 존재하고 선택 식당의 평점이 상대 식당보다 높다, THEN THE Rating_Reveal SHALL 대중적 평가와 사용자의 선택이 일치했음을 나타내는 메시지를 표시한다.
3. IF 두 식당의 평점이 모두 존재하고 선택 식당의 평점이 상대 식당보다 낮다, THEN THE Rating_Reveal SHALL 평점보다 사용자의 취향이 선택 식당이었음을 나타내는 메시지를 표시한다.
4. IF 두 식당의 평점이 모두 존재하고 서로 동일하다, THEN THE Rating_Reveal SHALL 평점은 같지만 사용자의 선택은 해당 식당이었음을 나타내는 메시지를 표시한다.
5. IF 두 식당 중 하나 이상의 평점 값이 존재하지 않는다, THEN THE Rating_Reveal SHALL 평점 비교 정보가 부족함을 나타내는 메시지를 표시하고 사용자의 선택을 기준으로 대결 결과를 유지한다.
6. THE Rating_Reveal SHALL 평점 비교 결과가 승자 결정에 영향을 주지 않도록 하고, 다음 대결로 이동하는 CTA를 제공한다.

### Requirement 11: Survival 진행 및 챔피언 연승

**User Story:** 사용자로서 나는 승자가 계속 도전자와 경쟁하는 것을 보고 싶다, 그래야 서바이벌 경연처럼 즐길 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL 현재 생존 식당을 CHAMPION으로 관리하고, 챔피언이 다음 도전자와 계속 경쟁하는 연승 방식으로 진행한다.
2. WHEN 사용자가 다음 대결을 진행한다, THE LAST_DISH_STANDING SHALL 현재 CHAMPION과 새로운 CHALLENGER의 대결을 구성한다.
3. WHEN CHAMPION이 다시 승리한다, THE LAST_DISH_STANDING SHALL 해당 챔피언의 WIN_STREAK를 1 증가시킨다.
4. WHEN CHAMPION이 패배한다, THE LAST_DISH_STANDING SHALL 새로운 승자를 CHAMPION으로 지정하고 WIN_STREAK를 1로 설정한다.
5. THE LAST_DISH_STANDING SHALL 모든 일반 후보 식당이 최소 한 번 대결에 등장하도록 한다.

### Requirement 12: 패자부활전 활성화 조건 및 시점

**User Story:** 사용자로서 나는 규모가 큰 게임에서 한 번 부활 기회를 갖고 싶다, 그래야 탈락한 식당을 다시 볼 수 있다.

#### Acceptance Criteria

1. WHERE 게임 시작 시 확정된 Roster가 6개 이상 8개 이하이다, THE LAST_DISH_STANDING SHALL 하나의 게임 세션당 정확히 1회에 한하여 REVIVAL_ROUND를 제공한다.
2. WHERE 게임 시작 시 확정된 Roster가 2개 이상 5개 이하이다, THE LAST_DISH_STANDING SHALL REVIVAL_ROUND를 제공하지 않는다.
3. IF 누적 탈락(ELIMINATION) 식당 수가 3개 미만이다, THEN THE LAST_DISH_STANDING SHALL REVIVAL_ROUND를 실행하지 않고 일반 대결을 계속 진행한다.
4. WHERE 확정된 Roster가 8개이다, THE LAST_DISH_STANDING SHALL 4번째 일반 대결이 종료되어 누적 탈락 식당 수가 4개가 된 시점에 REVIVAL_ROUND를 1회 실행한다.
5. WHERE 확정된 Roster가 6개 또는 7개이다, THE LAST_DISH_STANDING SHALL 누적 탈락 식당 수가 3개에 도달한 직후의 대결 종료 시점에 REVIVAL_ROUND를 1회 실행한다.
6. IF REVIVAL_ROUND가 이미 1회 실행된 게임 세션이다, THEN THE LAST_DISH_STANDING SHALL 추가 REVIVAL_ROUND를 실행하지 않는다.

### Requirement 13: 패자부활전 후보 및 선택

**User Story:** 사용자로서 나는 탈락 식당 중 하나를 부활시키거나 건너뛰고 싶다, 그래야 진행 방식을 스스로 조절할 수 있다.

#### Acceptance Criteria

1. WHEN REVIVAL_ROUND가 시작된다, THE LAST_DISH_STANDING SHALL 현재까지 탈락한 식당만을 후보 대상으로 하고 현재 CHAMPION을 후보에서 제외한다.
2. WHERE 탈락 식당이 3개를 초과한다, THE LAST_DISH_STANDING SHALL 탈락 식당 중 무작위로 3개를 선택하여 후보로 표시한다.
3. WHERE 탈락 식당이 1개 이상 3개 이하이다, THE LAST_DISH_STANDING SHALL 해당 탈락 식당 전부를 후보로 표시한다.
4. THE REVIVAL_ROUND SHALL 각 후보에 대해 SURVIVAL_TITLE, 식당명, 대표 이미지, Survival_Summary를 표시한다.
5. WHEN 사용자가 후보 하나를 선택한다, THE LAST_DISH_STANDING SHALL 해당 식당을 부활시켜 현재 CHAMPION의 다음 CHALLENGER로 등장시킨다.
6. WHEN 사용자가 건너뛰기를 선택한다, THE LAST_DISH_STANDING SHALL 부활 없이 상태를 `playing`으로 전환하여 일반 게임 진행으로 복귀한다.
7. THE LAST_DISH_STANDING SHALL REVIVAL_ROUND에서 Google Places API를 다시 호출하지 않고 메모리에 저장된 탈락 식당 데이터를 그대로 사용한다.
8. IF 부활한 식당이 이후 대결에서 다시 패배한다, THEN THE LAST_DISH_STANDING SHALL 해당 게임 세션에서 추가 부활 기회를 제공하지 않는다.
9. THE LAST_DISH_STANDING SHALL 하나의 게임 세션에서 부활하는 식당을 최대 1개로 제한한다.

### Requirement 14: 최종 Winner 결정 및 표시

**User Story:** 사용자로서 나는 마지막까지 살아남은 식당의 전체 정보를 보고 싶다, 그래야 결과를 확인하고 방문할 수 있다.

#### Acceptance Criteria

1. WHEN 모든 일반 도전자와 필요한 패자부활 대결이 종료된다, THE LAST_DISH_STANDING SHALL 현재 CHAMPION을 WINNER로 결정하고 상태를 `finished`로 전환한다.
2. THE WinnerScreen SHALL WINNER의 대표 사진, SURVIVAL_TITLE, 식당명, 카테고리, 위치, 평점, 리뷰 수, 가격대, 한 줄 소개, WIN_STREAK, 승리 횟수, 전체 대결 라운드를 표시한다.
3. THE WinnerScreen SHALL WINNER의 Google Maps 링크를 제공한다.

### Requirement 15: 다시 시작

**User Story:** 사용자로서 나는 다시 플레이하거나 새 게임을 시작하고 싶다, 그래야 반복해서 즐길 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 같은 조건으로 다시하기를 선택한다, THE LAST_DISH_STANDING SHALL 지역과 음식 종류를 유지한 상태로 후보 순서를 다시 섞고 모든 게임 상태를 초기화한다.
2. WHEN 사용자가 새로운 게임을 선택한다, THE LAST_DISH_STANDING SHALL 지역과 음식 종류를 초기화하고 게임 상태를 초기화한 뒤 Setup_Screen으로 이동한다.

### Requirement 16: 로딩 상태 및 오류·fallback 처리

**User Story:** 사용자로서 나는 데이터가 없거나 로딩 중일 때도 명확한 안내를 받고 싶다, 그래야 혼란 없이 진행할 수 있다.

#### Acceptance Criteria

1. WHILE Google Places API 요청이 진행되는 `loading` 상태, THE LAST_DISH_STANDING SHALL 로딩 상태를 표시하고 게임 시작 버튼을 다시 누를 수 없도록 비활성화한다.
2. IF 품질 조건을 만족한 식당이 2개 미만이다, THEN THE LAST_DISH_STANDING SHALL 대결 진행 식당이 부족하다는 메시지와 다른 조건 선택 안내를 표시한다.
3. IF 식당의 사진이 없다, THEN THE LAST_DISH_STANDING SHALL 기본 placeholder 이미지를 표시한다.
4. IF 식당의 리뷰가 없다, THEN THE LAST_DISH_STANDING SHALL 표시할 수 있는 리뷰가 없다는 안내를 표시한다.
5. IF 식당의 가격대가 없다, THEN THE LAST_DISH_STANDING SHALL 가격 정보 없음을 표시한다.
6. IF 식당의 평점이 없다, THEN THE LAST_DISH_STANDING SHALL 평점 정보 없음을 표시한다.
7. WHERE 일부 데이터가 누락되었으나 품질 조건을 통과하였다, THE LAST_DISH_STANDING SHALL 게임을 정상적으로 진행한다.

### Requirement 17: 게임 상태 및 클라이언트 관리

**User Story:** 개발자로서 나는 명확한 게임 상태로 흐름을 관리하고 싶다, 그래야 UI 상태와 게임 상태를 분리할 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL Game_Status를 `setup`, `loading`, `playing`, `ratingReveal`, `revival`, `finished`, `error` 값으로 관리한다.
2. WHEN 사용자가 `playing` 상태에서 식당을 선택한다, THE LAST_DISH_STANDING SHALL 상태를 `ratingReveal`로 전환하고, 다음 대결 진행 시 다시 `playing`으로 전환한다.
3. WHERE 패자부활전 실행 시점이다, THE LAST_DISH_STANDING SHALL `ratingReveal`에서 `revival`로 전환한 뒤 `playing`으로 전환한다.
4. THE LAST_DISH_STANDING SHALL 게임 상태를 현재 클라이언트 세션에서 React 기본 상태 관리 기능으로 관리하고, 별도의 전역 상태 관리 라이브러리나 백엔드/데이터베이스를 필수로 사용하지 않는다.

### Requirement 18: API Key 보안

**User Story:** 개발자로서 나는 API Key를 안전하게 다루고 싶다, 그래야 키 오남용 위험을 줄일 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL Google Maps Platform API Key를 코드에 문자열로 하드코딩하지 않고 환경 변수 `VITE_GOOGLE_MAPS_API_KEY`로 관리한다.
2. THE LAST_DISH_STANDING SHALL `.env` 파일을 Git 저장소에 커밋하지 않고, 필요한 경우 `.env.example`만 저장소에 포함한다.
3. THE LAST_DISH_STANDING SHALL `VITE_` 환경 변수가 빌드된 클라이언트에서 노출된다는 점을 전제로, Google Cloud Console에서 HTTP referrer 제한, 사용 API 제한, 개발용 localhost 허용을 포함한 키 제한에 의존한다.

### Requirement 19: UI/UX 디자인 및 반응형

**User Story:** 사용자로서 나는 요리 서바이벌 게임쇼처럼 느껴지는 화면을 원한다, 그래야 몰입감 있게 플레이할 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL 어두운 무대(BLACK 배경) 기반의 시네마틱한 게임쇼 분위기로 화면을 구성하고, 파스텔·밝은 전체 배경·배달 앱·일반 맛집 검색·과도한 Glassmorphism 스타일을 사용하지 않는다.
2. THE LAST_DISH_STANDING SHALL 컬러 의미를 일관되게 유지한다: GOLD는 Winner/Champion/WIN_STREAK, RED는 VS/Battle/Elimination/Revival, GRAY는 Eliminated.
3. WHEN 사용자가 식당을 선택한다, THE LAST_DISH_STANDING SHALL 승자 카드에 Spotlight ON(Gold Border/Glow)을, 패자 카드에 Spotlight OFF(어둡게/채도 감소)를 적용한다.
4. THE LAST_DISH_STANDING SHALL START, BATTLE, RATING REVEAL, NEW CHAMPION, NEXT CHALLENGER, ELIMINATION, REVIVAL ROUND, REVIVED CHALLENGER, FINAL WINNER 화면 상태를 제공하고, 재사용 가능한 컴포넌트(StartScreen, BattleScreen, RestaurantCard, RoundIndicator, VersusIndicator, Spotlight, RatingReveal, ChampionReveal, RevivalRound, WinnerScreen)로 구성한다.
5. THE LAST_DISH_STANDING SHALL 상태 변화 연출에 200ms에서 600ms 범위의 가벼운 CSS transition/animation만 사용하고 WebGL이나 3D 효과를 사용하지 않는다.
6. WHERE PC 환경이다, THE Battle_Screen SHALL 두 식당을 좌우로 배치한다.
7. WHERE 모바일 환경이다, THE Battle_Screen SHALL 두 식당을 세로로 배치할 수 있으며 최소 화면 폭 360px를 지원한다.
8. THE LAST_DISH_STANDING SHALL 특정 방송 프로그램의 로고, 그래픽, 고유 UI를 직접 복제하지 않는다.

### Requirement 20: 개인정보 및 구현 제외 범위

**User Story:** 사용자로서 나는 로그인이나 개인정보 없이 즉시 플레이하고 싶다, 그래야 부담 없이 게임을 즐길 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL 이름, 이메일, 전화번호, 생년월일, 계정 정보 등 개인정보를 수집하지 않고 로그인 및 회원가입을 제공하지 않는다.
2. THE LAST_DISH_STANDING SHALL GPS 기반 현재 위치를 자동 수집하지 않고 사용자가 직접 지역을 지정하도록 한다.
3. THE LAST_DISH_STANDING SHALL 다음 기능을 구현하지 않는다: 로그인, 회원가입, 소셜 로그인, 사용자 인증, 사용자 프로필, 관리자 화면, 실제 데이터베이스, AI/ML 맛집 추천, AI 리뷰 분석/요약, LLM 기반 별명 생성 필수화, 자체 리뷰 작성, 댓글, 좋아요, 예약, 결제, 배달, 주문, 전체 메뉴판, 실시간 웨이팅/좌석, GPS 실시간 위치, 길찾기, 친구 초대, 멀티플레이, 실시간 대전, 웹 크롤링.

### Requirement 21: MVP 완료 기준 (Definition of Done)

**User Story:** 개발자로서 나는 명확한 완료 기준을 원한다, 그래야 하루 안에 핵심 흐름을 완성했는지 판단할 수 있다.

#### Acceptance Criteria

1. THE LAST_DISH_STANDING SHALL 지역 지정, 음식 종류 선택, Google Places API 실제 검색, 품질 조건(2개 이상) 통과 식당만 후보 사용, 최대 8개·최소 2개 참가, 2개 미만 시 시작 불가를 만족한다.
2. THE LAST_DISH_STANDING SHALL 실제 참가자 수에 따른 동적 라운드 결정, 라운드 수 비하드코딩, 식당별 별명과 한 줄 소개 표시, 두 식당 비교, 선택 전 평점 미표시, 사진·가격대·대표 리뷰 제공을 만족한다.
3. THE LAST_DISH_STANDING SHALL 단일 식당 선택, 중복 선택 방지, 선택 후 평점 공개, 평점 비교 메시지, 평점과 무관한 사용자 선택 승리, 승자의 연속 도전을 만족한다.
4. THE LAST_DISH_STANDING SHALL 참가 6개 이상 시 패자부활전 1회 제공, 2~5개 시 미제공, 패자부활전 건너뛰기, 마지막 생존 식당 Winner 결정, Winner 전체 정보와 Google Maps 링크 제공을 만족한다.
5. THE LAST_DISH_STANDING SHALL API 데이터 일부 누락 시 적절한 fallback 표시, 모바일과 PC에서 핵심 기능 사용 가능을 만족한다.
6. WHERE 구현 시간이 부족하다, THE LAST_DISH_STANDING SHALL 패자부활전과 애니메이션보다 핵심 게임 루프(지역·음식 선택 → 검색 → 품질 검증 → 참가자 결정 → 별명·소개 생성 → 메모리 저장 → 1:1 대결 → 선택 → 평점 공개 → 승자 생존·다음 도전자 → 동적 라운드 → Winner)를 우선 완성한다.
