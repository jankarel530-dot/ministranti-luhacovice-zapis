import React, { useState, useMemo, useEffect } from 'react';
import { Mass, Ministrant, AppConfig, Form, FormResponse, SubAdminPin, AdminPermissions } from '../types';
import { EventsData } from '../types/events';
import { exportBackupJSON, importBackupJSON, resetToDefaultData } from '../utils/storage';
import { getCzechMonthLabel, getMondayDateStr, formatWeekRangeLabel, getPrevMonthStr, getNextMonthStr, getPrevWeekStr, getNextWeekStr } from '../utils/helpers';
import { exportMassesToPDF, exportMinistrantsToPDF } from '../utils/pdfExport';
import { ConfirmModal } from './ConfirmModal';
import { AdminFormsManager } from './AdminFormsManager';
import { AdminUsersManager } from './AdminUsersManager';
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
import {
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Users,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Repeat,
  UserPlus,
  Printer,
  Crown,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Phone,
  PieChart as PieChartIcon,
  FileText,
  KeyRound,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminPanelProps {
  masses: Mass[];
  ministrants: Ministrant[];
  forms?: Form[];
  formResponses?: FormResponse[];
  eventsData?: EventsData;
  config: AppConfig;
  isMasterAdmin: boolean;
  loggedSubAdminId?: string;
  adminPermissions?: AdminPermissions;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onUpdateEventsData?: (newEventsData: EventsData) => void;
  onAddMass: (mass: Omit<Mass, 'id' | 'assignments'>) => void;
  onEditMass: (mass: Mass) => void;
  onDeleteMass: (massId: string) => void;
  onDeleteMultipleMasses?: (massIds: string[]) => void;
  onToggleLockMass: (massId: string) => void;
  onAddMinistrant: (min: Omit<Ministrant, 'id'>) => void;
  onEditMinistrant: (min: Ministrant) => void;
  onDeleteMinistrant: (minId: string) => void;
  onDeleteMultipleMinistrants?: (minIds: string[]) => void;
  onGenerateMonth: (year: number, month: number) => void;
  onRestoreData: (data: any) => void;
  onClearAllMasses: () => void;
  onSaveForm?: (form: Form) => void;
  onDeleteForm?: (formId: string) => void;
  onDeleteFormResponse?: (responseId: string) => void;
  onClearFormResponses?: (formId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  masses,
  ministrants,
  forms = [],
  formResponses = [],
  eventsData = { events: [], participants: [], teams: [], rooms: [], leaders: [], schedules: [], tasks: [], documents: [], notices: [], emailLogs: [], photos: [] },
  config,
  isMasterAdmin,
  loggedSubAdminId,
  adminPermissions = {
    canManageSchedule: true,
    canManageForms: true,
    canViewFormSubmissions: true,
    canViewAnalytics: true,
  },
  onUpdateConfig,
  onUpdateEventsData,
  onAddMass,
  onEditMass,
  onDeleteMass,
  onDeleteMultipleMasses,
  onToggleLockMass,
  onAddMinistrant,
  onEditMinistrant,
  onDeleteMinistrant,
  onDeleteMultipleMinistrants,
  onGenerateMonth,
  onRestoreData,
  onClearAllMasses,
  onSaveForm,
  onDeleteForm,
  onDeleteFormResponse,
  onClearFormResponses,
}) => {
  const [activeTab, setActiveTab] = useState<'masses' | 'ministrants' | 'forms' | 'accounts' | 'analytics' | 'backup'>('masses');
  const [adminPeriodMode, setAdminPeriodMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [adminMonthFilter, setAdminMonthFilter] = useState<string>('ALL');
  const [adminWeekFilter, setAdminWeekFilter] = useState<string>('ALL');
  const [adminSortOrder, setAdminSortOrder] = useState<'NEJBLIZSI' | 'NEJVDALENEJSI' | 'CAS' | 'NEJMENE_OBSAZENE' | 'MISTO'>('NEJBLIZSI');

  // Auto-switch tab if current tab is not allowed by sub-admin permissions
  useEffect(() => {
    if (isMasterAdmin) return;
    const canSchedule = adminPermissions.canManageSchedule;
    const canForms = adminPermissions.canManageForms || adminPermissions.canViewFormSubmissions;
    const canAnalytics = adminPermissions.canViewAnalytics;

    if ((activeTab === 'masses' || activeTab === 'ministrants') && !canSchedule) {
      if (canForms) setActiveTab('forms');
      else if (canAnalytics) setActiveTab('analytics');
    } else if (activeTab === 'accounts' && !isMasterAdmin) {
      if (canSchedule) setActiveTab('masses');
      else if (canForms) setActiveTab('forms');
      else if (canAnalytics) setActiveTab('analytics');
    }
  }, [isMasterAdmin, adminPermissions, activeTab]);

  // Form states for adding/editing mass
  const [isMyPinModalOpen, setIsMyPinModalOpen] = useState(false);
  const [myNewPinInput, setMyNewPinInput] = useState('');
  const [myPinSuccessMsg, setMyPinSuccessMsg] = useState<string | null>(null);

  const handleSaveMyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = myNewPinInput.trim();
    if (clean.length < 4) {
      alert('Váš nový PIN kód musí mít alespoň 4 znaky/číslice.');
      return;
    }

    if (isMasterAdmin) {
      onUpdateConfig({ ...config, masterPin: clean });
    } else if (loggedSubAdminId) {
      const updatedSubPins = (config.subAdminPins || []).map((s) =>
        s.id === loggedSubAdminId ? { ...s, pin: clean } : s
      );
      onUpdateConfig({ ...config, subAdminPins: updatedSubPins });
    } else {
      onUpdateConfig({ ...config, masterPin: clean });
    }

    setMyPinSuccessMsg('Váš PIN kód byl úspěšně změněn!');
    setTimeout(() => {
      setMyPinSuccessMsg(null);
      setIsMyPinModalOpen(false);
      setMyNewPinInput('');
    }, 1500);
  };

  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [editingMass, setEditingMass] = useState<Mass | null>(null);
  const [massDate, setMassDate] = useState(new Date().toISOString().split('T')[0]);
  const [massTime, setMassTime] = useState('17:30');
  const [massLocation, setMassLocation] = useState('Kostel Svaté Rodiny, Luhačovice');
  const [massTitle, setMassTitle] = useState('Mše svatá');
  const [massRank, setMassRank] = useState<'slavnost' | 'svatek' | 'pamatka' | 'nedele' | 'vsedni'>('vsedni');
  const [massNote, setMassNote] = useState('');

  // Recurring Mass Generator State
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recEndDate, setRecEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [recTime, setRecTime] = useState('17:30');
  const [recLocation, setRecLocation] = useState('Kostel Svaté Rodiny, Luhačovice');
  const [recTitle, setRecTitle] = useState('Mše svatá');
  const [recRank, setRecRank] = useState<'slavnost' | 'svatek' | 'pamatka' | 'nedele' | 'vsedni'>('vsedni');
  const [recDays, setRecDays] = useState<number[]>([0, 2, 4, 6]); // 0=Ne, 1=Po, 2=Út, 3=St, 4=Čt, 5=Pá, 6=So
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');

  // Form states for adding/editing ministrant
  const [isMinModalOpen, setIsMinModalOpen] = useState(false);
  const [editingMin, setEditingMin] = useState<Ministrant | null>(null);
  const [minName, setMinName] = useState('');
  const [minPhone, setMinPhone] = useState('');

  // Master Pin & Sub-Admin PIN generator states
  const [newMasterPin, setNewMasterPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const [subAdminLabel, setSubAdminLabel] = useState('');
  const [subAdminCustomPin, setSubAdminCustomPin] = useState('');

  // Confirmation modal states
  const [massToDelete, setMassToDelete] = useState<Mass | null>(null);
  const [minToDelete, setMinToDelete] = useState<Ministrant | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isResetDefaultConfirmOpen, setIsResetDefaultConfirmOpen] = useState(false);

  // Bulk selection states
  const [selectedMassIds, setSelectedMassIds] = useState<string[]>([]);
  const [selectedMinIds, setSelectedMinIds] = useState<string[]>([]);
  const [isBulkDeleteMassesConfirmOpen, setIsBulkDeleteMassesConfirmOpen] = useState(false);
  const [isBulkDeleteMinConfirmOpen, setIsBulkDeleteMinConfirmOpen] = useState(false);

  // Admin toast notification state
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setAdminNotice({ type, msg });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Ministrants lookup map
  const ministrantsMap = useMemo(() => {
    const map = new Map<string, Ministrant>();
    ministrants.forEach((m) => map.set(m.id, m));
    return map;
  }, [ministrants]);

  // Master Admin Advanced Analytics Calculations
  const analyticsData = useMemo(() => {
    if (!isMasterAdmin) return null;

    const totalMasses = masses.length;
    let totalSlots = 0;
    let totalFilledSlots = 0;
    let emptyMassesCount = 0;

    const daysOfWeekCount = [
      { day: 'Neděle', short: 'Ne', count: 0 },
      { day: 'Pondělí', short: 'Po', count: 0 },
      { day: 'Úterý', short: 'Út', count: 0 },
      { day: 'Středa', short: 'St', count: 0 },
      { day: 'Čtvrtek', short: 'Čt', count: 0 },
      { day: 'Pátek', short: 'Pá', count: 0 },
      { day: 'Sobota', short: 'So', count: 0 },
    ];

    const monthMap = new Map<string, { monthKey: string; label: string; masses: number; filled: number; capacity: number }>();

    const rankMap: Record<string, { name: string; value: number; color: string }> = {
      slavnost: { name: 'Slavnosti ★', value: 0, color: '#f59e0b' },
      svatek: { name: 'Svátky', value: 0, color: '#3b82f6' },
      pamatka: { name: 'Památky', value: 0, color: '#a855f7' },
      nedele: { name: 'Neděle', value: 0, color: '#10b981' },
      vsedni: { name: 'Všední dny', value: 0, color: '#64748b' },
    };

    const ministrantActivityMap = new Map<string, number>();

    masses.forEach((m) => {
      const cap = m.maxServers || 4;
      totalSlots += cap;
      const count = m.assignments.length;
      totalFilledSlots += count;
      if (count === 0) emptyMassesCount++;

      // Day of week
      const dateObj = new Date(m.date);
      if (!isNaN(dateObj.getTime())) {
        const dayIdx = dateObj.getDay(); // 0 = Sun, 1 = Mon, ...
        daysOfWeekCount[dayIdx].count += count;

        // Month
        const mKey = m.date.substring(0, 7); // YYYY-MM
        const monthLabel = getCzechMonthLabel(mKey);

        if (!monthMap.has(mKey)) {
          monthMap.set(mKey, { monthKey: mKey, label: monthLabel, masses: 0, filled: 0, capacity: 0 });
        }
        const mEntry = monthMap.get(mKey)!;
        mEntry.masses += 1;
        mEntry.filled += count;
        mEntry.capacity += cap;
      }

      // Rank
      if (rankMap[m.rank]) {
        rankMap[m.rank].value += count;
      }

      // Ministrants
      m.assignments.forEach((a) => {
        ministrantActivityMap.set(a.serverId, (ministrantActivityMap.get(a.serverId) || 0) + 1);
      });
    });

    const occupancyRate = totalSlots > 0 ? Math.round((totalFilledSlots / totalSlots) * 100) : 0;
    const avgPerMass = totalMasses > 0 ? (totalFilledSlots / totalMasses).toFixed(1) : '0';

    const monthlyChartData = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const rankChartData = Object.values(rankMap).filter((r) => r.value > 0);

    const inactiveMinistrants = ministrants.filter((m) => !ministrantActivityMap.has(m.id));
    const activeMinistrantsCount = ministrants.length - inactiveMinistrants.length;

    return {
      totalMasses,
      totalSlots,
      totalFilledSlots,
      occupancyRate,
      emptyMassesCount,
      avgPerMass,
      activeMinistrantsCount,
      inactiveMinistrants,
      monthlyChartData,
      daysOfWeekCount,
      rankChartData,
    };
  }, [masses, ministrants, isMasterAdmin]);

  // Extract available months for month filtering
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    masses.forEach((m) => {
      if (m.date && m.date.length >= 7) {
        monthsSet.add(m.date.substring(0, 7));
      }
    });
    if (adminMonthFilter && adminMonthFilter !== 'ALL') {
      monthsSet.add(adminMonthFilter);
    }
    return Array.from(monthsSet).sort();
  }, [masses, adminMonthFilter]);

  // Extract available weeks for week filtering
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<string>();
    masses.forEach((m) => {
      if (m.date) {
        const mon = getMondayDateStr(m.date);
        if (mon) weeksSet.add(mon);
      }
    });
    if (adminWeekFilter && adminWeekFilter !== 'ALL') {
      weeksSet.add(adminWeekFilter);
    }
    return Array.from(weeksSet).sort();
  }, [masses, adminWeekFilter]);

  // Filtered & sorted masses for Admin panel
  const displayedMasses = useMemo(() => {
    const filtered = masses.filter((m) => {
      if (adminPeriodMode === 'MONTH') {
        if (adminMonthFilter === 'ALL') return true;
        return m.date.startsWith(adminMonthFilter);
      } else {
        if (adminWeekFilter === 'ALL') return true;
        return getMondayDateStr(m.date) === adminWeekFilter;
      }
    });

    return [...filtered].sort((a, b) => {
      if (adminSortOrder === 'NEJBLIZSI') {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }
      if (adminSortOrder === 'NEJVDALENEJSI') {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.time.localeCompare(a.time);
      }
      if (adminSortOrder === 'CAS') {
        if (a.time !== b.time) return a.time.localeCompare(b.time);
        return a.date.localeCompare(b.date);
      }
      if (adminSortOrder === 'NEJMENE_OBSAZENE') {
        const aCount = a.assignments ? a.assignments.length : 0;
        const bCount = b.assignments ? b.assignments.length : 0;
        if (aCount !== bCount) return aCount - bCount;
        return a.date.localeCompare(b.date);
      }
      if (adminSortOrder === 'MISTO') {
        const locComp = a.location.localeCompare(b.location);
        if (locComp !== 0) return locComp;
        return a.date.localeCompare(b.date);
      }
      return 0;
    });
  }, [masses, adminPeriodMode, adminMonthFilter, adminWeekFilter, adminSortOrder]);

  // Bulk selection helpers for masses
  const isAllDisplayedMassesSelected =
    displayedMasses.length > 0 && displayedMasses.every((m) => selectedMassIds.includes(m.id));

  const toggleSelectAllMasses = () => {
    if (isAllDisplayedMassesSelected) {
      const displayedSet = new Set(displayedMasses.map((m) => m.id));
      setSelectedMassIds((prev) => prev.filter((id) => !displayedSet.has(id)));
    } else {
      const newSet = new Set([...selectedMassIds, ...displayedMasses.map((m) => m.id)]);
      setSelectedMassIds(Array.from(newSet));
    }
  };

  const toggleSelectMass = (id: string) => {
    setSelectedMassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectPastMasses = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastIds = masses.filter((m) => m.date < todayStr).map((m) => m.id);
    if (pastIds.length === 0) {
      showNotice('Nebyly nalezeny žádné již proběhlé mše svaté.', 'error');
    } else {
      setSelectedMassIds(pastIds);
      showNotice(`Označených ${pastIds.length} již proběhlých mší.`);
    }
  };

  const handleConfirmBulkDeleteMasses = () => {
    if (selectedMassIds.length === 0) return;
    if (onDeleteMultipleMasses) {
      onDeleteMultipleMasses(selectedMassIds);
    } else {
      selectedMassIds.forEach((id) => onDeleteMass(id));
    }
    showNotice(`Úspěšně smazáno ${selectedMassIds.length} vybraných mší.`);
    setSelectedMassIds([]);
    setIsBulkDeleteMassesConfirmOpen(false);
  };

  // Bulk selection helpers for ministrants
  const isAllMinSelected =
    ministrants.length > 0 && ministrants.every((m) => selectedMinIds.includes(m.id));

  const toggleSelectAllMin = () => {
    if (isAllMinSelected) {
      setSelectedMinIds([]);
    } else {
      setSelectedMinIds(ministrants.map((m) => m.id));
    }
  };

  const toggleSelectMin = (id: string) => {
    setSelectedMinIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDeleteMin = () => {
    if (selectedMinIds.length === 0) return;
    if (onDeleteMultipleMinistrants) {
      onDeleteMultipleMinistrants(selectedMinIds);
    } else {
      selectedMinIds.forEach((id) => onDeleteMinistrant(id));
    }
    showNotice(`Úspěšně odebráno ${selectedMinIds.length} vybraných ministrantů.`);
    setSelectedMinIds([]);
    setIsBulkDeleteMinConfirmOpen(false);
  };


  // Open mass modal
  const openMassModal = (massToEdit?: Mass) => {
    if (massToEdit) {
      setEditingMass(massToEdit);
      setMassDate(massToEdit.date);
      setMassTime(massToEdit.time);
      setMassLocation(massToEdit.location);
      setMassTitle(massToEdit.title);
      setMassRank(massToEdit.rank);
      setMassNote(massToEdit.note || '');
    } else {
      setEditingMass(null);
      setMassDate(new Date().toISOString().split('T')[0]);
      setMassTime('17:30');
      setMassLocation('Kostel Svaté Rodiny, Luhačovice');
      setMassTitle('Mše svatá');
      setMassRank('vsedni');
      setMassNote('');
    }
    setIsMassModalOpen(true);
  };

  const handleSaveMass = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMass) {
      onEditMass({
        ...editingMass,
        date: massDate,
        time: massTime,
        location: massLocation,
        title: massTitle,
        rank: massRank,
        liturgicalColor: 'green',
        maxServers: 99,
        note: massNote,
      });
    } else {
      onAddMass({
        date: massDate,
        time: massTime,
        location: massLocation,
        title: massTitle,
        rank: massRank,
        liturgicalColor: 'green',
        maxServers: 99,
        isLocked: false,
        note: massNote,
      });
    }
    setIsMassModalOpen(false);
  };

  // Estimate generated count for preview
  const estimatedGeneratedCount = useMemo(() => {
    if (!recStartDate || !recEndDate || recDays.length === 0) return 0;
    const [sY, sM, sD] = recStartDate.split('-').map(Number);
    const [eY, eM, eD] = recEndDate.split('-').map(Number);
    if (!sY || !sM || !sD || !eY || !eM || !eD) return 0;

    const startUtc = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
    const endUtc = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59));
    if (startUtc > endUtc) return 0;

    let count = 0;
    const exceptionSet = new Set(exceptions);
    const existingKeys = new Set(masses.map((m) => `${m.date}_${m.time}_${m.location}`));

    const curr = new Date(startUtc);
    while (curr <= endUtc) {
      const dayOfWeek = curr.getUTCDay();
      const yr = curr.getUTCFullYear();
      const mo = String(curr.getUTCMonth() + 1).padStart(2, '0');
      const dy = String(curr.getUTCDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      if (recDays.includes(dayOfWeek) && !exceptionSet.has(dateStr)) {
        const massKey = `${dateStr}_${recTime}_${recLocation}`;
        if (!existingKeys.has(massKey)) {
          count++;
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
    return count;
  }, [recStartDate, recEndDate, recDays, recTime, recLocation, exceptions, masses]);

  // Quick Range Presets
  const applyCurrentMonthPreset = () => {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = today.getMonth();
    const startDate = `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(yr, mo + 1, 0).getDate();
    const endDate = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setRecStartDate(startDate);
    setRecEndDate(endDate);
  };

  const applyNextMonthPreset = () => {
    const today = new Date();
    let yr = today.getFullYear();
    let mo = today.getMonth() + 1;
    if (mo > 11) {
      mo = 0;
      yr += 1;
    }
    const startDate = `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(yr, mo + 1, 0).getDate();
    const endDate = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setRecStartDate(startDate);
    setRecEndDate(endDate);
  };

  const apply3MonthsPreset = () => {
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setRecStartDate(startDate);
    setRecEndDate(endDate);
  };

  // Generate Recurring Masses
  const handleGenerateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recStartDate || !recEndDate || recDays.length === 0) {
      showNotice('Prosím vyberte období a alespoň jeden den v týdnu.', 'error');
      return;
    }

    const [sY, sM, sD] = recStartDate.split('-').map(Number);
    const [eY, eM, eD] = recEndDate.split('-').map(Number);

    if (!sY || !sM || !sD || !eY || !eM || !eD) {
      showNotice('Neplatný formát data.', 'error');
      return;
    }

    const startUtc = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
    const endUtc = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59));

    if (startUtc > endUtc) {
      showNotice('Počáteční datum musí být před koncovým datem.', 'error');
      return;
    }

    let generatedCount = 0;
    const exceptionSet = new Set(exceptions);
    const existingKeys = new Set(masses.map((m) => `${m.date}_${m.time}_${m.location}`));

    const curr = new Date(startUtc);
    while (curr <= endUtc) {
      const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
      const yr = curr.getUTCFullYear();
      const mo = String(curr.getUTCMonth() + 1).padStart(2, '0');
      const dy = String(curr.getUTCDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      if (recDays.includes(dayOfWeek) && !exceptionSet.has(dateStr)) {
        let massRankToUse = recRank;
        let massTitleToUse = recTitle;

        // Auto rank / title adjustments if Sunday
        if (dayOfWeek === 0) {
          if (recRank === 'vsedni') massRankToUse = 'nedele';
          if (recTitle === 'Mše svatá') massTitleToUse = 'Nedělní mše svatá';
        }

        const massKey = `${dateStr}_${recTime}_${recLocation}`;
        if (!existingKeys.has(massKey)) {
          onAddMass({
            date: dateStr,
            time: recTime,
            location: recLocation,
            title: massTitleToUse,
            rank: massRankToUse,
            liturgicalColor: 'green',
            maxServers: 99,
            isLocked: false,
          });
          generatedCount++;
          existingKeys.add(massKey);
        }
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (generatedCount === 0) {
      showNotice('V tomto období nebyly vygenerovány žádné nové mše (buď již existují, nebo nesouhlasí dny/výjimky).', 'error');
    } else {
      showNotice(`Úspěšně vygenerováno ${generatedCount} mší svatých!`);
    }
    setIsRecurringModalOpen(false);
  };

  const handleAddException = () => {
    if (!newExceptionDate) return;
    if (!exceptions.includes(newExceptionDate)) {
      setExceptions([...exceptions, newExceptionDate]);
    }
    setNewExceptionDate('');
  };

  const handleRemoveException = (dateToRemove: string) => {
    setExceptions(exceptions.filter((d) => d !== dateToRemove));
  };

  const toggleDay = (dayNum: number) => {
    if (recDays.includes(dayNum)) {
      setRecDays(recDays.filter((d) => d !== dayNum));
    } else {
      setRecDays([...recDays, dayNum]);
    }
  };

  // Open ministrant modal
  const openMinModal = (minToEdit?: Ministrant) => {
    if (minToEdit) {
      setEditingMin(minToEdit);
      setMinName(minToEdit.name);
      setMinPhone(minToEdit.phone || '');
    } else {
      setEditingMin(null);
      setMinName('');
      setMinPhone('');
    }
    setIsMinModalOpen(true);
  };

  const handleSaveMinistrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minName.trim()) return;
    if (editingMin) {
      onEditMinistrant({
        ...editingMin,
        name: minName.trim(),
        phone: minPhone.trim() || undefined,
      });
    } else {
      onAddMinistrant({
        name: minName.trim(),
        phone: minPhone.trim() || undefined,
        isActive: true,
        avatarColor: '#059669',
      });
    }
    setIsMinModalOpen(false);
  };

  // File import handler
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBackupJSON(file);
      onRestoreData(data);
      showNotice('Záloha byla úspěšně obnovena!');
    } catch (err: any) {
      showNotice(err.message || 'Nepodařilo se načíst zálohu.', 'error');
    }
  };

  const handleChangeMasterPin = () => {
    if (newMasterPin.trim().length < 4) {
      showNotice('PIN musí mít alespoň 4 znaky', 'error');
      return;
    }
    onUpdateConfig({ ...config, masterPin: newMasterPin.trim() });
    setNewMasterPin('');
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 3000);
  };

  const handleAddSubAdminPin = () => {
    if (!subAdminLabel.trim()) {
      showNotice('Zadej název / jméno pro nového správce (např. P. Josef)', 'error');
      return;
    }

    const pinCode = subAdminCustomPin.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    const newSubPin: SubAdminPin = {
      id: 'sub-' + Date.now(),
      label: subAdminLabel.trim(),
      pin: pinCode,
      createdAt: new Date().toISOString().split('T')[0],
      permissions: {
        canManageSchedule: true,
        canManageForms: true,
        canViewFormSubmissions: true,
        canViewAnalytics: true,
        canManageEvents: true,
      },
    };

    const currentSubPins = config.subAdminPins || [];
    onUpdateConfig({
      ...config,
      subAdminPins: [...currentSubPins, newSubPin],
    });

    setSubAdminLabel('');
    setSubAdminCustomPin('');
  };

  const handleDeleteSubAdminPin = (id: string) => {
    const currentSubPins = config.subAdminPins || [];
    onUpdateConfig({
      ...config,
      subAdminPins: currentSubPins.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-farnost-700 text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-farnost-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 text-white rounded-2xl border border-white/30 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Administrační prostředí
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-emerald-100 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 border border-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" /> Ministranti Luhačovice
              </span>
            </div>
            <p className="text-xs text-farnost-100 font-bold mt-1">
              Správa mší, ministrantů, formulářů a zálohování dat Ministrantů Luhačovice.
            </p>
          </div>
        </div>


        {/* Global Lock Switch & My PIN Change */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setIsMyPinModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-farnost-900/90 hover:bg-farnost-950 text-amber-300 rounded-xl font-extrabold text-xs border border-farnost-600/50 transition cursor-pointer min-h-[40px]"
            title="Změnit PIN přihlášeného účtu"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Změnit můj PIN</span>
          </button>

          <div className="flex items-center space-x-2 bg-farnost-900/90 p-1.5 px-3 rounded-xl border border-farnost-600/50">
            <span className="text-xs font-black text-white">
              Zapisování:
            </span>
            <button
              onClick={() =>
                onUpdateConfig({ ...config, globalLockSignups: !config.globalLockSignups })
              }
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer min-h-[36px] ${
                config.globalLockSignups
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-farnost-900 shadow-xs'
              }`}
            >
              {config.globalLockSignups ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>UZAMČENO</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>POVOLENO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex border-b border-farnost-200 text-xs sm:text-sm font-bold space-x-2 sm:space-x-4 overflow-x-auto pb-0.5">
        {(isMasterAdmin || adminPermissions.canManageSchedule) && (
          <button
            type="button"
            onClick={() => setActiveTab('masses')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
              activeTab === 'masses'
                ? 'border-farnost-700 text-farnost-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Správa mší svatých ({masses.length})</span>
          </button>
        )}

        {(isMasterAdmin || adminPermissions.canManageSchedule) && (
          <button
            type="button"
            onClick={() => setActiveTab('ministrants')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
              activeTab === 'ministrants'
                ? 'border-farnost-700 text-farnost-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Seznam ministrantů ({ministrants.length})</span>
          </button>
        )}

        {(isMasterAdmin || adminPermissions.canManageForms || adminPermissions.canViewFormSubmissions || adminPermissions.canViewAnalytics) && (
          <button
            type="button"
            onClick={() => setActiveTab('forms')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
              activeTab === 'forms'
                ? 'border-farnost-700 text-farnost-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-farnost-700" />
            <span>Formuláře & Odpovědi ({forms.length})</span>
          </button>
        )}

        {isMasterAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
              activeTab === 'accounts'
                ? 'border-farnost-700 text-farnost-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-farnost-700" />
            <span>Správa účtů & Oprávnění</span>
          </button>
        )}

        {(isMasterAdmin || adminPermissions.canViewAnalytics) && (
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
              activeTab === 'analytics'
                ? 'border-amber-600 text-amber-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Pokročilá analytika</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap px-2 min-h-[44px] ${
            activeTab === 'backup'
              ? 'border-farnost-700 text-farnost-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Záloha a nastavení dat</span>
        </button>
      </div>

      {/* TAB 1: MASSES MANAGEMENT */}
      {activeTab === 'masses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Přehled naplánovaných mší
              </h3>

              {/* Mode Switcher & Navigation & Sorting in Admin Panel */}
              <div className="flex flex-wrap items-center gap-1.5 ml-2">
                <div className="inline-flex rounded-lg bg-farnost-100 dark:bg-slate-800 p-0.5 border border-farnost-300 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setAdminPeriodMode('MONTH')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs font-bold ${
                      adminPeriodMode === 'MONTH'
                        ? 'bg-farnost-700 text-white font-extrabold shadow-2xs'
                        : 'text-farnost-900 dark:text-slate-300 hover:text-black'
                    }`}
                  >
                    Měsíce
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPeriodMode('WEEK')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs font-bold ${
                      adminPeriodMode === 'WEEK'
                        ? 'bg-farnost-700 text-white font-extrabold shadow-2xs'
                        : 'text-farnost-900 dark:text-slate-300 hover:text-black'
                    }`}
                  >
                    Týdny
                  </button>
                </div>

                {adminPeriodMode === 'MONTH' ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdminMonthFilter(getPrevMonthStr(adminMonthFilter))}
                      className="px-2 py-1 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-farnost-300 dark:border-slate-700 rounded-lg text-farnost-900 dark:text-slate-100 font-black cursor-pointer text-xs min-h-[36px] flex items-center justify-center transition"
                      title="Předchozí měsíc"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <select
                      value={adminMonthFilter}
                      onChange={(e) => setAdminMonthFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-farnost-50 dark:bg-slate-800 border border-farnost-300 dark:border-slate-700 rounded-xl text-xs font-black text-farnost-900 dark:text-slate-100 min-h-[36px] cursor-pointer"
                    >
                      <option value="ALL">Všechny měsíce ({masses.length})</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {getCzechMonthLabel(m)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setAdminMonthFilter(getNextMonthStr(adminMonthFilter))}
                      className="px-2 py-1 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-farnost-300 dark:border-slate-700 rounded-lg text-farnost-900 dark:text-slate-100 font-black cursor-pointer text-xs min-h-[36px] flex items-center justify-center transition"
                      title="Následující měsíc"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdminWeekFilter(getPrevWeekStr(adminWeekFilter))}
                      className="px-2 py-1 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-farnost-300 dark:border-slate-700 rounded-lg text-farnost-900 dark:text-slate-100 font-black cursor-pointer text-xs min-h-[36px] flex items-center justify-center transition"
                      title="Předchozí týden"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <select
                      value={adminWeekFilter}
                      onChange={(e) => setAdminWeekFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-farnost-50 dark:bg-slate-800 border border-farnost-300 dark:border-slate-700 rounded-xl text-xs font-black text-farnost-900 dark:text-slate-100 min-h-[36px] cursor-pointer"
                    >
                      <option value="ALL">Všechny týdny ({masses.length})</option>
                      {availableWeeks.map((w) => (
                        <option key={w} value={w}>
                          {formatWeekRangeLabel(w)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setAdminWeekFilter(getNextWeekStr(adminWeekFilter))}
                      className="px-2 py-1 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-farnost-300 dark:border-slate-700 rounded-lg text-farnost-900 dark:text-slate-100 font-black cursor-pointer text-xs min-h-[36px] flex items-center justify-center transition"
                      title="Následující týden"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Sorting Select in Admin Panel */}
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-[11px] font-bold text-farnost-800 dark:text-slate-300">Řadit:</span>
                  <select
                    value={adminSortOrder}
                    onChange={(e) => setAdminSortOrder(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-farnost-100 dark:bg-slate-800 border border-farnost-300 dark:border-slate-700 rounded-xl text-xs font-bold text-farnost-900 dark:text-slate-100 min-h-[36px] cursor-pointer"
                  >
                    <option value="NEJBLIZSI">Nejbližší jako první</option>
                    <option value="NEJVDALENEJSI">Nejvzdálenější jako první</option>
                    <option value="CAS">Podle času mše (od ranních)</option>
                    <option value="NEJMENE_OBSAZENE">Podle obsazenosti (nejméně obsazené)</option>
                    <option value="MISTO">Podle kostela / místa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  let label = 'Všechny mše';
                  if (adminPeriodMode === 'MONTH') {
                    label = adminMonthFilter === 'ALL' ? 'Všechny měsíce' : getCzechMonthLabel(adminMonthFilter);
                  } else {
                    label = adminWeekFilter === 'ALL' ? 'Všechny týdny' : `Týden ${formatWeekRangeLabel(adminWeekFilter)}`;
                  }
                  exportMassesToPDF(displayedMasses, ministrantsMap, label, 'Luhačovice');
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-farnost-50 hover:bg-farnost-100 text-farnost-900 border border-farnost-300 rounded-xl font-bold text-xs transition cursor-pointer min-h-[40px]"
                title="Stáhnout vytištěný rozpis mší v PDF"
              >
                <Printer className="w-4 h-4 text-farnost-700" />
                <span>PDF Rozpis</span>
              </button>

              <button
                onClick={() => setIsRecurringModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-farnost-50 hover:bg-farnost-100 text-farnost-900 border border-farnost-300 rounded-xl font-bold text-xs transition cursor-pointer min-h-[40px]"
              >
                <Repeat className="w-4 h-4 text-farnost-700" />
                <span>Generátor mší</span>
              </button>

              <button
                onClick={() => openMassModal()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Přidat mši</span>
              </button>
            </div>
          </div>

          {/* Bulk Action / Selection Toolbar for Masses */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-farnost-50/80 dark:bg-slate-800/80 p-3 rounded-xl border border-farnost-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 font-semibold">Rychlý výběr pro hromadné akce:</span>
              <button
                type="button"
                onClick={selectPastMasses}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition cursor-pointer text-xs font-bold shadow-2xs"
              >
                🕒 Označit proběhlé mše
              </button>
              <button
                type="button"
                onClick={toggleSelectAllMasses}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition cursor-pointer text-xs font-bold shadow-2xs"
              >
                {isAllDisplayedMassesSelected ? 'Zrušit výběr zobrazených' : 'Vybrat vše zobrazené'}
              </button>
            </div>

            {selectedMassIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150 ml-auto">
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-farnost-200 dark:bg-farnost-950 text-farnost-900 dark:text-farnost-200 border border-farnost-300">
                  Vybráno: {selectedMassIds.length} mší
                </span>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteMassesConfirmOpen(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-black text-xs shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Smazat vybrané ({selectedMassIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMassIds([])}
                  className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold cursor-pointer"
                >
                  Odoznačit
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-farnost-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-farnost-700 text-white uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-2.5 border-r border-farnost-600 text-center w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-farnost-800 rounded"
                        checked={isAllDisplayedMassesSelected}
                        onChange={toggleSelectAllMasses}
                        title="Vybrat / Odoznačit všechny zobrazené mše"
                      />
                    </th>
                    <th className="p-2.5 border-r border-farnost-600">Datum a čas</th>
                    <th className="p-2.5 border-r border-farnost-600">Místo</th>
                    <th className="p-2.5 border-r border-farnost-600">Název / Slavnost</th>
                    <th className="p-2.5 border-r border-farnost-600">Přihlášení</th>
                    <th className="p-2.5 border-r border-farnost-600">Stav</th>
                    <th className="p-2.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farnost-100 dark:divide-slate-800 font-bold">
                  {displayedMasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                        Žádné mše v tomto měsíci. Pro přidání klikněte na "Přidat mši" nebo "Generátor mší".
                      </td>
                    </tr>
                  ) : (
                    displayedMasses.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-farnost-50/50 dark:hover:bg-slate-800/50 ${
                          selectedMassIds.includes(m.id) ? 'bg-farnost-100/60 dark:bg-slate-800/80' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center border-r border-farnost-100 dark:border-slate-800">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer accent-farnost-700 rounded"
                            checked={selectedMassIds.includes(m.id)}
                            onChange={() => toggleSelectMass(m.id)}
                          />
                        </td>
                        <td className="p-2.5 font-extrabold text-slate-900 dark:text-white border-r border-farnost-100 dark:border-slate-800">
                          {m.date} v {m.time}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 border-r border-farnost-100 dark:border-slate-800">{m.location}</td>
                        <td className="p-2.5 border-r border-farnost-100 dark:border-slate-800">
                          <span className="font-black text-slate-800 dark:text-slate-200">{m.title}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-farnost-100 text-farnost-900 border border-farnost-300 font-black">
                            {m.rank}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 font-extrabold border-r border-farnost-100 dark:border-slate-800">
                          {m.assignments.length} ministrantů
                        </td>
                        <td className="p-2.5 border-r border-farnost-100 dark:border-slate-800">
                          {m.isLocked ? (
                            <span className="text-slate-700 font-black flex items-center">
                              <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" /> Uzamčeno
                            </span>
                          ) : (
                            <span className="text-farnost-800 font-black flex items-center">
                              <Unlock className="w-3.5 h-3.5 mr-1 text-farnost-700" /> Povoleno
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => onToggleLockMass(m.id)}
                            className="p-1.5 rounded-lg hover:bg-farnost-100 text-slate-600 cursor-pointer min-h-[36px] min-w-[36px]"
                            title="Zamknout / Odemknout"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openMassModal(m)}
                            className="p-1.5 rounded-lg hover:bg-farnost-100 text-farnost-800 cursor-pointer min-h-[36px] min-w-[36px]"
                            title="Upravit mši"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMassToDelete(m)}
                            className="p-1.5 rounded-sm hover:bg-rose-100 text-slate-600 hover:text-rose-700 cursor-pointer min-h-[36px] min-w-[36px]"
                            title="Smazat mši"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MINISTRANTS MANAGEMENT */}
      {activeTab === 'ministrants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Správa databáze ministrantů farnosti
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportMinistrantsToPDF(ministrants, 'Luhačovice')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-farnost-50 hover:bg-farnost-100 text-farnost-900 border border-farnost-300 rounded-xl font-bold text-xs transition cursor-pointer min-h-[40px]"
                title="Stáhnout vytištěný seznam ministrantů v PDF"
              >
                <Printer className="w-4 h-4 text-farnost-700" />
                <span>PDF Seznam</span>
              </button>
              <button
                onClick={() => openMinModal()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer min-h-[40px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Přidat nového ministranta</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Toolbar for Ministrants */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-farnost-50/80 dark:bg-slate-800/80 p-3 rounded-xl border border-farnost-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 font-semibold">Rychlý výběr pro hromadné akce:</span>
              <button
                type="button"
                onClick={toggleSelectAllMin}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition cursor-pointer text-xs font-bold shadow-2xs"
              >
                {isAllMinSelected ? 'Zrušit výběr všech' : 'Vybrat všechny ministranty'}
              </button>
            </div>

            {selectedMinIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150 ml-auto">
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-farnost-200 dark:bg-farnost-950 text-farnost-900 dark:text-farnost-200 border border-farnost-300">
                  Vybráno: {selectedMinIds.length} ministrantů
                </span>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteMinConfirmOpen(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-black text-xs shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Smazat vybrané ({selectedMinIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMinIds([])}
                  className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold cursor-pointer"
                >
                  Odoznačit
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-farnost-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-farnost-700 text-white uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-2.5 text-center w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-farnost-800 rounded"
                        checked={isAllMinSelected}
                        onChange={toggleSelectAllMin}
                        title="Vybrat / Odoznačit vše"
                      />
                    </th>
                    <th className="p-2.5">Jméno a příjmení</th>
                    <th className="p-2.5">Telefon</th>
                    <th className="p-2.5">Aktivní</th>
                    <th className="p-2.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farnost-100 dark:divide-slate-800 font-bold">
                  {ministrants.map((m) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-farnost-50/50 dark:hover:bg-slate-800/50 ${
                        selectedMinIds.includes(m.id) ? 'bg-farnost-100/60 dark:bg-slate-800/80' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-farnost-700 rounded"
                          checked={selectedMinIds.includes(m.id)}
                          onChange={() => toggleSelectMin(m.id)}
                        />
                      </td>
                      <td className="p-2.5 font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: m.avatarColor || '#4d6e00' }}
                        />
                        <span>{m.name}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{m.phone || '-'}</td>
                      <td className="p-2.5">
                        <button
                          onClick={() =>
                            onEditMinistrant({ ...m, isActive: !m.isActive })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition ${
                            m.isActive
                              ? 'bg-farnost-100 text-farnost-900 border border-farnost-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.isActive ? 'Aktivní' : 'Neaktivní'}
                        </button>
                      </td>
                      <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openMinModal(m)}
                          className="p-1.5 rounded-lg hover:bg-farnost-100 text-farnost-800 cursor-pointer min-h-[36px] min-w-[36px]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMinToDelete(m)}
                          className="p-1.5 rounded-sm hover:bg-rose-100 text-slate-600 hover:text-rose-700 cursor-pointer min-h-[36px] min-w-[36px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORMULÁŘE & ODPOVĚDI */}
      {activeTab === 'forms' && (isMasterAdmin || adminPermissions.canManageForms || adminPermissions.canViewFormSubmissions || adminPermissions.canViewAnalytics) && (
        <AdminFormsManager
          forms={forms}
          responses={formResponses}
          onSaveForm={onSaveForm || (() => {})}
          onDeleteForm={onDeleteForm || (() => {})}
          onDeleteResponse={onDeleteFormResponse || (() => {})}
          onClearFormResponses={onClearFormResponses || (() => {})}
          canManageForms={isMasterAdmin || adminPermissions.canManageForms}
          canViewFormSubmissions={isMasterAdmin || adminPermissions.canViewFormSubmissions}
          canViewAnalytics={isMasterAdmin || adminPermissions.canViewAnalytics}
        />
      )}

      {/* TAB 4: SPRÁVA ÚČTŮ A OPRÁVNĚNÍ (Master Admin) */}
      {activeTab === 'accounts' && isMasterAdmin && (
        <AdminUsersManager
          masterPin={config.masterPin || '1234'}
          subAdminPins={config.subAdminPins || []}
          onUpdateMasterPin={(newPin) => onUpdateConfig({ ...config, masterPin: newPin })}
          onUpdateSubAdminPins={(newPins) => onUpdateConfig({ ...config, subAdminPins: newPins })}
        />
      )}
      {activeTab === 'analytics' && isMasterAdmin && analyticsData && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-farnost-800 to-farnost-900 text-white shadow-md space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Pouze pro hlavního správce (Master Admin)</span>
            </div>
            <h2 className="text-xl font-black">
              📊 Pokročilá analytika & Výkaz vytíženosti farnosti
            </h2>
            <p className="text-xs text-farnost-100 font-medium max-w-2xl leading-relaxed">
              Detailní statistické přehledy docházky, plnosti obsazení bohoslužeb, aktivních dnů a seznam ministrantů k oslovení. Tyto informace nejsou viditelné pro běžné uživatele ani pomocné správce.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-farnost-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Celková obsazenost</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {analyticsData.occupancyRate}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analyticsData.occupancyRate)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {analyticsData.totalFilledSlots} z {analyticsData.totalSlots} míst obsazeno
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-farnost-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Nepokryté mše (0 min.)</span>
                <AlertTriangle className={`w-4 h-4 ${analyticsData.emptyMassesCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {analyticsData.emptyMassesCount}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                z celkem {analyticsData.totalMasses} naplánovaných mší
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-farnost-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Průměr na mši</span>
                <Users className="w-4 h-4 text-farnost-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {analyticsData.avgPerMass}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                ministrantů na jednu bohoslužbu
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-farnost-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Aktivní ministranti</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {analyticsData.activeMinistrantsCount} / {ministrants.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {analyticsData.inactiveMinistrants.length} zatím bez jediné služby
              </p>
            </div>
          </div>

          {/* Charts Row 1: Monthly Trend & Days of Week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl p-5 border border-farnost-200 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-farnost-700" />
                Měsíční přehled obsazenosti a služeb
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Porovnání celkové kapacity a skutečně přihlášených služeb v jednotlivých měsících.
              </p>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700">{val}</span>} />
                    <Bar dataKey="filled" name="Obsazené služby" fill="#1b4d3e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacity" name="Max. kapacita" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity by Day of Week */}
            <div className="bg-white rounded-2xl p-5 border border-farnost-200 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-farnost-700" />
                Služby podle dnů v týdnu
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Celkový počet přihlášených ministrantů v jednotlivé dny týdne.
              </p>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.daysOfWeekCount} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="count" name="Počet služeb" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Inactive Ministrants & Liturgical Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Inactive Ministrants Care List */}
            <div className="bg-white rounded-2xl p-5 border border-farnost-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-rose-600" />
                  Ministranti bez aktivních služeb ({analyticsData.inactiveMinistrants.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Seznam registrovaných ministrantů, kteří ještě nemají zapsanou žádnou mši. Doporučujeme je osobně nebo telefonicky kontaktovat.
              </p>

              {analyticsData.inactiveMinistrants.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Skvělé! Všichni registrovaní ministranti jsou aktivně zapsaní alespoň na jedné mši.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {analyticsData.inactiveMinistrants.map((min) => (
                    <div
                      key={min.id}
                      className="flex items-center justify-between p-3 bg-farnost-50/60 rounded-xl border border-farnost-200 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: min.avatarColor || '#3b82f6' }}
                        />
                        <span className="font-extrabold text-slate-900">{min.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {min.phone ? (
                          <a
                            href={`tel:${min.phone}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-farnost-300 rounded-lg text-farnost-900 font-bold hover:bg-farnost-100 transition"
                          >
                            <Phone className="w-3 h-3 text-farnost-700" />
                            <span>{min.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Bez telefonu</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liturgical Rank Distribution */}
            <div className="bg-white rounded-2xl p-5 border border-farnost-200 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <PieChartIcon className="w-4 h-4 mr-2 text-amber-600" />
                Podíl služeb podle typů liturgie
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Rozložení přihlášek ministrantů mezi Slavnosti, Svátky, Památky, Neděle a Všední dny.
              </p>
              <div className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.rankChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analyticsData.rankChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700">{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & SETTINGS */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Backup JSON, PDF & Danger Zone */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-farnost-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center">
              <Download className="w-4 h-4 mr-2 text-farnost-700" />
              Zálohování, PDF a údržba dat
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Exportuj data do PDF tiskových sestav nebo si stáhni kompletní JSON zálohu pro bezpečné uchování.
            </p>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportMassesToPDF(masses, ministrantsMap, 'Kompletní rozpis', 'Luhačovice')}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-farnost-50 hover:bg-farnost-100 text-farnost-900 font-bold text-xs border border-farnost-300 transition cursor-pointer min-h-[44px]"
                >
                  <Printer className="w-4 h-4 text-farnost-700" />
                  <span>PDF Mše</span>
                </button>
                <button
                  onClick={() => exportMinistrantsToPDF(ministrants, 'Luhačovice')}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-farnost-50 hover:bg-farnost-100 text-farnost-900 font-bold text-xs border border-farnost-300 transition cursor-pointer min-h-[44px]"
                >
                  <Printer className="w-4 h-4 text-farnost-700" />
                  <span>PDF Ministranti</span>
                </button>
              </div>

              <button
                onClick={() => exportBackupJSON({ masses, ministrants, forms, formResponses, eventsData, config, version: 1 })}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs shadow-xs transition cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Stáhnout zálohu dat (.json)</span>
              </button>

              <label className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-farnost-50 hover:bg-farnost-100 text-farnost-900 font-bold text-xs cursor-pointer border border-farnost-200 transition min-h-[44px]">
                <Upload className="w-4 h-4 text-farnost-700" />
                <span>Obnovit ze souboru JSON</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>

              <div className="pt-3 border-t border-farnost-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setIsClearAllConfirmOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 font-extrabold text-xs transition border border-rose-200 dark:border-rose-800 cursor-pointer min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Vymazat všechny mše z rozpisu</span>
                </button>

                <button
                  onClick={() => setIsResetDefaultConfirmOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-300 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Obnovit výchozí stav appky</span>
                </button>
              </div>
            </div>
          </div>

          {/* Info & Admin Accounts guidance card */}
          <div className="bg-white rounded-2xl p-5 border border-farnost-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-farnost-700" />
              Správa farnosti & Přístupové účty
            </h3>
            {isMasterAdmin ? (
              <>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Správa Master PINu i vytváření nových podúčtů (PINů s oprávněními pro kaplany, jáhny a vedoucí) byla přesunuta do záložky <strong>"Správa účtů & Oprávnění"</strong> pro přehlednější a bezpečnější správu.
                </p>
                <div className="p-3.5 bg-farnost-50 rounded-xl border border-farnost-200 text-xs text-farnost-900 font-bold space-y-2">
                  <p>📄 <strong>Tisk na nástěnku:</strong> Tlačítko "PDF Mše" vygeneruje přehlednou tiskovou sestavu pro vývěsku v kostele.</p>
                  <p>💾 <strong>Zálohování:</strong> Doporučujeme pravidelně stahovat zálohu dat do souboru JSON pro bezpečné uchování.</p>
                  <p>🔑 <strong>Správa hesla:</strong> Změnu Master PINu a PINů ostatních vedoucích naleznete v záložce <em>Správa účtů & Oprávnění</em>.</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Jste přihlášeni jako <strong>pomocný správce</strong> s přidělenými oprávněními. Váš osobní přístupový PIN kód si můžete v případě potřeby změnit přes tlačítko "Změnit můj PIN" v záhlaví administrace.
                </p>
                <div className="p-3.5 bg-farnost-50 rounded-xl border border-farnost-200 text-xs text-farnost-900 font-bold space-y-2">
                  <p>📄 <strong>Tisk na nástěnku:</strong> Tlačítko "PDF Mše" vygeneruje přehlednou tiskovou sestavu pro vývěsku v kostele.</p>
                  <p>💾 <strong>Zálohování:</strong> Doporučujeme pravidelně stahovat zálohu dat do souboru JSON pro bezpečné uchování.</p>
                  <p>🔑 <strong>Změna vlastního PINu:</strong> Svůj přístupový PIN si můžete pohodlně změnit tlačítkem "Změnit můj PIN".</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}



      {/* Modal Mass Add/Edit */}
      {isMassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveMass}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingMass ? 'Upravit mši svatou' : 'Přidat novou mši svatou'}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Datum</label>
                <input
                  type="date"
                  value={massDate}
                  onChange={(e) => setMassDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Čas</label>
                <input
                  type="text"
                  value={massTime}
                  onChange={(e) => setMassTime(e.target.value)}
                  required
                  placeholder="17:30"
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Kostel / Místo</label>
              <input
                type="text"
                value={massLocation}
                onChange={(e) => setMassLocation(e.target.value)}
                required
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="text-xs">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Název mše / Úmysl</label>
              <input
                type="text"
                value={massTitle}
                onChange={(e) => setMassTitle(e.target.value)}
                required
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="text-xs">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Liturgická hodnost</label>
              <select
                value={massRank}
                onChange={(e) => setMassRank(e.target.value as any)}
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
              >
                <option value="vsedni">Všední den</option>
                <option value="nedele">Neděle</option>
                <option value="pamatka">Památka</option>
                <option value="svatek">Svátek</option>
                <option value="slavnost">Slavnost ★</option>
              </select>
            </div>

            <div className="text-xs">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">Poznámka (volitelné)</label>
              <input
                type="text"
                value={massNote}
                onChange={(e) => setMassNote(e.target.value)}
                placeholder="Např. Přijede o. biskup / Charitativní sbírka"
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMassModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Uložit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Recurring Mass Generator */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleGenerateRecurring}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3 border-farnost-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Repeat className="w-5 h-5 text-farnost-700" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Generování opakujících se mší
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurringModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Nastavte pravidlo pro automatické vygenerování mší na určité dny v týdnu.
            </p>

            {/* Quick Range Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">Rychlý výběr období:</label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={applyCurrentMonthPreset}
                  className="px-2.5 py-1.5 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-farnost-900 dark:text-slate-100 rounded-lg font-bold border border-farnost-200 dark:border-slate-700 transition cursor-pointer"
                >
                  Tento měsíc
                </button>
                <button
                  type="button"
                  onClick={applyNextMonthPreset}
                  className="px-2.5 py-1.5 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-farnost-900 dark:text-slate-100 rounded-lg font-bold border border-farnost-200 dark:border-slate-700 transition cursor-pointer"
                >
                  Příští měsíc
                </button>
                <button
                  type="button"
                  onClick={apply3MonthsPreset}
                  className="px-2.5 py-1.5 bg-farnost-100 hover:bg-farnost-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-farnost-900 dark:text-slate-100 rounded-lg font-bold border border-farnost-200 dark:border-slate-700 transition cursor-pointer"
                >
                  Příští 3 měsíce
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Od data:</label>
                <input
                  type="date"
                  value={recStartDate}
                  onChange={(e) => setRecStartDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Do data:</label>
                <input
                  type="date"
                  value={recEndDate}
                  onChange={(e) => setRecEndDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
            </div>

            {/* Quick Schedule Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">Rychlé šablony mší:</label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRecDays([0]);
                    setRecTime('08:00');
                    setRecTitle('Nedělní mše svatá');
                    setRecRank('nedele');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer text-[11px]"
                >
                  Neděle 08:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecDays([0]);
                    setRecTime('10:15');
                    setRecTitle('Nedělní mše svatá');
                    setRecRank('nedele');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer text-[11px]"
                >
                  Neděle 10:15
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecDays([2, 4, 5, 6]);
                    setRecTime('17:30');
                    setRecTitle('Mše svatá');
                    setRecRank('vsedni');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer text-[11px]"
                >
                  Všední večerní 17:30
                </button>
              </div>
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-xs font-black mb-1.5">Dny v týdnu, kdy se mše opakuje:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { num: 1, label: 'Po' },
                  { num: 2, label: 'Út' },
                  { num: 3, label: 'St' },
                  { num: 4, label: 'Čt' },
                  { num: 5, label: 'Pá' },
                  { num: 6, label: 'So' },
                  { num: 0, label: 'Ne' },
                ].map((d) => {
                  const isSel = recDays.includes(d.num);
                  return (
                    <button
                      type="button"
                      key={d.num}
                      onClick={() => toggleDay(d.num)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black border cursor-pointer transition min-h-[40px] ${
                        isSel
                          ? 'bg-farnost-700 text-white border-farnost-800'
                          : 'bg-farnost-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-farnost-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time & Location */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Čas mše:</label>
                <input
                  type="text"
                  value={recTime}
                  onChange={(e) => setRecTime(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kostel / Místo:</label>
                <input
                  type="text"
                  value={recLocation}
                  onChange={(e) => setRecLocation(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
            </div>

            {/* Title & Rank */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Název mše:</label>
                <input
                  type="text"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  required
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Typ / Hodnost:</label>
                <select
                  value={recRank}
                  onChange={(e) => setRecRank(e.target.value as any)}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl font-bold min-h-[44px]"
                >
                  <option value="vsedni">Všední den</option>
                  <option value="nedele">Neděle</option>
                  <option value="pamatka">Památka</option>
                  <option value="svatek">Svátek</option>
                </select>
              </div>
            </div>

            {/* Exceptions Section (Případné výjimky) */}
            <div className="p-3.5 bg-farnost-50 dark:bg-slate-800 rounded-xl border border-farnost-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-black text-farnost-900 dark:text-slate-200">
                Případné výjimky (dny, kdy se mše vynechá):
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-farnost-200 dark:border-slate-700 rounded-xl text-xs font-bold min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={handleAddException}
                  disabled={!newExceptionDate}
                  className="px-3.5 py-2 bg-farnost-700 text-white rounded-xl text-xs font-black disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  Přidat výjimku
                </button>
              </div>

              {exceptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {exceptions.map((exDate) => (
                    <span
                      key={exDate}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-farnost-300 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <span>Vynechat {exDate}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveException(exDate)}
                        className="text-slate-400 hover:text-slate-800 cursor-pointer ml-1 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Banner */}
            <div className="p-3 bg-farnost-100 dark:bg-slate-800 border border-farnost-200 dark:border-slate-700 rounded-xl text-xs font-bold text-farnost-900 dark:text-slate-100 flex items-center justify-between">
              <span>Předběžný počet k vygenerování:</span>
              <span className="font-extrabold text-sm text-farnost-800 dark:text-farnost-400 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-farnost-300 dark:border-slate-700">
                {estimatedGeneratedCount} mší
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRecurringModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer min-h-[44px]"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Vygenerovat mše
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Ministrant Add/Edit */}
      {isMinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveMinistrant}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingMin ? 'Upravit ministranta' : 'Přidat ministranta'}
            </h3>

            <div className="text-xs">
              <label className="block font-bold mb-1">Jméno a příjmení</label>
              <input
                type="text"
                value={minName}
                onChange={(e) => setMinName(e.target.value)}
                required
                placeholder="Např. Jan Novák"
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="text-xs">
              <label className="block font-bold mb-1">Telefon (volitelné)</label>
              <input
                type="text"
                value={minPhone}
                onChange={(e) => setMinPhone(e.target.value)}
                placeholder="+420 777 123 456"
                className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-xl font-bold min-h-[44px]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMinModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer min-h-[44px]"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Uložit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notice Banner */}
      {adminNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-4 py-3 rounded-md shadow-lg border text-xs font-bold flex items-center space-x-2 ${
            adminNotice.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-farnost-900 text-white border-farnost-700'
          }`}>
            <span>{adminNotice.msg}</span>
            <button onClick={() => setAdminNotice(null)} className="ml-2 text-white/80 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Mass Modal */}
      {massToDelete && (
        <ConfirmModal
          isOpen={!!massToDelete}
          title="Smazat mši svatou?"
          message={`Opravdu chcete smazat mši "${massToDelete.title}" z dne ${massToDelete.date} v ${massToDelete.time}?`}
          confirmLabel="Ano, smazat mši"
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={() => {
            onDeleteMass(massToDelete.id);
            setMassToDelete(null);
            showNotice('Mše svatá byla úspěšně smazána.');
          }}
          onClose={() => setMassToDelete(null)}
        />
      )}

      {/* Confirm Delete Ministrant Modal */}
      {minToDelete && (
        <ConfirmModal
          isOpen={!!minToDelete}
          title="Smazat ministranta?"
          message={`Opravdu chcete odebrat ministranta "${minToDelete.name}" ze seznamu farnosti?`}
          confirmLabel="Ano, smazat ministranta"
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={() => {
            onDeleteMinistrant(minToDelete.id);
            setMinToDelete(null);
            showNotice('Ministrant byl úspěšně odebrán.');
          }}
          onClose={() => setMinToDelete(null)}
        />
      )}

      {/* Confirm Clear All Masses Modal */}
      {isClearAllConfirmOpen && (
        <ConfirmModal
          isOpen={isClearAllConfirmOpen}
          title="Vymazat VŠECHNY mše z rozpisu?"
          message="Tímto krokem vymažete kompletní rozpis mší. Seznam ministrantů zůstane zachován. Tuto akci nelze vrátit zpět!"
          confirmLabel="Smazat vše"
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={() => {
            onClearAllMasses();
            setIsClearAllConfirmOpen(false);
            showNotice('Všechny mše byly vymazány.');
          }}
          onClose={() => setIsClearAllConfirmOpen(false)}
        />
      )}

      {/* Confirm Reset Default Modal */}
      {isResetDefaultConfirmOpen && (
        <ConfirmModal
          isOpen={isResetDefaultConfirmOpen}
          title="Obnovit výchozí stav farnosti?"
          message="Opravdu chcete obnovit výchozí šablonu farnosti Luhačovice? Všechny vaše provedené úpravy a zapsání budou nahrazeny výchozími daty."
          confirmLabel="Obnovit výchozí stav"
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={() => {
            const res = resetToDefaultData();
            onRestoreData(res);
            setIsResetDefaultConfirmOpen(false);
            showNotice('Aplikace byla obnovena do výchozího stavu.');
          }}
          onClose={() => setIsResetDefaultConfirmOpen(false)}
        />
      )}

      {/* Bulk Delete Masses Confirmation Modal */}
      {isBulkDeleteMassesConfirmOpen && (
        <ConfirmModal
          isOpen={isBulkDeleteMassesConfirmOpen}
          title={`Smazat ${selectedMassIds.length} vybraných mší svatých?`}
          message={`Opravdu chcete nenávratně vymazat ${selectedMassIds.length} označených mší z rozpisu? Tuto akci nelze vrátit zpět.`}
          confirmLabel={`Ano, smazat (${selectedMassIds.length})`}
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={handleConfirmBulkDeleteMasses}
          onClose={() => setIsBulkDeleteMassesConfirmOpen(false)}
        />
      )}

      {/* Bulk Delete Ministrants Confirmation Modal */}
      {isBulkDeleteMinConfirmOpen && (
        <ConfirmModal
          isOpen={isBulkDeleteMinConfirmOpen}
          title={`Smazat ${selectedMinIds.length} vybraných ministrantů?`}
          message={`Opravdu chcete odebrat ${selectedMinIds.length} označených ministrantů ze seznamu Ministrantů Luhačovice?`}
          confirmLabel={`Ano, smazat (${selectedMinIds.length})`}
          cancelLabel="Zrušit"
          isDanger={true}
          onConfirm={handleConfirmBulkDeleteMin}
          onClose={() => setIsBulkDeleteMinConfirmOpen(false)}
        />
      )}

      {/* Change My PIN Modal */}
      {isMyPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Změnit můj PIN kód
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isMasterAdmin
                      ? 'Přihlášen jako: Master Admin (Hlavní správce)'
                      : 'Přihlášen jako: Pomocný správce'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMyPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMyPin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Váš nový vlastnoruční PIN kód:
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={10}
                  value={myNewPinInput}
                  onChange={(e) => setMyNewPinInput(e.target.value)}
                  placeholder="Zadejte váš nový PIN (např. 7482)..."
                  className="w-full text-center tracking-widest text-lg font-extrabold p-3 bg-amber-50/50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-xl min-h-[48px] text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  💡 PIN si zvolte sami podle svého přání. Zadejte libovolnou kombinaci číslic nebo znaků (min. 4 znaky).
                </p>
              </div>

              {myPinSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{myPinSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMyPinModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[44px] cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition min-h-[44px] cursor-pointer"
                >
                  Uložit nový PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
