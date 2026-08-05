import React from 'react';
import { Calendar, ShieldCheck, FileText, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  onRequestAdminAuth: () => void;
  globalLockSignups: boolean;
  parishName: string;
  hasPublishedForms?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  setIsAdmin,
  onRequestAdminAuth,
  globalLockSignups,
  hasPublishedForms = false,
}) => {
  const showFormsTab = hasPublishedForms || isAdmin;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-farnost-700 shadow-sm">
      {/* Top Parish Brand Accent Bar */}
      <div className="h-1.5 w-full bg-farnost-700" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Title - Ministranti Luhačovice */}
          <div className="flex items-center space-x-2 cursor-pointer py-1" onClick={() => setActiveTab('masses')}>
            <div>
              <h1 className="font-black text-xl sm:text-2xl lg:text-3xl tracking-tight text-farnost-900 leading-tight uppercase">
                Ministranti Luhačovice
              </h1>
              <p className="text-[11px] sm:text-xs text-farnost-700 font-extrabold tracking-wider uppercase">
                Rozpis mší svatých a oltářní služby
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Rozpis služeb & Formuláře */}
          <nav className="hidden md:flex items-center space-x-1 bg-farnost-50 p-1 rounded-md text-sm font-bold border border-farnost-200">
            <button
              onClick={() => setActiveTab('masses')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-sm text-xs sm:text-sm transition cursor-pointer ${
                activeTab === 'masses'
                  ? 'bg-farnost-700 shadow-sm text-white font-extrabold'
                  : 'text-farnost-900 hover:text-black'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Rozpis služeb</span>
            </button>

            {showFormsTab && (
              <button
                onClick={() => setActiveTab('forms')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-sm text-xs sm:text-sm transition cursor-pointer ${
                  activeTab === 'forms'
                    ? 'bg-farnost-700 shadow-sm text-white font-extrabold'
                    : 'text-farnost-900 hover:text-black'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Formuláře</span>
              </button>
            )}
          </nav>

          {/* Right Controls - Admin button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {globalLockSignups && (
              <span className="hidden sm:flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-slate-200 text-slate-800 border border-slate-300">
                🔒 Uzamčeno
              </span>
            )}

            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="flex items-center space-x-2 bg-farnost-50 text-farnost-900 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-md font-bold text-xs sm:text-sm border border-farnost-300 hover:bg-farnost-100 transition cursor-pointer min-h-[44px]"
                title="Odhlásit se z admin režimu"
              >
                <ShieldCheck className="w-4 h-4 text-farnost-700" />
                <span className="hidden sm:inline">Admin aktivní</span>
                <span>(Odhlásit)</span>
              </button>
            ) : (
              <button
                onClick={onRequestAdminAuth}
                className="flex items-center gap-2 bg-farnost-700 hover:bg-farnost-800 text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-md font-extrabold text-xs sm:text-sm shadow-sm transition cursor-pointer min-h-[44px]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Administrace</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Tab Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-farnost-200 text-xs">
          <button
            onClick={() => setActiveTab('masses')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-md min-h-[40px] flex-1 cursor-pointer ${
              activeTab === 'masses' ? 'text-farnost-900 font-black bg-farnost-100 border border-farnost-300' : 'text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4 text-farnost-700" />
            <span>Rozpis</span>
          </button>

          {showFormsTab && (
            <button
              onClick={() => setActiveTab('forms')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-md min-h-[40px] flex-1 cursor-pointer ${
                activeTab === 'forms' ? 'text-farnost-900 font-black bg-farnost-100 border border-farnost-300' : 'text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4 text-farnost-700" />
              <span>Formuláře</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!isAdmin) onRequestAdminAuth();
              else setActiveTab('admin');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-md min-h-[40px] flex-1 cursor-pointer ${
              activeTab === 'admin' ? 'text-farnost-900 font-black bg-farnost-100 border border-farnost-300' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-farnost-700" />
            <span>Admin</span>
          </button>
        </div>

      </div>
    </header>
  );
};
