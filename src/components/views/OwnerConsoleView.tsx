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
  Send,
  PlusCircle,
  Zap,
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
  demoWalletPubkey: string;
}

export const OwnerConsoleView: React.FC<OwnerConsoleViewProps> = ({
  pets,
  onOpenBountyModal,
  onOpenQrModal,
  onUpdatePet,
  onAddTxHistory,
  onNavigateRegister,
  demoWalletPubkey,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; desc: string; txSig?: string } | null>(null);

  const activeSignerPubkey = publicKey || new PublicKey(demoWalletPubkey);

  const handleCancelBounty = async (pet: PetRecord) => {
    setIsProcessing(pet.id);
    playSound('click');
    try {
      let signature = '';
      let isSimulated = false;

      if (publicKey) {
        const result = await cancelBountyTransaction(
          connection,
          wallet as any,
          new PublicKey(pet.pdaAddress)
        );
        signature = result.signature;
        isSimulated = result.isSimulated;
      } else {
        signature = `3X8fM9vP2k1nQjLsTtUwVzAbCdEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
        isSimulated = true;
      }

      const updated: PetRecord = {
        ...pet,
        status: 'safe',
        bountySol: 0,
        bountyEscrowPda: undefined,
      };

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
        const result = await claimBountyTransaction(
          connection,
          wallet as any,
          new PublicKey(pet.pdaAddress),
          finderPubkey
        );
        signature = result.signature;
        isSimulated = result.isSimulated;
      } else {
        signature = `5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
        isSimulated = true;
      }

      // Trigger Confetti & Victory chime!
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#00F3FF', '#38FE5E', '#F59E0B', '#9945FF'],
        });
      } catch {}
      playSound('success');

      const updatedClaims = (pet.claims || []).map((c) =>
        c.id === claim.id ? { ...c, status: 'paid' as const, txSignature: signature } : c
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
        signature,
        type: 'claim_bounty',
        description: `Disbursed ${pet.bountySol} SOL reward to finder (${shortenAddress(claim.finderAddress)}) for recovering ${pet.name}!`,
        timestamp: Date.now(),
        petName: pet.name,
        amountSol: pet.bountySol,
        status: isSimulated ? 'simulated' : 'finalized',
      });

      setSuccessToast({
        title: `🏆 Recovery Settled! ${pet.name} is Reunited!`,
        desc: `${pet.bountySol} SOL successfully disbursed to finder ${shortenAddress(claim.finderAddress)}. Escrow closed.`,
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

  const handleSimulateNewSighting = (pet: PetRecord) => {
    playSound('click');
    const newClaim: ClaimRecord = {
      id: `claim-${Date.now()}`,
      finderAddress: 'QWs7k1ravPgCC959qdS9KpKJajjnY5usKYNMebg5L8M',
      finderName: 'Elena Rostova (Finder)',
      contactInfo: 'elena.finder@solmail.xyz • (555) 019-2834',
      foundLocation: 'Spotted near park entrance, secured safely in yard',
      notes: 'Collar tag verified, pet is safe and fed. Ready for owner handover.',
      timestamp: Date.now(),
      status: 'pending',
    };

    const updated: PetRecord = {
      ...pet,
      claims: [newClaim, ...(pet.claims || [])],
    };

    onUpdatePet(updated);
    playSound('radar');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GUARDIAN CONTROL PANEL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            My Registered Companions ({pets.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Manage pet identity PDAs, lock SOL escrow bounties, and disburse rewards directly to finders.
          </p>
        </div>

        <button
          onClick={() => {
            onNavigateRegister();
            playSound('click');
          }}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950 hover:brightness-110 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>+ Register Another Pet</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-6 rounded-3xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-2 animate-glow">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-7 h-7 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-black text-white">{successToast.title}</h4>
              <p className="text-xs text-emerald-300 font-medium">{successToast.desc}</p>
            </div>
          </div>
          {successToast.txSig && (
            <div className="pt-2 border-t border-emerald-800/50 flex items-center justify-between text-xs font-mono text-emerald-200">
              <span>Solana Devnet Signature:</span>
              <a
                href={getExplorerTxUrl(successToast.txSig)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center space-x-1 text-cyan-300 hover:text-white font-bold"
              >
                <span>{shortenAddress(successToast.txSig, 8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Pet Console Cards */}
      <div className="space-y-6">
        {pets.map((pet) => {
          const isMissing = pet.status === 'missing';
          const pendingClaims = (pet.claims || []).filter((c) => c.status === 'pending');

          return (
            <div
              key={pet.id}
              className={`p-6 sm:p-8 rounded-3xl bg-slate-900/90 border backdrop-blur-2xl transition-all shadow-2xl ${
                isMissing
                  ? 'border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Pet Photo & Details */}
                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-white/10 shadow-lg">
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
                      <h3 className="text-2xl sm:text-3xl font-black text-white">{pet.name}</h3>
                      {isMissing ? (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase font-mono">
                          MISSING ALERT
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase font-mono">
                          SAFE AT HOME
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-semibold">
                      {pet.breed} • {pet.color} • {pet.species.toUpperCase()}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-500">Tag/Chip:</span>{' '}
                        <span className="text-cyan-300 font-bold">{pet.microchipId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">PDA:</span>{' '}
                        <a
                          href={getExplorerAddressUrl(pet.pdaAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-cyan-300 underline font-bold"
                        >
                          {shortenAddress(pet.pdaAddress, 5)}
                        </a>
                      </div>
                    </div>

                    {isMissing && pet.bountySol > 0 && (
                      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-black mt-2 shadow">
                        <Coins className="w-4 h-4 text-amber-400 fill-current" />
                        <span>Locked Escrow: {pet.bountySol} SOL</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
                  
                  {/* View Collar Tag */}
                  <button
                    onClick={() => {
                      onOpenQrModal(pet);
                      playSound('click');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-black flex items-center space-x-1.5 transition-all shadow cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Collar QR</span>
                  </button>

                  {/* Report Lost vs Cancel */}
                  {isMissing ? (
                    <button
                      onClick={() => handleCancelBounty(pet)}
                      disabled={isProcessing === pet.id}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-black flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Cancel & Refund {pet.bountySol} SOL</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onOpenBountyModal(pet);
                        playSound('click');
                      }}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-rose-950 hover:brightness-110 transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-950" />
                      <span>Report Lost & Lock Bounty</span>
                    </button>
                  )}

                  {/* Quick test sighting simulation button for demo */}
                  {isMissing && (
                    <button
                      onClick={() => handleSimulateNewSighting(pet)}
                      title="Simulate a finder sighting submission to test settlement"
                      className="px-4 py-3 rounded-2xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>+ Simulate Sighting</span>
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
                        className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white">
                              {claim.finderName || shortenAddress(claim.finderAddress, 5)}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                              {shortenAddress(claim.finderAddress, 5)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            &ldquo;{claim.notes}&rdquo;
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                            <span>📍 {claim.foundLocation}</span>
                            <span>📞 {claim.contactInfo}</span>
                          </div>
                        </div>

                        {claim.status === 'pending' && isMissing ? (
                          <button
                            onClick={() => handleSettleClaim(pet, claim)}
                            disabled={isProcessing === pet.id}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-950 hover:brightness-110 transition-all flex items-center space-x-2 whitespace-nowrap self-start sm:self-center disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-slate-950" />
                            <span>Confirm Match & Pay {pet.bountySol} SOL</span>
                          </button>
                        ) : (
                          <div className="px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold self-start sm:self-center flex items-center space-x-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Bounty Settled & Paid</span>
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
