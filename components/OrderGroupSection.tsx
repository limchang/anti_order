
import React, { useMemo } from 'react';
import { Plus, Settings } from 'lucide-react';
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
  onUpdateCheckedItems
}) => {
  const individualItems = useMemo(() => group.items.filter(item => item.avatar !== '😋'), [group.items]);
  const sharedItem = useMemo(() => group.items.find(item => item.avatar === '😋'), [group.items]);
  const isOdd = individualItems.length % 2 !== 0;

  // 이모지 랜덤
  const handleAllRandom = () => {
    const emojis = CATEGORY_EMOJIS[appSettings.randomCategory] || CATEGORY_EMOJIS['ANIMALS'];
    individualItems.forEach(item => {
      updateOrder(item.id, { avatar: emojis[Math.floor(Math.random() * emojis.length)] });
    });
  };

  // 자리 위치 이모지 (◰◱◳◲)
  const handleTablePositionEmojis = () => {
    individualItems.forEach((item, idx) => {
      const emoji = TABLE_EMOJIS[idx % TABLE_EMOJIS.length];
      updateOrder(item.id, { avatar: emoji });
    });
  };

  // 모두 아메리카노 - 이모지 없으면 랜덤 적용 후 아메리카노 설정
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
      label: '이모지 랜덤',
      icon: '🎲',
      onClick: handleAllRandom,
      title: '모든 인원 랜덤 이모지 선택',
      chipBg: 'bg-violet-50',
      chipBorder: 'border-violet-200',
      textColor: 'text-violet-800',
    },
    {
      label: '자리 이모지',
      icon: '📍',
      onClick: handleTablePositionEmojis,
      title: '자리 위치 이모지로 지정 (◰◱◳◲)',
      chipBg: 'bg-sky-50',
      chipBorder: 'border-sky-200',
      textColor: 'text-sky-800',
    },
    {
      label: '모두 아메리카노',
      icon: '☕',
      onClick: handleAllAmericano,
      title: '모든 인원에게 랜덤 이모지 적용 후 아메리카노 설정',
      chipBg: 'bg-amber-50',
      chipBorder: 'border-amber-200',
      textColor: 'text-amber-800',
    },
    {
      label: '테이블 설정',
      icon: null,
      onClick: onOpenSettings,
      title: '테이블 이름 변경 및 삭제',
      chipBg: 'bg-toss-grey-50',
      chipBorder: 'border-toss-grey-200',
      textColor: 'text-toss-grey-600',
      isSettings: true,
    },
  ];

  return (
    <section className="relative bg-white rounded-[24px] border p-2 flex flex-col gap-2 z-0 border-toss-grey-100 shadow-toss-card overflow-visible">
      {/* 퀵 액션 - Material Design Chip 스타일 */}
      <div className="flex items-center gap-1.5 px-0.5 pt-0.5 pb-2.5 border-b border-toss-grey-100 overflow-x-auto no-scrollbar">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            title={action.title}
            className={`flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full border shrink-0 ${action.chipBg} ${action.chipBorder} active:scale-95 transition-all shadow-sm hover:brightness-95`}
          >
            <span className="text-[15px] leading-none">
              {action.isSettings
                ? <Settings size={14} strokeWidth={2.5} className={action.textColor} />
                : action.icon}
            </span>
            <span className={`text-[11.5px] font-bold ${action.textColor} whitespace-nowrap tracking-tight`}>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 overflow-visible">
        <div className="grid gap-2 grid-cols-2 items-stretch justify-items-stretch relative overflow-visible">
          <AnimatePresence mode="popLayout">
            {individualItems.map((order) => (
              <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative overflow-visible">
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
                />
              </motion.div>
            ))}
            {isOdd && (
              <motion.button layout onClick={() => addOrderItem(group.id)} className="border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-[20px] flex flex-col items-center justify-center gap-0.5 min-h-[110px] hover:bg-toss-grey-100 hover:border-toss-blue/30 active:scale-95 transition-all">
                <Plus size={16} strokeWidth={3} /><span className="text-[10px] font-black uppercase">추가</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {!isOdd && (
          <button onClick={() => addOrderItem(group.id)} className="w-full h-10 border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-[14px] flex items-center justify-center gap-1 hover:bg-toss-grey-100 active:scale-[0.98] transition-all shrink-0">
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
                <button onClick={() => addSharedMenuItem(group.id)} className="w-full h-10 border-2 border-dashed border-toss-grey-200 bg-toss-grey-50 text-toss-grey-400 rounded-[14px] flex items-center justify-center gap-1 hover:bg-toss-grey-100 active:scale-95 transition-all">
                  <Plus size={14} strokeWidth={3} /><span className="text-[11px] font-black uppercase">공용 메뉴 추가</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section >
  );
};
