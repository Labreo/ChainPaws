'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { X, Lock, MapPin, AlertTriangle, Coins, ShieldAlert, Sparkles } from 'lucide-react';
import { PetRecord } from '@/types';
import { deriveBountyPda, shortenAddress } from '@/lib/solana/pda';
import { PublicKey } from '@solana/web3.js';

interface BountyModalProps {
  pet: PetRecord | null;
  onClose: () => void;
  onConfirmReportLost: (petId: string, bountySol: number, location: string) => Promise<void>;
}

export const BountyModal: React.FC<BountyModalProps> = ({
  pet,
  onClose,
  onConfirmReportLost,
}) => {
  const { publicKey } = useWallet();
  const [bountySol, setBountySol] = useState<number>(0.5);
  const [location, setLocation] = useState(pet?.lastSeenLocation || '');
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pet) return null;

  const presets = [0.1, 0.25, 0.5, 1.0, 2.0];

  let escrowPreview = '';
  try {
    const { pda } = deriveBountyPda(new PublicKey(pet.pdaAddress));
    escrowPreview = pda.toBase58();
  } catch {
    escrowPreview = 'BountyEscrowPDA_DerivedOnChain';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bountySol <= 0) {
      setError('Please specify a bounty reward greater than 0 SOL.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter the last seen location of your pet.');
      return;
    }

    setIsLocking(true);
    setError(null);

    try {
      await onConfirmReportLost(pet.id, bountySol, location.trim());
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to lock bounty into escrow. Please check your wallet balance.');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d1424] border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Report Missing & Lock Bounty
            </h3>
            <p className="text-xs text-slate-400">
              Broadcasting alert on Solana Devnet for <span className="text-amber-300 font-semibold">{pet.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Bounty Input & Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Bounty Escrow Amount (SOL) *</span>
              </span>
              <span className="text-[11px] text-slate-400">Locked in non-custodial PDA</span>
            </label>

            <div className="relative mb-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={bountySol}
                onChange={(e) => setBountySol(parseFloat(e.target.value) || 0)}
                className="w-full pl-4 pr-16 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xl font-bold font-mono text-amber-400 outline-none"
              />
              <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">
                SOL
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center space-x-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBountySol(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    bountySol === amt
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt} SOL
                </button>
              ))}
            </div>
          </div>

          {/* Last Seen Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Last Seen Location / Area *</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mission Dolores Park, SF (Near dog play area)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* PDA Escrow Details Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Escrow Vault PDA:</span>
              <span className="text-amber-300">{shortenAddress(escrowPreview, 6)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Seed Derivation:</span>
              <span className="text-slate-300">[&quot;bounty&quot;, pet_pda]</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Safety Guarantee:</span>
              <span className="text-emerald-400">100% Refundable by Owner</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocking}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isLocking ? 'Locking SOL in Escrow...' : `Lock ${bountySol} SOL & Broadcast Alert`}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
