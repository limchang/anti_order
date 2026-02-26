
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Coffee, CakeSlice, Trash2, GripVertical, UtensilsCrossed, Search, PencilLine, Star } from 'lucide-react';
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

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group p-0.5">
      <div {...attributes} {...listeners} className="p-1 cursor-grab text-toss-grey-300 hover:text-toss-blue transition-colors">
        <GripVertical size={14} />
      </div>
      <div className={`flex-1 bg-toss-grey-50 border rounded-xl flex items-center shadow-sm transition-all overflow-hidden ${isChecked ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'border-toss-grey-100'}`}>
        {showCheck && (
          <button
            onClick={onToggleCheck}
            className={`pl-3 pr-1.5 h-full min-h-[44px] flex items-center justify-center transition-all ${isChecked ? 'text-amber-400 drop-shadow-sm' : 'text-toss-grey-300 hover:text-amber-400 hover:scale-105'}`}
            title="자주 찾는 메뉴(퀵메뉴)에 등록"
          >
            <Star size={15} fill={isChecked ? 'currentColor' : 'none'} strokeWidth={isChecked ? 0 : 2.5} className={isChecked ? 'scale-110 transition-transform' : ''} />
          </button>
        )}
        <div className={`flex-1 py-2.5 flex items-center justify-between min-w-0 ${showCheck ? 'pr-3 pl-1' : 'px-3'}`}>
          <span className={`text-[12px] font-black transition-colors truncate ${isChecked ? 'text-amber-700' : 'text-toss-grey-800'}`}>{item}</span>
        </div>
      </div>
      <div className="flex items-center shrink-0 pl-1">
        <button onClick={onRemove} className="p-1.5 text-toss-grey-300 hover:text-toss-red transition-colors active:scale-90">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export const MenuManagementModal: React.FC<MenuManagementModalProps> = ({
  isOpen, onClose, drinkItems, dessertItems, checkedDrinkItems, onAdd, onRemove, onUpdateChecked, onUpdateMenuList
}) => {
  const [activeTab, setActiveTab] = useState<ItemType>('DRINK');
  const [newItemName, setNewItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      // 자동 포커스 제거 (사용자 요청)
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-md" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 w-full bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t border-toss-grey-100 flex flex-col overflow-hidden max-h-[90vh] pb-8"
            onClick={e => e.stopPropagation()}
          >

            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <h2 className="text-base font-black text-toss-grey-900 flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-toss-blue" /> 메뉴판
              </h2>
              <button onClick={onClose} className="p-1.5 text-toss-grey-400 hover:bg-toss-grey-100 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="px-4 pb-3 space-y-3 shrink-0">
              <div className="flex p-0.5 bg-toss-grey-100 rounded-xl">
                <button onClick={() => setActiveTab('DRINK')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === 'DRINK' ? 'bg-white text-toss-blue shadow-sm' : 'text-toss-grey-400'}`}>
                  <Coffee size={14} /> 음료
                </button>
                <button onClick={() => setActiveTab('DESSERT')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === 'DESSERT' ? 'bg-white text-amber-500 shadow-sm' : 'text-toss-grey-400'}`}>
                  <CakeSlice size={14} /> 디저트
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  {searchQuery.trim() ? (
                    <PencilLine className="text-toss-blue animate-in zoom-in duration-200" size={14} />
                  ) : (
                    <Search className="text-toss-grey-400 animate-in zoom-in duration-200" size={14} />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="검색 및 신규 등록"
                  className="w-full bg-toss-grey-50 rounded-xl pl-9 pr-10 py-2.5 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all border border-toss-grey-100"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setNewItemName(e.target.value); }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                {searchQuery.trim() && (
                  <button onClick={handleAdd} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-toss-blue text-white rounded-lg shadow-sm active:scale-95 transition-all">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-2 pb-4 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-0.5 px-2">
                <div className="px-2 mb-2 space-y-1">
                  <span className="text-[10px] font-black text-toss-grey-400 uppercase tracking-widest block">
                    메뉴 목록
                  </span>
                  <p className="text-[9px] font-bold text-amber-500 leading-tight">
                    * 별(★) 아이콘 선택 시, 주문할 때 항상 표시되는 퀵메뉴에 포함됩니다.
                  </p>
                </div>
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
                {filteredList.length === 0 && (
                  <div className="text-center py-8 text-toss-grey-400 text-[12px] font-medium animate-in fade-in">
                    내역이 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 pt-2 shrink-0 border-t border-toss-grey-50 bg-white">
              <button onClick={onClose} className="w-full py-3.5 bg-toss-grey-900 text-white rounded-2xl font-black text-[14px] active:scale-[0.98] transition-all">
                관리 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
