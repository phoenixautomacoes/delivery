import React from 'react';
import { ShoppingBag, ChefHat, Clock, Compass } from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';

export const MobileBottomBar: React.FC = () => {
  const {
    cartItemCount,
    subtotal,
    setIsCartOpen,
    setIsKdsOpen,
    activeOrder,
    setActiveTrackingOrderId,
    setActiveMerchant,
    activeMerchant,
  } = useDelivery();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-2 sm:hidden flex items-center justify-between gap-2 max-h-[64px] shadow-lg">
      {/* Home / Explorer button */}
      <button
        onClick={() => setActiveMerchant(null)}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
          !activeMerchant ? 'text-amber-700 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Início</span>
      </button>

      {/* KDS Admin button */}
      <button
        onClick={() => setIsKdsOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-3 text-stone-500 hover:text-stone-900 rounded-xl transition-colors"
      >
        <ChefHat className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">KDS</span>
      </button>

      {/* Active order badge if exists */}
      {activeOrder && (
        <button
          onClick={() => setActiveTrackingOrderId(activeOrder.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
          <span>#{activeOrder.code}</span>
        </button>
      )}

      {/* Cart button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex-1 max-w-[170px] py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-between active:scale-95 transition-all"
      >
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="tabular-nums font-mono">{cartItemCount}</span>
        </div>
        <span className="tabular-nums font-mono text-[11px]">
          {formatCurrencyBRL(subtotal)}
        </span>
      </button>
    </div>
  );
};
