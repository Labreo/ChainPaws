'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { X, Lock, MapPin, AlertTriangle, Coins, ShieldAlert } from 'lucide-react';
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
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1526] border border-white/[0.1] p-6 sm:p-8 shadow-2xl overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Report Missing & Lock Bounty
            </h3>
            <p className="text-xs text-slate-400">
              Broadcasting alert on Solana Devnet for <span className="text-[#f4a261] font-semibold">{pet.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Bounty Input & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#f4a261]" />
                <span>Bounty Escrow Amount (SOL) *</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono lowercase">non-custodial PDA</span>
            </label>

            <div className="relative mb-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={bountySol}
                onChange={(e) => setBountySol(parseFloat(e.target.value) || 0)}
                className="input-field pl-4 pr-16 py-3 font-mono text-xl font-bold text-[#f4a261]"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500 font-mono">
                SOL
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBountySol(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    bountySol === amt
                      ? 'bg-[#f4a261] text-[#080c14]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.07]'
                  }`}
                >
                  {amt} SOL
                </button>
              ))}
            </div>
          </div>

          {/* Last Seen Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Last Seen Location *</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mission Dolores Park, SF (Near dog play area)"
              className="input-field"
            />
          </div>

          {/* PDA Details */}
          <div className="terminal-block space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Escrow Vault PDA:</span>
              <span className="text-[#f4a261] font-bold">{shortenAddress(escrowPreview, 6)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Seed Derivation:</span>
              <span className="text-slate-400">[&quot;bounty&quot;, pet_pda]</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Safety Guarantee:</span>
              <span className="text-emerald-400">100% Refundable by Owner</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLocking}
            className="btn-danger w-full py-3.5 text-sm disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isLocking ? 'Locking SOL in Escrow...' : `Lock ${bountySol} SOL & Broadcast Alert`}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
