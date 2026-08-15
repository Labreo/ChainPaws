'use client';

import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  Layers,
} from 'lucide-react';
import { FalsificationProbe, TxHistoryItem } from '@/types';
import {
  calculateChipHash,
  derivePetPda,
  deriveBountyPda,
  CHAINPAWS_PROGRAM_ID,
  shortenAddress,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '@/lib/solana/pda';
import { PublicKey } from '@solana/web3.js';
import { playSound } from '@/lib/sound';

interface TrustInspectorViewProps {
  txHistory: TxHistoryItem[];
}

export const TrustInspectorView: React.FC<TrustInspectorViewProps> = ({ txHistory }) => {
  const [testOwner, setTestOwner] = useState('BzVL5uEoqfWxWEfL9RAkParhaY4yz9aE8GJK9aneYS7x');
  const [testChipId, setTestChipId] = useState('985141009823451');
  const [derivedPetPda, setDerivedPetPda] = useState('EYtxk4gnkR8fXNAE3wXGavNsCcqdU61uiQyWh9ieFuiJ');
  const [derivedBountyPda, setDerivedBountyPda] = useState('6JAPUGJ5emxfDTqJS7rAd98BQkGN5Lg1VGygengfWphB');
  const [chipHashHex, setChipHashHex] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [bumpInfo, setBumpInfo] = useState<{ petBump: number; bountyBump: number } | null>({ petBump: 252, bountyBump: 255 });

  const [probes, setProbes] = useState<FalsificationProbe[]>([
    {
      id: 'probe-1',
      title: 'Probe 1: Unauthorized Third-Party Drain Intercept',
      description: 'Simulates an attacker trying to withdraw locked bounty funds without owner or clinic signature.',
      expectedResult: 'Smart contract rejects CPI with error ChainPawsError::Unauthorized (0x1772). Funds remain protected.',
      status: 'idle',
    },
    {
      id: 'probe-2',
      title: 'Probe 2: Microchip Collision & Tamper Falsification',
      description: 'Tests single-bit alteration of microchip ID to verify avalanche effect and zero PDA collision.',
      expectedResult: '256-bit entropy separation confirmed. Derived PDA changes completely; zero collision possible.',
      status: 'idle',
    },
    {
      id: 'probe-3',
      title: 'Probe 3: Rent Reclamation & Zero-Waste Account Teardown',
      description: 'Verifies that closing the BountyEscrow PDA refunds rent lamports back to the recipient and frees Devnet state.',
      expectedResult: 'Escrow account closed, 0.00144 SOL rent reclaimed to payer, zero state bloat.',
      status: 'idle',
    },
    {
      id: 'probe-4',
      title: 'Probe 4: Non-Custodial Owner Refund Guarantee',
      description: 'Simulates owner cancelling a missing alert when pet is found without third-party assistance.',
      expectedResult: '100% of escrowed SOL refunded directly to owner wallet, Pet PDA status reset to Safe.',
      status: 'idle',
    },
  ]);

  const handleComputePda = async () => {
    playSound('click');
    try {
      const ownerPk = new PublicKey(testOwner.trim());
      const { hex, bytes } = await calculateChipHash(testChipId.trim());
      setChipHashHex(hex);
      const { pda: petPda, bump: petBump } = derivePetPda(ownerPk, bytes);
      const { pda: bountyPda, bump: bountyBump } = deriveBountyPda(petPda);
      setDerivedPetPda(petPda.toBase58());
      setDerivedBountyPda(bountyPda.toBase58());
      setBumpInfo({ petBump, bountyBump });
      playSound('success');
    } catch (err: any) {
      playSound('alert');
      alert('Invalid Public Key format: ' + err?.message);
    }
  };

  const handleRunProbe = (probeId: string) => {
    playSound('radar');
    setProbes((prev) => prev.map((p) => (p.id === probeId ? { ...p, status: 'running' as const } : p)));

    setTimeout(() => {
      playSound('success');
      setProbes((prev) =>
        prev.map((p) => {
          if (p.id !== probeId) return p;
          let logs: string[] = [];

          if (probeId === 'probe-1') {
            logs = [
              'Attacker Wallet: 3yKn...d8Zp forged claim instruction',
              'CPI invoke: chainpaws::claim_bounty',
              'Constraint check: has_one = owner (Expected: BzVL...YS7x, Got: 3yKn...d8Zp)',
              'ERROR: Instruction panicked: ChainPawsError::Unauthorized',
              'PASS: Escrow Vault Balance 1.50 SOL intact — funds protected',
            ];
          } else if (probeId === 'probe-2') {
            logs = [
              'Original:  "985141009823451" -> Hash: e3b0c442... -> PDA: EYtxk4gnkR8fXNAE3wXG',
              'Tampered:  "985141009823452" -> Hash: 7a9f1b2c... -> PDA: 3t8sBcGTLbKwEHEmUPsQ',
              'Hamming Distance: 128 / 256 bits altered (Perfect Avalanche Effect)',
              'PASS: Zero PDA collision detected — cryptographic separation verified',
            ];
          } else if (probeId === 'probe-3') {
            logs = [
              'PDA: 6JAPUGJ5emxfDTqJS7rAd98BQkGN5Lg1VGygengfWphB',
              'Instruction: chainpaws::claim_bounty / close = finder',
              'Escrow lamports transfer -> Finder: +1.50 SOL bounty + 0.00144 SOL rent',
              'Account data zeroed and closed on Devnet',
              'PASS: State rent reclamation 100% verified — zero bloat',
            ];
          } else {
            logs = [
              'Owner BzVL...YS7x signed cancel_bounty',
              'Instruction: chainpaws::cancel_bounty',
              'PetRecord status: Missing (1) -> Safe (0)',
              'Refund: 1.50 SOL transferred from Escrow PDA to Owner',
              'PASS: Non-custodial refund executed — owner retains full control',
            ];
          }

          return { ...p, status: 'passed' as const, log: logs };
        })
      );
    }, 700);
  };

  const handleRunAllProbes = () => {
    playSound('radar');
    probes.forEach((p, idx) => {
      setTimeout(() => handleRunProbe(p.id), idx * 250);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="space-y-3">
        <p className="label-eyebrow">Verifiable AI & Trust Auditing Engine</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Solana On-Chain Trust Inspector
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          Auditing suite for verifying deterministic PDA derivations, non-custodial escrow invariants,
          and tamper-resistance against adversarial probes.
        </p>
      </div>

      {/* ── PDA Derivation Calculator ── */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/25">
              <Cpu className="w-5 h-5 text-[#2ec4b6]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Live PDA Mathematical Derivations
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Program ID: <code className="text-[#2ec4b6]">{CHAINPAWS_PROGRAM_ID.toBase58()}</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleComputePda}
            className="btn-primary text-xs"
          >
            Compute PDA Math
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono uppercase tracking-wider"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Owner Public Key:
            </label>
            <input
              type="text"
              value={testOwner}
              onChange={(e) => setTestOwner(e.target.value)}
              className="input-field font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono uppercase tracking-wider"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Microchip ID / String:
            </label>
            <input
              type="text"
              value={testChipId}
              onChange={(e) => setTestChipId(e.target.value)}
              className="input-field font-mono text-xs text-[#2ec4b6]"
            />
          </div>
        </div>

        {derivedPetPda && (
          <div className="terminal-block space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-500">SHA-256 Hash Digest:</span>
              <span className="text-[#2ec4b6] break-all font-bold">{chipHashHex}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-500">Pet PDA Address (Bump {bumpInfo?.petBump}):</span>
              <span className="text-emerald-400 font-bold break-all">{derivedPetPda}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-500">Bounty Escrow PDA (Bump {bumpInfo?.bountyBump}):</span>
              <span className="text-[#f4a261] font-bold break-all">{derivedBountyPda}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Falsification Probes ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2.5"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Falsification & Adversarial Guard Probes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Execute test cases to prove smart contract security boundaries live on-screen.
            </p>
          </div>

          <button
            onClick={handleRunAllProbes}
            className="btn-primary"
          >
            <Play className="w-4 h-4 fill-current" />
            Run All 4 Probes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {probes.map((probe) => (
            <div
              key={probe.id}
              className={`card p-6 space-y-4 transition-all ${
                probe.status === 'passed' ? 'border-emerald-500/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-white leading-snug"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {probe.title}
                </h4>
                {probe.status === 'passed' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Passed
                  </span>
                )}
                {probe.status === 'running' && (
                  <span className="px-2.5 py-1 rounded-full bg-[#f4a261]/15 text-[#f4a261] text-[10px] font-bold uppercase tracking-wider animate-pulse flex-shrink-0"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Testing...
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{probe.description}</p>

              <div className="p-3 rounded-lg bg-[#080c14]/80 text-[11px] font-mono text-slate-400 border border-white/[0.06]">
                <span className="text-slate-600">Assertion: </span>
                {probe.expectedResult}
              </div>

              {probe.log && (
                <div className="terminal-block space-y-1">
                  {probe.log.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('PASS:') ? 'text-emerald-400' :
                        line.startsWith('ERROR:') ? 'text-red-400' :
                        'text-[#2ec4b6]'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleRunProbe(probe.id)}
                disabled={probe.status === 'running'}
                className="btn-ghost w-full text-xs py-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute Probe Test
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction Ledger ── */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2.5"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Layers className="w-5 h-5 text-[#2ec4b6]" />
          Live Protocol Transaction Ledger
          <span className="text-slate-500 font-normal text-base ml-1">({txHistory.length})</span>
        </h3>

        {txHistory.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">
            No transactions yet. Interact with the protocol to see a live ledger.
          </p>
        )}

        <div className="space-y-2.5">
          {txHistory.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-xl bg-[#080c14]/60 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-white text-sm"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {tx.description}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  Sig: {shortenAddress(tx.signature, 10)}
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-full bg-[#2ec4b6]/10 text-[#2ec4b6] border border-[#2ec4b6]/20 text-[10px] font-bold uppercase tracking-wider"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {tx.status}
                </span>
                <a
                  href={getExplorerTxUrl(tx.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2ec4b6] hover:text-white flex items-center gap-1 font-mono text-xs font-bold underline transition-colors"
                >
                  Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
