import { Order } from '../types/delivery';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateWhatsAppOrderMessage(order: Order): string {
  const merchantName = order.merchant.name;
  const orderId = order.code;
  const customer = order.customer;
  const modeLabel =
    order.mode === 'delivery'
      ? '🛵 Entrega em Domicílio'
      : order.mode === 'retirada'
      ? '🛍️ Retirada no Balcão'
      : `🍽️ Consumo no Local (Mesa ${customer.tableNumber || 'S/N'})`;

  let paymentLabel = '';
  switch (order.paymentMethod) {
    case 'pix':
      paymentLabel = '⚡ PIX Instantâneo';
      break;
    case 'cartao_credito':
      paymentLabel = '💳 Cartão de Crédito (Levar maquininha)';
      break;
    case 'cartao_debito':
      paymentLabel = '💳 Cartão de Débito (Levar maquininha)';
      break;
    case 'dinheiro':
      paymentLabel = order.paymentDetails?.needChange
        ? `💵 Dinheiro (Troco para ${formatCurrencyBRL(order.paymentDetails.changeFor || 0)})`
        : '💵 Dinheiro (Não precisa de troco)';
      break;
  }

  const itemsFormatted = order.items
    .map((item, index) => {
      let itemStr = `${index + 1}. *${item.quantity}x ${item.product.name}* - ${formatCurrencyBRL(item.totalPrice)}`;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        const addonsStr = item.selectedAddons
          .map((a) => `   ▫️ ${a.optionName}${a.price > 0 ? ` (+${formatCurrencyBRL(a.price)})` : ''}`)
          .join('\n');
        itemStr += `\n${addonsStr}`;
      }

      if (item.notes && item.notes.trim()) {
        itemStr += `\n   📝 _Obs: ${item.notes.trim()}_`;
      }

      return itemStr;
    })
    .join('\n\n');

  let addressBlock = '';
  if (order.mode === 'delivery') {
    addressBlock = `
📍 *Endereço de Entrega:*
Rua: ${customer.addressStreet || ''}, Nº ${customer.addressNumber || ''}
${customer.addressComplement ? `Comp: ${customer.addressComplement}\n` : ''}Bairro: ${customer.neighborhood || ''}
Cidade: ${customer.city || 'São Paulo - SP'}`;
  } else {
    addressBlock = `
🛍️ *Modo:* Retirada direta no balcão`;
  }

  const message = `👋 Olá, *${merchantName}*!
Gostaria de confirmar meu pedido feito pelo cardápio digital:

*PEDIDO #${orderId}*
━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${customer.name}
📱 *WhatsApp:* ${customer.phone}
${addressBlock}

🛍️ *ITENS DO PEDIDO:*
${itemsFormatted}

━━━━━━━━━━━━━━━━━━
💵 *RESUMO FINANCEIRO:*
Subtotal: ${formatCurrencyBRL(order.subtotal)}
Taxa de Entrega: ${order.deliveryFee > 0 ? formatCurrencyBRL(order.deliveryFee) : 'GRÁTIS'}
${order.discount > 0 ? `Desconto (${order.couponCode || 'Cupom'}): -${formatCurrencyBRL(order.discount)}\n` : ''}*TOTAL: ${formatCurrencyBRL(order.total)}*

💳 *Forma de Pagamento:*
${paymentLabel}

${order.status === 'pendente' ? '⏳ Aguardo confirmação e tempo estimado para preparo!' : '✅ Pedido em processamento!'}
Obrigado!`;

  return message;
}

export function getWhatsAppShareUrl(phone: string, message: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55')) {
    cleanPhone = `55${cleanPhone}`;
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
