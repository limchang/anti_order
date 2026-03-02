
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CoupangAd } from './components/CoupangAd.tsx';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Menu, X, StickyNote, Smile, UtensilsCrossed, Pencil, Trash2, ChevronRight, ChevronLeft, Check, History, Bell, RefreshCw, LayoutGrid, RotateCcw, Pointer, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { OrderItem, OrderGroup, ItemType, AppSettings, OrderSubItem, OrderHistoryItem } from './types.ts';
import { OrderSummary } from './components/OrderSummary.tsx';
import { OrderGroupSection } from './components/OrderGroupSection.tsx';
import { MenuSelectionModal } from './components/MenuSelectionModal.tsx';
import { EmojiSettingsModal } from './components/EmojiSettingsModal.tsx';
import { QuickMemosModal } from './components/QuickMemosModal.tsx';
import { MenuManagementModal } from './components/MenuManagementModal.tsx';
import { HistoryModal } from './components/HistoryModal.tsx';
import { SettingsModal } from './components/SettingsModal';
import { AutoTutorial } from './components/AutoTutorial';
import { GuidePopup } from './components/GuidePopup.tsx';
import { UpdatePopup } from './components/UpdatePopup.tsx';
import { CATEGORY_EMOJIS } from './components/OrderCard';

const SETTINGS_STORAGE_KEY = 'cafesync_settings_v1';
const HISTORY_STORAGE_KEY = 'cafesync_history_v1';
const GROUPS_STORAGE_KEY = 'cafesync_groups_v1';
export const DEFAULT_EMOJIS = ["👨🏻", "👩🏻", "👶🏻", "👦🏻", "👧🏻", "🧓🏻", "👵🏻", "🐶", "😺", "🐯", "🐷", "◰", "◱", "◳", "◲"];

const createEmptyOrder = (): OrderItem => ({
  id: uuidv4(),
  avatar: '',
  subItems: [],
  memo: ''
});

function App() {
  const [drinkMenuItems, setDrinkMenuItems] = useState<string[]>(["미정", "아메리카노", "카페라떼", "카라멜마끼아또", "복숭아 아이스티"]);
  const [dessertMenuItems, setDessertMenuItems] = useState<string[]>(["케이크", "스콘", "크로와상", "마카롱"]);
  const [groups, setGroups] = useState<OrderGroup[]>([]);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isSharedSyncActive, setIsSharedSyncActive] = useState(false);
  const [isQuantitySyncActive, setIsQuantitySyncActive] = useState(true);

  const [lastGroupsSnapshot, setLastGroupsSnapshot] = useState<OrderGroup[] | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; id: string } | null>(null);

  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [manageStep, setManageStep] = useState<'menu' | 'rename' | 'delete' | 'reset'>('menu');
  const [tempName, setTempName] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [activeInputCount, setActiveInputCount] = useState(0);
  const isAnyInputActive = activeInputCount > 0;

  const [appSettings, setAppSettings] = useState<AppSettings>({
    showDrinkSize: false,
    showSharedMenu: false,
    quickMemos: ["연하게", "샷추가", "물 따로", "얼음물"],
    defaultEmojis: [...DEFAULT_EMOJIS],
    randomCategory: 'ANIMALS',
    checkedDrinkItems: ["아메리카노", "카페라떼", "카라멜마끼아또"],
    highlightOrderCard: true,
    showAds: true,
    showBottomAd: true,
  });

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [summaryState, setSummaryState] = useState<'collapsed' | 'expanded' | 'fullscreen'>('collapsed');
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isMenuMgmtModalOpen, setIsMenuMgmtModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isTutorialRunning, setIsTutorialRunning] = useState(false);

  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSharedGuide, setShowSharedGuide] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const APP_VERSION = '1.0.15';

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const isInternalScrolling = useRef(false);

  useEffect(() => {
    const hasEmpty = groups.some(g => g.items.length === 0);
    if (hasEmpty) {
      setGroups(prev => prev.filter(g => g.items.length > 0));
    }
    const hasFullTable = groups.some(g =>
      g.items.length >= 4 &&
      g.items.every(p => p.avatar && p.avatar !== '😋' && p.subItems.length > 0 && p.subItems.every(si => si.itemName !== '미정' && si.itemName !== '안 먹음'))
    );
    if (hasFullTable && !localStorage.getItem('cafesync_shared_guide_shown')) {
      setShowSharedGuide(true);
      localStorage.setItem('cafesync_shared_guide_shown', 'true');
    }
  }, [groups]);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('cafesync_last_seen_version');
    if (lastSeenVersion !== APP_VERSION) {
      setShowUpdatePopup(true);
    }
  }, []);

  const handleCloseUpdatePopup = () => {
    setShowUpdatePopup(false);
    localStorage.setItem('cafesync_last_seen_version', APP_VERSION);
  };

  const showToast = (message: string) => {
    const id = uuidv4();
    setToast({ message, id });
    setTimeout(() => {
      setToast(prev => prev?.id === id ? null : prev);
    }, 3000);
  };

  const showUndoToast = (message: string) => {
    const id = uuidv4();
    setUndoToast({ message, id });
    setTimeout(() => {
      setUndoToast(prev => prev?.id === id ? null : prev);
    }, 3000);
  };

  const [menuModalState, setMenuModalState] = useState<{
    isOpen: boolean;
    orderId: string | null;
    subItemId: string | null;
    initialSelections: OrderSubItem[];
    selectedItem: string;
    initialType?: ItemType;
  }>({
    isOpen: false,
    orderId: null,
    subItemId: null,
    initialSelections: [],
    selectedItem: '',
    initialType: 'DRINK'
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (isInternalScrolling.current) return;
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      let closestId: string | null = null;
      let minDistance = Infinity;
      groups.forEach(group => {
        const el = document.getElementById(`group-${group.id}`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          const elCenter = elRect.left + elRect.width / 2;
          const distance = Math.abs(centerX - elCenter);
          if (distance < minDistance) { minDistance = distance; closestId = group.id; }
        }
      });
      if (closestId && closestId !== activeGroupId) setActiveGroupId(closestId);
    };
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { isInternalScrolling.current = false; }, 150);
      handleScroll();
    };
    container.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => { container.removeEventListener('scroll', debouncedScroll); clearTimeout(scrollTimeout); };
  }, [groups, activeGroupId]);

  useEffect(() => {
    const navContainer = navContainerRef.current;
    if (navContainer && activeGroupId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const btn = document.getElementById(`nav-btn-${activeGroupId}`);
      if (btn) {
        isInternalScrolling.current = true;
        const scrollLeft = btn.offsetLeft - (navContainer.clientWidth / 2) + (btn.clientWidth / 2);
        navContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        setTimeout(() => { isInternalScrolling.current = false; }, 300);
      }
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (JSON.stringify(parsed.defaultEmojis) !== JSON.stringify(DEFAULT_EMOJIS)) {
            parsed.defaultEmojis = [...DEFAULT_EMOJIS];
          }
          setAppSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) { console.error(e); }
      }
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) { try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); } }
      const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (savedGroups) {
        try {
          const parsedGroups = JSON.parse(savedGroups);
          if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
            setGroups(parsedGroups);
            setActiveGroupId(parsedGroups[0].id);
          } else { addGroup(); }
        } catch (e) { console.error(e); addGroup(); }
      } else { addGroup(); }
    }
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => { if (window.navigator?.vibrate) { window.navigator.vibrate(10); } };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => { if (!isInitialMount.current) { localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups)); } }, [groups]);
  useEffect(() => { if (!isInitialMount.current) { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)); } }, [history]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const addGroup = () => {
    const newGroupId = uuidv4();
    const tableNums = groups.map(g => parseInt(g.name?.match(/\d+/)?.[0] || "0")).filter(n => n > 0);
    const nextNum = tableNums.length > 0 ? Math.max(...tableNums) + 1 : 1;
    let initialSharedSubItems: OrderSubItem[] = [];
    if (isSharedSyncActive && groups.length > 0) {
      const firstShared = groups[0].items.find(i => i.avatar === '😋');
      if (firstShared) initialSharedSubItems = JSON.parse(JSON.stringify(firstShared.subItems));
    }
    const initialItems = [...Array.from({ length: 4 }, createEmptyOrder), { id: uuidv4(), avatar: '😋', subItems: initialSharedSubItems }];
    setGroups(prev => [...prev, { id: newGroupId, name: `${nextNum}번 테이블`, items: initialItems }]);
    setTimeout(() => { setActiveGroupId(newGroupId); scrollToTable(newGroupId); }, 100);
  };

  const handleResetAllTables = () => {
    setIsMainMenuOpen(false);
    setLastGroupsSnapshot([...groups]);
    const newGroupId = uuidv4();
    const initialItems = [...Array.from({ length: 4 }, createEmptyOrder), { id: uuidv4(), avatar: '😋', subItems: [] }];
    setGroups([{ id: newGroupId, name: '1번 테이블', items: initialItems }]);
    setActiveGroupId(newGroupId);
    setIsSharedSyncActive(false);
    showUndoToast("모든 앱 데이터가 초기화되었습니다.");
  };

  const removeGroup = (id: string) => {
    setLastGroupsSnapshot([...groups]);
    const nextGroups = groups.filter(g => g.id !== id);
    if (nextGroups.length === 0) { setGroups([]); setActiveGroupId(null); }
    else if (activeGroupId === id) {
      const nextActive = nextGroups[0];
      if (nextActive) { setActiveGroupId(nextActive.id); setTimeout(() => scrollToTable(nextActive.id), 50); }
    }
    setGroups(nextGroups);
    closeManageSheet();
    showUndoToast("테이블이 삭제되었습니다.");
  };

  const updateGroupName = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const renameGroup = () => {
    if (!managingGroupId) return;
    const finalName = tempName.trim() || groups.find(g => g.id === managingGroupId)?.name || "새 테이블";
    setLastGroupsSnapshot([...groups]);
    updateGroupName(managingGroupId, finalName);
    closeManageSheet();
    showUndoToast("테이블 이름이 변경되었습니다.");
  };

  const resetGroup = (groupId: string) => {
    setLastGroupsSnapshot([...groups]);
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const initialItems = [...Array.from({ length: 4 }, createEmptyOrder), { id: uuidv4(), avatar: '😋', subItems: [] as OrderSubItem[] }];
      return { ...g, items: initialItems };
    }));
    closeManageSheet();
    showUndoToast("테이블이 초기화되었습니다.");
  };

  const handleUndoAction = () => {
    if (lastGroupsSnapshot) { setGroups(lastGroupsSnapshot); setLastGroupsSnapshot(null); setUndoToast(null); showToast("이전 상태로 복구되었습니다."); }
  };

  const closeManageSheet = () => { setManagingGroupId(null); setManageStep('menu'); setTempName(""); };
  const openManageSheet = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) { setTempName(""); setManagingGroupId(groupId); setManageStep('menu'); }
  };

  const scrollToTable = (groupId: string) => {
    const element = document.getElementById(`group-${groupId}`);
    const container = scrollContainerRef.current;
    if (element && container) {
      isInternalScrolling.current = true;
      const offsetLeft = element.offsetLeft - 32;
      container.scrollTo({ left: offsetLeft, behavior: 'smooth' });
      setTimeout(() => { isInternalScrolling.current = false; }, 500);
    }
  };

  const handleSaveOrder = (summaryText: string, totalCount: number, memo?: string) => {
    const tableFirstChars = groups.filter(g => g.items.some(p => p.subItems.length > 0)).map(g => g.name.trim().match(/\d+/)?.[0] || g.name.trim().charAt(0)).filter(Boolean);
    const generatedTitle = tableFirstChars.length > 0 ? tableFirstChars.join(', ') + "번 테이블" : "새 주문";
    const newHistoryItem: OrderHistoryItem = { id: uuidv4(), timestamp: Date.now(), groups: JSON.parse(JSON.stringify(groups)), totalCount: totalCount, summaryText: summaryText, memo: memo, title: generatedTitle };
    setHistory(prev => [newHistoryItem, ...prev]);
    setSummaryState('collapsed');
    showToast('주문 내역이 저장되었습니다.');
  };

  const handleCopySharedMenuToAll = (orderId: string) => {
    if (isSharedSyncActive) { setIsSharedSyncActive(false); showToast('공용 메뉴 동기화가 해제되었습니다.'); return; }
    const sourceGroup = groups.find(g => g.items.some(i => i.id === orderId));
    if (!sourceGroup) return;
    const sourceItem = sourceGroup.items.find(i => i.id === orderId);
    if (!sourceItem) return;
    const syncedSubItems = sourceItem.subItems.map(si => ({ ...si, isSynced: true }));
    setGroups(prev => prev.map(g => {
      if (g.id === sourceGroup.id) { return { ...g, items: g.items.map(i => i.id === orderId ? { ...i, subItems: syncedSubItems } : i) }; }
      return {
        ...g, items: g.items.map(i => {
          if (i.avatar === '😋') {
            const currentSubItems = [...i.subItems] as (OrderSubItem & { isSynced?: boolean })[];
            syncedSubItems.forEach(sourceSub => {
              const existingIdx = currentSubItems.findIndex(si => si.itemName === sourceSub.itemName);
              if (existingIdx > -1) { currentSubItems[existingIdx] = { ...currentSubItems[existingIdx], quantity: sourceSub.quantity, isSynced: true }; }
              else { currentSubItems.push(JSON.parse(JSON.stringify({ ...sourceSub, isSynced: true }))); }
            });
            return { ...i, subItems: currentSubItems };
          }
          return i;
        })
      };
    }));
    setIsSharedSyncActive(true);
    showToast('동기화 활성: 원본 메뉴가 모든 테이블에 추가되었습니다.');
  };

  const updateOrder = (id: string, updates: Partial<OrderItem>) => {
    setGroups(prev => {
      const targetItem = prev.flatMap(g => g.items).find(i => i.id === id);
      const isShared = targetItem?.avatar === '😋';
      if (isSharedSyncActive && isShared && updates.subItems) {
        const oldSubItems = (targetItem?.subItems || []) as (OrderSubItem & { isSynced?: boolean })[];
        const newSubItems = updates.subItems as (OrderSubItem & { isSynced?: boolean })[];
        if (newSubItems.length === 0) { return prev.map(g => ({ ...g, items: g.items.map(item => { if (item.avatar === '😋') { if (item.id === id) return { ...item, subItems: [] }; return { ...item, subItems: item.subItems.filter(si => !(si as any).isSynced) }; } return item; }) })); }
        return prev.map(g => ({
          ...g, items: g.items.map(item => {
            if (item.avatar === '😋') {
              if (item.id === id) return { ...item, ...updates };
              let mirroredSubItems = [...item.subItems] as (OrderSubItem & { isSynced?: boolean })[];
              mirroredSubItems = mirroredSubItems.map(si => {
                const matchInNew = newSubItems.find(n => n.itemName === si.itemName);
                if (matchInNew) return { ...si, quantity: isQuantitySyncActive ? matchInNew.quantity : si.quantity, isSynced: true };
                const existsInOld = oldSubItems.find(o => o.itemName === si.itemName);
                if (existsInOld && existsInOld.isSynced && !matchInNew) return null;
                return si;
              }).filter(Boolean) as any[];
              newSubItems.forEach(n => { if (!mirroredSubItems.some(si => si.itemName === n.itemName)) mirroredSubItems.push(JSON.parse(JSON.stringify({ ...n, isSynced: true }))); });
              return { ...item, subItems: mirroredSubItems };
            }
            return item;
          })
        }));
      }
      return prev.map(g => {
        const targetIdx = g.items.findIndex(item => item.id === id);
        if (targetIdx > -1) {
          const newItems = [...g.items];
          newItems[targetIdx] = { ...newItems[targetIdx], ...updates };
          if (updates.avatar === "🎲") { const emojis = CATEGORY_EMOJIS[appSettings.randomCategory] || CATEGORY_EMOJIS['ANIMALS']; newItems[targetIdx] = { ...newItems[targetIdx], avatar: emojis[Math.floor(Math.random() * emojis.length)] }; }
          return { ...g, items: newItems };
        }
        return g;
      });
    });
  };

  const handleSetNotEating = (personIds: string[]) => {
    setGroups(prev => prev.map(g => ({ ...g, items: g.items.map(p => { if (!personIds.includes(p.id)) return p; return { ...p, avatar: p.avatar || '👤', subItems: [{ id: uuidv4(), itemName: '안 먹음', type: 'DRINK', temperature: 'HOT', size: 'Tall', quantity: 1 }] }; }) })));
    showToast(`${personIds.length}명을 안 먹음 처리했습니다.`);
  };

  const handleRemoveUndecided = (personIds: string[]) => {
    setLastGroupsSnapshot(groups);
    setGroups(prev => prev.map(g => ({ ...g, items: g.items.filter(p => !personIds.includes(p.id)) })).filter(g => g.items.some(p => p.avatar && p.avatar !== '😋')));
    showUndoToast(`${personIds.length}명을 삭제했습니다.`);
  };

  const handleLoadPeopleOnly = (item: OrderHistoryItem) => {
    const cleanedGroups = item.groups.map(g => ({ ...g, items: g.items.map(p => ({ ...p, subItems: [], memo: "" })) }));
    setGroups(cleanedGroups);
    setActiveGroupId(cleanedGroups[0]?.id || null);
    showToast('인원 정보만 불러왔습니다.');
  };

  const currentManagingGroup = useMemo(() => groups.find(g => g.id === managingGroupId), [groups, managingGroupId]);
  const addMenuItemToState = (name: string, type: ItemType) => { if (type === 'DRINK') setDrinkMenuItems(prev => [...new Set([...prev, name])]); else if (type === 'DESSERT') setDessertMenuItems(prev => [...new Set([...prev, name])]); };
  const handleInputModeChange = (isActive: boolean) => { setActiveInputCount(prev => Math.max(0, isActive ? prev + 1 : prev - 1)); };
  const handleRemoveMenuItem = (name: string, type: ItemType) => { if (type === 'DRINK') { setDrinkMenuItems(prev => prev.filter(i => i !== name)); setAppSettings(prev => ({ ...prev, checkedDrinkItems: prev.checkedDrinkItems.filter(i => i !== name) })); } else { setDessertMenuItems(prev => prev.filter(i => i !== name)); } };
  const handleUpdateCheckedItems = (name: string, checked: boolean) => { setAppSettings(prev => { const newList = checked ? [...new Set([...prev.checkedDrinkItems, name])] : prev.checkedDrinkItems.filter(i => i !== name); const updated = { ...prev, checkedDrinkItems: newList }; localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated)); return updated; }); };

  const reversedGroups = useMemo(() => [...groups].reverse(), [groups]);
  const activeGroupIndex = reversedGroups.findIndex(g => g.id === activeGroupId);

  const collapsedBottomBarNode = (
    <div className="flex items-center w-full gap-2">
      <button onClick={() => setIsMainMenuOpen(true)} className="w-[44px] h-[44px] shrink-0 bg-white border border-toss-grey-100/80 rounded-xl flex items-center justify-center shadow-sm text-toss-grey-700 active:scale-95 transition-all"><Menu size={20} strokeWidth={2.5} /></button>
      <button data-tutorial="add-group" onClick={addGroup} className="w-[44px] h-[44px] shrink-0 bg-toss-blue/10 text-toss-blue border border-toss-blue/20 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><Plus size={20} strokeWidth={2.5} /></button>
      <div className="flex-1 relative overflow-hidden h-[44px]">
        <div ref={navContainerRef} className="w-full h-full overflow-x-auto no-scrollbar flex items-center justify-start gap-2 scroll-smooth pointer-events-auto">
          {reversedGroups.map(group => {
            const isActive = activeGroupId === group.id;
            const firstChar = group.name.trim().charAt(0) || '?';
            const hasUndecided = group.items.some(p => p.avatar && p.avatar !== '😋' && (p.subItems.length === 0 || p.subItems.every(si => si.itemName === '미정')));
            return (
              <div key={group.id} className="relative shrink-0 py-1">
                <motion.button id={`nav-btn-${group.id}`} whileTap={{ scale: 0.9 }} onClick={() => { if (activeGroupId === group.id) openManageSheet(group.id); else { setActiveGroupId(group.id); scrollToTable(group.id); } }} className={`min-w-[40px] h-10 px-3.5 flex items-center justify-center font-black text-[13px] transition-all relative whitespace-nowrap shadow-sm snap-center rounded-[14px] ${isActive ? 'bg-toss-blue text-white shadow-md' : 'bg-white border border-toss-grey-200 text-toss-grey-500 hover:bg-toss-grey-50'}`}>{firstChar}{hasUndecided && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-2xl shadow-sm animate-pulse" />}</motion.button>
              </div>
            );
          })}
          <div className="shrink-0 w-4 h-full" />
        </div>
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 bg-toss-bg text-toss-grey-900 flex flex-col relative overflow-x-hidden ${appSettings.showAds ? 'pt-8' : 'pt-0'}`}>
      {appSettings.showAds && (
        <div className="absolute top-0 w-full h-8 bg-toss-blue text-white flex items-center overflow-hidden z-20">
          <div className="w-full whitespace-nowrap animate-marquee flex items-center text-[13px] font-bold">쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수료를 제공받습니다.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        </div>
      )}
      <AnimatePresence>
        {isMainMenuOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMainMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]" />)}
      </AnimatePresence>
      <div className="fixed left-0 right-0 bottom-0 z-[2001] flex flex-col items-center justify-end pointer-events-none pb-5 px-3">
        <motion.div initial={false} animate={{ height: isMainMenuOpen ? 'auto' : 0, opacity: isMainMenuOpen ? 1 : 0 }} style={{ maxHeight: isMainMenuOpen ? 'calc(100dvh - 130px)' : 0 }} transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }} className="w-full max-w-lg bg-[#f8f9fb] rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.18)] border border-toss-grey-200/60 ring-1 ring-black/5 flex flex-col overflow-hidden pointer-events-auto mx-auto">
          <AnimatePresence>
            {isMainMenuOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col overflow-hidden">
                <div className="flex items-center px-4 pt-5 pb-3 bg-white rounded-t-[32px] border-b border-toss-grey-100 shrink-0 gap-2">
                  <div className="w-8 shrink-0" />
                  <h2 className="flex-1 text-center text-[20px] font-black text-toss-grey-900">전체 메뉴</h2>
                  <button onClick={() => setIsMainMenuOpen(false)} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-600 active:scale-95 transition-all"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto no-scrollbar px-5 py-5 space-y-4 custom-scrollbar">
                  <div>
                    <div className="p-1 mb-2"><span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">이용 가이드</span></div>
                    <div className="bg-white p-2 rounded-2xl space-y-1 border border-toss-blue/30 shadow-sm ring-2 ring-toss-blueLight overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-toss-blueLight rounded-bl-full -z-0 opacity-50" />
                      <button onClick={() => { setIsTutorialRunning(true); setIsMainMenuOpen(false); }} className="relative z-10 w-full flex items-center gap-4 px-4 py-3.5 text-[14px] font-black text-toss-blue hover:bg-toss-blueLight/50 rounded-2xl transition-colors active:scale-95"><Pointer size={18} className="text-toss-blue" /> 실전 시뮬레이션 둘러보기</button>
                    </div>
                  </div>
                  <div>
                    <div className="p-1 mb-2"><span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">주문 관리</span></div>
                    <div className="bg-white p-2 rounded-2xl space-y-1 border border-toss-grey-100 shadow-sm">
                      <button onClick={() => { setIsHistoryModalOpen(true); setIsMainMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-[14px] font-black text-toss-grey-800 hover:bg-toss-grey-50 rounded-2xl transition-colors active:scale-95"><History size={18} className="text-toss-grey-500" /> 저장된 주문 내역</button>
                      <button onClick={() => { setIsMenuMgmtModalOpen(true); setIsMainMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-[14px] font-black text-toss-grey-800 hover:bg-toss-grey-50 rounded-2xl transition-colors active:scale-95"><UtensilsCrossed size={18} className="text-toss-grey-500" /> 메뉴판</button>
                    </div>
                  </div>
                  <div>
                    <div className="p-1 mb-2"><span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">기능 설정</span></div>
                    <div className="bg-white p-2 rounded-2xl space-y-1 border border-toss-grey-100 shadow-sm">
                      <button onClick={() => { setIsEmojiModalOpen(true); setIsMainMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-[14px] font-black text-toss-grey-800 hover:bg-toss-grey-50 rounded-2xl transition-colors active:scale-95"><Smile size={18} className="text-toss-grey-500" /> 이모지 설정</button>
                      <button onClick={() => { setIsMemoModalOpen(true); setIsMainMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-[14px] font-black text-toss-grey-800 hover:bg-toss-grey-50 rounded-2xl transition-colors active:scale-95"><StickyNote size={18} className="text-toss-grey-500" /> 요청사항 관리</button>
                    </div>
                  </div>
                  <div>
                    <div className="p-1 mb-2"><span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">시스템</span></div>
                    <div className="bg-white p-2 rounded-2xl space-y-1 border border-toss-grey-100 shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-[14px] font-black text-toss-grey-800">사이즈 (S/T/G/V) 입력 표시</span>
                        <button onClick={() => handleUpdateSettings({ ...appSettings, showDrinkSize: !appSettings.showDrinkSize })} className={`w-11 h-6 rounded-full transition-all relative shadow-inner ${appSettings.showDrinkSize ? 'bg-toss-blue' : 'bg-toss-grey-300'}`}><div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${appSettings.showDrinkSize ? 'translate-x-[20px]' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5 border-t border-toss-grey-100">
                        <span className="text-[14px] font-black text-toss-grey-800">공용 메뉴 (다같이 쉐어) 추가</span>
                        <button onClick={() => handleUpdateSettings({ ...appSettings, showSharedMenu: !appSettings.showSharedMenu })} className={`w-11 h-6 rounded-full transition-all relative shadow-inner ${appSettings.showSharedMenu ? 'bg-toss-blue' : 'bg-toss-grey-300'}`}><div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${appSettings.showSharedMenu ? 'translate-x-[20px]' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5 border-t border-toss-grey-100">
                        <div><span className="text-[14px] font-black text-toss-grey-800">주문 상태 셀 강조 표시</span><p className="text-[11px] text-toss-grey-400 mt-0.5">고민중·주문완료·안먹음 배경색 변경</p></div>
                        <button onClick={() => handleUpdateSettings({ ...appSettings, highlightOrderCard: !appSettings.highlightOrderCard })} className={`w-11 h-6 rounded-full transition-all relative shadow-inner shrink-0 ml-3 ${appSettings.highlightOrderCard ? 'bg-toss-blue' : 'bg-toss-grey-300'}`}><div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${appSettings.highlightOrderCard ? 'translate-x-[20px]' : 'translate-x-0'}`} /></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="p-1 mt-4 mb-2"><span className="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">광고 설정</span></div>
                    <div className="bg-white p-2 rounded-2xl space-y-1 border border-toss-grey-100 shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-[14px] font-black text-toss-grey-800">메인 광고 활성화</span>
                        <button onClick={() => handleUpdateSettings({ ...appSettings, showAds: !appSettings.showAds })} className={`w-11 h-6 rounded-full transition-all relative shadow-inner ${appSettings.showAds ? 'bg-toss-blue' : 'bg-toss-grey-300'}`}><div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${appSettings.showAds ? 'translate-x-[20px]' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5 border-t border-toss-grey-100">
                        <span className="text-[14px] font-black text-toss-grey-800">하단 배너 광고 (광고2) 활성화</span>
                        <button onClick={() => handleUpdateSettings({ ...appSettings, showBottomAd: appSettings.showBottomAd === false ? true : false })} className={`w-11 h-6 rounded-full transition-all relative shadow-inner ${appSettings.showBottomAd !== false ? 'bg-toss-blue' : 'bg-toss-grey-300'}`}><div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${appSettings.showBottomAd !== false ? 'translate-x-[20px]' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5 border-t border-toss-grey-100">
                        <div><span className="text-[14px] font-black text-toss-grey-800">광고 클릭 보너스 초기화</span><p className="text-[11px] text-toss-grey-400 mt-0.5">1시간 혜택을 삭제하고 다시 메인 광고 띄우기</p></div>
                        <button onClick={() => { localStorage.removeItem('cafesync_ad_skip_until'); window.location.reload(); }} className="px-3.5 py-1.5 bg-toss-grey-100 text-toss-grey-600 rounded-lg text-[13px] font-black active:scale-95 transition-all outline-none flex items-center gap-1.5 shadow-sm border border-toss-grey-200 hover:bg-white"><RotateCcw size={14} strokeWidth={2.5} /> 초기화</button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { handleResetAllTables(); setIsMainMenuOpen(false); }} className="w-full h-16 bg-toss-grey-900 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-2.5 shadow-xl shadow-toss-grey-900/20 active:scale-[0.98] transition-all hover:bg-black"><RotateCcw size={18} strokeWidth={2.5} /> 모든 데이터 앱 전체 초기화</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <main className="flex-1 pt-4 pb-1 relative w-full overflow-hidden flex flex-col z-0">
        {groups.length > 0 ? (
          <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-[120px] no-scrollbar px-4 scroll-smooth flex-1 items-start content-start py-2 justify-start md:justify-center">
            {reversedGroups.map((group) => (
              <div key={group.id} id={`group-${group.id}`} className="snap-center shrink-0 w-[calc(100vw-32px)] sm:w-[340px]">
                <OrderGroupSection group={group} drinkMenuItems={drinkMenuItems} dessertMenuItems={dessertMenuItems} highlightedItemId={highlightedItemId} updateOrder={updateOrder} removeOrder={(id) => setGroups(prev => prev.map(g => ({ ...g, items: g.items.filter(item => item.id !== id) })).filter(g => g.items.length > 0))} addOrderItem={(gid) => setGroups(prev => prev.map(g => g.id === gid ? { ...g, items: [...g.items, createEmptyOrder()] } : g))} addSharedMenuItem={(gid) => setGroups(prev => prev.map(g => g.id === gid ? { ...g, items: [...g.items, { id: uuidv4(), avatar: '😋', subItems: [] }] } : g))} onAddMenuItem={addMenuItemToState} onRemoveMenuItem={() => { }} onOpenMenuModal={(oid, ci, sid, it) => setMenuModalState({ isOpen: true, orderId: oid, subItemId: sid || null, initialSelections: groups.flatMap(g => g.items).find(i => i.id === oid)?.subItems || [], selectedItem: ci, initialType: it })} onCopyGroupItemToAll={handleCopySharedMenuToAll} onDeleteGroupItemFromAll={() => { }} appSettings={{ ...appSettings, isSharedSyncActive, isQuantitySyncActive, onToggleQuantitySync: () => setIsQuantitySyncActive(p => !p) }} onRemoveGroup={() => openManageSheet(group.id)} onOpenSettings={() => openManageSheet(group.id)} onInputModeChange={handleInputModeChange} onUpdateCheckedItems={handleUpdateCheckedItems} appVersion={APP_VERSION} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-8 animate-in fade-in duration-500 w-full flex-1">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-toss-card mb-6 border border-toss-grey-100"><LayoutGrid size={40} className="text-toss-grey-200" /></div>
            <h2 className="text-xl font-black text-toss-grey-800 mb-3">간단하고 빠른 주문 수집!</h2>
          </div>
        )}
        <GuidePopup isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} onConfirm={() => { handleUpdateSettings({ ...appSettings, showDrinkSize: true }); setShowSizeGuide(false); showToast('사이즈 설정 옵션이 켜졌습니다.'); }} title="사이즈 설정이 필요하신가요?" message="메뉴마다 'Tall, Grande, Venti' 같은 사이즈를 입력할 수 있는 옵션을 켤까요?" />
        <GuidePopup isOpen={showSharedGuide} onClose={() => setShowSharedGuide(false)} onConfirm={() => { handleUpdateSettings({ ...appSettings, showSharedMenu: true }); setShowSharedGuide(false); showToast('공용 메뉴 추가가 켜졌습니다.'); }} title="함께 먹는 메뉴도 있나요?" message="테이블 인원이 가득 찼네요! 다함께 쉐어하는 공용 메뉴를 추가할 수 있는 옵션을 켤까요?" />
      </main>

      <AnimatePresence>
        {managingGroupId && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeManageSheet} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2002]" />)}
      </AnimatePresence>
      <div className="fixed left-0 right-0 bottom-0 z-[2003] flex flex-col items-center justify-end pointer-events-none pb-5 px-3">
        <motion.div initial={false} animate={{ height: managingGroupId ? 'auto' : 0, opacity: managingGroupId ? 1 : 0 }} style={{ maxHeight: managingGroupId ? 'calc(100dvh - 130px)' : 0 }} transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }} className="w-full max-w-lg bg-[#f8f9fb] rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.18)] border border-toss-grey-200/60 ring-1 ring-black/5 flex flex-col overflow-hidden pointer-events-auto mx-auto">
          <AnimatePresence>
            {managingGroupId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col overflow-hidden">
                <div className="flex items-center px-4 pt-5 pb-3 bg-white rounded-t-[32px] border-b border-toss-grey-100 shrink-0 gap-2">
                  <div className="w-8 shrink-0" />
                  <h2 className="flex-1 text-center text-[20px] font-black text-toss-grey-900">{currentManagingGroup?.name} 관리</h2>
                  <button onClick={closeManageSheet} className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-toss-grey-600 active:scale-95 transition-all"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <AnimatePresence mode="wait">
                    {manageStep === 'menu' && (
                      <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                        <button onClick={() => setManageStep('rename')} className="w-full bg-white border border-toss-grey-100 p-4 rounded-xl flex items-center justify-between active:scale-[0.97] transition-all shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-toss-grey-50 flex items-center justify-center text-toss-grey-600 shadow-sm"><Pencil size={18} /></div><span className="font-black text-toss-grey-800 text-[15px]">이름 변경하기</span></div><ChevronRight size={18} className="text-toss-grey-300" /></button>
                        <button onClick={() => setManageStep('reset')} className="w-full bg-white border border-toss-grey-100 p-4 rounded-xl flex items-center justify-between active:scale-[0.97] transition-all shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-toss-grey-50 flex items-center justify-center text-toss-grey-600 shadow-sm"><RotateCcw size={18} /></div><span className="font-black text-toss-grey-800 text-[15px]">테이블 초기화하기</span></div><ChevronRight size={18} className="text-toss-grey-300" /></button>
                        <button onClick={() => setManageStep('delete')} className="w-full bg-toss-redLight border border-toss-red/10 p-4 rounded-xl flex items-center justify-between active:scale-[0.97] transition-all"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-toss-red shadow-sm"><Trash2 size={18} /></div><span className="font-black text-toss-red text-[15px]">테이블 삭제하기</span></div><ChevronRight size={18} className="text-toss-red/30" /></button>
                      </motion.div>
                    )}
                    {manageStep === 'rename' && (
                      <motion.div key="rename" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <input ref={renameInputRef} autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder={currentManagingGroup?.name} onKeyDown={(e) => e.key === 'Enter' && renameGroup()} className="w-full bg-toss-grey-50 border border-toss-grey-100 rounded-2xl px-4 py-3.5 text-[14px] font-black text-toss-grey-900" />
                        <div className="flex gap-2"><button onClick={() => setManageStep('menu')} className="flex-1 py-3.5 rounded-2xl font-black text-toss-grey-500 bg-toss-grey-100 text-[13px]">뒤로</button><button onClick={renameGroup} className="flex-[2] py-3.5 rounded-2xl font-black text-white bg-toss-blue text-[13px]">저장</button></div>
                      </motion.div>
                    )}
                    {manageStep === 'reset' && (
                      <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                        <div className="text-center mb-4"><h3 className="text-[18px] font-black text-toss-grey-800">이 테이블의 모든 주문을 비울까요?</h3></div>
                        <button onClick={() => resetGroup(currentManagingGroup!.id)} className="w-full py-4 bg-toss-blue text-white rounded-xl font-black active:scale-95 transition-all">네, 비우겠습니다</button>
                        <button onClick={() => setManageStep('menu')} className="w-full h-14 bg-toss-grey-800 text-white rounded-xl font-black">취소</button>
                      </motion.div>
                    )}
                    {manageStep === 'delete' && (
                      <motion.div key="delete" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                        <div className="text-center mb-4"><h3 className="text-[18px] font-black text-toss-red">정말 삭제할까요?</h3></div>
                        <button onClick={() => removeGroup(currentManagingGroup!.id)} className="w-full py-4 bg-toss-red text-white rounded-xl font-black active:scale-95 transition-all">네, 삭제하겠습니다</button>
                        <button onClick={() => setManageStep('menu')} className="w-full h-14 bg-toss-grey-800 text-white rounded-xl font-black">취소</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {!isAnyInputActive && !isMainMenuOpen && !managingGroupId && (
          <OrderSummary collapsedBottomBarNode={collapsedBottomBarNode} groups={groups} onSaveHistory={handleSaveOrder} onJumpToOrder={(gid, pid) => { scrollToTable(gid); setHighlightedItemId(pid); setSummaryState('collapsed'); setTimeout(() => setHighlightedItemId(null), 2000); }} onUpdateGroupName={updateGroupName} onSetNotEating={handleSetNotEating} onRemoveUndecided={handleRemoveUndecided} onRemoveOrder={(id) => setGroups(prev => prev.map(g => ({ ...g, items: g.items.filter(item => item.id !== id) })).filter(g => g.items.length > 0))} appSettings={appSettings} expandState={summaryState} onSetExpandState={setSummaryState} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isAnyInputActive && !isMainMenuOpen && !managingGroupId && appSettings.showBottomAd !== false && summaryState === 'collapsed' && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="fixed left-0 right-0 bottom-[104px] z-[2000] flex justify-center pointer-events-none px-3">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-toss-grey-200 p-0.5 pointer-events-auto flex items-center justify-center overflow-hidden h-[54px] transform-gpu">
              <iframe src="https://ads-partners.coupang.com/widgets.html?id=968136&template=carousel&trackingCode=AF9552419&subId=&width=320&height=50&tsource=" width="100%" height="50" frameBorder="0" scrolling="no" referrerPolicy="unsafe-url" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} onBack={() => { setIsHistoryModalOpen(false); setIsMainMenuOpen(true); }} history={history} onLoad={(item) => { setGroups(item.groups); setActiveGroupId(item.groups[0]?.id); }} onLoadPeopleOnly={handleLoadPeopleOnly} onDelete={(id) => setHistory(prev => prev.filter(h => h.id !== id))} onUpdate={(id, updates) => setHistory(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))} />
      <MenuManagementModal isOpen={isMenuMgmtModalOpen} onClose={() => setIsMenuMgmtModalOpen(false)} onBack={() => { setIsMenuMgmtModalOpen(false); setIsMainMenuOpen(true); }} drinkItems={drinkMenuItems} dessertItems={dessertMenuItems} checkedDrinkItems={appSettings.checkedDrinkItems} onAdd={addMenuItemToState} onRemove={handleRemoveMenuItem} onUpdateChecked={handleUpdateCheckedItems} onUpdateMenuList={(l, t) => t === 'DRINK' ? setDrinkMenuItems(l) : setDessertMenuItems(l)} />
      {isTutorialRunning && <AutoTutorial onComplete={() => setIsTutorialRunning(false)} />}
      <EmojiSettingsModal isOpen={isEmojiModalOpen} onClose={() => setIsEmojiModalOpen(false)} onBack={() => { setIsEmojiModalOpen(false); setIsMainMenuOpen(true); }} settings={appSettings} onUpdateSettings={handleUpdateSettings} />
      <QuickMemosModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} onBack={() => { setIsMemoModalOpen(false); setIsMainMenuOpen(true); }} settings={appSettings} onUpdateSettings={handleUpdateSettings} />
      <MenuSelectionModal isOpen={menuModalState.isOpen} onClose={() => setMenuModalState(prev => ({ ...prev, isOpen: false }))} title="메뉴 선택" drinkItems={drinkMenuItems} dessertItems={dessertMenuItems} checkedDrinkItems={appSettings.checkedDrinkItems} initialSelections={menuModalState.initialSelections} selectedItem={menuModalState.selectedItem} initialType={menuModalState.initialType} onAdd={addMenuItemToState} onFirstSelect={() => { if (!localStorage.getItem('cafesync_size_guide_shown')) { setShowSizeGuide(true); localStorage.setItem('cafesync_size_guide_shown', 'true'); } }} onSelect={(s) => { const { orderId, subItemId } = menuModalState; if (!orderId) return; setGroups(prev => prev.map(g => ({ ...g, items: g.items.map(p => { if (p.id !== orderId) return p; if (subItemId) return { ...p, subItems: p.subItems.map(si => si.id === subItemId ? { ...si, itemName: s[0].itemName, type: s[0].type, size: s[0].size || si.size || 'Tall' } : si) }; const newItems: OrderSubItem[] = s.map(sel => { const isIceDefault = sel.itemName.includes('스무디') || sel.itemName.includes('아이스'); return { id: uuidv4(), itemName: sel.itemName, type: sel.type, temperature: isIceDefault ? 'ICE' : 'HOT', size: sel.size || 'Tall', quantity: 1 }; }); return { ...p, subItems: [...p.subItems, ...newItems] }; }) }))); setMenuModalState(prev => ({ ...prev, isOpen: false })); }} onDeleteSelection={() => { const { orderId, subItemId } = menuModalState; if (!orderId || !subItemId) return; setGroups(prev => prev.map(g => ({ ...g, items: g.items.map(p => { if (p.id !== orderId) return p; return { ...p, subItems: p.subItems.filter(si => si.id !== subItemId) }; }) }))); setMenuModalState(prev => ({ ...prev, isOpen: false })); }} onRemove={handleRemoveMenuItem} onUpdateChecked={handleUpdateCheckedItems} onUpdateMenuList={(l, t) => t === 'DRINK' ? setDrinkMenuItems(l) : setDessertMenuItems(l)} appSettings={appSettings} />

      <AnimatePresence>
        {undoToast && (<div className="fixed bottom-28 w-full flex justify-center z-[10000] pointer-events-none px-4"><motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} onClick={handleUndoAction} className="bg-toss-grey-900 text-white px-5 py-2.5 rounded-full shadow-toss-elevated flex items-center justify-center gap-2 text-[13px] font-black pointer-events-auto active:scale-95 border border-white/10"><RotateCcw size={14} strokeWidth={3} /> 되돌리기</motion.button></div>)}
        {toast && !undoToast && (<div className="fixed bottom-28 w-full flex justify-center z-[10000] pointer-events-none px-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="bg-toss-grey-900 text-white px-6 py-3.5 rounded-2xl shadow-toss-elevated flex items-center gap-3 min-w-[220px]"><div className="w-8 h-8 rounded-full bg-toss-blue flex items-center justify-center shrink-0"><Bell size={16} fill="white" /></div><span className="text-[13px] font-black tracking-tight">{toast.message}</span></motion.div></div>)}
      </AnimatePresence>

      <UpdatePopup isOpen={showUpdatePopup} onClose={handleCloseUpdatePopup} version={APP_VERSION} />
    </div>
  );
}

export default App;
