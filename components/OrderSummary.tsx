
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderGroup, AggregatedOrder, AppSettings, ItemType } from '../types.ts';
import { ChevronUp, ChevronDown, Coffee, Users, LayoutGrid, List, CheckCircle2, Save, UserMinus, Pencil, Check, Copy, Trash2, X, UtensilsCrossed } from 'lucide-react';
import { EmojiRenderer } from './EmojiRenderer.tsx';

interface OrderSummaryProps {
  groups: OrderGroup[];
  onSaveHistory: (summaryText: string, totalCount: number, memo?: string) => void;
  onJumpToOrder: (groupId: string, personId: string) => void;
  onUpdateGroupName?: (groupId: string, newName: string) => void;
  onSetNotEating?: (personIds: string[]) => void;
  onRemoveUndecided?: (personIds: string[]) => void;
  onRemoveOrder?: (personId: string) => void;
  appSettings: AppSettings;
  expandState: 'collapsed' | 'expanded' | 'fullscreen';
  onSetExpandState: (state: 'collapsed' | 'expanded' | 'fullscreen') => void;
}

interface GroupedMemoProps {
  memo: string;
  people: { avatar: string; personId: string; groupId: string }[];
  onJump: (groupId: string, personId: string) => void;
}

const GroupedMemo: React.FC<GroupedMemoProps> = ({ memo, people, onJump }) => {
  const uniquePeople = useMemo(() => {
    const seen = new Set();
    return people.filter(p => {
      if (seen.has(p.personId)) return false;
      seen.add(p.personId);
      return true;
    });
  }, [people]);

  return (
    <div className="flex items-center gap-1.5 bg-white border border-toss-grey-100 px-2 py-1 rounded-full shadow-toss-sm animate-in zoom-in-95 duration-200">
      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
        {uniquePeople.slice(0, 3).map((p, i) => (
          <button
            key={`${p.personId}-${i}`}
            onClick={(e) => { e.stopPropagation(); onJump(p.groupId, p.personId); }}
            className="relative inline-block h-5 w-5 rounded-full ring-2 ring-white bg-toss-grey-100 text-[10px] flex items-center justify-center shadow-sm hover:z-10 hover:scale-110 transition-all active:scale-95 overflow-hidden"
          >
            <EmojiRenderer emoji={p.avatar || "👤"} size={14} />
          </button>
        ))}
      </div>
      <span className="text-[10px] text-toss-grey-700 font-bold leading-none max-w-[90px] truncate">{memo}</span>
    </div>
  );
};

type ViewMode = 'all' | 'table';

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  groups, onSaveHistory, onJumpToOrder, onUpdateGroupName, onSetNotEating, onRemoveUndecided, onRemoveOrder, appSettings, expandState, onSetExpandState
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState("");
  const [showUndecidedShadow, setShowUndecidedShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const undecidedScrollRef = useRef<HTMLDivElement>(null);

  const handleCopySummary = () => {
    const text = viewMode === 'all' ? allSummary : tableSummary;
    navigator.clipboard.writeText(text);
    alert('주문 내역이 클립보드에 복사되었습니다!');
  };

  const checkShadows = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 5);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  const checkUndecidedShadow = () => {
    if (undecidedScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = undecidedScrollRef.current;
      setShowUndecidedShadow(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  useEffect(() => {
    if (expandState !== 'collapsed') {
      setTimeout(() => {
        checkShadows();
        checkUndecidedShadow();
      }, 100);
    }
  }, [expandState, viewMode, groups]);

  const personsWithGroup = useMemo(() =>
    groups.flatMap(g => g.items.filter(p => p.avatar !== '😋').map(p => ({ ...p, groupId: g.id, groupName: g.name }))),
    [groups]
  );

  const totalPeople = useMemo(() => personsWithGroup.length, [personsWithGroup]);

  const undecidedPersons = useMemo(() =>
    personsWithGroup.filter(p =>
      p.subItems.length === 0 ||
      p.subItems.every(si => si.itemName === '미정' || si.itemName === '')
    )
    , [personsWithGroup]);

  const notEatingPersons = useMemo(() =>
    personsWithGroup.filter(p => p.avatar && p.avatar !== '😋' && p.subItems.length === 1 && p.subItems[0].itemName === '안 먹음')
    , [personsWithGroup]);

  const decidedCount = totalPeople - undecidedPersons.length;
  const undecidedCount = undecidedPersons.length;
  const notEatingCount = notEatingPersons.length;
  const eatingCount = decidedCount - notEatingCount;
  const isAllDecided = totalPeople > 0 && undecidedCount === 0;

  const aggregatedOrders = useMemo(() => {
    const map = new Map<string, AggregatedOrder>();
    groups.flatMap(g => g.items.map(p => ({ ...p, groupId: g.id }))).forEach(person => {
      person.subItems.forEach(si => {
        if (!si.itemName || si.itemName === '미정' || si.itemName === '안 먹음') return;

        const sizeTag = (appSettings.showDrinkSize && si.type === 'DRINK') ? (si.size || 'Tall') : '';
        const key = si.type === 'DRINK' ? `DRINK-${si.temperature}-${sizeTag}-${si.itemName.trim()}` : `DESSERT-${si.itemName.trim()}`;
        const qty = si.quantity || 1;
        const currentMemos = si.memo ? si.memo.split(',').map(m => m.trim()).filter(Boolean) : [];

        if (map.has(key)) {
          const item = map.get(key)!;
          item.count += qty;

          currentMemos.forEach(m => {
            if (!item.memoCounts) item.memoCounts = {};
            item.memoCounts[m] = (item.memoCounts[m] || 0) + qty;
          });

          if (currentMemos.length > 0) {
            const addedMemos = Array(qty).fill({
              memos: currentMemos,
              avatar: person.avatar || '👤',
              personId: person.id,
              groupId: person.groupId
            });
            item.individualMemos = [...(item.individualMemos || []), ...addedMemos];
          }
        } else {
          const memoCounts: Record<string, number> = {};
          currentMemos.forEach(m => { memoCounts[m] = qty; });

          map.set(key, {
            type: si.type, itemName: si.itemName.trim(), temperature: si.temperature, size: (appSettings.showDrinkSize && si.type === 'DRINK') ? (si.size || 'Tall') : undefined, count: qty,
            memoCounts,
            individualMemos: currentMemos.length > 0 ? Array(qty).fill({
              memos: currentMemos,
              avatar: person.avatar || '👤',
              personId: person.id,
              groupId: person.groupId
            }) : []
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'DRINK' ? -1 : 1;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [groups, appSettings.showDrinkSize]);

  const totalItemCount = useMemo(() => aggregatedOrders.reduce((acc, curr) => acc + curr.count, 0), [aggregatedOrders]);

  const handleStartEditName = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setTempGroupName(currentName);
  };

  const handleSaveName = (groupId: string) => {
    if (onUpdateGroupName && tempGroupName.trim()) {
      onUpdateGroupName(groupId, tempGroupName.trim());
    }
    setEditingGroupId(null);
  };

  const toggleItemExpansion = (key: string) => {
    setCollapsedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tableSummary = useMemo(() => {
    return groups.map(g => {
      const orderTexts: string[] = [];
      g.items.forEach(p => {
        p.subItems.forEach(si => {
          if (si.itemName === '미정' || si.itemName === '안 먹음') return;
          let t = `${si.itemName}`;
          if (si.type === 'DRINK') t = `[${si.temperature}] ${t}`;
          if (si.quantity && si.quantity > 1) t += ` x${si.quantity}`;
          orderTexts.push(t);
        });
      });
      return orderTexts.length > 0 ? `${g.name}: ${orderTexts.join(', ')}` : null;
    }).filter(Boolean).join('\n');
  }, [groups]);

  const allSummary = useMemo(() => aggregatedOrders.map(o => {
    let t = o.itemName;
    if (o.type === 'DRINK') t = `[${o.temperature}] ${t}`;
    return `${t}: ${o.count}개`;
  }).join('\n'), [aggregatedOrders]);

  const SummaryHeader = () => (
    <div className="flex items-center gap-5 w-full">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 shrink-0 ${isAllDecided ? 'bg-toss-blue text-white shadow-lg shadow-toss-blue/20' : 'bg-toss-grey-100 text-toss-grey-400 border border-toss-grey-200'}`}
      >
        {isAllDecided ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Users size={24} strokeWidth={2.5} />}
      </motion.div>
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <p className="text-[17px] font-black text-toss-grey-900 leading-tight tracking-tight">
            {totalPeople}명 주문 확인
          </p>
          {isAllDecided && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 bg-toss-blue/10 px-2.5 py-0.5 rounded-full"
            >
              <EmojiRenderer emoji="🐻" size={14} />
              <span className="text-[11px] font-black text-toss-blue">완료</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5">
          <span className="text-[11px] font-bold text-toss-grey-400">총 {totalPeople}명</span>
          <div className="w-1 h-1 bg-toss-grey-200 rounded-full" />
          <span className="text-[11px] font-black text-toss-blue">주문 {eatingCount}명</span>
          <div className="w-1 h-1 bg-toss-grey-200 rounded-full" />
          <span className="text-[11px] font-bold text-toss-grey-500">안먹음 {notEatingCount}명</span>
          {undecidedCount > 0 && (
            <>
              <div className="w-1 h-1 bg-toss-grey-200 rounded-full" />
              <span className="text-[11px] font-black text-toss-red animate-pulse">미정 {undecidedCount}명</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const getMemoGroups = (memos?: { memos: string[]; avatar: string; personId: string; groupId: string }[]) => {
    if (!memos) return [];
    const grouped: Record<string, { memos: string[]; people: any[] }> = {};
    memos.forEach(m => {
      const sortedMemos = [...m.memos].map(x => x.trim()).filter(Boolean).sort();
      const groupKey = sortedMemos.join(', ');
      if (!grouped[groupKey]) grouped[groupKey] = { memos: sortedMemos, people: [] };
      grouped[groupKey].people.push(m);
    });
    return Object.values(grouped);
  };

  if (expandState === 'collapsed') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[2000] flex justify-center pointer-events-none">
        <button
          onClick={() => onSetExpandState('expanded')}
          className="w-full max-w-lg bg-white/98 backdrop-blur-2xl border-t border-x border-toss-grey-100 rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] px-7 pt-3.5 pb-8 flex flex-col items-center pointer-events-auto active:scale-[0.99] transition-all ring-1 ring-black/5"
        >
          <div className="w-12 h-1.5 bg-toss-grey-200/80 rounded-full mb-4" />
          <div className="w-full flex items-center justify-between">
            <SummaryHeader />
            <div className="w-10 h-10 rounded-full bg-toss-grey-50 flex items-center justify-center text-toss-grey-300 ml-2 shrink-0 border border-toss-grey-100">
              <ChevronUp size={20} strokeWidth={3} />
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[2000] animate-in fade-in duration-300" onClick={() => onSetExpandState('collapsed')} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 250 }}
        className="fixed left-0 right-0 bottom-0 z-[2001] bg-white shadow-toss-elevated flex flex-col max-w-lg mx-auto rounded-t-[36px] h-[88vh] overflow-hidden"
      >
        <div className="flex flex-col shrink-0">
          <button onClick={() => onSetExpandState('collapsed')} className="w-full flex justify-center py-4">
            <div className="w-12 h-1.5 bg-toss-grey-200 rounded-full" />
          </button>
          <div className="px-7 flex items-center justify-between pb-5">
            <SummaryHeader />
          </div>
        </div>

        <div className="px-5 mb-4 space-y-2.5 shrink-0 overflow-visible">
          {undecidedCount > 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-amber-50 rounded-[24px] border border-amber-100 shadow-sm animate-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[12px] font-black text-amber-900 tracking-tight flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  미정 인원 즉시 관리
                  <span className="bg-amber-200/50 text-amber-800 px-1.5 py-0.5 rounded-md ml-0.5">{undecidedCount}명</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSetNotEating?.(undecidedPersons.map(p => p.id))}
                    className="h-8 px-3 bg-white border border-amber-200 rounded-xl text-[10px] font-black text-amber-900 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <UserMinus size={13} strokeWidth={2.5} /> 전체 안먹음
                  </button>
                  <button
                    onClick={() => onRemoveUndecided?.(undecidedPersons.map(p => p.id))}
                    className="h-8 px-3 bg-white border border-toss-red/20 rounded-xl text-[10px] font-black text-toss-red shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} strokeWidth={2.5} /> 전체 삭제
                  </button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-b-[20px]">
                <div
                  ref={undecidedScrollRef}
                  onScroll={checkUndecidedShadow}
                  className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1 py-1"
                >
                  <AnimatePresence mode="popLayout" initial={false} onExitComplete={checkUndecidedShadow}>
                    {undecidedPersons.map((p) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        key={p.id}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-[20px] border border-amber-100 shadow-sm hover:border-amber-300 transition-colors"
                      >
                        <div className="w-11 h-11 bg-amber-50 rounded-full flex items-center justify-center text-2xl shrink-0 ring-1 ring-amber-100">
                          <EmojiRenderer emoji={p.avatar || "👤"} size={28} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-toss-grey-900 truncate tracking-tight">{p.groupName}</p>
                          <p className="text-[10px] font-bold text-amber-600 mt-0.5 uppercase tracking-wide">Pending</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { onJumpToOrder(p.groupId, p.id); onSetExpandState('collapsed'); }}
                            className="h-9 px-3.5 bg-toss-grey-100 text-toss-grey-700 rounded-xl text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            이동
                          </button>
                          <button
                            onClick={() => onSetNotEating?.([p.id])}
                            className="h-9 w-9 bg-toss-grey-900 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm"
                          >
                            <UserMinus size={15} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onRemoveOrder?.(p.id)}
                            className="h-9 w-9 bg-toss-redLight text-toss-red rounded-xl flex items-center justify-center active:scale-95 transition-all border border-toss-red/10"
                          >
                            <Trash2 size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {showUndecidedShadow && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-50 via-amber-50/80 to-transparent pointer-events-none flex items-end justify-center pb-1"
                    >
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-amber-400 bg-white/50 rounded-full p-0.5 backdrop-blur-sm shadow-sm"
                      >
                        <ChevronDown size={16} strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-6 mb-3 shrink-0">
          <div className="flex p-1.5 bg-toss-grey-100 rounded-[24px]">
            <button onClick={() => setViewMode('all')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] text-[14px] font-black tracking-tight transition-all duration-300 ${viewMode === 'all' ? 'bg-white text-toss-blue shadow-md' : 'text-toss-grey-400'}`}><LayoutGrid size={16} strokeWidth={2.5} /> 합계 보기</button>
            <button onClick={() => setViewMode('table')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] text-[14px] font-black tracking-tight transition-all duration-300 ${viewMode === 'table' ? 'bg-white text-toss-blue shadow-md' : 'text-toss-grey-400'}`}><List size={16} strokeWidth={2.5} /> 테이블별 보기</button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence>
            {showTopShadow && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>
          <div
            ref={scrollRef}
            onScroll={checkShadows}
            className="h-full overflow-y-auto custom-scrollbar px-6 space-y-2.5 pb-12 overscroll-contain"
          >
            {viewMode === 'all' ? (
              aggregatedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-toss-grey-300 animate-in fade-in duration-500 scale-110">
                  <div className="w-16 h-16 rounded-full bg-toss-grey-50 flex items-center justify-center mb-4">
                    <Coffee size={32} className="opacity-20" />
                  </div>
                  <p className="text-[15px] font-black text-toss-grey-400">주문 내역이 비어있습니다</p>
                </div>
              ) : (
                aggregatedOrders.map((item, idx) => {
                  const itemKey = `${item.type}-${item.itemName}-${item.temperature || ''}-${item.size || ''}`;
                  const memoGroups = getMemoGroups(item.individualMemos);
                  const isCollapsed = collapsedItems.has(itemKey);
                  const hasMemos = memoGroups.length > 0;
                  return (
                    <motion.div
                      layout
                      key={idx}
                      className="bg-white rounded-[24px] border border-toss-grey-100 shadow-toss-sm overflow-hidden transition-all duration-300"
                    >
                      <div className={`w-full flex items-center justify-between p-4 ${hasMemos ? 'bg-toss-grey-50/30 border-b border-toss-grey-50/50' : 'py-5'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {item.type === 'DRINK' ? (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border-2 shrink-0 ${item.temperature === 'ICE' ? 'bg-toss-blueLight border-toss-blue text-toss-blue' : 'bg-toss-redLight border-toss-red text-toss-red'}`}>{item.temperature}</span>
                          ) : (
                            <span className="text-[9px] font-black bg-amber-50 border-2 border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-lg shrink-0">DESSERT</span>
                          )}
                          <div className="flex flex-col items-start min-w-0">
                            <span className="text-[15px] font-black text-toss-grey-900 truncate tracking-tight">{item.itemName}</span>
                            {item.size && <span className="text-[10px] font-bold text-toss-grey-400 uppercase tracking-wide mt-0.5">{item.size} Size</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[22px] font-black text-toss-grey-900 tabular-nums">{item.count}</span>
                              <span className="text-[13px] font-bold text-toss-grey-500">개</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {hasMemos && (
                        <div className="px-4 pb-4 space-y-2 pt-3 bg-white">
                          {memoGroups.map((group, gidx) => (
                            <div key={gidx} className="flex items-center justify-between bg-white p-3 rounded-[20px] border border-toss-grey-100 shadow-sm transition-all hover:border-toss-blue/30">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-2.5">
                                  <div className="flex flex-wrap gap-1">
                                    {group.memos.map((memoItem, mIdx) => (
                                      <span key={mIdx} className="text-[11px] font-black text-toss-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-toss-blue/10 w-fit">
                                        {memoItem === '덜쓰게' ? '연하게' : memoItem}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.people.slice(0, 8).map((p, pidx) => (
                                      <button
                                        key={pidx}
                                        onClick={() => { onJumpToOrder(p.groupId, p.personId); onSetExpandState('collapsed'); }}
                                        className="w-8 h-8 rounded-full bg-toss-grey-50 ring-2 ring-white flex items-center justify-center shrink-0 border border-toss-grey-100 shadow-sm active:scale-90 hover:z-10 relative transition-transform"
                                        title="주문자로 이동"
                                      >
                                        <EmojiRenderer emoji={p.avatar} size={20} />
                                      </button>
                                    ))}
                                    {group.people.length > 8 && (
                                      <div className="w-8 h-8 rounded-full bg-toss-grey-900 ring-2 ring-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                        +{group.people.length - 8}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 pr-1">
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-[18px] font-black text-toss-blue tabular-nums">{group.people.length}</span>
                                  <span className="text-[12px] font-bold text-toss-grey-400">잔</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )
            ) : (
              groups.map((group) => {
                const participantsCount = group.items.filter(p => p.avatar !== '😋').length;
                const isEditing = editingGroupId === group.id;
                const groupItemCount = group.items.reduce((acc, p) => acc + p.subItems.reduce((sAcc, si) => (si.itemName !== '미정' && si.itemName !== '안 먹음' ? sAcc + (si.quantity || 1) : sAcc), 0), 0);

                return (
                  <div key={group.id} className="bg-white rounded-[28px] border border-toss-grey-100 overflow-hidden shadow-toss-sm mb-3">
                    <div className="bg-toss-grey-100/50 px-5 py-3.5 flex items-center justify-between border-b border-toss-grey-100">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input autoFocus type="text" value={tempGroupName} onChange={(e) => setTempGroupName(e.target.value)} className="bg-white border border-toss-blue rounded-xl px-3 py-1.5 text-[14px] font-black focus:outline-none w-full max-w-[170px] shadow-sm" onKeyDown={(e) => e.key === 'Enter' && handleSaveName(group.id)} />
                          <button onClick={() => handleSaveName(group.id)} className="w-9 h-9 flex items-center justify-center text-toss-blue bg-white rounded-xl shadow-sm border border-toss-blue/20 active:scale-90"><Check size={18} strokeWidth={3} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-black text-toss-grey-900 tracking-tight">{group.name}</span>
                          <button onClick={() => handleStartEditName(group.id, group.name)} className="p-1.5 text-toss-grey-300 hover:text-toss-blue transition-colors bg-white rounded-lg shadow-sm active:scale-90"><Pencil size={12} /></button>
                          <div className="w-1 h-1 bg-toss-grey-300 rounded-full mx-1" />
                          <span className="text-[12px] font-bold text-toss-grey-400">{participantsCount}명 참여</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-0.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-toss-grey-100">
                        <span className="text-[13px] font-black text-toss-blue tabular-nums">{groupItemCount}</span>
                        <span className="text-[10px] font-black text-toss-blue/60 uppercase">개</span>
                      </div>
                    </div>
                    <div className="divide-y divide-toss-grey-50">
                      {group.items.some(p => p.subItems.some(si => si.itemName !== '미정' && si.itemName !== '' && si.itemName !== '안 먹음')) ? (
                        group.items.filter(p => p.subItems.some(si => si.itemName !== '미정' && si.itemName !== '' && si.itemName !== '안 먹음')).map(person => (
                          <div key={person.id} className="p-4 hover:bg-toss-grey-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <button onClick={() => { onJumpToOrder(group.id, person.id); onSetExpandState('collapsed'); }} className="flex items-center gap-3 active:scale-[0.98] transition-all min-w-0 text-left w-full">
                                <div className="w-9 h-9 bg-toss-grey-50 rounded-full flex items-center justify-center shrink-0 border border-toss-grey-100">
                                  <EmojiRenderer emoji={person.avatar || (person.avatar === '😋' ? '😋' : '👤')} size={24} />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  {person.subItems.filter(si => si.itemName !== '미정' && si.itemName !== '안 먹음').map(si => (
                                    <div key={si.id} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-[14px] font-black text-toss-grey-900 truncate tracking-tight">{si.itemName}</span>
                                        {si.type === 'DRINK' && <span className={`text-[10px] font-black ${si.temperature === 'ICE' ? 'text-toss-blue' : 'text-toss-red'}`}>{si.temperature}</span>}
                                      </div>
                                      {si.quantity && si.quantity > 1 && <span className="text-[13px] font-black text-toss-grey-400 tabular-nums">x{si.quantity}</span>}
                                    </div>
                                  ))}
                                </div>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-[13px] text-toss-grey-300 font-bold tracking-tight">주문 내역이 아직 없네요.</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <AnimatePresence>
            {showBottomShadow && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="px-7 py-6 bg-white border-t border-toss-grey-100 shrink-0 space-y-4 shadow-[0_-12px_40px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-2">
            <span className="text-[12px] font-black text-toss-grey-400 uppercase tracking-[0.15em] opacity-80">Final Order Count</span>
            <div className="flex items-baseline gap-1.5 bg-toss-grey-50 px-4 py-1.5 rounded-2xl border border-toss-grey-100 shadow-sm">
              <span className="text-[28px] font-black text-toss-grey-900 tabular-nums tracking-tighter">{totalItemCount}</span>
              <span className="text-[14px] font-black text-toss-grey-400 uppercase">개</span>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCopySummary}
              className="flex-1 h-16 bg-toss-blueLight text-toss-blue rounded-[24px] font-black text-[16px] flex items-center justify-center gap-2.5 transition-all border border-toss-blue/10 shadow-sm"
            >
              <Copy size={18} strokeWidth={2.5} /> 복사
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onSaveHistory(viewMode === 'all' ? allSummary : tableSummary, totalItemCount)}
              className="flex-[2] h-16 bg-toss-grey-900 text-white rounded-[24px] font-black text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-toss-grey-900/20 transition-all hover:bg-black"
            >
              <Save size={18} strokeWidth={2.5} /> 내역 저장하기
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
