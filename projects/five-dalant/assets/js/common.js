gsap.registerPlugin(ScrollTrigger);

// 모바일 주소창이 접히고 펴지면 resize 가 발생하고, 그때마다 ScrollTrigger 가
// 모든 핀/트리거 위치를 다시 잰다. 스크롤 도중에 이게 일어나면 화면이 튄다.
// 섹션 높이는 svh 로 바꿔 레이아웃 자체는 안 흔들리게 했고(common.css),
// 여기서는 "높이만 바뀐 resize" 를 무시하게 해서 재계산까지 막는다.
// 가로 회전처럼 폭이 바뀌는 경우는 그대로 반영된다.
ScrollTrigger.config({ ignoreMobileResize: true });

/*=============
   공용 : 화면에 처음 들어올 때 한 번만 재생

   전에는 "들어오면 재생 / 완전히 벗어나면 되감기" 였는데,
   핀이 걸린 구간(.strength / .work)에서는 이게 성립하지 않는다.
   pinSpacing:false 라 요소가 화면에 멈춰 있는 동안에도 "문서상 위치"는 계속
   흘러가서, 재생 트리거는 진작 지나갔는데 되감기 트리거는 아직 살아 있는
   구간이 생긴다. 그 구간으로 되돌아오면 요소가 숨은 채로 남아버린다.
     예) 태그 재생 5108~5555 / 되감기 4338~7230
         → 포트폴리오까지 내려갔다가 6100 으로 올라오면 태그가 안 보인다

   한 번만 재생하면 되감기 경로 자체가 없어져서 이 문제가 통째로 사라진다.
=============*/
function playOnceInView(trigger, anim, start = "top 80%") {
  ScrollTrigger.create({
    trigger,
    start,
    once: true,
    onEnter: () => anim.restart(true),
  });
}

/*=============
   hero : 로드 직후 첫 화면 등장
   - <br> 기준으로 줄을 쪼개고 줄마다 마스크를 씌워 아래에서 밀어올림
=============*/
(function () {
  const titles = gsap.utils.toArray(".hero_text_wrap .hero_title strong");
  const desc = document.querySelector(".hero_text_wrap p");
  if (!titles.length) return;

  // "가나<br>다라" -> [span.line > span.line_in]
  function splitLines(el) {
    const lines = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((s) => s.trim())
      .filter(Boolean);

    el.innerHTML = lines
      .map((t) => `<span class="line"><span class="line_in">${t}</span></span>`)
      .join("");

    return el.querySelectorAll(".line_in");
  }

  // 문구마다 줄 묶음을 따로 들고 있는다
  const groups = titles.map(splitLines);

  // 전부 아래에 내려둔다. .line 의 overflow:hidden 이 잘라주므로 그냥 안 보인다
  groups.forEach((g) => gsap.set(g, { yPercent: 110 }));
  if (desc) gsap.set(desc, { opacity: 0, y: 24 });

  // 첫 화면이라 로드 시점에 이미 진입 상태 → onEnter 가 바로 걸려 재생된다
  const tl = gsap.timeline({ delay: 0.25, paused: true });
  tl.to(groups[0], {
    yPercent: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.12, // 윗줄 -> 아랫줄 순서로 올라옴
  });
  if (desc) {
    // 제목이 다 올라오기 전에 살짝 겹쳐서 시작 (-0.6초)
    tl.to(desc, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");
  }

  playOnceInView(".hero", tl);

  /*--- 5초마다 다음 문구로 교체 ---*/
  // 저절로 바뀌는 글자는 읽는 도중에 사라져 버리므로 모션을 줄이려는 사용자에게는
  // 첫 문구만 그대로 둔다
  const rotate =
    titles.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (rotate) {
    const CYCLE = 5; // 초
    let idx = 0;
    let timer = null;

    function next() {
      const cur = groups[idx];
      idx = (idx + 1) % groups.length;
      const nxt = groups[idx];

      // 인트로와 같은 마스크를 그대로 쓴다.
      // 지금 문구는 위로 빠지고, 다음 문구는 아래에서 올라온다.
      //
      // ★ 두 문구는 grid 한 칸에 겹쳐 있어서 같은 마스크를 공유한다.
      //   들어오는 쪽이 일찍 출발하면 나가는 글자와 한 칸에서 겹쳐 보인다.
      //   그래서 OUT 을 짧고 빠르게(power2.in) 끝낸 뒤 그 직후에 IN 을 시작한다.
      //   OUT 끝 : 0.5 + 스태거 0.06 = 0.56 / IN 시작 : 0.52 → 줄마다 안 겹친다
      gsap.to(cur, { yPercent: -110, duration: 0.5, ease: "power2.in", stagger: 0.06 });
      gsap.fromTo(
        nxt,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.85, ease: "power3.out", stagger: 0.08, delay: 0.52 },
      );

      timer = gsap.delayedCall(CYCLE, next);
    }

    // 인트로(0.25 + 1.1 + 스태거)가 끝난 뒤부터 세기 시작
    timer = gsap.delayedCall(CYCLE + 1.5, next);

    // 히어로가 화면 밖으로 나가면 굳이 돌릴 필요가 없다
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top bottom",
      end: "bottom top",
      onLeave: () => timer && timer.pause(),
      onLeaveBack: () => timer && timer.pause(),
      onEnter: () => timer && timer.resume(),
      onEnterBack: () => timer && timer.resume(),
    });
  }

  // 퇴장 : 스크롤하면 위로 밀리며 흐려진다.
  // 등장 애니메이션은 안쪽(.line_in / p)을, 퇴장은 바깥 래퍼를 건드리므로 서로 안 부딪힌다.
  gsap.to(".hero_text_wrap", {
    y: -140,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "70% top", // 히어로가 다 지나가기 전에 미리 끝내서 다음 섹션과 안 겹치게
      scrub: true,
    },
  });
})();

/*=============
   strength : 문구 하나씩 교체 (스텝 방식)
   - 스크롤 위치로 "몇 번째 문구인지"만 계산
   - 실제 모션은 항상 고정 속도로 재생 → 스크롤 속도와 무관하게 쉭쉭 넘어감
   - 0번(인트로)은 위/아래가 아니라 좌·우로 갈라지며 사라짐
=============*/
(function () {
  const items = gsap.utils.toArray(".change_text strong");
  if (!items.length) return;

  const DIST = 40; // 일반 문구 슬라이드 거리(px) - 짧을수록 날카롭다
  const EASE = "power3.out";
  const SPLIT = () => window.innerWidth * 0.6; // 인트로가 갈라져 나가는 거리

  const intro = document.querySelector(".change_text .intro");
  const introL = intro && intro.children[0];
  const introR = intro && intro.children[1];
  const sub = gsap.utils.toArray(".strength_text_wrap > p, .strength_text_wrap > span");

  gsap.set(items, { opacity: 0, y: DIST });
  gsap.set(items[0], { opacity: 1, y: 0 });
  if (intro) gsap.set(sub, { opacity: 0 }); // 인트로 동안에는 위·아래 설명문 숨김

  let current = 0;

  function hide(el, dir) {
    if (el === intro) {
      // 이동은 초반부터 빠르게(out), 투명도는 뒤늦게 떨어지게(in).
      // 반대로 하면 벌어지기 전에 이미 안 보여서 효과가 통째로 묻힌다.
      gsap.to([introL, introR], {
        x: (i) => (i === 0 ? -SPLIT() : SPLIT()),
        duration: 0.9,
        ease: "power2.out",
        overwrite: true,
      });
      gsap.to(el, { opacity: 0, duration: 0.3, ease: EASE, overwrite: true });
      return;
    }
    gsap.to(el, { opacity: 0, y: -DIST * dir, duration: 0.45, ease: EASE, overwrite: true });
  }

  function show(el, dir) {
    if (el === intro) {
      gsap.to([introL, introR], { x: 0, duration: 0.9, ease: "power2.out", overwrite: true });
      gsap.to(el, { opacity: 1, duration: 0.45, ease: EASE, overwrite: true });
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: DIST * dir },
      { opacity: 1, y: 0, duration: 0.55, ease: EASE, overwrite: true },
    );
  }

  function goTo(index) {
    if (index === current) return;
    const dir = index > current ? 1 : -1; // 위로 스크롤하면 반대로 재생

    hide(items[current], dir);
    show(items[index], dir);

    // 인트로를 벗어나면 설명문이 따라 나옴
    if (intro) {
      gsap.to(sub, {
        opacity: index === 0 ? 0 : 1,
        duration: 0.5,
        ease: EASE,
        overwrite: true,
      });
    }

    current = index;
  }

  ScrollTrigger.create({
    trigger: ".strength",
    start: "top top",
    end: "bottom bottom",
    pin: ".strength_text_wrap",
    pinSpacing: false,
    onUpdate(self) {
      goTo(Math.round(self.progress * (items.length - 1)));
    },
  });
})();

/*=============
   work : 태그가 흩날려 있다가 제자리로 모이며 등장
   - transform만 쓰므로 흩어져 있어도 실제 레이아웃(줄바꿈)은 그대로
=============*/
(function () {
  const tags = gsap.utils.toArray(".tag_box .tag");
  if (!tags.length) return;

  const R = gsap.utils.random; // (min, max, true) -> 호출할 때마다 새 난수

  // JS 실행 전 한 프레임 보이는 걸 막기 위해 먼저 숨김
  gsap.set(tags, { opacity: 0 });

  const tween = gsap.fromTo(
    tags,
    {
      opacity: 0,
      x: () => R(-window.innerWidth * 0.35, window.innerWidth * 0.35),
      y: () => R(-260, 260),
      rotation: () => R(-75, 75),
      scale: () => R(0.4, 0.8),
    },
    {
      opacity: 1,
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: { each: 0.045, from: "random" }, // 순서대로가 아니라 무작위로 자리잡음
      paused: true,
      onComplete: startCycle, // 다 모인 뒤에 active 순환 시작
    },
  );

  /*--- 3초마다 active 태그 넘기기 ---*/
  const CYCLE = 3; // 초
  let idx = Math.max(0, tags.indexOf(document.querySelector(".tag_box .tag.active")));
  let timer = null;

  function setActive(i) {
    tags.forEach((t, n) => t.classList.toggle("active", n === i));
    idx = i;
  }

  function startCycle() {
    stopCycle();
    // gsap.delayedCall 을 쓰면 탭이 백그라운드일 때 같이 멈춰서 setInterval 보다 안전
    timer = gsap.delayedCall(CYCLE, function next() {
      setActive((idx + 1) % tags.length);
      timer = gsap.delayedCall(CYCLE, next);
    });
  }

  function stopCycle() {
    if (timer) timer.kill();
    timer = null;
  }

  playOnceInView(
    ".tag_box",
    {
      restart: () => {
        stopCycle();
        setActive(0);
        tween.restart();
      },
    },
    // .work 가 핀으로 멈춰선 다음에 등장하도록 늦춘 값.
    // 핀이 걸리면 .tag_box 는 화면 절반 언저리에 고정되므로
    // 45% 로 잡으면 핀이 붙고 조금 더 굴린 뒤에 태그가 날아온다.
    "top 45%",
  );
})();

/*=============
   project : 앞 섹션(work)을 덮으면서 위로 올라와 등장
   - work 를 화면에 고정(pin)해두면, 뒤따르는 project 가 그 위를 지나가며 덮는다
=============*/
(function () {
  const work = document.querySelector(".work");
  const wrap = document.querySelector(".work .tag_wrap");
  const project = document.querySelector(".project");
  if (!work || !wrap || !project) return;

  // work 를 패널처럼 화면에 고정한다.
  // pinSpacing:false = 핀 지속시간만큼의 "여분 공간"을 만들지 않는다는 뜻이지
  //                    요소 자리를 없앤다는 뜻이 아니다. 그래서 뒤 내용이 밀리지 않고
  //                    project 가 고정된 work 위를 그대로 지나가며 덮는다.
  ScrollTrigger.create({
    trigger: work,
    start: "top top",
    pin: true,
    pinSpacing: false,
  });

  // 덮이는 구간 : project 윗변이 화면 아래 → 화면 위로 올라오는 동안
  const coverST = {
    trigger: project,
    start: "top bottom", // project 윗변이 화면 아래에 닿는 순간
    end: "top top", // project 윗변이 화면 위에 닿는 순간
    scrub: true, // 덮이는 진행도에 그대로 연동
  };

  // 밑에 깔린 work 를 살짝 줄이고 어둡게 → 뒤로 물러나는 원근감
  gsap.to(wrap, {
    scale: 0.92,
    opacity: 0.45,
    ease: "none",
    scrollTrigger: coverST,
  });

  // project 는 올라오면서 좁고 둥근 판 → 화면 꽉 찬 각진 판으로 펴진다.
  // 시작값(90vw / 32px)은 CSS 에 있고 여기서는 끝값만 지정한다.
  //
  // ★ width 는 매 프레임 레이아웃을 다시 계산시킨다. 이 판 안에는 포트폴리오
  //   이미지 그리드가 통째로 들어 있어 모바일에서는 스크롤이 눈에 띄게 끊긴다.
  //   그래서 좁은 화면에서는 이 연출만 빼고 CSS 값(94vw / 라운드)을 그대로 둔다.
  //   같은 coverST 를 쓰는 위아래 트윈은 transform·opacity 라 그대로 유지한다.
  if (!window.matchMedia("(max-width: 768px)").matches) {
    gsap.to(project, {
      width: "100vw",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      ease: "none",
      scrollTrigger: coverST,
    });
  }

  // 화면에 고정된 배경 영상도 같이 사라진다.
  // 영상은 position:fixed 라 project 뒤로 밀려나는 게 아니라 계속 그 자리에 있다.
  // 감추지 않으면 project 아래(stats·banner·contact·footer)까지 화면을 덮어버린다.
  //   autoAlpha = opacity + visibility. 다 사라지면 visibility:hidden 이 되어
  //   그 뒤 섹션에서는 그리기·클릭 대상에서 완전히 빠진다.
  const bg = document.querySelector(".hero_video");
  if (!bg) return;

  gsap.to(bg, { autoAlpha: 0, ease: "none", scrollTrigger: coverST });

  // 안 보이는 동안 디코딩까지 멈춰서 배터리·발열을 아낀다 (다시 올라오면 재생)
  const video = bg.querySelector("video");
  if (!video) return;

  ScrollTrigger.create({
    trigger: project,
    start: "top top",
    onEnter: () => video.pause(),
    onLeaveBack: () => video.play(),
  });
})();

/*=============
   banner : 문구가 옆으로 무한히 흐르는 띠 (여러 줄)
   - 평소엔 일정 속도, 스크롤하면 그 방향으로 빨라짐
   - 홀수 번째 줄은 반대로 흘러서 두 줄이 서로 엇갈린다
=============*/
(function () {
  const tracks = [...document.querySelectorAll(".banner .move_track")];
  if (!tracks.length) return;

  // 끝없이 움직이는 띠는 전정 감각에 민감한 사용자에게 부담이 된다.
  // 복제 전에 빠져나가므로 로고가 한 줄로 정지해 있는 상태가 된다.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const SPEED = 90; // 초당 이동 px (클수록 빠름)

  const loops = tracks.map((track, i) => {
    // 1) 원본 세트를 화면보다 넉넉히 넘칠 때까지 이어붙임
    const set = [...track.children];
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.5 && guard++ < 30) {
      set.forEach((el) => track.appendChild(el.cloneNode(true)));
    }

    // 2) 지금까지 만든 걸 통째로 한 벌 더 복제해서 정확히 2등분
    const half = track.scrollWidth;
    [...track.children].forEach((el) => track.appendChild(el.cloneNode(true)));

    // 3) half 만큼 밀면 두 번째 벌이 첫 번째 자리에 딱 겹쳐서 이음매가 안 보임
    const opts = { duration: half / SPEED, ease: "none", repeat: -1 };
    // 둘째 줄은 -half 에서 0 으로 되돌아오게 해서 반대 방향으로 흐른다.
    // timeScale 은 두 줄에 똑같이 걸리므로 스크롤 가속·역방향도 그대로 엇갈린 채 유지된다
    return i % 2
      ? gsap.fromTo(track, { x: -half }, { x: 0, ...opts })
      : gsap.to(track, { x: -half, ...opts });
  });

  // 여러 줄의 속도를 한 번에 조절
  const speedTo = (timeScale, vars) =>
    loops.forEach((loop) => gsap.to(loop, { timeScale, overwrite: true, ...vars }));

  // 마우스를 올리면 멈춘다 (로고를 보려는 동작이므로 스크롤 가속보다 우선)
  let hovering = false;
  const move = document.querySelector(".banner .move");
  if (move && window.matchMedia("(hover: hover)").matches) {
    move.addEventListener("pointerenter", () => {
      hovering = true;
      speedTo(0, { duration: 0.4, ease: "power2.out" });
    });
    move.addEventListener("pointerleave", () => {
      hovering = false;
      speedTo(1, { duration: 0.6, ease: "power2.out" });
    });
  }

  // 스크롤 속도에 따라 가속 / 방향 전환
  let idle = null;
  let lastScale = 1; // 지금 걸어둔 목표 속도

  // 스크롤이 멎으면 기본 속도로 서서히 복귀
  const settle = () => {
    if (hovering) return; // 복귀 예약이 뒤늦게 터져서 멈춤을 풀어버리는 것 방지
    lastScale = 1;
    speedTo(1, { duration: 0.8 });
  };

  ScrollTrigger.create({
    trigger: ".banner",
    start: "top bottom",
    end: "bottom top",
    onUpdate(self) {
      if (hovering) return; // 멈춰 세운 상태를 스크롤이 도로 밀어버리지 않게

      const v = self.getVelocity();
      if (!v) return;

      const boost = gsap.utils.clamp(1, 8, 1 + Math.abs(v) / 300);
      // 아래로 스크롤(v>0) = 정방향, 위로 스크롤(v<0) = 역방향
      const next = v > 0 ? boost : -boost;

      // onUpdate 는 스크롤 한 번에도 수십 번 불린다. 그때마다 트윈을 새로
      // 만들면(그리고 죽이면) 그 자체가 프레임을 먹는다.
      // 목표 속도가 눈에 띄게 달라질 때만 새로 건다
      if (Math.abs(next - lastScale) > 0.15) {
        lastScale = next;
        speedTo(next, { duration: 0.25 });
      }

      // 복귀 예약도 매번 새로 만들지 않고 하나를 재사용한다
      if (idle) idle.restart(true);
      else idle = gsap.delayedCall(0.35, settle);
    },
  });
})();

/*=============
   project : 카드가 순차적으로 올라오며 등장
=============*/
(function () {
  const list = document.querySelector(".project .project_wrap ul");
  const cards = gsap.utils.toArray(".project .project_wrap ul li");
  if (!cards.length) return;

  const tween = gsap.fromTo(
    cards,
    { y: 70, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.09, // 왼쪽 위 -> 오른쪽 아래 순서로
      paused: true,
    },
  );

  playOnceInView(list, tween);
})();

/*=============
   title_box : 섹션 제목 블록 공통 등장 (partner / stats)
   - small -> strong -> p 순서로 솟아오름
=============*/
(function () {
  const boxes = gsap.utils.toArray(".title_box");
  if (!boxes.length) return;

  boxes.forEach((box) => {
    const kids = box.querySelectorAll("small, strong, p");
    if (!kids.length) return;

    const tween = gsap.fromTo(
      kids,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        paused: true,
      },
    );

    playOnceInView(box, tween);
  });
})();

/*=============
   stats : 숫자 박스가 순차 등장하면서 각자 카운트 시작
   - 기존 IntersectionObserver 대신 GSAP 으로 통일 →
     등장 타이밍과 카운트 시작이 항상 같이 움직인다
   - 숫자 요소에 class="counter" data-target="n" (n 은 쉼표 없는 숫자)
=============*/
(function () {
  const boxes = gsap.utils.toArray(".stats .num_box");
  if (!boxes.length) return;

  const DUR = 1.5; // 카운트에 걸리는 시간(초)
  const GAP = 0.12; // 박스 사이 시간차(초)

  let calls = []; // 대기 중인 카운트 예약들 (재진입 시 정리용)

  function runCounter(el) {
    const target = parseFloat(el.dataset.target);
    if (isNaN(target)) return;

    // 이전 카운트가 아직 돌고 있으면 중단. 안 그러면 두 트윈이
    // 같은 요소의 textContent 를 번갈아 덮어써서 숫자가 튄다
    if (el._count) el._count.kill();

    // 소수점이 있는 목표값이면 한 자리까지 표시
    const dec = target % 1 !== 0 ? 1 : 0;
    const fmt = { minimumFractionDigits: dec, maximumFractionDigits: dec };
    const obj = { v: 0 };

    el._count = gsap.to(obj, {
      v: target,
      duration: DUR,
      ease: "power2.out",
      onUpdate: () => {
        // toLocaleString 이 천 단위 쉼표를 넣어준다 (2695 -> 2,695)
        el.textContent = obj.v.toLocaleString(undefined, fmt);
      },
    });
  }

  const tween = gsap.fromTo(
    boxes,
    { y: 60, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: GAP,
      paused: true,
      onStart() {
        // 다시 들어와서 재생될 때 이전 예약이 남아있으면 카운트가 겹쳐 돈다
        calls.forEach((c) => c.kill());
        // 각 박스가 올라오는 타이밍에 맞춰 카운트도 하나씩 시작
        calls = boxes.map((box, i) => {
          const el = box.querySelector(".counter");
          return el && gsap.delayedCall(i * GAP, () => runCounter(el));
        });
        calls = calls.filter(Boolean);
      },
    },
  );

  playOnceInView(".stats .value", {
    restart: (includeDelay) => tween.restart(includeDelay),
  });
})();

/*=============
   스크롤 진행 바 : 페이지 상단에서 읽은 만큼 채워짐
=============*/
(function () {
  const bar = document.createElement("div");
  bar.className = "scroll_bar";
  document.body.appendChild(bar);

  // width 대신 scaleX : 매 프레임 레이아웃을 다시 계산하지 않아 훨씬 가볍다
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });
})();

/*=============
   맨 위로 버튼
   - 한 화면 넘게 내려가면 나타난다
=============*/
(function () {
  const btn = document.querySelector(".to_top");
  if (!btn) return;

  // 스크롤 리스너를 새로 다는 대신 이미 돌고 있는 ScrollTrigger 에 얹는다.
  //
  // ★ start/end 경계(onToggle)에 맡기면 안 된다. end 를 "max" 로 두면 페이지 맨 아래에서
  //   스크롤 값이 end 와 같아지는 순간 트리거가 비활성이 되어 버튼이 사라진다.
  //   그래서 구간 전체를 지켜보면서 위치로 직접 판단한다.
  let shown = false;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const next = self.scroll() > window.innerHeight * 0.8;
      if (next === shown) return; // 매 프레임 클래스를 건드리지 않게
      shown = next;
      btn.classList.toggle("show", next);
    },
  });

  btn.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
})();

/*=============
   header : 내릴 때 숨고, 올릴 때 다시 나타남
=============*/
(function () {
  const header = document.querySelector("header");
  if (!header) return;

  const TOP_ZONE = 120; // 이 위치보다 위에서는 항상 보이게
  let hidden = false;

  function setHidden(next) {
    // 모바일 메뉴가 열려 있으면 헤더가 X 버튼을 데리고 올라가 버린다
    if (next && document.body.classList.contains("menu_open")) return;
    if (next === hidden) return; // 같은 상태면 트윈을 새로 만들지 않는다
    hidden = next;
    gsap.to(header, {
      yPercent: next ? -100 : 0,
      duration: 0.4,
      ease: next ? "power2.in" : "power2.out",
      overwrite: true,
    });
  }

  // 맨 위(0)에서는 아래 라인을 숨기고, 조금이라도 내려가면 보이게 한다.
  // border_zero = 라인 없앰 → 맨 위일 때 붙인다.
  // classList.toggle 은 두 번째 인자로 on/off 를 받으므로 따로 분기가 필요 없다.
  function setBorder(atTop) {
    header.classList.toggle("border_zero", atTop);
  }

  setBorder(window.scrollY === 0); // 새로고침으로 중간에서 시작한 경우 대비

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const y = self.scroll();
      setBorder(y === 0);

      if (y < TOP_ZONE) return setHidden(false);
      setHidden(self.direction === 1); // 1 = 아래로, -1 = 위로
    },
  });
})();

/*=============
   모바일 햄버거 메뉴
   - 열림 상태는 body.menu_open 하나로만 관리하고 모양은 CSS 가 그린다
=============*/
(function () {
  const btn = document.querySelector(".menu_btn");
  const nav = document.querySelector("header nav");
  if (!btn || !nav) return;

  const MOBILE = window.matchMedia("(max-width: 768px)");

  function setOpen(open) {
    document.body.classList.toggle("menu_open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }

  btn.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("menu_open"));
  });

  // 메뉴 안의 링크를 누르면 닫는다 (앵커 이동이 오버레이에 가려지지 않게)
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // 열어둔 채 데스크탑 폭으로 넓히면 body 의 스크롤 잠금만 남는다
  MOBILE.addEventListener("change", (e) => {
    if (!e.matches) setOpen(false);
  });
})();

/*=============
   오른쪽 플로팅 상담 탭 (빠른상담 / 정부지원사업)
   - 한 번에 하나만 열린다 : 하나를 열면 나머지는 닫힌다
   - 하나라도 열려 있는 동안엔 body.side_open 을 붙여, 닫힌 탭은 CSS 가 완전히 숨긴다
     ("하나 열리면 나머지는 안 보이게")
=============*/
(function () {
  const panels = [
    document.querySelector(".q_contact"),
    document.querySelector(".govermment"),
  ].filter(Boolean);
  if (!panels.length) return;

  panels.forEach((panel) => {
    const handle = panel.querySelector(".left");
    handle?.addEventListener("click", () => {
      const willOpen = !panel.classList.contains("active");
      // 전부 닫고, 방금 누른 게 닫혀 있었으면 그것만 연다 (열려 있던 걸 누르면 그냥 닫힘)
      panels.forEach((p) => p.classList.remove("active"));
      if (willOpen) panel.classList.add("active");
      // 하나라도 열려 있으면 나머지 탭은 CSS 로 숨긴다
      document.body.classList.toggle("side_open", willOpen);
    });
  });
})();
