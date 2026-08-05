import React, { useState, useMemo } from 'react';
import { Mass, Ministrant } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Trophy, Award, Medal, Users, Calendar, Sparkles, Search, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StatsViewProps {
  masses: Mass[];
  ministrants: Ministrant[];
}

export const StatsView: React.FC<StatsViewProps> = ({ masses, ministrants }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate statistics per ministrant
  const statsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        sundayAndSolemnity: number;
        weekday: number;
        lastServedDate?: string;
      }
    >();

    for (const m of ministrants) {
      map.set(m.id, { total: 0, sundayAndSolemnity: 0, weekday: 0 });
    }

    for (const mass of masses) {
      const isSundayOrSolemnity = mass.rank === 'slavnost' || mass.rank === 'nedele';
      for (const assign of mass.assignments) {
        const entry = map.get(assign.serverId);
        if (entry) {
          entry.total += 1;
          if (isSundayOrSolemnity) {
            entry.sundayAndSolemnity += 1;
          } else {
            entry.weekday += 1;
          }
          if (!entry.lastServedDate || mass.date > entry.lastServedDate) {
            entry.lastServedDate = mass.date;
          }
        }
      }
    }

    return map;
  }, [masses, ministrants]);

  // Ranked list of ministrants
  const rankedMinistrants = useMemo(() => {
    return ministrants
      .filter((m) => m.isActive)
      .map((m) => {
        const stat = statsMap.get(m.id) || { total: 0, sundayAndSolemnity: 0, weekday: 0 };
        return {
          ...m,
          total: stat.total,
          sundayAndSolemnity: stat.sundayAndSolemnity,
          weekday: stat.weekday,
          lastServedDate: stat.lastServedDate,
        };
      })
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return m.name.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [ministrants, statsMap, searchQuery]);

  // Overall parish totals
  const totalAssignmentsCount = useMemo(() => {
    return masses.reduce((sum, m) => sum + m.assignments.length, 0);
  }, [masses]);

  const totalMassesCount = masses.length;

  // Chart Data: Top 10 Ministrants
  const topBarChartData = useMemo(() => {
    return rankedMinistrants.slice(0, 10).map((m) => ({
      name: m.name.split(' ')[0],
      Služby: m.total,
      Slavnosti: m.sundayAndSolemnity,
    }));
  }, [rankedMinistrants]);

  // Chart Data: Breakdown by Liturgical Rank
  const rankPieChartData = useMemo(() => {
    let slavnosti = 0;
    let nedele = 0;
    let vsedni = 0;

    for (const m of masses) {
      if (m.rank === 'slavnost') slavnosti += m.assignments.length;
      else if (m.rank === 'nedele') nedele += m.assignments.length;
      else vsedni += m.assignments.length;
    }

    return [
      { name: 'Slavnosti & Svátky', value: slavnosti, color: '#f59e0b' },
      { name: 'Neděle', value: nedele, color: '#10b981' },
      { name: 'Všední dny', value: vsedni, color: '#6366f1' },
    ];
  }, [masses]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-indigo-700 text-white rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white mb-2 border border-white/20">
            <Trophy className="w-3.5 h-3.5 mr-1 text-yellow-300" /> Veřejné statistiky
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Přehled a žebříček ministrantů
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Aktivita ministrantů při mších svatých v Luhačovicích a Pozlovicích.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg text-center border border-white/10">
            <span className="block text-xl font-black">{totalAssignmentsCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-200">Obsazených služeb</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg text-center border border-white/10">
            <span className="block text-xl font-black">{totalMassesCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-200">Naplánovaných mší</span>
          </div>
        </div>
      </div>

      {/* Podium - Top 3 Ministrants */}
      {rankedMinistrants.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* #2 Silver */}
          <div className="order-2 md:order-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-lg mb-2 border-2 border-slate-300">
              🥈 2.
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {rankedMinistrants[1].name}
            </h3>
            <div className="mt-3 px-3 py-1 bg-slate-100 rounded-full font-black text-slate-900 text-sm">
              {rankedMinistrants[1].total} služeb
            </div>
          </div>

          {/* #1 Gold */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent bg-white rounded-2xl p-6 border-2 border-amber-400 shadow-md flex flex-col items-center text-center relative overflow-hidden scale-105">
            <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
              1. Místo
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-2xl mb-2 border-4 border-amber-400">
              🥇
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {rankedMinistrants[0].name}
            </h3>
            <div className="mt-4 px-4 py-1.5 bg-amber-500 text-white rounded-full font-black text-base shadow-sm">
              {rankedMinistrants[0].total} služeb
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="order-3 md:order-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-amber-900/10 flex items-center justify-center text-amber-800 font-extrabold text-lg mb-2 border-2 border-amber-700/40">
              🥉 3.
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {rankedMinistrants[2].name}
            </h3>
            <div className="mt-3 px-3 py-1 bg-slate-100 rounded-full font-black text-slate-900 text-sm">
              {rankedMinistrants[2].total} služeb
            </div>
          </div>

        </div>
      )}

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Top 10 Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-amber-600" />
            Top 10 nejaktivnějších ministrantů (Počet služeb)
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Služby" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rank Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
            Rozdělení služeb podle typu mše
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rankPieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rankPieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => <span className="text-xs text-slate-700 font-bold">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-amber-600" />
            Kompletní seznam služeb ministrantů
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vyhledat ministra..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Pořadí</th>
                <th className="px-4 py-3">Jméno a příjmení</th>
                <th className="px-4 py-3 text-center">Neděle & Slavnosti</th>
                <th className="px-4 py-3 text-center">Všední dny</th>
                <th className="px-4 py-3 text-right">Celkem služeb</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedMinistrants.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
                    />
                    <span>{m.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-amber-600">
                    {m.sundayAndSolemnity}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 font-medium">
                    {m.weekday}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 text-base">
                    {m.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
