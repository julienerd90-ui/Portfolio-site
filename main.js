// 페이지 로드 시 최상단 고정 (브라우저 스크롤 기억 방지)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Render Projects from Data
const wrapper = document.getElementById("vertical-wrapper");
const projectsData = getProjects();
// admin에서 설정한 순서 사용 (getProjectOrder는 data.js에서 제공)
const projectOrder = getProjectOrder();

// Generate HTML
let html = `
  <section class="panel hero">
     <h1 class="hero-text" data-speed="0.2">TRUST ME<br>WE'RE<br>DESIGNERS</h1>
     <div class="scroll-wrapper">
         <div class="scroll-indicator">
            <span class="scroll-text">Scroll Down</span>
            <div class="scroll-line"></div>
         </div>
     </div>
  </section>
  <div class="projects-gallery">
`;

let count = 1;
for (const key of projectOrder) {
  const proj = projectsData[key];
  if (!proj) continue; // 삭제된 프로젝트 스킵

  html += `
      <section class="panel project">
         <div class="thumbnail-wrapper" onclick="window.location.href='project.html?id=${key}'">
            <div class="hover-content">
               <p class="project-desc">${proj.concept.substring(0, 160)}...</p>
               <span class="view-project-label">VIEW PROJECT &rarr;</span>
            </div>
            <img src="${proj.img}" class="project-img">
         </div>
         <div class="thumbnail-caption">
            <span class="project-meta">${proj.year || '2024'} &nbsp;&mdash;&nbsp; ${proj.client || 'Personal Project'}</span>
            <h3 class="project-title">${proj.title}</h3>
         </div>
      </section>
    `;
  count++;
}

html += `
  </div>
  <section class="panel footer">
     <h2 class="footer-text" data-speed="0.4">LET'S<br>CREATE.</h2>
     <a href="mailto:hello@julienisnerd.design" class="contact-btn">hello@julienisnerd.design</a>
  </section>
`;

wrapper.innerHTML = html;

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

const panels = gsap.utils.toArray(".panel");

// Horizontal scrolling pin is removed. Vertical snapping is also removed for free scrolling.

// Elegant Fade-in Up Reveal (Yuta Takahashi Style)
panels.forEach(panel => {
  if (panel.classList.contains('hero')) return;

  gsap.fromTo(panel,
    { opacity: 0, y: 80 },
    {
      opacity: 1,
      y: 0,
      duration: 1.5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: panel,
        start: "top 85%", // Triggers much earlier when the panel enters viewport
        toggleActions: "play none none reverse"
      }
    }
  );
});

// Cursor Logic
const cursor = document.querySelector('.cursor');
const interactiveElements = document.querySelectorAll('a, .menu, .logo, img');

window.addEventListener('mousemove', (e) => {
  gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
});

interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('active'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
});

// Intro Animation
window.addEventListener('load', () => {
  // 브라우저 렌더링이 완전히 끝난 직후 0점으로 하드 리셋
  setTimeout(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh(); // GSAP 트리거 영점 다시 측정
  }, 10);

  gsap.from(".hero-text", { y: 100, opacity: 0, duration: 1.5, ease: "power4.out", delay: 0.2 });
  // Scroll Indicator 입장 애니메이션 (wrapper에 걸어서 내부 객체와 충돌 회피)
  gsap.from(".scroll-wrapper", { opacity: 0, y: 10, duration: 1.2, ease: "power2.out", delay: 1.2 });

  // 사용자가 스크롤하면 부드럽게 사라지고 위로 올리면 다시 100% 복구됨
  gsap.to(".scroll-indicator", {
    opacity: 0,
    y: 15,
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=200", // 200px 스크롤하는 동안 서서히 사라짐
      scrub: true
    }
  });
});
