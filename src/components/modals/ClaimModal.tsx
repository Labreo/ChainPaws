'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Send, MapPin, User, MessageSquare, AlertCircle, ShieldCheck, Check } from 'lucide-react';
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
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Report Sighting / Claim Bounty
            </h3>
            <p className="text-xs text-slate-400">
              Recovering <span className="text-[#2ec4b6] font-semibold">{pet.name}</span> ({pet.breed})
            </p>
          </div>
        </div>

        {/* Bounty Banner */}
        <div className="mb-6 p-4 rounded-xl bg-[#f4a261]/10 border border-[#f4a261]/25 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs text-[#f4a261] font-semibold uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Locked Escrow Reward
            </div>
            <div className="text-2xl font-black text-[#f4a261] font-mono">
              {pet.bountySol} SOL
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            <div>Escrow PDA:</div>
            <div className="text-slate-300">{shortenAddress(pet.bountyEscrowPda || pet.pdaAddress, 5)}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Finder Solana Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <User className="w-3.5 h-3.5 text-[#2ec4b6]" />
              <span>Your Solana Payout Wallet *</span>
            </label>
            <input
              type="text"
              required
              value={finderAddress}
              onChange={(e) => setFinderAddress(e.target.value)}
              placeholder="e.g. 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
              className="input-field font-mono text-xs text-[#2ec4b6]"
            />
            {publicKey && finderAddress === publicKey.toBase58() && (
              <span className="text-[11px] text-[#2ec4b6] font-mono mt-1 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Connected wallet auto-filled
              </span>
            )}
          </div>

          {/* Sighting Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Where did you spot {pet.name}? *</span>
            </label>
            <input
              type="text"
              required
              value={foundLocation}
              onChange={(e) => setFoundLocation(e.target.value)}
              placeholder="e.g. 18th & Valencia St, Mission District, SF"
              className="input-field"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Elena R."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Contact Phone / Email
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="elena@mail.com or 555-0192"
                className="input-field"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <MessageSquare className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Pet Condition / Note to Owner</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pet is safe with me at home. Healthy, has food and water. Ready for handover."
              className="input-field resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
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
