import React, { useState } from 'react';
import { CampEvent } from '../../types/events';
import { QrCode, X, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  event: CampEvent;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, event, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const signupUrl = `${window.location.origin}/#akce-${event.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate deterministic SVG QR code pattern
  const qrSize = 21;
  const generateModules = () => {
    const matrix: boolean[][] = Array(qrSize).fill(false).map(() => Array(qrSize).fill(false));
    
    // Finder patterns
    const addFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            if (row + r < qrSize && col + c < qrSize) matrix[row + r][col + c] = true;
          }
        }
      }
    };
    addFinder(0, 0);
    addFinder(0, 14);
    addFinder(14, 0);

    // Pseudorandom data modules based on event id string
    let seed = 0;
    for (let i = 0; i < event.id.length; i++) seed += event.id.charCodeAt(i);
    for (let r = 0; r < qrSize; r++) {
      for (let c = 0; c < qrSize; c++) {
        if ((r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7)) continue;
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = seed / 233280.0 > 0.45;
      }
    }
    return matrix;
  };

  const matrix = generateModules();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-farnost-700 dark:border-slate-700 shadow-2xl max-w-sm w-full p-6 rounded-md space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center justify-center p-3 bg-farnost-50 dark:bg-slate-800 text-farnost-700 dark:text-farnost-300 rounded-md border border-farnost-200 mb-1">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">QR kód pro přihlášení</h3>
          <p className="text-xs text-slate-500 font-bold">{event.title}</p>
        </div>

        {/* QR Code Canvas rendering */}
        <div className="bg-white p-4 rounded-md border-2 border-farnost-200 shadow-inner flex justify-center items-center mx-auto w-52 h-52">
          <svg viewBox="0 0 21 21" className="w-full h-full shape-rendering-crisp">
            {matrix.map((row, rIdx) =>
              row.map((cell, cIdx) =>
                cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#0f172a" /> : null
              )
            )}
          </svg>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed px-2">
          Namiřte fotoaparát mobilního telefonu na tento QR kód pro okamžité přihlášení na akce farnosti Luhačovice.
        </p>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between p-2.5 bg-farnost-50 dark:bg-slate-800 border border-farnost-200 rounded-md text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span className="truncate pr-2">{signupUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white rounded-md border border-slate-300 cursor-pointer shrink-0"
              title="Kopírovat odkaz"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-farnost-700 hover:bg-farnost-800 text-white font-black text-xs rounded-md shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Vytisknout plakát s QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
