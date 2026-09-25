import React, { useState, useMemo, useEffect } from 'react';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { KDSAdmin } from './components/KDSAdmin';
import { DriverPortal } from './components/DriverPortal';
import { CustomerArea } from './components/CustomerArea';
import { AdvantagesSection } from './components/AdvantagesSection';
import { Footer } from './components/Footer';
import { PortalAuthScreen } from './components/PortalAuthScreen';
import { Product, AppView, PortalType } from './types/delivery';
import {
  Utensils,
  Bike,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Flame,
  Phone,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { formatCurrencyBRL } from './utils/whatsapp';

function RestaurantAppContent() {
  const {
    restaurant,
    products,
    cartItemCount,
    setIsCartOpen,
    isCartOpen,
    isCheckoutOpen,
    isKdsOpen,
    activeOrder,
    orderMode,
    setOrderMode,
    selectedNeighborhood,
    setSelectedNeighborhood,
  } = useDelivery();

  const detectPortal = (): PortalType => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = urlParams.get('portal');
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (
        portalParam === 'admin' ||
        path.startsWith('/admin') ||
        hash.includes('admin') ||
        hash.includes('kds')
      ) {
        return 'admin';
      }
      if (
        portalParam === 'motoboy' ||
        portalParam === 'driver' ||
        path.startsWith('/motoboy') ||
        path.startsWith('/driver') ||
        hash.includes('motoboy') ||
        hash.includes('driver')
      ) {
        return 'motoboy';
      }
    } catch {
      // ignore
    }
    return 'cliente';
  };

  // Portal routing: 'cliente' | 'admin' | 'motoboy'
  const [portal, setPortal] = useState<PortalType>(detectPortal);

  // Keep portal synchronized if URL changes (popstate or hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setPortal(detectPortal());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Authentication states for staff
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('querodelivery_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isDriverAuthenticated, setIsDriverAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('querodelivery_driver_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Client sub-views (cardapio, tracking, customer)
  const [currentView, setCurrentView] = useState<AppView>('cardapio');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const handleSwitchPortal = (targetPortal: PortalType) => {
    setPortal(targetPortal);
    try {
      const url = new URL(window.location.href);
      if (targetPortal === 'cliente') {
        url.searchParams.delete('portal');
      } else {
        url.searchParams.set('portal', targetPortal);
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered dishes for storefront
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'todos' ||
        (selectedCategory === 'Destaques do Chef'
          ? prod.popular
          : prod.category.toLowerCase() === selectedCategory.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        prod.name.toLowerCase().includes(query) ||
        prod.description.toLowerCase().includes(query) ||
        prod.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Grouped products by categories when 'todos' is selected and no search
  const categoriesToDisplay = useMemo(() => {
    if (selectedCategory !== 'todos' || searchQuery.trim() !== '') {
      return [];
    }
    return restaurant.categories;
  }, [selectedCategory, searchQuery, restaurant.categories]);

  // ==========================================
  // PORTAL 2: PAINEL ADMINISTRATIVO & KDS COZINHA
  // ==========================================
  if (portal === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
          <PortalAuthScreen
            portal="admin"
            restaurantName={restaurant.name}
            onSuccess={() => {
              setIsAdminAuthenticated(true);
              try {
                sessionStorage.setItem('querodelivery_admin_auth', 'true');
              } catch {}
            }}
            onBackToClient={() => handleSwitchPortal('cliente')}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <KDSAdmin
          isStandalone={true}
          onLogout={() => {
            setIsAdminAuthenticated(false);
            try {
              sessionStorage.removeItem('querodelivery_admin_auth');
            } catch {}
            handleSwitchPortal('cliente');
          }}
          onGoToClient={() => handleSwitchPortal('cliente')}
        />
      </div>
    );
  }

  // ==========================================
  // PORTAL 3: PORTAL DO ENTREGADOR (MOTOBOY)
  // ==========================================
  if (portal === 'motoboy') {
    if (!isDriverAuthenticated) {
      return (
        <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
          <PortalAuthScreen
            portal="motoboy"
            restaurantName={restaurant.name}
            onSuccess={() => {
              setIsDriverAuthenticated(true);
              try {
                sessionStorage.setItem('querodelivery_driver_auth', 'true');
              } catch {}
            }}
            onBackToClient={() => handleSwitchPortal('cliente')}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-100 text-stone-900">
        <DriverPortal
          onBackToStore={() => handleSwitchPortal('cliente')}
          onLogout={() => {
            setIsDriverAuthenticated(false);
            try {
              sessionStorage.removeItem('querodelivery_driver_auth');
            } catch {}
            handleSwitchPortal('cliente');
          }}
        />
      </div>
    );
  }

  // ==========================================
  // PORTAL 1: PORTAL DO CLIENTE (MESA & DELIVERY)
  // ==========================================
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Client Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSwitchPortal={handleSwitchPortal}
      />

      {/* Customer Area / Minha Conta */}
      {currentView === 'customer' && (
        <CustomerArea onBackToStore={() => handleNavigate('cardapio')} />
      )}

      {/* Tracking Full View (Delivery) */}
      {currentView === 'tracking' && (
        <div className="min-h-screen bg-stone-50 pb-28">
          <header className="bg-white border-b border-stone-200 p-4 sticky top-0 z-30 shadow-2xs">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => handleNavigate('cardapio')}
                className="text-xs text-stone-600 hover:text-stone-950 flex items-center gap-1 font-bold"
              >
                ← Voltar ao Cardápio
              </button>
              <h1 className="text-sm font-bold text-stone-950 font-display">
                Rastreamento da Entrega
              </h1>
              <span className="text-xs text-orange-700 font-mono font-bold">
                {activeOrder ? `#${activeOrder.code}` : 'Nenhum pedido ativo'}
              </span>
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4">
            <OrderTrackerModal />
          </main>
        </div>
      )}

      {/* Cardápio Principal do Restaurante (Storefront) */}
      {currentView === 'cardapio' && (
        <div className="flex-1 pb-24">
          {/* Restaurant Hero Banner with Mode Selector */}
          <HeroBanner
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          {/* Active Mode Notice Banner */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            {orderMode === 'delivery' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    🛵
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-stone-900">
                      Entrega no seu Endereço (Delivery)
                    </h3>
                    <p className="text-xs text-stone-600">
                      Entregamos no conforto da sua residência ou trabalho em 30-45 minutos com embalagem térmica especial.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-600">Bairro:</span>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="bg-white border border-emerald-300 text-stone-800 text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-none"
                  >
                    {restaurant.deliveryZones.map((z) => (
                      <option key={z.neighborhood} value={z.neighborhood}>
                        {z.neighborhood} · {formatCurrencyBRL(z.fee)} ({z.estimatedMinutes})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center font-bold">
                    🥡
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-stone-900">
                      Retirada no Balcão do Restaurante (Takeaway)
                    </h3>
                    <p className="text-xs text-stone-600">
                      Seu pedido fica pronto para retirada em 15-20 min sem taxa de entrega.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                  {restaurant.address}
                </span>
              </div>
            )}
          </div>

          {/* Dishes Catalog Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
            {/* If searching or category selected: single grid */}
            {categoriesToDisplay.length === 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-stone-900 font-display">
                    {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory}
                  </h2>
                  <span className="text-xs text-stone-500 font-medium">
                    {filteredProducts.length} pratos disponíveis
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
                    <p className="text-sm font-bold text-stone-700">
                      Nenhum prato encontrado com os termos digitados.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('todos');
                      }}
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
                    >
                      Limpar Filtros e Ver Cardápio
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={(prod) => setCustomizingProduct(prod)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              /* Grouped by restaurant categories */
              categoriesToDisplay.map((categoryName) => {
                const categoryProducts = products.filter(
                  (p) => p.category.toLowerCase() === categoryName.toLowerCase()
                );
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={categoryName} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                        <h2 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                          {categoryName}
                        </h2>
                      </div>
                      <span className="text-xs text-stone-400 font-medium">
                        {categoryProducts.length} opções
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onSelect={(prod) => setCustomizingProduct(prod)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}

            {/* Delivery Zones Table */}
            <section className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm sm:text-base font-display">
                      Zonas de Entrega & Bairros Atendidos
                    </h3>
                    <p className="text-xs text-stone-500">
                      Entregas rápidas de segunda a domingo com motoboys próprios
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-xl">
                  Pedido mínimo: R$ {restaurant.minOrder.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {restaurant.deliveryZones.map((zone) => (
                  <div
                    key={zone.neighborhood}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{zone.neighborhood}</span>
                      <span className="text-stone-500 text-[11px]">{zone.estimatedMinutes}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {formatCurrencyBRL(zone.fee)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Why This System is Superior Section */}
            <AdvantagesSection />
          </main>

          {/* Footer with discrete team links */}
          <Footer onSwitchPortal={handleSwitchPortal} />
        </div>
      )}

      {/* Product Customization Modal */}
      {customizingProduct && (
        <ProductModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
      <CheckoutModal />
    </div>
  );
}

export default function App() {
  return (
    <DeliveryProvider>
      <RestaurantAppContent />
    </DeliveryProvider>
  );
}
