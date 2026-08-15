'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, ExternalLink, X, Coins, Sparkles } from 'lucide-react';
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
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-glow ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-950/50'
                : isError
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50'
                : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-100 shadow-cyan-950/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <Coins className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{toast.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                  {toast.txSig && (
                    <a
                      href={getExplorerTxUrl(toast.txSig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center space-x-1 text-[11px] font-mono text-cyan-300 hover:text-white underline"
                    >
                      <span>Solana Explorer: {shortenAddress(toast.txSig, 6)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
