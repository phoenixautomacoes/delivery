import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Send,
  CheckCircle2,
  Copy,
  Check,
  MapPin,
  Utensils,
  Phone,
  User,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDelivery } from '../context/DeliveryContext';
import { PaymentMethod } from '../types/delivery';
import { formatCurrencyBRL, generateWhatsAppOrderMessage, getWhatsAppShareUrl } from '../utils/whatsapp';
import { generatePixCopiaECola, generatePixQrCodeSvg } from '../utils/pix';
import { fetchAddressByCep, formatCep, cleanCep, findMatchingDeliveryZone } from '../utils/cep';
import { formatPhone } from '../utils/phone';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartMerchant,
    orderMode,
    customerDetails,
    setCustomerDetails,
    subtotal,
    deliveryFee,
    discount,
    total,
    createOrder,
    selectedNeighborhood,
    setSelectedNeighborhood,
  } = useDelivery();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needChange, setNeedChange] = useState(false);
  const [changeFor, setChangeFor] = useState<number>(50);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CEP search state
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Form errors
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [streetError, setStreetError] = useState(false);
  const [numberError, setNumberError] = useState(false);

  // Simulated dynamic PIX payload
  const pixCopiaCola = useMemo(() => {
    return generatePixCopiaECola({
      merchantName: cartMerchant?.name || 'RESTAURANTE',
      pixKey: cartMerchant?.whatsapp || '11987654321',
      city: 'SAO PAULO',
      amount: total,
      txId: `QUD${Date.now().toString().slice(-6)}`,
    });
  }, [cartMerchant, total]);

  const pixQrSvg = useMemo(() => {
    return generatePixQrCodeSvg(pixCopiaCola);
  }, [pixCopiaCola]);

  if (!isCheckoutOpen || !cartMerchant) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleLookupCep = async (rawCep: string) => {
    const digits = cleanCep(rawCep);
    if (digits.length !== 8) {
      setCepFeedback({
        type: 'error',
        message: 'Digite os 8 números do CEP (ex: 01418-100)',
      });
      return;
    }

    setIsSearchingCep(true);
    setCepFeedback(null);

    try {
      const address = await fetchAddressByCep(digits);

      setCustomerDetails((prev) => ({
        ...prev,
        cep: address.cep,
        addressStreet: address.street || prev.addressStreet || '',
        city: address.city ? `${address.city} - ${address.state}` : prev.city,
        neighborhood: address.neighborhood || prev.neighborhood || '',
      }));

      if (streetError) setStreetError(false);

      // Match neighborhood in restaurant delivery zones
      const matchedZone = findMatchingDeliveryZone(address.neighborhood, cartMerchant.deliveryZones);
      if (matchedZone) {
        setSelectedNeighborhood(matchedZone.neighborhood);
        setCustomerDetails((prev) => ({
          ...prev,
          neighborhood: matchedZone.neighborhood,
        }));
        setCepFeedback({
          type: 'success',
          message: `Endereço localizado! Bairro atendido: "${matchedZone.neighborhood}" (Taxa: ${
            matchedZone.fee === 0 ? 'Grátis' : formatCurrencyBRL(matchedZone.fee)
          })`,
        });
      } else {
        setCepFeedback({
          type: 'info',
          message: `Endereço localizado: ${address.street}, ${address.neighborhood}. Selecione o bairro abaixo para calcular a taxa.`,
        });
      }

      // Automatically focus the number input so user can quickly type their house/apt number
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      setCepFeedback({
        type: 'error',
        message: err.message || 'Não foi possível localizar o CEP. Você pode preencher o endereço manualmente.',
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCustomerDetails((prev) => ({ ...prev, cep: formatted }));

    const digits = cleanCep(formatted);
    if (digits.length === 8) {
      handleLookupCep(digits);
    } else {
      setCepFeedback(null);
    }
  };

  const validateForm = () => {
    let valid = true;
    if (!customerDetails.name.trim()) {
      setNameError(true);
      valid = false;
    } else {
      setNameError(false);
    }

    if (!customerDetails.phone.trim() || customerDetails.phone.length < 9) {
      setPhoneError(true);
      valid = false;
    } else {
      setPhoneError(false);
    }

    if (orderMode === 'delivery') {
      if (!customerDetails.addressStreet?.trim()) {
        setStreetError(true);
        valid = false;
      } else {
        setStreetError(false);
      }

      if (!customerDetails.addressNumber?.trim()) {
        setNumberError(true);
        valid = false;
      } else {
        setNumberError(false);
      }
    }

    return valid;
  };

  const handleCompleteOrder = (sendToWhatsApp: boolean) => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const order = createOrder(paymentMethod, {
        needChange,
        changeFor: needChange ? changeFor : undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      if (sendToWhatsApp) {
        const message = generateWhatsAppOrderMessage(order);
        const url = getWhatsAppShareUrl(cartMerchant.whatsapp, message);
        window.open(url, '_blank');
      }

      setIsCheckoutOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-900 my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              {orderMode === 'delivery'
                ? 'Entrega em Domicílio'
                : orderMode === 'retirada'
                ? 'Retirada no Balcão'
                : 'Consumo na Mesa'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-display text-stone-950">
              Finalizar Pedido · {cartMerchant.name}
            </h2>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Section 1: Customer Info */}
          <div>
            <h3 className="text-sm font-bold text-stone-950 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>Seus Dados de Contato</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus-within:border-amber-500 transition-colors shadow-2xs">
                  <User className="w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Ex: Carlos Mendes"
                    value={customerDetails.name}
                    onChange={(e) => {
                      setCustomerDetails((prev) => ({ ...prev, name: e.target.value }));
                      if (nameError) setNameError(false);
                    }}
                    className="bg-transparent text-xs text-stone-900 placeholder-stone-400 focus:outline-none w-full font-medium"
                  />
                </div>
                {nameError && <p className="text-[11px] text-red-600 mt-1 font-medium">Informe seu nome.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-600">
                    WhatsApp com DDD *
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                    Auto-organizado
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus-within:border-amber-500 transition-colors shadow-2xs">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="(11) 98888-7777"
                    maxLength={19}
                    value={customerDetails.phone}
                    onChange={(e) => {
                      setCustomerDetails((prev) => ({
                        ...prev,
                        phone: formatPhone(e.target.value),
                      }));
                      if (phoneError) setPhoneError(false);
                    }}
                    className="bg-transparent text-xs text-stone-900 placeholder-stone-400 focus:outline-none w-full font-medium font-mono"
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">Informe um WhatsApp válido com DDD.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Address or Table */}
          {orderMode === 'delivery' && (
            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Endereço de Entrega</span>
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Preenchimento Automático via CEP
                </span>
              </div>

              <div className="space-y-3">
                {/* CEP Auto-fill Card */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-700" />
                      <span>CEP (Código Postal)</span>
                    </label>
                    <a
                      href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-800 hover:text-amber-950 underline font-medium"
                    >
                      Não sei o CEP
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 01418-100"
                        maxLength={9}
                        value={customerDetails.cep || ''}
                        onChange={handleCepChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLookupCep(customerDetails.cep || '');
                          }
                        }}
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold text-stone-950 placeholder-stone-400 focus:outline-none shadow-2xs transition-colors ${
                          isSearchingCep ? 'border-amber-500 ring-2 ring-amber-100' : 'border-stone-300 focus:border-amber-500'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLookupCep(customerDetails.cep || '')}
                      disabled={isSearchingCep || !customerDetails.cep}
                      className={`w-[115px] py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs ${
                        isSearchingCep
                          ? 'bg-amber-600 text-white cursor-wait'
                          : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed'
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
                    <div className="p-2.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-950 border border-amber-200 flex items-center gap-2 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                      <span>Consultando base dos Correios... Preenchendo endereço</span>
                    </div>
                  ) : cepFeedback ? (
                    <div
                      className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-start gap-2 transition-all ${
                        cepFeedback.type === 'success'
                          ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-300'
                          : cepFeedback.type === 'error'
                          ? 'bg-red-100/90 text-red-950 border border-red-300'
                          : 'bg-sky-100/90 text-sky-950 border border-sky-300'
                      }`}
                    >
                      {cepFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                      )}
                      <span>{cepFeedback.message}</span>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      placeholder={isSearchingCep ? 'Localizando endereço nos Correios...' : 'Ex: Rua Bela Cintra'}
                      value={customerDetails.addressStreet || ''}
                      onChange={(e) => {
                        setCustomerDetails((prev) => ({
                          ...prev,
                          addressStreet: e.target.value,
                        }));
                        if (streetError) setStreetError(false);
                      }}
                      className={`w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 font-medium transition-all ${
                        isSearchingCep ? 'opacity-70 bg-amber-50/40' : ''
                      }`}
                    />
                    {streetError && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">Informe a rua.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Número *</label>
                    <input
                      ref={numberInputRef}
                      type="text"
                      placeholder="Ex: 1240"
                      value={customerDetails.addressNumber || ''}
                      onChange={(e) => {
                        setCustomerDetails((prev) => ({
                          ...prev,
                          addressNumber: e.target.value,
                        }));
                        if (numberError) setNumberError(false);
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 font-medium"
                    />
                    {numberError && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">Informe o número.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Complemento (Apto, Bloco, Casa)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Apto 42B"
                      value={customerDetails.addressComplement || ''}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          addressComplement: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Região / Bairro de Entrega *
                    </label>
                    <select
                      value={selectedNeighborhood}
                      onChange={(e) => {
                        setSelectedNeighborhood(e.target.value);
                        setCustomerDetails((prev) => ({
                          ...prev,
                          neighborhood: e.target.value,
                        }));
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      {cartMerchant.deliveryZones.map((zone) => (
                        <option key={zone.neighborhood} value={zone.neighborhood}>
                          {zone.neighborhood} — {zone.fee === 0 ? 'Grátis' : formatCurrencyBRL(zone.fee)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {customerDetails.city && (
                  <div className="text-[11px] text-stone-500 font-medium flex items-center justify-between px-1">
                    <span>
                      Cidade: <strong className="text-stone-700">{customerDetails.city}</strong>
                    </span>
                    {customerDetails.neighborhood && (
                      <span>
                        Bairro detectado: <strong className="text-stone-700">{customerDetails.neighborhood}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Payment Method */}
          <div className="pt-4 border-t border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Forma de Pagamento</span>
            </h3>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-amber-50 border-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <QrCode className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <span className="block text-xs font-bold">PIX Instantâneo</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Sem taxas</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-amber-50 border-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-stone-500" />
                <span className="block text-xs font-bold">Cartão Crédito</span>
                <span className="text-[10px] text-stone-500">Na entrega</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-amber-50 border-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-stone-500" />
                <span className="block text-xs font-bold">Cartão Débito</span>
                <span className="text-[10px] text-stone-500">Na entrega</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-amber-50 border-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <Banknote className="w-5 h-5 mx-auto mb-1 text-stone-500" />
                <span className="block text-xs font-bold">Dinheiro</span>
                <span className="text-[10px] text-stone-500">Troco disponível</span>
              </button>
            </div>

            {/* PIX Payload Box */}
            {paymentMethod === 'pix' && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-white p-2 rounded-xl shrink-0 shadow-md border border-stone-200 flex items-center justify-center">
                  <div
                    dangerouslySetInnerHTML={{ __html: pixQrSvg }}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-950">Chave PIX & Copia e Cola</span>
                    <span className="text-xs font-bold text-amber-800 tabular-nums font-mono">
                      {formatCurrencyBRL(total)}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Copie o código abaixo e abra o aplicativo do seu banco na opção <strong>PIX Copia e Cola</strong>.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCopiaCola}
                      className="bg-white border border-stone-300 text-[11px] text-stone-700 font-mono px-3 py-1.5 rounded-lg flex-1 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold rounded-lg transition-colors shrink-0"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-700 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cash change box */}
            {paymentMethod === 'dinheiro' && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="needChangeCheckbox"
                    checked={needChange}
                    onChange={(e) => setNeedChange(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-white border-stone-300"
                  />
                  <label htmlFor="needChangeCheckbox" className="text-xs font-bold text-stone-900">
                    Precisa de troco?
                  </label>
                </div>

                {needChange && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-medium text-stone-600">Troco para quanto? R$</span>
                    <input
                      type="number"
                      value={changeFor}
                      onChange={(e) => setChangeFor(Number(e.target.value))}
                      min={Math.ceil(total)}
                      className="w-28 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500 tabular-nums"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Summary */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal dos itens</span>
              <span className="text-stone-900 font-bold tabular-nums font-mono">{formatCurrencyBRL(subtotal)}</span>
            </div>
            {orderMode === 'delivery' && (
              <div className="flex justify-between">
                <span>Taxa de Entrega</span>
                <span className="text-stone-900 font-bold tabular-nums font-mono">
                  {deliveryFee === 0 ? 'GRÁTIS' : formatCurrencyBRL(deliveryFee)}
                </span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Desconto</span>
                <span className="tabular-nums font-mono">-{formatCurrencyBRL(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
              <span>Valor Total</span>
              <span className="text-amber-800 tabular-nums font-mono">{formatCurrencyBRL(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCompleteOrder(true)}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Pedido pelo WhatsApp</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCompleteOrder(false)}
            className="w-full sm:flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar & Rastrear Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
