import React, { useState, useMemo } from 'react';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Phone,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { Order } from '../types/delivery';

interface DriverPortalProps {
  onBackToStore: () => void;
  onLogout?: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ onBackToStore, onLogout }) => {
  const { orders, updateOrderStatus } = useDelivery();
  const [isOnline, setIsOnline] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const deliveryOrders = useMemo(() => {
    return orders.filter((o) => o.mode === 'delivery');
  }, [orders]);

  const activeDeliveries = useMemo(() => {
    return deliveryOrders.filter((o) => o.status === 'preparando' || o.status === 'em_rota');
  }, [deliveryOrders]);

  const completedDeliveries = useMemo(() => {
    return deliveryOrders.filter((o) => o.status === 'entregue');
  }, [deliveryOrders]);

  const driverEarnings = useMemo(() => {
    return completedDeliveries.reduce((sum, o) => sum + (o.deliveryFee > 0 ? o.deliveryFee : 6.0), 0);
  }, [completedDeliveries]);

  const handleStartDelivery = (orderId: string) => {
    updateOrderStatus(orderId, 'em_rota');
    setFeedbackMsg(`Entrega do pedido iniciada! O cliente foi notificado em tempo real.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCompleteDelivery = (order: Order) => {
    updateOrderStatus(order.id, 'entregue');
    setFeedbackMsg(`Pedido #${order.code} entregue com sucesso! Taxa creditada.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
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
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-stone-950 font-display">Portal do Entregador</h1>
                <p className="text-[11px] text-stone-500">Rafael Motoboy · CG 160 (BRA-3X92)</p>
              </div>
            </div>
          </div>

          {/* Online/Offline Toggle & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-stone-200 text-stone-600 border border-stone-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'}`}
              />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
                title="Desconectar e sair do app"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {feedbackMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Motoboy Daily Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Ganhos em Taxas</span>
            <div className="text-xl font-black text-emerald-700 font-mono tabular-nums mt-0.5">
              {formatCurrencyBRL(driverEarnings)}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Entregas Concluídas</span>
            <div className="text-xl font-black text-stone-900 font-mono tabular-nums mt-0.5">
              {completedDeliveries.length} corridas
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Na Fila de Entrega</span>
            <div className="text-xl font-black text-amber-800 font-mono tabular-nums mt-0.5">
              {activeDeliveries.length} ativas
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-semibold">Avaliação Média</span>
            <div className="text-xl font-black text-yellow-600 font-mono tabular-nums mt-0.5">
              5.0 ⭐
            </div>
          </div>
        </div>

        {/* Active Assigned Deliveries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-950 font-display flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Entregas em Andamento ({activeDeliveries.length})</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Atualização em tempo real</span>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-2 shadow-2xs">
              <Bike className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800">Nenhuma entrega ativa no momento</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Assim que a cozinha concluir o preparo de novos pedidos delivery, eles aparecerão aqui para você despachar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((order) => {
                const fullAddress = `${order.customer.addressStreet}, ${order.customer.addressNumber} - ${order.customer.neighborhood}, ${order.customer.city || 'São Paulo'}`;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;
                const cleanPhone = order.customer.phone.replace(/\D/g, '');

                return (
                  <div
                    key={order.id}
                    className="p-5 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-sm"
                  >
                    {/* Top Order Code & Status */}
                    <div className="flex items-start justify-between pb-3 border-b border-stone-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-stone-950 font-mono">
                            #{order.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              order.status === 'em_rota'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {order.status === 'em_rota' ? 'Em Deslocamento' : 'Pronto na Cozinha'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-600 mt-0.5 block">
                          Retirar em: <strong>{order.merchant.name}</strong> ({order.merchant.address})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                          Taxa: {formatCurrencyBRL(order.deliveryFee > 0 ? order.deliveryFee : 6.0)}
                        </span>
                        <span className="text-[10px] text-stone-500 block uppercase font-medium">
                          Pgto: {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Customer Destination Card */}
                    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                            Destino de Entrega:
                          </span>
                          <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                            {order.customer.name}
                          </h4>
                          <p className="text-xs text-stone-700 mt-0.5 leading-snug">
                            {fullAddress}
                            {order.customer.addressComplement && (
                              <span className="text-amber-800 font-semibold">
                                {' '}
                                ({order.customer.addressComplement})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Direct Call & WhatsApp Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-950 transition-colors shadow-2xs"
                            title="Ligar para o cliente"
                          >
                            <Phone className="w-4 h-4 text-emerald-600" />
                          </a>
                          <a
                            href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá, ${order.customer.name}! Sou o Rafael, entregador do seu pedido #${order.code} do ${order.merchant.name}. Estou a caminho!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors shadow-2xs"
                            title="WhatsApp do cliente"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* GPS Route Launchers */}
                      <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3 text-stone-400" />
                        </a>
                        <a
                          href={wazeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Waze</span>
                          <ExternalLink className="w-3 h-3 text-stone-400" />
                        </a>
                      </div>
                    </div>

                    {/* Volumes Preview */}
                    <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1">
                      <div className="font-semibold text-stone-800">
                        Volumes ({order.items.reduce((s, i) => s + i.quantity, 0)} itens):
                      </div>
                      <p className="line-clamp-2">
                        {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(' · ')}
                      </p>
                    </div>

                    {/* Motoboy Action Stepper */}
                    <div>
                      {order.status === 'preparando' ? (
                        <button
                          onClick={() => handleStartDelivery(order.id)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Pegar Pedido & Iniciar Rota de Entrega</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteDelivery(order)}
                          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Entrega ao Cliente (#{order.code})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Deliveries History */}
        {completedDeliveries.length > 0 && (
          <div className="pt-6 border-t border-stone-300 space-y-3">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
              Histórico de Entregas Hoje ({completedDeliveries.length})
            </h3>
            <div className="space-y-2">
              {completedDeliveries.map((cOrder) => (
                <div
                  key={cOrder.id}
                  className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-stone-950">Pedido #{cOrder.code}</span>
                      <span className="text-stone-500 block text-[11px]">
                        {cOrder.customer.name} · {cOrder.customer.neighborhood}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 tabular-nums">
                    +{formatCurrencyBRL(cOrder.deliveryFee > 0 ? cOrder.deliveryFee : 6.0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
