import React, { useState, useMemo } from 'react';
import { Mass, Ministrant } from '../types';
import { MassCard } from './MassCard';
import {
  Calendar,
  Filter,
  Search,
  Church,
  Lock,
  PlusCircle,
  Clock,
  UserCheck,
  UserPlus,
  Table as TableIcon,
  LayoutGrid,
  X,
  MapPin,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatShortCzechDate, getRankBadgeStyle, getCzechMonthLabel, getMondayDateStr, formatWeekRangeLabel, getPrevMonthStr, getNextMonthStr, getPrevWeekStr, getNextWeekStr } from '../utils/helpers';
import { exportMassesToPDF } from '../utils/pdfExport';

interface MassListProps {
  masses: Mass[];
  ministrantsMap: Map<string, Ministrant>;
  onOpenSignUpModal: (mass: Mass) => void;
  onQuickUnassign: (massId: string, serverId: string) => void;
  isAdmin: boolean;
  onAdminToggleLock?: (massId: string) => void;
  onAdminEditMass?: (mass: Mass) => void;
  onAdminOpenCreateMass?: () => void;
  globalLockSignups: boolean;
}

export const MassList: React.FC<MassListProps> = ({
  masses,
  ministrantsMap,
  onOpenSignUpModal,
  onQuickUnassign,
  isAdmin,
  onAdminToggleLock,
  onAdminEditMass,
  onAdminOpenCreateMass,
  globalLockSignups,
}) => {
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilterMode, setDateFilterMode] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMondayStr = getMondayDateStr(todayStr);

  // Extract all available months from masses
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    masses.forEach((m) => {
      if (m.date && m.date.length >= 7) {
        monthsSet.add(m.date.substring(0, 7)); // YYYY-MM
      }
    });
    if (selectedMonthFilter && selectedMonthFilter !== 'ALL') {
      monthsSet.add(selectedMonthFilter);
    }
    return Array.from(monthsSet).sort();
  }, [masses, selectedMonthFilter]);

  // Extract all available weeks from masses
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<string>();
    masses.forEach((m) => {
      if (m.date) {
        const mon = getMondayDateStr(m.date);
        if (mon) weeksSet.add(mon);
      }
    });
    if (selectedWeekFilter && selectedWeekFilter !== 'ALL') {
      weeksSet.add(selectedWeekFilter);
    }
    return Array.from(weeksSet).sort();
  }, [masses, selectedWeekFilter]);

  // Filter masses
  const filteredMasses = useMemo(() => {
    return masses.filter((m) => {
      // Exclude Pozlovice
      if (m.location.includes('Pozlovice')) return false;

      // Period filter (Month vs Week)
      if (periodMode === 'MONTH') {
        if (selectedMonthFilter !== 'ALL') {
          if (!m.date.startsWith(selectedMonthFilter)) return false;
        }
      } else if (periodMode === 'WEEK') {
        if (selectedWeekFilter !== 'ALL') {
          const massMon = getMondayDateStr(m.date);
          if (massMon !== selectedWeekFilter) return false;
        }
      }

      // Date filter
      if (dateFilterMode === 'UPCOMING' && m.date < todayStr) return false;
      if (dateFilterMode === 'PAST' && m.date >= todayStr) return false;

      // Rank filter
      if (selectedRankFilter === 'SLAVNOSTI' && m.rank !== 'slavnost') return false;
      if (selectedRankFilter === 'SVATKY' && m.rank !== 'svatek' && m.rank !== 'slavnost') return false;
      if (selectedRankFilter === 'NEDELE' && m.rank !== 'nedele' && m.rank !== 'slavnost') return false;

      // Only unassigned/available
      if (onlyAvailable && m.assignments.length > 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDate = m.date.includes(q);
        const matchesNote = m.note?.toLowerCase().includes(q);
        const matchesServer = m.assignments.some((a) => {
          const s = ministrantsMap.get(a.serverId);
          return s && s.name.toLowerCase().includes(q);
        });
        if (!matchesTitle && !matchesDate && !matchesNote && !matchesServer) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [masses, periodMode, selectedMonthFilter, selectedWeekFilter, dateFilterMode, selectedRankFilter, onlyAvailable, searchQuery, todayStr, ministrantsMap]);

  const handleExportPDF = () => {
    let label = 'Všechny mše';
    if (periodMode === 'MONTH') {
      label = selectedMonthFilter === 'ALL' ? 'Všechny měsíce' : getCzechMonthLabel(selectedMonthFilter);
    } else {
      label = selectedWeekFilter === 'ALL' ? 'Všechny týdny' : `Týden ${formatWeekRangeLabel(selectedWeekFilter)}`;
    }
    exportMassesToPDF(filteredMasses, ministrantsMap, label, 'Luhačovice');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar - Simple & Senior-Friendly */}
      <div className="bg-white rounded-md p-3.5 sm:p-5 border-2 border-farnost-200 shadow-sm space-y-3.5">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Search & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[180px] sm:min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-farnost-700" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vyhledat mši, svátek, jméno..."
                className="w-full pl-9 pr-3 py-2.5 bg-farnost-50/60 border border-farnost-200 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-farnost-700 font-bold min-h-[44px]"
              />
            </div>

            {/* View Mode Toggle: Excel Seznam vs. Karty */}
            <div className="inline-flex rounded-md bg-farnost-100/80 p-1 text-xs font-bold border border-farnost-200">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-sm transition cursor-pointer min-h-[40px] ${
                  viewMode === 'table'
                    ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                    : 'text-farnost-900 hover:text-black hover:bg-farnost-200/50'
                }`}
                title="Tabulkový seznam jako v Excelu"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Excel Seznam</span>
                <span className="sm:hidden">Seznam</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-sm transition cursor-pointer min-h-[40px] ${
                  viewMode === 'cards'
                    ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                    : 'text-farnost-900 hover:text-black hover:bg-farnost-200/50'
                }`}
                title="Zobrazit jako karty"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Karty</span>
              </button>
            </div>

            {/* Date filter switcher */}
            <div className="inline-flex rounded-md bg-farnost-100/80 p-1 text-xs font-bold border border-farnost-200">
              <button
                onClick={() => setDateFilterMode('UPCOMING')}
                className={`px-3 py-2 rounded-sm transition cursor-pointer min-h-[40px] ${
                  dateFilterMode === 'UPCOMING'
                    ? 'bg-white text-farnost-900 font-black shadow-xs border border-farnost-200'
                    : 'text-farnost-800 hover:text-black hover:bg-farnost-200/50'
                }`}
              >
                Nadcházející
              </button>
              <button
                onClick={() => setDateFilterMode('PAST')}
                className={`px-3 py-2 rounded-sm transition cursor-pointer min-h-[40px] ${
                  dateFilterMode === 'PAST'
                    ? 'bg-white text-farnost-900 font-black shadow-xs border border-farnost-200'
                    : 'text-farnost-800 hover:text-black hover:bg-farnost-200/50'
                }`}
              >
                Minulé
              </button>
              <button
                onClick={() => setDateFilterMode('ALL')}
                className={`px-3 py-2 rounded-sm transition cursor-pointer min-h-[40px] ${
                  dateFilterMode === 'ALL'
                    ? 'bg-white text-farnost-900 font-black shadow-xs border border-farnost-200'
                    : 'text-farnost-800 hover:text-black hover:bg-farnost-200/50'
                }`}
              >
                Vše
              </button>
            </div>
          </div>

          {/* Action Buttons: PDF & Admin Create */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-md bg-farnost-50 hover:bg-farnost-100 text-farnost-900 border border-farnost-300 text-xs font-black shadow-2xs transition cursor-pointer min-h-[44px]"
              title="Vytisknout nebo uložit rozpis do PDF"
            >
              <Printer className="w-4 h-4 text-farnost-700" />
              <span>Stáhnout PDF</span>
            </button>

            {isAdmin && onAdminOpenCreateMass && (
              <button
                onClick={onAdminOpenCreateMass}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-md bg-farnost-700 hover:bg-farnost-800 text-white text-xs font-bold shadow-xs transition cursor-pointer min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Přidat mši svatou</span>
              </button>
            )}
          </div>

        </div>

        {/* Filters Row - Mode Switcher (Month vs Week) & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-farnost-200 text-xs">
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-farnost-800 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-farnost-700" /> Zobrazení:
          </span>

          {/* Period Mode Switcher */}
          <div className="inline-flex rounded-md bg-farnost-100 p-0.5 border border-farnost-300">
            <button
              type="button"
              onClick={() => setPeriodMode('MONTH')}
              className={`px-3 py-1.5 rounded-sm transition cursor-pointer flex items-center gap-1.5 min-h-[36px] text-xs font-bold ${
                periodMode === 'MONTH'
                  ? 'bg-farnost-700 text-white font-extrabold shadow-xs'
                  : 'text-farnost-900 hover:text-black hover:bg-farnost-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Po měsících</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('WEEK')}
              className={`px-3 py-1.5 rounded-sm transition cursor-pointer flex items-center gap-1.5 min-h-[36px] text-xs font-bold ${
                periodMode === 'WEEK'
                  ? 'bg-farnost-700 text-white font-extrabold shadow-xs'
                  : 'text-farnost-900 hover:text-black hover:bg-farnost-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Po týdnech</span>
            </button>
          </div>

          {/* Month Navigation & Dropdown (when periodMode === 'MONTH') */}
          {periodMode === 'MONTH' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonthFilter(getPrevMonthStr(selectedMonthFilter))}
                className="px-2.5 py-2 bg-farnost-100 hover:bg-farnost-200 border border-farnost-300 rounded-md text-farnost-900 font-extrabold cursor-pointer min-h-[40px] flex items-center justify-center transition"
                title="Předchozí měsíc"
              >
                <ChevronLeft className="w-5 h-5 text-farnost-800" />
              </button>

              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="px-3 py-2 bg-farnost-100 border-2 border-farnost-300 rounded-md text-farnost-900 font-black min-h-[40px] cursor-pointer"
              >
                <option value="ALL">Všechny měsíce</option>
                {availableMonths.map((m) => {
                  const isCurrentMonth = m === todayStr.substring(0, 7);
                  return (
                    <option key={m} value={m}>
                      {getCzechMonthLabel(m)} {isCurrentMonth ? '(Tento měsíc)' : ''}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setSelectedMonthFilter(getNextMonthStr(selectedMonthFilter))}
                className="px-2.5 py-2 bg-farnost-100 hover:bg-farnost-200 border border-farnost-300 rounded-md text-farnost-900 font-extrabold cursor-pointer min-h-[40px] flex items-center justify-center transition"
                title="Následující měsíc"
              >
                <ChevronRight className="w-5 h-5 text-farnost-800" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonthFilter(todayStr.substring(0, 7))}
                className="px-3 py-2 bg-farnost-200 hover:bg-farnost-300 border border-farnost-300 rounded-md text-farnost-900 font-bold cursor-pointer min-h-[40px] text-xs transition"
                title="Skočit na tento měsíc"
              >
                Tento měsíc
              </button>
            </div>
          )}

          {/* Week Navigation & Dropdown (when periodMode === 'WEEK') */}
          {periodMode === 'WEEK' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedWeekFilter(getPrevWeekStr(selectedWeekFilter))}
                className="px-2.5 py-2 bg-farnost-100 hover:bg-farnost-200 border border-farnost-300 rounded-md text-farnost-900 font-extrabold cursor-pointer min-h-[40px] flex items-center justify-center transition"
                title="Předchozí týden"
              >
                <ChevronLeft className="w-5 h-5 text-farnost-800" />
              </button>

              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="px-3 py-2 bg-farnost-100 border-2 border-farnost-300 rounded-md text-farnost-900 font-black min-h-[40px] cursor-pointer"
              >
                <option value="ALL">Všechny týdny</option>
                {availableWeeks.map((w) => {
                  const isCurrentWeek = w === currentMondayStr;
                  const label = formatWeekRangeLabel(w);
                  return (
                    <option key={w} value={w}>
                      {label} {isCurrentWeek ? '(Tento týden)' : ''}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setSelectedWeekFilter(getNextWeekStr(selectedWeekFilter))}
                className="px-2.5 py-2 bg-farnost-100 hover:bg-farnost-200 border border-farnost-300 rounded-md text-farnost-900 font-extrabold cursor-pointer min-h-[40px] flex items-center justify-center transition"
                title="Následující týden"
              >
                <ChevronRight className="w-5 h-5 text-farnost-800" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedWeekFilter(currentMondayStr)}
                className="px-3 py-2 bg-farnost-200 hover:bg-farnost-300 border border-farnost-300 rounded-md text-farnost-900 font-bold cursor-pointer min-h-[40px] text-xs transition"
                title="Skočit na tento týden"
              >
                Tento týden
              </button>
            </div>
          )}

          {/* Rank Dropdown */}
          <select
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
            className="px-3 py-2 bg-farnost-50 border border-farnost-200 rounded-md text-slate-800 font-bold min-h-[40px]"
          >
            <option value="ALL">Všechny typy liturgií</option>
            <option value="SLAVNOSTI">Jen Slavnosti ★</option>
            <option value="SVATKY">Slavnosti a Svátky</option>
            <option value="NEDELE">Neděle a Slavnosti</option>
          </select>

          {/* Checkbox for only available */}
          <label className="flex items-center space-x-2 px-3 py-2 bg-farnost-50 border border-farnost-200 rounded-md cursor-pointer text-slate-800 font-bold min-h-[40px]">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-farnost-700 focus:ring-farnost-700 w-4 h-4"
            />
            <span>Jen volná místa</span>
          </label>

          <span className="text-farnost-800 text-xs font-bold ml-auto flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-farnost-700" /> Kostel Svaté Rodiny, Luhačovice
          </span>
        </div>

      </div>


      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-medium">
        <span className="uppercase tracking-wider font-extrabold text-[11px] text-farnost-800">
          Rozpis mší svatých ({filteredMasses.length})
        </span>
        <span className="text-farnost-800 text-xs font-bold hidden sm:inline">
          💡 Pro přihlášení klikněte na zelené tlačítko "Zapsat se"
        </span>
      </div>

      {/* Masses Rendering: Excel Table vs Cards */}
      {filteredMasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md border-2 border-farnost-200 p-8 shadow-xs">
          <Church className="w-12 h-12 mx-auto text-farnost-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Žádné mše svaté neodpovídají zadaným filtrům
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Zkus upravit vyhledávání nebo změnit filtr na "Vše" či "Nadcházející".
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Excel Table View */
        <div className="bg-white rounded-md shadow-sm border-2 border-farnost-300 overflow-hidden">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="bg-farnost-800 text-white text-xs uppercase font-black border-b-2 border-farnost-900">
                <tr>
                  <th className="px-4 py-3.5 border-r border-farnost-700 w-36 whitespace-nowrap">Den a Čas</th>
                  <th className="px-4 py-3.5 border-r border-farnost-700 min-w-[180px]">Liturgie / Název mše</th>
                  <th className="px-4 py-3.5 border-r border-farnost-700">Oltářní služba (Ministranti)</th>
                  <th className="px-4 py-3.5 text-center w-36">Zapsat se</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farnost-200 text-xs bg-white">
                {filteredMasses.map((mass) => {
                  const isLocked = mass.isLocked || globalLockSignups;
                  const rankStyle = getRankBadgeStyle(mass.rank);

                  return (
                    <tr
                      key={mass.id}
                      className="bg-white hover:bg-farnost-50/90 transition-colors border-b border-farnost-200"
                    >
                      {/* Den a Čas */}
                      <td className="px-4 py-3.5 border-r border-farnost-200 align-middle whitespace-nowrap bg-white">
                        <div className="font-black text-slate-900 text-sm">
                          {formatShortCzechDate(mass.date)}
                        </div>
                        <div className="text-farnost-700 font-black text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {mass.time}
                        </div>
                      </td>

                      {/* Název & Typ */}
                      <td className="px-4 py-3.5 border-r border-farnost-200 align-middle bg-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                            {rankStyle.label}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm leading-snug">
                          {mass.title}
                        </div>
                        {mass.note && (
                          <div className="text-[11px] text-farnost-800 italic mt-0.5 font-medium">
                            {mass.note}
                          </div>
                        )}
                      </td>

                      {/* Ministranti */}
                      <td className="px-4 py-3.5 border-r border-farnost-200 align-middle bg-white">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {mass.assignments.map((a) => {
                            const server = ministrantsMap.get(a.serverId);
                            if (!server) return null;
                            return (
                              <button
                                key={server.id}
                                type="button"
                                onClick={() => (!isLocked || isAdmin) && onQuickUnassign(mass.id, server.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-white border border-farnost-300 text-xs font-extrabold text-slate-900 shadow-2xs ${
                                  (!isLocked || isAdmin)
                                    ? 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-900 cursor-pointer group transition'
                                    : ''
                                }`}
                                title={(!isLocked || isAdmin) ? 'Kliknutím odhlásíš z této mše' : ''}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: server.avatarColor || '#4d6e00' }}
                                />
                                <span>{server.name}</span>
                                {(!isLocked || isAdmin) && (
                                  <span className="text-slate-400 group-hover:text-rose-600 transition ml-0.5 p-0.5">
                                    <X className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {/* Add button slot */}
                          {!isLocked && (
                            <button
                              onClick={() => onOpenSignUpModal(mass)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border-2 border-dashed border-farnost-600 text-xs font-black text-farnost-800 hover:bg-farnost-100 cursor-pointer transition min-h-[36px]"
                              title="Zapsat ministranta na tuto mši"
                            >
                              + Zapsat se
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap bg-white">
                        <button
                          disabled={isLocked}
                          onClick={() => !isLocked && onOpenSignUpModal(mass)}
                          className={`w-full py-2.5 px-3 rounded-md font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                            isLocked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-farnost-700 hover:bg-farnost-800 text-white'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Zamčeno</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Zapsat se</span>
                            </>
                          )}
                        </button>

                        {isAdmin && (
                          <div className="flex justify-center gap-1 mt-2">
                            {onAdminToggleLock && (
                              <button
                                onClick={() => onAdminToggleLock(mass.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                title={mass.isLocked ? 'Odemknout mši' : 'Uzamknout mši'}
                              >
                                <Lock className={`w-3.5 h-3.5 ${mass.isLocked ? 'text-rose-500' : 'text-slate-400'}`} />
                              </button>
                            )}
                            {onAdminEditMass && (
                              <button
                                onClick={() => onAdminEditMass(mass)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                Upravit
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMasses.map((mass) => (
            <MassCard
              key={mass.id}
              mass={mass}
              ministrantsMap={ministrantsMap}
              onOpenSignUpModal={onOpenSignUpModal}
              onQuickUnassign={onQuickUnassign}
              isAdmin={isAdmin}
              onAdminToggleLock={onAdminToggleLock}
              onAdminEditMass={onAdminEditMass}
              globalLockSignups={globalLockSignups}
            />
          ))}
        </div>
      )}

    </div>
  );
};
