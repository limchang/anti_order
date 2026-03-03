
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, Rocket, Zap } from 'lucide-react';

interface UpdatePopupProps {
    isOpen: boolean;
    onClose: () => void;
    version: string;
}

export const UpdatePopup: React.FC<UpdatePopupProps> = ({ isOpen, onClose, version }) => {
    const updates = [
        { title: "숨겨진 관리자 메뉴", desc: "버전명을 타다닥! 5번 누르면 숨겨져 있던 관리자 설정 메뉴가 나타납니다. 광고 설정은 이 안으로 이사했어요!", icon: <Sparkles size={16} className="text-amber-500" /> },
        { title: "자동 업데이트 기능 탑재", desc: "새로운 버전이 배포되면 앱을 켜거나 다시 돌아올 때 최신 버전을 자동으로 인식하고 바로 적용합니다.", icon: <CheckCircle2 size={16} className="text-toss-blue" /> },
        { title: "UI 동기화 및 최적화", desc: "기능들의 안정성을 높이고 일부 메뉴의 표시 방식을 더 깔끔하게 다듬었습니다.", icon: <Zap size={16} className="text-purple-500" /> },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white"
                    >
                        <div className="relative p-8 pt-10 flex flex-col items-center">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 bg-toss-grey-100 rounded-full text-toss-grey-400 hover:text-toss-grey-600 active:scale-90 transition-all"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>

                            <div className="w-16 h-16 bg-toss-blueLight rounded-3xl flex items-center justify-center mb-6 shadow-sm ring-4 ring-toss-blue/5">
                                <Rocket size={32} className="text-toss-blue animate-bounce-subtle" />
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-[22px] font-black text-toss-grey-900 tracking-tight mb-2">
                                    새로운 버전 업데이트!
                                </h3>
                                <div className="inline-flex items-center px-2.5 py-0.5 bg-toss-blue/10 rounded-full">
                                    <span className="text-[11px] font-black text-toss-blue tracking-wider">VERSION {version}</span>
                                </div>
                            </div>

                            <div className="w-full space-y-4 mb-10">
                                {updates.map((update, idx) => (
                                    <div key={idx} className="flex gap-4 items-start p-3 bg-toss-grey-50 rounded-2xl border border-transparent hover:border-toss-grey-100 transition-all">
                                        <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-xl shadow-sm">
                                            {update.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-toss-grey-800 leading-tight mb-1">{update.title}</span>
                                            <span className="text-[11px] font-bold text-toss-grey-400 leading-relaxed">{update.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full h-15 bg-toss-blue text-white rounded-2xl font-black text-[16px] shadow-lg shadow-toss-blue/20 active:scale-95 transition-all"
                            >
                                확인했습니다
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
