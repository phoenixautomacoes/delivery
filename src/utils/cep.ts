import { DeliveryZone } from '../types/delivery';

export interface CepAddressResult {
  cep: string;
  street: string; // logradouro
  neighborhood: string; // bairro
  city: string; // localidade / cidade
  state: string; // uf
  complement?: string;
  ibge?: string;
}

// In-memory cache to make repeated lookups instantaneous and prevent extra network calls
const cepCache = new Map<string, CepAddressResult>();

/**
 * Strips all non-digit characters and limits to 8 digits
 */
export function cleanCep(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 8);
}

/**
 * Formats a raw or partial string into Brazilian CEP format: 00000-000
 */
export function formatCep(raw: string): string {
  const digits = cleanCep(raw);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Returns true if clean CEP has exactly 8 digits
 */
export function isValidCep(raw: string): boolean {
  return cleanCep(raw).length === 8;
}

/**
 * Normalizes text for lenient comparison (removes accents, lowercase, removes symbols)
 */
export function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a neighborhood name returned from CEP against restaurant delivery zones
 */
export function findMatchingDeliveryZone(
  neighborhoodName: string,
  zones: DeliveryZone[]
): DeliveryZone | null {
  if (!neighborhoodName || !zones || zones.length === 0) return null;

  const normTarget = normalizeString(neighborhoodName);
  if (!normTarget) return null;

  // 1. Exact normalized match
  for (const zone of zones) {
    const normZone = normalizeString(zone.neighborhood);
    if (normZone === normTarget) {
      return zone;
    }
  }

  // 2. Zone contains neighborhood or neighborhood contains zone
  for (const zone of zones) {
    const normZone = normalizeString(zone.neighborhood);
    // e.g. "Cerqueira César / Jardins" contains "Cerqueira Cesar" or "Jardins"
    if (normZone.includes(normTarget) || normTarget.includes(normZone)) {
      return zone;
    }
  }

  // 3. Sub-segment match (split by / , - &)
  for (const zone of zones) {
    const parts = zone.neighborhood
      .split(/[\/\-&,]/)
      .map((p) => normalizeString(p))
      .filter(Boolean);
    if (parts.some((part) => part.includes(normTarget) || normTarget.includes(part))) {
      return zone;
    }
  }

  return null;
}

/**
 * Fetches Brazilian address data from CEP.
 * Tries ViaCEP first, falls back to BrasilAPI if ViaCEP is down or errors.
 */
export async function fetchAddressByCep(rawCep: string): Promise<CepAddressResult> {
  const digits = cleanCep(rawCep);
  if (digits.length !== 8) {
    throw new Error('O CEP deve conter 8 dígitos numéricos.');
  }

  // Check cache
  if (cepCache.has(digits)) {
    return cepCache.get(digits)!;
  }

  let result: CepAddressResult | null = null;
  let lastError: Error | null = null;

  // 1. Try ViaCEP
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.erro) {
        result = {
          cep: formatCep(digits),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          complement: data.complemento || '',
          ibge: data.ibge || '',
        };
      } else {
        throw new Error('CEP não localizado na base dos Correios.');
      }
    }
  } catch (err: any) {
    lastError = err;
  }

  // 2. Fallback to BrasilAPI if ViaCEP failed or had network timeout
  if (!result) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        result = {
          cep: formatCep(digits),
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
        };
      } else {
        throw new Error('CEP não encontrado nos serviços de consulta.');
      }
    } catch (err: any) {
      if (!lastError) lastError = err;
    }
  }

  if (result) {
    cepCache.set(digits, result);
    return result;
  }

  throw (
    lastError ||
    new Error('Não foi possível consultar o CEP no momento. Verifique sua conexão ou preencha manualmente.')
  );
}
