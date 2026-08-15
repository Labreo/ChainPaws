'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Send, MapPin, User, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { PetRecord, ClaimRecord } from '@/types';
import { shortenAddress } from '@/lib/solana/pda';

interface ClaimModalProps {
  pet: PetRecord | null;
  onClose: () => void;
  onSubmitClaim: (petId: string, claimData: Omit<ClaimRecord, 'id' | 'timestamp' | 'status'>) => Promise<void>;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ pet, onClose, onSubmitClaim }) => {
  const { publicKey } = useWallet();
  const [finderAddress, setFinderAddress] = useState(publicKey?.toBase58() || '');
  const [finderName, setFinderName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finderAddress.trim()) {
      setError('Please provide your Solana wallet address to receive the bounty.');
      return;
    }
    if (!foundLocation.trim()) {
      setError('Please provide where you spotted or secured the pet.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmitClaim(pet.id, {
        finderAddress: finderAddress.trim(),
        finderName: finderName.trim() || undefined,
        contactInfo: contactInfo.trim() || 'Via on-chain claim',
        foundLocation: foundLocation.trim(),
        notes: notes.trim() || 'Pet spotted / secured by finder.',
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to submit recovery claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d1424] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px]">
            <div className="w-full h-full bg-[#0d1424] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Report Sighting / Claim Bounty
            </h3>
            <p className="text-xs text-slate-400">
              Recovering <span className="text-cyan-300 font-semibold">{pet.name}</span> ({pet.breed})
            </p>
          </div>
        </div>

        {/* Bounty Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Locked Escrow Reward
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {pet.bountySol} SOL
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            <div>Escrow PDA:</div>
            <div className="text-slate-300">{shortenAddress(pet.bountyEscrowPda || pet.pdaAddress, 5)}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Finder Solana Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Your Solana Payout Wallet Address *</span>
            </label>
            <input
              type="text"
              required
              value={finderAddress}
              onChange={(e) => setFinderAddress(e.target.value)}
              placeholder="e.g. 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono text-white placeholder-slate-500 outline-none transition-all"
            />
            {publicKey && finderAddress === publicKey.toBase58() && (
              <span className="text-[11px] text-cyan-400 font-mono mt-1 inline-block">
                ✓ Connected Phantom / Solflare wallet auto-filled
              </span>
            )}
          </div>

          {/* Sighting / Recovery Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Where did you find / spot {pet.name}? *</span>
            </label>
            <input
              type="text"
              required
              value={foundLocation}
              onChange={(e) => setFoundLocation(e.target.value)}
              placeholder="e.g. 18th & Valencia St, Mission District, SF"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Elena R."
                className="w-full px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contact Phone / Telegram
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="@elena_sol or 555-0192"
                className="w-full px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Description & Condition Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Pet Condition / Message to Owner</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pet is safe with me at home. Healthy, has food and water. Ready for scan/handover."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:shadow-[0_0_35px_rgba(0,243,255,0.7)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Recovery Claim...' : 'Submit Claim & Notify Owner'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
