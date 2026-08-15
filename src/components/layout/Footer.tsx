'use client';

import React, { useState } from 'react';
import { PawPrint, Shield, ExternalLink, Copy, Check, Lock } from 'lucide-react';
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
              Eliminating recovery reward scams with cryptographically derived Program Derived Accounts (PDAs).
            </p>
            
            {/* Program ID Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0d1526] border border-white/[0.07] text-xs font-mono text-slate-300">
                <Shield className="w-3.5 h-3.5 text-[#2ec4b6]" />
                <span className="text-slate-500">Program ID:</span>
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
                <span>View on Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Architecture Seeds */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Deterministic PDAs
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center space-x-2">
                <span className="text-[#2ec4b6]">▪</span>
                <span>Pet: <code className="text-slate-300 bg-[#0d1526] px-1 py-0.5 rounded">[&quot;pet&quot;, owner, hash]</code></span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#f4a261]">▪</span>
                <span>Bounty: <code className="text-slate-300 bg-[#0d1526] px-1 py-0.5 rounded">[&quot;bounty&quot;, pet_pda]</code></span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400">▪</span>
                <span>Clinic: <code className="text-slate-300 bg-[#0d1526] px-1 py-0.5 rounded">[&quot;clinic&quot;, authority]</code></span>
              </li>
            </ul>
          </div>

          {/* Challenge Track */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Challenge Track
            </h4>
            <div className="p-3.5 rounded-xl bg-[#0d1526] border border-white/[0.07] text-xs space-y-2">
              <div className="flex items-center space-x-2 text-[#a78bfa] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Shield className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>DEV Dog Days Edition</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Smart contract escrow micro-bounties and immutable identity verification on Solana.
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Private Repository Synchronized</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© 2026 ChainPaws Protocol. Built for Solana Devnet & DEV Dog Days Challenge.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Non-custodial pet identity & recovery protection.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
