import React from 'react';
import {
  Utensils,
  Bike,
  Clock,
  Search,
  MapPin,
  Star,
  Sparkles,
  Flame,
  Phone,
  QrCode,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { restaurant, orderMode, setOrderMode } = useDelivery();

  return (
    <div className="bg-gradient-to-b from-orange-50/70 via-stone-50/50 to-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6">
        {/* Main Restaurant Info Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-xs border border-stone-200 flex items-center justify-center shrink-0">
              <span className="text-3xl sm:text-4xl">🥩</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight">
                  {restaurant.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Aberto Agora
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                {restaurant.slogan}
              </p>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-500 mt-2 font-medium">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {restaurant.rating} ({restaurant.reviewCount} avaliações)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {restaurant.openingHours}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {restaurant.address}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-stone-900 block">Retirada no Balcão</span>
                <span className="text-stone-500 text-[11px]">
                  Pronto em 15-20 min sem taxa
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-stone-900 block">Entrega (Delivery)</span>
                <span className="text-stone-500 text-[11px]">Tempo médio {restaurant.deliveryTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Switcher Banner (Mobile & Desktop) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setOrderMode('delivery')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              orderMode === 'delivery'
                ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                : 'bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  orderMode === 'delivery'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xs sm:text-sm text-stone-900 block font-display">
                  🛵 Entrega no Endereço (Delivery)
                </span>
                <span className="text-[11px] text-stone-500">
                  Receba quente e embalado no seu endereço
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {restaurant.deliveryTime}
            </span>
          </button>

          <button
            onClick={() => setOrderMode('retirada')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              orderMode === 'retirada'
                ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                : 'bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  orderMode === 'retirada'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xs sm:text-sm text-stone-900 block font-display">
                  🥡 Retirada no Balcão (Takeaway)
                </span>
                <span className="text-[11px] text-stone-500">
                  Sem taxa de entrega • Pronto em 15-20 min
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
              Sem frete
            </span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="mt-5 relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pratos, cortes de carne, massas, sobremesas ou drinks..."
            className="w-full bg-white text-stone-900 text-sm pl-11 pr-4 py-3 rounded-2xl border border-stone-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-stone-400"
          />
        </div>

        {/* Restaurant Menu Categories Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'todos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Todos os Pratos
          </button>
          {restaurant.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
