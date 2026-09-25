import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  Truck,
  Flame,
  MessageCircle,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { formatCurrencyBRL } from '../utils/whatsapp';
import { OrderStatus } from '../types/delivery';

export const OrderTrackerModal: React.FC = () => {
  const { activeOrder, setActiveTrackingOrderId, updateOrderStatus } = useDelivery();

  const [routeProgress, setRouteProgress] = useState(35);

  useEffect(() => {
    if (!activeOrder) return;

    if (activeOrder.status === 'em_rota') {
      const interval = setInterval(() => {
        setRouteProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + 4;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [activeOrder?.status]);

  if (!activeOrder) return null;

  const STATUS_STEPS: {
    key: OrderStatus;
    label: string;
    sublabel: string;
    icon: React.ElementType;
  }[] = [
    {
      key: 'pendente',
      label: 'Pedido Recebido',
      sublabel: 'O estabelecimento foi notificado',
      icon: Clock,
    },
    {
      key: 'preparando',
      label: 'Em Preparo',
      sublabel: 'Cozinha preparando seus itens com carinho',
      icon: Flame,
    },
    {
      key: 'em_rota',
      label: activeOrder.mode === 'delivery' ? 'Saiu para Entrega' : 'Pronto para Retirada',
      sublabel:
        activeOrder.mode === 'delivery'
          ? 'Motoboy em deslocamento até você'
          : 'Pode se dirigir ao balcão',
      icon: Truck,
    },
    {
      key: 'entregue',
      label: activeOrder.mode === 'delivery' ? 'Pedido Entregue' : 'Pedido Concluído',
      sublabel: 'Bom apetite! Obrigado pela preferência',
      icon: CheckCircle,
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pendente':
        return 0;
      case 'preparando':
        return 1;
      case 'em_rota':
        return 2;
      case 'entregue':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(activeOrder.status);

  const handleNextStatus = () => {
    const statuses: OrderStatus[] = ['pendente', 'preparando', 'em_rota', 'entregue'];
    const nextIdx = (currentStepIdx + 1) % statuses.length;
    updateOrderStatus(activeOrder.id, statuses[nextIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 my-8">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Acompanhamento em Tempo Real
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-stone-950">
              Pedido #{activeOrder.code} · {activeOrder.merchant.name}
            </h2>
          </div>

          <button
            onClick={() => setActiveTrackingOrderId(null)}
            className="w-8 h-8 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Tracker Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Status Tracker Stepper */}
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs text-stone-500 font-semibold">Previsão de Entrega:</span>
                <p className="text-lg font-bold text-amber-800 tabular-nums">
                  {activeOrder.estimatedDeliveryTime}
                </p>
              </div>

              {/* Simulation test button */}
              <button
                type="button"
                onClick={handleNextStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                title="Avançar status (Modo de Demonstração)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Simular Próxima Etapa</span>
              </button>
            </div>

            {/* Steps Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-300">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                        isCurrent
                          ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/20 font-bold'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>

                    <div className="flex-1">
                      <h4
                        className={`text-sm font-bold leading-tight ${
                          isCurrent ? 'text-amber-800' : isPassed ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">{step.sublabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Simulated Courier Track when in route */}
          {activeOrder.status === 'em_rota' && activeOrder.mode === 'delivery' && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Entregador em Deslocamento</span>
                </span>
                <span className="text-amber-800 font-mono tabular-nums">
                  Aprox. 8 min até sua porta
                </span>
              </div>

              {/* Progress bar visual */}
              <div className="relative w-full h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${routeProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                <span>{activeOrder.merchant.name} (Origem)</span>
                <span>{activeOrder.customer.addressStreet || 'Seu Endereço'}</span>
              </div>

              {/* Courier info card */}
              {activeOrder.courier && (
                <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeOrder.courier.avatar}
                      alt={activeOrder.courier.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-stone-900">
                        {activeOrder.courier.name}
                      </h5>
                      <p className="text-[11px] text-stone-500">
                        {activeOrder.courier.vehicle} · Placa {activeOrder.courier.plate}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${activeOrder.courier.phone.replace(/\D/g, '')}`}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ligar</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address / Pickup Card */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>
                {activeOrder.mode === 'delivery' ? 'Local de Entrega' : 'Retirada no Balcão'}
              </span>
            </h4>
            {activeOrder.mode === 'delivery' ? (
              <p className="text-stone-800 font-medium">
                {activeOrder.customer.addressStreet}, Nº {activeOrder.customer.addressNumber}
                {activeOrder.customer.addressComplement
                  ? ` (${activeOrder.customer.addressComplement})`
                  : ''}{' '}
                - {activeOrder.customer.neighborhood || ''}
              </p>
            ) : (
              <p className="text-stone-800 font-medium">
                Retirar diretamente no balcão do restaurante: {activeOrder.merchant.address}
              </p>
            )}
          </div>

          {/* Itemized Order Slip */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Itens do Pedido ({activeOrder.items.length})
            </h4>

            <div className="space-y-2.5 divide-y divide-stone-200">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">
                      {item.quantity}x {item.product.name}
                    </span>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.selectedAddons.map((a) => a.optionName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-stone-700 font-semibold">
                    {formatCurrencyBRL(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal & Total */}
            <div className="pt-3 border-t border-stone-200 space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-stone-900 font-semibold">
                  {formatCurrencyBRL(activeOrder.subtotal)}
                </span>
              </div>
              {activeOrder.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span className="font-mono tabular-nums text-stone-900 font-semibold">
                    {formatCurrencyBRL(activeOrder.deliveryFee)}
                  </span>
                </div>
              )}
              {activeOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrencyBRL(activeOrder.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                <span>Total Pago / A Pagar</span>
                <span className="font-mono tabular-nums text-amber-800">
                  {formatCurrencyBRL(activeOrder.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <a
            href={`https://wa.me/${activeOrder.merchant.whatsapp}?text=${encodeURIComponent(
              `Olá! Gostaria de falar sobre o pedido #${activeOrder.code}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar com o Restaurante</span>
          </a>

          <button
            onClick={() => setActiveTrackingOrderId(null)}
            className="px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
