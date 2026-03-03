
import React, { useMemo } from 'react';
import { Plus, Settings, LayoutGrid, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderGroup, OrderItem, ItemType, AppSettings } from '../types.ts';
import { OrderCard } from './OrderCard.tsx';
import { CATEGORY_EMOJIS } from './OrderCard.tsx';
import { v4 as uuidv4 } from 'uuid';

interface OrderGroupSectionProps {
  group: OrderGroup;
  drinkMenuItems: string[];
  dessertMenuItems: string[];
  highlightedItemId: string | null;
  updateOrder: (id: string, updates: Partial<OrderItem>) => void;
  removeOrder: (id: string) => void;
  addOrderItem: (id: string) => void;
  addSharedMenuItem: (id: string) => void;
  onAddMenuItem: (name: string, type: ItemType) => void;
  onRemoveMenuItem: (name: string, type: ItemType) => void;
  onOpenMenuModal: (orderId: string, currentItem: string, subItemId?: string | null, type?: ItemType) => void;
  onCopyGroupItemToAll: (orderId: string) => void;
  onDeleteGroupItemFromAll: (orderId: string) => void;
  appSettings: AppSettings & { isSharedSyncActive?: boolean };
  onRemoveGroup: () => void;
  onOpenSettings: () => void;
  onInputModeChange?: (isActive: boolean) => void;
  onUpdateCheckedItems?: (name: string, checked: boolean) => void;
  onMenuFirstSelected?: () => void;
  onOpenMenuMgmt: () => void;
  appVersion?: string;
  onVersionTap?: () => void;
}

const TABLE_EMOJIS = ['◰', '◱', '◳', '◲'];

export const OrderGroupSection: React.FC<OrderGroupSectionProps> = ({
  group,
  drinkMenuItems,
  dessertMenuItems,
  highlightedItemId,
  updateOrder,
  removeOrder,
  addOrderItem,
  addSharedMenuItem,
  onAddMenuItem,
  onRemoveMenuItem,
  onOpenMenuModal,
  onCopyGroupItemToAll,
  onDeleteGroupItemFromAll,
  appSettings,
  onOpenSettings,
  onInputModeChange,
  onUpdateCheckedItems,
  onMenuFirstSelected,
  onOpenMenuMgmt,
  appVersion,
  onVersionTap
}) => {
  const individualItems = useMemo(() => group.items.filter(item => item.avatar !== '😋'), [group.items]);
  const sharedItem = useMemo(() => group.items.find(item => item.avatar === '😋'), [group.items]);
  const isOdd = individualItems.length % 2 !== 0;

  const handleAllRandom = () => {
    const emojis = CATEGORY_EMOJIS[appSettings.randomCategory] || CATEGORY_EMOJIS['ANIMALS'];
    individualItems.forEach(item => {
      updateOrder(item.id, { avatar: emojis[Math.floor(Math.random() * emojis.length)] });
    });
  };

  const handleTablePositionEmojis = () => {
    individualItems.forEach((item, idx) => {
      const emoji = TABLE_EMOJIS[idx % TABLE_EMOJIS.length];
      updateOrder(item.id, { avatar: emoji });
    });
  };

  const handleAllAmericano = () => {
    const emojis = CATEGORY_EMOJIS[appSettings.randomCategory] || CATEGORY_EMOJIS['ANIMALS'];
    individualItems.forEach(item => {
      const avatar = item.avatar || emojis[Math.floor(Math.random() * emojis.length)];
      updateOrder(item.id, {
        avatar,
        subItems: [{
          id: uuidv4(),
          type: 'DRINK',
          itemName: '아메리카노',
          temperature: 'HOT',
          size: 'Tall',
          quantity: 1
        }]
      });
    });
  };

  const quickActions = [
    {
      label: '랜덤 이모지',
      icon: '🎲',
      onClick: handleAllRandom,
      title: '모든 인원 랜덤 이모지 선택',
      textColor: 'text-violet-700',
    },
    {
      label: '메뉴판',
      icon: <UtensilsCrossed size={16} strokeWidth={2.5} />,
      onClick: onOpenMenuMgmt,
      title: '메뉴판 관리 (추가/삭제)',
      textColor: 'text-sky-700',
    },
    {
      label: '모두 아메리카노',
      icon: '☕',
      onClick: handleAllAmericano,
      title: '모든 인원에게 랜덤 이모지 적용 후 아메리카노 설정',
      textColor: 'text-amber-700',
    },
    {
      label: '테이블 설정',
      icon: null,
      onClick: onOpenSettings,
      title: '테이블 이름 변경 및 삭제',
      textColor: 'text-toss-grey-500',
      isSettings: true,
    },
  ];

  return (
    <section className="relative bg-white rounded-2xl border p-2 flex flex-col gap-2 z-0 border-toss-grey-100 shadow-toss-card overflow-visible">
      {/* 퀵 액션 - 세그먼트 탭바 스타일 */}
      <div className="flex items-stretch bg-white rounded-xl border border-toss-grey-200 overflow-hidden shadow-sm">
        {quickActions.map((action, index) => (
          <button
            key={action.label}
            data-tutorial={
              action.label === '모두 아메리카노' ? 'quick-all' :
                action.label === '랜덤 이모지' ? 'quick-random' : undefined
            }
            onClick={(e) => {
              if (navigator.vibrate) navigator.vibrate(50);
              action.onClick();
            }}
            title={action.title}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-toss-grey-50 active:bg-toss-grey-100 transition-all
              ${index < quickActions.length - 1 ? 'border-r border-toss-grey-200' : ''}`}
          >
            <span className="text-[17px] leading-none">
              {action.isSettings
                ? <Settings size={17} strokeWidth={2} className={action.textColor} />
                : <span className="drop-shadow-sm">{action.icon}</span>}
            </span>
            <span className={`text-[11px] font-black ${action.textColor} whitespace-nowrap tracking-tight leading-none`}>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 overflow-visible">
        <div className="grid gap-2 grid-cols-2 items-stretch justify-items-stretch relative overflow-visible">
          <AnimatePresence mode="popLayout">
            {individualItems.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative overflow-visible"
              >
                {/* 카드 뒤 회색 배경 - 높이 차이만큼 아래 노출됨 (나중에 디자인 요소 추가 예정) */}
                <div className="absolute inset-0 rounded-2xl bg-toss-grey-100" style={{ zIndex: 0 }} />
                <div className="relative" style={{ zIndex: 1 }}>
                  <OrderCard
                    order={order}
                    drinkItems={drinkMenuItems}
                    dessertMenuItems={dessertMenuItems}
                    onAddMenuItem={onAddMenuItem}
                    onRemoveMenuItem={onRemoveMenuItem}
                    onUpdate={updateOrder}
                    onRemove={removeOrder}
                    highlighted={order.id === highlightedItemId}
                    onOpenMenuModal={onOpenMenuModal}
                    onCopyGroupItemToAll={onCopyGroupItemToAll}
                    onDeleteGroupItemFromAll={onDeleteGroupItemFromAll}
                    appSettings={appSettings}
                    onInputModeChange={onInputModeChange}
                    onUpdateCheckedItems={onUpdateCheckedItems}
                    onMenuFirstSelected={onMenuFirstSelected}
                  />
                </div>
              </motion.div>
            ))}
            {isOdd && (
              <motion.button layout onClick={() => addOrderItem(group.id)} className="border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-xl flex flex-col items-center justify-center gap-0.5 min-h-[110px] hover:bg-toss-grey-100 hover:border-toss-blue/30 active:scale-95 transition-all">
                <Plus size={16} strokeWidth={3} /><span className="text-[10px] font-black uppercase">추가</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {!isOdd && (
          <button onClick={() => addOrderItem(group.id)} className="w-full h-9 border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-xl flex items-center justify-center gap-1 hover:bg-toss-grey-100 active:scale-[0.98] transition-all shrink-0">
            <Plus size={14} strokeWidth={3} /><span className="text-[11px] font-black uppercase tracking-tighter">추가</span>
          </button>
        )}

        {appSettings.showSharedMenu && (
          <div className="pt-2 border-t-2 border-dashed border-toss-grey-100 overflow-visible">
            <div className="flex flex-col gap-1.5 overflow-visible">
              {sharedItem ? (
                <OrderCard
                  order={sharedItem}
                  drinkItems={drinkMenuItems}
                  dessertMenuItems={dessertMenuItems}
                  onAddMenuItem={onAddMenuItem}
                  onRemoveMenuItem={onRemoveMenuItem}
                  onUpdate={updateOrder}
                  onRemove={removeOrder}
                  highlighted={sharedItem.id === highlightedItemId}
                  onOpenMenuModal={onOpenMenuModal}
                  onCopyGroupItemToAll={onCopyGroupItemToAll}
                  onDeleteGroupItemFromAll={onDeleteGroupItemFromAll}
                  appSettings={appSettings}
                  onInputModeChange={onInputModeChange}
                  onUpdateCheckedItems={onUpdateCheckedItems}
                />
              ) : (
                <button onClick={() => addSharedMenuItem(group.id)} className="w-full h-9 border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-xl flex items-center justify-center gap-1 hover:bg-toss-grey-100 active:scale-95 transition-all">
                  <Plus size={14} strokeWidth={3} /><span className="text-[11px] font-black uppercase">공용 메뉴 추가</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {appVersion && (
        <div onClick={onVersionTap} className="pt-2 pb-1 flex flex-col items-center gap-0.5 opacity-30 mt-1 cursor-pointer">
          <span className="text-[9px] font-bold text-toss-grey-400">Version {appVersion}</span>
          <span className="text-[9px] font-bold text-toss-grey-400">Last Updated: 2026-03-03 16:11</span>
        </div>
      )}
    </section>
  );
};
