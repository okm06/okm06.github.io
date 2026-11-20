const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const mobileMenu = window.matchMedia('(max-width: 768px)');
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const heroName = document.querySelector('.hero-name');
const skillItems = [...document.querySelectorAll('.skill-item')];
const backToTop = document.querySelector('.back-to-top');
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

backToTop.addEventListener('click', () => {
  document.querySelector('#main').focus({ preventScroll: true });
  if (smoothScroll) smoothScroll.scrollTo(0, { immediate: reducedMotion.matches });
  else window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});

// 복사에 성공한 경우에만 완료 상태를 표시합니다.
const copyEmailButton = document.querySelector('.contact-copy');
const copyEmailStatus = document.querySelector('.contact-copy-status');
const emailLink = document.querySelector('.contact-email');
let copyEmailResetTimer;
let copyingEmail = false;

function copyEmailFallback(address) {
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = address;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
  document.body.append(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, address.length);
    return document.execCommand('copy');
  } finally {
    field.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

copyEmailButton.addEventListener('click', async () => {
  if (copyingEmail) return;
  copyingEmail = true;
  clearTimeout(copyEmailResetTimer);
  copyEmailButton.setAttribute('aria-busy', 'true');
  copyEmailStatus.textContent = '';
  const address = emailLink.getAttribute('href').slice('mailto:'.length);
  try {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(address);
        copied = true;
      } catch {
        // 로컬 파일이나 클립보드 권한이 제한된 브라우저의 대체 방식입니다.
      }
    }
    if (!copied) copied = copyEmailFallback(address);
    if (!copied) throw new Error('Copy unavailable');
    copyEmailButton.textContent = '복사했어요';
    copyEmailStatus.textContent = '이메일 주소를 복사했어요.';
  } catch {
    copyEmailButton.textContent = '다시 복사';
    copyEmailStatus.textContent = '복사하지 못했어요. 이메일 주소를 직접 복사해주세요.';
  } finally {
    copyingEmail = false;
    copyEmailButton.removeAttribute('aria-busy');
  }
  copyEmailResetTimer = setTimeout(() => {
    copyEmailButton.textContent = '복사';
    copyEmailStatus.textContent = '';
  }, 3500);
});
copyEmailButton.hidden = false;

// 긴 섹션에서도 현재 위치를 유지하며, 첫 화면에서는 메뉴를 선택하지 않습니다.
const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]')].map((link) => ({
  link,
  section: document.getElementById(link.getAttribute('href').slice(1)),
})).filter(({ section }) => section);
let activeSectionLink = null;
let sectionUpdatePending = false;

function updateActiveSection() {
  // 임계값에 여유를 두어 상단 근처에서 높이가 반복해서 바뀌지 않게 합니다.
  if (window.scrollY > 80) nav.classList.add('nav--compact');
  else if (window.scrollY < 24) nav.classList.remove('nav--compact');
  const showBackToTop = window.scrollY > Math.max(400, window.innerHeight * 0.6);
  backToTop.classList.toggle('is-visible', showBackToTop);
  backToTop.inert = !showBackToTop;
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

// 닫힐 때도 open 상태를 유지해 내용이 사라지기 전에 높이를 줄입니다.
const detailTransitions = new Map();
projectGrid.querySelectorAll('.project-details').forEach((details) => {
  const summary = details.querySelector('summary');
  let animation = null;
  let expanded = details.open;

  const finish = () => {
    if (!animation) return;
    animation.onfinish = null;
    animation.cancel();
    animation = null;
    details.open = expanded;
    details.style.removeProperty('height');
    details.style.removeProperty('overflow');
    details.classList.remove('is-closing');
    alignProjectCards();
    refreshScrollPositions();
  };
  detailTransitions.set(details, finish);

  summary.addEventListener('click', (event) => {
    if (reducedMotion.matches || !details.animate) return;
    event.preventDefault();
    const fromHeight = details.getBoundingClientRect().height;
    expanded = animation ? !expanded : !details.open;
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
    }
    details.open = true;
    details.style.removeProperty('height');
    const toHeight = expanded
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderTopWidth);
    details.classList.toggle('is-closing', !expanded);
    details.style.overflow = 'hidden';
    animation = details.animate([
      { height: `${fromHeight}px` },
      { height: `${toHeight}px` },
    ], { duration: 240, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' });
    animation.onfinish = finish;
  });
  details.addEventListener('toggle', () => {
    if (animation) return;
    expanded = details.open;
    alignProjectCards();
    refreshScrollPositions();
  });
});
function finishDetailTransitions() {
  detailTransitions.forEach((finish) => finish());
}
window.addEventListener('resize', finishDetailTransitions);
reducedMotion.addEventListener('change', finishDetailTransitions);
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
          ['.experience', '.experience-title', '.experience-date, .experience-content'],
          ['.contact', '.contact-title', '.contact-content'],
        ].forEach(([section, title, content]) => {
          gsap.from(`${title} .section-title-text`, {
            yPercent: 110, rotation: 2, transformOrigin: 'left bottom',
            duration: 1.05, ease: 'power4.out', clearProps: 'transform',
            scrollTrigger: { trigger: title, start: 'top 90%', once: true },
          });
          gsap.from(document.querySelector(section).querySelectorAll(content), {
            opacity: 0, y: 30, duration: 0.7, stagger: 0.1,
            ease: 'power3.out', clearProps: 'opacity,transform',
            scrollTrigger: { trigger: section, start: 'top 85%', once: true },
          });
        });
      }

      if (scrollTrigger) {
        const timeline = document.querySelector('.experience-timeline');
        const milestones = [...timeline.querySelectorAll('.experience-item')];
        timeline.classList.add('is-scroll-timeline');
        const updateMilestones = () => {
          const activationLine = window.innerHeight * 0.65;
          milestones.forEach((item) => {
            const marker = getComputedStyle(item, '::before');
            const markerCenter = parseFloat(marker.top) + parseFloat(marker.height) / 2;
            item.classList.toggle('is-reached',
              item.getBoundingClientRect().top + markerCenter <= activationLine);
          });
        };
        gsap.fromTo(timeline, { '--timeline-progress': 0 }, {
          '--timeline-progress': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 65%', end: 'bottom 65%',
            scrub: true,
            onUpdate: updateMilestones,
            onRefresh: updateMilestones,
          },
        });
        updateMilestones();
        cleanups.push(() => {
          timeline.classList.remove('is-scroll-timeline');
          milestones.forEach((item) => item.classList.remove('is-reached'));
        });
      }

      if (finePointer.matches) {
        const cursor = document.createElement('div');
        cursor.className = 'project-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = '<span class="project-cursor-label">VIEW <span>↗</span></span>';
        document.body.append(cursor);
        let pointerPosition = null;
        const hideCursor = () => {
          cursor.classList.remove('is-visible');
          document.body.classList.remove('has-project-cursor');
        };
        const updateCursor = () => {
          if (!pointerPosition) return;
          const { x, y } = pointerPosition;
          const target = document.elementFromPoint(x, y);
          if (!target?.closest('.project-preview')) {
            hideCursor();
            return;
          }
          // 실제 포인터 위치에 지연 없이 표시합니다.
          cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          cursor.classList.add('is-visible');
          document.body.classList.add('has-project-cursor');
        };
        const followCursor = (event) => {
          if (event.pointerType !== 'mouse') return;
          pointerPosition = { x: event.clientX, y: event.clientY };
          updateCursor();
        };
        const resetCursor = () => {
          pointerPosition = null;
          hideCursor();
        };
        document.addEventListener('pointerover', followCursor);
        document.addEventListener('pointermove', followCursor);
        document.addEventListener('pointerleave', resetCursor);
        window.addEventListener('blur', resetCursor);
        window.addEventListener('scroll', updateCursor, { passive: true });
        document.addEventListener('keydown', resetCursor);
        cleanups.push(() => {
          document.removeEventListener('pointerover', followCursor);
          document.removeEventListener('pointermove', followCursor);
          document.removeEventListener('pointerleave', resetCursor);
          window.removeEventListener('blur', resetCursor);
          window.removeEventListener('scroll', updateCursor);
          document.removeEventListener('keydown', resetCursor);
          resetCursor();
          cursor.remove();
        });
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
