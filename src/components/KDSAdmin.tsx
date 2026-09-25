import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Volume2,
  CheckCircle,
  Flame,
  Truck,
  Utensils,
  Receipt,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Bike,
  Settings,
  Users,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Database,
  RefreshCw,
  MessageCircle,
  Search,
  Save,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Building2,
  Calendar,
  Loader2,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import {
  Order,
  OrderStatus,
  DeliveryZone,
  RegisteredCustomer,
  DatabaseBackup,
  Product,
  ProductAddonGroup,
  ProductAddonOption,
} from '../types/delivery';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { soundEffects } from '../utils/sound';
import { fetchAddressByCep, formatCep, cleanCep } from '../utils/cep';
import { formatPhone } from '../utils/phone';

interface KDSAdminProps {
  onClose?: () => void;
  isStandalone?: boolean;
  onLogout?: () => void;
  onGoToClient?: () => void;
}

export const KDSAdmin: React.FC<KDSAdminProps> = ({
  onClose,
  isStandalone = false,
  onLogout,
  onGoToClient,
}) => {
  const {
    isKdsOpen,
    setIsKdsOpen,
    restaurant,
    updateRestaurantSettings,
    addDeliveryZone,
    updateDeliveryZone,
    deleteDeliveryZone,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetToDefaultData,
    updateOrderStatus,
    toggleProductAvailability,
    toggleMerchantOpen,
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'cardapio' | 'zonas' | 'clientes' | 'configuracoes'>('pedidos');
  const [filterMode, setFilterMode] = useState<'todos' | 'delivery' | 'retirada'>('todos');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Settings form state
  const [storeForm, setStoreForm] = useState({
    name: restaurant.name,
    slogan: restaurant.slogan,
    phone: formatPhone(restaurant.phone),
    whatsapp: formatPhone(restaurant.whatsapp),
    address: restaurant.address,
    city: restaurant.city,
    openingHours: restaurant.openingHours,
    deliveryTime: restaurant.deliveryTime,
    minOrder: restaurant.minOrder,
  });
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // Keep form in sync when restaurant changes
  useEffect(() => {
    setStoreForm({
      name: restaurant.name,
      slogan: restaurant.slogan,
      phone: formatPhone(restaurant.phone),
      whatsapp: formatPhone(restaurant.whatsapp),
      address: restaurant.address,
      city: restaurant.city,
      openingHours: restaurant.openingHours,
      deliveryTime: restaurant.deliveryTime,
      minOrder: restaurant.minOrder,
    });
  }, [restaurant]);

  // Delivery Zone Modal / State
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [zoneFormData, setZoneFormData] = useState<DeliveryZone>({
    neighborhood: '',
    fee: 5.0,
    estimatedMinutes: '30-40 min',
  });

  // Customer CRM Modal / State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<RegisteredCustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchingCustomerCep, setIsSearchingCustomerCep] = useState(false);
  const [customerCepFeedback, setCustomerCepFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const customerNumberInputRef = useRef<HTMLInputElement>(null);

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    neighborhood: '',
    city: restaurant.city || 'São Paulo - SP',
    cep: '',
    notes: '',
  });

  // Store CEP auto-fill
  const [storeCep, setStoreCep] = useState('');
  const [isSearchingStoreCep, setIsSearchingStoreCep] = useState(false);
  const [storeCepFeedback, setStoreCepFeedback] = useState<string | null>(null);

  const handleCustomerCepLookup = async (rawCep: string) => {
    const digits = cleanCep(rawCep);
    if (digits.length !== 8) {
      setCustomerCepFeedback({ type: 'error', message: 'Digite os 8 números do CEP.' });
      return;
    }
    setIsSearchingCustomerCep(true);
    setCustomerCepFeedback(null);
    try {
      const address = await fetchAddressByCep(digits);
      setCustomerFormData((prev) => ({
        ...prev,
        cep: address.cep,
        addressStreet: address.street || prev.addressStreet,
        neighborhood: address.neighborhood || prev.neighborhood,
        city: address.city ? `${address.city} - ${address.state}` : prev.city,
      }));
      setCustomerCepFeedback({
        type: 'success',
        message: `Endereço localizado: ${address.street}, ${address.neighborhood} - ${address.city}/${address.state}`,
      });
      setTimeout(() => {
        customerNumberInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      setCustomerCepFeedback({
        type: 'error',
        message: err.message || 'CEP não encontrado nos Correios.',
      });
    } finally {
      setIsSearchingCustomerCep(false);
    }
  };

  const handleCustomerCepChange = (val: string) => {
    const formatted = formatCep(val);
    setCustomerFormData((prev) => ({ ...prev, cep: formatted }));
    const digits = cleanCep(formatted);
    if (digits.length === 8) {
      handleCustomerCepLookup(digits);
    } else {
      setCustomerCepFeedback(null);
    }
  };

  const handleStoreCepLookup = async (rawCep: string) => {
    const digits = cleanCep(rawCep);
    if (digits.length !== 8) return;
    setIsSearchingStoreCep(true);
    setStoreCepFeedback(null);
    try {
      const address = await fetchAddressByCep(digits);
      setStoreForm((prev) => ({
        ...prev,
        city: `${address.city} - ${address.state}`,
        address: `${address.street}${address.neighborhood ? `, ${address.neighborhood}` : ''}`,
      }));
      setStoreCepFeedback(`Endereço da loja preenchido: ${address.street}, ${address.neighborhood}`);
      setTimeout(() => setStoreCepFeedback(null), 4000);
    } catch (err: any) {
      setStoreCepFeedback('CEP não localizado');
    } finally {
      setIsSearchingStoreCep(false);
    }
  };

  // Product / Dish Modal & Catalog State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('todos');
  const [productDeleteConfirm, setProductDeleteConfirm] = useState<Product | null>(null);
  const [isNewCategoryInputOpen, setIsNewCategoryInputOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const defaultProductForm: Omit<Product, 'id'> = {
    merchantId: restaurant.id,
    name: '',
    description: '',
    price: 35.0,
    originalPrice: undefined,
    category: restaurant.categories[0] || 'Destaques do Chef',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    accentGradient: 'from-orange-500 to-amber-600',
    badge: '',
    popular: false,
    isAvailable: true,
    prepTimeMinutes: 25,
    addonGroups: [],
  };

  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(defaultProductForm);

  const photoPresets = [
    { label: '🥩 Carnes & Parrilla', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80' },
    { label: '🍝 Massas Artesanais', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80' },
    { label: '🍔 Burger Gourmet', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { label: '🐟 Peixes & Salmão', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80' },
    { label: '🍰 Sobremesas & Doces', url: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80' },
    { label: '🍹 Drinks & Bebidas', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
    { label: '🥗 Saladas & Saudável', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
    { label: '🍕 Pizzas Especiais', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
    { label: '🥘 Executivo do Dia', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...defaultProductForm,
      merchantId: restaurant.id,
      category: restaurant.categories[0] || 'Destaques do Chef',
    });
    setIsNewCategoryInputOpen(false);
    setNewCategoryName('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      merchantId: prod.merchantId,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      originalPrice: prod.originalPrice,
      category: prod.category,
      image: prod.image,
      accentGradient: prod.accentGradient || 'from-orange-500 to-amber-600',
      badge: prod.badge || '',
      popular: !!prod.popular,
      isAvailable: prod.isAvailable,
      prepTimeMinutes: prod.prepTimeMinutes || 25,
      addonGroups: prod.addonGroups ? JSON.parse(JSON.stringify(prod.addonGroups)) : [],
    });
    setIsNewCategoryInputOpen(false);
    setNewCategoryName('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    let finalCategory = productForm.category;
    if (isNewCategoryInputOpen && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
    }

    const payload = {
      ...productForm,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      category: finalCategory,
      price: Number(productForm.price) || 0,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      prepTimeMinutes: Number(productForm.prepTimeMinutes) || 20,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    setProductDeleteConfirm(null);
  };

  const handleAddAddonGroup = () => {
    const newGroup: ProductAddonGroup = {
      id: `group-${Date.now()}`,
      title: 'Opção / Acompanhamento',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: [
        { id: `opt-${Date.now()}-1`, name: 'Opção Padrão', price: 0 },
      ],
    };
    setProductForm((prev) => ({
      ...prev,
      addonGroups: [...(prev.addonGroups || []), newGroup],
    }));
  };

  const handleRemoveAddonGroup = (groupId: string) => {
    setProductForm((prev) => ({
      ...prev,
      addonGroups: (prev.addonGroups || []).filter((g) => g.id !== groupId),
    }));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    setProductForm((prev) => ({
      ...prev,
      addonGroups: (prev.addonGroups || []).map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: [
              ...g.options,
              { id: `opt-${Date.now()}-${g.options.length + 1}`, name: '', price: 0 },
            ],
          };
        }
        return g;
      }),
    }));
  };

  const handleRemoveOptionFromGroup = (groupId: string, optId: string) => {
    setProductForm((prev) => ({
      ...prev,
      addonGroups: (prev.addonGroups || []).map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.filter((o) => o.id !== optId),
          };
        }
        return g;
      }),
    }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        productSearch === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());

      const matchCat =
        selectedProductCategory === 'todos' || p.category === selectedProductCategory;

      return matchSearch && matchCat;
    });
  }, [products, productSearch, selectedProductCategory]);

  // Database Backup Notification
  const [dbNotification, setDbNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isStandalone && !isKdsOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsKdsOpen(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filterMode === 'todos') return orders;
    return orders.filter((o) => o.mode === filterMode);
  }, [orders, filterMode]);

  const totalSales = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pendente' || o.status === 'preparando').length;
  }, [orders]);

  const avgTicket = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelado');
    if (valid.length === 0) return 0;
    return totalSales / valid.length;
  }, [orders, totalSales]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleTestSound = () => {
    soundEffects.playNewOrderAlert();
  };

  // Save Store Settings
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantSettings({
      name: storeForm.name,
      slogan: storeForm.slogan,
      phone: storeForm.phone,
      whatsapp: storeForm.whatsapp.replace(/\D/g, ''),
      address: storeForm.address,
      city: storeForm.city,
      openingHours: storeForm.openingHours,
      deliveryTime: storeForm.deliveryTime,
      minOrder: Number(storeForm.minOrder),
    });
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 3500);
  };

  // Zone Actions
  const handleOpenAddZone = () => {
    setEditingZoneIndex(null);
    setZoneFormData({
      neighborhood: '',
      fee: 6.0,
      estimatedMinutes: '30-40 min',
    });
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (index: number) => {
    const zone = restaurant.deliveryZones[index];
    if (!zone) return;
    setEditingZoneIndex(index);
    setZoneFormData({ ...zone });
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.neighborhood.trim()) return;

    if (editingZoneIndex !== null) {
      updateDeliveryZone(editingZoneIndex, zoneFormData);
    } else {
      addDeliveryZone(zoneFormData);
    }
    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = (index: number, name: string) => {
    if (confirm(`Deseja realmente remover o bairro "${name}" da área de entrega?`)) {
      deleteDeliveryZone(index);
    }
  };

  // Customer CRM Actions
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.neighborhood && c.neighborhood.toLowerCase().includes(query)) ||
        (c.addressStreet && c.addressStreet.toLowerCase().includes(query))
    );
  }, [customers, customerSearch]);

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({
      name: '',
      phone: '',
      email: '',
      addressStreet: '',
      addressNumber: '',
      addressComplement: '',
      neighborhood: restaurant.deliveryZones[0]?.neighborhood || '',
      city: restaurant.city || 'São Paulo - SP',
      cep: '',
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: RegisteredCustomer) => {
    setEditingCustomer(cust);
    setCustomerFormData({
      name: cust.name,
      phone: formatPhone(cust.phone),
      email: cust.email || '',
      addressStreet: cust.addressStreet || '',
      addressNumber: cust.addressNumber || '',
      addressComplement: cust.addressComplement || '',
      neighborhood: cust.neighborhood || '',
      city: cust.city || restaurant.city,
      cep: cust.cep || '',
      notes: cust.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim() || !customerFormData.phone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: customerFormData.name,
        phone: customerFormData.phone,
        email: customerFormData.email,
        addressStreet: customerFormData.addressStreet,
        addressNumber: customerFormData.addressNumber,
        addressComplement: customerFormData.addressComplement,
        neighborhood: customerFormData.neighborhood,
        city: customerFormData.city,
        cep: customerFormData.cep,
        notes: customerFormData.notes,
      });
    } else {
      addCustomer({
        name: customerFormData.name,
        phone: customerFormData.phone,
        email: customerFormData.email,
        addressStreet: customerFormData.addressStreet,
        addressNumber: customerFormData.addressNumber,
        addressComplement: customerFormData.addressComplement,
        neighborhood: customerFormData.neighborhood,
        city: customerFormData.city,
        cep: customerFormData.cep,
        notes: customerFormData.notes,
        totalOrders: 0,
        totalSpent: 0,
      });
    }
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Deseja excluir o registro do cliente "${name}" do banco de dados?`)) {
      deleteCustomer(id);
    }
  };

  // Database Backup Actions
  const handleExportBackup = () => {
    const backup = exportDatabaseBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `banco_de_dados_origens_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDbNotification('Backup completo exportado com sucesso em arquivo .JSON!');
    setTimeout(() => setDbNotification(null), 4000);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importDatabaseBackup(parsed);
        if (ok) {
          setDbNotification('Banco de dados restaurado com sucesso!');
        } else {
          setDbNotification('Falha ao restaurar: Arquivo de backup em formato incompatível.');
        }
      } catch (err) {
        setDbNotification('Erro ao processar arquivo JSON de backup.');
      }
      setTimeout(() => setDbNotification(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetDatabase = () => {
    if (confirm('Atenção: Deseja redefinir todo o banco de dados para os dados padrão de fábrica? Isso recarregará o cardápio, bairros e pedidos originais.')) {
      resetToDefaultData();
      setDbNotification('Banco de dados restaurado para os dados de demonstração originais!');
      setTimeout(() => setDbNotification(null), 4000);
    }
  };

  return (
    <div
      className={
        isStandalone
          ? 'w-full max-w-7xl mx-auto'
          : 'fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4'
      }
    >
      <div
        className={
          isStandalone
            ? 'max-w-7xl mx-auto p-4 sm:p-6'
            : 'relative w-full max-w-6xl max-h-[95vh] bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 my-4'
        }
      >
        {/* KDS Top Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center text-xl shadow-2xs">
              👨‍🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-display text-stone-950">
                  {restaurant.name} · Painel de Gestão & KDS
                </h2>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                <span>📍 {restaurant.city}</span>
                <span>•</span>
                <span>📞 {restaurant.phone}</span>
                <span>•</span>
                <span>Entrega: {restaurant.deliveryTime}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Prominent Settings Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* O BOTÃO DE CONFIGURAÇÕES SOLICITADO PELO USUÁRIO */}
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shadow-2xs ${
                activeTab === 'configuracoes'
                  ? 'bg-orange-600 text-white border-orange-700 ring-2 ring-orange-400'
                  : 'bg-white hover:bg-orange-50 text-orange-800 border-orange-300'
              }`}
              title="Abrir configurações de cidade, bairros, telefones e banco de dados"
            >
              <Settings className="w-4 h-4 text-orange-600" />
              <span>⚙️ Configurações</span>
            </button>

            {onGoToClient && (
              <button
                onClick={onGoToClient}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors shadow-2xs"
                title="Voltar à visão do cliente / cardápio"
              >
                <span>🍽️ Cardápio Cliente</span>
              </button>
            )}

            <button
              onClick={handleTestSound}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors shadow-2xs"
              title="Testar alarme sonoro de novo pedido"
            >
              <Volume2 className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Som de Alerta</span>
            </button>

            {onLogout ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                title="Bloquear painel e sair"
              >
                <span>🔒 Sair</span>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors"
                title="Fechar Painel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPIs Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-100/70 border-b border-stone-200">
          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Faturamento Total</span>
            <div className="text-lg font-black text-emerald-700 font-mono tabular-nums mt-0.5">
              {formatCurrencyBRL(totalSales)}
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Em Cozinha / Rota</span>
            <div className="text-lg font-black text-orange-700 font-mono tabular-nums mt-0.5">
              {activeOrdersCount} ativos
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Clientes Cadastrados</span>
            <div className="text-lg font-black text-stone-900 font-mono tabular-nums mt-0.5">
              {customers.length} clientes
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 font-semibold">Status do Delivery</span>
              <p className={`text-xs font-bold mt-0.5 ${restaurant.isOpen ? 'text-emerald-700' : 'text-red-700'}`}>
                {restaurant.isOpen ? 'Aberto / Ativo' : 'Fechado'}
              </p>
            </div>
            <button
              onClick={toggleMerchantOpen}
              className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg transition-colors"
            >
              Alternar
            </button>
          </div>
        </div>

        {/* Global DB Notification Toast */}
        {dbNotification && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>{dbNotification}</span>
            </div>
            <button onClick={() => setDbNotification(null)} className="text-white hover:text-stone-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sub-navigation tabs & Filter */}
        <div className="px-5 pt-3 pb-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'pedidos'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              📋 Pedidos KDS ({filteredOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('zonas')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'zonas'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Bairros & Taxas ({restaurant.deliveryZones.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'clientes'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clientes & CRM ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cardapio')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'cardapio'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Cardápio & Pratos ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'configuracoes'
                  ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-300'
                  : 'text-orange-950 hover:text-orange-900 bg-orange-100 border border-orange-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              <span>⚙️ Configurações & Banco</span>
            </button>

            <button
              onClick={handleOpenAddProduct}
              className="ml-auto px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              title="Cadastrar novo prato ou produto no cardápio"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Prato / Produto</span>
            </button>
          </div>

          {activeTab === 'pedidos' && (
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                onClick={() => setFilterMode('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'todos' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMode('delivery')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'delivery' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-stone-600'
                }`}
              >
                🛵 Entrega
              </button>
              <button
                onClick={() => setFilterMode('retirada')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'retirada' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                }`}
              >
                🥡 Balcão
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: KDS KANBAN COLUMNS */}
        {activeTab === 'pedidos' && (
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[65vh]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Coluna 1: Pendentes */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-3 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider">
                      Novos / Pendentes
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full tabular-nums">
                    {filteredOrders.filter((o) => o.status === 'pendente').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {filteredOrders.filter((o) => o.status === 'pendente').length === 0 ? (
                    <div className="text-center py-10 text-xs text-stone-400">
                      Nenhum pedido pendente
                    </div>
                  ) : (
                    filteredOrders
                      .filter((o) => o.status === 'pendente')
                      .map((order) => (
                        <KdsOrderCard
                          key={order.id}
                          order={order}
                          onPrint={() => setPrintOrder(order)}
                          onNext={() => handleStatusChange(order.id, 'preparando')}
                          nextLabel="Enviar p/ Cozinha"
                          nextIcon={Flame}
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Coluna 2: Em Preparo na Cozinha */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-3 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider">
                      Na Cozinha (Preparo)
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-orange-900 bg-orange-100 px-2 py-0.5 rounded-full tabular-nums">
                    {filteredOrders.filter((o) => o.status === 'preparando').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {filteredOrders.filter((o) => o.status === 'preparando').length === 0 ? (
                    <div className="text-center py-10 text-xs text-stone-400">
                      Nenhum pedido na cozinha
                    </div>
                  ) : (
                    filteredOrders
                      .filter((o) => o.status === 'preparando')
                      .map((order) => (
                        <KdsOrderCard
                          key={order.id}
                          order={order}
                          onPrint={() => setPrintOrder(order)}
                          onNext={() =>
                            handleStatusChange(
                              order.id,
                              order.mode === 'delivery' ? 'em_rota' : 'entregue'
                            )
                          }
                          nextLabel={
                            order.mode === 'delivery'
                              ? 'Despachar Entrega'
                              : 'Pronto p/ Balcão'
                          }
                          nextIcon={order.mode === 'delivery' ? Truck : CheckCircle}
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Coluna 3: Em Rota / Prontos */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-3 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider">
                      Em Rota / Despachados
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full tabular-nums">
                    {filteredOrders.filter((o) => o.status === 'em_rota').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {filteredOrders.filter((o) => o.status === 'em_rota').length === 0 ? (
                    <div className="text-center py-10 text-xs text-stone-400">
                      Nenhum pedido em rota de entrega
                    </div>
                  ) : (
                    filteredOrders
                      .filter((o) => o.status === 'em_rota')
                      .map((order) => (
                        <KdsOrderCard
                          key={order.id}
                          order={order}
                          onPrint={() => setPrintOrder(order)}
                          onNext={() => handleStatusChange(order.id, 'entregue')}
                          nextLabel="Confirmar Entrega"
                          nextIcon={CheckCircle}
                        />
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BAIRROS E TAXAS DE ENTREGA (GESTÃO COMPLETA) */}
        {activeTab === 'zonas' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[65vh] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>Configuração de Bairros, Taxas e Tempos de Entrega</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Adicione, edite ou exclua os bairros da sua cidade atendidos pelo seu serviço de entrega.
                </p>
              </div>

              <button
                onClick={handleOpenAddZone}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Bairro de Entrega</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurant.deliveryZones.map((zone, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{zone.neighborhood}</h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Estimativa: {zone.estimatedMinutes}</span>
                      </p>
                    </div>
                    <span className="text-sm font-black text-orange-700 font-mono tabular-nums px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-lg">
                      {zone.fee === 0 ? 'Grátis' : formatCurrencyBRL(zone.fee)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo no Delivery
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditZone(idx)}
                        className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Editar bairro ou taxa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(idx, zone.neighborhood)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover este bairro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BANCO DE DADOS DE CLIENTES (CRM COMPLETO) */}
        {activeTab === 'clientes' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[65vh] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>Base de Dados de Clientes & CRM</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Consulte os dados cadastrais, telefones, endereços e histórico de compras de cada cliente. Novos pedidos sincronizam aqui automaticamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddCustomer}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Cadastrar Cliente</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente por nome, telefone, rua ou bairro..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-stone-400 text-xs">
                  Nenhum cliente encontrado para "{customerSearch}".
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-sm border border-orange-200">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{c.name}</h4>
                          <p className="text-xs text-stone-500 font-mono mt-0.5">{c.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {c.phone && (
                          <a
                            href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="p-2 hover:bg-stone-100 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                          title="Editar dados do cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-xl border border-red-200 transition-colors"
                          title="Remover cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                      <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>
                          {c.addressStreet ? `${c.addressStreet}, ${c.addressNumber || 'S/N'}` : 'Endereço não informado'}
                          {c.addressComplement && ` (${c.addressComplement})`}
                        </span>
                      </p>
                      <p className="text-stone-500 pl-5">
                        {c.neighborhood ? `Bairro: ${c.neighborhood}` : 'Sem bairro'} · {c.city || restaurant.city}
                        {c.cep && ` · CEP: ${c.cep}`}
                      </p>
                      {c.notes && (
                        <p className="pl-5 text-orange-800 italic text-[11px] font-medium pt-1">
                          Nota: {c.notes}
                        </p>
                      )}
                    </div>

                    {/* Statistics */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500">
                        Total: <strong>{c.totalOrders} pedidos</strong>
                      </span>
                      <span className="text-emerald-700 font-bold font-mono">
                        Gasto Total: {formatCurrencyBRL(c.totalSpent)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GESTÃO DO CARDÁPIO & INCLUSÃO DE PRATOS */}
        {activeTab === 'cardapio' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[70vh] space-y-4">
            {/* Header Action Banner */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-600" />
                    <span>Gestão do Cardápio & Inclusão de Pratos</span>
                  </h3>
                  <span className="text-[11px] font-bold text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                    {products.length} itens cadastrados
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Cadastre novos pratos, configure fotos, preços, tempo de preparo, opcionais e pause produtos esgotados.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar Novo Prato / Item</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar prato por nome, descrição ou categoria..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedProductCategory}
                  onChange={(e) => setSelectedProductCategory(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0"
                >
                  <option value="todos">Todas as Categorias ({products.length})</option>
                  {restaurant.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({products.filter((p) => p.category === cat).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-3">
                <Utensils className="w-10 h-10 mx-auto text-stone-400" />
                <h4 className="font-bold text-stone-700 text-sm">Nenhum prato encontrado</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {productSearch || selectedProductCategory !== 'todos'
                    ? 'Tente ajustar os filtros ou o termo de busca para encontrar o item desejado.'
                    : 'Nenhum prato foi cadastrado ainda. Clique no botão abaixo para adicionar o primeiro item ao cardápio.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Prato Agora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3.5 bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                      p.isAvailable ? 'border-stone-200' : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex gap-3 mb-2.5">
                        <div className="relative shrink-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-xl object-cover border border-stone-200 shadow-2xs"
                          />
                          {p.badge && (
                            <span className="absolute -top-1.5 -left-1.5 bg-amber-500 text-stone-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs">
                              {p.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded-md truncate border border-orange-200/60">
                              {p.category}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium flex items-center gap-0.5 shrink-0">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {p.prepTimeMinutes} min
                            </span>
                          </div>

                          <h4 className="text-xs font-extrabold text-stone-900 line-clamp-1">{p.name}</h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                            {p.description || 'Sem descrição cadastrada'}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-mono font-extrabold text-orange-700">
                              {formatCurrencyBRL(p.price)}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] font-mono text-stone-400 line-through">
                                {formatCurrencyBRL(p.originalPrice)}
                              </span>
                            )}
                            {p.addonGroups && p.addonGroups.length > 0 && (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                                {p.addonGroups.length} opcional(is)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Controls */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 ${
                          p.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {p.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disponível</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-red-600" />
                            <span>Pausado (Esgotado)</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Editar prato"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductDeleteConfirm(p)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir prato do cardápio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CONFIGURAÇÕES DA LOJA & BANCO DE DADOS (CENTRAL DO BANCO) */}
        {activeTab === 'configuracoes' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[65vh] space-y-6">
            {saveSettingsSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Configurações do estabelecimento atualizadas e salvas com sucesso no banco de dados!</span>
              </div>
            )}

            {/* Form Section: Store Settings */}
            <form onSubmit={handleSaveStoreSettings} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span>Dados Cadastrais do Restaurante / Loja</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure a cidade, endereço, telefones de atendimento e regras de pedido.
                  </p>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nome do Restaurante / Loja</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    required
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Slogan ou Descrição</label>
                  <input
                    type="text"
                    value={storeForm.slogan}
                    onChange={(e) => setStoreForm({ ...storeForm, slogan: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700">Telefone Fixo / Comercial</label>
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      Auto-organizado
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: formatPhone(e.target.value) })}
                    placeholder="(51) 3222-1234 ou (51) 99154-6560"
                    maxLength={19}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700">
                      WhatsApp para Recebimento de Pedidos
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      ⚡ Formatação Automática
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={storeForm.whatsapp}
                    onChange={(e) => setStoreForm({ ...storeForm, whatsapp: formatPhone(e.target.value) })}
                    required
                    placeholder="(11) 98765-4321 ou +55 (11) 98765-4321"
                    maxLength={19}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-700 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>Preenchimento Rápido do Estabelecimento por CEP</span>
                    </label>
                    <span className="text-[10px] text-stone-500">Auto-preenche cidade e logradouro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:max-w-xs">
                      <input
                        type="text"
                        value={storeCep}
                        onChange={(e) => {
                          const val = formatCep(e.target.value);
                          setStoreCep(val);
                          if (cleanCep(val).length === 8) {
                            handleStoreCepLookup(val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleStoreCepLookup(storeCep);
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className={`w-full p-2 bg-white border rounded-lg text-xs font-mono font-bold focus:outline-none transition-colors ${
                          isSearchingStoreCep ? 'border-orange-500 ring-2 ring-orange-100' : 'border-stone-300 focus:ring-2 focus:ring-orange-500'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStoreCepLookup(storeCep)}
                      disabled={isSearchingStoreCep || !storeCep}
                      className={`w-[110px] py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isSearchingStoreCep
                          ? 'bg-stone-800 text-white cursor-wait'
                          : 'bg-stone-800 hover:bg-stone-900 text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSearchingStoreCep ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 shrink-0" />
                          <span>Buscar CEP</span>
                        </>
                      )}
                    </button>
                    {isSearchingStoreCep && (
                      <span className="text-xs text-orange-700 font-semibold animate-pulse">Localizando...</span>
                    )}
                    {!isSearchingStoreCep && storeCepFeedback && (
                      <span className="text-xs text-emerald-700 font-semibold">{storeCepFeedback}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cidade e Estado (UF)</label>
                  <input
                    type="text"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    required
                    placeholder="Ex: São Paulo - SP"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Endereço Completo da Loja</label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    placeholder="Ex: Alameda Santos, 1420 - Cerqueira César"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Horário de Atendimento / Funcionamento</label>
                  <input
                    type="text"
                    value={storeForm.openingHours}
                    onChange={(e) => setStoreForm({ ...storeForm, openingHours: e.target.value })}
                    placeholder="Ex: Todos os dias das 11h às 23h"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Tempo Geral Entrega</label>
                    <input
                      type="text"
                      value={storeForm.deliveryTime}
                      onChange={(e) => setStoreForm({ ...storeForm, deliveryTime: e.target.value })}
                      placeholder="Ex: 30-45 min"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Pedido Mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={storeForm.minOrder}
                      onChange={(e) => setStoreForm({ ...storeForm, minOrder: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados Cadastrais</span>
                </button>
              </div>
            </form>

            {/* Cópia de Segurança & Backup dos Dados */}
            <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900">
                      Cópia de Segurança & Backup dos Dados
                    </h3>
                    <p className="text-xs text-stone-500">
                      Salve uma cópia de todos os seus pratos, clientes e configurações no seu computador para garantir que nada seja perdido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo dos registros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[11px] text-stone-500 font-semibold block">Pratos no Cardápio</span>
                  <span className="text-lg font-black text-stone-900 font-mono">{products.length}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[11px] text-stone-500 font-semibold block">Clientes Cadastrados</span>
                  <span className="text-lg font-black text-stone-900 font-mono">{customers.length}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[11px] text-stone-500 font-semibold block">Bairros Atendidos</span>
                  <span className="text-lg font-black text-stone-900 font-mono">{restaurant.deliveryZones.length}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[11px] text-stone-500 font-semibold block">Histórico de Pedidos</span>
                  <span className="text-lg font-black text-stone-900 font-mono">{orders.length}</span>
                </div>
              </div>

              {/* Ações de backup */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-300" />
                    <span>Baixar Backup dos Dados</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-orange-600" />
                    <span>Restaurar Backup Salvo</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFileChange}
                      accept=".json"
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="flex items-center gap-1.5 px-3 py-2 text-stone-500 hover:text-red-700 text-xs font-semibold hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Restaura os produtos e clientes de demonstração iniciais"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Dados de Exemplo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NOVO OU EDITAR BAIRRO DE ENTREGA */}
        {isZoneModalOpen && (
          <div className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {editingZoneIndex !== null ? 'Editar Bairro de Entrega' : 'Adicionar Novo Bairro'}
                </h3>
                <button
                  onClick={() => setIsZoneModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveZone} className="space-y-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nome do Bairro</label>
                  <input
                    type="text"
                    value={zoneFormData.neighborhood}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, neighborhood: e.target.value })}
                    required
                    placeholder="Ex: Cerqueira César, Vila Mariana, Centro..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Taxa de Entrega (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={zoneFormData.fee}
                      onChange={(e) => setZoneFormData({ ...zoneFormData, fee: parseFloat(e.target.value) || 0 })}
                      required
                      placeholder="0.00"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Tempo Estimado</label>
                    <input
                      type="text"
                      value={zoneFormData.estimatedMinutes}
                      onChange={(e) => setZoneFormData({ ...zoneFormData, estimatedMinutes: e.target.value })}
                      required
                      placeholder="Ex: 25-35 min"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoneModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-700 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Salvar Bairro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: NOVO OU EDITAR CLIENTE (CRM) */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {editingCustomer ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={customerFormData.name}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                      required
                      placeholder="Ex: Maria Oliveira"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-stone-700">Telefone / WhatsApp *</label>
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                        Auto-formatado
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={customerFormData.phone}
                      onChange={(e) =>
                        setCustomerFormData({
                          ...customerFormData,
                          phone: formatPhone(e.target.value),
                        })
                      }
                      required
                      placeholder="(11) 98765-4321"
                      maxLength={19}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-stone-900 text-xs">Endereço de Entrega do Cliente</h4>
                    <span className="text-[10px] text-orange-700 bg-orange-50 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                      ⚡ Preenchimento por CEP
                    </span>
                  </div>

                  {/* CEP Auto-fill Box */}
                  <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded-xl mb-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-stone-800 text-[11px]">
                        CEP (Código Postal)
                      </label>
                      <span className="text-[10px] text-stone-500">Digite 8 números para preenchimento automático</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={customerFormData.cep}
                          onChange={(e) => handleCustomerCepChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCustomerCepLookup(customerFormData.cep);
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className={`w-full p-2 bg-white border rounded-xl text-xs font-mono font-bold text-stone-950 focus:outline-none transition-colors ${
                            isSearchingCustomerCep
                              ? 'border-orange-500 ring-2 ring-orange-100'
                              : 'border-stone-300 focus:ring-2 focus:ring-orange-500'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomerCepLookup(customerFormData.cep)}
                        disabled={isSearchingCustomerCep || !customerFormData.cep}
                        className={`w-[110px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-all ${
                          isSearchingCustomerCep
                            ? 'bg-orange-600 text-white cursor-wait'
                            : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSearchingCustomerCep ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5 shrink-0" />
                            <span>Buscar CEP</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isSearchingCustomerCep ? (
                      <p className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-orange-100 text-orange-950 border border-orange-300 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-orange-600" />
                        <span>Buscando endereço nos Correios...</span>
                      </p>
                    ) : customerCepFeedback ? (
                      <p
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                          customerCepFeedback.type === 'success'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {customerCepFeedback.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-2">
                      <label className="block font-bold text-stone-700 mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={customerFormData.addressStreet}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, addressStreet: e.target.value })}
                        placeholder={isSearchingCustomerCep ? 'Localizando rua...' : 'Rua / Avenida'}
                        className={`w-full p-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all ${
                          isSearchingCustomerCep ? 'opacity-70 bg-orange-50/40' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Número</label>
                      <input
                        ref={customerNumberInputRef}
                        type="text"
                        value={customerFormData.addressNumber}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, addressNumber: e.target.value })}
                        placeholder="123"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={customerFormData.addressComplement}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, addressComplement: e.target.value })}
                        placeholder="Apto 101, Bloco B"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={customerFormData.neighborhood}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, neighborhood: e.target.value })}
                        placeholder="Bairro"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block font-bold text-stone-700 mb-1">Cidade e UF</label>
                      <input
                        type="text"
                        value={customerFormData.city}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                        placeholder="Cidade - UF"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Observações Internas (Preferências, Alergias, etc.)</label>
                  <textarea
                    rows={2}
                    value={customerFormData.notes}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                    placeholder="Ex: Tocar interfone 102. Carne sempre ao ponto."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-700 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Salvar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: IMPRESSÃO DE COMANDA TÉRMICA 80MM */}
        {printOrder && (
          <div className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-300 font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-stone-400 pb-3">
                <h3 className="font-bold text-sm uppercase">{restaurant.name}</h3>
                <p className="text-[10px] text-stone-600">{restaurant.address}</p>
                <p className="text-[10px] text-stone-600">Tel: {restaurant.phone}</p>
                <p className="font-bold text-xs mt-2 uppercase">
                  COMANDA: #{printOrder.code} · {printOrder.mode === 'delivery' ? 'ENTREGA' : 'RETIRADA NO BALCÃO'}
                </p>
                {printOrder.mode === 'delivery' ? (
                  <p className="text-xs font-bold text-emerald-700">
                    🛵 ENTREGA EM DOMICÍLIO
                  </p>
                ) : (
                  <p className="text-xs font-bold text-orange-700">
                    🥡 RETIRADA NO BALCÃO
                  </p>
                )}
              </div>

              <div>
                <p className="font-bold mb-1">CLIENTE: {printOrder.customer.name}</p>
                <p className="text-[11px]">WhatsApp: {printOrder.customer.phone}</p>
                {printOrder.mode === 'delivery' && printOrder.customer.addressStreet && (
                  <div className="bg-stone-50 p-2 rounded text-[11px] mt-1 border border-stone-200">
                    <p className="font-bold">ENDEREÇO DE ENTREGA:</p>
                    <p>
                      {printOrder.customer.addressStreet}, {printOrder.customer.addressNumber}
                    </p>
                    {printOrder.customer.addressComplement && (
                      <p>Compl: {printOrder.customer.addressComplement}</p>
                    )}
                    <p>Bairro: {printOrder.customer.neighborhood}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-dashed border-stone-400 py-2 space-y-1.5">
                <p className="font-bold text-[11px]">ITENS DO PEDIDO:</p>
                {printOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold">
                        {it.quantity}x {it.product.name}
                      </p>
                      {it.selectedAddons.map((ad, aidx) => (
                        <p key={aidx} className="text-[10px] text-stone-600 pl-2">
                          + {ad.optionName}
                        </p>
                      ))}
                      {it.notes && (
                        <p className="text-[10px] text-red-600 pl-2 italic">
                          Obs: {it.notes}
                        </p>
                      )}
                    </div>
                    <span>{formatCurrencyBRL(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrencyBRL(printOrder.subtotal)}</span>
                </div>
                {printOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrencyBRL(printOrder.deliveryFee)}</span>
                  </div>
                )}
                {printOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto:</span>
                    <span>- {formatCurrencyBRL(printOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-stone-300 pt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrencyBRL(printOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 pt-1">
                  <span>Pagamento:</span>
                  <span className="uppercase font-bold">{printOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-stone-900 text-white font-bold rounded-xl text-center"
                >
                  Imprimir Comanda
                </button>
                <button
                  onClick={() => setPrintOrder(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CADASTRO / EDIÇÃO DE PRATO & PRODUTO */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 text-xs space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-600" />
                    <span>{editingProduct ? 'Editar Prato / Produto do Cardápio' : 'Cadastrar Novo Prato / Produto'}</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Preencha as informações do item. O prato ficará visível imediatamente para os clientes.
                  </p>
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coluna 1: Informações Principais */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Nome do Prato / Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Ex: Bife de Ancho Angus (350g) com Legumes"
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-stone-800">Categoria do Cardápio *</label>
                        <button
                          type="button"
                          onClick={() => setIsNewCategoryInputOpen(!isNewCategoryInputOpen)}
                          className="text-[11px] text-orange-600 hover:text-orange-700 font-bold underline"
                        >
                          {isNewCategoryInputOpen ? 'Selecionar existente' : '+ Nova Categoria'}
                        </button>
                      </div>

                      {isNewCategoryInputOpen ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Digite o nome da nova categoria..."
                            className="flex-1 p-2.5 bg-stone-50 border border-orange-400 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                          />
                        </div>
                      ) : (
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                        >
                          {restaurant.categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-800 mb-1">Preço de Venda (R$) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={productForm.price || ''}
                            onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                            placeholder="65,00"
                            className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Preço "De" (R$ Opcional)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={productForm.originalPrice || ''}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                originalPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                              })
                            }
                            placeholder="85,00 (riscado)"
                            className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-800 mb-1">Preparo Estimado (min)</label>
                        <div className="relative">
                          <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="number"
                            min="1"
                            value={productForm.prepTimeMinutes || ''}
                            onChange={(e) =>
                              setProductForm({ ...productForm, prepTimeMinutes: parseInt(e.target.value) || 20 })
                            }
                            placeholder="25"
                            className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-800 mb-1">Selo Especial / Tag</label>
                        <div className="relative">
                          <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={productForm.badge || ''}
                            onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                            placeholder="Ex: Mais Pedido, Chef"
                            className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Descrição dos Ingredientes & Detalhes</label>
                      <textarea
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Ex: Corte nobre grelhado na brasa ao chimichurri artesanal, guarnecido com farofa crocante e legumes salteados na manteiga de garrafa."
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs text-stone-900 leading-relaxed"
                      />
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 text-xs">
                        <input
                          type="checkbox"
                          checked={productForm.isAvailable}
                          onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span>Item Ativo / Disponível para Pedidos</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 text-xs">
                        <input
                          type="checkbox"
                          checked={!!productForm.popular}
                          onChange={(e) => setProductForm({ ...productForm, popular: e.target.checked })}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span>Destacar na Seção de Populares da Página Inicial</span>
                      </label>
                    </div>
                  </div>

                  {/* Coluna 2: Foto do Prato e Sugestões Gastronômicas */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">URL da Imagem / Foto do Prato *</label>
                      <input
                        type="url"
                        required
                        value={productForm.image}
                        onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-900"
                      />
                    </div>

                    {/* Preview da Imagem */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-700 text-xs">Pré-visualização da Foto:</span>
                      </div>
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-stone-200 shadow-2xs bg-stone-100 flex items-center justify-center">
                        {productForm.image ? (
                          <img
                            src={productForm.image}
                            alt="Preview do prato"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        ) : (
                          <div className="text-center text-stone-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <p className="text-[11px]">Nenhuma imagem informada</p>
                          </div>
                        )}
                        {productForm.badge && (
                          <span className="absolute top-2 left-2 bg-amber-500 text-stone-950 font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            {productForm.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sugestões de Fotos em 1 Clique */}
                    <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                          <span>Sugestões Rápidas de Fotos Gastronômicas:</span>
                        </span>
                        <span className="text-[10px] text-orange-700">Clique para aplicar</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {photoPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, image: preset.url })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              productForm.image === preset.url
                                ? 'bg-orange-600 text-white shadow-2xs ring-1 ring-orange-400'
                                : 'bg-white text-stone-800 border border-stone-200 hover:border-orange-400 hover:bg-orange-50/50'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Addons / Opcionais do Prato */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-800 text-xs">Opcionais & Complementos</span>
                          <p className="text-[10px] text-stone-500">Ex: Ponto da carne, molhos extras, adicionais</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddAddonGroup}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Grupo</span>
                        </button>
                      </div>

                      {productForm.addonGroups && productForm.addonGroups.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {productForm.addonGroups.map((group) => (
                            <div key={group.id} className="p-2.5 bg-white border border-stone-200 rounded-xl space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={group.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductForm((prev) => ({
                                      ...prev,
                                      addonGroups: (prev.addonGroups || []).map((g) =>
                                        g.id === group.id ? { ...g, title: val } : g
                                      ),
                                    }));
                                  }}
                                  placeholder="Título (ex: Ponto da Carne)"
                                  className="flex-1 p-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAddonGroup(group.id)}
                                  className="text-stone-400 hover:text-red-600 p-1"
                                  title="Remover grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-1.5 pl-1">
                                {group.options.map((opt) => (
                                  <div key={opt.id} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={opt.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProductForm((prev) => ({
                                          ...prev,
                                          addonGroups: (prev.addonGroups || []).map((g) => {
                                            if (g.id === group.id) {
                                              return {
                                                ...g,
                                                options: g.options.map((o) =>
                                                  o.id === opt.id ? { ...o, name: val } : o
                                                ),
                                              };
                                            }
                                            return g;
                                          }),
                                        }));
                                      }}
                                      placeholder="Nome da opção (ex: Ao ponto)"
                                      className="flex-1 p-1 bg-stone-50 border border-stone-200 rounded text-[11px]"
                                    />
                                    <div className="flex items-center gap-1 w-24">
                                      <span className="text-[10px] text-stone-400 font-bold">+R$</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={opt.price}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setProductForm((prev) => ({
                                            ...prev,
                                            addonGroups: (prev.addonGroups || []).map((g) => {
                                              if (g.id === group.id) {
                                                return {
                                                  ...g,
                                                  options: g.options.map((o) =>
                                                    o.id === opt.id ? { ...o, price: val } : o
                                                  ),
                                                };
                                              }
                                              return g;
                                            }),
                                          }));
                                        }}
                                        className="w-full p-1 bg-stone-50 border border-stone-200 rounded text-[11px] font-mono font-bold"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOptionFromGroup(group.id, opt.id)}
                                      className="text-stone-300 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id)}
                                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 pt-0.5"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>+ Opção neste grupo</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">Nenhum adicional configurado para este prato.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-bold text-stone-700 text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? 'Salvar Alterações do Prato' : 'Cadastrar Prato no Cardápio'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRMAR EXCLUSÃO DE PRATO */}
        {productDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-xs space-y-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-extrabold text-stone-900 text-sm">Excluir Prato do Cardápio?</h4>
                <p className="text-stone-500 mt-1">
                  Tem certeza de que deseja remover <strong className="text-stone-800">"{productDeleteConfirm.name}"</strong>?
                  Essa ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(productDeleteConfirm.id)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface KdsOrderCardProps {
  order: Order;
  onPrint?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: React.ComponentType<{ className?: string }>;
}

const KdsOrderCard: React.FC<KdsOrderCardProps> = ({
  order,
  onPrint,
  onNext,
  nextLabel,
  nextIcon: NextIcon = CheckCircle,
}) => {
  const isDelivery = order.mode === 'delivery';

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-2xs hover:border-orange-300 transition-all space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
              isDelivery
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-orange-100 text-orange-900 border border-orange-200'
            }`}
          >
            {isDelivery ? '🛵 ENTREGA' : '🥡 RETIRADA'}
          </span>
          <span className="font-mono text-xs font-bold text-stone-700">#{order.code}</span>
        </div>

        <button
          onClick={onPrint}
          className="text-stone-400 hover:text-stone-800 p-1"
          title="Imprimir comanda térmica"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="font-bold text-xs text-stone-900">{order.customer.name}</p>
        {isDelivery && order.customer.neighborhood && (
          <p className="text-[11px] text-stone-500 line-clamp-1">
            📍 {order.customer.neighborhood}
          </p>
        )}
      </div>

      {/* Items preview */}
      <div className="border-t border-b border-stone-100 py-2 space-y-1 text-xs">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <div>
              <span className="font-bold text-stone-800">
                {it.quantity}x {it.product.name}
              </span>
              {it.notes && (
                <p className="text-[10px] text-orange-800 italic font-semibold">Obs: {it.notes}</p>
              )}
            </div>
            <span className="font-mono text-[11px] text-stone-500">
              {formatCurrencyBRL(it.totalPrice)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-black text-stone-900 font-mono">{formatCurrencyBRL(order.total)}</span>
        {onNext && nextLabel && (
          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-[11px] rounded-xl shadow-2xs transition-all"
          >
            <NextIcon className="w-3.5 h-3.5" />
            <span>{nextLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
