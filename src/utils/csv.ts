import { Product, RegisteredCustomer, Order } from '../types/delivery';

/**
 * Escapes a cell value for CSV (Brazilian Excel standard uses ';' delimiter)
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  if (str.includes(';') || str.includes('\n') || str.includes('"') || str.includes(',')) {
    return `"${str}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function downloadCsvFile(content: string, filename: string): void {
  // \uFEFF is the UTF-8 BOM so Excel opens accented Portuguese characters correctly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all restaurant products/dishes to an Excel CSV sheet
 */
export function exportProductsToCsv(products: Product[]): void {
  const headers = [
    'ID',
    'Nome do Prato / Produto',
    'Categoria',
    'Preço de Venda (R$)',
    'Preço Original / De (R$)',
    'Tempo de Preparo (min)',
    'Status no Cardápio',
    'Destaque Mais Pedido',
    'Selo / Tag',
    'Descrição',
    'URL da Imagem',
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.category,
    p.price.toFixed(2).replace('.', ','),
    p.originalPrice ? p.originalPrice.toFixed(2).replace('.', ',') : '',
    p.prepTimeMinutes || 20,
    p.isAvailable ? 'Disponível' : 'Pausado (Esgotado)',
    p.popular ? 'Sim' : 'Não',
    p.badge || '',
    p.description || '',
    p.image || '',
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(';'),
    ...rows.map((r) => r.map(escapeCsv).join(';')),
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(csvContent, `cardapio-restaurante-${dateStr}.csv`);
}

/**
 * Exports all registered customers to an Excel CSV sheet
 */
export function exportCustomersToCsv(customers: RegisteredCustomer[]): void {
  const headers = [
    'Nome Completo',
    'Telefone / WhatsApp',
    'E-mail',
    'Rua / Logradouro',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'CEP',
    'Total de Pedidos',
    'Total Gasto (R$)',
    'Observações do Cliente',
  ];

  const rows = customers.map((c) => [
    c.name,
    c.phone,
    c.email || '',
    c.addressStreet || '',
    c.addressNumber || '',
    c.addressComplement || '',
    c.neighborhood || '',
    c.city || '',
    c.cep || '',
    c.totalOrders || 0,
    (c.totalSpent || 0).toFixed(2).replace('.', ','),
    c.notes || '',
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(';'),
    ...rows.map((r) => r.map(escapeCsv).join(';')),
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(csvContent, `clientes-cadastrados-${dateStr}.csv`);
}

/**
 * Exports restaurant orders history to an Excel CSV sheet
 */
export function exportOrdersToCsv(orders: Order[]): void {
  const headers = [
    'Código do Pedido',
    'Data e Hora',
    'Status do Pedido',
    'Modalidade',
    'Nome do Cliente',
    'Telefone',
    'Bairro de Entrega',
    'Forma de Pagamento',
    'Taxa de Entrega (R$)',
    'Desconto (R$)',
    'Valor Total (R$)',
    'Resumo dos Itens',
  ];

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((it) => `${it.quantity}x ${it.product.name}`)
      .join(' + ');

    return [
      o.code,
      new Date(o.createdAt).toLocaleString('pt-BR'),
      o.status.toUpperCase(),
      o.mode === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão',
      o.customer.name,
      o.customer.phone,
      o.customer.neighborhood || '',
      o.paymentMethod.toUpperCase(),
      o.deliveryFee.toFixed(2).replace('.', ','),
      o.discount ? o.discount.toFixed(2).replace('.', ',') : '0,00',
      o.total.toFixed(2).replace('.', ','),
      itemsSummary,
    ];
  });

  const csvContent = [
    headers.map(escapeCsv).join(';'),
    ...rows.map((r) => r.map(escapeCsv).join(';')),
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(csvContent, `historico-pedidos-vendas-${dateStr}.csv`);
}

/**
 * Parses an uploaded CSV file into partial products for import
 */
export function parseProductsCsv(text: string): Partial<Product>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Determine delimiter: semicolon or comma
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const rows = lines.slice(1);
  const products: Partial<Product>[] = [];

  for (const row of rows) {
    const cols = row.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length >= 3 && cols[1]) {
      const priceStr = (cols[3] || '0').replace(',', '.');
      const originalPriceStr = (cols[4] || '').replace(',', '.');

      products.push({
        name: cols[1],
        category: cols[2] || 'Destaques do Chef',
        price: parseFloat(priceStr) || 0,
        originalPrice: originalPriceStr ? parseFloat(originalPriceStr) : undefined,
        prepTimeMinutes: parseInt(cols[5]) || 20,
        isAvailable: !cols[6] || cols[6].toLowerCase().includes('disp') || cols[6].toLowerCase().includes('ativo'),
        description: cols[9] || '',
        image: cols[10] || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      });
    }
  }

  return products;
}
