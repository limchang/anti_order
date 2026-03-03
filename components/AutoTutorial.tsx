import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pointer, X } from 'lucide-react';

interface AutoTutorialProps {
    onComplete: () => void;
}

interface TutorialStep {
    selector: string;
    text: string;
}

const steps: TutorialStep[] = [
    { selector: '[data-tutorial="emoji-picker-btn"]', text: '아바타 고를 수 있다.' },
    { selector: '[data-tutorial="menu-badge"]', text: '퀵메뉴에서 바로 메뉴 등록한다.\n더 많은 메뉴는 [메뉴판 보기] 클릭!' },
    { selector: '[data-tutorial="quick-all"]', text: '모두 아메리카노 누르면 이모지 까지 한번에 설정 가능!' },
    { selector: '[data-tutorial="summary-btn"]', text: '주문 확인하면 된다!' },
    { selector: '[data-tutorial="ad-banner"]', text: '메인 광고 한번만 눌러주면 1시간동안 광고 없어요 ~' },
];

export const AutoTutorial: React.FC<AutoTutorialProps> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (stepIndex >= steps.length) {
            onComplete();
            return;
        }

        const step = steps[stepIndex];
        let frameId: number;

        const updateRect = () => {
            if (step.selector) {
                // 특정 selector를 가진 모든 요소를 찾아 첫 번째로 보이는 요소를 찾음
                const elements = Array.from(document.querySelectorAll(step.selector));
                const el = elements.find(e => {
                    const rect = e.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
                });

                if (el) {
                    setTargetRect(el.getBoundingClientRect());
                } else {
                    setTargetRect(null); // 요소가 아직 렌더링되지 않음
                }
            } else {
                setTargetRect(null);
            }
            frameId = requestAnimationFrame(updateRect);
        };

        updateRect();

        return () => cancelAnimationFrame(frameId);
    }, [stepIndex, onComplete]);

    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // X 버튼(안내 모달 닫기)은 항상 허용
            const closeBtn = document.getElementById('tutorial-close-btn');
            if (closeBtn && closeBtn.contains(e.target as Node)) {
                return;
            }

            const step = steps[stepIndex];
            if (!step || !step.selector) return;

            const elements = Array.from(document.querySelectorAll(step.selector));
            const el = elements.find(el => el.contains(e.target as Node));

            if (el) {
                // 정확한 타겟을 클릭했으면 약간의 지연 후 튜토리얼 단계를 넘김
                setTimeout(() => setStepIndex(s => s + 1), 300);
            } else {
                // 타겟 이외의 곳 클릭 막기 (사용자가 강제로 튜토리얼을 따라가게 함)
                e.stopPropagation();
                e.preventDefault();
            }
        };

        // DOM 트리의 최상단에서 이벤트를 가로채기 위해 캡처링 단계 사용
        document.addEventListener('click', handleGlobalClick, true);
        return () => document.removeEventListener('click', handleGlobalClick, true);
    }, [stepIndex]);

    const currentStep = steps[stepIndex];
    if (!currentStep) return null;

    // 안내창의 대략적인 높이와 하단 기본 위치
    const captionHeight = 150;
    let captionYPos = window.innerHeight / 2 - captionHeight / 2;

    if (targetRect) {
        const targetCenterY = targetRect.top + targetRect.height / 2;
        if (targetCenterY < window.innerHeight / 2) {
            captionYPos = targetRect.bottom + 24;
        } else {
            captionYPos = targetRect.top - captionHeight - 24;
        }

        // 화면 밖으로 나가지 않도록 최소/최대값 보정
        if (captionYPos < 20) captionYPos = 20;
        if (captionYPos + captionHeight > window.innerHeight - 60) {
            captionYPos = window.innerHeight - captionHeight - 60;
        }
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* 상단/하단 유동적 안내 메시지 */}
            <motion.div
                animate={{ top: captionYPos }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="absolute left-4 right-4 z-[10000] bg-white/95 backdrop-blur-md border border-toss-blue/20 rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center pointer-events-auto"
            >
                <h3 className="text-[16px] font-black text-toss-blue mb-2">오더모아 사용 가이드 🧭</h3>
                <p className="text-[14px] font-bold text-toss-grey-800 leading-relaxed whitespace-pre-wrap">
                    {currentStep.text}
                </p>
                <button id="tutorial-close-btn" onClick={onComplete} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 active:scale-95 transition-all outline-none">
                    <X size={16} />
                </button>
            </motion.div>

            {/* 타겟 하이라이트 */}
            {targetRect && (
                <motion.div
                    animate={{
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute border-[3px] border-toss-blue rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] pointer-events-none"
                >
                    <span className="absolute -bottom-3 -right-3 flex h-7 w-7">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-toss-blue opacity-75"></span>
                        <span className="relative inline-flex flex-col items-center justify-center rounded-full h-7 w-7 bg-toss-blue text-white shadow-lg">
                            <Pointer size={14} fill="white" className="mt-0.5 ml-0.5" />
                        </span>
                    </span>
                </motion.div>
            )}
        </div>
    );
};
