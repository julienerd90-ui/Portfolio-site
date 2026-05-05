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

// ── Blocks Builder ──
function buildBlocks(blocks) {
    const mainContainer = document.getElementById('main-image-container');
    const container = document.getElementById('project-blocks');
    if (!blocks || blocks.length === 0) return;

    // 첫 번째 블록 (메인 이미지)
    const firstBlock = blocks[0];
    if (mainContainer && firstBlock) {
        if (firstBlock.startsWith('TEXT:')) {
            const textContent = firstBlock.substring(5).replace(/\n/g, '<br>');
            mainContainer.innerHTML = `
                <div class="block-item block-text">
                    ${textContent}
                </div>
            `;
        } else {
            mainContainer.innerHTML = `
                <div class="block-item">
                    <img src="${firstBlock}" class="block-img" alt="Main Project Image"
                         onerror="this.style.opacity='0.3'">
                </div>
            `;
        }
    }

    // 나머지 블록들
    if (container) {
        const remainingBlocks = blocks.slice(1);
        container.innerHTML = remainingBlocks.map((block, i) => {
            if (block.startsWith('TEXT:')) {
                const textContent = block.substring(5).replace(/\n/g, '<br>');
                return `
                    <div class="block-item block-text">
                        ${textContent}
                    </div>
                `;
            } else {
                return `
                    <div class="block-item">
                        <img src="${block}" class="block-img" alt="Project image ${i + 2}"
                             onerror="this.style.opacity='0.3'">
                    </div>
                `;
            }
        }).join('');
    }

    // GSAP ScrollTrigger for each block
    gsap.utils.toArray('.block-item').forEach(block => {
        gsap.to(block, {
            scrollTrigger: {
                trigger: block,
                start: "top 85%", // 화면 아래 85% 지점에 도달하면 애니메이션 시작
                toggleClass: "visible", // .visible 클래스를 토글하여 CSS transition 작동
                once: true // 한 번만 실행
            }
        });
    });
}

// ── Main ──
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');
    const data   = getProjects()[id];

    if (data) {
        document.getElementById('detail-title').innerText    = data.title;
        document.getElementById('detail-concept').innerHTML  = (data.concept || '').replace(/\n/g, '<br>');
        document.getElementById('detail-year').innerText     = data.year     || '—';
        document.getElementById('detail-client').innerText   = data.client   || '—';

        // 이미지/텍스트 배열 로드
        const blocksList = (data.images && data.images.length > 0)
            ? data.images
            : (data.img ? [data.img] : []);

        buildBlocks(blocksList);

        // Entrance animations
        gsap.from("#detail-title", { y: 80, opacity: 0, duration: 1.5, ease: "power4.out", delay: 0.1 });
        
        // Text blocks fade-in on scroll
        gsap.from(".detail-text-block", {
            y: 50, opacity: 0, duration: 1, stagger: 0.2,
            scrollTrigger: {
                trigger: ".project-detail-content",
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });

    } else {
        document.getElementById('detail-title').innerText   = "Project Not Found";
        document.getElementById('detail-concept').innerText = "Could not find the requested project.";
        const pb = document.getElementById('project-blocks');
        if (pb) pb.style.display = 'none';
    }

    initCursorInteractions();
});
