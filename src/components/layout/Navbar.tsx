'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PawPrint, ShieldCheck, PlusCircle, Search, Activity, Droplet, Sparkles, Building2, Terminal } from 'lucide-react';
import { requestDevnetAirdrop } from '@/lib/solana/service';

// Dynamically import WalletMultiButton to prevent SSR hydration mismatch
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAirdropSuccess?: (sig: string) => void;
  missingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onAirdropSuccess,
  missingCount,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      const sig = await requestDevnetAirdrop(connection, publicKey, 1);
      setAirdropMsg('+1.0 SOL Airdropped!');
      if (onAirdropSuccess) onAirdropSuccess(sig);
      setTimeout(() => setAirdropMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setAirdropMsg('Faucet Busy');
      setTimeout(() => setAirdropMsg(null), 3000);
    } finally {
      setIsAirdropping(false);
    }
  };

  const navItems = [
    { id: 'radar', label: 'Missing Radar', icon: Search, badge: missingCount > 0 ? `${missingCount} Live` : null, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
    { id: 'register', label: 'Register Pet', icon: PlusCircle },
    { id: 'mypets', label: 'My Pets Console', icon: ShieldCheck },
    { id: 'clinic', label: 'Clinic Portal', icon: Building2 },
    { id: 'trust', label: 'Trust Inspector', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080c14]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('radar')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(0,243,255,0.35)]">
              <div className="w-full h-full bg-[#080c14] rounded-2xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-cyan-400 animate-pulse-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  Chain<span className="text-gradient-cyan">Paws</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide">
                Solana Pet Registry & Trustless Escrow
              </p>
            </div>
          </div>

          {/* Desktop Navigation Navigation Pills */}
          <nav className="hidden lg:flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Devnet Status, Faucet & Wallet Adapter */}
          <div className="flex items-center space-x-3">
            
            {/* Devnet Cluster Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Solana Devnet</span>
            </div>

            {/* Airdrop Test SOL Button */}
            {publicKey && (
              <button
                onClick={handleAirdrop}
                disabled={isAirdropping}
                title="Request 1.0 SOL Devnet Airdrop for test gas & bounties"
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-purple-100 text-xs font-medium transition-all shadow-[0_0_15px_rgba(153,69,255,0.2)] disabled:opacity-50"
              >
                <Droplet className={`w-3.5 h-3.5 ${isAirdropping ? 'animate-bounce text-purple-400' : 'text-purple-400'}`} />
                <span>{isAirdropping ? 'Airdropping...' : airdropMsg || 'Devnet +1 SOL'}</span>
              </button>
            )}

            {/* Wallet Button */}
            <div className="wallet-button-wrapper">
              <WalletMultiButton />
            </div>

          </div>

        </div>

        {/* Mobile Navigation Tab Bar */}
        <div className="lg:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
