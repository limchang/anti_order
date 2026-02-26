
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Dices } from 'lucide-react';
import { AppSettings, EmojiCategory } from '../types';
import { DEFAULT_EMOJIS } from '../App';

interface EmojiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const EmojiSettingsModal: React.FC<EmojiSettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [editingEmojiIdx, setEditingEmojiIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleUpdateEmoji = (idx: number, newEmoji: string) => {
    const updated = [...settings.defaultEmojis];
    const finalEmoji = newEmoji.trim() || DEFAULT_EMOJIS[idx];
    updated[idx] = finalEmoji;
    onUpdateSettings({ ...settings, defaultEmojis: updated });
    setEditingEmojiIdx(null);
  };

  const categories: { key: EmojiCategory; label: string }[] = [
    { key: 'ANIMALS', label: '동물' },
    { key: 'FACES', label: '표정' },
    { key: 'HANDS', label: '손모양' },
    { key: 'NUMBERS', label: '숫자' }
  ];

  return (
    <>
      {/* 배경 딤 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 네비게이션 바에서 확장되는 카드 */}
      <div className="fixed left-0 right-0 bottom-0 z-[10000] flex flex-col items-center justify-end pointer-events-none pb-5 px-3">
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'calc(100dvh - 70px)' : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }}
          className="w-full max-w-lg bg-[#f8f9fb] rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.18)] border border-toss-grey-200/60 ring-1 ring-black/5 flex flex-col overflow-hidden pointer-events-auto mx-auto"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-white rounded-t-[32px] border-b border-toss-grey-100 shrink-0">
                  <h2 className="text-[22px] font-black text-toss-grey-900">이모지 설정</h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 hover:bg-toss-grey-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* 컨텐츠 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
                  <section className="space-y-3">
                    <span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest block">기본 아바타 리스트</span>
                    <div className="grid grid-cols-6 gap-2">
                      {settings.defaultEmojis.map((emoji, idx) => (
                        <div key={idx} className="relative aspect-square">
                          {editingEmojiIdx === idx ? (
                            <input
                              autoFocus
                              className="w-full h-full text-center bg-toss-blueLight border border-toss-blue rounded-2xl outline-none text-lg"
                              onBlur={e => handleUpdateEmoji(idx, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleUpdateEmoji(idx, (e.target as HTMLInputElement).value)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingEmojiIdx(idx)}
                              className="w-full h-full flex items-center justify-center bg-white border border-toss-grey-100 rounded-2xl text-xl hover:border-toss-blue/30 hover:shadow-md transition-all shadow-sm"
                            >
                              {emoji}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Dices size={16} className="text-toss-grey-400" />
                      <span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">랜덤 아바타 카테고리</span>
                    </div>
                    <div className="flex p-1 bg-toss-grey-100 rounded-2xl shadow-inner">
                      {categories.map(cat => (
                        <button
                          key={cat.key}
                          onClick={() => onUpdateSettings({ ...settings, randomCategory: cat.key })}
                          className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${settings.randomCategory === cat.key ? 'bg-white text-toss-blue shadow-md' : 'text-toss-grey-400'}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* 하단 버튼 */}
                <div className="px-4 pt-3 pb-5 bg-white border-t border-toss-grey-100 shrink-0 rounded-b-[32px]">
                  <button onClick={onClose} className="w-full h-12 bg-toss-grey-900 text-white rounded-2xl font-black text-[14px] active:scale-[0.98] transition-all">
                    설정 완료
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};
