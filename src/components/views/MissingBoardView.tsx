'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  Filter,
  Flame,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  QrCode,
  ArrowUpDown,
  Coins,
  CheckCircle2,
  ExternalLink,
  Radio,
  Grid,
  HeartPulse,
  Send,
  Zap,
} from 'lucide-react';
import { PetRecord, Species } from '@/types';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/solana/pda';
import { RadarMap } from './RadarMap';
import { playSound } from '@/lib/sound';

interface MissingBoardViewProps {
  pets: PetRecord[];
  onOpenClaimModal: (pet: PetRecord) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  onNavigateRegister: () => void;
  onQuickSimulateClaim?: (pet: PetRecord) => void;
}

export const MissingBoardView: React.FC<MissingBoardViewProps> = ({
  pets,
  onOpenClaimModal,
  onOpenQrModal,
  onNavigateRegister,
  onQuickSimulateClaim,
}) => {
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'dog' | 'cat'>('all');
  const [statusFilter, setStatusFilter] = useState<'missing_only' | 'all'>('missing_only');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'bounty_desc' | 'recent'>('bounty_desc');
  const [showRadarMap, setShowRadarMap] = useState(true);
  const [highBountyOnly, setHighBountyOnly] = useState(false);
  const [medicalUrgentOnly, setMedicalUrgentOnly] = useState(false);

  const filteredPets = useMemo(() => {
    return pets
      .filter((pet) => {
        // Status filter
        if (statusFilter === 'missing_only' && pet.status !== 'missing') return false;
        // Species filter
        if (speciesFilter !== 'all' && pet.species !== speciesFilter) return false;
        // High bounty toggle
        if (highBountyOnly && (pet.bountySol || 0) < 1.0) return false;
        // Medical urgent toggle
        if (medicalUrgentOnly && !pet.medicalUrgent) return false;
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = pet.name.toLowerCase().includes(q);
          const matchBreed = pet.breed.toLowerCase().includes(q);
          const matchLocation = (pet.lastSeenLocation || '').toLowerCase().includes(q);
          const matchChip = pet.microchipId.toLowerCase().includes(q);
          const matchCity = (pet.city || '').toLowerCase().includes(q);
          if (!matchName && !matchBreed && !matchLocation && !matchChip && !matchCity) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'bounty_desc') {
          return (b.bountySol || 0) - (a.bountySol || 0);
        }
        return b.createdAt - a.createdAt;
      });
  }, [pets, speciesFilter, statusFilter, highBountyOnly, medicalUrgentOnly, searchQuery, sortBy]);

  const totalBountySol = pets
    .filter((p) => p.status === 'missing')
    .reduce((acc, p) => acc + (p.bountySol || 0), 0);

  const missingPetsCount = pets.filter((p) => p.status === 'missing').length;

  return (
    <div className="space-y-8">
      
      {/* Hero Banner with Protocol Live Metrics & Fast Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0d182e] to-slate-950 border border-cyan-500/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(0,243,255,0.12)]">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>LIVE SOLANA ESCROW RADAR</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>DEV Dog Days Edition</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Stop Lost Pet Scams with <span className="text-gradient-cyan">Trustless Solana Bounties</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            When pets go missing, owners lock SOL rewards directly into on-chain Escrow PDAs. 
            Finders receive guaranteed automatic payouts upon verified collar/microchip identity match.
          </p>

          {/* Key Metrics Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 backdrop-blur-md space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Active Missing Alerts</div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono flex items-center space-x-1.5">
                <span>{missingPetsCount}</span>
                <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  Live
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Locked Bounty Vaults</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-center space-x-1">
                <span>{totalBountySol.toFixed(2)}</span>
                <span className="text-xs font-sans text-amber-300">SOL</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Protected Pet PDAs</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {pets.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Recovery Settlement</div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                100%
              </div>
            </div>

          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                onNavigateRegister();
                playSound('click');
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:shadow-[0_0_35px_rgba(0,243,255,0.7)] hover:scale-102 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>+ Mint Pet Identity PDA on Solana</span>
            </button>

            <button
              onClick={() => {
                setShowRadarMap(!showRadarMap);
                playSound('radar');
              }}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 shadow-lg"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>{showRadarMap ? 'Hide Radar Map' : 'Show Interactive Radar Map'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Radar Sweeper Map */}
      {showRadarMap && (
        <RadarMap
          pets={pets}
          onSelectPet={(pet) => {
            onOpenQrModal(pet);
            playSound('click');
          }}
          onOpenClaim={(pet) => {
            onOpenClaimModal(pet);
            playSound('click');
          }}
        />
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by companion name, breed, city (SF, LA, Austin), or microchip ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Species filter */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => { setSpeciesFilter('all'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  speciesFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setSpeciesFilter('dog'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  speciesFilter === 'dog' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dogs 🐕
              </button>
              <button
                onClick={() => { setSpeciesFilter('cat'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  speciesFilter === 'cat' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cats 🐈
              </button>
            </div>

            {/* High Bounty Toggle */}
            <button
              onClick={() => { setHighBountyOnly(!highBountyOnly); playSound('click'); }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                highBountyOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>🔥 &gt;1.0 SOL</span>
            </button>

            {/* Medical Urgent Toggle */}
            <button
              onClick={() => { setMedicalUrgentOnly(!medicalUrgentOnly); playSound('click'); }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                medicalUrgentOnly
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-300'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>🚨 Medical Urgent</span>
            </button>

            {/* Status toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => { setStatusFilter('missing_only'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === 'missing_only'
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Missing ({missingPetsCount})
              </button>
              <button
                onClick={() => { setStatusFilter('all'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({pets.length})
              </button>
            </div>

            {/* Sort order */}
            <button
              onClick={() => {
                setSortBy(sortBy === 'bounty_desc' ? 'recent' : 'bounty_desc');
                playSound('click');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{sortBy === 'bounty_desc' ? 'Highest Reward' : 'Most Recent'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Pet Grid Cards */}
      {filteredPets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No pets matching your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or reset filter pills above.
          </p>
          <button
            onClick={() => {
              setSpeciesFilter('all');
              setStatusFilter('missing_only');
              setHighBountyOnly(false);
              setMedicalUrgentOnly(false);
              setSearchQuery('');
              playSound('click');
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:bg-cyan-400 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => {
            const isMissing = pet.status === 'missing';
            return (
              <div
                key={pet.id}
                className={`group relative rounded-3xl bg-slate-900/90 border overflow-hidden backdrop-blur-xl transition-all duration-300 hover:translate-y-[-4px] shadow-xl ${
                  isMissing
                    ? 'border-rose-500/30 hover:border-rose-500/70 hover:shadow-[0_0_35px_rgba(244,63,94,0.25)]'
                    : 'border-emerald-500/25 hover:border-emerald-500/60 hover:shadow-[0_0_35px_rgba(16,185,129,0.2)]'
                }`}
              >
                {/* Pet Image with overlay badges */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                  <Image
                    src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                    alt={pet.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 flex flex-col space-y-1.5">
                    {isMissing ? (
                      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg shadow-rose-950">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>MISSING</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SAFE AT HOME</span>
                      </span>
                    )}

                    {pet.medicalUrgent && isMissing && (
                      <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase font-mono shadow">
                        <HeartPulse className="w-3 h-3" />
                        <span>URGENT MEDS</span>
                      </span>
                    )}
                  </div>

                  {/* Species Tag & City */}
                  <div className="absolute top-4 right-4 flex flex-col items-end space-y-1.5">
                    <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs font-bold backdrop-blur-md">
                      {pet.species === 'dog' ? '🐕 Dog' : pet.species === 'cat' ? '🐈 Cat' : '🐾 Other'}
                    </div>
                    {pet.city && (
                      <div className="px-2 py-0.5 rounded-lg bg-black/75 text-[11px] font-mono text-slate-300">
                        {pet.city}
                      </div>
                    )}
                  </div>

                  {/* Escrow Bounty Badge (Floating over image bottom) */}
                  {isMissing && pet.bountySol > 0 && (
                    <div className="absolute bottom-3 right-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center space-x-1.5 font-mono">
                      <Coins className="w-4 h-4 text-slate-950 fill-current" />
                      <span className="text-xs font-black uppercase">Reward:</span>
                      <span className="text-lg font-black">{pet.bountySol} SOL</span>
                    </div>
                  )}
                </div>

                {/* Pet Body Info */}
                <div className="p-5 sm:p-6 space-y-4">
                  
                  {/* Name and Breed */}
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                      {pet.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      {pet.breed} • {pet.color}
                    </p>
                  </div>

                  {/* Distinctive Features */}
                  {pet.distinctiveFeatures && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/70 p-3 rounded-2xl border border-white/5">
                      {pet.distinctiveFeatures}
                    </p>
                  )}

                  {/* Location & Time Info */}
                  {pet.lastSeenLocation && (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span className="truncate">{pet.lastSeenLocation}</span>
                      </div>
                      {pet.timeElapsed && (
                        <div className="flex items-center space-x-1.5 text-slate-400 pl-5 text-[11px] font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Missing for {pet.timeElapsed}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Microchip & PDA Metadata snippet */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500">Pet PDA:</span>
                    <a
                      href={getExplorerAddressUrl(pet.pdaAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center space-x-1 font-semibold"
                    >
                      <span>{shortenAddress(pet.pdaAddress, 4)}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Pending Claim Notice if any */}
                  {pet.claims && pet.claims.length > 0 && (
                    <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between">
                      <span className="font-bold">
                        🎯 {pet.claims.length} Recovery Sighting{pet.claims.length > 1 ? 's' : ''} submitted
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Awaiting Settlement</span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center space-x-2">
                    {isMissing ? (
                      <button
                        onClick={() => {
                          onOpenClaimModal(pet);
                          playSound('click');
                        }}
                        className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-950 hover:brightness-110 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Flame className="w-4 h-4 fill-current" />
                        <span>I Found {pet.name}</span>
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                        Identity Active on Devnet
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onOpenQrModal(pet);
                        playSound('click');
                      }}
                      title="View Solana Collar Tag QR"
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 transition-all shadow cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
