# 🤖 Gemini Assistant Guide (anti_order)

> [!NOTE]
> 이 가이드는 [README.md](./README.md)의 핵심 규칙을 구체화한 것입니다.

이 파일은 Gemini AI 어시스턴트가 `anti_order` 프로젝트에서 코드를 수정하거나 기능을 추가할 때 반드시 제1순위로 준수해야 하는 **절대 규칙**을 담고 있습니다.

---

## 🎨 1. 디자인 철학: "철저한 토스(Toss) 스타일"
*   **둥근 곡률 유지**: 모든 카드, 버튼, 팝업은 `rounded-2xl` (16px) 또는 `rounded-3xl` (24px)을 사용합니다. 각진 디자인은 절대 금지입니다.
*   **경쾌한 반응성**: 모든 클릭 요소에는 `active:scale-95`와 같은 미세한 피드백을 추가합니다 (`framer-motion` 활용).
*   **부드러운 깊이감**: 넓게 퍼지는 부드러운 그림자(`shadow-sm`, `shadow-md`)를 사용하여 모던한 느낌을 유지합니다.

## ⚠️ 2. 배포 및 버전 관리 (치명적 오류 방지)
*   **버전 동기화**: `App.tsx`의 `APP_VERSION`과 `public/version.json`의 `version` 값은 **반드시 100% 일치**해야 합니다.
    *   두 값이 다를 경우 앱이 무한 리로드 루프에 빠져 서버가 마비될 수 있습니다.
*   **공지 자동 업데이트**: 버전을 올릴 때는 반드시 `components/UpdatePopup.tsx`의 `updates` 배열에 변경 사항을 한글로 기술해야 합니다.

## 📢 3. 광고 및 UI 연동 규칙
*   **광고-요약창 분리**: 주문 요약창(`OrderSummary.tsx`)을 닫을 때, 광고 팝업이 함께 닫히게 설정하지 마세요. 사용자는 광고 혜택(1시간 제거)을 위해 광고 창만 별도로 닫길 원합니다.
*   **광고 클릭 감지**: `iframe` 특성상 클릭 감지가 어려우므로 `blur`, `focus`, `visibilitychange` 이벤트를 복합적으로 사용한 기존 로직을 보존하십시오.

## 📱 4. PWA 및 주소창 제거
*   **전체 화면 보장**: 설치된 앱에서 주소창이 보인다면 `public/.well-known/assetlinks.json`의 SHA256 지문을 구글 플레이 콘솔의 "앱 서명 키" 지문과 일치시키십시오.

---

> [!IMPORTANT]
> 상세한 구현 히스토리와 오답 노트는 `assistant_guide.md` 파일을 추가로 참조하십시오.
