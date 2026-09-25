import React from 'react';
import { ChefHat, Phone, MapPin, Clock, Bike, ShieldCheck } from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';

interface FooterProps {
  onSwitchPortal?: (portal: 'cliente' | 'admin' | 'motoboy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSwitchPortal }) => {
  const { restaurant } = useDelivery();

  return (
    <footer className="bg-white border-t border-stone-200 pt-12 pb-24 sm:pb-12 text-stone-600 text-xs shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="text-base font-extrabold text-stone-900 flex items-center gap-2 font-display">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
              {restaurant.name}
            </div>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
              {restaurant.slogan}
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <span>● Delivery Direto & Retirada Expressa</span>
            </div>
          </div>

          {/* Col 2: Atendimento e Modos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-950 uppercase tracking-wider mb-3">
              Modos de Atendimento
            </h4>
            <ul className="space-y-2 font-medium text-stone-600">
              <li className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Entrega em Domicílio (Delivery Próprio)</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                <span>Retirada Rápida no Balcão</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Rastreamento em Tempo Real via GPS</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Localização & Horários */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-950 uppercase tracking-wider mb-3">
              Onde Estamos & Contato
            </h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>{restaurant.address} - {restaurant.city}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                <span>{restaurant.openingHours}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>{restaurant.phone} · WhatsApp: (11) 98765-4321</span>
              </p>
            </div>
          </div>

          {/* Col 4: Acesso Operacional */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-950 uppercase tracking-wider mb-2">
              Acesso da Equipe
            </h4>
            <p className="text-xs text-stone-500">
              Painel para gerência, cozinha e entregadores.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onSwitchPortal?.('admin')}
                className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Painel Admin & KDS Cozinha</span>
              </button>
              <button
                onClick={() => onSwitchPortal?.('motoboy')}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Portal do Entregador (Motoboy)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
          <p>© {new Date().getFullYear()} {restaurant.name} · Sistema Proprietário para Restaurantes.</p>
          <p>Delivery Direto & KDS Operacional sem comissões de marketplaces.</p>
        </div>
      </div>
    </footer>
  );
};
