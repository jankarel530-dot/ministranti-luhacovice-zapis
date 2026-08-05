import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Mass, Ministrant, AppConfig, Form, FormResponse, AdminPermissions } from './types';
import { EventsData } from './types/events';
import { initialEventsData } from './data/sampleEvents';
import { loadAppData, saveAppData } from './utils/storage';
import { generateParishScheduleForRange } from './data/liturgicalCalendar';
import { Navbar } from './components/Navbar';
import { MassList } from './components/MassList';
import { LiturgicalCalendarView } from './components/LiturgicalCalendarView';
import { StatsView } from './components/StatsView';
import { AdminPanel } from './components/AdminPanel';
import { PublicFormsView } from './components/PublicFormsView';
import { SignUpModal } from './components/SignUpModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    const loaded = loadAppData();
    return {
      ...loaded,
      config: {
        ...loaded.config,
        masterPin: loaded.config.masterPin || (loaded.config as any).adminPin || '1234',
        subAdminPins: loaded.config.subAdminPins || [],
        parishName: 'Luhačovice',
      },
      masses: loaded.masses,
      forms: loaded.forms || [],
      formResponses: loaded.formResponses || [],
      eventsData: loaded.eventsData || initialEventsData,
    };
  });
  const [activeTab, setActiveTab] = useState<'masses' | 'forms' | 'admin'>('masses');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(false);
  const [loggedSubAdminId, setLoggedSubAdminId] = useState<string | undefined>(undefined);
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions>({
    canManageSchedule: true,
    canManageForms: true,
    canViewFormSubmissions: true,
    canViewAnalytics: true,
    canManageEvents: true,
  });
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);
  const [selectedMassIdForSignUp, setSelectedMassIdForSignUp] = useState<string | null>(null);

  const selectedMassForSignUp = useMemo(() => {
    if (!selectedMassIdForSignUp) return null;
    return appData.masses.find((m) => m.id === selectedMassIdForSignUp) || null;
  }, [appData.masses, selectedMassIdForSignUp]);

  // Auto-save to localStorage whenever appData updates
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  // Ministrants Map for fast lookup
  const ministrantsMap = useMemo(() => {
    const map = new Map<string, Ministrant>();
    appData.ministrants.forEach((m) => map.set(m.id, m));
    return map;
  }, [appData.ministrants]);

  // Mass Handlers
  const handleSignUp = (massId: string, serverId: string, note?: string) => {
    setAppData((prev) => {
      const updatedMasses = prev.masses.map((m) => {
        if (m.id === massId) {
          // Check if already assigned
          if (m.assignments.some((a) => a.serverId === serverId)) return m;
          return {
            ...m,
            assignments: [
              ...m.assignments,
              { serverId, signedUpAt: new Date().toISOString(), note },
            ],
          };
        }
        return m;
      });
      return { ...prev, masses: updatedMasses };
    });
  };

  const handleUnregister = (massId: string, serverId: string) => {
    setAppData((prev) => {
      const updatedMasses = prev.masses.map((m) => {
        if (m.id === massId) {
          return {
            ...m,
            assignments: m.assignments.filter((a) => a.serverId !== serverId),
          };
        }
        return m;
      });
      return { ...prev, masses: updatedMasses };
    });
  };

  const handleAddMass = (massData: Omit<Mass, 'id' | 'assignments'>) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMass: Mass = {
      ...massData,
      id: `mass-custom-${uniqueSuffix}`,
      assignments: [],
    };
    setAppData((prev) => ({
      ...prev,
      masses: [newMass, ...prev.masses],
    }));
  };

  const handleEditMass = (updatedMass: Mass) => {
    setAppData((prev) => ({
      ...prev,
      masses: prev.masses.map((m) => (m.id === updatedMass.id ? updatedMass : m)),
    }));
  };

  const handleDeleteMass = (massId: string) => {
    setAppData((prev) => ({
      ...prev,
      masses: prev.masses.filter((m) => m.id !== massId),
    }));
  };

  const handleDeleteMultipleMasses = (massIds: string[]) => {
    const idsSet = new Set(massIds);
    setAppData((prev) => ({
      ...prev,
      masses: prev.masses.filter((m) => !idsSet.has(m.id)),
    }));
  };

  const handleToggleLockMass = (massId: string) => {
    setAppData((prev) => ({
      ...prev,
      masses: prev.masses.map((m) =>
        m.id === massId ? { ...m, isLocked: !m.isLocked } : m
      ),
    }));
  };

  // Ministrant Handlers
  const handleAddMinistrant = (minData: Omit<Ministrant, 'id'>) => {
    const newMin: Ministrant = {
      ...minData,
      id: `min-${Date.now()}`,
    };
    setAppData((prev) => ({
      ...prev,
      ministrants: [...prev.ministrants, newMin],
    }));
  };

  const handleEditMinistrant = (updatedMin: Ministrant) => {
    setAppData((prev) => ({
      ...prev,
      ministrants: prev.ministrants.map((m) => (m.id === updatedMin.id ? updatedMin : m)),
    }));
  };

  const handleDeleteMinistrant = (minId: string) => {
    setAppData((prev) => ({
      ...prev,
      ministrants: prev.ministrants.filter((m) => m.id !== minId),
    }));
  };

  const handleDeleteMultipleMinistrants = (minIds: string[]) => {
    const idsSet = new Set(minIds);
    setAppData((prev) => ({
      ...prev,
      ministrants: prev.ministrants.filter((m) => !idsSet.has(m.id)),
    }));
  };

  // Batch Monthly Schedule Generator
  const handleGenerateMonthSchedule = (year: number, month: number) => {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const generated = generateParishScheduleForRange(startStr, endStr);

    const newMasses: Mass[] = generated.map((m, idx) => ({
      id: `mass-gen-${year}-${month}-${idx + 1}`,
      date: m.date,
      time: m.time,
      location: m.location,
      title: m.title,
      rank: m.rank,
      liturgicalColor: m.liturgicalColor,
      maxServers: m.maxServers,
      assignments: [],
      isLocked: false,
      note: m.note,
    }));

    setAppData((prev) => {
      // Filter out existing masses for that month to avoid exact duplicates
      const existingOther = prev.masses.filter(
        (m) => !m.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );
      return {
        ...prev,
        masses: [...newMasses, ...existingOther],
      };
    });

    setActiveTab('masses');
  };

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setAppData((prev) => ({ ...prev, config: newConfig }));
  };

  const handleRestoreData = (data: AppData) => {
    setAppData(data);
  };

  const handleClearAllMasses = () => {
    setAppData((prev) => ({
      ...prev,
      masses: [],
    }));
  };

  // Form Handlers
  const handleSaveForm = (form: Form) => {
    setAppData((prev) => {
      const currentForms = prev.forms || [];
      const exists = currentForms.some((f) => f.id === form.id);
      let updatedForms: Form[];
      if (exists) {
        updatedForms = currentForms.map((f) => (f.id === form.id ? form : f));
      } else {
        updatedForms = [form, ...currentForms];
      }
      return { ...prev, forms: updatedForms };
    });
  };

  const handleDeleteForm = (formId: string) => {
    setAppData((prev) => ({
      ...prev,
      forms: (prev.forms || []).filter((f) => f.id !== formId),
      formResponses: (prev.formResponses || []).filter((r) => r.formId !== formId),
    }));
  };

  const handleSubmitFormResponse = (resData: Omit<FormResponse, 'id' | 'submittedAt'>) => {
    const newResp: FormResponse = {
      ...resData,
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString(),
    };
    setAppData((prev) => ({
      ...prev,
      formResponses: [newResp, ...(prev.formResponses || [])],
    }));
  };

  const handleDeleteFormResponse = (respId: string) => {
    setAppData((prev) => ({
      ...prev,
      formResponses: (prev.formResponses || []).filter((r) => r.id !== respId),
    }));
  };

  const handleClearFormResponses = (formId: string) => {
    setAppData((prev) => ({
      ...prev,
      formResponses: (prev.formResponses || []).filter((r) => r.formId !== formId),
    }));
  };

  const hasPublishedForms = useMemo(() => {
    return (appData.forms || []).some((f) => {
      if (!f.published) return false;
      if (f.isClosed) return false;
      if (f.deadline) {
        const d = new Date(f.deadline);
        if (!isNaN(d.getTime()) && new Date() > d) return false;
      }
      return true;
    });
  }, [appData.forms]);

  // Guard: Forms tab is only accessible if there is an active published form or user is admin
  useEffect(() => {
    if (activeTab === 'forms' && !hasPublishedForms && !isAdmin) {
      setActiveTab('masses');
    }
  }, [activeTab, hasPublishedForms, isAdmin]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          onRequestAdminAuth={() => setShowAdminAuthModal(true)}
          globalLockSignups={appData.config.globalLockSignups}
          parishName={appData.config.parishName}
          hasPublishedForms={hasPublishedForms}
        />

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {activeTab === 'masses' && (
            <MassList
              masses={appData.masses}
              ministrantsMap={ministrantsMap}
              onOpenSignUpModal={(mass) => setSelectedMassIdForSignUp(mass.id)}
              onQuickUnassign={handleUnregister}
              isAdmin={isAdmin}
              onAdminToggleLock={handleToggleLockMass}
              onAdminEditMass={(m) => {
                setActiveTab('admin');
              }}
              onAdminOpenCreateMass={() => {
                setActiveTab('admin');
              }}
              globalLockSignups={appData.config.globalLockSignups}
            />
          )}

          {activeTab === 'forms' && (
            <PublicFormsView
              forms={appData.forms || []}
              onSubmitResponse={handleSubmitFormResponse}
            />
          )}

          {activeTab === 'admin' && (
            isAdmin ? (
              <AdminPanel
                masses={appData.masses}
                ministrants={appData.ministrants}
                forms={appData.forms || []}
                formResponses={appData.formResponses || []}
                config={appData.config}
                isMasterAdmin={isMasterAdmin}
                loggedSubAdminId={loggedSubAdminId}
                adminPermissions={adminPermissions}
                onUpdateConfig={handleUpdateConfig}
                onAddMass={handleAddMass}
                onEditMass={handleEditMass}
                onDeleteMass={handleDeleteMass}
                onToggleLockMass={handleToggleLockMass}
                onAddMinistrant={handleAddMinistrant}
                onEditMinistrant={handleEditMinistrant}
                onDeleteMinistrant={handleDeleteMinistrant}
                onDeleteMultipleMasses={handleDeleteMultipleMasses}
                onDeleteMultipleMinistrants={handleDeleteMultipleMinistrants}
                onGenerateMonth={handleGenerateMonthSchedule}
                onRestoreData={handleRestoreData}
                onClearAllMasses={handleClearAllMasses}
                onSaveForm={handleSaveForm}
                onDeleteForm={handleDeleteForm}
                onDeleteFormResponse={handleDeleteFormResponse}
                onClearFormResponses={handleClearFormResponses}
              />
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                  🔒
                </div>
                <h2 className="text-xl font-bold">Správa prostředí je uzamčena</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pro přístup k administraci mší, ministrantů a formulářů zadej PIN kód.
                </p>
                <button
                  onClick={() => setShowAdminAuthModal(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Zadat PIN kód
                </button>
              </div>
            )
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8 text-xs text-slate-500 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 font-medium text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-farnost-800 dark:text-farnost-400">Ministranti Luhačovice</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">Římskokatolická farnost Luhačovice</span>
            </div>
            <div className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">
              © {new Date().getFullYear()} Ministranti Luhačovice
            </div>
          </div>
        </footer>

        {/* Modal Dialogs */}
        {selectedMassForSignUp && (
          <SignUpModal
            mass={selectedMassForSignUp}
            ministrants={appData.ministrants}
            onClose={() => setSelectedMassIdForSignUp(null)}
            onSignUp={handleSignUp}
            onUnregister={handleUnregister}
            globalLockSignups={appData.config.globalLockSignups}
            onAddNewMinistrant={(name) => {
              handleAddMinistrant({
                name,
                isActive: true,
                avatarColor: '#059669',
              });
            }}
          />
        )}

        {showAdminAuthModal && (
          <AdminAuthModal
            masterPin={appData.config.masterPin || '1234'}
            subAdminPins={appData.config.subAdminPins || []}
            onSuccess={(isMaster, perms, subId) => {
              setIsAdmin(true);
              setIsMasterAdmin(isMaster);
              setLoggedSubAdminId(subId);
              if (perms) setAdminPermissions(perms);
              setShowAdminAuthModal(false);
              setActiveTab('admin');
            }}
            onClose={() => setShowAdminAuthModal(false)}
          />
        )}


      </div>
    </ErrorBoundary>
  );
}
