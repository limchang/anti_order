
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
        { title: "광고 클릭 감지 강화", desc: "IFRAME 포커스 감지 도입으로 100% 활성화 보장", icon: <Zap size={16} className="text-amber-500" /> },
        { title: "닫기 버튼 활성화 개선", desc: "광고 클릭 후 즉시 '닫기' 버튼 파란색 활성화", icon: <CheckCircle2 size={16} className="text-toss-blue" /> },
        { title: "광고 영역 디자인 최적화", desc: "가로형 슬림 디자인으로 가독성 및 주문 확인 편의성 증대", icon: <Sparkles size={16} className="text-purple-500" /> },
        { title: "시스템 고도화", desc: "배포 버전 및 업데이트 시간 정보 자동 갱신 시스템 구축", icon: <Rocket size={16} className="text-rose-500" /> },
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
