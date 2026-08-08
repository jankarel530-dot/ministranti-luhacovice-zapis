import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('luhacovice_ministranti_app_v1');
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Něco se nepodařilo načíst</h2>
            <p className="text-xs text-slate-300">
              Aplikace zachytila chybu a zabránila spadnutí stránky. Můžeš zkusit stránku obnovit nebo resetovat data do výchozího stavu.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl text-left text-[11px] font-mono text-rose-300 overflow-x-auto">
              {this.state.error?.message || 'Neznámá chyba'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Obnovit výchozí data a načíst aplikaci</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
