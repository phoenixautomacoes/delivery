import React from 'react';
import {
  ShoppingBag,
  Bike,
  Clock,
  Settings,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { AppView, PortalType } from '../types/delivery';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onSwitchPortal?: (portal: PortalType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onSwitchPortal }) => {
  const {
    restaurant,
    cartItemCount,
    subtotal,
    setIsCartOpen,
    orderMode,
    setOrderMode,
    activeOrder,
  } = useDelivery();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Restaurant Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('cardapio')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
              🥩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight font-display">
                  {restaurant.name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Aberto
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Alta Gastronomia • Delivery & Retirada Expressa
              </p>
            </div>
          </button>
        </div>

        {/* Mode Selector (Entrega vs Retirada) */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => {
              setOrderMode('delivery');
              onNavigate('cardapio');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              orderMode === 'delivery'
                ? 'bg-white text-orange-700 shadow-xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Entrega</span>
          </button>

          <button
            onClick={() => {
              setOrderMode('retirada');
              onNavigate('cardapio');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              orderMode === 'retirada'
                ? 'bg-white text-orange-700 shadow-xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Retirada Balcão</span>
          </button>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Admin & Settings Access */}
          {onSwitchPortal && (
            <button
              onClick={() => onSwitchPortal('admin')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors shadow-2xs"
              title="Acessar Painel de Gestão e Configurações"
            >
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Painel / Config</span>
            </button>
          )}

          {/* Rastrear Entrega (if has active delivery) */}
          {activeOrder && activeOrder.mode === 'delivery' && (
            <button
              onClick={() => onNavigate('tracking')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              title="Acompanhar entrega em tempo real"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Rastrear Entrega</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-all"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-700 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cartItemCount === 0 ? 'Pedido' : formatCurrencyBRL(subtotal)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
