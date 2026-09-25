import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Product, ProductAddonOption, CartItemAddon } from '../types/delivery';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { useDelivery } from '../context/DeliveryContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number, addons: CartItemAddon[], notes?: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const { addToCart } = useDelivery();

  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageError, setImageError] = useState(false);

  // Map of selected options per addon group
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    if (product.addonGroups) {
      product.addonGroups.forEach((group) => {
        if (group.required && group.minSelections === 1 && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        } else {
          initial[group.id] = [];
        }
      });
    }
    return initial;
  });

  const handleToggleOption = (
    groupId: string,
    optionId: string,
    isSingleSelect: boolean,
    maxSelections: number
  ) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];

      if (isSingleSelect) {
        return { ...prev, [groupId]: [optionId] };
      }

      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      } else {
        if (current.length >= maxSelections) {
          return prev;
        }
        return { ...prev, [groupId]: [...current, optionId] };
      }
    });
  };

  // Validation
  const validationErrors = useMemo(() => {
    if (!product.addonGroups) return [];
    const errors: string[] = [];

    product.addonGroups.forEach((group) => {
      const current = selectedOptions[group.id] || [];
      if (group.required && current.length < group.minSelections) {
        errors.push(`Selecione ao menos ${group.minSelections} opção em "${group.title}".`);
      }
    });

    return errors;
  }, [product, selectedOptions]);

  const activeAddonsList = useMemo<CartItemAddon[]>(() => {
    if (!product.addonGroups) return [];
    const list: CartItemAddon[] = [];

    product.addonGroups.forEach((group) => {
      const chosenIds = selectedOptions[group.id] || [];
      chosenIds.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          list.push({
            groupId: group.id,
            groupTitle: group.title,
            optionId: opt.id,
            optionName: opt.name,
            price: opt.price,
          });
        }
      });
    });

    return list;
  }, [product, selectedOptions]);

  const unitTotal = useMemo(() => {
    const addonsSum = activeAddonsList.reduce((sum, a) => sum + a.price, 0);
    return product.price + addonsSum;
  }, [product, activeAddonsList]);

  const totalCalculated = unitTotal * quantity;

  const handleAdd = () => {
    if (validationErrors.length > 0) return;
    if (onAddToCart) {
      onAddToCart(product, quantity, activeAddonsList, notes);
    } else {
      addToCart(product, quantity, activeAddonsList, notes);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900">
        {/* Top Header / Image */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-100 shrink-0 overflow-hidden">
          {!imageError ? (
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-tr ${product.accentGradient} flex items-center justify-center`}>
              <span className="text-5xl">🍴</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-xs text-white transition-colors flex items-center justify-center shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-amber-400 text-stone-950 text-xs font-bold rounded-lg shadow-md">
              {product.badge}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Title & Description */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-950">
                {product.name}
              </h2>
              <div className="text-right shrink-0">
                <span className="text-xl font-bold text-amber-800 tabular-nums">
                  {formatCurrencyBRL(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="block text-xs text-stone-400 line-through tabular-nums">
                    {formatCurrencyBRL(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Addon Groups */}
          {product.addonGroups && product.addonGroups.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-stone-200">
              {product.addonGroups.map((group) => {
                const isSingle = group.maxSelections === 1;
                const chosen = selectedOptions[group.id] || [];

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                          <span>{group.title}</span>
                          {group.required && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Obrigatório
                            </span>
                          )}
                        </h4>
                        {group.description && (
                          <p className="text-xs text-stone-500">{group.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        {isSingle
                          ? 'Escolha 1'
                          : `Até ${group.maxSelections} opções (${chosen.length}/${group.maxSelections})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {group.options.map((opt: ProductAddonOption) => {
                        const isSelected = chosen.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              handleToggleOption(group.id, opt.id, isSingle, group.maxSelections)
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm transition-all ${
                              isSelected
                                ? 'bg-amber-50 border-amber-500 text-stone-950 font-semibold shadow-2xs'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-${isSingle ? 'full' : 'md'} border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-500 border-amber-500 text-stone-950'
                                    : 'border-stone-400 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="font-medium">{opt.name}</span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-stone-500">
                              {opt.price > 0 ? `+${formatCurrencyBRL(opt.price)}` : 'Grátis'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Observations */}
          <div className="pt-4 border-t border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Observações do Pedido (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tirar a cebola, enviar molho à parte, bem passado..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Validation Errors banner */}
        {validationErrors.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{validationErrors[0]}</span>
          </div>
        )}

        {/* Modal Bottom Buy Bar */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          {/* Stepper */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-stone-950 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart CTA */}
          <button
            onClick={handleAdd}
            disabled={validationErrors.length > 0}
            className="flex-1 py-3 px-5 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-200 disabled:text-stone-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-between"
          >
            <span>Adicionar ao Pedido</span>
            <span className="tabular-nums font-mono font-bold">
              {formatCurrencyBRL(totalCalculated)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
