'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Building2,
  Scan,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Stethoscope,
  Sparkles,
  Smartphone,
  Wifi,
  Radio,
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

    // Compute chip hash for lookup
    const { hex } = await calculateChipHash(query);

    // Search in registry
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
      
      {/* Header Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>VETERINARY & SHELTER VERIFICATION TERMINAL</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Microchip Scanner & NFC Collar Hub
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Authorized vet clinics and humane shelters scan RFID microchips to instantly query Solana Devnet PDAs and cryptographically verify missing pets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Microchip Scanner Simulator & Result */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-2xl space-y-6 shadow-2xl">
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  RFID / ISO 11784 Microchip Scanner Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Input 15-digit chip ID or Tag ID to query on-chain PetRecord PDA
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
                  className="w-full pl-4 pr-36 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 font-mono text-sm text-cyan-300 placeholder-slate-500 outline-none font-bold transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? 'Querying...' : 'Scan Chip'}
                </button>
              </div>

              {/* Quick sample chips buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">1-Click Test Chips:</span>
                {pets.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setScanInput(p.microchipId);
                      handleScanLookup(undefined, p.microchipId);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer shadow"
                  >
                    {p.name} ({p.microchipId.slice(-6)})
                  </button>
                ))}
              </div>
            </form>

            {/* Simulated NFC Smartphone Tap Zone */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/40 to-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold font-mono">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>NFC SMART COLLAR SIMULATOR (TAP TO SCAN)</span>
                </div>
                <Wifi className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-300">
                Simulates tapping a smartphone against a missing pet&apos;s NFC smart collar:
              </p>
              <div className="flex flex-wrap gap-2">
                {pets.filter((p) => p.status === 'missing').map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleNfcSimulateTap(p)}
                    disabled={isNfcScanning}
                    className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow"
                  >
                    <span>📱 Tap {p.name}&apos;s Collar Tag</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Query Result Card */}
            {searchAttempted && !scannedPet && !isSearching && (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Record Found on Solana</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Microchip ID &ldquo;{scanInput}&rdquo; is not registered under any active PetRecord PDA.
                </p>
              </div>
            )}

            {scannedPet && (
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-950 border border-cyan-500/50 space-y-4 shadow-[0_0_35px_rgba(0,243,255,0.2)] animate-glow">
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0 shadow-lg">
                      <Image
                        src={scannedPet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                        alt={scannedPet.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-2xl font-black text-white">{scannedPet.name}</h4>
                        {scannedPet.status === 'missing' ? (
                          <span className="px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black font-mono">
                            🚨 REPORTED MISSING
                          </span>
                        ) : (
                          <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black font-mono">
                            ✓ SAFE AT HOME
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {scannedPet.breed} • {scannedPet.color}
                      </p>
                    </div>
                  </div>

                  {scannedPet.status === 'missing' && scannedPet.bountySol > 0 && (
                    <div className="sm:text-right font-mono bg-amber-500/15 p-3 rounded-2xl border border-amber-500/40">
                      <div className="text-[11px] text-amber-300 font-bold">Active Escrow Reward</div>
                      <div className="text-2xl font-black text-amber-400">{scannedPet.bountySol} SOL</div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Microchip ID:</span>
                    <span className="text-cyan-300 font-black">{scannedPet.microchipId}</span>
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

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  {scannedPet.status === 'missing' ? (
                    <button
                      onClick={() => {
                        onOpenClaimModal(scannedPet);
                        playSound('click');
                      }}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 text-slate-950 text-xs font-black shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 fill-current" />
                      <span>Submit Official Clinic Recovery Verification</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onOpenQrModal(scannedPet);
                        playSound('click');
                      }}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
                    >
                      View Collar Tag
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Right 1 Col: Verified Clinics List & Register */}
        <div className="space-y-6">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-2xl space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold">
              <Building2 className="w-4 h-4" />
              <span>LICENSED CLINICS ON DEVNET ({registeredClinics.length})</span>
            </div>

            <div className="space-y-3">
              {registeredClinics.map((clinic) => (
                <div
                  key={clinic.pdaAddress}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{clinic.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-medium">{clinic.location}</p>
                  <div className="text-[10px] font-mono text-slate-500 pt-1">
                    PDA: {clinic.pdaAddress}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Register New Clinic Form */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Register Vet Clinic Authority
            </h4>
            <form onSubmit={handleRegisterClinic} className="space-y-3">
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clinic / Hospital Name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
              />
              <input
                type="text"
                required
                value={clinicLocation}
                onChange={(e) => setClinicLocation(e.target.value)}
                placeholder="City, State / Address"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                disabled={isRegisteringClinic}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow cursor-pointer"
              >
                Register Clinic Authority on Solana
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
