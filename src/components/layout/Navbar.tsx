'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PawPrint,
  ShieldCheck,
  PlusCircle,
  Search,
  Droplet,
  Building2,
  Terminal,
  Radio,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { requestDevnetAirdrop } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';
import { shortenAddress } from '@/lib/solana/pda';

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
  setIsDemoMode,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  const effectivePubkey = publicKey?.toBase58() || (isDemoMode ? demoWalletPubkey : '');

  const handleAirdrop = async () => {
    playSound('click');
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      if (publicKey) {
        const sig = await requestDevnetAirdrop(connection, publicKey, 1);
        setAirdropMsg('+1.0 SOL Devnet!');
        if (onAirdropSuccess) onAirdropSuccess(sig);
      } else {
        // Instant simulated testnet airdrop
        setAirdropMsg('+1.0 SOL (Demo)');
        if (onAirdropSuccess) onAirdropSuccess('5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz123456789abcdefghij');
      }
      playSound('success');
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
    { id: 'radar', label: 'Missing Radar', icon: Radio, badge: missingCount > 0 ? `${missingCount} Live` : null, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
    { id: 'register', label: 'Register Pet', icon: PlusCircle },
    { id: 'mypets', label: 'My Pets Console', icon: ShieldCheck },
    { id: 'clinic', label: 'Clinic Portal', icon: Building2 },
    { id: 'trust', label: 'Trust Inspector', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080c14]/90 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
            onClick={() => {
              setActiveTab('radar');
              playSound('click');
            }}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(0,243,255,0.35)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#080c14] rounded-2xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-cyan-400 animate-pulse-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  Chain<span className="text-gradient-cyan">Paws</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                  Solana
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide hidden sm:block">
                Decentralized Pet Escrow Registry
              </p>
            </div>
          </div>

          {/* Desktop Navigation Navigation Pills */}
          <nav className="hidden lg:flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    playSound('click');
                  }}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
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
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Devnet Cluster Badge */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Devnet</span>
            </div>

            {/* Airdrop Test SOL Button (Always clickable!) */}
            <button
              onClick={handleAirdrop}
              disabled={isAirdropping}
              title="Request 1.0 SOL Devnet Airdrop for test gas & bounties"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-100 text-xs font-bold transition-all shadow-[0_0_15px_rgba(153,69,255,0.25)] disabled:opacity-50"
            >
              <Droplet className={`w-3.5 h-3.5 ${isAirdropping ? 'animate-bounce text-purple-400' : 'text-purple-400'}`} />
              <span>{isAirdropping ? 'Airdropping...' : airdropMsg || '+1.0 SOL'}</span>
            </button>

            {/* Demo Signer Active Pill if no physical Phantom wallet connected */}
            {!publicKey && isDemoMode && (
              <div
                title="Active Demo Testnet Signer (Auto-signs all transactions instantly)"
                className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-[11px] font-mono text-cyan-300"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo Key: {shortenAddress(demoWalletPubkey, 3)}</span>
              </div>
            )}

            {/* Wallet Button */}
            <div className="wallet-button-wrapper flex-shrink-0">
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
                onClick={() => {
                  setActiveTab(item.id);
                  playSound('click');
                }}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
