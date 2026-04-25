gsap.registerPlugin(ScrollTrigger);

// data.js의 getProjects()로 localStorage + 기본 데이터 통합 참조

// ── Cursor ──
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
});
function initCursorInteractions() {
    document.querySelectorAll('a, .menu, .logo, .view-more, .carousel-btn').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
}

// ── Carousel ──
let currentIndex = 0;
let images = [];
let isDragging = false;
let dragStartX = 0;
let dragThreshold = 100;
let lastWheelTime = 0;

function isMobile() { return window.innerWidth <= 768; }

function buildCarousel(imgList) {
    images = imgList;
    const carousel   = document.getElementById('img-carousel');
    const dotsEl     = document.getElementById('carousel-dots');
    const prevBtn    = document.getElementById('carousel-prev');
    const nextBtn    = document.getElementById('carousel-next');

    // Build slides
    carousel.innerHTML = imgList.map((src, i) => `
        <div class="carousel-slide">
            <img src="${src}" class="detail-img" alt="Project image ${i + 1}"
                 onerror="this.style.opacity='0.3'">
        </div>
    `).join('');

    // Build dots
    dotsEl.innerHTML = imgList.map((_, i) =>
        `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
    ).join('');
    dotsEl.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => goTo(+dot.dataset.index));
    });

    // Buttons
    prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

    // Arrow keys
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
        if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
    });

    // Wheel scroll inside carousel wrapper — move slides (with Cooldown)
    const wrapper = document.querySelector('.img-carousel-wrapper');
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const now = Date.now();
        // 500ms(0.5초) 이내에 연속으로 발생하는 스크롤 무시 (너무 빨리 넘어가는 것 방지)
        if (now - lastWheelTime < 500) return; 

        // 휠 감도: 최소 50 이상의 힘으로 스크롤했을 때만 넘어가도록 둔감하게 제한
        if (e.deltaY > 50 || e.deltaX > 50) {
            goTo(currentIndex + 1);
            lastWheelTime = now;
        } else if (e.deltaY < -50 || e.deltaX < -50) {
            goTo(currentIndex - 1);
            lastWheelTime = now;
        }
    }, { passive: false });

    // ── Desktop: Mouse drag ──
    carousel.addEventListener('mousedown', (e) => {
        if (isMobile()) return;
        isDragging = true;
        dragStartX = e.clientX;
        carousel.classList.add('grabbing');
    });
    window.addEventListener('mouseup', (e) => {
        if (isMobile() || !isDragging) return;
        isDragging = false;
        carousel.classList.remove('grabbing');
        const diff = e.clientX - dragStartX;
        if (Math.abs(diff) > dragThreshold) goTo(currentIndex + (diff < 0 ? 1 : -1));
    });

    // ── Mobile: Real-time finger-tracking touch engine ──
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let touchLocked = false;   // 가로 스와이프로 확정되었는지
    let touchCancelled = false; // 세로 스크롤로 판명 → 터치 무시

    carousel.addEventListener('touchstart', (e) => {
        if (!isMobile()) { dragStartX = e.touches[0].clientX; return; }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchCurrentX = touchStartX;
        touchLocked = false;
        touchCancelled = false;
        // 손가락이 닿는 순간 transition 끄기 (실시간 추적 모드)
        carousel.style.transition = 'none';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (!isMobile() || touchCancelled) return;
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const deltaX = x - touchStartX;
        const deltaY = y - touchStartY;

        // 아직 방향이 확정되지 않았으면 판별
        if (!touchLocked) {
            // 충분한 이동 거리(10px)가 될 때까지 기다림
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // 세로 이동이 더 큼 → 페이지 스크롤로 양보
                touchCancelled = true;
                return;
            }
            // 가로 이동이 더 큼 → 캐러셀 스와이프 확정
            touchLocked = true;
        }

        // 가로 스와이프 확정 → 세로 페이지 스크롤 차단
        e.preventDefault();
        touchCurrentX = x;

        // 현재 슬라이드 기준점 + 손가락 이동량 = 실시간 위치
        const baseOffset = -currentIndex * carousel.clientWidth;
        const fingerOffset = touchCurrentX - touchStartX;
        carousel.style.transform = `translateX(${baseOffset + fingerOffset}px)`;
    }, { passive: false });

    carousel.addEventListener('touchend', (e) => {
        if (!isMobile()) {
            const diff = e.changedTouches[0].clientX - dragStartX;
            if (Math.abs(diff) > dragThreshold) goTo(currentIndex + (diff < 0 ? 1 : -1));
            return;
        }
        if (touchCancelled) return;

        const diff = touchCurrentX - touchStartX;
        // 부드러운 착지 애니메이션 켜기
        carousel.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';

        // 40px 이상 밀었으면 다음/이전 슬라이드, 아니면 제자리
        if (Math.abs(diff) > 40) {
            goTo(currentIndex + (diff < 0 ? 1 : -1));
        } else {
            goTo(currentIndex); // 제자리 스냅
        }
    });

    updateCarousel();
}

function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, images.length - 1));
    updateCarousel();
}

function updateCarousel() {
    const carousel = document.getElementById('img-carousel');
    const prevBtn  = document.getElementById('carousel-prev');
    const nextBtn  = document.getElementById('carousel-next');
    const dots     = document.querySelectorAll('.carousel-dot');

    // 모바일/데스크톱 모두 transform 사용 (통일)
    const offset = -currentIndex * 100;
    carousel.style.transform = `translateX(${offset}%)`;

    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

    prevBtn.classList.toggle('hidden', currentIndex === 0);
    nextBtn.classList.toggle('hidden', currentIndex === images.length - 1);
}

// ── Main ──
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');
    const data   = getProjects()[id];

    if (data) {
        document.getElementById('detail-title').innerText   = data.title;
        document.getElementById('detail-concept').innerText  = data.concept  || '';
        document.getElementById('detail-year').innerText     = data.year     || '—';
        document.getElementById('detail-client').innerText   = data.client   || '—';

        // 이미지 배열: images 필드가 있으면 사용, 없으면 img 단일 이미지로 폴백
        const imgList = (data.images && data.images.length > 0)
            ? data.images
            : (data.img ? [data.img] : []);

        buildCarousel(imgList);

        // Entrance animations
        gsap.from("#detail-title", { y: 80, opacity: 0, duration: 1.5, ease: "power4.out", delay: 0.1 });
        gsap.from(".carousel-slide", {
            scale: 1.04, opacity: 0, duration: 1.6, stagger: 0, ease: "power3.out", delay: 0.3
        });

        // Text blocks fade-in on scroll
        gsap.from(".detail-text-block", {
            y: 50, opacity: 0, duration: 1, stagger: 0.2,
            scrollTrigger: {
                trigger: ".project-detail-content",
                start: "top 80%",
                toggleActions: "play none none none"
            }
        });

    } else {
        document.getElementById('detail-title').innerText   = "Project Not Found";
        document.getElementById('detail-concept').innerText = "Could not find the requested project.";
        document.getElementById('img-carousel').style.display = 'none';
        document.querySelector('.img-carousel-wrapper').style.display = 'none';
    }

    initCursorInteractions();
});
