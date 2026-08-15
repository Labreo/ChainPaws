'use client';

import React, { useState } from 'react';
import { PawPrint, Shield, ExternalLink, Copy, Check, Lock, Heart } from 'lucide-react';
import { CHAINPAWS_PROGRAM_ID, getExplorerAddressUrl } from '@/lib/solana/pda';

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const programIdStr = CHAINPAWS_PROGRAM_ID.toBase58();

  const handleCopy = () => {
    navigator.clipboard.writeText(programIdStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#080c14] text-slate-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6]">
                <PawPrint className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Chain<span className="text-[#2ec4b6]">Paws</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Decentralized pet identification registry and trustless lost-and-found escrow protocol built on Solana.
              Eliminating recovery reward scams with cryptographically verified microchip identity.
            </p>
            
            {/* Smart Contract Program Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0d1526] border border-white/[0.07] text-xs font-mono text-slate-300">
                <Shield className="w-3.5 h-3.5 text-[#2ec4b6]" />
                <span className="text-slate-500">Program:</span>
                <span className="text-[#2ec4b6] font-semibold">{programIdStr.slice(0, 8)}...{programIdStr.slice(-8)}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy Program ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <a
                href={getExplorerAddressUrl(programIdStr)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-[#2ec4b6] hover:text-white transition-colors"
              >
                <span>Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              How It Works
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white transition-colors cursor-pointer">
                Microchip ISO 11784 Identity
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                Non-Custodial Escrow Vaults
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                Printable QR Collar Tags
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                Veterinary & Shelter Scanner
              </li>
            </ul>
          </div>

          {/* Network & Protocol */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Network & Trust
            </h4>
            <div className="p-3.5 rounded-xl bg-[#0d1526] border border-white/[0.07] text-xs space-y-2">
              <div className="flex items-center space-x-2 text-[#2ec4b6] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Shield className="w-3.5 h-3.5 text-[#2ec4b6]" />
                <span>Solana Devnet Cluster</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Smart contract escrows ensure rewards are only paid when animals are safely returned.
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-emerald-400 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>100% Non-Custodial Guarantee</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© 2026 ChainPaws Protocol. Built for Solana Devnet.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Non-custodial companion protection.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
