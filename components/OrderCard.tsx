
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderItem, ItemType, DrinkSize, AppSettings, OrderSubItem, EmojiCategory } from '../types';
import { Snowflake, Flame, Trash2, Plus, Dices, MoreHorizontal, AlertCircle, ArrowLeft, ChevronDown, ChevronUp, User, MessageCircle, Check, Pencil, Send, Minus, UtensilsCrossed, UserMinus, RefreshCw, CakeSlice, Info, Clock, RotateCcw, Heart, X, Star } from 'lucide-react';
import { EmojiRenderer } from './EmojiRenderer.tsx';

interface ExtendedSubItem extends OrderSubItem {
  isSynced?: boolean;
}

interface OrderCardProps {
  order: OrderItem;
  drinkItems: string[];
  dessertMenuItems: string[];
  onAddMenuItem: (name: string, type: ItemType) => void;
  onRemoveMenuItem: (name: string, type: ItemType) => void;
  onUpdate: (id: string, updates: Partial<OrderItem>) => void;
  onRemove: (id: string) => void;
  onCopyGroupItemToAll: (orderId: string) => void;
  onDeleteGroupItemFromAll?: (orderId: string) => void;
  highlighted?: boolean;
  onOpenMenuModal: (orderId: string, currentItem: string, subItemId?: string | null, type?: ItemType) => void;
  appSettings: AppSettings & { isSharedSyncActive?: boolean };
  onInputModeChange?: (isActive: boolean) => void;
  onUpdateCheckedItems?: (name: string, checked: boolean) => void;
}

export const CATEGORY_EMOJIS: Record<EmojiCategory, string[]> = {
  ANIMALS: ["🦁", "🐯", "🐨", "🦊", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐥", "🦉", "🐺", "🦝", "🐴", "🦄", "🐝", "🦋", "🐙", "🦈"],
  FACES: ["😀", "😍", "😎", "🤔", "😴", "🤩", "🥳", "🥺", "😡", "🤢", "🤡", "👻", "👽", "🤖", "💩", "✨", "😇", "🤗", "😜", "🫡"],
  HANDS: ["👍🏻", "👎🏻", "👊🏻", "✌🏻", "👌🏻", "✋🏻", "👐🏻", "🙌🏻", "👏🏻", "🙏🏻", "🤝🏻", "🤘🏻", "🤙🏻", "👋🏻", "✍🏻", "💪🏻", "☝🏻", "🤞🏻", "🫶🏻", "🤟🏻"],
  NUMBERS: ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "💯", "🅰️", "🅱️", "🆗", "🆒"]
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  drinkItems,
  onAddMenuItem,
  onUpdate,
  onRemove,
  onCopyGroupItemToAll,
  onDeleteGroupItemFromAll,
  highlighted,
  onOpenMenuModal,
  appSettings,
  onInputModeChange,
  onUpdateCheckedItems
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(!order.avatar && order.avatar !== '😋');
  const allRandomEmojis = useMemo(() => Object.values(CATEGORY_EMOJIS).flat(), []);
  const isRandomEmoji = useMemo(() => !!order.avatar && allRandomEmojis.includes(order.avatar), [order.avatar, allRandomEmojis]);
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const [activeMemoSubId, setActiveMemoSubId] = useState<string | null>(null);
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const [isMemoDirectInputMode, setIsMemoDirectInputMode] = useState(false);
  const [customMemo, setCustomMemo] = useState("");
  const [customMenuName, setCustomMenuName] = useState("");
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [expandTimeLeft, setExpandTimeLeft] = useState(5.0);
  const [localQuickMemos, setLocalQuickMemos] = useState<string[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreMenu]);


  useEffect(() => {
    setLocalQuickMemos(appSettings.quickMemos);
  }, [appSettings.quickMemos]);

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expandIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGroupAvatar = order.avatar === '😋';
  const isNotEating = !!order.avatar && !isGroupAvatar && order.subItems.length === 1 && order.subItems[0].itemName === '안 먹음';
  const isUndecided = !!order.avatar && !isGroupAvatar && !isNotEating && (order.subItems.length === 0 || order.subItems.every(si => si.itemName === '미정'));
  const isDecided = !!order.avatar && !isGroupAvatar && !isNotEating && !isUndecided;

  const prevIsUndecided = useRef(isUndecided);
  const prevAvatarRef = useRef(order.avatar);

  useEffect(() => {
    if (order.avatar && !prevAvatarRef.current) {
      setShowAvatarPicker(false);
    }
    prevAvatarRef.current = order.avatar;
  }, [order.avatar]);

  useEffect(() => {
    const isActive = isDirectInputMode || isMemoDirectInputMode;
    onInputModeChange?.(isActive);
  }, [isDirectInputMode, isMemoDirectInputMode]);

  useEffect(() => {
    prevIsUndecided.current = isUndecided;
  }, [isUndecided, isNotEating]);

  useEffect(() => {
    if (isUndecided && !isMoreExpanded) {
      setExpandTimeLeft(5.0);
    }
  }, [isUndecided, isMoreExpanded]);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (expandIntervalRef.current) clearInterval(expandIntervalRef.current);
    };
  }, []);

  const memoChips = useMemo(() => {
    const chips: { text: string; subItemId: string }[] = [];
    order.subItems.forEach(si => {
      if (si.memo) {
        si.memo.split(',').map(m => m.trim()).filter(Boolean).forEach(text => {
          chips.push({ text, subItemId: si.id });
        });
      }
    });
    return chips;
  }, [order.subItems]);

  const allMemos = memoChips;

  const quickMenuOptions = useMemo(() => {
    return appSettings.checkedDrinkItems || [];
  }, [appSettings.checkedDrinkItems]);

  const handleAvatarSelect = (emoji: string) => {
    onUpdate(order.id, { avatar: emoji });
    setShowAvatarPicker(false);
  };

  const handleInitialOrderFinalize = (menuName?: string, forceTemperature?: 'HOT' | 'ICE') => {
    const finalName = menuName || '미정';
    if (finalName !== '미정' && finalName !== '안 먹음' && !drinkItems.includes(finalName)) {
      onAddMenuItem(finalName, 'DRINK');
      onUpdateCheckedItems?.(finalName, true);
    }
    const isIceDefault = finalName.includes('스무디') || finalName.includes('아이스');
    onUpdate(order.id, {
      subItems: [{
        id: uuidv4(),
        type: 'DRINK',
        itemName: finalName,
        temperature: forceTemperature || (isIceDefault ? 'ICE' : 'HOT'),
        size: 'Tall',
        quantity: 1
      }]
    });
    setIsMoreExpanded(false);
    setIsDirectInputMode(false);
    setCustomMenuName("");
  };

  const startAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (isMemoDirectInputMode) return;
    setTimeLeft(5.0);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 0.1));
    }, 100);
    autoCloseTimerRef.current = setTimeout(() => setActiveMemoSubId(null), 5000);
  };

  const handleAddCustomMemo = () => {
    if (!customMemo.trim() || !activeMemoSubId) return;
    const text = customMemo.trim();

    // 예시 칩에 추가
    if (!localQuickMemos.includes(text)) {
      setLocalQuickMemos(prev => [...prev, text]);
    }

    const si = order.subItems.find(s => s.id === activeMemoSubId);
    if (!si) return;
    let m = si.memo ? si.memo.split(',').map(x => x.trim()).filter(Boolean) : [];
    if (!m.includes(text)) {
      m = [...m, text];
      onUpdate(order.id, { subItems: order.subItems.map(s => s.id === activeMemoSubId ? { ...s, memo: m.join(', ') } : s) });
    }
    setCustomMemo("");
    setIsMemoDirectInputMode(false);
    startAutoCloseTimer();
  };

  const handleDeleteChip = (subItemId: string, text: string) => {
    const si = order.subItems.find(s => s.id === subItemId);
    if (!si || !si.memo) return;
    const newMemo = si.memo.split(',').map(m => m.trim()).filter(m => m !== text).join(', ');
    onUpdate(order.id, { subItems: order.subItems.map(s => s.id === subItemId ? { ...s, memo: newMemo } : s) });
  };

  const handleUndoOrder = () => {
    onUpdate(order.id, { subItems: [] });
    setIsMoreExpanded(false);
    setIsDirectInputMode(false);
    setIsMemoDirectInputMode(false);
    setActiveMemoSubId(null);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (expandIntervalRef.current) clearInterval(expandIntervalRef.current);
    setTimeLeft(5.0);
  };

  const handleResetCard = () => {
    onUpdate(order.id, { avatar: '', subItems: [] });
    setShowAvatarPicker(true);
    setIsMoreExpanded(false);
    setIsDirectInputMode(false);
    setIsMemoDirectInputMode(false);
    setActiveMemoSubId(null);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (expandIntervalRef.current) clearInterval(expandIntervalRef.current);
    setTimeLeft(5.0);
  };

  const handleAvatarClick = () => {
    if (activeMemoSubId) return;
    if (isUndecided || isNotEating) handleResetCard();
    else setShowAvatarPicker(true);
  };

  // 공용 메뉴 카드는 기존 로직 유지 (항상 흰색 배경)
  if (isGroupAvatar) {
    const isSynced = appSettings.isSharedSyncActive;
    return (
      <div className={`relative rounded-2xl shadow-toss-card border-2 h-full flex flex-col p-4 transition-all duration-300 bg-white overflow-visible ${highlighted ? 'border-toss-blue ring-4 ring-toss-blueLight animate-highlight-ping z-20 shadow-xl' : 'border-toss-grey-100'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-toss-blueLight flex items-center justify-center"><UtensilsCrossed size={14} className="text-toss-blue" /></div>
              <h3 className="text-[12px] font-black text-toss-grey-900 tracking-tight">함께 먹는 메뉴</h3>
            </div>
            <div className="flex items-center gap-2">
              {isSynced && (
                <button
                  onClick={appSettings.onToggleQuantitySync}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded transition-colors ${appSettings.isQuantitySyncActive ? 'text-toss-blue' : 'text-toss-grey-400'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${appSettings.isQuantitySyncActive ? 'bg-toss-blue border-toss-blue' : 'bg-white border-toss-grey-300'}`}>
                    {appSettings.isQuantitySyncActive && <Check size={10} strokeWidth={3} className="text-white" />}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight shrink-0">수량도 병합</span>
                </button>
              )}
              <button onClick={() => onCopyGroupItemToAll(order.id)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${isSynced ? 'bg-toss-blue text-white shadow-lg shadow-toss-blue/20 ring-2 ring-toss-blue/10 animate-pulse' : 'bg-toss-grey-100 text-toss-grey-400 border border-toss-grey-200'}`}>
                <RefreshCw size={10} strokeWidth={3} className={isSynced ? 'animate-spin-slow' : ''} />
                {isSynced ? '동기화 중' : '동기화 시작'}
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto no-scrollbar mb-4 min-h-[60px] ${order.subItems.length === 0 ? 'flex flex-col' : 'space-y-2'}`}>
            {order.subItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-toss-grey-100 rounded-2xl bg-toss-grey-50/50 p-6 text-center">
                <span className="text-[12px] font-black text-toss-grey-800 mb-2">함께 나눌 메뉴가 아직 없어요</span>
              </div>
            ) : (
              (order.subItems as ExtendedSubItem[]).map(si => (
                <div key={si.id} className="flex flex-col rounded-xl border-2 bg-white overflow-hidden shadow-sm transition-colors border-toss-grey-100">
                  <div className="relative h-8 w-full flex items-center justify-center border-b-2 px-1 bg-toss-grey-50/50 border-toss-grey-50">
                    <button onClick={() => onOpenMenuModal(order.id, si.itemName, si.id, si.type)} className="flex-1 px-4 text-[12px] font-black truncate text-center text-toss-grey-800">{si.itemName}</button>
                  </div>
                  <div className="h-9 flex items-center justify-between px-4 bg-white">
                    <button onClick={() => onUpdate(order.id, { subItems: order.subItems.map(item => item.id === si.id ? { ...item, quantity: Math.max(1, (item.quantity || 1) - 1) } : item) })} className="p-1.5 rounded-lg bg-toss-grey-100 text-toss-grey-600 active:scale-90"><Minus size={14} strokeWidth={3} /></button>
                    <span className="text-[13px] font-black text-toss-grey-900">{si.quantity || 1}개</span>
                    <button onClick={() => onUpdate(order.id, { subItems: order.subItems.map(item => item.id === si.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item) })} className="p-1.5 rounded-lg bg-toss-blueLight text-toss-blue active:scale-90"><Plus size={14} strokeWidth={3} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto shrink-0">
            <button onClick={() => onOpenMenuModal(order.id, '미정', null, 'DESSERT')} className="h-10 bg-toss-blue text-white rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-toss-blue/10"><Plus size={14} strokeWidth={3} /><span className="text-[11px] font-black uppercase tracking-tight">메뉴 추가</span></button>
            <button onClick={() => onUpdate(order.id, { subItems: [] })} className="h-10 bg-toss-grey-100 text-toss-grey-600 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-toss-grey-200"><Trash2 size={14} /><span className="text-[11px] font-black uppercase tracking-tight">비우기</span></button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusStyle = () => {
    if (isUndecided) return { bg: 'bg-amber-400 border-amber-500/30', text: 'text-amber-900', icon: <Clock size={12} strokeWidth={3} />, label: '고민 중', moreBtn: 'text-amber-800/60 hover:text-amber-900 active:scale-90' };
    if (isNotEating) return { bg: 'bg-toss-grey-300 border-toss-grey-400/20', text: 'text-toss-grey-700', icon: <X size={12} strokeWidth={3} />, label: '안 먹음', moreBtn: 'text-toss-grey-600/60 hover:text-toss-grey-800 active:scale-90' };
    if (isDecided) return { bg: 'bg-toss-blue border-toss-blue/20', text: 'text-white', icon: <Check size={12} strokeWidth={3} />, label: '주문 완료', moreBtn: 'text-white/60 hover:text-white active:scale-90' };
    return { bg: 'bg-toss-grey-50 border-toss-grey-100', text: 'text-transparent', icon: null, label: '', moreBtn: 'hidden' };
  };
  const statusStyle = getStatusStyle();

  // 개인 주문 카드: 통합 컨테이너 사용
  return (
    <div className={`relative rounded-2xl flex flex-col p-2 pb-4 transition-all duration-500 overflow-visible z-10
      ${highlighted ? 'border-toss-blue ring-4 ring-toss-blueLight animate-highlight-ping z-20 shadow-xl' : 'shadow-toss-card border-2 border-toss-grey-100'}
      ${appSettings.highlightOrderCard
        ? (isUndecided ? 'bg-amber-50/50' :
          isNotEating ? 'bg-toss-grey-100/50' :
            isDecided ? 'bg-toss-blueLight/30' :
              'bg-white')
        : 'bg-white'}
    `}>
      <AnimatePresence mode="wait">
        {showAvatarPicker ? (
          /* 이모지 선택 화면 */
          <motion.div
            key="avatar-picker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col"
          >
            <div className="grid grid-cols-4 gap-1.5 flex-1 items-center justify-items-center overflow-y-auto no-scrollbar pt-1 pb-2">
              <button onClick={() => handleAvatarSelect("🎲")} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 text-toss-blue transition-transform active:scale-90 border border-toss-blue/10"><Dices size={20} /></button>
              {appSettings.defaultEmojis.map(emoji => (
                <button key={emoji} onClick={() => handleAvatarSelect(emoji)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-transform active:scale-90 leading-none">
                  <EmojiRenderer emoji={emoji} size={28} />
                </button>
              ))}
            </div>
            <button onClick={() => onRemove(order.id)} className="w-full h-9 mt-1 rounded-xl text-[10px] font-black text-white bg-toss-grey-400 hover:bg-toss-red transition-all shadow-sm shrink-0">인원 삭제</button>
          </motion.div>
        ) : (
          /* 주문 상세 화면 */
          <motion.div
            key="order-detail"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-start h-full relative overflow-visible"
          >
            {/* 꽉 찬 상태 셀: 상태 뱃지 및 ... 메뉴 통합 */}
            <div className="w-full flex items-center justify-between mb-2 shrink-0 h-7 z-[50]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isUndecided ? 'undecided' : isNotEating ? 'noteating' : isDecided ? 'decided' : 'empty'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`relative w-full h-full px-2.5 rounded-lg shadow-sm flex items-center justify-center border ${statusStyle.bg}`}
                >
                  <span className={`relative text-[10px] font-black tracking-tight leading-none pt-[1px] ${statusStyle.text}`}>
                    {statusStyle.icon && (
                      <span className="absolute right-full mr-1.5 top-1/2 -translate-y-1/2 flex items-center">
                        {statusStyle.icon}
                      </span>
                    )}
                    {statusStyle.label}
                  </span>

                  {/* ... 더보기 버튼 - 되돌리기/삭제 */}
                  <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center ${!isUndecided && !isNotEating && !isDecided ? 'hidden' : ''}`} ref={moreMenuRef}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMoreMenu(prev => !prev); }}
                      className={`w-[22px] h-[22px] flex items-center justify-center transition-all ${statusStyle.moreBtn}`}
                      title="더보기"
                    >
                      <MoreHorizontal size={14} strokeWidth={2.5} />
                    </button>
                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-6 z-[100] bg-white rounded-xl shadow-xl border border-toss-grey-100 overflow-hidden min-w-[80px] py-0.5"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenMenuModal(order.id, '미정', null, 'DESSERT'); setShowMoreMenu(false); }}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-bold text-toss-blue hover:bg-toss-blueLight/20 transition-colors border-b border-toss-grey-100 whitespace-nowrap"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                            메뉴 추가
                          </button>
                          {(isDecided || isNotEating) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUndoOrder(); setShowMoreMenu(false); }}
                              className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-bold text-toss-grey-700 hover:bg-toss-grey-50 transition-colors whitespace-nowrap"
                            >
                              <RotateCcw size={11} strokeWidth={2.5} className="text-toss-grey-400" />
                              되돌리기
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemove(order.id); setShowMoreMenu(false); }}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-bold text-toss-red hover:bg-toss-redLight transition-colors border-t border-toss-grey-100 whitespace-nowrap"
                          >
                            <Trash2 size={11} strokeWidth={2.5} />
                            삭제
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* 이모지 아바타 */}
            <div className="w-full flex justify-center mb-1">
              <div className="relative inline-block">
                <button onClick={handleAvatarClick} className="text-5xl active:scale-95 transition-transform drop-shadow-sm select-none animate-float relative z-10">
                  <EmojiRenderer emoji={order.avatar} size={48} />
                  {allMemos.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-0 right-0 bg-white rounded-full p-1.5 shadow-md border-2 border-toss-blue z-20"
                    >
                      <MessageCircle size={12} className="text-toss-blue fill-toss-blue/20" />
                    </motion.div>
                  )}
                </button>
                {isRandomEmoji && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const emojis = CATEGORY_EMOJIS[appSettings.randomCategory] || CATEGORY_EMOJIS['ANIMALS'];
                      onUpdate(order.id, { avatar: emojis[Math.floor(Math.random() * emojis.length)] });
                    }}
                    className="absolute -bottom-1 -left-1 w-5 h-5 bg-white rounded-full shadow-md border border-toss-grey-200 flex items-center justify-center z-20 active:scale-90 transition-transform hover:bg-toss-grey-50"
                    title="다시 랜덤 선택"
                  >
                    <Dices size={11} className="text-toss-grey-500" />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="w-full mt-1 flex-1 flex flex-col justify-start overflow-visible">
              {isUndecided ? (
                <motion.div layout transition={{ type: 'spring', damping: 25, stiffness: 180 }} className="w-full space-y-0.5 animate-in slide-in-from-bottom-2 pb-1 overflow-visible">
                  <AnimatePresence mode="wait">
                    {!isMoreExpanded ? (
                      <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-0.5">
                        <div className="flex flex-col gap-0.5">
                          {quickMenuOptions.filter(menu => drinkItems.includes(menu)).map((menu, idx) => (
                            <div key={idx} className="w-full h-9 bg-white border border-yellow-200 rounded-lg shadow-sm flex items-center relative overflow-hidden transition-all mb-0.5">
                              <button
                                onClick={() => handleInitialOrderFinalize(menu)}
                                className="flex-1 h-full text-left px-3 font-black text-[10px] text-yellow-800 active:bg-yellow-50 w-full leading-tight pr-[54px]"
                              >
                                {menu}
                              </button>
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                                <button onClick={(e) => { e.stopPropagation(); handleInitialOrderFinalize(menu, 'HOT'); }} className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 text-toss-red active:scale-95 transition-all" title="HOT">
                                  <Flame size={11} strokeWidth={2.5} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleInitialOrderFinalize(menu, 'ICE'); }} className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-toss-blue active:scale-95 transition-all" title="ICE">
                                  <Snowflake size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setIsMoreExpanded(true)} className="w-full h-9 bg-toss-grey-800 text-white rounded-lg font-black text-[10px] shadow-sm active:scale-95 transition-all flex items-center justify-center relative overflow-hidden group">
                          <span className="relative z-10 flex items-center gap-1.5">더보기</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="expanded" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ type: 'spring', damping: 25, stiffness: 180 }} className="flex flex-col gap-0.5 overflow-visible">
                        {[...drinkItems].filter(i => i !== '미정' && i !== '안 먹음').sort((a, b) => {
                          const aIsQuick = quickMenuOptions.includes(a);
                          const bIsQuick = quickMenuOptions.includes(b);
                          if (aIsQuick && !bIsQuick) return -1;
                          if (!aIsQuick && bIsQuick) return 1;
                          return 0;
                        }).map((menu, idx) => {
                          const isQuickMenu = quickMenuOptions.includes(menu);
                          return (
                            <div key={idx} className="w-full h-9 bg-white border border-yellow-200 rounded-lg shadow-sm flex items-center relative overflow-hidden mb-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateCheckedItems?.(menu, !isQuickMenu);
                                }}
                                className={`absolute left-0 pl-2.5 pr-2 h-full flex items-center justify-center transition-all z-10 ${isQuickMenu ? 'text-amber-400 hover:text-amber-500 scale-110 active:scale-95' : 'text-toss-grey-300 hover:text-amber-400 active:scale-95'}`}
                              >
                                <Star size={13} fill={isQuickMenu ? 'currentColor' : 'none'} strokeWidth={isQuickMenu ? 0 : 2} />
                              </button>
                              <button
                                onClick={() => handleInitialOrderFinalize(menu)}
                                className="flex-1 h-full text-left pl-[30px] pr-[60px] font-black text-[10px] text-yellow-800 active:bg-yellow-50 w-full leading-tight"
                              >
                                {menu}
                              </button>
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                                <button onClick={(e) => { e.stopPropagation(); handleInitialOrderFinalize(menu, 'HOT'); }} className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 text-toss-red active:scale-95 transition-all" title="HOT">
                                  <Flame size={11} strokeWidth={2.5} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleInitialOrderFinalize(menu, 'ICE'); }} className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-toss-blue active:scale-95 transition-all" title="ICE">
                                  <Snowflake size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {isDirectInputMode ? (
                          <div className="relative h-8 w-full animate-in zoom-in-95 duration-200">
                            <input type="text" lang="ko" enterKeyHint="done" placeholder="입력..." className="w-full h-full bg-white border border-toss-blue rounded-lg pl-2 pr-7 text-[10px] font-black text-toss-grey-900 focus:outline-none placeholder:text-toss-grey-300 text-center" value={customMenuName} onChange={(e) => setCustomMenuName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInitialOrderFinalize(customMenuName)} onBlur={() => !customMenuName && setIsDirectInputMode(false)} autoFocus />
                            <button onClick={() => handleInitialOrderFinalize(customMenuName)} className="absolute right-1 top-1/2 -translate-y-1/2 text-toss-blue hover:text-toss-blue/70 transition-colors p-1"><Send size={12} strokeWidth={3} /></button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => { setCustomMenuName(""); setIsDirectInputMode(true); }} className="w-full h-8 bg-toss-grey-100 text-toss-grey-700 rounded-lg font-black text-[10px] shrink-0 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-toss-grey-200 shadow-sm mb-1"><Pencil size={10} strokeWidth={3} /> 직접 입력</button>
                            <button onClick={() => onOpenMenuModal(order.id, '미정', null, 'DESSERT')} className="w-full h-8 bg-toss-grey-100 text-toss-grey-700 rounded-lg font-black text-[10px] shrink-0 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-toss-grey-200 shadow-sm mb-1"><UtensilsCrossed size={12} strokeWidth={3} /> 메뉴판 보기</button>
                            <button onClick={() => handleInitialOrderFinalize('안 먹음')} className="w-full h-8 bg-toss-grey-100 text-toss-grey-700 rounded-lg font-black text-[10px] shrink-0 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-toss-grey-200 shadow-sm"><UserMinus size={12} /> 먹지 않겠대요</button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : isNotEating ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center py-2 animate-in fade-in duration-500 overflow-visible min-h-[80px]">
                  <p className="text-[12px] font-black text-toss-grey-600">먹지 않겠대요</p>
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col overflow-visible pt-1">
                  <div className="flex-1 space-y-2 overflow-visible">
                    {order.subItems.map((si, idx) => (
                      <div key={si.id} className="flex flex-col gap-1.5 animate-in fade-in duration-300 overflow-visible">
                        {idx > 0 && <div className="w-full h-[1px] bg-toss-grey-100 my-0.5" />}
                        <div className="relative w-full h-7 flex items-center justify-center">
                          <button onClick={() => onOpenMenuModal(order.id, si.itemName, si.id, si.type)} className="w-full h-full bg-toss-grey-100 rounded-lg flex items-center justify-center border border-toss-grey-200 shadow-sm active:scale-95 transition-all px-8">
                            <span className="text-[11px] font-black text-toss-grey-800 truncate text-center w-full">{si.itemName}</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMemoSubId(si.id === activeMemoSubId ? null : si.id); startAutoCloseTimer(); }} className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 active:scale-90 transition-transform ${activeMemoSubId === si.id ? 'text-toss-blue' : 'text-toss-grey-300 hover:text-toss-blue'}`}>
                            <MessageCircle size={10} />
                          </button>
                        </div>

                        {si.itemName !== '미정' && si.itemName !== '안 먹음' && si.type === 'DRINK' && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1.5 h-7">
                              <button onClick={() => onUpdate(order.id, { subItems: order.subItems.map(s => s.id === si.id ? { ...s, temperature: 'HOT' } : s) })} className={`flex-1 flex items-center justify-center gap-1 rounded-lg transition-all border ${si.temperature === 'HOT' ? 'bg-toss-redLight border-toss-red text-toss-red' : 'bg-white border-toss-grey-100 text-toss-grey-300'}`}><Flame size={10} strokeWidth={3} /><span className="text-[8px] font-black">HOT</span></button>
                              <button onClick={() => onUpdate(order.id, { subItems: order.subItems.map(s => s.id === si.id ? { ...s, temperature: 'ICE' } : s) })} className={`flex-1 flex items-center justify-center gap-1 rounded-lg transition-all border ${si.temperature === 'ICE' ? 'bg-toss-blueLight border-toss-blue text-toss-blue' : 'bg-white border-toss-grey-100 text-toss-grey-300'}`}><Snowflake size={10} strokeWidth={3} /><span className="text-[8px] font-black">ICE</span></button>
                            </div>
                            {appSettings.showDrinkSize && (
                              <div className="flex gap-1.5 h-7">
                                {(['Tall', 'Grande', 'Venti'] as DrinkSize[]).map((sz) => {
                                  const isSizeSelected = (si.size || 'Tall') === sz;
                                  return (
                                    <button
                                      key={sz}
                                      onClick={() => onUpdate(order.id, { subItems: order.subItems.map(s => s.id === si.id ? { ...s, size: sz } : s) })}
                                      className={`flex-1 flex items-center justify-center rounded-lg border transition-all text-[8px] font-black ${isSizeSelected ? 'bg-toss-blue border-toss-blue text-white shadow-sm' : 'bg-white border-toss-grey-100 text-toss-grey-400'}`}
                                    >
                                      {sz.charAt(0)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="w-full overflow-hidden">
                          <motion.div layout transition={{ duration: 0.25, ease: "easeInOut" }} className="grid grid-cols-2 gap-1.5 w-full">
                            <AnimatePresence initial={false} mode="popLayout">
                              {(() => {
                                const isExpanded = activeMemoSubId === si.id;
                                const selectedMemos = si.memo ? si.memo.split(',').map(x => x.trim()).filter(Boolean) : [];
                                const visibleMemos = isExpanded ? localQuickMemos : selectedMemos;

                                return visibleMemos.map((memo, idx, arr) => {
                                  const isSelected = selectedMemos.includes(memo);
                                  const isFullWidth = idx === arr.length - 1 && arr.length % 2 !== 0;

                                  return (
                                    <motion.button
                                      layout
                                      key={memo}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{
                                        opacity: { duration: 0.2 },
                                        layout: { duration: 0.25, ease: "easeInOut" }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isExpanded) {
                                          let m = [...selectedMemos];
                                          m = isSelected ? m.filter(x => x !== memo) : [...m, memo];
                                          onUpdate(order.id, { subItems: order.subItems.map(s => s.id === si.id ? { ...s, memo: m.join(', ') } : s) });
                                          startAutoCloseTimer();
                                        } else {
                                          handleDeleteChip(si.id, memo);
                                        }
                                      }}
                                      className={`h-7 flex items-center justify-center rounded-lg border font-black shadow-sm active:scale-95 text-[9px] transition-colors ${isSelected
                                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                                        : 'bg-white border-toss-grey-100 text-toss-grey-700'
                                        } ${isFullWidth ? 'col-span-2' : ''}`}
                                    >
                                      {memo}
                                    </motion.button>
                                  );
                                });
                              })()}
                            </AnimatePresence>
                          </motion.div>

                          <AnimatePresence>
                            {activeMemoSubId === si.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-1.5 space-y-1.5">
                                {isMemoDirectInputMode ? (
                                  <div className="relative h-8 w-full animate-in zoom-in-95 duration-200">
                                    <input type="text" lang="ko" enterKeyHint="done" placeholder="메모 입력..." className="w-full h-full bg-white border border-toss-blue rounded-lg pl-2 pr-7 text-[10px] font-black text-toss-grey-900 focus:outline-none placeholder:text-toss-grey-300 text-center" value={customMemo} onChange={(e) => setCustomMemo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMemo()} onBlur={() => !customMemo && setIsMemoDirectInputMode(false)} autoFocus />
                                    <button onClick={handleAddCustomMemo} className="absolute right-1 top-1/2 -translate-y-1/2 text-toss-blue hover:text-toss-blue/70 transition-colors p-1"><Send size={12} strokeWidth={3} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setIsMemoDirectInputMode(true)} className="w-full h-8 bg-toss-blue text-white rounded-lg font-black text-[10px] shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"><Pencil size={10} strokeWidth={3} /> 직접 입력</button>
                                )}
                                <button onClick={() => { setActiveMemoSubId(null); setIsMemoDirectInputMode(false); }} className="w-full h-8 bg-toss-grey-800 text-white rounded-lg font-black text-[10px] shadow-sm active:scale-95 transition-all flex items-center justify-center relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-white/20 w-full scale-x-0 origin-left" style={{ transform: `scaleX(${1 - (timeLeft / 5.0)})`, transition: timeLeft === 5.0 ? 'none' : 'transform 0.1s linear' }} />
                                  <span className="relative z-10 flex items-center gap-1.5">{timeLeft === 5.0 ? "완료" : `${timeLeft.toFixed(1)}초 후 자동 완료`}</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          </motion.div >
        )}
      </AnimatePresence >
    </div >
  );
};
