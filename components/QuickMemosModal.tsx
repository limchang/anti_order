import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, StickyNote, Trash2, GripVertical, Check, Pencil } from 'lucide-react';
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

interface QuickMemosModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    if (val && val !== memo) {
      onEditSave(val);
    } else {
      onEditCancel();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group p-0.5">
      <div {...attributes} {...listeners} className="p-1 cursor-grab text-toss-grey-300 hover:text-toss-blue transition-colors outline-none touch-none">
        <GripVertical size={14} />
      </div>
      <div
        className={`flex-1 bg-toss-grey-50 border rounded-xl flex items-center shadow-sm transition-all overflow-hidden border-toss-grey-100 ${isEditing ? 'border-toss-blue/50 ring-1 ring-toss-blue/20 bg-white' : 'hover:border-toss-blue/20 cursor-pointer'}`}
        onClick={() => !isEditing && onEditStart()}
      >
        {isEditing ? (
          <div className="flex-1 py-1 px-3 flex items-center justify-between min-h-[44px]">
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
              className="flex-1 text-[13px] font-bold text-toss-grey-900 bg-transparent focus:outline-none w-full"
            />
          </div>
        ) : (
          <div className="flex-1 py-3 px-3 flex items-center min-w-0 min-h-[44px]">
            <span className="text-[13px] font-bold text-toss-grey-800 transition-colors truncate">{memo}</span>
          </div>
        )}
      </div>
      <div className="flex items-center shrink-0 pl-1">
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className={`p-1.5 transition-colors active:scale-90 ${isEditing ? 'text-toss-grey-200 pointer-events-none' : 'text-toss-grey-300 hover:text-toss-red'}`}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export const QuickMemosModal: React.FC<QuickMemosModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [newMemo, setNewMemo] = useState("");
  const [editingMemo, setEditingMemo] = useState<string | null>(null);

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

  if (!isOpen) return null;

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
    if (!newVal || settings.quickMemos.includes(newVal) && newVal !== oldVal) return;

    const newMemos = settings.quickMemos.map(m => m === oldVal ? newVal : m);
    onUpdateSettings({ ...settings, quickMemos: newMemos });
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-[360px] flex flex-col shadow-toss-elevated animate-in zoom-in-95 duration-300 overflow-hidden max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <h2 className="text-lg font-black text-toss-grey-900 flex items-center gap-2"><StickyNote size={20} className="text-toss-blue" /> 요청사항 관리</h2>
          <button onClick={onClose} className="p-1.5 text-toss-grey-400 hover:bg-toss-grey-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 pt-1 space-y-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex gap-2 shrink-0">
            <input
              autoFocus
              type="text"
              lang="ko"
              enterKeyHint="done"
              placeholder="예: 시럽 빼기, 덜 뜨겁게"
              className="flex-1 bg-toss-grey-50 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
              value={newMemo}
              onChange={e => setNewMemo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMemo()}
            />
            <button onClick={handleAddMemo} className="w-12 h-12 bg-toss-blue text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-toss-blue/20"><Plus size={20} strokeWidth={3} /></button>
          </div>

          <div className="space-y-2">
            <span className="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest px-1">등록된 요청사항 ({settings.quickMemos.length})</span>
            <div className="flex flex-col gap-0.5">
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

              {settings.quickMemos.length === 0 && (
                <div className="text-center py-10 text-toss-grey-400 text-sm font-medium">자주 사용하는 요청사항을<br />등록해보세요.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 pt-2 shrink-0 border-t border-toss-grey-50">
          <button onClick={onClose} className="w-full py-4 bg-toss-grey-900 text-white rounded-2xl font-black text-sm active:scale-[0.98] transition-all">설정 완료</button>
        </div>
      </div>
    </div>
  );
};
