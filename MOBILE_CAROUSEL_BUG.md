# 🐛 모바일 캐러셀 스와이프 버그 리포트

## 배포 URL
- **사이트**: https://portfolio-site-gamma-black.vercel.app/
- **버그 재현 페이지**: https://portfolio-site-gamma-black.vercel.app/project.html?id=SE300
- **테스트 환경**: iOS Safari (실제 iPhone에서 확인됨)

---

## 증상 (User Report)
모바일에서 프로젝트 상세 페이지의 이미지 캐러셀을 가로로 스와이프할 때:
1. **사진이 손가락에 붙어서 실시간으로 따라오지 않음**
2. **화면 전체가 먼저 당겨지고(iOS rubber-band/세로 스크롤)**, 사진 전환은 그 뒤에 뒤늦게 발생
3. 인스타그램이나 일반 앱처럼 손끝에 사진이 1:1로 착 달라붙는 자연스러운 스와이프를 원함

## 기대 동작
- 손가락으로 가로로 쓸면 사진이 손 위치에 실시간으로 따라와야 함
- 손을 떼면 가까운 슬라이드 중앙으로 부드럽게 스냅되어야 함
- 세로로 쓸면 정상적으로 페이지가 스크롤되어야 함

---

## 시도한 접근법과 실패 원인

### 시도 1: CSS Scroll-Snap (실패)
`.img-carousel`에 `overflow-x: auto; scroll-snap-type: x mandatory;`를 적용하고, JS 터치 이벤트를 비활성화.
- **진단 결과**: CSS 속성은 올바르게 적용됨 (`overflow-x=auto`, `scrollSnapType=x mandatory`, `scrollWidth=1000 > clientWidth=500`)
- **실패 원인**: iOS Safari에서 세로 스크롤 가능한 페이지 안에 중첩된 가로 스크롤 컨테이너가 있을 때, 브라우저가 세로 스크롤에 우선권을 부여하여 가로 스와이프를 무시하는 알려진 이슈

### 시도 2: JS touchmove 실시간 추적 + `touch-action: pan-y` (현재 상태, 여전히 실패)
CSS scroll-snap을 제거하고, `touchmove`에서 매 프레임마다 `translateX`를 계산하여 이미지를 손가락 위치에 동기화.
- **`touch-action: pan-y`**를 `.img-carousel-wrapper`에만 적용 (여기가 문제일 가능성 높음)
- **실패 원인 추정**: 
  - `touch-action: pan-y`가 **wrapper에만** 적용되고, 실제 터치 이벤트가 발생하는 `#img-carousel` 요소와 `.carousel-slide`, `.detail-img`에는 적용되지 않음
  - CSS `touch-action`은 **상속되지 않음** → 캐러셀 자체는 `touch-action: auto`(기본값)로 남아있음
  - 브라우저가 캐러셀 영역의 터치를 기본 동작(페이지 스크롤)으로 먼저 처리해 버림
  - JS의 `e.preventDefault()`가 브라우저의 기본 터치 핸들링 이후에 실행되어 효력 없음

---

## 관련 파일 및 현재 코드 상태

### [project.css](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/project.css)
**기본 CSS (데스크톱, line 43~82):**
```css
.img-carousel-wrapper {
    overflow: hidden;
    user-select: none;
}
.img-carousel {
    display: flex;
    transition: transform 0.55s cubic-bezier(0.77, 0, 0.175, 1);
    will-change: transform;
    cursor: grab;
}
.carousel-slide {
    min-width: 100%;
}
.detail-img {
    pointer-events: none;  /* ← 터치가 이미지를 관통하여 슬라이드로 전달됨 */
}
```

**모바일 CSS (line 229~245):**
```css
@media (max-width: 768px) {
    .img-carousel-wrapper {
        overflow: hidden;
        touch-action: pan-y; /* ⚠️ wrapper에만 설정됨! carousel 자체에는 없음 */
    }
    .img-carousel {
        display: flex;
        /* transform/transition은 JS가 직접 제어 */
    }
    .carousel-slide {
        flex-shrink: 0;
        width: 100vw;
    }
    .carousel-btn { display: none !important; }
}
```

### [project.js](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/project.js)
**현재 모바일 터치 엔진 (line 94~160):**
- `touchstart` (passive: true): 시작 좌표 기록, transition 제거
- `touchmove` (passive: false): 방향 판별 후 가로면 `e.preventDefault()` 호출 & `translateX` 실시간 갱신
- `touchend`: 40px 이상이면 다음 슬라이드, 아니면 제자리 스냅

**의심되는 문제점:**
1. `touch-action: pan-y`가 `#img-carousel`에 직접 없어서 브라우저가 터치를 선점
2. 기본 CSS의 `transition: transform 0.55s ...`가 모바일에서 명시적으로 제거되지 않아 충돌 가능
3. `.detail-img`의 `pointer-events: none`이 터치 이벤트 전파에 예기치 않은 영향

### [project.html](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/project.html)
**캐러셀 HTML 구조 (line 26~33):**
```html
<div class="img-carousel-wrapper">           <!-- touch-action: pan-y 여기만 있음 -->
    <div class="img-carousel" id="img-carousel">  <!-- touch-action: auto (기본값!) -->
        <div class="carousel-slide">              <!-- touch-action: auto -->
            <img class="detail-img" ...>          <!-- pointer-events: none -->
        </div>
    </div>
    <button class="carousel-btn carousel-prev" ...>
    <button class="carousel-btn carousel-next" ...>
    <div class="carousel-dots" ...></div>
</div>
```
- 캐시 버스팅: CSS/JS 파일에 `?v=3` 파라미터 적용 중

---

## 제안하는 수정 방향

### 최우선: `touch-action` 올바른 요소에 적용
```css
@media (max-width: 768px) {
    .img-carousel,
    .carousel-slide,
    .detail-img {
        touch-action: pan-y;  /* 세로 스크롤만 브라우저에 맡기고, 가로는 JS가 제어 */
    }
}
```

### 추가: 기본 CSS의 transition이 모바일에서 간섭하지 않도록 명시적 제거
```css
@media (max-width: 768px) {
    .img-carousel {
        transition: none; /* JS touchend에서 직접 제어 */
    }
}
```

### 추가: `pointer-events: none` 영향 확인
`.detail-img`에서 `pointer-events: none`을 모바일에서 제거하거나, `touch-action`을 명시적으로 설정하여 터치 이벤트가 올바르게 전파되는지 확인 필요.

### 검증 사항
- 수정 후 반드시 **실제 iOS Safari (iPhone)**에서 테스트
- 크롬 개발자 도구의 모바일 시뮬레이터는 터치 동작을 정확히 재현하지 못함
- 캐시 버스팅 버전을 `?v=4` 이상으로 올려야 최신 코드 반영 확인 가능

---

## 프로젝트 컨텍스트
- **프로젝트**: JULIENISNERD 인더스트리얼 디자인 포트폴리오
- **기술 스택**: Vanilla HTML/CSS/JS + GSAP (ScrollTrigger)
- **호스팅**: Vercel (GitHub 연동, 정적 사이트)
- **진행 기록**: [JULIENISNERD_PROGRESS.md](file:///Users/kimseongju/Desktop/Antigravity/portfolio-site/JULIENISNERD_PROGRESS.md)
- **어드민 비밀번호**: 3605
