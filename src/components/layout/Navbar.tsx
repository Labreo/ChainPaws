'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PawPrint,
  Radio,
  PlusCircle,
  ShieldCheck,
  Building2,
  Terminal,
  Coins,
  Award,
} from 'lucide-react';
import { getSolBalance } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAirdropSuccess?: (sig: string) => void;
  missingCount: number;
  demoWalletPubkey: string;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  missingCount,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch real SOL balance from Solana Devnet RPC when wallet is connected
  useEffect(() => {
    let isMounted = true;
    async function updateBalance() {
      if (publicKey) {
        try {
          const bal = await getSolBalance(connection, publicKey);
          if (isMounted) setSolBalance(bal);
        } catch {
          if (isMounted) setSolBalance(null);
        }
      } else {
        if (isMounted) setSolBalance(null);
      }
    }
    updateBalance();
    const interval = setInterval(updateBalance, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  const navItems = [
    { id: 'radar', label: 'Live Map', icon: Radio, count: missingCount > 0 ? missingCount : null },
    { id: 'register', label: 'Register', icon: PlusCircle },
    { id: 'mypets', label: 'My Pets', icon: ShieldCheck },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'clinic', label: 'Clinic Portal', icon: Building2 },
    { id: 'trust', label: 'Trust Audit', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-white/[0.08] bg-[#080c14]/95 backdrop-blur-2xl transition-all">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Bar */}
        <div className="flex items-center justify-between h-18 py-3 gap-3 md:gap-6">

          {/* Left: Brand Identity */}
          <button
            onClick={() => { setActiveTab('radar'); playSound('click'); }}
            className="flex items-center gap-3 group text-left flex-shrink-0 cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6] group-hover:bg-[#2ec4b6]/20 transition-all shadow-sm">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight leading-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Chain<span className="text-[#2ec4b6]">Paws</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                Solana Pet Registry
              </div>
            </div>
          </button>

          {/* Center: Desktop Navigation Tabs (Spacious & Clean) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] flex-shrink-0">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); playSound('click'); }}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-[#080c14] bg-[#2ec4b6] shadow-sm font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{label}</span>
                  {count !== null && count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono min-w-[18px] text-center leading-none ${
                      isActive ? 'bg-[#080c14] text-[#2ec4b6]' : 'bg-red-500/90 text-white shadow-sm animate-pulse'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Network Status & Wallet */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Devnet Cluster Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Devnet</span>
            </div>

            {/* Connected SOL Balance (only appears when wallet is connected) */}
            {solBalance !== null && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4a261]/10 border border-[#f4a261]/25 text-[11px] font-mono text-[#f4a261] font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>{solBalance.toFixed(2)} SOL</span>
              </div>
            )}

            {/* Custom Wallet Button */}
            <div className="wallet-button-wrapper flex-shrink-0">
              <WalletMultiButton />
            </div>

          </div>
        </div>

        {/* Mobile / Tablet Navigation Strip */}
        <div className="lg:hidden flex items-center gap-1.5 pb-2.5 overflow-x-auto border-t border-white/[0.06] pt-2 scrollbar-none">
          {navItems.map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); playSound('click'); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#2ec4b6] text-[#080c14] font-bold'
                    : 'text-slate-400 hover:text-white bg-white/[0.03]'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== null && count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-[#080c14] text-[#2ec4b6]' : 'bg-red-500 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
