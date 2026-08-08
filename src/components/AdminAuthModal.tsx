import React, { useState } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { SubAdminPin, AdminPermissions } from '../types';

interface AdminAuthModalProps {
  masterPin: string;
  subAdminPins: SubAdminPin[];
  onSuccess: (isMaster: boolean, permissions?: AdminPermissions, subAdminId?: string) => void;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  masterPin,
  subAdminPins = [],
  onSuccess,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    
    // Check if master PIN
    if (cleanPin === masterPin.trim()) {
      onSuccess(true, {
        canManageSchedule: true,
        canManageForms: true,
        canViewFormSubmissions: true,
        canViewAnalytics: true,
        canManageEvents: true,
      });
      return;
    }

    // Check if sub-admin PIN
    const matchSub = subAdminPins.find((s) => s.pin.trim() === cleanPin);
    if (matchSub) {
      onSuccess(false, matchSub.permissions, matchSub.id);
      return;
    }

    setErrorMsg('Nesprávný PIN kód. Zkontroluj zadaný PIN kód.');
    setPinInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-md shadow-2xl border border-slate-200 p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-sm text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-md bg-farnost-100 text-farnost-700 flex items-center justify-center border border-farnost-300">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Přihlášení pro vedoucího / kněze
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Zadej přístupový PIN pro úpravu rozpisu a správy Ministrantů Luhačovice.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Zadej PIN..."
              autoFocus
              className="w-full text-center tracking-widest text-lg font-extrabold px-4 py-3 bg-farnost-50 border-2 border-farnost-200 rounded-md focus:outline-none focus:ring-2 focus:ring-farnost-700 min-h-[48px] text-slate-900"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-700 text-xs font-bold flex items-center border border-rose-200">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-md border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[44px] cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-md bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs shadow-md shadow-farnost-700/20 min-h-[44px] cursor-pointer"
            >
              Vstoupit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
