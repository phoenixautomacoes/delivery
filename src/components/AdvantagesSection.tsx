import React from 'react';
import {
  Percent,
  MessageSquare,
  Flame,
  Bike,
  Users,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const AdvantagesSection: React.FC = () => {
  const ADVANTAGES = [
    {
      icon: Percent,
      title: '0% de Comissão Abusiva',
      description:
        'Não perca de 27% a 32% do faturamento para marketplaces tradicionais. Todo o lucro do prato fica com o seu negócio.',
      stat: 'Economia média de R$ 6.200/mês',
    },
    {
      icon: MessageSquare,
      title: 'Integração Direta com WhatsApp',
      description:
        'Pedidos chegam formatados, itemizados, com cálculo automático de entrega por bairro e link de rastreio instantâneo.',
      stat: 'Redução de 70% no tempo de atendimento',
    },
    {
      icon: Flame,
      title: 'KDS & Gestor de Pedidos em Tempo Real',
      description:
        'Painel para cozinha e expedição com aviso sonoro para novos pedidos e impressão de comanda térmica 80mm com 1 clique.',
      stat: 'Menos erros na cozinha e fila organizada',
    },
    {
      icon: Bike,
      title: 'Rastreamento ao Vivo & App do Motoboy',
      description:
        'Seus clientes acompanham o trajeto do entregador em tempo real e seu entregador tem um portal dedicado para rotas e entregas.',
      stat: 'Zero ligações de "onde está meu pedido?"',
    },
    {
      icon: Users,
      title: 'Base de Clientes 100% Sua',
      description:
        'Diferente do iFood, você tem o telefone, WhatsApp e histórico de pedidos para criar promoções e fidelizar seu público.',
      stat: 'Retenção direta sem intermediários',
    },
    {
      icon: ShieldCheck,
      title: 'PIX Instantâneo & Antifraude',
      description:
        'QR Code Dinâmico e Copia e Cola gerados no ato do checkout. Agilidade no pagamento e confirmação imediata.',
      stat: 'Recebimento no mesmo segundo na sua conta',
    },
  ];

  return (
    <section className="py-16 bg-stone-100/70 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3 border border-amber-300">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            <span>Feito para a Realidade Brasileira</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-display text-balance">
            Por que este sistema revoluciona a operação do seu negócio?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
            Desenvolvido com base no que há de mais moderno em plataformas de delivery direto, sem amarras e sem mensalidades predatórias.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADVANTAGES.map((adv, idx) => {
            const Icon = adv.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
                    <Icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <h3 className="text-base font-bold text-stone-950 font-display">{adv.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{adv.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 text-[11px] font-bold text-emerald-700">
                  {adv.stat}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
