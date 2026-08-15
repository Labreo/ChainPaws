'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, ExternalLink, X, Coins } from 'lucide-react';
import { ToastMessage } from '@/types';
import { getExplorerTxUrl, shortenAddress } from '@/lib/solana/pda';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
              isSuccess
                ? 'bg-[#0d1526] border-emerald-500/40 text-emerald-100'
                : isWarning
                ? 'bg-[#0d1526] border-[#f4a261]/40 text-amber-100'
                : isError
                ? 'bg-[#0d1526] border-red-500/40 text-red-100'
                : 'bg-[#0d1526] border-[#2ec4b6]/40 text-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <Coins className="w-5 h-5 text-[#f4a261] flex-shrink-0 mt-0.5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-[#2ec4b6] flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {toast.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                  {toast.txSig && (
                    <a
                      href={getExplorerTxUrl(toast.txSig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-[#2ec4b6] hover:text-white underline transition-colors"
                    >
                      <span>Solana Explorer: {shortenAddress(toast.txSig, 6)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
