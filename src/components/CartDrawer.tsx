import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartMerchant,
    orderMode,
    setOrderMode,
    selectedTableNumber,
    setSelectedTableNumber,
    tables,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    selectedNeighborhood,
  } = useDelivery();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col text-stone-900">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-stone-950">Sua Sacola</h3>
                {cartMerchant && (
                  <p className="text-xs text-stone-600 truncate max-w-[200px]">
                    {cartMerchant.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-stone-500 hover:text-red-600 transition-colors p-1 font-semibold"
                  title="Esvaziar Sacola"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector (Segmented control) */}
          <div className="p-3 bg-stone-50 border-b border-stone-200">
            <div className="grid grid-cols-2 gap-1 bg-stone-200/70 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setOrderMode('delivery')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderMode === 'delivery'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                🛵 Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('retirada')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderMode === 'retirada'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                🛍️ Retirada
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7 text-stone-400" />
                </div>
                <h4 className="text-base font-bold text-stone-800 mb-1">Sua sacola está vazia</h4>
                <p className="text-xs text-stone-500 max-w-xs mb-4">
                  Escolha pratos, lanches ou bebidas do cardápio para adicionar ao seu pedido.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl transition-colors"
                >
                  Explorar Cardápio
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-stone-950 leading-snug">
                        {item.product.name}
                      </h4>
                      <span className="text-xs font-bold text-amber-800 tabular-nums">
                        {formatCurrencyBRL(item.totalPrice)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Addons selected */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="text-xs text-stone-600 space-y-0.5 border-l-2 border-stone-300 pl-2">
                      {item.selectedAddons.map((addon) => (
                        <div key={addon.optionId} className="flex justify-between">
                          <span>{addon.optionName}</span>
                          {addon.price > 0 && (
                            <span className="text-stone-400 tabular-nums">
                              +{formatCurrencyBRL(addon.price)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-[11px] text-stone-600 italic bg-white p-1.5 rounded-lg border border-stone-200">
                      Obs: {item.notes}
                    </p>
                  )}

                  {/* Stepper */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-stone-500 font-medium">Quantidade:</span>
                    <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-xl flex-1 shadow-2xs">
                    <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Cupom (ex: BEMVINDO)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="bg-transparent text-xs text-stone-900 placeholder-stone-400 focus:outline-none w-full uppercase font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    Aplicar
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{appliedCoupon.code} aplicado</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-stone-500 hover:text-stone-900 underline text-[11px]"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {couponFeedback && !couponFeedback.success && (
                  <p className="text-[11px] text-red-600 font-medium">{couponFeedback.message}</p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-900 font-bold tabular-nums font-mono">
                    {formatCurrencyBRL(subtotal)}
                  </span>
                </div>

                {orderMode === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega ({selectedNeighborhood})</span>
                    <span className="text-stone-900 font-bold tabular-nums font-mono">
                      {deliveryFee === 0 ? 'GRÁTIS' : formatCurrencyBRL(deliveryFee)}
                    </span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Desconto</span>
                    <span className="tabular-nums font-mono">-{formatCurrencyBRL(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span className="text-amber-800 tabular-nums font-mono">
                    {formatCurrencyBRL(total)}
                  </span>
                </div>
              </div>

              {/* Proceed CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-between"
              >
                <span>Avançar para Pagamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
