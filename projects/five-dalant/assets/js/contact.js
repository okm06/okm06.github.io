// 모션 최소화 설정을 쓰는 사용자인지. 여러 블록에서 공통으로 본다
const CT_REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*=============
   ct_hero : 상단 타이틀 인트로 (로드 직후 한 번)
=============*/
(function () {
  const kids = gsap.utils.toArray(
    ".ct_hero small, .ct_hero h1, .ct_hero p, .ct_hero .ct_hero_btns",
  );
  if (!kids.length || CT_REDUCE) return;

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
  const video = document.querySelector(".ct_hero_video video");
  if (!video) return;

  if (CT_REDUCE) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  ScrollTrigger.create({
    trigger: ".ct_hero",
    start: "top bottom",
    end: "bottom top",
    onLeave: () => video.pause(),
    onEnterBack: () => video.play(),
    onEnter: () => video.play(),
  });
})();

/*=============
   섹션 등장 : 스크롤로 화면에 처음 들어올 때 한 번만 아래에서 올라온다
=============*/
(function () {
  if (CT_REDUCE) return;

  const groups = [
    ".ct_form_col .ct_head, .ct_form > *",
    ".ct_side_inner .ct_card",
    ".ct_process .ct_head, .ct_steps li",
    ".ct_faq .ct_head, .ct_faq_list li",
  ];

  groups.forEach((sel) => {
    const items = gsap.utils.toArray(sel);
    if (!items.length) return;

    // JS 실행 전 한 프레임 노출을 막는다
    gsap.set(items, { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: items[0],
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.06,
        }),
    });
  });
})();

/*=============
   히어로의 "문의 남기기" → 폼으로 부드럽게 이동
   - 메인은 Lenis 를 쓰지만 이 페이지는 안 붙어 있어 네이티브 smooth 로 처리한다.
   - 나중에 고정 헤더가 붙으면 CSS 의 --header-h 값을 읽어 그만큼 덜 내려간다.
=============*/
(function () {
  const links = document.querySelectorAll('.ct a[href^="#"]');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();

      // .ct 에 선언해 둔 헤더 높이. 헤더가 없으면 "0px" 이라 0 이 된다
      const root = document.querySelector(".ct");
      const headerH = parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;

      window.scrollTo({ top, behavior: CT_REDUCE ? "auto" : "smooth" });
    });
  });
})();

/*=============
   연락처 자동 하이픈
   - 숫자만 남기고 자릿수에 맞춰 010-0000-0000 / 02-000-0000 형태로 끼워 넣는다.
   - 지우는 중(백스페이스)에도 커서가 튀지 않도록 값이 실제로 바뀔 때만 다시 넣는다.
=============*/
(function () {
  const tel = document.getElementById("ct_tel");
  if (!tel) return;

  function format(v) {
    const n = v.replace(/\D/g, "").slice(0, 11);

    // 02 로 시작하는 서울 지역번호만 앞자리가 2개다
    if (n.startsWith("02")) {
      if (n.length < 3) return n;
      if (n.length < 7) return n.slice(0, 2) + "-" + n.slice(2);
      if (n.length < 10) return n.slice(0, 2) + "-" + n.slice(2, 5) + "-" + n.slice(5);
      return n.slice(0, 2) + "-" + n.slice(2, 6) + "-" + n.slice(6, 10);
    }
    if (n.length < 4) return n;
    if (n.length < 8) return n.slice(0, 3) + "-" + n.slice(3);
    // 10자리(010-000-0000)와 11자리(010-0000-0000)를 나눠 처리
    if (n.length === 10) return n.slice(0, 3) + "-" + n.slice(3, 6) + "-" + n.slice(6);
    return n.slice(0, 3) + "-" + n.slice(3, 7) + "-" + n.slice(7);
  }

  tel.addEventListener("input", () => {
    const before = tel.value;
    const after = format(before);
    if (before === after) return;

    // 맨 끝에서 입력 중이면 커서를 끝으로 두는 게 자연스럽다.
    // 중간을 고치는 중이면 하이픈이 늘어난 만큼 커서를 밀어준다
    const atEnd = tel.selectionStart === before.length;
    const pos = tel.selectionStart + (after.length - before.length);
    tel.value = after;
    if (!atEnd) tel.setSelectionRange(Math.max(0, pos), Math.max(0, pos));
  });
})();

/*=============
   textarea 글자 수 카운터
=============*/
(function () {
  const box = document.getElementById("ct_message");
  const out = document.querySelector(".ct_count b");
  if (!box || !out) return;

  const update = () => (out.textContent = box.value.length);
  box.addEventListener("input", update);
  update(); // 새로고침으로 값이 복원된 경우를 위해 처음에도 한 번
})();

/*=============
   참고 자료 첨부
   - 진짜 <input type="file"> 은 화면에서 숨겨두고, 바로 뒤 label(.ct_drop)이
     드롭존 겸 버튼 역할을 한다. 클릭 → 파일 창은 label[for] 이 알아서 해준다.
   - input.files 는 읽기 전용이라 직접 못 고친다. 그래서 고른 파일을 배열(store)로
     들고 있다가 DataTransfer 에 다시 담아 input.files 에 통째로 넣는다.
     이래야 "삭제 버튼"과 "드래그로 계속 추가"가 동작한다.
=============*/
(function () {
  const input = document.getElementById("ct_file");
  const drop = document.querySelector(".ct_drop");
  const listBox = document.querySelector(".ct_files");
  const field = input?.closest(".ct_field");
  const form = document.querySelector(".ct_form");
  if (!input || !drop || !listBox || !field || !form) return;

  // 제한값. 여기 숫자만 고치면 안내 문구와 검사 기준이 같이 따라간다
  const MAX_COUNT = 5;
  const MAX_SIZE = 10 * 1024 * 1024; // 파일 하나당
  const MAX_TOTAL = 25 * 1024 * 1024; // 전체 합계

  // 허용 확장자는 HTML 의 accept 를 그대로 읽어 쓴다.
  // (한 곳만 고치면 되도록. accept 는 파일 창의 필터라 우회가 가능해서 여기서 한 번 더 본다)
  const allowed = (input.getAttribute("accept") || "")
    .split(",")
    .map((s) => s.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);

  const store = []; // 지금까지 고른 File 들

  const extOf = (name) => {
    const i = name.lastIndexOf(".");
    return i > -1 ? name.slice(i + 1).toLowerCase() : "";
  };

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + "KB";
    return (bytes / 1048576).toFixed(1).replace(/\.0$/, "") + "MB";
  }

  /*--- 이 항목의 오류 문구. 다른 항목과 같은 .ct_err / .invalid 를 쓴다 ---*/
  function setError(msg) {
    field.classList.toggle("invalid", Boolean(msg));
    const box = field.querySelector(".ct_err");
    if (box) box.textContent = msg || "";
  }

  /*--- store → input.files 로 되돌려 넣기 ---*/
  function sync() {
    // DataTransfer 를 못 쓰는 아주 오래된 브라우저에선 브라우저 기본 동작에 맡긴다
    try {
      const dt = new DataTransfer();
      store.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    } catch (e) {
      /* 무시 */
    }
  }

  /*--- 목록 그리기 : 파일명은 사용자 입력이라 반드시 textContent 로 넣는다 ---*/
  function render() {
    listBox.innerHTML = "";

    store.forEach((file, i) => {
      const li = document.createElement("li");

      const badge = document.createElement("b");
      badge.textContent = extOf(file.name) || "file";

      const name = document.createElement("p");
      name.textContent = file.name;
      name.title = file.name; // 줄임표로 잘린 긴 이름을 마우스로 확인

      const size = document.createElement("span");
      size.textContent = formatSize(file.size);

      const del = document.createElement("button");
      del.type = "button";
      del.setAttribute("aria-label", file.name + " 첨부 취소");
      del.addEventListener("click", () => {
        store.splice(i, 1);
        setError(""); // 지웠으니 용량·개수 경고도 같이 내린다
        sync();
        render();
      });

      li.append(badge, name, size, del);
      listBox.appendChild(li);
    });
  }

  /*--- 파일 추가 : 걸리는 것만 걸러내고 나머지는 넣는다 ---*/
  function add(list) {
    const errs = [];
    let total = store.reduce((sum, f) => sum + f.size, 0);

    Array.from(list).forEach((file) => {
      if (store.length >= MAX_COUNT) {
        errs.push(`파일은 최대 ${MAX_COUNT}개까지 첨부할 수 있습니다.`);
        return;
      }
      if (allowed.length && !allowed.includes(extOf(file.name))) {
        errs.push(`${file.name} : 첨부할 수 없는 형식입니다.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        errs.push(`${file.name} : 파일 하나당 ${formatSize(MAX_SIZE)} 까지 첨부할 수 있습니다.`);
        return;
      }
      if (total + file.size > MAX_TOTAL) {
        errs.push(`전체 첨부 용량은 ${formatSize(MAX_TOTAL)} 를 넘을 수 없습니다.`);
        return;
      }
      // 같은 파일을 두 번 고른 경우 (이름·크기·수정시각이 모두 같으면 같은 파일로 본다)
      const dup = store.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      );
      if (dup) {
        errs.push(`${file.name} : 이미 첨부한 파일입니다.`);
        return;
      }

      store.push(file);
      total += file.size;
    });

    // 같은 문구가 여러 번 쌓이지 않게 중복을 지우고 두 개까지만 보여준다
    setError([...new Set(errs)].slice(0, 2).join(" "));
    sync();
    render();
  }

  /*--- 파일 창으로 고른 경우 : 이번에 고른 것을 기존 목록에 더한다 ---*/
  input.addEventListener("change", () => add(input.files));

  /*--- 드래그 앤 드롭 ---*/
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("drag");
    }),
  );
  ["dragleave", "dragend", "drop"].forEach((ev) =>
    drop.addEventListener(ev, () => drop.classList.remove("drag")),
  );
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) add(e.dataTransfer.files);
  });

  // 드롭존 밖에 파일을 떨어뜨리면 브라우저가 그 파일을 열어버린다(= 작성 중인 폼이 날아간다).
  // 기본 동작만 막아 아무 일도 일어나지 않게 한다
  ["dragover", "drop"].forEach((ev) =>
    window.addEventListener(ev, (e) => {
      if (!drop.contains(e.target)) e.preventDefault();
    }),
  );

  /*--- 전송 성공 후 form.reset() 이 불리면 목록도 같이 비운다 ---*/
  form.addEventListener("reset", () => {
    store.length = 0;
    setError("");
    render();
    // input.files 는 reset 기본 동작이 알아서 비우므로 sync() 는 부르지 않는다
  });
})();

/*=============
   개인정보 약관 펼치기
=============*/
(function () {
  const btn = document.querySelector(".ct_agree_more");
  const detail = document.querySelector(".ct_agree_detail");
  if (!btn || !detail) return;

  btn.addEventListener("click", () => {
    const open = detail.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "접기" : "자세히 보기";
  });
})();

/*=============
   문의 접수
   - JS 1차 정규식 검증 → fetch POST /inquiry → 서버(InquiryController) 2차 검증
   - CSRF 헤더는 /js/csrf.js 가 fetch 를 패치해 자동으로 붙인다
=============*/
(function () {
  const form = document.getElementById("ctForm");
  if (!form) return;

  const submitBtn = form.querySelector(".ct_submit");
  const result = form.querySelector(".ct_result");

  // 서버와 같은 기준
  const NAME_REGEX = /^[가-힣a-zA-Z][가-힣a-zA-Z\s]{0,19}$/;
  const PHONE_REGEX = /^0\d{1,2}-\d{3,4}-\d{4}$/;
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  /*--- 항목별 오류 표시 : 파일 블록과 같은 .ct_err / .invalid 컨벤션 ---*/
  function setFieldError(el, msg) {
    const field = el.closest(".ct_field");
    if (!field) return;
    field.classList.toggle("invalid", Boolean(msg));
    const box = field.querySelector(".ct_err");
    if (box) box.textContent = msg || "";
  }

  function validate() {
    let firstBad = null;
    const bad = (el, msg) => {
      setFieldError(el, msg);
      if (!firstBad) firstBad = el;
    };

    const name = document.getElementById("ct_name");
    const tel = document.getElementById("ct_tel");
    const email = document.getElementById("ct_email");
    const company = document.getElementById("ct_company");
    const message = document.getElementById("ct_message");
    const agree = form.querySelector('input[name="agree"]');
    const services = form.querySelectorAll('input[name="services"]:checked');

    [name, tel, email, company, message].forEach((el) => setFieldError(el, ""));
    setFieldError(form.querySelector(".ct_chips_set"), "");
    setFieldError(agree, "");

    if (!NAME_REGEX.test(name.value.trim())) bad(name, "이름을 한글/영문 2~20자로 입력해주세요.");
    if (!PHONE_REGEX.test(tel.value.trim())) bad(tel, "연락처 형식이 올바르지 않습니다. (예: 010-0000-0000)");
    if (!EMAIL_REGEX.test(email.value.trim())) bad(email, "이메일 형식이 올바르지 않습니다.");
    if (company.value.trim().length > 100) bad(company, "회사/브랜드명은 100자 이내로 입력해주세요.");
    if (!services.length) bad(form.querySelector(".ct_chips_set"), "문의 서비스를 1개 이상 선택해주세요.");
    const msgLen = message.value.trim().length;
    if (msgLen < 10 || msgLen > 2000) bad(message, "프로젝트 내용을 10자 이상 2000자 이내로 입력해주세요.");
    if (!agree.checked) bad(agree, "개인정보 수집 및 이용에 동의해주세요.");

    if (firstBad) {
      firstBad.closest(".ct_field")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (result) {
      result.textContent = "";
      result.classList.remove("ok", "error");
    }
    if (!validate()) return;

    // 서버 DTO(InquiryDTO) 필드명으로 담는다
    const formData = new FormData();
    formData.append("writer", document.getElementById("ct_name").value.trim());
    formData.append("phone", document.getElementById("ct_tel").value.trim());
    formData.append("email", document.getElementById("ct_email").value.trim());
    formData.append("companyName", document.getElementById("ct_company").value.trim());
    formData.append(
      "service",
      [...form.querySelectorAll('input[name="services"]:checked')].map((c) => c.value).join(", "),
    );
    formData.append("businessPrice", document.getElementById("ct_budget").value || "");
    formData.append("businessDate", document.getElementById("ct_schedule").value || "");
    formData.append("content", document.getElementById("ct_message").value.trim());
    formData.append("agree", "Y");
    formData.append("homepage", form.querySelector('[name="homepage"]').value);

    const fileInput = document.getElementById("ct_file");
    [...(fileInput?.files || [])].forEach((file) => formData.append("uploadFiles", file));

    submitBtn.disabled = true;
    submitBtn.textContent = "보내는 중...";

    Promise.resolve({ok: true, json: () => Promise.resolve({message: "퍼블리싱 미리보기입니다. 실제 문의는 전송되지 않습니다."})})
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (ok) {
          form.reset();
          document.querySelector(".ct_count b").textContent = "0";
          if (result) {
            result.textContent = body.message || "문의가 접수되었습니다.";
            result.classList.add("ok");
          }
          alert(body.message || "문의가 접수되었습니다.");
        } else {
          if (result) {
            result.textContent = body.message || "접수에 실패했습니다.";
            result.classList.add("error");
          }
          alert(body.message || "접수에 실패했습니다. 입력 내용을 확인해주세요.");
        }
      })
      .catch(() => alert("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요."))
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "문의 보내기";
      });
  });
})();

/*=============
   FAQ 아코디언
   - 한 번에 하나만 열린다. 다른 걸 누르면 열려 있던 게 닫힌다.
=============*/
(function () {
  const items = gsap.utils.toArray(".ct_faq_list li");
  if (!items.length) return;

  items.forEach((li) => {
    const q = li.querySelector(".ct_faq_q");
    const a = li.querySelector(".ct_faq_a");
    if (!q || !a) return;

    q.addEventListener("click", () => {
      const willOpen = !q.classList.contains("open");

      // 먼저 전부 닫고
      items.forEach((other) => {
        other.querySelector(".ct_faq_q")?.classList.remove("open");
        other.querySelector(".ct_faq_q")?.setAttribute("aria-expanded", "false");
        other.querySelector(".ct_faq_a")?.classList.remove("open");
      });

      // 눌린 것이 닫혀 있었다면 그것만 연다 (같은 걸 다시 누르면 닫히는 셈)
      if (willOpen) {
        q.classList.add("open");
        q.setAttribute("aria-expanded", "true");
        a.classList.add("open");
      }
    });
  });
})();
