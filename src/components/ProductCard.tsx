import React from 'react';
import { Product } from '../types/delivery';
import { Plus, Clock, Sparkles } from 'lucide-react';
import { formatCurrencyBRL } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div
      onClick={() => product.isAvailable && onSelect(product)}
      className={`group bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-orange-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        product.isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex gap-4">
        {/* Dish Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {product.badge && (
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white bg-orange-600 mb-1.5 shadow-2xs">
                {product.badge}
              </span>
            )}
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-orange-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-stone-900 text-base font-mono">
                {formatCurrencyBRL(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through font-mono">
                  {formatCurrencyBRL(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <Clock className="w-3 h-3" />
              <span>{product.prepTimeMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Dish Photo */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-100">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.isAvailable ? (
            <button
              type="button"
              className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/95 text-orange-600 shadow-sm flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center text-white text-[10px] font-bold">
              Esgotado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
