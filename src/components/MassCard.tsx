import React from 'react';
import { Mass, Ministrant } from '../types';
import {
  formatCzechDate,
  getRankBadgeStyle,
  getLiturgicalColorStyle,
} from '../utils/helpers';
import {
  Clock,
  MapPin,
  Lock,
  UserPlus,
  UserCheck,
  X,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

interface MassCardProps {
  mass: Mass;
  ministrantsMap: Map<string, Ministrant>;
  onOpenSignUpModal: (mass: Mass) => void;
  onQuickUnassign?: (massId: string, serverId: string) => void;
  isAdmin: boolean;
  onAdminToggleLock?: (massId: string) => void;
  onAdminEditMass?: (mass: Mass) => void;
  globalLockSignups: boolean;
}

export const MassCard: React.FC<MassCardProps> = ({
  mass,
  ministrantsMap,
  onOpenSignUpModal,
  onQuickUnassign,
  isAdmin,
  onAdminToggleLock,
  onAdminEditMass,
  globalLockSignups,
}) => {
  const rankStyle = getRankBadgeStyle(mass.rank);
  const colorStyle = getLiturgicalColorStyle(mass.liturgicalColor);

  const assignedCount = mass.assignments.length;
  const isFull = assignedCount >= mass.maxServers;
  const isLocked = mass.isLocked || globalLockSignups;

  const spotsLeft = mass.maxServers - assignedCount;

  return (
    <div className="relative rounded-md bg-white border-2 border-farnost-200 transition-all duration-200 hover:shadow-md">
      {/* Top Banner Accent Line */}
      <div className="h-2 w-full rounded-t-md bg-farnost-700" />

      <div className="p-4 sm:p-5">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider ${rankStyle.bg} ${rankStyle.text}`}>
              {mass.rank === 'slavnost' && <Sparkles className="w-3 h-3 mr-1 text-white" />}
              {rankStyle.label}
            </span>

            {/* Liturgical Color Dot/Badge */}
            <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-sm font-extrabold uppercase tracking-wider bg-farnost-50 text-farnost-900 border border-farnost-300">
              <span className="w-2 h-2 rounded-full mr-1.5 bg-farnost-700" />
              Mše svatá
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {isLocked && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-slate-100 text-slate-800 font-bold border border-slate-300">
                <Lock className="w-3 h-3 mr-1" /> Uzamčeno
              </span>
            )}
          </div>
        </div>

        {/* Title & Date/Time */}
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {mass.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center text-xs text-slate-600 gap-x-4 gap-y-1">
            <span className="flex items-center font-extrabold text-farnost-700">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {mass.time} ({formatCzechDate(mass.date)})
            </span>
            <span className="flex items-center text-slate-600 font-bold">
              <MapPin className="w-3.5 h-3.5 mr-1 text-farnost-700" />
              {mass.location}
            </span>
          </div>
          {mass.note && (
            <p className="mt-1.5 text-xs text-farnost-800 italic flex items-center font-medium">
              <Info className="w-3.5 h-3.5 mr-1 shrink-0 text-farnost-700" />
              {mass.note}
            </p>
          )}
        </div>

        {/* Assigned Ministrants Grid */}
        <div className="mt-4 pt-3 border-t border-farnost-200">
          <p className="text-[11px] font-black text-farnost-800 uppercase tracking-wider mb-2">
            Oltářní služba:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
            {mass.assignments.map((assignment) => {
              const server = ministrantsMap.get(assignment.serverId);
              if (!server) return null;

              return (
                <div
                  key={server.id}
                  onClick={() => (!isLocked || isAdmin) && onQuickUnassign && onQuickUnassign(mass.id, server.id)}
                  className={`bg-white border border-farnost-200 p-2 rounded-sm text-center text-xs font-bold text-slate-800 relative group flex items-center justify-between space-x-1 min-h-[38px] ${
                    (!isLocked || isAdmin)
                      ? 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-900 cursor-pointer transition'
                      : ''
                  }`}
                  title={(!isLocked || isAdmin) ? 'Kliknutím odhlásíš z této mše' : ''}
                >
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: server.avatarColor || '#4d6e00' }}
                    />
                    <span className="font-extrabold truncate">{server.name}</span>
                  </div>

                  {/* Quick remove button if not locked or if admin */}
                  {(!isLocked || isAdmin) && onQuickUnassign && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickUnassign(mass.id, server.id);
                      }}
                      className="text-slate-400 group-hover:text-rose-600 p-1 transition cursor-pointer"
                      title="Odebrat z té mše"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add button if not locked */}
            {!isLocked && (
              <button
                onClick={() => onOpenSignUpModal(mass)}
                className="border-2 border-dashed border-farnost-600 p-2 rounded-sm text-xs font-black text-farnost-800 hover:bg-farnost-50 cursor-pointer transition-colors min-h-[38px] flex items-center justify-center gap-1"
                title="Zapsat ministranta na tuto mši"
              >
                + Zapsat se
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-farnost-200 flex items-center justify-between">
          <button
            disabled={isLocked}
            onClick={() => !isLocked && onOpenSignUpModal(mass)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-md font-black text-xs transition-all min-h-[44px] ${
              isLocked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-farnost-700 hover:bg-farnost-800 text-white shadow-xs cursor-pointer'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Uzamčeno</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Zapsat se na mši</span>
              </>
            )}
          </button>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center space-x-2 text-xs">
              {onAdminToggleLock && (
                <button
                  onClick={() => onAdminToggleLock(mass.id)}
                  className="p-2 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title={mass.isLocked ? 'Odemknout mši' : 'Uzamknout mši'}
                >
                  <Lock className={`w-4 h-4 ${mass.isLocked ? 'text-rose-500' : 'text-slate-400'}`} />
                </button>
              )}
              {onAdminEditMass && (
                <button
                  onClick={() => onAdminEditMass(mass)}
                  className="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-100 font-extrabold text-slate-700 min-h-[44px] cursor-pointer"
                >
                  Upravit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
