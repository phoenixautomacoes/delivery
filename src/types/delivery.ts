export type EstablishmentType = 'restaurante' | 'padaria' | 'lancheria' | 'pizzaria' | 'acaiteria';

export type OrderMode = 'delivery' | 'retirada';

export type OrderStatus = 'pendente' | 'preparando' | 'em_rota' | 'entregue' | 'cancelado';

export interface ProductAddonOption {
  id: string;
  name: string;
  price: number;
}

export interface ProductAddonGroup {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ProductAddonOption[];
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  accentGradient: string;
  badge?: string;
  popular?: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  addonGroups?: ProductAddonGroup[];
}

export interface DeliveryZone {
  neighborhood: string;
  fee: number;
  estimatedMinutes: string;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  type: EstablishmentType;
  slogan: string;
  logo: string;
  coverImage: string;
  accentColor: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  minOrder: number;
  isOpen: boolean;
  openingHours: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  deliveryZones: DeliveryZone[];
  categories: string[];
}

export interface CartItemAddon {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedAddons: CartItemAddon[];
  notes?: string;
  totalPrice: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
  tableNumber?: string;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';

export interface Order {
  id: string;
  code: string;
  merchant: Merchant;
  items: CartItem[];
  mode: OrderMode;
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    needChange?: boolean;
    changeFor?: number;
    pixCode?: string;
    pixPaid?: boolean;
  };
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  courier?: {
    name: string;
    vehicle: string;
    plate: string;
    phone: string;
    avatar: string;
  };
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed' | 'frete_gratis';
  value: number;
  minOrderValue: number;
  description: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  label: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'chamando_garcom' | 'pedindo_conta';
  activeOrderIds: string[];
  openedAt?: string;
  waiterNotes?: string;
  callReason?: string;
}

export type PortalType = 'cliente' | 'admin' | 'motoboy';

export type AppView = 'cardapio' | 'tracking' | 'customer';

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  cep?: string;
}

export interface RegisteredCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  registeredAt: string;
}

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  restaurant: Merchant;
  products: Product[];
  orders: Order[];
  customers: RegisteredCustomer[];
  deliveryZones: DeliveryZone[];
}

