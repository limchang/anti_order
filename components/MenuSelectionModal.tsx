
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Plus, Coffee, CakeSlice, GripVertical, Search, Star, Trash2 } from 'lucide-react';
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
import { ItemType, DrinkSize, AppSettings, OrderSubItem } from '../types';

interface SelectionItem {
  itemName: string;
  type: ItemType;
  size?: DrinkSize;
}

interface MenuSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  drinkItems: string[];
  dessertItems: string[];
  checkedDrinkItems: string[];
  initialSelections: OrderSubItem[];
  selectedItem: string;
  initialType?: ItemType;
  onSelect: (selections: SelectionItem[]) => void;
  onAdd: (item: string, type: ItemType) => void;
  onRemove: (item: string, type: ItemType) => void;
  onUpdateChecked: (item: string, checked: boolean) => void;
  onDeleteSelection?: () => void;
  onUpdateMenuList?: (newList: string[], type: ItemType) => void;
  appSettings: AppSettings;
}

const SortableMenuItem: React.FC<{
  id: string;
  item: string;
  activeTab: ItemType;
  appSettings: AppSettings;
  orderedSizes: Set<DrinkSize | undefined>;
  isCurrentlySelected: boolean;
  isChecked?: boolean;
  showCheck?: boolean;
  handleItemClick: (name: string, type: ItemType, size?: DrinkSize) => void;
  onRemove: (item: string, type: ItemType) => void;
  onToggleCheck?: () => void;
}> = ({ id, item, activeTab, appSettings, orderedSizes, isCurrentlySelected, isChecked, showCheck, handleItemClick, onRemove, onToggleCheck }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 1000 : undefined, opacity: isDragging ? 0.6 : 1 };
  const showSize = activeTab === 'DRINK' && appSettings.showDrinkSize;
  const isHighlighted = isCurrentlySelected || orderedSizes.size > 0;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 group select-none ${isDragging ? 'scale-[1.02]' : ''}`}>
      <div {...attributes} {...listeners} className="pl-1 pr-0.5 py-1.5 cursor-grab text-toss-grey-200 hover:text-toss-blue shrink-0 touch-none">
        <GripVertical size={14} />
      </div>

      <div className={`flex-1 flex items-center rounded-2xl border transition-all overflow-hidden min-w-0 ${isHighlighted
          ? 'bg-toss-blueLight border-toss-blue shadow-md shadow-toss-blue/10'
          : isChecked
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-toss-grey-100 shadow-sm'
        }`}>
        {showCheck && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCheck?.(); }}
            className={`pl-3.5 pr-2 py-4 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'text-amber-400' : 'text-toss-grey-200 hover:text-amber-400'}`}
            title="퀵메뉴 등록"
          >
            <Star size={16} fill={isChecked ? 'currentColor' : 'none'} strokeWidth={isChecked ? 0 : 2} />
          </button>
        )}

        <button
          onClick={() => handleItemClick(item, activeTab, showSize ? 'Tall' : undefined)}
          className={`flex-1 h-full text-left py-4 flex items-center justify-between min-w-0 font-black gap-2
            ${showCheck ? 'pl-1 pr-3' : 'px-4'}
            ${isHighlighted ? 'text-toss-blue' : isChecked ? 'text-amber-700' : 'text-toss-grey-800'}`}
        >
          <span className="text-[14px] tracking-tight truncate">{item}</span>
          {isHighlighted && !showSize && (
            <div className="shrink-0 w-5 h-5 bg-toss-blue rounded-full flex items-center justify-center">
              <Check size={11} strokeWidth={4} className="text-white" />
            </div>
          )}
        </button>

        {showSize && (
          <div className="flex gap-1 pr-3 shrink-0">
            {(['Tall', 'Grande', 'Venti'] as DrinkSize[]).map((sz) => {
              const isSizeSelected = orderedSizes.has(sz);
              return (
                <button
                  key={sz}
                  onClick={(e) => { e.stopPropagation(); handleItemClick(item, activeTab, sz); }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border-2 transition-all ${isSizeSelected ? 'bg-toss-blue border-toss-blue text-white shadow-md' : 'bg-white border-toss-grey-200 text-toss-grey-400 hover:border-toss-blue/50'
                    }`}
                >
                  {sz.charAt(0)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(item, activeTab)}
        className="p-2 text-toss-grey-200 hover:text-toss-red transition-colors active:scale-90 shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export const MenuSelectionModal: React.FC<MenuSelectionModalProps> = ({
  isOpen, onClose, title, drinkItems = [], dessertItems = [], checkedDrinkItems = [], initialSelections = [], selectedItem, initialType, onSelect, onAdd, onRemove, onUpdateChecked, onDeleteSelection, onUpdateMenuList, appSettings
}) => {
  const [activeTab, setActiveTab] = useState<ItemType>('DRINK');
  const [searchQuery, setSearchQuery] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialType) setActiveTab(initialType);
      setSearchQuery("");
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, initialType, selectedItem]);

  const currentRawList = useMemo(() => activeTab === 'DRINK' ? drinkItems.filter(i => i !== '미정') : dessertItems, [activeTab, drinkItems, dessertItems]);

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentRawList;
    return currentRawList.filter(item => item.toLowerCase().includes(query));
  }, [currentRawList, searchQuery]);

  const exactMatch = useMemo(() => currentRawList.find(i => i.trim().toLowerCase() === searchQuery.trim().toLowerCase()), [currentRawList, searchQuery]);

  const getItemOrderedSizes = (itemName: string): Set<DrinkSize | undefined> => {
    return new Set(
      initialSelections
        .filter(s => s.itemName === itemName && s.type === activeTab)
        .map(s => s.size)
    );
  };

  const handleItemClick = (name: string, type: ItemType, size?: DrinkSize) => {
    onSelect([{ itemName: name, type, size }]);
    onClose();
  };

  const handleQuickAdd = () => {
    const name = searchQuery.trim();
    if (!name) return;
    onAdd(name, activeTab);
    setSearchQuery("");
    setRegSuccess(true);
    setTimeout(() => setRegSuccess(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (filteredList.length === 1) {
        handleItemClick(filteredList[0], activeTab, (activeTab === 'DRINK' && appSettings.showDrinkSize) ? 'Tall' : undefined);
      } else if (!exactMatch && searchQuery.trim()) {
        handleQuickAdd();
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newList = arrayMove(currentRawList, currentRawList.indexOf(active.id as string), currentRawList.indexOf(over.id as string));
      onUpdateMenuList?.(newList, activeTab);
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

      {/* 네비게이션 바에서 확장되는 카드 - OrderSummary 방식과 동일 */}
      <div className="fixed left-0 right-0 bottom-0 z-[10000] flex flex-col items-center justify-end pointer-events-none pb-5 px-3">
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? '88vh' : 0,
            opacity: isOpen ? 1 : 0,
          }}
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
                  <h2 className="text-[22px] font-black text-toss-grey-900">메뉴판</h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-500 hover:bg-toss-grey-200 transition-colors">
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

                {/* 신규 등록 알림 */}
                <AnimatePresence>
                  {regSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="mx-5 mb-2 py-2.5 bg-green-50 text-green-600 rounded-xl font-black text-[12px] flex items-center justify-center gap-1.5 border border-green-200 shrink-0"
                    >
                      <Check size={13} strokeWidth={4} /> 메뉴판에 추가되었습니다
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 신규 등록 버튼 */}
                <AnimatePresence>
                  {searchQuery.trim() && !exactMatch && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-2 shrink-0"
                    >
                      <button onClick={handleQuickAdd} className="w-full py-3 bg-toss-blueLight text-toss-blue rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 border border-toss-blue/10 active:scale-[0.98] transition-transform">
                        <div className="w-5 h-5 bg-toss-blue rounded-full flex items-center justify-center">
                          <Plus size={12} strokeWidth={3} className="text-white" />
                        </div>
                        '{searchQuery}' 등록하기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 메뉴 리스트 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1.5 py-2">
                  {filteredList.length === 0 && !searchQuery.trim() ? (
                    <div className="py-16 text-center text-toss-grey-400 text-[13px] font-black opacity-60">메뉴를 검색해보세요.</div>
                  ) : filteredList.length === 0 ? (
                    <div className="py-16 text-center text-toss-grey-400 text-[13px] font-black opacity-60">검색 결과가 없습니다.</div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={filteredList} strategy={verticalListSortingStrategy}>
                        {filteredList.map((item) => (
                          <SortableMenuItem
                            key={item} id={item} item={item} activeTab={activeTab} appSettings={appSettings}
                            orderedSizes={getItemOrderedSizes(item)}
                            isCurrentlySelected={selectedItem === item}
                            isChecked={activeTab === 'DRINK' && checkedDrinkItems.includes(item)}
                            showCheck={activeTab === 'DRINK'}
                            handleItemClick={handleItemClick}
                            onRemove={onRemove}
                            onToggleCheck={() => onUpdateChecked(item, !checkedDrinkItems.includes(item))}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* 하단 검색 + 버튼 */}
                <div className="px-4 pt-3 pb-5 bg-white border-t border-toss-grey-100 shrink-0 space-y-2.5 rounded-b-[32px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-toss-grey-400" size={15} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      lang="ko"
                      enterKeyHint="search"
                      placeholder={`${activeTab === 'DRINK' ? '음료' : '디저트'} 검색 / 신규 등록`}
                      className="w-full pl-10 pr-10 py-3.5 bg-toss-grey-50 border border-toss-grey-100 rounded-2xl text-[14px] font-black focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-toss-grey-400 hover:text-toss-grey-600">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        if (onDeleteSelection) onDeleteSelection();
                        else onSelect([{ itemName: '미정', type: 'DRINK' }]);
                        onClose();
                      }}
                      className="h-12 rounded-2xl font-black bg-toss-redLight text-toss-red active:scale-95 transition-all text-[13px] flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> 주문 삭제
                    </button>
                    <button onClick={onClose} className="h-12 rounded-2xl font-black bg-toss-grey-900 text-white active:scale-95 transition-all text-[13px]">닫기</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};
