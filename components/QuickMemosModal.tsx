
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, GripVertical, ChevronLeft } from 'lucide-react';
import { AppSettings } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';

interface QuickMemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const SortableMemoRow: React.FC<{
  memo: string;
  isEditing: boolean;
  onRemove: () => void;
  onEditStart: () => void;
  onEditSave: (newVal: string) => void;
  onEditCancel: () => void;
}> = ({ memo, isEditing, onRemove, onEditStart, onEditSave, onEditCancel }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: memo });
  const [editVal, setEditVal] = useState(memo);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditVal(memo);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, memo]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleSave = () => {
    const val = editVal.trim();
    if (val && val !== memo) onEditSave(val);
    else onEditCancel();
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 group select-none ${isDragging ? 'scale-[1.02]' : ''}`}>
      <div {...attributes} {...listeners} className="pl-1 pr-0.5 py-1.5 cursor-grab text-toss-grey-200 hover:text-toss-blue shrink-0 touch-none">
        <GripVertical size={14} />
      </div>
      <div
        className={`flex-1 rounded-2xl border transition-all overflow-hidden ${isEditing ? 'bg-white border-toss-blue/50 ring-1 ring-toss-blue/20' : 'bg-white border-toss-grey-100 shadow-sm cursor-pointer hover:border-toss-blue/20'
          }`}
        onClick={() => !isEditing && onEditStart()}
      >
        {isEditing ? (
          <div className="py-1 px-4 flex items-center min-h-[52px]">
            <input
              ref={inputRef}
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onEditCancel();
              }}
              onBlur={handleSave}
              className="flex-1 text-[14px] font-black text-toss-grey-900 bg-transparent focus:outline-none w-full"
            />
          </div>
        ) : (
          <div className="py-4 px-4 flex items-center min-w-0">
            <span className="text-[14px] font-black text-toss-grey-800 truncate">{memo}</span>
          </div>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`p-2 transition-colors active:scale-90 shrink-0 ${isEditing ? 'text-toss-grey-200 pointer-events-none' : 'text-toss-grey-200 hover:text-toss-red'}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export const QuickMemosModal: React.FC<QuickMemosModalProps> = ({ isOpen, onClose, onBack, settings, onUpdateSettings }) => {
  const [newMemo, setNewMemo] = useState("");
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const kbOffset = useKeyboardOffset(isOpen);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setNewMemo("");
      setEditingMemo(null);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.quickMemos.indexOf(active.id as string);
      const newIndex = settings.quickMemos.indexOf(over.id as string);
      const newMemos = arrayMove(settings.quickMemos, oldIndex, newIndex);
      onUpdateSettings({ ...settings, quickMemos: newMemos });
    }
  };

  const handleAddMemo = () => {
    const val = newMemo.trim();
    if (!val || settings.quickMemos.includes(val)) { setNewMemo(""); return; }
    onUpdateSettings({ ...settings, quickMemos: [...settings.quickMemos, val] });
    setNewMemo("");
  };

  const removeMemo = (memo: string) => {
    onUpdateSettings({ ...settings, quickMemos: settings.quickMemos.filter(m => m !== memo) });
  };

  const handleEditSave = (oldVal: string, newVal: string) => {
    setEditingMemo(null);
    if (!newVal || (settings.quickMemos.includes(newVal) && newVal !== oldVal)) return;
    const newMemos = settings.quickMemos.map(m => m === oldVal ? newVal : m);
    onUpdateSettings({ ...settings, quickMemos: newMemos });
  };

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
      <div
        className="fixed left-0 right-0 z-[10000] flex flex-col items-center justify-end pointer-events-none px-3"
        style={{ bottom: kbOffset + 20, transition: 'bottom 0.15s ease-out' }}
      >
        <motion.div
          initial={false}
          animate={{ height: isOpen ? `calc(100dvh - ${kbOffset + 70}px)` : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }}
          className="w-full max-w-lg bg-[#f8f9fb] rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.18)] border border-toss-grey-200/60 ring-1 ring-black/5 flex flex-col overflow-hidden pointer-events-auto mx-auto"
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
                <div className="flex items-center px-4 pt-5 pb-3 bg-white rounded-t-[32px] border-b border-toss-grey-100 shrink-0 gap-2">
                  {onBack ? (
                    <button onClick={onBack} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-600 hover:bg-toss-grey-200 transition-colors shrink-0">
                      <ChevronLeft size={20} />
                    </button>
                  ) : <div className="w-8 shrink-0" />}
                  <h2 className="flex-1 text-center text-[20px] font-black text-toss-grey-900">요청사항 관리</h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 hover:bg-toss-grey-200 transition-colors shrink-0">
                    <X size={18} />
                  </button>
                </div>

                {/* 리스트 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-1.5">
                  <div className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest px-1 pb-1">
                    등록된 요청사항 ({settings.quickMemos.length})
                  </div>
                  {settings.quickMemos.length === 0 ? (
                    <div className="text-center py-16 text-toss-grey-400 text-[13px] font-black opacity-60">자주 사용하는 요청사항을<br />등록해보세요.</div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={settings.quickMemos} strategy={verticalListSortingStrategy}>
                        {settings.quickMemos.map(memo => (
                          <SortableMemoRow
                            key={memo}
                            memo={memo}
                            isEditing={editingMemo === memo}
                            onRemove={() => removeMemo(memo)}
                            onEditStart={() => setEditingMemo(memo)}
                            onEditSave={(newVal) => handleEditSave(memo, newVal)}
                            onEditCancel={() => setEditingMemo(null)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* 하단 입력 + 버튼 */}
                <div className="px-4 pt-3 pb-5 bg-white border-t border-toss-grey-100 shrink-0 space-y-2.5 rounded-b-[32px]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      lang="ko"
                      enterKeyHint="done"
                      placeholder="예: 시럽 빼기, 덜 뜨겁게"
                      className="flex-1 bg-toss-grey-50 border border-toss-grey-100 rounded-2xl px-4 py-3.5 text-[14px] font-black focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
                      value={newMemo}
                      onChange={e => setNewMemo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddMemo()}
                      onFocus={e => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}
                    />
                    <button onClick={handleAddMemo} className="w-12 h-12 bg-toss-blue text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-toss-blue/20">
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <button onClick={onClose} className="w-full h-16 bg-toss-grey-900 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-2.5 shadow-xl shadow-toss-grey-900/20 active:scale-[0.98] transition-all hover:bg-black">
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
