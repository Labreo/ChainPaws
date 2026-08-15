'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PawPrint, Search, PlusCircle, ShieldCheck, Building2, Terminal, Radio, Droplet } from 'lucide-react';
import { requestDevnetAirdrop } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';
import { shortenAddress } from '@/lib/solana/pda';

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
  onAirdropSuccess,
  missingCount,
  demoWalletPubkey,
  isDemoMode,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  const handleAirdrop = async () => {
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      if (publicKey) {
        const sig = await requestDevnetAirdrop(connection, publicKey, 1);
        setAirdropMsg('+1 SOL');
        if (onAirdropSuccess) onAirdropSuccess(sig);
      } else {
        setAirdropMsg('+1 SOL (Demo)');
        if (onAirdropSuccess) onAirdropSuccess('5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz123456789abcdefghij');
      }
      playSound('success');
      setTimeout(() => setAirdropMsg(null), 4000);
    } catch {
      setAirdropMsg('Faucet busy');
      setTimeout(() => setAirdropMsg(null), 3000);
    } finally {
      setIsAirdropping(false);
    }
  };

  const navItems = [
    { id: 'radar', label: 'Missing Radar', icon: Radio, count: missingCount > 0 ? missingCount : null },
    { id: 'register', label: 'Register Pet', icon: PlusCircle },
    { id: 'mypets', label: 'My Pets', icon: ShieldCheck },
    { id: 'clinic', label: 'Clinic Portal', icon: Building2 },
    { id: 'trust', label: 'Trust Inspector', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080c14]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main nav row */}
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand */}
          <button
            onClick={() => { setActiveTab('radar'); playSound('click'); }}
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 group-hover:bg-[#2ec4b6]/15 transition-colors">
              <PawPrint className="w-4.5 h-4.5 text-[#2ec4b6]" style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-display font-900 text-base text-white leading-none tracking-tight">
                Chain<span className="text-[#2ec4b6]">Paws</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
                Solana Pet Registry
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); playSound('click'); }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-[#2ec4b6] bg-[#2ec4b6]/8'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8125rem' }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {count !== null && count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono min-w-[18px] text-center leading-tight">
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-[#2ec4b6]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Devnet indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span>Devnet</span>
            </div>

            {/* Airdrop button */}
            <button
              onClick={handleAirdrop}
              disabled={isAirdropping}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/15 border border-[#7c3aed]/30 hover:border-[#7c3aed]/50 text-[#a78bfa] hover:text-white text-[11px] font-semibold transition-all disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>{isAirdropping ? 'Airdropping...' : airdropMsg || '+1 SOL'}</span>
            </button>

            {/* Demo key indicator */}
            {!publicKey && isDemoMode && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[10px] font-mono text-slate-500">
                <span className="text-[#2ec4b6]">Demo:</span>
                <span>{shortenAddress(demoWalletPubkey, 4)}</span>
              </div>
            )}

            {/* Wallet button */}
            <div className="wallet-button-wrapper flex-shrink-0">
              <WalletMultiButton />
            </div>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="lg:hidden flex items-center gap-1 pb-2 overflow-x-auto border-t border-white/[0.06] pt-1.5">
          {navItems.map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); playSound('click'); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-[#2ec4b6]/10 text-[#2ec4b6] border border-[#2ec4b6]/25' : 'text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== null && count !== undefined && (
                  <span className="px-1 rounded-full bg-red-600 text-white text-[9px] font-bold">{count}</span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
