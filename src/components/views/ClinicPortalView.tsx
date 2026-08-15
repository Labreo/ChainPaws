'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Building2,
  Scan,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Award,
  Stethoscope,
  Smartphone,
  Wifi,
  QrCode,
} from 'lucide-react';
import { PetRecord, ClinicRecord } from '@/types';
import { calculateChipHash, deriveClinicPda, shortenAddress, getExplorerAddressUrl } from '@/lib/solana/pda';
import { playSound } from '@/lib/sound';

interface ClinicPortalViewProps {
  pets: PetRecord[];
  clinics: ClinicRecord[];
  onOpenClaimModal: (pet: PetRecord) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  demoWalletPubkey: string;
}

export const ClinicPortalView: React.FC<ClinicPortalViewProps> = ({
  pets,
  clinics,
  onOpenClaimModal,
  onOpenQrModal,
  demoWalletPubkey,
}) => {
  const { publicKey } = useWallet();
  const [scanInput, setScanInput] = useState('');
  const [scannedPet, setScannedPet] = useState<PetRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);

  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [registeredClinics, setRegisteredClinics] = useState<ClinicRecord[]>(clinics);
  const [isRegisteringClinic, setIsRegisteringClinic] = useState(false);

  const handleScanLookup = async (e?: React.FormEvent, customChip?: string) => {
    if (e) e.preventDefault();
    const query = (customChip || scanInput).trim();
    if (!query) return;

    setIsSearching(true);
    setSearchAttempted(true);
    setScannedPet(null);
    playSound('radar');

    const { hex } = await calculateChipHash(query);
    const match = pets.find(
      (p) =>
        p.microchipId.toLowerCase() === query.toLowerCase() ||
        p.chipHash.toLowerCase() === hex.toLowerCase() ||
        p.pdaAddress.toLowerCase() === query.toLowerCase()
    );

    setTimeout(() => {
      setScannedPet(match || null);
      setIsSearching(false);
      if (match) playSound('success');
      else playSound('alert');
    }, 450);
  };

  const handleNfcSimulateTap = (pet: PetRecord) => {
    setIsNfcScanning(true);
    setScanInput(pet.microchipId);
    playSound('radar');
    setTimeout(() => {
      setIsNfcScanning(false);
      handleScanLookup(undefined, pet.microchipId);
    }, 800);
  };

  const handleRegisterClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !clinicLocation.trim()) return;
    playSound('click');
    setIsRegisteringClinic(true);
    try {
      const dummyAuth = publicKey?.toBase58() || demoWalletPubkey;
      const newClinic: ClinicRecord = {
        pdaAddress: `Clnc_${Date.now().toString().slice(-8)}`,
        authorityAddress: dummyAuth,
        name: clinicName.trim(),
        location: clinicLocation.trim(),
        isVerified: true,
        registeredAt: Date.now(),
      };
      playSound('success');
      setRegisteredClinics([newClinic, ...registeredClinics]);
      setClinicName('');
      setClinicLocation('');
    } finally {
      setIsRegisteringClinic(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="space-y-3">
        <p className="label-eyebrow">Veterinary & Shelter Verification Terminal</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Microchip Scanner & NFC Collar Hub
        </h2>
        <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
          Authorized vet clinics and humane shelters scan RFID microchips to instantly query Solana PDAs
          and cryptographically verify missing pets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Scanner + Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 sm:p-7 space-y-6">

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/25">
                <Scan className="w-5 h-5 text-[#2ec4b6]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  RFID / ISO 11784 Microchip Scanner
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter 15-digit chip ID or Tag ID to query on-chain PetRecord PDA
                </p>
              </div>
            </div>

            <form onSubmit={handleScanLookup} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="e.g. 985141009823451 or 985141007890123"
                  className="input-field font-mono text-[#2ec4b6] pr-32"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="btn-primary absolute right-2 top-1.5 py-2 px-4 text-xs rounded-lg disabled:opacity-50"
                >
                  {isSearching ? 'Querying...' : 'Scan Chip'}
                </button>
              </div>

              {/* Quick test chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  1-Click Test:
                </span>
                {pets.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setScanInput(p.microchipId); handleScanLookup(undefined, p.microchipId); }}
                    className="btn-ghost py-1 px-2.5 text-[11px] font-mono"
                  >
                    {p.name} ({p.microchipId.slice(-6)})
                  </button>
                ))}
              </div>
            </form>

            {/* NFC Collar Simulator */}
            <div className="p-4 rounded-xl bg-[#7c3aed]/8 border border-[#7c3aed]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a78bfa] text-xs font-semibold"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Smartphone className="w-4 h-4" />
                  NFC Smart Collar Simulator
                </div>
                <Wifi className="w-4 h-4 text-[#a78bfa] animate-pulse" />
              </div>
              <p className="text-xs text-slate-400">
                Simulates tapping a smartphone against a missing pet&apos;s NFC smart collar:
              </p>
              <div className="flex flex-wrap gap-2">
                {pets.filter((p) => p.status === 'missing').map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleNfcSimulateTap(p)}
                    disabled={isNfcScanning}
                    className="btn-ghost border-[#7c3aed]/30 text-[#a78bfa] hover:border-[#7c3aed]/50 text-xs py-1.5 px-3 disabled:opacity-50"
                  >
                    <Smartphone className="w-3 h-3" />
                    Tap {p.name}&apos;s Tag
                  </button>
                ))}
              </div>
            </div>

            {/* No result */}
            {searchAttempted && !scannedPet && !isSearching && (
              <div className="p-5 rounded-xl bg-red-950/40 border border-red-500/25 text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  No Record Found on Solana
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Microchip ID &ldquo;{scanInput}&rdquo; is not registered under any active PetRecord PDA.
                </p>
              </div>
            )}

            {/* Match result */}
            {scannedPet && (
              <div className="p-6 rounded-xl border border-[#2ec4b6]/30 bg-[#2ec4b6]/5 space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0d1526] border border-white/[0.07] flex-shrink-0">
                      <Image
                        src={scannedPet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                        alt={scannedPet.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-xl font-bold text-white"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {scannedPet.name}
                        </h4>
                        {scannedPet.status === 'missing' ? (
                          <span className="badge-missing">Reported Missing</span>
                        ) : (
                          <span className="badge-safe">Safe at Home</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {scannedPet.breed} — {scannedPet.color}
                      </p>
                    </div>
                  </div>

                  {scannedPet.status === 'missing' && scannedPet.bountySol > 0 && (
                    <div className="badge-bounty self-start">
                      Reward: {scannedPet.bountySol} SOL
                    </div>
                  )}
                </div>

                <div className="terminal-block space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Microchip:</span>
                    <span className="text-[#2ec4b6] font-bold">{scannedPet.microchipId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pet PDA Address:</span>
                    <span className="text-slate-300 font-bold">{shortenAddress(scannedPet.pdaAddress, 6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner Wallet:</span>
                    <span className="text-slate-300">{shortenAddress(scannedPet.ownerAddress, 6)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {scannedPet.status === 'missing' ? (
                    <button
                      onClick={() => { onOpenClaimModal(scannedPet); playSound('click'); }}
                      className="btn-danger flex-1"
                    >
                      <Award className="w-4 h-4" />
                      Submit Clinic Recovery Verification
                    </button>
                  ) : (
                    <button
                      onClick={() => { onOpenQrModal(scannedPet); playSound('click'); }}
                      className="btn-ghost flex-1"
                    >
                      <QrCode className="w-4 h-4" />
                      View Collar Tag
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinics List + Register */}
        <div className="space-y-5">

          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <Building2 className="w-4 h-4" />
              Licensed Clinics ({registeredClinics.length})
            </div>

            <div className="space-y-2.5">
              {registeredClinics.map((clinic) => (
                <div
                  key={clinic.pdaAddress}
                  className="p-3.5 rounded-xl bg-[#080c14]/60 border border-white/[0.07] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {clinic.name}
                    </span>
                    <span className="badge-safe">Verified</span>
                  </div>
                  <p className="text-slate-400">{clinic.location}</p>
                  <div className="font-mono text-[10px] text-slate-600 pt-0.5">
                    PDA: {clinic.pdaAddress}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Register Clinic */}
          <div className="card-flat p-5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Register Vet Clinic Authority
            </h4>
            <form onSubmit={handleRegisterClinic} className="space-y-3">
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clinic / Hospital Name"
                className="input-field text-xs"
              />
              <input
                type="text"
                required
                value={clinicLocation}
                onChange={(e) => setClinicLocation(e.target.value)}
                placeholder="City, State / Address"
                className="input-field text-xs"
              />
              <button
                type="submit"
                disabled={isRegisteringClinic}
                className="btn-primary w-full py-2.5 text-xs disabled:opacity-50"
              >
                Register Clinic on Solana
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
