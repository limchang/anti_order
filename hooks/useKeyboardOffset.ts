import { useState, useEffect } from 'react';

/**
 * 모바일 키보드가 열릴 때 화면 아래쪽에 고정된 모달의 위치를 조정하기 위한 훅.
 * visualViewport API를 사용해 키보드 높이를 감지합니다.
 * @param active - 모달이 열려있는지 여부 (닫혀있으면 0 반환)
 * @returns 키보드 높이값 (px)
 */
export function useKeyboardOffset(active: boolean): number {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (!active) {
            setOffset(0);
            return;
        }

        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => {
            // visualViewport.height 감소 = 키보드가 차지하는 높이
            const kbH = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop ?? 0));
            setOffset(kbH);
        };

        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        update(); // 즉시 한 번 실행

        return () => {
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
        };
    }, [active]);

    return offset;
}
