/* global gsap, ScrollTrigger, Lenis */
gsap.registerPlugin(ScrollTrigger);

document.querySelector('#copyright-year').textContent = new Date().getFullYear();

// 부드러운 스크롤과 스크롤 애니메이션을 같은 타이밍으로 갱신합니다.
const lenis = new Lenis({ anchors: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const mobileMenu = window.matchMedia('(max-width: 768px)');

function setMenu(open) {
  nav.classList.toggle('nav--open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  navLinks.inert = mobileMenu.matches && !open;
  if (mobileMenu.matches && open) {
    lenis.stop();
  } else {
    lenis.start();
  }
}

toggle.addEventListener('click', () => {
  setMenu(!nav.classList.contains('nav--open'));
});
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('nav--open')) {
    setMenu(false);
    toggle.focus();
  }
});
mobileMenu.addEventListener('change', () => setMenu(false));
setMenu(false);

// 같은 행의 접힌 높이만 맞춥니다. 상세 내용을 펼친 카드는 독립적으로 늘어납니다.
const projectGrid = document.querySelector('.projects-grid');
const projectCards = [...projectGrid.querySelectorAll('.project-item')];

function alignProjectCards() {
  projectCards.forEach((card) => card.style.removeProperty('--project-base-height'));
  if (mobileMenu.matches) return;

  const collapsedHeights = projectCards.map((card) => {
    const details = card.querySelector('.project-details');
    const expandedHeight = details.open
      ? details.getBoundingClientRect().height - details.querySelector('summary').getBoundingClientRect().height
      : 0;
    return card.getBoundingClientRect().height - expandedHeight;
  });

  for (let index = 0; index < projectCards.length; index += 2) {
    const height = Math.max(...collapsedHeights.slice(index, index + 2));
    projectCards.slice(index, index + 2).forEach((card) => {
      card.style.setProperty('--project-base-height', `${height}px`);
    });
  }
}

projectGrid.querySelectorAll('.project-details').forEach((details) => {
  details.addEventListener('toggle', () => {
    alignProjectCards();
    ScrollTrigger.refresh();
  });
});

let projectGridWidth = -1;
const projectResizeObserver = new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === projectGridWidth) return;
  projectGridWidth = entry.contentRect.width;
  alignProjectCards();
});
projectResizeObserver.observe(projectGrid);
document.fonts.ready.then(alignProjectCards);
alignProjectCards();

// 첫 화면 진입 애니메이션
const heroName = document.querySelector('.hero-name');
const heroParts = ['.hero-label', '.hero-name', '.hero-summary', '.hero-scroll'];
gsap.set(heroParts, { opacity: 0, y: 30 });
gsap.timeline({ delay: 0.3 })
  .to(heroParts[0], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
  .to(heroName, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.3')
  .to(heroParts[2], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
  .to(heroParts[3], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

// 섹션별 스크롤 진입 애니메이션
[
  ['.skills', '.skills-title', '.skill-card'],
  ['.projects', '.projects-title', '.project-item'],
  ['.experience', '.experience-title', '.experience-item'],
  ['.contact', '.contact-title', '.contact-content'],
].forEach(([section, title, content]) => {
  gsap.set(title, { opacity: 0, y: 40 });
  gsap.set(content, { opacity: 0, y: section === '.contact' ? 40 : 30 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      gsap.to(title, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.to(content, {
        opacity: 1, y: 0,
        duration: section === '.contact' ? 0.8 : 0.6,
        stagger: 0.1, delay: 0.2, ease: 'power3.out',
      });
    },
  });
});

// 터치 기기에서는 마우스 전용 효과를 실행하지 않습니다.
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const hero = document.querySelector('.hero');
  let mouseX = 0;
  let mouseY = 0;
  let pointerPending = false;

  hero.addEventListener('mousemove', (event) => {
    const bounds = hero.getBoundingClientRect();
    mouseX = (event.clientX - bounds.left) / bounds.width - 0.5;
    mouseY = (event.clientY - bounds.top) / bounds.height - 0.5;
    pointerPending = true;
  });

  // 마우스가 움직였을 때 제목 기울기를 갱신합니다.
  gsap.ticker.add(() => {
    if (!pointerPending) return;
    pointerPending = false;
    gsap.to(heroName, {
      rotateY: mouseX * 24,
      rotateX: -mouseY * 16,
      transformPerspective: 1000,
      duration: 0.8, ease: 'power2.out', overwrite: 'auto',
    });
  });

  hero.addEventListener('mouseleave', () => {
    pointerPending = false;
    gsap.to(heroName, { rotateY: 0, rotateX: 0, duration: 1, overwrite: 'auto' });
  });

  document.querySelectorAll('.skill-item').forEach((item) => {
    const icon = item.querySelector('i, img');
    item.addEventListener('mouseenter', () => {
      gsap.to(item, { y: -3, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(icon, { scale: 1.1, duration: 0.2, overwrite: 'auto' });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(item, { y: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(icon, { scale: 1, duration: 0.3, overwrite: 'auto' });
    });
  });

}
