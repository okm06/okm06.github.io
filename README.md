# 오경민 포트폴리오

HTML, CSS, JavaScript로 구성한 정적 포트폴리오입니다.

## 실행

`index.html`을 브라우저에서 열면 됩니다. 별도의 패키지 설치, 개발 서버, 빌드 과정이 필요하지 않습니다. 에디터의 Live Server로 실행해도 됩니다.

## 파일 구성

- `index.html`: 내비게이션, 소개, 기술 스택, 프로젝트, 경력, 연락처
- `src/index.css`: 모든 스타일을 `@import url(...)`로 모으는 진입 파일
- `src/assets/css/base.css`: 초기화, 색상 변수, 글꼴 등 공통 스타일
- `src/assets/css/`: 섹션별 스타일과 반응형 레이아웃
- `src/assets/icons/`: SVG 아이콘
- `images/`: 프로젝트별 WebP 썸네일 (브라우저 화면 캡처)
- `projects/five-dalant/`: 다섯달란트 리뉴얼 퍼블리싱 데모 (문의 전송 없음)
- `src/assets/vendor/`: GSAP 3.15.0, ScrollTrigger, Lenis 1.3.23의 브라우저용 파일
- `src/main.js`: 모바일 메뉴, 제목 기울기, 스크롤·호버 애니메이션

프로젝트와 연락처는 `index.html`에서 수정합니다. 경력은 같은 파일의 `id="experience"` 섹션에서 수정합니다.

CSS를 추가할 때는 `src/index.css`에 `@import url(...)`을 추가합니다. HTML의 스타일시트 연결은 하나로 유지합니다.

애니메이션 라이브러리는 로컬 파일로 연결되어 있습니다. 글꼴과 기술 아이콘 스타일은 외부 CDN을 사용하므로 인터넷 연결이 필요합니다. 라이브러리를 업데이트할 때는 파일의 라이선스 고지와 동봉된 라이선스를 유지하세요.

## 배포

공개 주소: https://okm06.github.io/

GitHub 저장소 `okm06/okm06.github.io`의 `main` 브랜치 루트를 GitHub Pages에 연결합니다. 해당 브랜치에 변경 사항을 올리면 자동으로 배포됩니다. `.nojekyll` 파일은 정적 파일을 그대로 제공하기 위한 설정입니다.

`index.html`, `src/`, `images/`, `projects/` 폴더를 함께 정적 웹 호스팅에 업로드하세요. 프로젝트 링크는 새 탭으로 열리며, YOZM은 종료된 이벤트의 공식 게시물로 연결합니다. 데모의 외부 CDN 라이브러리와 폰트는 인터넷 연결이 필요합니다.
