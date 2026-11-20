/*=====================================================================
   포트폴리오 페이지 전용 스크립트

   ★ 전 페이지 공통인 것은 여기 없다. common.js 에 있다.
     gsap.registerPlugin / ScrollTrigger.config / 스크롤 진행 바 /
     헤더 숨김 / 햄버거 메뉴 / 맨 위로 버튼 / 플로팅 상담 탭
   그래서 이 파일은 common.js 뒤에 불러야 한다.
=====================================================================*/

/*=============
   카드 등장 : 스크롤로 화면에 처음 들어올 때 한 번만 아래에서 올라온다
   - 메인처럼 풀스크린 연출은 없고, 이 잔잔한 등장 모션만 살린다
=============*/
(function () {
  const cards = gsap.utils.toArray(".pf_grid li");
  if (!cards.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // 모션 최소화 사용자에겐 그냥 정지 상태로 둔다

  // JS 실행 전 한 프레임 노출을 막고, 화면에 든 줄만 순차로 올린다
  gsap.set(cards, { opacity: 0, y: 60 });

  cards.forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          // 같은 줄에 있는 카드들끼리 살짝 시간차를 주려고 열 인덱스만큼 딜레이
          delay: (i % 3) * 0.06,
        }),
    });
  });
})();

/*=============
   pf_hero : 상단 타이틀 인트로 (로드 직후 한 번)
=============*/
(function () {
  const kids = gsap.utils.toArray(".pf_hero small, .pf_hero h1, .pf_hero p");
  if (!kids.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.from(kids, {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.1,
  });
})();

/*=============
   히어로 배경 영상 : 화면 밖으로 나가면 멈춘다 (배터리·발열 절약)
   - 모션을 줄이려는 사용자에겐 재생하지 않고 첫 프레임만 남긴다
=============*/
(function () {
  const video = document.querySelector(".pf_hero_video video");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  ScrollTrigger.create({
    trigger: ".pf_hero",
    start: "top bottom",
    end: "bottom top",
    onLeave: () => video.pause(),
    onEnterBack: () => video.play(),
    onEnter: () => video.play(),
  });
})();

/*=============
   카테고리 필터 : 탭을 누르면 즉시 걸러낸다 (페이지 이동 없음)
   - 카드 li 에 data-cat, 탭 button 에 data-filter
   - 안 맞는 카드는 .hide(display:none) 로 빼고, 남은 카드만 다시 스윽 등장
=============*/
(function () {
  const tabs = gsap.utils.toArray(".pf_filter button");
  const cards = gsap.utils.toArray(".pf_grid li");
  const thumb = document.querySelector(".pf_filter_thumb");
  const empty = document.querySelector(".pf_empty");
  if (!tabs.length || !cards.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /*--- 카테고리별 개수 채우기 : 각 탭의 <i> 에 해당 카드 수를 넣는다 ---*/
  tabs.forEach((tab) => {
    const key = tab.dataset.filter;
    const n = key === "all" ? cards.length : cards.filter((c) => c.dataset.cat === key).length;
    const box = tab.querySelector("i");
    if (box) box.textContent = n;
  });

  /*--- 활성 탭 뒤 알약(thumb)을 그 버튼 위치·너비에 맞춘다 ---*/
  function moveThumb(tab, animate = true) {
    if (!thumb || !tab) return;
    // 트랙(.pf_filter_track) 안에서의 상대 좌표. thumb 도 같은 트랙 안이라 스크롤돼도 함께 움직인다
    const left = tab.offsetLeft;
    const width = tab.offsetWidth;
    gsap.to(thumb, {
      x: left,
      width: width,
      duration: animate && !reduce ? 0.45 : 0,
      ease: "power3.out",
      overwrite: true,
    });
  }

  const initial = tabs.find((t) => t.classList.contains("active")) || tabs[0];
  moveThumb(initial, false);
  // 커스텀 폰트가 늦게 로드되면 버튼 너비가 바뀌므로, 폰트 준비되면 다시 맞춘다
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() =>
      moveThumb(document.querySelector(".pf_filter button.active"), false),
    );
  }
  // 창 크기가 바뀌면 위치 재계산
  window.addEventListener("resize", () => {
    moveThumb(document.querySelector(".pf_filter button.active"), false);
  });

  function apply(key) {
    let shown = 0;

    cards.forEach((card) => {
      const match = key === "all" || card.dataset.cat === key;
      card.classList.toggle("hide", !match);
      if (match) shown++;
    });

    // 결과 없음 안내
    if (empty) empty.style.display = shown ? "none" : "block";

    // 남은 카드들만 다시 등장. display 가 바뀌며 그리드가 재배치된 직후에 애니메이션.
    if (!reduce) {
      const visible = cards.filter((c) => !c.classList.contains("hide"));
      gsap.fromTo(
        visible,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05, overwrite: true },
      );
    }

    // 필터로 그리드 높이가 확 바뀌므로 스크롤 위치 계산을 새로 시킨다
    ScrollTrigger.refresh();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.classList.contains("active")) return;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      moveThumb(tab);
      // 모바일에서 화면 밖 탭을 눌러도 그 탭이 가운데로 스르륵 들어오게.
      // block:nearest 라 세로(페이지) 스크롤은 건드리지 않는다. 데스크탑은 스크롤이 없어 무해.
      tab.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      apply(tab.dataset.filter);
    });
  });
})();
