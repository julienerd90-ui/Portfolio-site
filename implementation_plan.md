# Mobile Carousel "Native Swipe" Implementation Plan

모바일 환경에서의 제스처(스와이프) 경험을 "움직임 끝난 후 애니메이션 재생" 방식에서 **"손가락 쓸기에 100% 동기화된 실시간 마찰 드래그"** 방식으로 완벽하게 개편합니다.

## User Review Required

> [!TIP]
> 앱이나 모바일 웹(예: 인스타그램)에서 넘길 때 자연스럽게 손끝에 사진이 붙어 따라오는 느낌은 대부분 자바스크립트가 아닌 **브라우저 내장 스크롤 물리 엔진(CSS Scroll-snap)**을 사용해 구현합니다. 
> 현재는 마우스 환경의 데스크톱처럼 스크립트를 통해 계산하여 억지로 애니메이션으로 밀어주는 방식이기 때문에 지연이 느껴진 것입니다.

## Proposed Changes

### 기술적 방향: **Native CSS Scroll Snap 전환**
모바일 환경일 때 한정하여 기존의 자바스크립트 `transform` 방식을 해제하고, 스마트폰 브라우저가 제공하는 초당 120프레임의 네이티브 스크롤 엔진에 전적으로 슬라이드 조작을 위임합니다.

#### 1. [MODIFY] [project.css](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/project.css)
* **모바일 미디어 쿼리 추가:**
  - `.img-carousel-wrapper`: `overflow-x: auto` (우측으로 삐져나가는 스크롤 활성화), `scroll-snap-type: x mandatory` (손을 떼면 다음 이미지 중앙에 자석처럼 찰칵 붙게 설정)
  - `.img-carousel`: 모바일에서는 자바스크립트가 개입하지 못하도록 `transform` 및 `transition` 효과 무력화.
  - 모바일에서는 기본 스크롤바가 보이지 않도록 `::-webkit-scrollbar { display: none; }` 적용.
  - `.carousel-slide`: `scroll-snap-align: center` 적용.

#### 2. [MODIFY] [project.js](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/project.js)
* **터치 이벤트 분기 처리:**
  - 화면 폭이 모바일인지 감지한 뒤, 모바일일 경우 기존의 강제 애니메이션 제어 코드(`touchend`의 `goTo()` 함수 등)를 작동하지 않게 막습니다.
* **디스플레이 점(Dot) 동기화:**
  - 네이티브 스크롤 기능으로 넘어가기 때문에, 현재 몇 번째 사진을 체공 중인지 알기 위해 `IntersectionObserver` 혹은 래퍼의 `scroll` 이벤트를 부착하여, 현재 화면의 정중앙을 차지한 이미지를 인식해 하단 점표시(Dot)에 `active` 클래스를 실시간 부여합니다.

## Open Questions

1. 데스크톱에서는 현재처럼 마우스로 휙 당기면 다음 장으로 한 칸씩 자연스럽게 넘어가는 부드러운 애니메이션을 현재처럼 유지하고, **스마트폰 터치 환경에서만 쫀득한 자석 스와이프를 구현**하는 것이 맞으시겠죠? (이 방식이 일반적입니다.)
