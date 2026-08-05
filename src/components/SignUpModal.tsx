import React, { useState } from 'react';
import { Mass, Ministrant } from '../types';
import { formatCzechDate, triggerCelebrationConfetti } from '../utils/helpers';
import { X, UserPlus, Check, UserMinus, Search, Sparkles, UserCheck } from 'lucide-react';

interface SignUpModalProps {
  mass: Mass;
  ministrants: Ministrant[];
  onClose: () => void;
  onSignUp: (massId: string, serverId: string, note?: string) => void;
  onUnregister: (massId: string, serverId: string) => void;
  onAddNewMinistrant?: (name: string) => void;
  globalLockSignups?: boolean;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({
  mass,
  ministrants,
  onClose,
  onSignUp,
  onUnregister,
  onAddNewMinistrant,
  globalLockSignups = false,
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddNew, setShowAddNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');

  const isLocked = mass.isLocked || globalLockSignups;

  const assignedServerIds = new Set(mass.assignments.map((a) => a.serverId));

  const activeMinistrants = ministrants.filter((m) => m.isActive);

  const filteredMinistrants = activeMinistrants.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.name.toLowerCase().includes(q);
  });

  const handleConfirmSignUp = () => {
    if (isLocked || !selectedServerId) return;
    onSignUp(mass.id, selectedServerId, note);
    triggerCelebrationConfetti();
    onClose();
  };

  const handleCreateAndSignUp = () => {
    if (!newName.trim()) return;
    if (onAddNewMinistrant) {
      onAddNewMinistrant(newName.trim());
    }
    setNewName('');
    setShowAddNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-farnost-700 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 border border-white/30 px-2 py-0.5 rounded-sm text-white">
              {mass.rank === 'slavnost' ? '★ Slavnost' : 'Mše svatá'}
            </span>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white leading-tight">{mass.title}</h2>
            <p className="text-xs text-farnost-100 font-extrabold mt-0.5">
              {formatCzechDate(mass.date)} v {mass.time} • {mass.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-sm bg-white/10 hover:bg-white/20 text-white transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Currently Assigned List */}
        <div className="px-4 py-3 bg-farnost-50 dark:bg-slate-800/50 border-b border-farnost-200 dark:border-slate-800">
          <p className="text-xs font-black text-farnost-900 dark:text-slate-300 mb-2">
            Již přihlášení ministranti ({mass.assignments.length}):
          </p>
          {mass.assignments.length === 0 ? (
            <p className="text-xs text-farnost-800 italic font-medium">Zatím nikdo přihlášen. Buď první!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mass.assignments.map((assignment) => {
                const server = ministrants.find((m) => m.id === assignment.serverId);
                if (!server) return null;
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => onUnregister(mass.id, server.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/90 dark:hover:bg-rose-950/50 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-bold cursor-pointer transition group min-h-[36px]"
                    title="Kliknutím se odhlásíš z této mše"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: server.avatarColor || '#4d6e00' }}
                    />
                    <span className="font-extrabold">{server.name}</span>
                    <span className="ml-1 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] flex items-center gap-0.5 group-hover:scale-105 transition-transform">
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Odhlásit</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
              <span className="text-base">🔒</span>
              <div>
                <p className="font-extrabold">Zapisování na tuto mši je uzamčeno</p>
                <p className="text-[11px] opacity-90 font-medium">Správce nebo kněz dočasně uzamkl zapisování pro tuto mši svatou.</p>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-farnost-700" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vyhledej své jméno..."
              className="w-full pl-9 pr-4 py-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farnost-700 min-h-[44px]"
            />
          </div>

          {/* Ministrants Selection List */}
          <div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
              Vyber své jméno pro zapsání / odhlášení:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredMinistrants.map((min) => {
                const isAlreadySignedUp = assignedServerIds.has(min.id);
                const isSelected = selectedServerId === min.id;

                if (isAlreadySignedUp) {
                  return (
                    <button
                      key={min.id}
                      type="button"
                      onClick={() => onUnregister(mass.id, min.id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-left text-xs transition-all cursor-pointer min-h-[44px] hover:bg-rose-100 dark:hover:bg-rose-950/60 shadow-2xs group"
                      title="Jsi již přihlášen. Kliknutím se odhlásíš."
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: min.avatarColor || '#4d6e00' }}
                        />
                        <div className="font-extrabold text-xs sm:text-sm">{min.name}</div>
                      </div>
                      <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800 shadow-2xs group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition">
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Odhlásit se</span>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={min.id}
                    type="button"
                    onClick={() => setSelectedServerId(min.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-farnost-50 border-2 border-farnost-700 text-farnost-900 font-extrabold ring-2 ring-farnost-300/50 dark:bg-farnost-950/60 dark:text-farnost-200'
                        : 'bg-white hover:bg-farnost-50/50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-farnost-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: min.avatarColor || '#4d6e00' }}
                      />
                      <div className="font-extrabold text-xs sm:text-sm">{min.name}</div>
                    </div>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-farnost-700" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-farnost-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add New Name Option */}
          {showAddNew ? (
            <div className="p-3.5 rounded-xl bg-farnost-50 dark:bg-farnost-950/40 border-2 border-farnost-300 dark:border-farnost-800 space-y-2.5">
              <p className="text-xs font-extrabold text-farnost-900 dark:text-farnost-200">
                Přidat nové jméno do seznamu ministrantů:
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jméno a příjmení"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-farnost-300 dark:border-farnost-700 rounded-xl text-xs font-bold min-h-[40px]"
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowAddNew(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer min-h-[40px]"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleCreateAndSignUp}
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-xl text-xs font-black disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  Uložit jméno
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddNew(true)}
              className="text-xs font-black text-farnost-800 hover:text-farnost-900 dark:text-farnost-300 flex items-center space-x-1.5 cursor-pointer py-1 min-h-[40px]"
            >
              <Sparkles className="w-4 h-4 text-farnost-700" />
              <span>Nenašel jsi své jméno? Přidej nového ministranta</span>
            </button>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
              Poznámka (volitelné):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Např. Přijdu s bratrem / Mohu posloužit u rouch"
              className="w-full px-3 py-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-farnost-700 min-h-[44px]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-farnost-50/80 dark:bg-slate-800/80 border-t border-farnost-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer min-h-[44px]"
          >
            Zrušit
          </button>

          <button
            disabled={isLocked || !selectedServerId}
            onClick={handleConfirmSignUp}
            className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-farnost-700 hover:bg-farnost-800 text-white text-xs font-black shadow-md shadow-farnost-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer min-h-[44px]"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isLocked ? 'Uzamčeno' : 'Potvrdit zapsání'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
