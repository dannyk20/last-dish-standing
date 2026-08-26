# LAST DISH STANDING UI/UX 구현 프롬프트

현재 `requirements.md`와 `constraints.md`에 정의된 기능과 게임 로직을 유지하면서 **LAST DISH STANDING**의 전체 UI/UX를 구현해주세요.

첨부한 레퍼런스 이미지의 화면 구성과 분위기를 주요 디자인 레퍼런스로 사용해주세요.

단순한 맛집 추천 서비스처럼 보이면 안 됩니다. 전체적으로 **요리 서바이벌 게임 / 경연 프로그램**을 플레이하는 것처럼 느껴져야 합니다.

기존 `requirements.md`와 `constraints.md`의 기능 요구사항이 최우선이며, 이번 요청은 주로 화면 디자인, 레이아웃, 인터랙션, 애니메이션을 구체화하기 위한 것입니다.

---

## 1. 전체 디자인 컨셉

### 프로젝트명

**LAST DISH STANDING**

### Subtitle

**Only One Restaurant Survives.**

### 핵심 디자인 키워드

- Restaurant Survival
- Cooking Competition
- Game Show
- Spotlight
- Champion
- Challenger
- Elimination
- Revival
- Final Winner
- Dark Stage
- Modern
- Cinematic
- High Contrast

일반적인 음식 배달 앱이나 맛집 검색 서비스처럼 밝은 배경에 카드를 나열하는 디자인을 사용하지 마세요.

사용자가 식당을 검색하는 것이 아니라 **“식당들이 무대에 올라와 경쟁하고 사용자가 심사위원이 되는 게임”**처럼 느껴져야 합니다.

---

## 2. 컬러 시스템

| 역할 | 색상 |
| --- | --- |
| 전체 배경 | `#0A0A0B` |
| 카드 / Surface | `#151518` |
| 보조 Surface | `#202024` |
| 기본 Border | `#34343A` |
| Primary Text | `#F5F5F5` |
| Secondary Text | `#A7A7AD` |
| Winner / Champion | `#F5B82E` |
| Winner Highlight | `#FFD866` |
| Battle / VS | `#E53935` |
| Elimination / Revival | `#FF3B30` |
| Eliminated | `#5A5A61` |

색상의 의미를 반드시 일관되게 유지해주세요.

- **GOLD** → Winner, Champion, Spotlight, Win Streak, Final Winner
- **RED** → VS, Battle, Elimination, Revival Round
- **GRAY** → Eliminated, Disabled, Spotlight OFF
- **BLACK** → Stage, Background

평상시 화면에서는 Gold 사용을 절제하고, 사용자가 식당을 선택하거나 Champion이 결정되는 순간 Gold가 강하게 등장하도록 구성해주세요.

---

## 3. 전체 게임 화면 구조

서비스는 다음 화면 상태를 중심으로 구성해주세요.

1. START
2. BATTLE
3. RATING REVEAL
4. NEW CHAMPION
5. NEXT CHALLENGER
6. ELIMINATION
7. REVIVAL ROUND
8. REVIVED CHALLENGER
9. FINAL WINNER

각 화면이 단순히 다른 페이지로 바뀌는 것이 아니라 **하나의 무대에서 게임이 계속 진행되는 것처럼** 시각적으로 연결되도록 만들어주세요.

---

## 4. START SCREEN

시작 화면은 어두운 무대 분위기로 구성해주세요.

중앙 상단:

**LAST DISH STANDING** 로고

그 아래:

**Only One Restaurant Survives.**

지역과 음식 종류를 선택하는 영역을 배치합니다.

```text
음식 종류
[ 프렌치 ▼ ]

지역
[ 성수 ▼ ]

[ GAME START ]
```

하단에 작은 안내를 표시합니다.

> 평점은 선택 후 공개됩니다.

시작 화면부터 일반 검색 서비스가 아니라 게임을 시작하는 **Lobby**처럼 보여야 합니다.

---

## 5. BATTLE SCREEN

이 화면이 프로젝트에서 가장 중요합니다.

화면 중앙을 기준으로 다음 구조를 사용해주세요.

```text
LEFT RESTAURANT
       VS
RIGHT RESTAURANT
```

예시:

```text
ROUND 1 / 7

두 식당 중 더 마음에 드는 곳을 선택하세요.

┌─────────────────┐        ┌─────────────────┐
│ SURVIVAL TITLE  │        │ SURVIVAL TITLE  │
│                 │        │                 │
│ Restaurant A    │        │ Restaurant B    │
│                 │   VS   │                 │
│ PHOTO           │        │ PHOTO           │
│                 │        │                 │
│ 가격대          │        │ 가격대          │
│ 한 줄 소개      │        │ 한 줄 소개      │
│ 대표 리뷰       │        │ 대표 리뷰       │
│                 │        │                 │
│ [이 식당 선택] │        │ [이 식당 선택] │
└─────────────────┘        └─────────────────┘
```

두 카드는 최대한 대칭적으로 배치해주세요.

중앙에는 큰 `VS`를 배치하고 RED 계열을 사용합니다.

### 중요

선택 전에는 평점을 절대 표시하지 마세요.

`rating` 값이 데이터에 존재하더라도 선택 전 UI에서는 렌더링하지 않습니다.

---

## 6. RESTAURANT CARD

각 식당은 단순한 정보 카드가 아니라 **서바이벌 참가자 카드**처럼 디자인해주세요.

카드 상단에는 `SURVIVAL TITLE`을 표시합니다.

예:

- 성수의 와인 강자
- 데이트 코스 최종보스
- 가성비 파스타 사냥꾼

그 아래 큰 대표 사진을 배치합니다.

사진 아래에는 다음 정보를 표시합니다.

- 식당명
- 카테고리 · 지역
- 가격대
- 한 줄 소개
- 대표 리뷰

대표 리뷰는 별도의 어두운 박스에 표시합니다.

카드 전체는 얇은 Border를 사용하고 과도하게 둥근 SaaS 스타일 UI를 피해주세요. 모서리는 작거나 중간 정도의 radius만 사용해주세요.

---

## 7. RESTAURANT SELECTION

사용자가 Restaurant A를 선택했다고 가정합니다.

선택 직후 바로 다음 라운드로 넘어가지 마세요. 먼저 **선택 결과 연출**을 보여주세요.

### A를 선택한 경우

- Restaurant A → Spotlight ON
- Restaurant B → Spotlight OFF

Winner 카드:

- Gold Border
- Gold Glow
- Brightness 증가

Loser 카드:

- Brightness 감소
- Saturation 감소
- Opacity 감소

이때 화면 상단에 다음 문구를 표시합니다.

> A를 선택했습니다!

---

## 8. SPOTLIGHT SYSTEM

Spotlight는 이 프로젝트에서 매우 중요한 디자인 요소입니다.

식당이 살아남았다는 것을 단순한 Badge만으로 표현하지 말고 **무대 조명이 켜지고 꺼지는 것**으로 표현해주세요.

### WINNER

- 위에서 Gold Spotlight가 내려옵니다.
- 카드 주변에 부드러운 Gold Glow를 표시합니다.
- Gold Border를 활성화합니다.

### LOSER

- Spotlight가 꺼집니다.
- 카드를 어둡게 만듭니다.
- grayscale 또는 saturation 감소를 적용합니다.

시각적으로 다음 규칙을 사용해주세요.

> **Winner = 빛이 들어옴**  
> **Loser = 빛이 사라짐**

---

## 9. RATING REVEAL

선택 이후에만 두 식당의 실제 평점을 공개합니다.

예:

```text
A를 선택했습니다!

A
★ 4.3
리뷰 523개

B
★ 4.7
리뷰 1,102개
```

그리고 중앙에 결과 메시지를 표시합니다.

> 평점은 B가 더 높았지만  
> 당신의 취향은 A였습니다.

또는:

> 대중적인 평가와  
> 당신의 선택이 일치했습니다.

평점 비교는 결과를 뒤집지 않습니다. 사용자가 선택한 식당이 항상 Winner입니다.

하단 CTA:

**[ 다음 대결로 ]**

---

## 10. NEW CHAMPION

Rating Reveal 이후 바로 다음 식당을 보여주기 전에 선택된 식당이 Champion이 되는 짧은 연출을 보여주세요.

화면 중앙:

```text
NEW CHAMPION

Gold Spotlight

성수의 와인 강자

Restaurant A

1 WIN STREAK
```

Champion 주변에는 Gold particle 또는 아주 가벼운 confetti 효과를 사용할 수 있습니다. 과도한 효과는 사용하지 마세요.

---

## 11. NEXT CHALLENGER

Champion 연출이 끝나면 다음 식당이 Challenger로 등장합니다.

```text
CURRENT CHAMPION
Restaurant A

        VS

NEW CHALLENGER
Restaurant C
```

Champion은 Gold 계열을 유지합니다.

Challenger는 White / Gray 기반 Neutral 상태입니다.

새 Challenger는 다음 정도의 짧은 등장 애니메이션을 사용해주세요.

- 오른쪽에서 slide-in
- 또는 fade + scale

---

## 12. ELIMINATION

Champion이 새로운 Challenger에게 패배하는 경우 기존 Champion의 Spotlight를 끄고 카드를 어둡게 만듭니다.

카드 중앙에 다음 텍스트를 표시해주세요.

**ELIMINATED** 또는 **탈락**

새로운 Winner 쪽 Spotlight가 켜지고 Gold Border가 활성화됩니다.

시각 흐름:

```text
Spotlight OFF
      ↓
ELIMINATED
      ↓
Spotlight ON
      ↓
NEW CHAMPION
```

---

## 13. WIN STREAK

Champion 카드에는 현재 연승 횟수를 표시합니다.

```text
CURRENT CHAMPION

Restaurant A

3 WIN STREAK
```

`WIN STREAK`는 Gold 컬러로 강조해주세요.

---

## 14. REVIVAL ROUND

`requirements.md`에 정의된 것처럼 참가 식당이 **6개 이상일 때만 한 번의 Revival Round**를 제공합니다.

Revival 화면은 일반 Battle과 분위기를 다르게 구성해주세요.

Gold가 아닌 **RED**를 메인 Accent로 사용합니다.

화면 상단:

**REVIVAL ROUND**

Subtitle:

> 다시 한번 보고 싶은 식당을 선택하세요.

탈락한 식당 중 최대 3개를 카드 형태로 표시합니다.

각 카드에는 다음 정보를 표시합니다.

- 대표 사진
- Survival Title
- 식당명
- 카테고리 / 지역
- 가격대

하단:

**[ 패자부활전 건너뛰기 ]**

Revival Round에서는 **BLACK + RED + WHITE** 조합을 중심으로 사용해주세요.

---

## 15. REVIVED CHALLENGER

부활한 식당은 현재 Champion의 새로운 Challenger가 됩니다.

```text
CHAMPION

Restaurant A

VS

REVIVED

Restaurant C
```

`REVIVED` Badge는 RED 계열을 사용해주세요.

---

## 16. FINAL WINNER

모든 대결이 끝나면 가장 강한 Winner 연출을 사용합니다.

화면 상단:

```text
Crown Icon

WINNER
```

중앙에는 큰 Restaurant Card를 표시합니다.

표시 정보:

- 대표 사진
- Survival Title
- Restaurant Name
- Category
- Location
- Rating
- Review Count
- Price Level
- Description

추가 게임 정보:

- WIN STREAK
- 승리 횟수
- 전체 대결 라운드

하단 CTA:

- **[ Google Maps에서 보기 ]**
- **[ 같은 조건으로 다시하기 ]**
- **[ 새로운 게임 시작 ]**

Final Winner 화면에서는 Gold를 가장 적극적으로 사용할 수 있습니다.

- Gold Spotlight
- Gold Border
- Gold Typography
- 가벼운 Gold Confetti

---

## 17. ANIMATION

애니메이션은 게임의 상태 변화를 설명하기 위한 용도로 사용해주세요.

필요한 애니메이션:

- restaurant card entrance
- challenger slide-in
- winner spotlight on
- loser spotlight off
- rating reveal
- card elimination
- new champion
- revival entrance
- winner reveal

권장 시간:

**200ms ~ 600ms**

과도하게 긴 애니메이션은 사용하지 마세요. 사용자가 빠르게 다음 대결을 진행할 수 있어야 합니다.

---

## 18. RESPONSIVE

Desktop에서는 반드시 다음 형태를 유지합니다.

```text
Restaurant A | VS | Restaurant B
```

모바일에서는 다음과 같은 세로 배치를 허용합니다.

```text
Restaurant A

VS

Restaurant B
```

최소 `360px`까지 정상적으로 사용할 수 있어야 합니다.

---

## 19. TYPOGRAPHY

전체적으로 굵고 직선적인 타이포그래피를 사용해주세요.

### 게임 제목

Extra Bold / Condensed 계열

### 본문

가독성이 높은 Sans-serif

다음 중요 텍스트는 게임 HUD처럼 명확하게 구분해주세요.

- ROUND
- VS
- CHAMPION
- CHALLENGER
- ELIMINATED
- REVIVAL ROUND
- WINNER
- WIN STREAK

---

## 20. 반드시 피해야 할 디자인

다음 디자인은 사용하지 마세요.

- 파스텔 컬러
- 밝은 전체 배경
- 음식 배달 앱 스타일
- 일반적인 맛집 검색 사이트 스타일
- 지나치게 둥근 카드
- Glassmorphism 남용
- Gradient 남용
- 모든 요소에 Gold 사용
- 지나치게 화려한 Neon UI
- 귀여운 캐주얼 게임 스타일
- 복잡한 3D UI
- 실제 방송 프로그램 UI 복제

전체적인 인상은 **“깔끔하고 현대적인 요리 서바이벌 게임”**이어야 합니다.

---

## 21. 가장 중요한 UX 규칙

이 프로젝트의 핵심 경험은 다음입니다.

```text
두 식당 등장
        ↓
사용자가 직관적으로 선택
        ↓
선택한 식당 Spotlight ON
        ↓
선택하지 않은 식당 Spotlight OFF
        ↓
두 식당 평점 Reveal
        ↓
내 선택과 평점 비교
        ↓
Winner가 Champion으로 남음
        ↓
새 Challenger 등장
        ↓
다시 선택
```

이 흐름이 화면을 보는 것만으로도 이해될 정도로 명확하게 구현해주세요.

---

## 22. 구현 원칙

`requirements.md`와 `constraints.md`에 정의된 기존 기능과 데이터 구조를 우선합니다.

이번 디자인 요청을 반영하면서 기존 게임 로직을 임의로 변경하지 마세요.

이미 구현된 기능이 있다면 전체 코드를 불필요하게 다시 작성하지 말고 재사용 가능한 Component와 CSS를 중심으로 수정해주세요.

UI Component는 적절히 분리해주세요.

예:

```text
StartScreen
BattleScreen
RestaurantCard
RoundIndicator
VersusIndicator
Spotlight
RatingReveal
ChampionReveal
RevivalRound
WinnerScreen
```

게임 상태와 UI 상태를 명확하게 분리해주세요.

먼저 핵심 Battle Flow가 정상 작동하도록 구현하고, 그 이후 Spotlight 및 Transition 애니메이션을 추가해주세요.

---

# 최종 목표

LAST DISH STANDING은 **“평점 높은 식당을 찾아주는 서비스”**가 아닙니다.

사용자가 다음 정보를 보고:

- 사진
- 가격대
- 리뷰
- 식당 특징

**“그냥 여기가 더 끌린다”**라는 자신의 직관으로 선택하는 서비스입니다.

그리고 선택한 뒤에야 평점을 공개하여 **“대중의 평가와 내 취향이 얼마나 다른가?”**를 재미있게 확인합니다.

서비스를 사용하는 경험 자체가 **맛집 검색**이 아니라 **Restaurant Survival Game**처럼 느껴지도록 구현해주세요.
