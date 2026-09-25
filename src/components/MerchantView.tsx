import React, { useState, useMemo } from 'react';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Search,
  Plus,
  QrCode,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { Merchant, Product } from '../types/delivery';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';

interface MerchantViewProps {
  merchant: Merchant;
  onSelectProduct: (product: Product) => void;
  onOpenTableQr: () => void;
}

export const MerchantView: React.FC<MerchantViewProps> = ({
  merchant,
  onSelectProduct,
  onOpenTableQr,
}) => {
  const { products, setActiveMerchant, selectedNeighborhood, setSelectedNeighborhood } =
    useDelivery();

  const [activeCategory, setActiveCategory] = useState<string>('Destaques');
  const [searchFilter, setSearchFilter] = useState('');
  const [showZonesDropdown, setShowZonesDropdown] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Products belonging to this merchant
  const merchantProducts = useMemo(() => {
    return products.filter((p) => p.merchantId === merchant.id);
  }, [products, merchant.id]);

  // Categories list
  const categories = useMemo(() => {
    return merchant.categories || ['Destaques', 'Todos'];
  }, [merchant]);

  // Filtered products by category and search
  const displayedProducts = useMemo(() => {
    return merchantProducts.filter((p) => {
      const matchesSearch =
        searchFilter.trim() === '' ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.description.toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'Destaques') {
        return p.popular || true;
      }
      return p.category.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [merchantProducts, activeCategory, searchFilter]);

  const matchedZone = merchant.deliveryZones.find(
    (z) => z.neighborhood.toLowerCase() === selectedNeighborhood.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-28">
      {/* Merchant Hero Header */}
      <div className="relative w-full h-64 sm:h-80 bg-stone-200 overflow-hidden">
        {!coverError ? (
          <img
            src={merchant.coverImage}
            alt={merchant.name}
            referrerPolicy="no-referrer"
            onError={() => setCoverError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-stone-200 to-stone-300 flex items-center justify-center">
            <span className="text-6xl">{merchant.logo}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setActiveMerchant(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-stone-900 text-xs font-bold border border-stone-200 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Todos os Estabelecimentos</span>
          </button>
        </div>

        {/* Quick Actions (Table QR Code) */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={onOpenTableQr}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
            title="Pedir na Mesa via QR Code"
          >
            <QrCode className="w-4 h-4" />
            <span>Comanda na Mesa</span>
          </button>
        </div>
      </div>

      {/* Merchant Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-3xl sm:text-4xl shadow-sm shrink-0">
                {merchant.logo}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-display">
                    {merchant.name}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
                  {merchant.slogan}
                </p>
              </div>
            </div>

            {/* WhatsApp Direct Contact Button */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <a
                href={`https://wa.me/${merchant.whatsapp}?text=${encodeURIComponent(
                  `Olá, ${merchant.name}! Estou vendo o cardápio digital de vocês.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Direto</span>
              </a>
            </div>
          </div>

          {/* Unboxed Metadata Strip */}
          <div className="mt-5 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-500 font-medium">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{merchant.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({merchant.reviewCount} avaliações)</span>
            </div>

            <span aria-hidden="true" className="text-stone-300">·</span>

            <div className="flex items-center gap-1.5 text-stone-700">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>{matchedZone?.estimatedMinutes || merchant.deliveryTime}</span>
            </div>

            <span aria-hidden="true" className="text-stone-300">·</span>

            <div className="relative">
              <button
                onClick={() => setShowZonesDropdown(!showZonesDropdown)}
                className="flex items-center gap-1 text-stone-700 hover:text-stone-950 transition-colors"
              >
                <span>Taxa ({selectedNeighborhood}):</span>
                <span className="font-bold text-amber-700">
                  {matchedZone ? `R$ ${matchedZone.fee.toFixed(2)}` : 'R$ 5,00'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* Zones Dropdown */}
              {showZonesDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-stone-200 rounded-xl shadow-xl p-2 z-30 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Taxas por Região:
                  </div>
                  {merchant.deliveryZones.map((z) => (
                    <button
                      key={z.neighborhood}
                      onClick={() => {
                        setSelectedNeighborhood(z.neighborhood);
                        setShowZonesDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        selectedNeighborhood === z.neighborhood
                          ? 'bg-amber-400 text-stone-950 font-bold'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="truncate">{z.neighborhood}</span>
                      <span className="tabular-nums font-mono font-bold">R$ {z.fee.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true" className="text-stone-300">·</span>

            <div className="flex items-center gap-1.5 text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{merchant.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Menu Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="sticky top-16 z-30 bg-stone-50/95 backdrop-blur-md py-4 border-b border-stone-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories Tab Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-white text-stone-700 hover:text-stone-950 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Menu Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-xl w-full md:w-64 shrink-0 shadow-2xs">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent text-xs text-stone-900 placeholder-stone-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Section Title */}
        <div className="mt-8 mb-6 flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-950">
            {activeCategory}
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Products Grid */}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedProducts.map((product) => (
              <ProductCardItem
                key={product.id}
                product={product}
                onClick={() => onSelectProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
            <p className="text-stone-500 text-sm">Nenhum item encontrado nesta categoria.</p>
            <button
              onClick={() => {
                setActiveCategory('Destaques');
                setSearchFilter('');
              }}
              className="mt-3 px-4 py-2 text-xs font-bold text-amber-700 hover:underline"
            >
              Ver todos os itens em Destaques
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual product card
const ProductCardItem: React.FC<{ product: Product; onClick: () => void }> = ({
  product,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white hover:bg-stone-50/50 rounded-2xl border border-stone-200 hover:border-stone-300 transition-all duration-200 overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md shadow-2xs"
    >
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-tr ${product.accentGradient} flex items-center justify-center text-3xl`}
          >
            🍴
          </div>
        )}

        {/* Overlay Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

        {product.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-400 text-stone-950 text-[11px] font-bold rounded-lg shadow-sm">
            {product.badge}
          </div>
        )}

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-2xs flex items-center justify-center">
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-md">
              Esgotado Hoje
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-950 group-hover:text-amber-700 transition-colors font-display line-clamp-1 mb-1.5">
            {product.name}
          </h3>
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-amber-800 tabular-nums">
              {formatCurrencyBRL(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-stone-400 line-through tabular-nums">
                {formatCurrencyBRL(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-amber-400 group-hover:bg-amber-400 text-stone-800 group-hover:text-stone-950 hover:text-stone-950 text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
