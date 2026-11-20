const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const mobileMenu = window.matchMedia('(max-width: 768px)');
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const heroName = document.querySelector('.hero-name');
const skillItems = [...document.querySelectorAll('.skill-item')];
let smoothScroll = null;
let cleanupMotion = () => {};

// 기본 기능은 애니메이션 라이브러리가 없어도 동작합니다.
document.querySelector('#copyright-year').textContent = new Date().getFullYear();

function syncMenuScroll() {
  const open = mobileMenu.matches && nav.classList.contains('nav--open');
  document.documentElement.classList.toggle('is-menu-open', open);
  if (open) smoothScroll?.stop();
  else smoothScroll?.start();
}

function setMenu(open) {
  nav.classList.toggle('nav--open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  navLinks.inert = mobileMenu.matches && !open;
  syncMenuScroll();
}

toggle.addEventListener('click', () => setMenu(!nav.classList.contains('nav--open')));
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
document.documentElement.classList.add('has-js');

// 긴 섹션에서도 현재 위치를 유지하며, 첫 화면에서는 메뉴를 선택하지 않습니다.
const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]')].map((link) => ({
  link,
  section: document.getElementById(link.getAttribute('href').slice(1)),
})).filter(({ section }) => section);
let activeSectionLink = null;
let sectionUpdatePending = false;

function updateActiveSection() {
  const activationLine = Math.min(window.innerHeight * 0.3, nav.getBoundingClientRect().height + 96);
  let current = null;
  sectionLinks.forEach(({ link, section }) => {
    if (section.getBoundingClientRect().top <= activationLine) current = link;
  });
  const pageBottom = document.documentElement.scrollHeight - window.innerHeight;
  if (pageBottom > 0 && window.scrollY >= pageBottom - 4) {
    current = sectionLinks.at(-1)?.link ?? null;
  }
  if (current === activeSectionLink) return;
  sectionLinks.forEach(({ link }) => {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  activeSectionLink = current;
}

function scheduleSectionUpdate() {
  if (sectionUpdatePending) return;
  sectionUpdatePending = true;
  window.requestAnimationFrame(() => {
    sectionUpdatePending = false;
    updateActiveSection();
  });
}

window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
window.addEventListener('resize', scheduleSectionUpdate);
window.addEventListener('hashchange', scheduleSectionUpdate);
window.addEventListener('load', scheduleSectionUpdate);
scheduleSectionUpdate();

// 접힌 상태의 높이만 맞추므로 펼친 카드가 옆 카드를 늘리지 않습니다.
const projectGrid = document.querySelector('.projects-grid');
const projectCards = [...projectGrid.querySelectorAll('.project-item')];

function alignProjectCards() {
  projectCards.forEach((card) => card.style.removeProperty('--project-base-height'));
  if (mobileMenu.matches) return;
  const heights = projectCards.map((card) => {
    const details = card.querySelector('.project-details');
    const expanded = details.open
      ? details.getBoundingClientRect().height - details.querySelector('summary').getBoundingClientRect().height
      : 0;
    return card.getBoundingClientRect().height - expanded;
  });
  for (let index = 0; index < projectCards.length; index += 2) {
    const height = Math.max(...heights.slice(index, index + 2));
    projectCards.slice(index, index + 2).forEach((card) => {
      card.style.setProperty('--project-base-height', `${height}px`);
    });
  }
}

function refreshScrollPositions() {
  window.ScrollTrigger?.refresh();
  scheduleSectionUpdate();
}

projectGrid.querySelectorAll('.project-details').forEach((details) => {
  details.addEventListener('toggle', () => {
    alignProjectCards();
    refreshScrollPositions();
  });
});
let projectGridWidth = -1;
if ('ResizeObserver' in window) {
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === projectGridWidth) return;
    projectGridWidth = entry.contentRect.width;
    alignProjectCards();
    refreshScrollPositions();
  }).observe(projectGrid);
} else {
  window.addEventListener('resize', alignProjectCards);
}
document.fonts?.ready.then(() => {
  alignProjectCards();
  refreshScrollPositions();
});
alignProjectCards();

function configureMotion() {
  cleanupMotion();
  cleanupMotion = () => {};
  if (reducedMotion.matches || !window.gsap) return;

  const gsap = window.gsap;
  const scrollTrigger = window.ScrollTrigger;
  const cleanups = [];
  const icons = skillItems.map((item) => item.querySelector('i, img, .skill-text-icon')).filter(Boolean);
  const context = gsap.context(() => {}, document.body);

  cleanupMotion = () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
    gsap.killTweensOf([heroName, ...skillItems, ...icons]);
    context.revert();
    gsap.set([heroName, ...skillItems, ...icons], { clearProps: 'transform' });
    smoothScroll = null;
    syncMenuScroll();
  };

  try {
    if (scrollTrigger) gsap.registerPlugin(scrollTrigger);
    if (window.Lenis) {
      const lenis = new window.Lenis({ anchors: true });
      smoothScroll = lenis;
      const tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      if (scrollTrigger) lenis.on('scroll', scrollTrigger.update);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      });
    }

    context.add(() => {
      const heroParts = ['.hero-label', '.hero-name', '.hero-summary', '.hero-scroll'];
      gsap.from(heroParts, {
        opacity: 0, y: 30, duration: 0.8, stagger: 0.15,
        ease: 'power3.out', clearProps: 'opacity',
      });

      if (scrollTrigger) {
        [
          ['.skills', '.skills-title', '.skill-card'],
          ['.projects', '.projects-title', '.project-item'],
          ['.experience', '.experience-title', '.experience-item'],
          ['.contact', '.contact-title', '.contact-content'],
        ].forEach(([section, title, content]) => {
          gsap.from(`${title}, ${section} ${content}`, {
            opacity: 0, y: 30, duration: 0.7, stagger: 0.1,
            ease: 'power3.out', clearProps: 'opacity,transform',
            scrollTrigger: { trigger: section, start: 'top 85%', once: true },
          });
        });
      }

      if (finePointer.matches) {
        const hero = document.querySelector('.hero');
        gsap.set(heroName, { transformPerspective: 1000 });
        const rotateY = gsap.quickTo(heroName, 'rotationY', { duration: 0.8, ease: 'power2.out' });
        const rotateX = gsap.quickTo(heroName, 'rotationX', { duration: 0.8, ease: 'power2.out' });
        const move = (event) => {
          const bounds = hero.getBoundingClientRect();
          rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 24);
          rotateX(-((event.clientY - bounds.top) / bounds.height - 0.5) * 16);
        };
        const leave = () => { rotateY(0); rotateX(0); };
        hero.addEventListener('mousemove', move);
        hero.addEventListener('mouseleave', leave);
        cleanups.push(() => {
          hero.removeEventListener('mousemove', move);
          hero.removeEventListener('mouseleave', leave);
        });

        skillItems.forEach((item, index) => {
          const hover = (active) => {
            gsap.to(item, { y: active ? -3 : 0, duration: 0.2, overwrite: 'auto' });
            if (icons[index]) gsap.to(icons[index], { scale: active ? 1.1 : 1, duration: 0.2, overwrite: 'auto' });
          };
          const enter = () => hover(true);
          const exit = () => hover(false);
          item.addEventListener('mouseenter', enter);
          item.addEventListener('mouseleave', exit);
          cleanups.push(() => {
            item.removeEventListener('mouseenter', enter);
            item.removeEventListener('mouseleave', exit);
          });
        });
      }
    });
    syncMenuScroll();
  } catch (error) {
    cleanupMotion();
    cleanupMotion = () => {};
    console.warn('애니메이션을 생략하고 기본 화면을 표시합니다.', error);
  }
}

reducedMotion.addEventListener('change', configureMotion);
finePointer.addEventListener('change', configureMotion);
configureMotion();
