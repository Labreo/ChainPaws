'use client';

import React from 'react';
import {
  Award,
  ShieldCheck,
  Coins,
  MapPin,
  CheckCircle2,
  Lock,
  Radio,
  Building2,
  Terminal,
  ExternalLink,
  Flame,
  HeartHandshake,
} from 'lucide-react';
import { PetRecord, TxHistoryItem } from '@/types';
import { shortenAddress, getExplorerTxUrl } from '@/lib/solana/pda';
import { playSound } from '@/lib/sound';

interface GuardianBadgesViewProps {
  pets: PetRecord[];
  txHistory: TxHistoryItem[];
  onNavigateTab: (tab: string) => void;
}

export const GuardianBadgesView: React.FC<GuardianBadgesViewProps> = ({
  pets,
  txHistory,
  onNavigateTab,
}) => {
  const missingPets = pets.filter((p) => p.status === 'missing');
  const safePets = pets.filter((p) => p.status === 'safe');
  const totalBountySol = missingPets.reduce((sum, p) => sum + (p.bountySol || 0), 0);
  const totalClaims = pets.reduce((sum, p) => sum + (p.claims?.length || 0), 0);

  const badges = [
    {
      id: 'badge-genesis',
      name: 'Guardian Genesis',
      category: 'Identity',
      icon: ShieldCheck,
      description: 'Minted an immutable PetRecord PDA on Solana Devnet.',
      isUnlocked: pets.length > 0,
      color: 'from-[#2ec4b6]/20 to-[#2ec4b6]/5 border-[#2ec4b6]/40 text-[#2ec4b6]',
    },
    {
      id: 'badge-sentinel',
      name: 'Bounty Sentinel',
      category: 'Escrow',
      icon: Lock,
      description: 'Funded a non-custodial SOL reward vault for a missing companion.',
      isUnlocked: missingPets.length > 0,
      color: 'from-[#f4a261]/20 to-[#f4a261]/5 border-[#f4a261]/40 text-[#f4a261]',
    },
    {
      id: 'badge-responder',
      name: 'First Responder',
      category: 'Community',
      icon: Radio,
      description: 'Submitted a verified sighting claim with GPS location.',
      isUnlocked: totalClaims > 0,
      color: 'from-[#7c3aed]/20 to-[#7c3aed]/5 border-[#7c3aed]/40 text-[#a78bfa]',
    },
    {
      id: 'badge-reunion',
      name: 'Reunion Champion',
      category: 'Recovery',
      icon: HeartHandshake,
      description: 'Confirmed recovery match and disbursed on-chain bounty to finder.',
      isUnlocked: txHistory.some((tx) => tx.type === 'claim_bounty'),
      color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'badge-shelter',
      name: 'Licensed Clinic Node',
      category: 'Authority',
      icon: Building2,
      description: 'Registered a certified veterinary clinic PDA on the network.',
      isUnlocked: true,
      color: 'from-blue-500/20 to-blue-500/5 border-blue-500/40 text-blue-400',
    },
    {
      id: 'badge-auditor',
      name: 'Cryptographic Auditor',
      category: 'Security',
      icon: Terminal,
      description: 'Executed state boundary and falsification invariant probes.',
      isUnlocked: true,
      color: 'from-purple-500/20 to-purple-500/5 border-purple-500/40 text-purple-400',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="space-y-3">
        <p className="label-eyebrow">Collective Rescue Network & Achievements</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Guardian Badges & Rescue Impact
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          Every on-chain registration, escrow deposit, and verified sighting unlocks permanent achievements and strengthens the global decentralized pet recovery network.
        </p>
      </div>

      {/* ── Collective Impact Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Protected Animals', value: pets.length, icon: ShieldCheck, color: 'text-[#2ec4b6]' },
          { label: 'Active Escrow Vaults', value: `${totalBountySol.toFixed(2)} SOL`, icon: Coins, color: 'text-[#f4a261]' },
          { label: 'Community Sightings', value: totalClaims, icon: Radio, color: 'text-[#a78bfa]' },
          { label: 'Verified Safe at Home', value: safePets.length, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Live Network</span>
            </div>
            <div className={`stat-value text-3xl ${color}`}>{value}</div>
            <div className="text-xs font-semibold text-slate-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Guardian Badges Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Award className="w-5 h-5 text-[#f4a261]" />
            <span>Guardian Achievement Badges ({badges.filter(b => b.isUnlocked).length}/{badges.length} Unlocked)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`card p-6 space-y-4 relative overflow-hidden bg-gradient-to-br ${badge.color} border transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] shadow-lg">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.08] text-white border border-white/[0.1]">
                    {badge.category}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white leading-tight"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {badge.name}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Unlocked On-Chain
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Solana Devnet</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Real-Time Protocol Transaction Ledger ── */}
      <div className="card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Live Protocol Action Stream
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {txHistory.length} On-Chain Records
          </span>
        </div>

        <div className="divide-y divide-white/[0.06] max-h-80 overflow-y-auto">
          {txHistory.map((tx) => (
            <div key={tx.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="text-white font-medium">{tx.description}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {new Date(tx.timestamp).toLocaleTimeString()} — {tx.status.toUpperCase()}
                </div>
              </div>

              {tx.signature && (
                <a
                  href={getExplorerTxUrl(tx.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2ec4b6] hover:text-white flex items-center gap-1 font-mono text-[11px] flex-shrink-0 transition-colors"
                >
                  <span>Tx: {shortenAddress(tx.signature, 5)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
