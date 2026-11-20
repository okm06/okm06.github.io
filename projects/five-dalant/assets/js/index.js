/*=====================================================================
   메인 페이지 전용 스크립트 : 빠른 상담(.q_contact) 접수
   - JS 1차 정규식 검증 → fetch POST /inquiry/quick → 서버 2차 검증
   - CSRF 헤더는 /js/csrf.js 가 fetch 를 패치해 자동으로 붙인다
=====================================================================*/
(function () {
  const form = document.getElementById("quickForm");
  if (!form) return;

  const name = document.getElementById("qc_name");
  const phone = document.getElementById("qc_phone");
  const service = document.getElementById("qc_service");
  const agree = document.getElementById("qc_agree");
  const submitBtn = form.querySelector(".submit_btn");

  // 서버(InquiryController)와 같은 기준
  const NAME_REGEX = /^[가-힣a-zA-Z][가-힣a-zA-Z\s]{0,19}$/;
  const PHONE_REGEX = /^0\d{1,2}-\d{3,4}-\d{4}$/;

  /*--- 연락처 자동 하이픈 (contact.js 와 같은 규칙) ---*/
  phone.addEventListener("input", () => {
    const n = phone.value.replace(/\D/g, "").slice(0, 11);
    let v = n;
    if (n.startsWith("02")) {
      if (n.length >= 3 && n.length < 7) v = n.slice(0, 2) + "-" + n.slice(2);
      else if (n.length >= 7 && n.length < 10) v = n.slice(0, 2) + "-" + n.slice(2, 5) + "-" + n.slice(5);
      else if (n.length >= 10) v = n.slice(0, 2) + "-" + n.slice(2, 6) + "-" + n.slice(6, 10);
    } else if (n.length >= 4) {
      if (n.length < 8) v = n.slice(0, 3) + "-" + n.slice(3);
      else if (n.length === 10) v = n.slice(0, 3) + "-" + n.slice(3, 6) + "-" + n.slice(6);
      else v = n.slice(0, 3) + "-" + n.slice(3, 7) + "-" + n.slice(7);
    }
    phone.value = v;
  });

  /*--- 접수 ---*/
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!NAME_REGEX.test(name.value.trim())) {
      alert("이름을 정확히 입력해주세요. (한글/영문 2~20자)");
      name.focus();
      return;
    }
    if (!PHONE_REGEX.test(phone.value.trim())) {
      alert("연락처를 정확히 입력해주세요. (예: 010-0000-0000)");
      phone.focus();
      return;
    }
    if (!service.value) {
      alert("상담 서비스를 선택해주세요.");
      service.focus();
      return;
    }
    if (!agree.checked) {
      alert("개인정보 이용에 동의해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("writer", name.value.trim());
    formData.append("phone", phone.value.trim());
    formData.append("service", service.value);
    formData.append("agree", "Y");
    formData.append("homepage", form.querySelector('[name="homepage"]').value);

    submitBtn.disabled = true;

    Promise.resolve({ok: true, json: () => Promise.resolve({message: "퍼블리싱 미리보기입니다. 실제 문의는 전송되지 않습니다."})})
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (ok) {
          alert(body.message || "빠른 상담이 접수되었습니다.");
          form.reset();
        } else {
          alert(body.message || "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      })
      .catch(() => alert("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요."))
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
})();
