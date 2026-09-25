import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowLeft, KeyRound, AlertCircle, ChefHat, Bike } from 'lucide-react';
import { PortalType } from '../types/delivery';

interface PortalAuthScreenProps {
  portal: 'admin' | 'motoboy';
  restaurantName: string;
  onSuccess: () => void;
  onBackToClient: () => void;
}

export const PortalAuthScreen: React.FC<PortalAuthScreenProps> = ({
  portal,
  restaurantName,
  onSuccess,
  onBackToClient,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expectedPin = portal === 'admin' ? '1234' : '5678';
  const roleTitle = portal === 'admin' ? 'Painel KDS & Gestão do Restaurante' : 'Portal do Entregador (Motoboy)';
  const roleSubtitle =
    portal === 'admin'
      ? 'Acesso restrito para gerência, garçons e equipe da cozinha'
      : 'Acesso restrito para motoboys e entregadores cadastrados';
  const RoleIcon = portal === 'admin' ? ChefHat : Bike;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === expectedPin) {
      setError(null);
      onSuccess();
    } else {
      setError('PIN incorreto. Tente novamente.');
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  const handleDirectDemoLogin = () => {
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
      {/* Back button */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <button
          onClick={onBackToClient}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio (Cliente)</span>
        </button>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Header Icon */}
        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs mb-3 ${
              portal === 'admin'
                ? 'bg-orange-100 text-orange-600 border border-orange-200'
                : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
            }`}
          >
            <RoleIcon className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {restaurantName}
          </span>
          <h2 className="text-xl font-black text-stone-900 font-display mt-0.5">{roleTitle}</h2>
          <p className="text-xs text-stone-500 mt-1">{roleSubtitle}</p>
        </div>

        {/* PIN Indicators */}
        <div>
          <div className="flex items-center justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isFilled
                      ? portal === 'admin'
                        ? 'bg-orange-600 border-orange-600 scale-110'
                        : 'bg-emerald-600 border-emerald-600 scale-110'
                      : 'border-stone-300 bg-stone-50'
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-xs font-bold text-red-600 flex items-center justify-center gap-1 mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          ) : (
            <p className="text-[11px] text-stone-400 mt-2">
              Digite o PIN de 4 dígitos para acessar
            </p>
          )}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-14 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-95 text-stone-900 text-lg font-black font-mono border border-stone-200 transition-all flex items-center justify-center shadow-2xs mx-auto"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-14 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-95 text-stone-900 text-lg font-black font-mono border border-stone-200 transition-all flex items-center justify-center shadow-2xs mx-auto"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-14 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-95 text-stone-600 text-sm font-bold border border-stone-200 transition-all flex items-center justify-center shadow-2xs mx-auto"
          >
            Apagar
          </button>
        </div>

        {/* Quick Demo Button for Instant Access */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <button
            type="button"
            onClick={handleDirectDemoLogin}
            className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
              portal === 'admin'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              Entrar como {portal === 'admin' ? 'Gerente / Cozinha' : 'Entregador'} (PIN: {expectedPin})
            </span>
          </button>

          <p className="text-[11px] text-stone-400">
            Ambiente seguro com separação de permissões por perfil.
          </p>
        </div>
      </div>
    </div>
  );
};
