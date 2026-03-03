# 🚀 주문수집기 (anti_order) AI 어시스턴트 규약 및 개발 가이드

이 문서(`assistant_guide.md`)는 `anti_order` 프로젝트를 지원하는 모든 AI 어시스턴트가 반드시 준수해야 하는 핵심 요구사항, UI/UX 철학, 그리고 문제 해결 이력을 담고 있습니다. 코드를 수정하거나 기능을 추가하기 전에 반드시 이 문서를 숙지하세요.

---

## 🎨 1. 핵심 UI/UX 스타일 가이드 (가장 중요)
이 앱은 철저하게 **토스(Toss) 스타일**을 지향합니다. 사용자 경험은 직관적이고 경쾌해야 하며, 디자인은 모던하고 심플해야 합니다.

*   **곡률 (Border Radius)**: 
    *   버튼, 카드, 모달 등 모서리가 둥근 요소를 적극적으로 사용합니다 (`rounded-2xl`, `rounded-3xl`, `rounded-[32px]`).
    *   각진 디자인(`rounded-sm` 등)은 절대 피하십시오.
*   **그림자 (Shadow)**: 
    *   부드럽고 넓게 퍼지는 그림자를 사용하여 요소의 깊이감을 표현합니다 (`shadow-sm`, `shadow-md`, 커스텀 `shadow-[0_8px_40px_rgba(...)]`).
*   **애니메이션 (Animation & Micro-interactions)**:
    *   `framer-motion`을 사용하여 요소를 누르거나(active state), 팝업이 뜨고 질 때 부드러운 전환 효과(spring animation, `active:scale-95`)를 적용합니다.
*   **버튼 디자인**:
    *   아이콘과 텍스트를 함께 배치하며 간격을 충분히 줍니다 (`flex items-center gap-2`).
    *   주요 액션 버튼은 크고 굵은 폰트를 사용합니다 (`font-black`, `h-14` 이상).
*   **리스트 및 팝업/바텀시트 메뉴 일관성**:
    *   전체 메뉴나 테이블 설정 등 목록(List) 형태의 메뉴 구성 시, 통일된 구조를 사용해야 합니다.
    *   **컨테이너 클래스**: `bg-white p-2 rounded-2xl space-y-1 border border-toss-grey-100 shadow-sm`
    *   **개별 메뉴 아이템 클래스**: `w-full flex items-center justify-between px-4 py-3.5 hover:bg-toss-grey-50 rounded-2xl transition-colors active:scale-95`
    *   메뉴 아이템 내부는 `div className="flex items-center gap-4"` 로 아이콘과 텍스트(`text-[14px] font-black text-toss-grey-800`)를 묶고, 우측에 화살표 등을 배치하는 식으로 구성합니다.
*   **색상 (Color Palette)**:
    *   `tailwind.config.js`에 정의된 `toss-*` 커스텀 색상을 사용합니다.
    *   기본 배경은 밝은 회색(`bg-toss-bg`), 주요 포인트 색상은 파란색(`text-toss-blue`)을 사용합니다.
*   **아이콘 (Icons)**:
    *   반드시 `lucide-react` 라이브러리를 사용합니다.
*   **레이아웃 (Layout)**:
    *   iOS/Android 기본 모바일 앱처럼 꽉 차고 스크롤 바를 숨긴(`no-scrollbar`) 형태의 수직적 구조를 기본으로 합니다.

---

## 🧠 2. 핵심 기능 및 컴포넌트 아키텍처

### 2.1 주요 상태 관리 (`App.tsx`)
*   `groups`: 전체 테이블 및 주문 데이터를 관리하는 핵심 상태 배열입니다.
*   `history`: 완료된 주문을 저장하는 내역 상태입니다. 내역을 저장할 때 그룹 데이터의 'Deep Copy(깊은 복사)'를 반드시 수행해야 합니다.
*   `appSettings`: 사용자 설정(사이즈 표시 여부, 다크 모드, 광고 표시 유무 등)을 관리하고 `localStorage`에 유지합니다.

### 2.2 주문 확인 창 (`OrderSummary.tsx`)
*   사용자 요구사항 1순위: **광고 닫기(1시간 혜택) 기능과 주문 확인 창 축소 기능은 완벽히 분리되어 동작해야 합니다.**
    *   `handleCloseAd` 호출 시: `setShowAdPopup(false)`만 실행되어야 합니다.
    *   `onSetExpandState('collapsed')`를 함께 호출하면 광고 창 외에 전체 주문 내역 창까지 닫혀버리는 심각한 버그가 발생했었으므로, **절대 추가하지 마십시오.**

### 2.3 광고 컴포넌트 (`CoupangAd.tsx`)
*   **광고 크기 및 레이아웃**:
    *   가로형 직사각형 쿠팡 배너(`iframe`)를 사용합니다. 정사각형 레이아웃은 사용하지 않습니다.
    *   광고 주변 여백(Padding)을 줄여 컴팩트하게 배치합니다.
*   **광고 클릭 인식 로직 (매우 중요)**:
    IFRAME은 기본적으로 브라우저의 React Click 이벤트를 먹어버리므로, 다음 4가지 방식을 혼합하여 클릭을 정확히 100% 잡아내야 합니다.
    1.  **영역 감지**: `isMouseOverAdRef`를 `useRef`로 관리하여, 해당 div 안에서 이탈이 일어나는지(Click 포함) 감지.
    2.  **`blur` 이벤트**: 사용자가 IFRAME 안을 클릭하여 브라우저 포커스가 IFRAME으로 넘어가는 것을 감지.
    3.  **`focus` 이벤트 / `visibilitychange`**: 앱을 벗어났다(다른 앱, 쿠팡 열림 등) 다시 브라우저로 돌아오는 순간을 포착.
    4.  **Polling 백업**: 일정 주기로(500ms) `document.activeElement`가 `IFRAME`인지 확인.

### 2.4 모바일 환경 대응 (PWA)
*   사용자는 **"브라우저 주소창 없이 전체 화면 구동"**을 원합니다.
*   PWA 설치가 안되거나 주소창이 사라지지 않는 문의가 들어오면 다음을 먼저 점검하세요:
    *   `vite.config.ts`의 `VitePWA` 플러그인에 `display: "standalone"` 설정.
    *   `public/manifest.json` 내 `display: "standalone"`.
    *   (가장 흔한 원인) `public/.well-known/assetlinks.json` 파일의 `sha256_cert_fingerprints` 값이 실제 빌드된 APK의 인증서 지문과 완벽하게 일치하는지.

### 2.5 어시스턴트 가이드 팝업 트리거 로직
*   **사이즈 옵션 안내 창 (`showSizeGuide`)**:
    *   **트리거 조건**: 전체 groups에서 아직 아무도 메뉴를 확정하지 않은 상태에서, 처음으로 어떤 인원의 메뉴가 결정될 때.
    *   **감지 경로**: `OrderCard.handleInitialOrderFinalize` (퀵메뉴/더보기 선택) → `onMenuFirstSelected` prop 콜백 → `App.handleMenuFirstSelected` 또는 `MenuSelectionModal.onFirstSelect` → `App.handleMenuFirstSelected`
    *   **핵심**: `handleMenuFirstSelected`는 `groups` state(업데이트 이전 클로저)를 보므로 "이전에 아무도 주문하지 않았는지"를 정확히 판단함. stale closure가 오히려 정확한 타이밍 보장.
    *   **중복 방지**: `localStorage.cafesync_size_guide_shown` 키 존재 여부로 최초 1회만 표시.
*   **공용 메뉴 안내 창 (`showSharedGuide`)**:
    *   **트리거 조건**: `groups` 중 하나라도 아바타가 있는 개인 인원이 4명 이상이고, 그 모두의 메뉴가 '미정'이 아닌 상태(안 먹음 포함 OK)로 확정될 때.
    *   **중복 방지**: `localStorage.cafesync_shared_guide_shown` 키 존재 여부로 최초 1회만 표시.

---

## 📜 3. 이전 이슈 및 수정 히스토리 (오답 노트)

1.  **광고 클릭 인식이 전혀 안 되는 문제**:
    *   원인: IFRAME 내부 클릭 이벤트를 React가 감지하지 못함. 모바일 환경의 TouchStart/End 타이밍 문제.
    *   해결: `blur`, `focus`, `visibilitychange` 이벤트 리스너 병합 및 `document.activeElement` 체크.

2.  **버튼 텍스트 직관성 문제**:
    *   사용자 요청에 따라 광고 버튼 텍스트를 "광고 클릭 시 활성화" -> "닫기 (1시간 혜택 적용)"으로 단계별 변경하도록 수정됨.

3.  **광고 닫기 버튼 누르면 주문 창까지 꺼지는 문제**:
    *   원인: `handleCloseAd` 함수 안에 요약 창 상태를 닫는 `onSetExpandState('collapsed')`를 포함해 버렸기 때문.
    *   해결: 해당 줄 삭제.

4.  **버전 업데이트 적용 꼬임 현상**:
    *   원인: `App.tsx` 하단 레이아웃을 수정하다가 기존의 "총원" 개수(totalPeople)를 렌더링하던 UI를 날려먹고 버전 텍스트를 중복해서 집어넣음.
    *   해결: `OrderSummary.tsx`에서 잘못 위치된 버전 정보를 롤백하고 본래의 "총원" UI로 복원. 앱 메인(`App.tsx` 전체 메뉴 최하단)으로 버전 정보 이동.

---

## 🛑 4. 어시스턴트 코드 작성 규율

*   **상태 보존**: 코드의 일부분을 수정할 때, **기존의 잘 동작하는 애니메이션 프레임(`AnimatePresence`, `motion` 객체 props)이나 Tailwind 유틸리티 클래스(`flex`, `items-center` 등)를 임의로 누락시키지 마십시오.**
*   **컴포넌트 책임 분리**: `OrderSummary.tsx`가 너무 비대해졌습니다. 단순 레이아웃 버그 픽스가 아니라면 하위 컴포넌트 생성을 고려하되, 전체적인 `states` 연결성이 깨지지 않도록 매우 주의하십시오.
*   **테스트 주의**: 웹 환경이므로 항상 `npm run dev` 상황에서의 렌더링, `npm run build` 상황에서의 정적 체크 린트오류(`totalPeople` is not defined 등)가 없는지 스스로 교차 검증(`multi_replace_file_content` 사용)을 철저히 해야 합니다.
*   **⚠️ 배포 및 버전 관리 (절대 잊지 말 것!)**:
    *   새로운 기능을 퍼블리싱(배포)하거나 코드를 수정했다면, **반드시 `App.tsx` 내의 `APP_VERSION` 상수를 상향하고 Last Updated 시간을 현 시점으로 갱신**하십시오.
    *   동시에 **`UpdatePopup.tsx`를 열어 사용자에게 퍼블리싱된 최신 변경 사항들을 알리는 내용(`updates` 배열)을 추가/수정**하십시오. 모바일 PWA 환경에서 사용자가 즉시 새 기능과 수정을 인지하도록 강제하는 수단입니다.
    *   **마무리 할 때는 무조건 배포를 수행하며, 버그 픽스 및 변경된 안내 사항을 공지사항으로 제공하는 것을 절대 엄격히 지침으로 준수**하십시오.
    *   **사용자가 "작동 확인" 이라고 말하면, 버전을 0.1 단위로 올림하여 배포하십시오. (예: 1.0.x -> 1.1.0)**

---
*Created by Antigravity AI on 2026-03-02.*
