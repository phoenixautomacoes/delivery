import React, { useState } from 'react';
import { Star, Clock, ChevronRight } from 'lucide-react';
import { Merchant } from '../types/delivery';
import { useDelivery } from '../context/DeliveryContext';

interface MerchantCardProps {
  merchant: Merchant;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  const { setActiveMerchant, selectedNeighborhood } = useDelivery();
  const [imageError, setImageError] = useState(false);

  const matchedZone = merchant.deliveryZones.find(
    (z) => z.neighborhood.toLowerCase() === selectedNeighborhood.toLowerCase()
  );
  const deliveryFeeText = matchedZone ? `R$ ${matchedZone.fee.toFixed(2)}` : 'R$ 5,00';
  const deliveryTimeText = matchedZone?.estimatedMinutes || merchant.deliveryTime;

  return (
    <div
      onClick={() => setActiveMerchant(merchant)}
      className="group cursor-pointer bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-all duration-200 overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-lg shadow-2xs"
    >
      {/* Cover Media Container */}
      <div className="relative h-44 w-full overflow-hidden bg-stone-100">
        {!imageError ? (
          <img
            src={merchant.coverImage}
            alt={merchant.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-600">
            <span className="text-4xl mb-2">{merchant.logo}</span>
            <span className="text-xs font-semibold text-stone-700">{merchant.name}</span>
          </div>
        )}

        {/* Contrast scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />

        {/* Establishment Logo Icon */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl bg-white/95 border border-stone-200 flex items-center justify-center text-2xl shadow-md backdrop-blur-xs">
          {merchant.logo}
        </div>

        {/* Status indicator (quiet text, not pill clutter) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-stone-200 text-[11px] font-bold shadow-xs">
          <span
            className={`w-2 h-2 rounded-full ${merchant.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className={merchant.isOpen ? 'text-emerald-700' : 'text-red-700'}>
            {merchant.isOpen ? 'Aberto Agora' : 'Fechado'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-bold text-stone-950 group-hover:text-amber-700 transition-colors font-display">
              {merchant.name}
            </h3>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{merchant.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({merchant.reviewCount})</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
            {merchant.slogan}
          </p>
        </div>

        {/* Clean Unboxed Metadata with · separator */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-stone-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{deliveryTimeText}</span>
            </div>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="text-stone-700">Entrega {deliveryFeeText}</span>
            <span aria-hidden="true" className="text-stone-300 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-stone-500">Mínimo R$ {merchant.minOrder.toFixed(2)}</span>
          </div>

          <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
};
