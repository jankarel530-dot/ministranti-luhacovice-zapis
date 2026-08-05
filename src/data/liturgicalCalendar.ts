import { LiturgicalRank, LiturgicalColor, LiturgicalFeast } from '../types';

/**
 * Calculates Easter Sunday date for a given year using Meeus/Jones/Butcher algorithm
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get all feasts for a given year (Fixed + Movable)
 */
export function getLiturgicalFeastsForYear(year: number): Map<string, LiturgicalFeast> {
  const map = new Map<string, LiturgicalFeast>();

  // Fixed feasts
  const fixedFeasts: { monthDay: string; name: string; rank: LiturgicalRank; color: LiturgicalColor; desc?: string }[] = [
    { monthDay: '01-01', name: 'Slavnost Matky Boží, Panny Marie', rank: 'slavnost', color: 'white', desc: 'Nový rok, zasvěcený den' },
    { monthDay: '01-06', name: 'Slavnost Zjevení Páně (Tři králové)', rank: 'slavnost', color: 'white' },
    { monthDay: '02-02', name: 'Svátek Uvedení Páně do chrámu (Hromnice)', rank: 'svatek', color: 'white' },
    { monthDay: '03-19', name: 'Slavnost sv. Josefa, snoubence P. Marie', rank: 'slavnost', color: 'white' },
    { monthDay: '03-25', name: 'Slavnost Zvěstování Páně', rank: 'slavnost', color: 'white' },
    { monthDay: '05-01', name: 'Sv. Josefa, dělníka', rank: 'pamatka', color: 'white' },
    { monthDay: '05-31', name: 'Svátek Navštívení Panny Marie', rank: 'svatek', color: 'white' },
    { monthDay: '06-24', name: 'Slavnost Narození sv. Jana Křtitele', rank: 'slavnost', color: 'white' },
    { monthDay: '06-29', name: 'Slavnost sv. Petra a Pavla', rank: 'slavnost', color: 'red' },
    { monthDay: '07-05', name: 'Slavnost sv. Cyrila a Metoděje', rank: 'slavnost', color: 'white', desc: 'Patroni Moravy a spolupatroni Evropy' },
    { monthDay: '07-06', name: 'Svátek sv. Jana Husa', rank: 'svatek', color: 'red' },
    { monthDay: '07-25', name: 'Svátek sv. Jakuba, apoštola', rank: 'svatek', color: 'red' },
    { monthDay: '08-06', name: 'Svátek Proměnění Páně', rank: 'svatek', color: 'white' },
    { monthDay: '08-15', name: 'Slavnost Nanebevzetí Panny Marie', rank: 'slavnost', color: 'gold', desc: 'Hlavní mariánská slavnost roku' },
    { monthDay: '09-08', name: 'Svátek Narození Panny Marie', rank: 'svatek', color: 'white' },
    { monthDay: '09-28', name: 'Slavnost sv. Václava', rank: 'slavnost', color: 'red', desc: 'Hlavní patron českého národa' },
    { monthDay: '10-28', name: 'Svátek sv. Šimona a Judy', rank: 'svatek', color: 'red' },
    { monthDay: '11-01', name: 'Slavnost Všech svatých', rank: 'slavnost', color: 'gold' },
    { monthDay: '11-02', name: 'Vzpomínka na všechny věrné zesnulé', rank: 'pamatka', color: 'purple' },
    { monthDay: '11-30', name: 'Svátek sv. Ondřeje, apoštola', rank: 'svatek', color: 'red' },
    { monthDay: '12-08', name: 'Slavnost Panny Marie, počaté bez hříchu', rank: 'slavnost', color: 'blue' },
    { monthDay: '12-24', name: 'Štědrý den - Vigilie Narození Páně', rank: 'slavnost', color: 'gold' },
    { monthDay: '12-25', name: 'Slavnost Narození Páně (Boží hod)', rank: 'slavnost', color: 'gold' },
    { monthDay: '12-26', name: 'Svátek sv. Štěpána, prvomučedníka', rank: 'svatek', color: 'red' },
    { monthDay: '12-27', name: 'Svátek sv. Jana, apoštola a evangelisty', rank: 'svatek', color: 'white' },
    { monthDay: '12-31', name: 'Sv. Silvestra I., papeže', rank: 'pamatka', color: 'white' },
  ];

  for (const f of fixedFeasts) {
    const key = `${year}-${f.monthDay}`;
    map.set(key, {
      date: key,
      name: f.name,
      rank: f.rank,
      color: f.color,
      description: f.desc,
      isMovable: false,
    });
  }

  // Movable Feasts based on Easter
  const easter = getEasterSunday(year);

  const movables: { offset: number; name: string; rank: LiturgicalRank; color: LiturgicalColor; desc?: string }[] = [
    { offset: -46, name: 'Popelční středa', rank: 'slavnost', color: 'purple', desc: 'Začátek doby postní' },
    { offset: -7, name: 'Květná neděle (Pašijová)', rank: 'slavnost', color: 'red', desc: 'Vjezd Ježíše do Jeruzaléma' },
    { offset: -3, name: 'Zelený čtvrtek', rank: 'slavnost', color: 'gold', desc: 'Mše svatá na památku Večeře Páně' },
    { offset: -2, name: 'Velký pátek', rank: 'slavnost', color: 'red', desc: 'Památka Utrpení a Smrti Páně' },
    { offset: -1, name: 'Bílá sobota - Velikonoční vigilie', rank: 'slavnost', color: 'gold', desc: 'Noc vzkříšení' },
    { offset: 0, name: 'Zmrtvýchvstání Páně (Boží hod velikonoční)', rank: 'slavnost', color: 'gold', desc: 'Největší slavnost roku' },
    { offset: 1, name: 'Pondělí Velikonočního oktávu', rank: 'svatek', color: 'white' },
    { offset: 39, name: 'Slavnost Nanebevstoupení Páně', rank: 'slavnost', color: 'white' },
    { offset: 49, name: 'Slavnost Seslání Ducha Svatého (Letnice)', rank: 'slavnost', color: 'red' },
    { offset: 56, name: 'Slavnost Nejsvětější Trojice', rank: 'slavnost', color: 'white' },
    { offset: 60, name: 'Slavnost Těla a Krve Páně (Boží Tělo)', rank: 'slavnost', color: 'gold', desc: 'Průvod u kostela Svaté Rodiny' },
    { offset: 68, name: 'Slavnost Nejsvětějšího Srdce Ježíšova', rank: 'slavnost', color: 'white' },
  ];

  for (const m of movables) {
    const dateObj = addDays(easter, m.offset);
    const key = formatDateKey(dateObj);
    map.set(key, {
      date: key,
      name: m.name,
      rank: m.rank,
      color: m.color,
      description: m.desc,
      isMovable: true,
    });
  }

  // Luhačovice special: Slavnost Svaté Rodiny (Neděle v oktávu Narození Páně) - Patrocinium kostela v Luhačovicích!
  const dec25 = new Date(Date.UTC(year, 11, 25));
  let holyFamilyDate = new Date(dec25);
  // Find Sunday between Dec 26 and Dec 31, if Dec 25 is Sunday, it's Dec 30
  let dayOfWeek = holyFamilyDate.getUTCDay();
  let daysUntilSunday = (7 - dayOfWeek) % 7;
  if (daysUntilSunday === 0) daysUntilSunday = 7;
  holyFamilyDate = addDays(dec25, daysUntilSunday);
  if (holyFamilyDate.getUTCFullYear() === year && holyFamilyDate.getUTCMonth() === 11) {
    const key = formatDateKey(holyFamilyDate);
    map.set(key, {
      date: key,
      name: 'Slavnost Svaté Rodiny - Titulární slavnost kostela v Luhačovicích',
      rank: 'slavnost',
      color: 'gold',
      description: 'Poutní slavnost farního kostela v Luhačovicích',
      isMovable: true,
    });
  }

  return map;
}

/**
 * Get info about a specific date
 */
export function getLiturgicalInfoForDate(dateStr: string): {
  rank: LiturgicalRank;
  color: LiturgicalColor;
  title: string;
  description?: string;
  isSunday: boolean;
} {
  const dateObj = new Date(dateStr + 'T00:00:00Z');
  const year = dateObj.getUTCFullYear();
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday
  const isSunday = dayOfWeek === 0;

  const feastMap = getLiturgicalFeastsForYear(year);
  const feast = feastMap.get(dateStr);

  if (feast) {
    return {
      rank: feast.rank,
      color: feast.color,
      title: feast.name,
      description: feast.description,
      isSunday,
    };
  }

  if (isSunday) {
    return {
      rank: 'nedele',
      color: 'green',
      title: 'Nedělní mše svatá',
      description: 'Neděle během roku',
      isSunday: true,
    };
  }

  if (dayOfWeek === 6) {
    return {
      rank: 'vsedni',
      color: 'white',
      title: 'Sobotní mše svatá',
      description: 'Sobota',
      isSunday: false,
    };
  }

  return {
    rank: 'vsedni',
    color: 'green',
    title: 'Mše svatá ve všední den',
    isSunday: false,
  };
}

/**
 * Standard Luhačovice parish schedule generator for a date range
 */
export function generateParishScheduleForRange(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');
  const masses: Array<{
    date: string;
    time: string;
    location: string;
    title: string;
    rank: LiturgicalRank;
    liturgicalColor: LiturgicalColor;
    maxServers: number;
    note?: string;
  }> = [];

  const curr = new Date(start);
  while (curr <= end) {
    const dateStr = formatDateKey(curr);
    const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Mon ... 6 = Sat
    const info = getLiturgicalInfoForDate(dateStr);

    if (dayOfWeek === 0) {
      // Sunday Schedule in Luhačovice (No Pozlovice)
      masses.push({
        date: dateStr,
        time: '07:30',
        location: 'Kostel Svaté Rodiny, Luhačovice',
        title: info.title + ' (Ranní mše)',
        rank: info.rank,
        liturgicalColor: info.color,
        maxServers: info.rank === 'slavnost' ? 6 : 4,
        note: info.description || 'Pravidelná nedělní ranní mše',
      });

      masses.push({
        date: dateStr,
        time: '10:30',
        location: 'Kostel Svaté Rodiny, Luhačovice',
        title: info.title + ' (Hrubá mše)',
        rank: info.rank,
        liturgicalColor: info.color,
        maxServers: info.rank === 'slavnost' ? 6 : 5,
        note: 'Hrubá mše se zpěvem a dětmi',
      });
    } else if (dayOfWeek === 6) {
      // Saturday Vigil
      masses.push({
        date: dateStr,
        time: '18:00',
        location: 'Kostel Svaté Rodiny, Luhačovice',
        title: info.title !== 'Sobotní mše svatá' ? info.title : 'Nedělní vigilie (Sobota)',
        rank: info.rank !== 'vsedni' ? info.rank : 'nedele',
        liturgicalColor: info.color,
        maxServers: 4,
        note: 'Vigilní mše svatá s nedělní platností',
      });
    } else if (dayOfWeek >= 2 && dayOfWeek <= 5) {
      // Tue, Wed, Thu, Fri evening mass
      masses.push({
        date: dateStr,
        time: '17:30',
        location: 'Kostel Svaté Rodiny, Luhačovice',
        title: info.title,
        rank: info.rank,
        liturgicalColor: info.color,
        maxServers: info.rank === 'slavnost' || info.rank === 'svatek' ? 5 : 3,
        note: info.description || 'Večerní mše svatá',
      });
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return masses;
}
