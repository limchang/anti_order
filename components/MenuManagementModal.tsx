
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, CakeSlice, Trash2, GripVertical, Search, PencilLine, Star, ChevronLeft } from 'lucide-react';
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
import { ItemType } from '../types';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  drinkItems: string[];
  dessertItems: string[];
  checkedDrinkItems: string[];
  onAdd: (item: string, type: ItemType) => void;
  onRemove: (item: string, type: ItemType) => void;
  onUpdateChecked: (item: string, checked: boolean) => void;
  onUpdateMenuList: (newList: string[], type: ItemType) => void;
}

const SortableMenuRow: React.FC<{
  id: string;
  item: string;
  isChecked?: boolean;
  showCheck?: boolean;
  onRemove: () => void;
  onToggleCheck?: () => void;
}> = ({ id, item, isChecked, showCheck, onRemove, onToggleCheck }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 group select-none ${isDragging ? 'scale-[1.02]' : ''}`}>
      <div {...attributes} {...listeners} className="pl-1 pr-0.5 py-1.5 cursor-grab text-toss-grey-200 hover:text-toss-blue shrink-0 touch-none">
        <GripVertical size={14} />
      </div>
      <div className={`flex-1 flex items-center rounded-2xl border transition-all overflow-hidden min-w-0 ${isChecked ? 'bg-amber-50 border-amber-200' : 'bg-white border-toss-grey-100 shadow-sm'}`}>
        {showCheck && (
          <button
            onClick={onToggleCheck}
            className={`pl-3.5 pr-2 py-4 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'text-amber-400' : 'text-toss-grey-200 hover:text-amber-400'}`}
            title="퀵메뉴 등록"
          >
            <Star size={16} fill={isChecked ? 'currentColor' : 'none'} strokeWidth={isChecked ? 0 : 2} />
          </button>
        )}
        <div className={`flex-1 py-4 flex items-center min-w-0 ${showCheck ? 'pl-1 pr-4' : 'px-4'}`}>
          <span className={`text-[14px] font-black tracking-tight truncate ${isChecked ? 'text-amber-700' : 'text-toss-grey-800'}`}>{item}</span>
        </div>
      </div>
      <button onClick={onRemove} className="p-2 text-toss-grey-200 hover:text-toss-red transition-colors active:scale-90 shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export const MenuManagementModal: React.FC<MenuManagementModalProps> = ({
  isOpen, onClose, onBack, drinkItems, dessertItems, checkedDrinkItems, onAdd, onRemove, onUpdateChecked, onUpdateMenuList
}) => {
  const [activeTab, setActiveTab] = useState<ItemType>('DRINK');
  const [newItemName, setNewItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const kbOffset = useKeyboardOffset(isOpen);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchQuery("");
      setNewItemName("");
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const currentList = useMemo(() =>
    activeTab === 'DRINK' ? drinkItems.filter(i => i !== '미정') : dessertItems
    , [activeTab, drinkItems, dessertItems]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(item => item.toLowerCase().includes(q));
  }, [currentList, searchQuery]);

  const handleAdd = () => {
    const val = newItemName.trim() || searchQuery.trim();
    if (!val || currentList.includes(val)) return;
    onAdd(val, activeTab);
    setNewItemName("");
    setSearchQuery("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newList = arrayMove(currentList, currentList.indexOf(active.id as string), currentList.indexOf(over.id as string));
      const finalUpdate = activeTab === 'DRINK' ? ["미정", ...newList] : newList;
      onUpdateMenuList(activeTab === 'DRINK' ? finalUpdate : newList, activeTab);
    }
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
                <div className="flex items-center px-4 pt-5 pb-3 bg-white rounded-t-[32px] border-b border-toss-grey-100 shrink-0 gap-2">
                  {onBack ? (
                    <button onClick={onBack} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-600 hover:bg-toss-grey-200 transition-colors shrink-0">
                      <ChevronLeft size={20} />
                    </button>
                  ) : <div className="w-8 shrink-0" />}
                  <h2 className="flex-1 text-center text-[20px] font-black text-toss-grey-900">메뉴판</h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 hover:bg-toss-grey-200 transition-colors shrink-0">
                    <X size={18} />
                  </button>
                </div>

                {/* 탭 */}
                <div className="px-5 pt-4 pb-2 shrink-0 bg-white">
                  <div className="flex p-1 bg-toss-grey-100 rounded-2xl shadow-inner">
                    <button
                      onClick={() => setActiveTab('DRINK')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-black transition-all ${activeTab === 'DRINK' ? 'bg-white text-toss-blue shadow-md' : 'text-toss-grey-400'}`}
                    >
                      <Coffee size={15} /><span>음료</span>
                      {activeTab === 'DRINK' && (
                        <span className="bg-toss-blue/10 text-toss-blue text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {drinkItems.filter(i => i !== '미정').length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('DESSERT')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-black transition-all ${activeTab === 'DESSERT' ? 'bg-white text-amber-500 shadow-md' : 'text-toss-grey-400'}`}
                    >
                      <CakeSlice size={15} /><span>디저트</span>
                      {activeTab === 'DESSERT' && (
                        <span className="bg-amber-50 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {dessertItems.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 메뉴 리스트 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1.5 py-2">
                  {filteredList.length === 0 ? (
                    <div className="py-16 text-center text-toss-grey-400 text-[13px] font-black opacity-60">내역이 없습니다.</div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={filteredList} strategy={verticalListSortingStrategy}>
                        {filteredList.map(item => (
                          <SortableMenuRow
                            key={item}
                            id={item}
                            item={item}
                            isChecked={activeTab === 'DRINK' && checkedDrinkItems.includes(item)}
                            showCheck={activeTab === 'DRINK'}
                            onRemove={() => onRemove(item, activeTab)}
                            onToggleCheck={() => onUpdateChecked(item, !checkedDrinkItems.includes(item))}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* 하단 입력 + 버튼 */}
                <div className="px-4 pt-3 pb-5 bg-white border-t border-toss-grey-100 shrink-0 space-y-2.5 rounded-b-[32px]">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      {searchQuery.trim() ? (
                        <PencilLine className="text-toss-blue" size={15} />
                      ) : (
                        <Search className="text-toss-grey-400" size={15} />
                      )}
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="새로운 메뉴 입력 또는 검색"
                      className="w-full pl-10 pr-20 py-3.5 bg-toss-grey-50 border border-toss-grey-100 rounded-2xl text-[14px] font-black focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setNewItemName(e.target.value); }}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      onFocus={e => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}
                    />
                    {searchQuery.trim() && (
                      <button onClick={handleAdd} className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-toss-blue text-white rounded-xl shadow-sm active:scale-95 transition-all text-[12px] font-black">
                        등록
                      </button>
                    )}
                  </div>
                  <button onClick={onClose} className="w-full h-16 bg-toss-grey-900 text-white rounded-[24px] font-black text-[15px] flex items-center justify-center gap-2.5 shadow-xl shadow-toss-grey-900/20 active:scale-[0.98] transition-all hover:bg-black">
                    관리 완료
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
