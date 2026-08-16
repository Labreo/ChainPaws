'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  QrCode,
  CheckCircle,
  ExternalLink,
  MapPin,
  UserCheck,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { PetRecord, ClaimRecord } from '@/types';
import { shortenAddress, getExplorerAddressUrl, getExplorerTxUrl } from '@/lib/solana/pda';
import { cancelBountyTransaction, claimBountyTransaction } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';
import { PublicKey } from '@solana/web3.js';

interface OwnerConsoleViewProps {
  pets: PetRecord[];
  onOpenBountyModal: (pet: PetRecord) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  onUpdatePet: (updatedPet: PetRecord) => void;
  onAddTxHistory: (item: any) => void;
  onNavigateRegister: () => void;
  onResetDemo?: () => void;
  demoWalletPubkey: string;
}

export const OwnerConsoleView: React.FC<OwnerConsoleViewProps> = ({
  pets,
  onOpenBountyModal,
  onOpenQrModal,
  onUpdatePet,
  onAddTxHistory,
  onNavigateRegister,
  onResetDemo,
  demoWalletPubkey,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; desc: string; txSig?: string } | null>(null);

  const handleCancelBounty = async (pet: PetRecord) => {
    setIsProcessing(pet.id);
    playSound('click');
    try {
      let signature = '';
      let isSimulated = false;

      if (publicKey) {
        const result = await cancelBountyTransaction(connection, wallet as any, new PublicKey(pet.pdaAddress));
        signature = result.signature;
        isSimulated = result.isSimulated;
      } else {
        signature = `3X8fM9vP2k1nQjLsTtUwVzAbCdEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
        isSimulated = true;
      }

      const updated: PetRecord = { ...pet, status: 'safe', bountySol: 0, bountyEscrowPda: undefined };
      playSound('success');
      onUpdatePet(updated);
      onAddTxHistory({
        id: `tx-${Date.now()}`,
        signature,
        type: 'cancel_bounty',
        description: `Cancelled alert & refunded ${pet.bountySol} SOL for ${pet.name}`,
        timestamp: Date.now(),
        petName: pet.name,
        amountSol: pet.bountySol,
        status: isSimulated ? 'simulated' : 'finalized',
      });

      setSuccessToast({
        title: 'Bounty Refunded & Alert Cancelled',
        desc: `${pet.bountySol} SOL has been returned to your wallet. ${pet.name} is marked Safe.`,
        txSig: signature,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      console.error(err);
      playSound('alert');
      alert('Failed to cancel bounty: ' + err?.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSettleClaim = async (pet: PetRecord, claim: ClaimRecord) => {
    setIsProcessing(pet.id);
    playSound('click');
    try {
      let signature = '';
      let isSimulated = false;

      if (publicKey) {
        const finderPubkey = new PublicKey(claim.finderAddress);
        const result = await claimBountyTransaction(connection, wallet as any, new PublicKey(pet.pdaAddress), finderPubkey);
        signature = result.signature;
        isSimulated = result.isSimulated;
      } else {
        signature = `5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
        isSimulated = true;
      }

      try {
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ['#2ec4b6', '#f4a261', '#7c3aed', '#059669'] });
      } catch {}
      playSound('success');

      const updatedClaims = (pet.claims || []).map((c) =>
        c.id === claim.id ? { ...c, status: 'paid' as const, txSignature: signature } : c
      );
      const updated: PetRecord = { ...pet, status: 'safe', bountySol: 0, bountyEscrowPda: undefined, claims: updatedClaims };

      onUpdatePet(updated);
      onAddTxHistory({
        id: `tx-${Date.now()}`,
        signature,
        type: 'claim_bounty',
        description: `Disbursed ${pet.bountySol} SOL reward to finder (${shortenAddress(claim.finderAddress)}) for recovering ${pet.name}`,
        timestamp: Date.now(),
        petName: pet.name,
        amountSol: pet.bountySol,
        status: isSimulated ? 'simulated' : 'finalized',
      });

      setSuccessToast({
        title: `Recovery Settled — ${pet.name} is Reunited`,
        desc: `${pet.bountySol} SOL disbursed to finder ${shortenAddress(claim.finderAddress)}. Escrow closed.`,
        txSig: signature,
      });
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: any) {
      console.error(err);
      playSound('alert');
      alert('Failed to settle bounty payout: ' + err?.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          <p className="label-eyebrow mb-3">Guardian Dashboard</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            My Registered Companions
            <span className="ml-2 text-slate-500 font-normal text-2xl">({pets.length})</span>
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Manage your pet registrations, set escrow recovery bounties, and confirm finder sightings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onResetDemo && (
            <button
              onClick={() => { onResetDemo(); playSound('click'); }}
              className="btn-ghost flex-shrink-0 text-xs text-slate-300 hover:text-white border-white/[0.1] hover:border-[#2ec4b6]/40"
              title="Reset pet records & demo escrows to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2ec4b6]" />
              Reset Demo State
            </button>
          )}
          <button
            onClick={() => { onNavigateRegister(); playSound('click'); }}
            className="btn-primary flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Register Another Pet
          </button>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {successToast && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/35 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {successToast.title}
              </h4>
              <p className="text-xs text-emerald-300 mt-0.5">{successToast.desc}</p>
            </div>
          </div>
          {successToast.txSig && (
            <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono text-emerald-300">
              <span>Signature:</span>
              <a
                href={getExplorerTxUrl(successToast.txSig)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2ec4b6] hover:text-white flex items-center gap-1 font-bold transition-colors"
              >
                {shortenAddress(successToast.txSig, 8)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Pet Cards ── */}
      <div className="space-y-5">
        {pets.map((pet) => {
          const isMissing = pet.status === 'missing';

          return (
            <div
              key={pet.id}
              className={`card p-6 sm:p-7 ${isMissing ? 'border-red-500/25 hover:border-red-400/35' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                {/* Pet Photo + Info */}
                <div className="flex items-start gap-5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#080c14] flex-shrink-0 border border-white/[0.07]">
                    <Image
                      src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                      alt={pet.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-white"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {pet.name}
                      </h3>
                      {isMissing ? (
                        <span className="badge-missing">Missing Alert</span>
                      ) : (
                        <span className="badge-safe">Safe at Home</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-medium">
                      {pet.breed} — {pet.color} — {pet.species.toUpperCase()}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span>
                        <span className="text-slate-500">Microchip Tag: </span>
                        <span className="text-[#2ec4b6] font-semibold font-mono">{pet.microchipId}</span>
                      </span>
                      <a
                        href={getExplorerAddressUrl(pet.pdaAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#2ec4b6] flex items-center gap-1 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Solana Record</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {isMissing && pet.bountySol > 0 && (
                      <div className="badge-bounty mt-1 self-start" style={{ display: 'inline-flex' }}>
                        Locked Escrow Reward: {pet.bountySol} SOL
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 lg:self-center">

                  <button
                    onClick={() => { onOpenQrModal(pet); playSound('click'); }}
                    className="btn-ghost"
                  >
                    <QrCode className="w-4 h-4" />
                    Collar Tag
                  </button>

                  {isMissing ? (
                    <button
                      onClick={() => handleCancelBounty(pet)}
                      disabled={isProcessing === pet.id}
                      className="btn-ghost disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4 text-[#f4a261]" />
                      Cancel & Refund {pet.bountySol} SOL
                    </button>
                  ) : (
                    <button
                      onClick={() => { onOpenBountyModal(pet); playSound('click'); }}
                      className="btn-danger"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Report Missing & Lock Reward
                    </button>
                  )}
                </div>
              </div>

              {/* Claims */}
              {pet.claims && pet.claims.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2ec4b6] uppercase tracking-wider"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <UserCheck className="w-4 h-4" />
                    Recovery Sightings ({pet.claims.length})
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {pet.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-4 rounded-xl bg-[#080c14]/70 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {claim.finderName || shortenAddress(claim.finderAddress, 5)}
                            </span>
                            <span className="text-[10px] font-mono text-[#2ec4b6] bg-[#2ec4b6]/8 px-2 py-0.5 rounded-full border border-[#2ec4b6]/20">
                              {shortenAddress(claim.finderAddress, 5)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            &ldquo;{claim.notes}&rdquo;
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {claim.foundLocation}
                            </span>
                            <span>{claim.contactInfo}</span>
                          </div>
                        </div>

                        {claim.status === 'pending' && isMissing ? (
                          <button
                            onClick={() => handleSettleClaim(pet, claim)}
                            disabled={isProcessing === pet.id}
                            className="btn-primary whitespace-nowrap self-start sm:self-center disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm & Pay {pet.bountySol} SOL
                          </button>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center"
                               style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Reward Disbursed
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
    </div>
  );
};
