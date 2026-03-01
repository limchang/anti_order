
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, Info } from 'lucide-react';

interface GuidePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'success';
}

export const GuidePopup: React.FC<GuidePopupProps> = ({
    isOpen, onClose, onConfirm, title, message, confirmText = "적용하기", cancelText = "나중에", type = 'info'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[11001] flex items-center justify-center pointer-events-none p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] pointer-events-auto border border-white/20"
                        >
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-toss-card border border-toss-grey-100 ${type === 'success' ? 'bg-green-50 text-green-500' : 'bg-toss-blueLight text-toss-blue'}`}>
                                    {type === 'success' ? <Check size={32} strokeWidth={3} /> : <Bell size={32} fill="currentColor" className="text-toss-blue" />}
                                </div>

                                <h3 className="text-[20px] font-black text-toss-grey-900 mb-2 leading-tight">{title}</h3>
                                <p className="text-[14px] font-bold text-toss-grey-500 leading-relaxed whitespace-pre-line mb-8">
                                    {message}
                                    {"\n\n"}
                                    <span className="text-[11px] font-black text-toss-grey-400 bg-toss-grey-50 px-2 py-1 rounded-md border border-toss-grey-100 inline-block mt-2">
                                        * 전체 메뉴에서 언제든 끌 수 있습니다.
                                    </span>
                                </p>

                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 h-14 bg-toss-blue text-white rounded-2xl font-black text-[15px] shadow-lg shadow-toss-blue/20 active:scale-95 transition-all"
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 h-14 bg-toss-grey-100 text-toss-grey-600 rounded-2xl font-black text-[15px] active:scale-95 transition-all"
                                    >
                                        {cancelText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
