gsap.registerPlugin(ScrollTrigger);

/* ── Cursor ── */
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
});

/* ── Render about data from localStorage ── */
function renderAboutPage() {
    const d = getAboutData();

    // Hero image
    const heroImg     = document.getElementById('about-hero-img');
    const placeholder = document.getElementById('about-placeholder');

    if (d.heroImage && d.heroImage.startsWith('http')) {
        heroImg.src = d.heroImage;
        heroImg.style.display = 'block';
        heroImg.onload  = () => { 
            placeholder.style.display = 'none'; 
            ScrollTrigger.refresh(); // 이미지 불러오고 나서 스크롤 좌표 재계산
        };
        heroImg.onerror = () => { heroImg.style.display = 'none'; };
    } else {
        heroImg.style.display = 'none';
    }

    // Name (줄바꿈 \n → <br>)
    const nameEl = document.getElementById('about-name-display');
    nameEl.innerHTML = (d.name || '').replace(/\n/g, '<br>');

    // Bio paragraphs
    const bioContainer = document.getElementById('about-bio-container');
    bioContainer.innerHTML = (d.bio || [])
        .map(text => `<p class="about-bio">${text}</p>`)
        .join('');

    // Career & Education items
    const careerList = document.getElementById('career-list-display');
    careerList.innerHTML = (d.career || []).map(item => `
        <div class="career-item">
            <span class="career-year">${item.year || ''}</span>
            <div class="career-body">
                <p class="career-title">${item.title || ''}</p>
                <p class="career-org">${item.org || ''}</p>
            </div>
            <span class="career-tag ${item.tag === 'Education' ? '' : ''}">${item.tag || ''}</span>
        </div>
    `).join('');

    // Awards
    const awardsList = document.getElementById('awards-list-display');
    awardsList.innerHTML = (d.awards || []).map(item => `
        <div class="career-item">
            <span class="career-year">${item.year || ''}</span>
            <div class="career-body">
                <p class="career-title">${item.title || ''}</p>
                <p class="career-org">${item.org || ''}</p>
            </div>
            <span class="career-tag career-tag--award">Award</span>
        </div>
    `).join('');
}

renderAboutPage();

/* ── Cursor interactions (rendered after DOM is ready) ── */
document.querySelectorAll('a, .career-item').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
});

/* ── Scroll parallax on hero image ── */
gsap.to('.about-hero-img', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
        trigger: '.about-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

/* ── Entrance animations ── */
window.addEventListener('load', () => {
    gsap.from('.about-hero-placeholder span', {
        opacity: 0, scale: 1.04, duration: 2, ease: 'power3.out', delay: 0.2
    });
    gsap.from('.about-name', {
        y: 60, opacity: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-intro', start: 'top 80%' }
    });
    gsap.from('.about-bio', {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '#about-bio-container', start: 'top 85%' }
    });
    gsap.from('#career-list-display .career-item', {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '#career-list-display', start: 'top 85%' }
    });
    gsap.from('#awards-list-display .career-item', {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '#awards-list-display', start: 'top 85%' }
    });
    gsap.from('.about-footer-text', {
        y: 60, opacity: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-footer', start: 'top 80%' }
    });
});
