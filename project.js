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
// 스와이프 및 드래그 반응 감도: 기존 50px에서 100px로 늘려 둔감하게 조정
let dragThreshold = 100;
// 휠 스크롤 연속 발생 방지용 쿨다운 타이머
let lastWheelTime = 0;

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

    // Touch / Mouse drag
    carousel.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        carousel.classList.add('grabbing');
    });
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        carousel.classList.remove('grabbing');
        const diff = e.clientX - dragStartX;
        if (Math.abs(diff) > dragThreshold) goTo(currentIndex + (diff < 0 ? 1 : -1));
    });
    carousel.addEventListener('touchstart', (e) => { dragStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].clientX - dragStartX;
        if (Math.abs(diff) > dragThreshold) goTo(currentIndex + (diff < 0 ? 1 : -1));
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

    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;

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
