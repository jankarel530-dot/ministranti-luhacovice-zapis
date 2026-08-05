import React, { useState } from 'react';
import { getLiturgicalFeastsForYear } from '../data/liturgicalCalendar';
import { LiturgicalFeast } from '../types';
import { formatCzechDate, getRankBadgeStyle, getLiturgicalColorStyle } from '../utils/helpers';
import { BookOpen, Sparkles, Calendar, Plus, Info, RefreshCw } from 'lucide-react';

interface LiturgicalCalendarViewProps {
  onGenerateMonthSchedule?: (year: number, month: number) => void;
  isAdmin: boolean;
}

export const LiturgicalCalendarView: React.FC<LiturgicalCalendarViewProps> = ({
  onGenerateMonthSchedule,
  isAdmin,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-indexed

  const feastsMap = getLiturgicalFeastsForYear(selectedYear);
  const feastsList: LiturgicalFeast[] = Array.from(feastsMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const monthFeasts = feastsList.filter((f) => {
    const month = parseInt(f.date.split('-')[1], 10);
    return month === selectedMonth;
  });

  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-indigo-700 text-white rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-200" /> Liturgický rok C / I
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Liturgický kalendář Církve v ČR
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Přehled slavností, svátků a památek českého liturgického kalendáře s barevným odlišením podle církevních předpisů.
          </p>
        </div>
      </div>

      {/* Color & Rank Legend */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Vysvětlivky barevného odlišení a hodností:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300">
            <div className="flex items-center space-x-2 font-bold text-amber-900 mb-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300" />
              <span>Slavnost (Sollemnitas)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Nejvyšší lit. hodnost (Vánoce, Velikonoce, Sv. Václav, Nanebevzetí P. Marie). Zlatá/Bílá barva.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-300">
            <div className="flex items-center space-x-2 font-bold text-blue-900 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-300" />
              <span>Svátek (Festum)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Apoštolové, evangelisté, významné dny (Sv. Jan Hus, Proměnění Páně). Modrá/Červená/Bílá barva.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-300">
            <div className="flex items-center space-x-2 font-bold text-purple-900 mb-1">
              <span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-300" />
              <span>Památka (Memoria)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Vzpomínka na svaté a mučedníky. Červená, bílá nebo fialová barva.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
            <div className="flex items-center space-x-2 font-bold text-emerald-900 mb-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
              <span>Neděle & Všední den</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Den Páně (neděle) a běžný liturgický mezidobní cyklus. Zelená barva.
            </p>
          </div>

        </div>
      </div>

      {/* Month Selector & Feasts List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {mName} ({selectedYear})
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
            >
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          {/* Admin Auto-generate schedule button */}
          {isAdmin && onGenerateMonthSchedule && (
            <button
              onClick={() => onGenerateMonthSchedule(selectedYear, selectedMonth)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Vygenerovat mše na měsíc {monthNames[selectedMonth - 1]}</span>
            </button>
          )}
        </div>

        {/* List of feasts in selected month */}
        <div className="space-y-3">
          {monthFeasts.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              V tomto měsíci nejsou žádné pevné či pohyblivé slavnosti (platí standardní nedělní a všední rozpis).
            </p>
          ) : (
            monthFeasts.map((feast) => {
              const rankStyle = getRankBadgeStyle(feast.rank);
              const colorStyle = getLiturgicalColorStyle(feast.color);

              return (
                <div
                  key={feast.date}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition gap-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 text-center shrink-0">
                      <span className="block text-xs font-bold text-slate-400 uppercase">
                        {new Date(feast.date + 'T00:00:00Z').toLocaleDateString('cs-CZ', { weekday: 'short' })}
                      </span>
                      <span className="block text-lg font-extrabold text-slate-900 dark:text-white">
                        {new Date(feast.date + 'T00:00:00Z').getUTCDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}
                        >
                          {rankStyle.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${colorStyle.bg}`}
                        >
                          {feast.color}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {feast.name}
                      </h4>
                      {feast.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {feast.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 self-end sm:self-center">
                    {formatCzechDate(feast.date)}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
