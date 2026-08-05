import confetti from 'canvas-confetti';
import { LiturgicalRank, LiturgicalColor } from '../types';

export function formatCzechDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const monthNames = [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
  ];

  const dayOfWeek = dayNames[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${dayOfWeek} ${day}. ${month} ${year}`;
}

export function formatShortCzechDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayNamesShort = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  const dayOfWeek = dayNamesShort[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;

  return `${dayOfWeek} ${day}.${month}.`;
}

export function getCzechMonthLabel(yearMonthStr: string): string {
  if (!yearMonthStr || !yearMonthStr.includes('-')) return yearMonthStr;
  const [year, month] = yearMonthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  const czechMonths = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${czechMonths[monthIdx]} ${year}`;
  }
  return yearMonthStr;
}

export function getRankBadgeStyle(rank: LiturgicalRank): { bg: string; text: string; border: string; label: string } {
  switch (rank) {
    case 'slavnost':
      return {
        bg: 'bg-emerald-800 dark:bg-emerald-900',
        text: 'text-white font-bold',
        border: 'border-emerald-900',
        label: 'Slavnost ★',
      };
    case 'svatek':
      return {
        bg: 'bg-emerald-700 dark:bg-emerald-800',
        text: 'text-white font-semibold',
        border: 'border-emerald-800',
        label: 'Svátek',
      };
    case 'pamatka':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/80',
        text: 'text-emerald-900 dark:text-emerald-200 font-semibold',
        border: 'border-emerald-300 dark:border-emerald-700',
        label: 'Památka',
      };
    case 'nedele':
      return {
        bg: 'bg-emerald-600 dark:bg-emerald-700',
        text: 'text-white font-bold',
        border: 'border-emerald-700',
        label: 'Neděle',
      };
    case 'vsedni':
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-800 dark:text-slate-200 font-medium',
        border: 'border-slate-300 dark:border-slate-700',
        label: 'Všední den',
      };
  }
}

export function getLiturgicalColorStyle(color: LiturgicalColor): { bg: string; dot: string; text: string; ring: string } {
  return {
    bg: 'bg-emerald-700 text-white',
    dot: 'bg-emerald-600',
    text: 'text-emerald-800 dark:text-emerald-300',
    ring: 'ring-emerald-500',
  };
}

export function triggerCelebrationConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#059669', '#10b981', '#047857', '#065f46', '#ffffff'],
  });
}

export function getMondayDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().split('T')[0];
}

export function formatWeekRangeLabel(mondayStr: string): string {
  if (!mondayStr) return '';
  const mon = new Date(mondayStr + 'T00:00:00Z');
  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);

  const mDay = mon.getUTCDate();
  const mMonth = mon.getUTCMonth() + 1;
  const sDay = sun.getUTCDate();
  const sMonth = sun.getUTCMonth() + 1;
  const year = sun.getUTCFullYear();

  if (mMonth === sMonth) {
    return `${mDay}. – ${sDay}. ${sMonth}. ${year}`;
  }
  return `${mDay}. ${mMonth}. – ${sDay}. ${sMonth}. ${year}`;
}

export function getPrevMonthStr(currentMonth: string): string {
  const todayMonth = new Date().toISOString().substring(0, 7);
  const base = currentMonth === 'ALL' || !currentMonth ? todayMonth : currentMonth;
  const parts = base.split('-').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return todayMonth;
  const prevDate = new Date(Date.UTC(parts[0], parts[1] - 2, 1));
  return prevDate.toISOString().substring(0, 7);
}

export function getNextMonthStr(currentMonth: string): string {
  const todayMonth = new Date().toISOString().substring(0, 7);
  const base = currentMonth === 'ALL' || !currentMonth ? todayMonth : currentMonth;
  const parts = base.split('-').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return todayMonth;
  const nextDate = new Date(Date.UTC(parts[0], parts[1], 1));
  return nextDate.toISOString().substring(0, 7);
}

export function getPrevWeekStr(currentWeek: string): string {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMonday = getMondayDateStr(todayStr);
  const base = currentWeek === 'ALL' || !currentWeek ? todayMonday : currentWeek;
  const d = new Date(base + 'T00:00:00Z');
  if (isNaN(d.getTime())) return todayMonday;
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().split('T')[0];
}

export function getNextWeekStr(currentWeek: string): string {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMonday = getMondayDateStr(todayStr);
  const base = currentWeek === 'ALL' || !currentWeek ? todayMonday : currentWeek;
  const d = new Date(base + 'T00:00:00Z');
  if (isNaN(d.getTime())) return todayMonday;
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().split('T')[0];
}
