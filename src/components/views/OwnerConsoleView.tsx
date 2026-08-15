'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  ShieldAlert,
  Coins,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { PetRecord, ClaimRecord } from '@/types';
import { shortenAddress, getExplorerAddressUrl, getExplorerTxUrl } from '@/lib/solana/pda';
import { cancelBountyTransaction, claimBountyTransaction } from '@/lib/solana/service';
import { PublicKey } from '@solana/web3.js';

interface OwnerConsoleViewProps {
  pets: PetRecord[];
  onOpenBountyModal: (pet: PetRecord) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  onUpdatePet: (updatedPet: PetRecord) => void;
  onAddTxHistory: (item: any) => void;
  onNavigateRegister: () => void;
}

export const OwnerConsoleView: React.FC<OwnerConsoleViewProps> = ({
  pets,
  onOpenBountyModal,
  onOpenQrModal,
  onUpdatePet,
  onAddTxHistory,
  onNavigateRegister,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; desc: string; txSig?: string } | null>(null);

  // Filter pets owned by connected wallet or display all for demo if not yet created
  const userPets = pets.filter(
    (p) => !publicKey || p.ownerAddress === publicKey.toBase58() || pets.length <= 5
  );

  const handleCancelBounty = async (pet: PetRecord) => {
    if (!wallet.publicKey) return;
    setIsProcessing(pet.id);
    try {
      const result = await cancelBountyTransaction(
        connection,
        wallet as any,
        new PublicKey(pet.pdaAddress)
      );

      const updated: PetRecord = {
        ...pet,
        status: 'safe',
        bountySol: 0,
        bountyEscrowPda: undefined,
      };

      onUpdatePet(updated);
      onAddTxHistory({
        id: `tx-${Date.now()}`,
        signature: result.signature,
        type: 'cancel_bounty',
        description: `Cancelled alert & refunded ${pet.bountySol} SOL for ${pet.name}`,
        timestamp: Date.now(),
        petName: pet.name,
        amountSol: pet.bountySol,
        status: result.isSimulated ? 'simulated' : 'finalized',
      });

      setSuccessToast({
        title: 'Bounty Refunded & Alert Cancelled',
        desc: `${pet.bountySol} SOL has been returned to your wallet. ${pet.name} is marked Safe.`,
        txSig: result.signature,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Failed to cancel bounty: ' + err?.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSettleClaim = async (pet: PetRecord, claim: ClaimRecord) => {
    if (!wallet.publicKey) return;
    setIsProcessing(pet.id);
    try {
      const finderPubkey = new PublicKey(claim.finderAddress);
      const result = await claimBountyTransaction(
        connection,
        wallet as any,
        new PublicKey(pet.pdaAddress),
        finderPubkey
      );

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00F3FF', '#38FE5E', '#F59E0B', '#9945FF'],
        });
      } catch {}

      const updatedClaims = (pet.claims || []).map((c) =>
        c.id === claim.id ? { ...c, status: 'paid' as const, txSignature: result.signature } : c
      );

      const updated: PetRecord = {
        ...pet,
        status: 'safe',
        bountySol: 0,
        bountyEscrowPda: undefined,
        claims: updatedClaims,
      };

      onUpdatePet(updated);
      onAddTxHistory({
        id: `tx-${Date.now()}`,
        signature: result.signature,
        type: 'claim_bounty',
        description: `Disbursed ${pet.bountySol} SOL reward to finder (${shortenAddress(claim.finderAddress)}) for recovering ${pet.name}!`,
        timestamp: Date.now(),
        petName: pet.name,
        amountSol: pet.bountySol,
        status: result.isSimulated ? 'simulated' : 'finalized',
      });

      setSuccessToast({
        title: `🏆 Recovery Settled! ${pet.name} is Reunited!`,
        desc: `${pet.bountySol} SOL successfully disbursed to finder ${shortenAddress(claim.finderAddress)}. Escrow closed.`,
        txSig: result.signature,
      });
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: any) {
      console.error(err);
      alert('Failed to settle bounty payout: ' + err?.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GUARDIAN CONTROL PANEL</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            My Registered Companions
          </h2>
          <p className="text-xs text-slate-400">
            Manage your pet identity PDAs, toggle missing alerts, and disburse trustless escrow bounties.
          </p>
        </div>

        <button
          onClick={onNavigateRegister}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950 hover:brightness-110 transition-all flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Register Another Pet</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-5 rounded-3xl bg-emerald-950/80 border border-emerald-500/50 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-2 animate-glow">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">{successToast.title}</h4>
              <p className="text-xs text-emerald-300">{successToast.desc}</p>
            </div>
          </div>
          {successToast.txSig && (
            <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono text-emerald-200">
              <span>Solana Devnet Signature:</span>
              <a
                href={getExplorerTxUrl(successToast.txSig)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center space-x-1 text-cyan-300 hover:text-white"
              >
                <span>{shortenAddress(successToast.txSig, 8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Pet Console Cards */}
      {userPets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white">No registered pets yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Protect your dog or cat with an immutable Solana PDA microchip identity record.
          </p>
          <button
            onClick={onNavigateRegister}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
          >
            Register Your First Pet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {userPets.map((pet) => {
            const isMissing = pet.status === 'missing';
            const pendingClaims = (pet.claims || []).filter((c) => c.status === 'pending');

            return (
              <div
                key={pet.id}
                className={`p-6 sm:p-8 rounded-3xl bg-slate-900/80 border backdrop-blur-xl transition-all ${
                  isMissing
                    ? 'border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Pet Photo & Details */}
                  <div className="flex items-start space-x-4 sm:space-x-6">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-white/10">
                      <Image
                        src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                        alt={pet.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-2xl font-black text-white">{pet.name}</h3>
                        {isMissing ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase font-mono">
                            MISSING ALERT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase font-mono">
                            SAFE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-medium">
                        {pet.breed} • {pet.color} • {pet.species.toUpperCase()}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <div>
                          <span className="text-slate-500">Tag/Chip:</span>{' '}
                          <span className="text-cyan-300">{pet.microchipId}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">PDA:</span>{' '}
                          <a
                            href={getExplorerAddressUrl(pet.pdaAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-300 hover:text-cyan-300 underline"
                          >
                            {shortenAddress(pet.pdaAddress, 4)}
                          </a>
                        </div>
                      </div>

                      {isMissing && pet.bountySol > 0 && (
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mt-2">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>Locked Escrow: {pet.bountySol} SOL</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 lg:self-center">
                    
                    {/* View Collar Tag */}
                    <button
                      onClick={() => onOpenQrModal(pet)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Collar QR</span>
                    </button>

                    {/* Report Lost vs Cancel */}
                    {isMissing ? (
                      <button
                        onClick={() => handleCancelBounty(pet)}
                        disabled={isProcessing === pet.id}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel Alert & Refund SOL</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenBountyModal(pet)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-950 hover:brightness-110 transition-all flex items-center space-x-1.5"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Report Lost & Lock Bounty</span>
                      </button>
                    )}

                  </div>

                </div>

                {/* Sighting Claims List for this Pet */}
                {pet.claims && pet.claims.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
                      <UserCheck className="w-4 h-4" />
                      <span>Recovery Claims & Sighting Submissions ({pet.claims.length})</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {pet.claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">
                                Finder: {claim.finderName || shortenAddress(claim.finderAddress, 4)}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                {shortenAddress(claim.finderAddress, 5)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              &ldquo;{claim.notes}&rdquo;
                            </p>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                              <span>📍 {claim.foundLocation}</span>
                              <span>📞 {claim.contactInfo}</span>
                            </div>
                          </div>

                          {claim.status === 'pending' && isMissing ? (
                            <button
                              onClick={() => handleSettleClaim(pet, claim)}
                              disabled={isProcessing === pet.id}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950 hover:brightness-110 transition-all flex items-center space-x-1.5 whitespace-nowrap self-start sm:self-center disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Confirm Match & Pay {pet.bountySol} SOL</span>
                            </button>
                          ) : (
                            <div className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold self-start sm:self-center">
                              ✓ Bounty Settled & Paid
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
