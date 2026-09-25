import React, { useState } from 'react';
import {
  User,
  ShoppingBag,
  MapPin,
  Clock,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Shield,
  Tag,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { SavedAddress, Order } from '../types/delivery';
import { fetchAddressByCep, formatCep, cleanCep } from '../utils/cep';
import { formatPhone } from '../utils/phone';

interface CustomerAreaProps {
  onBackToStore: () => void;
}

export const CustomerArea: React.FC<CustomerAreaProps> = ({ onBackToStore }) => {
  const {
    customerDetails,
    setCustomerDetails,
    orders,
    setActiveTrackingOrderId,
    addToCart,
    setIsCartOpen,
  } = useDelivery();

  const [savedAddresses] = useState<SavedAddress[]>([
    {
      id: 'addr-1',
      label: 'Casa',
      street: customerDetails.addressStreet || 'Rua Bela Cintra',
      number: customerDetails.addressNumber || '1240',
      complement: customerDetails.addressComplement || 'Apto 42B',
      neighborhood: customerDetails.neighborhood || 'Cerqueira César / Jardins',
      city: 'São Paulo - SP',
    },
    {
      id: 'addr-2',
      label: 'Trabalho',
      street: 'Av. Brigadeiro Faria Lima',
      number: '3477',
      complement: '14º Andar',
      neighborhood: 'Itaim Bibi / Moema',
      city: 'São Paulo - SP',
    },
  ]);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);

  const handleLookupCep = async (rawCep: string) => {
    const digits = cleanCep(rawCep);
    if (digits.length !== 8) return;
    setIsSearchingCep(true);
    setCepMessage(null);
    try {
      const address = await fetchAddressByCep(digits);
      setCustomerDetails((prev) => ({
        ...prev,
        cep: address.cep,
        addressStreet: address.street || prev.addressStreet,
        neighborhood: address.neighborhood || prev.neighborhood,
        city: address.city ? `${address.city} - ${address.state}` : prev.city,
      }));
      setCepMessage(`Endereço localizado: ${address.street}, ${address.neighborhood}`);
      setTimeout(() => setCepMessage(null), 4000);
    } catch {
      setCepMessage('CEP não encontrado. Preencha manualmente.');
      setTimeout(() => setCepMessage(null), 4000);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleUseAddress = (addr: SavedAddress) => {
    setCustomerDetails((prev) => ({
      ...prev,
      addressStreet: addr.street,
      addressNumber: addr.number,
      addressComplement: addr.complement,
      neighborhood: addr.neighborhood,
      city: addr.city,
    }));
    setFeedback(`Endereço "${addr.label}" selecionado para os próximos pedidos.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRepeatOrder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.quantity, item.selectedAddons, item.notes);
    });
    setIsCartOpen(true);
    setFeedback(`Itens do pedido #${order.code} adicionados à sacola!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-28">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 transition-colors"
              title="Voltar ao Cardápio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-stone-950 font-display">Área do Cliente</h1>
                <p className="text-[11px] text-stone-500">{customerDetails.name}</p>
              </div>
            </div>
          </div>

          <span className="text-xs text-stone-500 font-semibold">Cliente Verificado</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {feedback && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            <span>Seus Dados Cadastrais</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nome</label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) =>
                  setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-600">WhatsApp</label>
                <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-1.5 py-0.2 rounded-md">
                  Auto-organizado
                </span>
              </div>
              <input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) =>
                  setCustomerDetails((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))
                }
                placeholder="(11) 98765-4321"
                maxLength={19}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-mono font-medium"
              />
            </div>
          </div>

          {/* Customer Address Details with CEP */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                Endereço Padrão de Entrega
              </span>
              <span className="text-[10px] text-purple-800 bg-purple-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Auto-preenchimento por CEP
              </span>
            </div>

            {/* CEP Box */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                CEP (Código Postal)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    maxLength={9}
                    value={customerDetails.cep || ''}
                    onChange={(e) => {
                      const val = formatCep(e.target.value);
                      setCustomerDetails((prev) => ({ ...prev, cep: val }));
                      if (cleanCep(val).length === 8) {
                        handleLookupCep(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookupCep(customerDetails.cep || '');
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none transition-colors ${
                      isSearchingCep ? 'border-purple-600 ring-2 ring-purple-100' : 'border-stone-300 focus:border-purple-600'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupCep(customerDetails.cep || '')}
                  disabled={isSearchingCep || !customerDetails.cep}
                  className={`w-[110px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    isSearchingCep
                      ? 'bg-purple-700 text-white cursor-wait'
                      : 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed'
                  }`}
                >
                  {isSearchingCep ? (
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

              {isSearchingCep ? (
                <p className="text-[11px] font-semibold text-purple-900 bg-purple-100/90 border border-purple-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />
                  <span>Buscando endereço nos Correios...</span>
                </p>
              ) : cepMessage ? (
                <p className="text-[11px] font-semibold text-purple-900 bg-purple-100/90 border border-purple-300 px-2.5 py-1.5 rounded-xl">
                  {cepMessage}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1">Rua / Logradouro</label>
                <input
                  type="text"
                  value={customerDetails.addressStreet || ''}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({ ...prev, addressStreet: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Número</label>
                <input
                  type="text"
                  value={customerDetails.addressNumber || ''}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({ ...prev, addressNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Complemento</label>
                <input
                  type="text"
                  value={customerDetails.addressComplement || ''}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({ ...prev, addressComplement: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Bairro</label>
                <input
                  type="text"
                  value={customerDetails.neighborhood || ''}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({ ...prev, neighborhood: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Cidade - UF</label>
                <input
                  type="text"
                  value={customerDetails.city || ''}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Endereços Salvos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-amber-600" />
                      {addr.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 font-medium">
                    {addr.street}, {addr.number}
                    {addr.complement ? ` (${addr.complement})` : ''}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {addr.neighborhood} · {addr.city}
                  </p>
                </div>

                <button
                  onClick={() => handleUseAddress(addr)}
                  className="w-full py-1.5 px-3 bg-white hover:bg-stone-100 text-xs font-bold text-stone-800 rounded-xl border border-stone-300 transition-colors shadow-2xs"
                >
                  Usar Este Endereço
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order History */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Histórico de Pedidos ({orders.length})</span>
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-xs">
              Você ainda não realizou nenhum pedido.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-950 font-mono">
                          Pedido #{order.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'entregue'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {order.status === 'entregue' ? 'Entregue' : 'Em Andamento'}
                        </span>
                      </div>
                      <span className="text-xs text-stone-600 mt-0.5 block font-medium">
                        {order.merchant.name} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-amber-800 font-mono tabular-nums">
                      {formatCurrencyBRL(order.total)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600">
                    {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                    {order.status !== 'entregue' && (
                      <button
                        onClick={() => setActiveTrackingOrderId(order.id)}
                        className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Acompanhar Rastreio</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRepeatOrder(order)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pedir Novamente</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LGPD Trust Section */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 flex items-center gap-3 text-xs text-stone-600 shadow-2xs">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            Seus dados são protegidos conforme a LGPD brasileira e compartilhados unicamente com os estabelecimentos onde você faz pedidos.
          </p>
        </div>
      </main>
    </div>
  );
};
