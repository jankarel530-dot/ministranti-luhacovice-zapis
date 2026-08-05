import React, { useState } from 'react';
import { SubAdminPin, AdminPermissions } from '../types';
import { KeyRound, Shield, UserPlus, Trash2, Edit, Check, AlertCircle, Sparkles } from 'lucide-react';

interface AdminUsersManagerProps {
  subAdminPins: SubAdminPin[];
  masterPin: string;
  onUpdateSubAdminPins: (pins: SubAdminPin[]) => void;
  onUpdateMasterPin: (newPin: string) => void;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  subAdminPins,
  masterPin,
  onUpdateSubAdminPins,
  onUpdateMasterPin,
}) => {
  const [newMasterPinInput, setNewMasterPinInput] = useState<string>(masterPin);
  const [masterPinNotice, setMasterPinNotice] = useState<string | null>(null);

  // New sub-admin modal / form state
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdminPin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSaveMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPinInput || newMasterPinInput.trim().length < 4) {
      alert('Master PIN musí mít alespoň 4 znaky');
      return;
    }
    onUpdateMasterPin(newMasterPinInput.trim());
    setMasterPinNotice('Master PIN byl úspěšně změněn.');
    setTimeout(() => setMasterPinNotice(null), 3000);
  };

  const handleOpenNewSubAdmin = () => {
    const defaultPermissions: AdminPermissions = {
      canManageSchedule: true,
      canManageForms: true,
      canViewFormSubmissions: true,
      canViewAnalytics: true,
      canManageEvents: true,
    };
    setEditingSubAdmin({
      id: `sub-${Date.now()}`,
      label: 'Pomocný administrátor',
      pin: '',
      createdAt: new Date().toISOString(),
      permissions: defaultPermissions,
    });
    setIsModalOpen(true);
  };

  const handleEditSubAdmin = (sub: SubAdminPin) => {
    setEditingSubAdmin({
      ...sub,
      permissions: {
        canManageSchedule: sub.permissions?.canManageSchedule ?? true,
        canManageForms: sub.permissions?.canManageForms ?? true,
        canViewFormSubmissions: sub.permissions?.canViewFormSubmissions ?? true,
        canViewAnalytics: sub.permissions?.canViewAnalytics ?? true,
        canManageEvents: sub.permissions?.canManageEvents ?? true,
      },
    });
    setIsModalOpen(true);
  };

  const handleSaveSubAdmin = () => {
    if (!editingSubAdmin) return;
    if (!editingSubAdmin.label.trim()) {
      alert('Zadejte označení účtu (např. Jméno správe)');
      return;
    }
    if (!editingSubAdmin.pin || editingSubAdmin.pin.trim().length < 4) {
      alert('PIN kód musí mít přesně nebo alespoň 4 znaky/číslice');
      return;
    }

    const exists = subAdminPins.some((s) => s.id === editingSubAdmin.id);
    let updatedList: SubAdminPin[];
    if (exists) {
      updatedList = subAdminPins.map((s) => (s.id === editingSubAdmin.id ? editingSubAdmin : s));
    } else {
      updatedList = [...subAdminPins, editingSubAdmin];
    }

    onUpdateSubAdminPins(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteSubAdmin = (id: string) => {
    if (confirm('Opravdu chcete odebrat tento administrátorský účet?')) {
      onUpdateSubAdminPins(subAdminPins.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Master PIN Banner */}
      <div className="bg-gradient-to-r from-farnost-800 to-farnost-900 text-white p-5 sm:p-6 rounded-md shadow-sm border border-farnost-950 space-y-3">
        <div className="flex items-center space-x-3">
          <Shield className="w-7 h-7 text-farnost-200 shrink-0" />
          <div>
            <h3 className="font-black text-base sm:text-lg uppercase">
              Správa administrátorských účtů a oprávnění
            </h3>
            <p className="text-farnost-100 text-xs font-bold">
              Jako Master Admin můžete vytvářet pomocné PIN kódy pro spolubratry nebo vedoucí a přidělovat jim konkrétní pravomoci.
            </p>
          </div>
        </div>

        {/* Change Master PIN form */}
        <form onSubmit={handleSaveMasterPin} className="pt-3 border-t border-farnost-700/60 flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-farnost-200">Hlavní (Master) PIN:</span>
            <input
              type="text"
              value={newMasterPinInput}
              onChange={(e) => setNewMasterPinInput(e.target.value)}
              className="w-28 px-3 py-1.5 text-xs font-black bg-white text-slate-900 rounded-md text-center tracking-widest border border-farnost-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-farnost-200 hover:bg-white text-farnost-950 font-black rounded-md text-xs transition cursor-pointer"
          >
            Uložit nový Master PIN
          </button>
          {masterPinNotice && (
            <span className="text-xs font-extrabold text-emerald-300 animate-in fade-in">
              ✓ {masterPinNotice}
            </span>
          )}
        </form>
      </div>

      {/* Sub-admins list */}
      <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">
              Seznam vedlejších účtů a správců ({subAdminPins.length})
            </h4>
            <p className="text-xs font-bold text-slate-500">
              Každý účet má vlastní PIN a povolené moduly v systému.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewSubAdmin}
            className="flex items-center space-x-1.5 px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-black border border-farnost-800 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Přidat účet správce</span>
          </button>
        </div>

        {subAdminPins.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
            <KeyRound className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
              Zatím nebyl vytvořen žádný vedlejší účet.
            </p>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Všichni přihlášení administrátoři se v tuto chvíli přihlašují přes hlavní Master PIN.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subAdminPins.map((sub) => {
              const perms = sub.permissions || {
                canManageSchedule: true,
                canManageForms: true,
                canViewFormSubmissions: true,
                canViewAnalytics: true,
                canManageEvents: true,
              };

              return (
                <div
                  key={sub.id}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-md p-4 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {sub.label}
                      </h5>
                      <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono font-black text-farnost-900 dark:text-farnost-200">
                        PIN: {sub.pin}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span className={perms.canManageSchedule ? 'text-emerald-600 font-black' : 'text-slate-400'}>
                          {perms.canManageSchedule ? '✓' : '✕'} Rozpis mší a ministranti
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={perms.canManageForms ? 'text-emerald-600 font-black' : 'text-slate-400'}>
                          {perms.canManageForms ? '✓' : '✕'} Tvorba formulářů
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={perms.canViewFormSubmissions ? 'text-emerald-600 font-black' : 'text-slate-400'}>
                          {perms.canViewFormSubmissions ? '✓' : '✕'} Zobrazení odpovědí formulářů
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={perms.canViewAnalytics ? 'text-emerald-600 font-black' : 'text-slate-400'}>
                          {perms.canViewAnalytics ? '✓' : '✕'} Statistika a analytika
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleEditSubAdmin(sub)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-md text-xs font-black cursor-pointer flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Upravit pravomoci</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubAdmin(sub.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md cursor-pointer"
                      title="Odebrat účet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL EDIT / CREATE SUB ADMIN */}
      {isModalOpen && editingSubAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-700 shadow-2xl max-w-md w-full overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
            <div className="bg-farnost-700 text-white p-4 flex items-center justify-between">
              <h4 className="font-black text-sm sm:text-base uppercase">
                Účet správce & Přidělení pravomocí
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-farnost-200 hover:text-white font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Označení účtu / Jméno správce:
                </label>
                <input
                  type="text"
                  value={editingSubAdmin.label}
                  onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, label: e.target.value })}
                  placeholder="Např. P. Josef, Vedoucí tábora..."
                  className="w-full px-3.5 py-2 text-xs font-extrabold rounded-md border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  PIN kód pro přihlášení (4 čísla):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={editingSubAdmin.pin}
                  onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, pin: e.target.value })}
                  placeholder="Např. 5566"
                  className="w-full px-3.5 py-2 text-xs font-black tracking-widest text-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-black uppercase text-farnost-900 dark:text-farnost-200">
                  Přidělené pravomoci:
                </p>

                <label className="flex items-center space-x-3 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubAdmin.permissions.canManageSchedule}
                    onChange={(e) =>
                      setEditingSubAdmin({
                        ...editingSubAdmin,
                        permissions: {
                          ...editingSubAdmin.permissions,
                          canManageSchedule: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Správa mší a ministrantů
                  </span>
                </label>

                <label className="flex items-center space-x-3 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubAdmin.permissions.canManageForms}
                    onChange={(e) =>
                      setEditingSubAdmin({
                        ...editingSubAdmin,
                        permissions: {
                          ...editingSubAdmin.permissions,
                          canManageForms: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Tvorba a úprava formulářů
                  </span>
                </label>

                <label className="flex items-center space-x-3 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubAdmin.permissions.canViewFormSubmissions}
                    onChange={(e) =>
                      setEditingSubAdmin({
                        ...editingSubAdmin,
                        permissions: {
                          ...editingSubAdmin.permissions,
                          canViewFormSubmissions: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Prohlížení doručených odpovědí
                  </span>
                </label>

                <label className="flex items-center space-x-3 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubAdmin.permissions.canViewAnalytics}
                    onChange={(e) =>
                      setEditingSubAdmin({
                        ...editingSubAdmin,
                        permissions: {
                          ...editingSubAdmin.permissions,
                          canViewAnalytics: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Statistika a analytika
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-black cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleSaveSubAdmin}
                className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-black shadow-md cursor-pointer border border-farnost-800"
              >
                Uložit účet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
