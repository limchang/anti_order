import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pointer, X } from 'lucide-react';

interface AutoTutorialProps {
    onComplete: () => void;
}

interface TutorialStep {
    selector: string;
    action: 'move' | 'click' | 'wait';
    text: string;
    delay?: number;
}

const steps: TutorialStep[] = [
    { selector: '', action: 'wait', text: '오른쪽 아래 + 버튼을 눌러\n새 테이블을 추가해 볼게요!', delay: 1500 },
    { selector: '[data-tutorial="add-group"]', action: 'move', text: '오른쪽 아래 + 버튼을 눌러\n새 테이블을 추가해 볼게요!', delay: 1000 },
    { selector: '[data-tutorial="add-group"]', action: 'click', text: '오른쪽 아래 + 버튼을 눌러\n새 테이블을 추가해 볼게요!', delay: 1000 },
    { selector: '[data-tutorial="avatar"]', action: 'move', text: '테이블에 4명이 자동으로 생겨요.\n사람 아이콘을 눌러 이모지를 바꿀 수 있어요.', delay: 1500 },
    { selector: '[data-tutorial="avatar"]', action: 'click', text: '터치해서 개성 있는 이모지를 골라주세요!', delay: 1000 },
    { selector: 'button:nth-of-type(10)', action: 'move', text: '다양한 이모지로 일행을 쉽게 구별해 보세요.', delay: 1500 }, // click a random emoji in modal
    { selector: 'button:nth-of-type(10)', action: 'click', text: '선택 완료!', delay: 1000 },
    { selector: '[data-tutorial="menu-badge"]', action: 'move', text: '이제 메뉴를 골라줍니다.\n"미정" 버튼을 눌러주세요.', delay: 1500 },
    { selector: '[data-tutorial="menu-badge"]', action: 'click', text: '', delay: 1000 },
    { selector: '[data-tutorial="quick-all"]', action: 'move', text: '메뉴를 고르고 일괄로도 적용 가능해요.\n"모두 아메리카노" 버튼 하나면 끝!', delay: 2000 },
    { selector: '[data-tutorial="quick-all"]', action: 'click', text: '나머지 일행에게 한 번에 카페라떼나\n아메리카노를 할당할 수 있어요.', delay: 1500 },
    { selector: '[data-tutorial="memo-btn"]', action: 'move', text: '마지막으로 메모지 아이콘을 눌러\n"진하게" 같은 요청사항도 쉽게 적어요.', delay: 1500 },
    { selector: '[data-tutorial="memo-btn"]', action: 'click', text: '수집 과정이 정말 빠르고 재미있죠?', delay: 2000 },
    { selector: '[data-tutorial="summary-btn"]', action: 'move', text: '이제 주문 내역을 모두 취합해 볼까요?\n하단의 주문 확인 창을 올려주세요.', delay: 2000 },
    // { selector: '[data-tutorial="summary-btn"]', action: 'click', text: '짠! 이렇게 표 형태로 자동 정리된답니다.', delay: 2000 },
];

export const AutoTutorial: React.FC<AutoTutorialProps> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const [isClicking, setIsClicking] = useState(false);
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (stepIndex >= steps.length) {
            setTimeout(onComplete, 3000);
            return;
        }

        const step = steps[stepIndex];
        let timer1: NodeJS.Timeout;
        let timer2: NodeJS.Timeout;

        const executeStep = () => {
            let destX = window.innerWidth / 2;
            let destY = window.innerHeight / 2;
            let el: HTMLElement | null = null;

            if (step.selector) {
                // Find elements, maybe it's the second one if modal is open, etc. Add a small timeout to let DOM render
                setTimeout(() => {
                    el = document.querySelector(step.selector) as HTMLElement;
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        destX = rect.left + rect.width / 2;
                        destY = rect.top + rect.height / 2;
                    }

                    setCursorPos({ x: destX, y: destY });

                    timer1 = setTimeout(() => {
                        if (step.action === 'click' && el) {
                            setIsClicking(true);
                            setRipple({ x: destX, y: destY });
                            el.click(); // Trigger actual click simulating behavior
                            setTimeout(() => {
                                setIsClicking(false);
                                setRipple(null);
                            }, 300);
                        }

                        timer2 = setTimeout(() => {
                            setStepIndex(s => s + 1);
                        }, step.delay || 1000);

                    }, 800); // 800ms travel time
                }, 300); // wait 300ms before finding the element
            } else {
                timer1 = setTimeout(() => {
                    setStepIndex(s => s + 1);
                }, step.delay || 1000);
            }
        };

        executeStep();

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [stepIndex, onComplete]);

    const currentStep = steps[stepIndex] || steps[steps.length - 1];

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <div className="absolute inset-0 bg-toss-blue/5 backdrop-blur-[1px]" />

            {/* Captions */}
            <div className="absolute top-[80px] left-4 right-4 bg-white/95 backdrop-blur-md border border-toss-blue/20 rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center animate-fade-in-down pointer-events-auto">
                <h3 className="text-[16px] font-black text-toss-blue mb-2">카페싱크 작동 시뮬레이션 🎬</h3>
                <p className="text-[14px] font-bold text-toss-grey-800 leading-relaxed whitespace-pre-wrap">
                    {currentStep.text}
                </p>
                <button onClick={onComplete} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 active:scale-95 transition-all">
                    <X size={16} />
                </button>
            </div>

            {/* Ripple Animation */}
            <AnimatePresence>
                {ripple && (
                    <motion.div
                        initial={{ opacity: 0.8, scale: 0, x: '-50%', y: '-50%' }}
                        animate={{ opacity: 0, scale: 3, x: '-50%', y: '-50%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute w-12 h-12 rounded-full border-[3px] border-toss-blue/60 bg-toss-blue/20 pointer-events-none"
                        style={{ left: ripple.x, top: ripple.y }}
                    />
                )}
            </AnimatePresence>

            {/* Fake Cursor */}
            <motion.div
                animate={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    scale: isClicking ? 0.8 : 1
                }}
                transition={{
                    left: { type: 'spring', damping: 25, stiffness: 120 },
                    top: { type: 'spring', damping: 25, stiffness: 120 },
                    scale: { duration: 0.1 }
                }}
                className="absolute w-10 h-10 -ml-4 -mt-2 pointer-events-none drop-shadow-2xl text-toss-blue"
            >
                <Pointer size={36} fill="white" strokeWidth={2} className="origin-top-left -rotate-12" />
            </motion.div>
        </div>
    );
};
