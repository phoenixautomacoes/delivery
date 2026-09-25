import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Merchant,
  Product,
  CartItem,
  CartItemAddon,
  Order,
  OrderMode,
  OrderStatus,
  CustomerDetails,
  PaymentMethod,
  Coupon,
  RestaurantTable,
  DeliveryZone,
  RegisteredCustomer,
  DatabaseBackup,
} from '../types/delivery';
import {
  RESTAURANT_DATA,
  MOCK_PRODUCTS,
  MOCK_TABLES,
  MOCK_COUPONS,
  INITIAL_ORDERS,
  MOCK_CUSTOMERS,
} from '../data/mockData';
import { soundEffects } from '../utils/sound';
import { formatPhone } from '../utils/phone';

interface DeliveryContextType {
  // Restaurant Profile & Settings
  restaurant: Merchant;
  merchants: Merchant[]; // compatibility helper
  activeMerchant: Merchant;
  setActiveMerchant: (merchant: Merchant | null) => void;
  updateRestaurantSettings: (updated: Partial<Merchant>) => void;

  // Delivery Zones & Neighborhoods
  addDeliveryZone: (zone: DeliveryZone) => void;
  updateDeliveryZone: (index: number, zone: DeliveryZone) => void;
  deleteDeliveryZone: (index: number) => void;

  // Catalog
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (productId: string) => void;
  toggleMerchantOpen: () => void;

  // Customers CRM & Database
  customers: RegisteredCustomer[];
  addCustomer: (cust: Omit<RegisteredCustomer, 'id' | 'registeredAt'>) => RegisteredCustomer;
  updateCustomer: (id: string, updated: Partial<RegisteredCustomer>) => void;
  deleteCustomer: (id: string) => void;

  // Database Backup, Export & Import
  exportDatabaseBackup: () => DatabaseBackup;
  importDatabaseBackup: (backup: DatabaseBackup) => boolean;
  resetToDefaultData: () => void;

  // Tables Management (Compatibility)
  tables: RestaurantTable[];
  selectedTableNumber: number | null;
  setSelectedTableNumber: (tableNum: number | null) => void;
  callWaiter: (tableNumber: number, reason?: string) => void;
  requestTableBill: (tableNumber: number) => void;
  freeTable: (tableNumber: number) => void;
  getTableOrders: (tableNumber: number) => Order[];

  // Cart & Order Modes
  cart: CartItem[];
  cartMerchant: Merchant;
  orderMode: OrderMode;
  setOrderMode: (mode: OrderMode) => void;
  customerDetails: CustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (neighborhood: string) => void;

  // Cart Actions
  addToCart: (product: Product, quantity: number, addons: CartItemAddon[], notes?: string) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Totals
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  cartItemCount: number;

  // Modals & Navigation
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isKdsOpen: boolean;
  setIsKdsOpen: (open: boolean) => void;
  isTableQrOpen: boolean;
  setIsTableQrOpen: (open: boolean) => void;
  activeTrackingOrderId: string | null;
  setActiveTrackingOrderId: (id: string | null) => void;
  activeOrder: Order | null;

  // Orders & KDS
  orders: Order[];
  createOrder: (
    paymentMethod: PaymentMethod,
    paymentDetails?: { needChange?: boolean; changeFor?: number }
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const STORAGE_KEY_RESTAURANT = 'querodelivery_restaurant_profile_v2';
const STORAGE_KEY_PRODUCTS = 'querodelivery_restaurant_products_v2';
const STORAGE_KEY_CUSTOMERS = 'querodelivery_restaurant_customers_v2';
const STORAGE_KEY_ORDERS = 'querodelivery_restaurant_orders_v2';
const STORAGE_KEY_CUSTOMER = 'querodelivery_restaurant_customer_v2';
const STORAGE_KEY_TABLES = 'querodelivery_restaurant_tables_v2';

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurant, setRestaurant] = useState<Merchant>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESTAURANT);
      const data = saved ? JSON.parse(saved) : RESTAURANT_DATA;
      return {
        ...data,
        phone: formatPhone(data.phone),
        whatsapp: formatPhone(data.whatsapp),
      };
    } catch {
      return {
        ...RESTAURANT_DATA,
        phone: formatPhone(RESTAURANT_DATA.phone),
        whatsapp: formatPhone(RESTAURANT_DATA.whatsapp),
      };
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<RegisteredCustomer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
    } catch {
      return MOCK_CUSTOMERS;
    }
  });

  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TABLES);
      return saved ? JSON.parse(saved) : MOCK_TABLES;
    } catch {
      return MOCK_TABLES;
    }
  });

  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(4);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>('delivery');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(() => {
    return restaurant.deliveryZones[0]?.neighborhood || 'Cerqueira César / Jardins';
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMER);
      return saved
        ? JSON.parse(saved)
        : {
            name: 'Lucas Barcellos',
            phone: '(11) 98765-4321',
            addressStreet: 'Alameda Santos',
            addressNumber: '1420',
            addressComplement: 'Apto 101',
            neighborhood: 'Cerqueira César / Jardins',
            city: 'São Paulo - SP',
            cep: '01418-100',
          };
    } catch {
      return {
        name: 'Lucas Barcellos',
        phone: '(11) 98765-4321',
        addressStreet: 'Alameda Santos',
        addressNumber: '1420',
        addressComplement: 'Apto 101',
        neighborhood: 'Cerqueira César / Jardins',
        city: 'São Paulo - SP',
        cep: '01418-100',
      };
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isKdsOpen, setIsKdsOpen] = useState<boolean>(false);
  const [isTableQrOpen, setIsTableQrOpen] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESTAURANT, JSON.stringify(restaurant));
    } catch (e) {
      console.error('Error persisting restaurant profile', e);
    }
  }, [restaurant]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error persisting products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Error persisting customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error persisting orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
    } catch (e) {
      console.error('Error persisting tables', e);
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customerDetails));
    } catch (e) {
      console.error('Error persisting customer', e);
    }
  }, [customerDetails]);

  // Restaurant Settings Updaters
  const updateRestaurantSettings = (updated: Partial<Merchant>) => {
    setRestaurant((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // Delivery Zones Management
  const addDeliveryZone = (zone: DeliveryZone) => {
    setRestaurant((prev) => ({
      ...prev,
      deliveryZones: [...prev.deliveryZones, zone],
    }));
  };

  const updateDeliveryZone = (index: number, zone: DeliveryZone) => {
    setRestaurant((prev) => {
      const nextZones = [...prev.deliveryZones];
      nextZones[index] = zone;
      return {
        ...prev,
        deliveryZones: nextZones,
      };
    });
  };

  const deleteDeliveryZone = (index: number) => {
    setRestaurant((prev) => {
      const nextZones = prev.deliveryZones.filter((_, i) => i !== index);
      return {
        ...prev,
        deliveryZones: nextZones,
      };
    });
  };

  // Customer Management (CRM)
  const addCustomer = (cust: Omit<RegisteredCustomer, 'id' | 'registeredAt'>): RegisteredCustomer => {
    const newCust: RegisteredCustomer = {
      ...cust,
      id: `cust-${Date.now()}`,
      registeredAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updated: Partial<RegisteredCustomer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Database Backup, Export and Import
  const exportDatabaseBackup = (): DatabaseBackup => {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      restaurant,
      products,
      orders,
      customers,
      deliveryZones: restaurant.deliveryZones,
    };
  };

  const importDatabaseBackup = (backup: DatabaseBackup): boolean => {
    try {
      if (!backup || !backup.restaurant || !Array.isArray(backup.products)) {
        return false;
      }
      if (backup.restaurant) setRestaurant(backup.restaurant);
      if (Array.isArray(backup.products)) setProducts(backup.products);
      if (Array.isArray(backup.orders)) setOrders(backup.orders);
      if (Array.isArray(backup.customers)) setCustomers(backup.customers);
      return true;
    } catch (err) {
      console.error('Failed to import database backup', err);
      return false;
    }
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEY_RESTAURANT);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    setRestaurant(RESTAURANT_DATA);
    setProducts(MOCK_PRODUCTS);
    setCustomers(MOCK_CUSTOMERS);
    setOrders(INITIAL_ORDERS);
  };

  // Sync selected table number to customer details
  useEffect(() => {
    if (selectedTableNumber) {
      setCustomerDetails((prev) => ({
        ...prev,
        tableNumber: String(selectedTableNumber),
      }));
    }
  }, [selectedTableNumber]);

  // Cart functions
  const addToCart = (
    product: Product,
    quantity: number,
    addons: CartItemAddon[],
    notes?: string
  ) => {
    const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = product.price + addonsTotal;
    const itemTotal = unitPrice * quantity;

    const cartItemId = `${product.id}-${addons.map((a) => a.optionId).sort().join('-')}-${notes || ''}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + quantity;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        };
        return copy;
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          quantity,
          selectedAddons: addons,
          notes,
          totalPrice: itemTotal,
        },
      ];
    });

    soundEffects.playItemAdded();
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const unitPrice = item.totalPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalPrice: unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (orderMode !== 'delivery') return 0;
    if (appliedCoupon?.discountType === 'frete_gratis') return 0;
    const zone = restaurant.deliveryZones.find((z) => z.neighborhood === selectedNeighborhood);
    return zone ? zone.fee : 7.0;
  }, [orderMode, appliedCoupon, selectedNeighborhood, restaurant.deliveryZones]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    }
    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.value, subtotal);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee - discount);
  }, [subtotal, deliveryFee, discount]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Coupons
  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    const found = MOCK_COUPONS.find((c) => c.code === clean);
    if (!found) {
      return { success: false, message: 'Cupom inválido ou expirado.' };
    }
    if (subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Pedido mínimo de R$ ${found.minOrderValue.toFixed(2)} para este cupom.`,
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Cupom ${found.code} aplicado com sucesso!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Table actions (Mesa & Garçom)
  const callWaiter = (tableNumber: number, reason?: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.number === tableNumber) {
          return {
            ...t,
            status: 'chamando_garcom',
            callReason: reason || 'Solicitou atendimento do garçom na mesa',
          };
        }
        return t;
      })
    );
    soundEffects.playBell();
  };

  const requestTableBill = (tableNumber: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.number === tableNumber) {
          return {
            ...t,
            status: 'pedindo_conta',
          };
        }
        return t;
      })
    );
    soundEffects.playBell();
  };

  const freeTable = (tableNumber: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.number === tableNumber) {
          return {
            ...t,
            status: 'livre',
            activeOrderIds: [],
            openedAt: undefined,
            callReason: undefined,
          };
        }
        return t;
      })
    );
  };

  const getTableOrders = (_tableNumber: number): Order[] => {
    return [];
  };

  // Create Order
  const createOrder = (
    paymentMethod: PaymentMethod,
    paymentDetails?: { needChange?: boolean; changeFor?: number }
  ): Order => {
    const isDeliv = orderMode === 'delivery';
    const orderCodePrefix = isDeliv ? 'DEL' : 'BAL';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `${orderCodePrefix}-${randomDigits}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code,
      merchant: restaurant,
      items: [...cart],
      mode: orderMode,
      customer: {
        ...customerDetails,
      },
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        pixPaid: paymentMethod === 'pix',
      },
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode: appliedCoupon?.code,
      status: 'pendente',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: isDeliv ? '30-45 min' : '15-20 min no balcão',
      courier: isDeliv
        ? {
            name: 'Rodrigo Silva (Entregador do Restaurante)',
            vehicle: 'Honda CG 160 Titan Preta',
            plate: 'BRA-3X92',
            phone: '(11) 97722-1100',
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          }
        : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Automatically sync customer in CRM database
    setCustomers((prev) => {
      const cleanPhone = (customerDetails.phone || '').replace(/\D/g, '');
      const existingIndex = prev.findIndex((c) => {
        const cPhone = c.phone.replace(/\D/g, '');
        return (
          (cleanPhone.length >= 8 && cPhone.length >= 8 && cleanPhone === cPhone) ||
          (customerDetails.name &&
            c.name.trim().toLowerCase() === customerDetails.name.trim().toLowerCase())
        );
      });

      if (existingIndex >= 0) {
        const copy = [...prev];
        const existing = copy[existingIndex];
        copy[existingIndex] = {
          ...existing,
          name: customerDetails.name || existing.name,
          phone: formatPhone(customerDetails.phone) || existing.phone,
          addressStreet: customerDetails.addressStreet || existing.addressStreet,
          addressNumber: customerDetails.addressNumber || existing.addressNumber,
          addressComplement: customerDetails.addressComplement || existing.addressComplement,
          neighborhood: customerDetails.neighborhood || existing.neighborhood,
          city: customerDetails.city || existing.city,
          cep: customerDetails.cep || existing.cep,
          totalOrders: existing.totalOrders + 1,
          totalSpent: existing.totalSpent + total,
          lastOrderDate: new Date().toISOString(),
        };
        return copy;
      } else {
        const newCustomer: RegisteredCustomer = {
          id: `cust-${Date.now()}`,
          name: customerDetails.name || 'Cliente Novo',
          phone: formatPhone(customerDetails.phone) || '',
          addressStreet: customerDetails.addressStreet,
          addressNumber: customerDetails.addressNumber,
          addressComplement: customerDetails.addressComplement,
          neighborhood: customerDetails.neighborhood,
          city: customerDetails.city,
          cep: customerDetails.cep,
          totalOrders: 1,
          totalSpent: total,
          lastOrderDate: new Date().toISOString(),
          registeredAt: new Date().toISOString(),
        };
        return [newCustomer, ...prev];
      }
    });

    clearCart();
    soundEffects.playOrderSuccess();
    setActiveTrackingOrderId(newOrder.id);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return { ...order, status };
        }
        return order;
      })
    );
    soundEffects.playStatusUpdate();
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
  };

  const addProduct = (prodData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      merchantId: restaurant.id,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Ensure category exists in restaurant categories
    if (prodData.category && !restaurant.categories.includes(prodData.category)) {
      setRestaurant((prev) => ({
        ...prev,
        categories: [...prev.categories, prodData.category],
      }));
    }

    return newProduct;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );

    if (updated.category && !restaurant.categories.includes(updated.category)) {
      setRestaurant((prev) => ({
        ...prev,
        categories: [...prev.categories, updated.category!],
      }));
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleMerchantOpen = () => {
    setRestaurant((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const activeOrder = useMemo(() => {
    if (activeTrackingOrderId) {
      return orders.find((o) => o.id === activeTrackingOrderId) || null;
    }
    return orders[0] || null;
  }, [orders, activeTrackingOrderId]);

  return (
    <DeliveryContext.Provider
      value={{
        restaurant,
        merchants: [restaurant],
        activeMerchant: restaurant,
        setActiveMerchant: () => {},
        updateRestaurantSettings,

        addDeliveryZone,
        updateDeliveryZone,
        deleteDeliveryZone,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        toggleMerchantOpen,

        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        exportDatabaseBackup,
        importDatabaseBackup,
        resetToDefaultData,

        tables,
        selectedTableNumber,
        setSelectedTableNumber,
        callWaiter,
        requestTableBill,
        freeTable,
        getTableOrders,

        cart,
        cartMerchant: restaurant,
        orderMode,
        setOrderMode,
        customerDetails,
        setCustomerDetails,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        selectedNeighborhood,
        setSelectedNeighborhood,

        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,

        subtotal,
        deliveryFee,
        discount,
        total,
        cartItemCount,

        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isKdsOpen,
        setIsKdsOpen,
        isTableQrOpen,
        setIsTableQrOpen,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        activeOrder,

        orders,
        createOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};
