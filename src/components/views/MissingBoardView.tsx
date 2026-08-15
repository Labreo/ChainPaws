'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Clock,
  ChevronDown,
  ExternalLink,
  SlidersHorizontal,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { PetRecord } from '@/types';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/solana/pda';
import { RadarMap } from './RadarMap';
import { playSound } from '@/lib/sound';

interface MissingBoardViewProps {
  pets: PetRecord[];
  onOpenClaimModal: (pet: PetRecord) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  onNavigateRegister: () => void;
}

export const MissingBoardView: React.FC<MissingBoardViewProps> = ({
  pets,
  onOpenClaimModal,
  onOpenQrModal,
  onNavigateRegister,
}) => {
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'dog' | 'cat'>('all');
  const [statusFilter, setStatusFilter] = useState<'missing_only' | 'all'>('missing_only');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'bounty_desc' | 'recent'>('bounty_desc');
  const [showRadar, setShowRadar] = useState(true);
  const [highBountyOnly, setHighBountyOnly] = useState(false);
  const [medicalUrgentOnly, setMedicalUrgentOnly] = useState(false);

  const filteredPets = useMemo(() => {
    return pets
      .filter((pet) => {
        if (statusFilter === 'missing_only' && pet.status !== 'missing') return false;
        if (speciesFilter !== 'all' && pet.species !== speciesFilter) return false;
        if (highBountyOnly && (pet.bountySol || 0) < 1.0) return false;
        if (medicalUrgentOnly && !pet.medicalUrgent) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            pet.name.toLowerCase().includes(q) ||
            pet.breed.toLowerCase().includes(q) ||
            (pet.lastSeenLocation || '').toLowerCase().includes(q) ||
            pet.microchipId.toLowerCase().includes(q) ||
            (pet.city || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) =>
        sortBy === 'bounty_desc'
          ? (b.bountySol || 0) - (a.bountySol || 0)
          : b.createdAt - a.createdAt
      );
  }, [pets, speciesFilter, statusFilter, highBountyOnly, medicalUrgentOnly, searchQuery, sortBy]);

  const missingCount = pets.filter((p) => p.status === 'missing').length;
  const totalBounty = pets
    .filter((p) => p.status === 'missing')
    .reduce((sum, p) => sum + (p.bountySol || 0), 0);

  return (
    <div className="space-y-10">

      {/* ── Hero / Protocol Banner ── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1526]">
        {/* Subtle teal orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2ec4b6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-8 sm:px-12 py-12 sm:py-16 max-w-3xl">
          <p className="label-eyebrow mb-4">Live Solana Escrow Radar</p>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-900 text-white tracking-tight leading-[1.05] mb-5"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}>
            Stop Lost Pet Scams with{' '}
            <span className="text-gradient-teal">Trustless Bounties</span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl">
            Owners lock SOL rewards into on-chain Escrow PDAs.
            Finders receive guaranteed payouts upon verified microchip identity match.
            No middlemen. No scams.
          </p>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Alerts', value: missingCount, color: 'text-red-400' },
              { label: 'Locked Bounty', value: `${totalBounty.toFixed(2)} SOL`, color: 'text-[#f4a261]' },
              { label: 'Protected PDAs', value: pets.length, color: 'text-[#2ec4b6]' },
              { label: 'Recovery Rate', value: '100%', color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className={`stat-value text-2xl ${color}`}>{value}</div>
                <div className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { onNavigateRegister(); playSound('click'); }}
              className="btn-primary"
            >
              Register a Pet
            </button>
            <button
              onClick={() => { setShowRadar(!showRadar); playSound('click'); }}
              className="btn-ghost"
            >
              {showRadar ? 'Hide Radar Map' : 'Show Radar Map'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Radar Map ── */}
      {showRadar && (
        <RadarMap
          pets={pets}
          onSelectPet={(pet) => { onOpenQrModal(pet); playSound('click'); }}
          onOpenClaim={(pet) => { onOpenClaimModal(pet); playSound('click'); }}
        />
      )}

      {/* ── Filter Toolbar ── */}
      <div className="card-flat p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, breed, city, or microchip ID..."
              className="input-field pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Species */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {(['all', 'dog', 'cat'] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => { setSpeciesFilter(sp); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-all ${
                    speciesFilter === sp
                      ? 'bg-[#2ec4b6] text-[#080c14]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sp === 'all' ? 'All' : sp === 'dog' ? 'Dogs' : 'Cats'}
                </button>
              ))}
            </div>

            {/* Filters */}
            <button
              onClick={() => { setHighBountyOnly(!highBountyOnly); playSound('click'); }}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                highBountyOnly
                  ? 'bg-[#f4a261] text-[#080c14] border-[#f4a261]'
                  : 'border-white/[0.07] text-slate-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Above 1.0 SOL
            </button>

            <button
              onClick={() => { setMedicalUrgentOnly(!medicalUrgentOnly); playSound('click'); }}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                medicalUrgentOnly
                  ? 'bg-red-600 text-white border-red-500'
                  : 'border-white/[0.07] text-slate-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Medical Urgent
            </button>

            {/* Status */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <button
                onClick={() => { setStatusFilter('missing_only'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  statusFilter === 'missing_only' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Missing
              </button>
              <button
                onClick={() => { setStatusFilter('all'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Sort */}
            <button
              onClick={() => { setSortBy(sortBy === 'bounty_desc' ? 'recent' : 'bounty_desc'); playSound('click'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] text-xs text-slate-400 hover:text-white font-semibold transition-all"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{sortBy === 'bounty_desc' ? 'Highest Reward' : 'Most Recent'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* ── Pet Grid ── */}
      {filteredPets.length === 0 ? (
        <div className="text-center py-20 card-flat space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-lg font-semibold text-white font-display"
             style={{ fontFamily: 'Montserrat, sans-serif' }}>No pets match your filters</p>
          <p className="text-sm text-slate-500">Try clearing your search or adjusting the filter options above.</p>
          <button
            onClick={() => { setSpeciesFilter('all'); setStatusFilter('missing_only'); setHighBountyOnly(false); setMedicalUrgentOnly(false); setSearchQuery(''); }}
            className="btn-ghost text-xs mx-auto"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => {
            const isMissing = pet.status === 'missing';
            return (
              <article
                key={pet.id}
                className={`card overflow-hidden ${isMissing ? 'hover:border-red-500/30' : 'hover:border-[#2ec4b6]/25'}`}
              >
                {/* Image */}
                <div className="relative h-56 bg-[#0d1526] overflow-hidden">
                  <Image
                    src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                    alt={`Photo of ${pet.name}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/20 to-transparent" />

                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isMissing ? (
                      <div className="badge-missing">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        Missing
                      </div>
                    ) : (
                      <div className="badge-safe">
                        <CheckCircle2 className="w-3 h-3" />
                        Safe
                      </div>
                    )}
                    {pet.medicalUrgent && isMissing && (
                      <div className="badge-urgent">Medical Urgent</div>
                    )}
                  </div>

                  {/* Species + city */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className="px-2 py-1 rounded-md bg-[#080c14]/80 text-[11px] font-semibold text-slate-300 border border-white/[0.08]"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {pet.species === 'dog' ? 'Dog' : pet.species === 'cat' ? 'Cat' : 'Other'}
                    </span>
                    {pet.city && (
                      <span className="px-2 py-0.5 rounded-md bg-[#080c14]/70 text-[10px] text-slate-400">
                        {pet.city}
                      </span>
                    )}
                  </div>

                  {/* Bounty */}
                  {isMissing && pet.bountySol > 0 && (
                    <div className="badge-bounty absolute bottom-3 right-3">
                      Reward: {pet.bountySol} SOL
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {pet.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{pet.breed} — {pet.color}</p>
                  </div>

                  {pet.distinctiveFeatures && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {pet.distinctiveFeatures}
                    </p>
                  )}

                  {pet.lastSeenLocation && (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="truncate">{pet.lastSeenLocation}</span>
                      </div>
                      {pet.timeElapsed && (
                        <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span>Missing {pet.timeElapsed}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Claim notice */}
                  {pet.claims && pet.claims.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#2ec4b6]/8 border border-[#2ec4b6]/20 text-[11px]">
                      <span className="text-[#2ec4b6] font-semibold"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {pet.claims.length} recovery sighting{pet.claims.length > 1 ? 's' : ''} submitted
                      </span>
                      <span className="text-slate-500">Pending</span>
                    </div>
                  )}

                  {/* PDA link */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[11px] font-mono text-slate-500">
                    <span>Pet PDA</span>
                    <a
                      href={getExplorerAddressUrl(pet.pdaAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2ec4b6] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {shortenAddress(pet.pdaAddress, 5)}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isMissing ? (
                      <button
                        onClick={() => { onOpenClaimModal(pet); playSound('click'); }}
                        className="btn-danger flex-1 text-xs py-2.5"
                      >
                        I Found {pet.name}
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-500/25 text-emerald-400 text-xs font-semibold text-center"
                           style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Active Identity
                      </div>
                    )}
                    <button
                      onClick={() => { onOpenQrModal(pet); playSound('click'); }}
                      title="View collar tag QR"
                      className="btn-ghost p-2.5 rounded-xl"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
