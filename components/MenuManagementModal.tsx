
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, CakeSlice, Trash2, GripVertical, Search, PencilLine, Star, ChevronLeft, Camera, Image as ImageIcon, Loader2, Sparkles, Check, Plus, AlertCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
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
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<string[]>([]);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrResults([]);
    setShowOcrResults(true);

    try {
      // 1. 이미지 리사이징 (속도 향상을 위한 핵심 단계)
      const downscaledImage = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      const worker = await createWorker('kor+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(downscaledImage);
      await worker.terminate();

      // 추출된 텍스트 정제
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line =>
          line.length >= 2 &&
          /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(line) && // 한글이 포함된 줄만 추출 (사용자 요청)
          !/^[0-9,.\s/W]+$/.test(line) && // 숫자/기호만 있는 줄 제외
          !line.includes('http')
        );

      // 중복 제거 및 기존 리스트에 없는 것만 필터링
      const uniqueLines = Array.from(new Set(lines)).filter(line => !currentList.includes(line));
      setOcrResults(uniqueLines);
    } catch (err) {
      console.error(err);
      setOcrResults([]);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const addOcrItem = (item: string) => {
    onAdd(item, activeTab);
    setOcrResults(prev => prev.filter(i => i !== item));
  };

  const addAllOcrItems = () => {
    ocrResults.forEach(item => onAdd(item, activeTab));
    setOcrResults([]);
    setShowOcrResults(false);
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
        className="fixed left-0 right-0 bottom-0 z-[10000] flex flex-col items-center justify-end pointer-events-none pb-5 px-3"
        style={{ transform: `translateY(-${kbOffset}px)`, transition: 'transform 0.15s ease-out' }}
      >

        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          style={{ maxHeight: isOpen ? 'calc(100dvh - 130px)' : 0 }}
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

                {/* OCR 결과 표시 영역 */}
                <AnimatePresence>
                  {showOcrResults && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-2 overflow-hidden shrink-0"
                    >
                      <div className="bg-toss-blue/5 border border-toss-blue/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-toss-blue" />
                            <span className="text-[14px] font-black text-toss-grey-800">사진 인식 결과</span>
                          </div>
                          <button onClick={() => setShowOcrResults(false)} className="text-toss-grey-400 hover:text-toss-grey-600"><X size={16} /></button>
                        </div>

                        {isOcrProcessing ? (
                          <div className="py-6 flex flex-col items-center justify-center gap-3">
                            <Loader2 size={24} className="text-toss-blue animate-spin" />
                            <div className="w-full max-w-[200px] h-1.5 bg-toss-grey-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-toss-blue"
                                initial={{ width: 0 }}
                                animate={{ width: `${ocrProgress}%` }}
                              />
                            </div>
                            <p className="text-[12px] font-black text-toss-grey-500">메뉴판 읽는 중... {ocrProgress}%</p>
                          </div>
                        ) : ocrResults.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto no-scrollbar py-1">
                              {ocrResults.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => addOcrItem(item)}
                                  className="px-3 py-1.5 bg-white border border-toss-blue/20 rounded-full text-[12px] font-black text-toss-blue shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                  {item} <Plus size={12} strokeWidth={3} />
                                </button>
                              ))}
                            </div>
                            <div className="pt-2">
                              <button
                                onClick={addAllOcrItems}
                                className="w-full py-2.5 bg-toss-blue text-white rounded-xl text-[12px] font-black shadow-lg shadow-toss-blue/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                              >
                                <Check size={14} strokeWidth={3} /> {ocrResults.length}개 메뉴 한꺼번에 등록하기
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center gap-2">
                            <AlertCircle size={20} className="text-toss-grey-300" />
                            <p className="text-[12px] font-black text-toss-grey-500">인식된 메뉴가 없거나 이미 모두 등록되었습니다.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {!searchQuery.trim() && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2.5 bg-white border border-toss-grey-200 text-toss-grey-600 rounded-xl shadow-sm active:scale-95 transition-all"
                          title="사진으로 메뉴 추가"
                        >
                          <Camera size={18} />
                        </button>
                      )}
                      {searchQuery.trim() && (
                        <button onClick={handleAdd} className="px-3 py-2 bg-toss-blue text-white rounded-xl shadow-sm active:scale-95 transition-all text-[12px] font-black">
                          등록
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <button onClick={onClose} className="w-full h-16 bg-toss-grey-900 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-2.5 shadow-xl shadow-toss-grey-900/20 active:scale-[0.98] transition-all hover:bg-black">
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
