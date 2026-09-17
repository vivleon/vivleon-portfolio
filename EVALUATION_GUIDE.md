# 답변

이 문서는 현재 `main` 브랜치 소스 기준으로, 평가 항목별 답변·구현 위치·검증 근거를 한 번에 확인할 수 있도록 정리한 자료입니다. 아래 라인 번호는 이 문서를 작성한 시점의 최신 코드 라인입니다.

## 항목 1 — 동작 확인

### 반응형 레이아웃

- 위치: `css/style.css:295-304`, `css/style.css:1131-1155`, `css/style.css:1289-1340`
- 답변: 기본 스타일을 모바일 기준으로 작성하고, 768px부터 메뉴와 콘텐츠를 데스크톱 레이아웃으로 확장합니다. 1024px부터는 Hero·섹션·연락 폼을 더 넓은 Grid로 배치합니다. 브라우저 폭을 줄이면 모바일 메뉴가 햄버거 버튼으로 바뀌고, 폭을 넓히면 가로 네비게이션으로 돌아옵니다.

### 다크/라이트 테마와 새로고침 유지

- 위치: `js/script.js:45-82`, `js/script.js:402-408`, `css/style.css:1-43`
- 답변: 테마 버튼 클릭 이벤트가 다음 테마를 계산하고 `applyTheme()`이 `data-theme`, 버튼의 `aria-pressed`, 브라우저 테마 색상을 변경합니다. 선택한 값은 `localStorage`의 `vivleon-theme`에 저장하므로 새로고침 후에도 유지됩니다. 저장값이 없으면 운영체제의 `prefers-color-scheme`를 따릅니다.

### 햄버거 메뉴·스크롤 애니메이션·맨 위로 가기

- 위치: `js/script.js:84-126`, `js/script.js:128-147`, `js/script.js:410-423`
- 답변: 햄버거 버튼은 `active` 클래스와 `aria-expanded`를 함께 변경합니다. 앵커 링크는 기본 이동을 막고 `scrollIntoView({ behavior: 'smooth' })`로 이동합니다. `IntersectionObserver`가 `.reveal` 요소에 `is-visible`을 추가해 등장 애니메이션을 실행하며, 300px 이상 스크롤하면 맨 위로 가기 버튼을 표시합니다.

### GitHub API와 로딩/에러/빈 상태

- 위치: `js/script.js:188-211`, `js/script.js:280-309`, `index.html:248-266`
- 답변: 페이지 시작 시 `loadProjects()`가 GitHub 저장소 API를 호출합니다. 요청 중에는 `loading`, HTTP 오류나 네트워크 오류에는 `error`와 다시 시도 버튼, 결과가 없으면 `empty`, 정상 결과에는 프로젝트 카드 목록을 표시합니다. Fork와 archived 저장소는 필터링합니다.

### 필수값·이메일 형식 즉시 피드백

- 위치: `js/script.js:329-341`, `js/script.js:350-364`, `js/script.js:432-438`, `index.html:282-309`
- 답변: 이름·이메일·메시지 입력 이벤트마다 `validateField()`가 실행됩니다. 빈 값과 이메일 정규식 오류를 즉시 표시하고 `invalid`, `aria-invalid`, 오류 문구를 갱신합니다. 제출할 때도 모든 필드를 다시 검사하고, 첫 번째 오류 필드에 포커스를 이동합니다.

## 항목 2 — 구조와 기본 문법

### HTML·CSS·JavaScript 분리

- 위치: `index.html:1-12`, `css/style.css:1`, `js/script.js:1`
- 답변: HTML은 콘텐츠와 시맨틱 구조, CSS는 색상·레이아웃·반응형·애니메이션, JavaScript는 이벤트·상태·API·폼 동작을 담당합니다. 역할을 분리하면 파일별 책임이 명확하고 유지보수와 재사용이 쉬워집니다.

### 시맨틱 태그 선택

- 위치: `index.html:17-47`, `index.html:48-86`, `index.html:88-311`, `index.html:314-327`
- 답변: `header`는 사이트 상단, `nav`는 주요 이동 메뉴, `main`은 페이지의 핵심 콘텐츠, `section`은 소개·경력·기술·프로젝트·연락이라는 주제별 영역, `footer`는 하단 정보에 사용했습니다. 태그의 의미와 콘텐츠 역할이 일치하도록 선택해 접근성과 문서 구조를 높였습니다.

### CSS 변수 사용 이유

- 위치: `css/style.css:1-43`
- 답변: 색상·글꼴·간격·모서리·전환 시간을 `:root` 변수로 정의하고, 다크 모드에서는 같은 변수 이름에 어두운 값을 재정의합니다. 값 하나를 바꾸면 전체 화면에 일관되게 반영되고, 라이트/다크 테마 전환과 디자인 수정이 쉬워집니다.

### `addEventListener`를 사용한 이유

- 위치: `js/script.js:402-447`
- 답변: HTML의 인라인 `onclick` 대신 JavaScript에서 `addEventListener`로 이벤트를 연결했습니다. 인라인 방식은 마크업과 동작이 강하게 결합되고 이벤트를 여러 개 관리하기 어렵지만, `addEventListener`는 구조와 동작을 분리하고 같은 요소에 여러 이벤트를 등록할 수 있으며 이벤트 로직을 한 곳에서 테스트·관리하기 쉽습니다.

## 항목 3 — 코드 흐름과 자료 처리

### 예시: GitHub API의 “이벤트 → 상태 변경 → 화면 업데이트”

1. 이벤트/시작: `js/script.js:449-456`의 `initialize()`가 페이지 초기화 때 `loadProjects()`를 호출합니다.
2. 상태 변경: `js/script.js:281-284`에서 `projectState.status = 'loading'`으로 바꾸고, `js/script.js:286-306`에서 성공·빈 결과·실패 상태를 결정합니다.
3. 화면 업데이트: `js/script.js:308`의 `renderProjects()`가 현재 상태를 읽습니다. `js/script.js:188-211`은 loading/error/empty 안내를, `js/script.js:234-278`은 성공한 프로젝트 카드와 필터를 DOM에 그립니다.

바로 말할 답변: “API 호출 전 상태를 loading으로 바꾸고 먼저 로딩 화면을 렌더링합니다. 응답을 받으면 프로젝트 배열과 status를 갱신한 뒤 `renderProjects()`가 상태에 맞는 안내 또는 카드 UI를 다시 그립니다.”

### `async/await`와 `try/catch`의 성공·실패 분기

- 위치: `js/script.js:280-309`
- 답변: `loadProjects()`를 `async` 함수로 만들고 `await fetch()`와 `await response.json()`으로 비동기 결과를 순서대로 받습니다. 응답이 `ok`가 아니면 오류를 던지고, `try` 안에서 정상 저장소를 필터링·정렬합니다. 네트워크 오류나 API 오류는 `catch`에서 `projectState.status = 'error'`와 오류 문구로 바꾼 뒤 다시 렌더링합니다.

### `filter`·`map`으로 GitHub 데이터를 카드로 변환

- 위치: `js/script.js:213-231`, `js/script.js:243-277`, `js/script.js:299-301`
- 답변: 먼저 API 배열에서 `filter()`로 fork·archived 저장소와 선택하지 않은 언어를 제외합니다. `map()`으로 언어 필터 버튼을 만들고, 보이는 프로젝트 배열에도 `map()`을 적용합니다. 각 저장소의 이름·설명·언어·별 수·수정일을 구조 분해한 뒤 템플릿 리터럴로 `<article class="project-card">`를 만들고 `join('')`으로 한 번에 DOM에 삽입합니다.

### Flexbox와 Grid를 적용한 이유

- Flexbox 위치: `css/style.css:156-164`의 `.nav-shell`, `css/style.css:1142-1155`의 데스크톱 `.nav-links`
- Grid 위치: `css/style.css:830-835`의 `.project-grid`, `css/style.css:1318-1329`의 넓은 화면 섹션 레이아웃
- 답변: Flexbox는 로고·메뉴·토글처럼 한 줄의 주축을 따라 정렬하고 간격을 조절하는 데 적합합니다. Grid는 프로젝트 카드나 섹션처럼 행·열 구조가 필요한 콘텐츠에 적합하며, `auto-fit`과 `minmax()`로 화면 너비에 맞춰 열 수가 자동으로 바뀝니다.

## 항목 4 — 상태 관리와 반응형 전략

### `projectState` 객체를 만든 이유

- 위치: `js/script.js:30-37`, 사용처 `js/script.js:188-320`
- 답변: 프로젝트의 로딩 상태, 데이터 배열, 현재 필터, 오류 메시지는 서로 관련된 하나의 상태 묶음이므로 `projectState` 객체로 관리했습니다. 여러 전역 변수를 흩어 놓으면 어떤 값이 함께 바뀌어야 하는지 추적하기 어렵고 렌더링 누락이 생기기 쉽습니다. 객체로 묶으면 `renderProjects()`가 한 상태 원본을 읽어 일관된 화면을 만들 수 있습니다.

### 모바일 퍼스트를 선택한 이유

- 위치: 기본 모바일 스타일 `css/style.css:195-219`, `css/style.css:295-304`; 데스크톱 확장 `css/style.css:1131-1155`, `css/style.css:1289-1340`
- 답변: 작은 화면을 먼저 설계하면 핵심 콘텐츠와 터치 조작을 우선 보장할 수 있고, 이후 `min-width` 미디어 쿼리로 공간이 넓어질 때만 레이아웃을 확장하면 됩니다. 따라서 불필요한 덮어쓰기 CSS가 줄고 모바일·데스크톱 양쪽의 유지보수가 쉬워집니다.

## 검증 근거

- JavaScript 문법: `node --check js/script.js`
- 정적 요구사항: `node tests/validate.mjs` → `정적 요구사항 검증을 통과했습니다.`
- 공백·패치 검사: `git diff --check`
- 저장소: [github.com/vivleon/vivleon-portfolio](https://github.com/vivleon/vivleon-portfolio)
- 배포 페이지: [vivleon.github.io/vivleon-portfolio](https://vivleon.github.io/vivleon-portfolio/)

