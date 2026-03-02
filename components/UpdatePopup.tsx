
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
        { title: "광고 보너스 초기화 옵션 추가", desc: "이전 혜택 ON/OFF 옵션을 제거하고 원할 때 즉시 초기화하는 버튼으로 교체", icon: <CheckCircle2 size={16} className="text-amber-500" /> },
        { title: "광고 무한루프 버그 픽스", desc: "닫기를 누르면 되살아나던 광고 오작동(환경설정 충돌) 완벽 해결", icon: <CheckCircle2 size={16} className="text-amber-500" /> },
        { title: "비밀 공지 시스템 완전 가동", desc: "업데이트가 퍼블리싱될 때마다 버그 픽스/기능을 이 창으로 알려드립니다", icon: <Sparkles size={16} className="text-toss-blue" /> },
        { title: "버전 정보 표시 위치 이관", desc: "불필요하게 차지하던 버전 정보를 삭제하고 테이블 목록 최하단으로 이동했습니다.", icon: <Sparkles size={16} className="text-purple-500" /> },
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
