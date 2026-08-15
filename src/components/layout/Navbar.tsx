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
  Droplet,
  Coins,
  Award,
} from 'lucide-react';
import { requestDevnetAirdrop, getSolBalance } from '@/lib/solana/service';
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
  onAirdropSuccess,
  missingCount,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch real SOL balance from Solana Devnet RPC
  useEffect(() => {
    let isMounted = true;
    async function updateBalance() {
      if (publicKey) {
        const bal = await getSolBalance(connection, publicKey);
        if (isMounted) setSolBalance(bal);
      } else {
        if (isMounted) setSolBalance(3.45);
      }
    }
    updateBalance();
    const interval = setInterval(updateBalance, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  const handleAirdrop = async () => {
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      if (publicKey) {
        const sig = await requestDevnetAirdrop(connection, publicKey, 1);
        setAirdropMsg('+1 SOL');
        if (onAirdropSuccess) onAirdropSuccess(sig);
        const newBal = await getSolBalance(connection, publicKey);
        setSolBalance(newBal);
      } else {
        setAirdropMsg('+1 SOL');
        setSolBalance((prev) => (prev !== null ? prev + 1 : 4.45));
        if (onAirdropSuccess) {
          onAirdropSuccess('5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz123456789abcdefghij');
        }
      }
      playSound('success');
      setTimeout(() => setAirdropMsg(null), 3000);
    } catch {
      setAirdropMsg('Faucet Busy');
      setTimeout(() => setAirdropMsg(null), 3000);
    } finally {
      setIsAirdropping(false);
    }
  };

  const navItems = [
    { id: 'radar', label: 'Live Map & Alerts', icon: Radio, count: missingCount > 0 ? missingCount : null },
    { id: 'register', label: 'Register Pet', icon: PlusCircle },
    { id: 'mypets', label: 'My Pets', icon: ShieldCheck },
    { id: 'badges', label: 'Badges & Impact', icon: Award },
    { id: 'clinic', label: 'Clinic Portal', icon: Building2 },
    { id: 'trust', label: 'Trust Audit', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-white/[0.08] bg-[#080c14]/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Bar */}
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Brand Identity */}
          <button
            onClick={() => { setActiveTab('radar'); playSound('click'); }}
            className="flex items-center gap-3 group text-left flex-shrink-0"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6] group-hover:bg-[#2ec4b6]/20 transition-colors">
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

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); playSound('click'); }}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-[#080c14] bg-[#2ec4b6] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{label}</span>
                  {count !== null && count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono min-w-[18px] text-center ${
                      isActive ? 'bg-[#080c14] text-[#2ec4b6]' : 'bg-red-600 text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Network Status, Faucet & Wallet */}
          <div className="flex items-center gap-2.5 flex-shrink-0">

            {/* Devnet Cluster Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Devnet</span>
            </div>

            {/* Real SOL Balance readout */}
            {solBalance !== null && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f4a261]/10 border border-[#f4a261]/25 text-[11px] font-mono text-[#f4a261] font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>{solBalance.toFixed(2)} SOL</span>
              </div>
            )}

            {/* Airdrop Faucet Button */}
            <button
              onClick={handleAirdrop}
              disabled={isAirdropping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/15 border border-[#7c3aed]/30 hover:border-[#7c3aed]/60 text-[#a78bfa] hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              title="Request 1 Devnet SOL from faucet"
            >
              <Droplet className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>{isAirdropping ? 'Airdropping...' : airdropMsg || '+1 SOL'}</span>
            </button>

            {/* Custom Wallet Button */}
            <div className="wallet-button-wrapper flex-shrink-0">
              <WalletMultiButton />
            </div>

          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden flex items-center gap-1 pb-2.5 overflow-x-auto border-t border-white/[0.06] pt-2">
          {navItems.map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); playSound('click'); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2ec4b6] text-[#080c14] font-bold'
                    : 'text-slate-400 hover:text-white bg-white/[0.03]'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== null && count !== undefined && (
                  <span className={`px-1 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-[#080c14] text-[#2ec4b6]' : 'bg-red-600 text-white'
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
