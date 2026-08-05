import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Potvrdit',
  cancelLabel = 'Zrušit',
  isDanger = true,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 rounded-md space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-sm transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-md shrink-0 ${
              isDanger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-md transition cursor-pointer min-h-[40px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 font-black text-xs text-white rounded-md transition cursor-pointer min-h-[40px] shadow-sm ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-farnost-700 hover:bg-farnost-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
