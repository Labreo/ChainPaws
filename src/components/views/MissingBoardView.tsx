'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  QrCode,
  CheckCircle2,
  Map as MapIcon,
  ShieldCheck,
} from 'lucide-react';
import { PetRecord } from '@/types';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/solana/pda';
import { playSound } from '@/lib/sound';

// Dynamic import for Leaflet OpenStreetMap (SSR disabled for Leaflet window context)
const PetDiscoveryMap = dynamic(
  () => import('./PetDiscoveryMap').then((mod) => mod.PetDiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="card h-[400px] sm:h-[450px] flex items-center justify-center text-slate-500 font-mono text-xs">
        <span>Loading OpenStreetMap Telemetry Engine...</span>
      </div>
    ),
  }
);

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
  const [showMap, setShowMap] = useState(true);
  const [highBountyOnly, setHighBountyOnly] = useState(false);
  const [medicalUrgentOnly, setMedicalUrgentOnly] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fallbackPetImages: Record<string, string> = {
    dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    other: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80',
  };

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
    <div className="space-y-8">

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1526] p-8 sm:p-12 lg:p-14">
        {/* Ambient Subtle Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-[#2ec4b6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <p className="label-eyebrow">Solana Escrow Pet Recovery Network</p>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Protecting Pets with{' '}
            <span className="text-gradient-teal">Trustless Bounties</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Owners deposit recovery rewards into secure Solana escrow accounts. Finders receive guaranteed payouts upon verified microchip identification.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            {[
              { label: 'Active Alerts', value: missingCount, color: 'text-red-400' },
              { label: 'Escrow Vault', value: `${totalBounty.toFixed(2)} SOL`, color: 'text-[#f4a261]' },
              { label: 'Protected Pets', value: pets.length, color: 'text-[#2ec4b6]' },
              { label: 'Recovery Rate', value: '100%', color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className={`stat-value text-2xl sm:text-3xl ${color}`}>{value}</div>
                <div className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => { onNavigateRegister(); playSound('click'); }}
              className="btn-primary py-3 px-6 text-xs"
            >
              Register a Companion
            </button>
            <button
              onClick={() => { setShowMap(!showMap); playSound('click'); }}
              className="btn-ghost py-3 px-6 text-xs flex items-center gap-2"
            >
              <MapIcon className="w-4 h-4 text-[#2ec4b6]" />
              <span>{showMap ? 'Hide Map View' : 'Show OpenStreetMap View'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Real OpenStreetMap Interactive Discovery Map ── */}
      {showMap && (
        <PetDiscoveryMap
          pets={pets}
          onSelectPet={(pet) => { onOpenQrModal(pet); playSound('click'); }}
          onOpenClaim={(pet) => { onOpenClaimModal(pet); playSound('click'); }}
        />
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div className="card-flat p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pet name, breed, or city (e.g. San Francisco, Venice, Austin)..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Species Select */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {(['all', 'dog', 'cat'] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => { setSpeciesFilter(sp); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    speciesFilter === sp
                      ? 'bg-[#2ec4b6] text-[#080c14]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sp === 'all' ? 'All Pets' : sp === 'dog' ? 'Dogs Only' : 'Cats Only'}
                </button>
              ))}
            </div>

            {/* High Bounty Filter */}
            <button
              onClick={() => { setHighBountyOnly(!highBountyOnly); playSound('click'); }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                highBountyOnly
                  ? 'bg-[#f4a261] text-[#080c14] border-[#f4a261]'
                  : 'border-white/[0.07] text-slate-400 hover:text-white bg-white/[0.02]'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Above 1.0 SOL
            </button>

            {/* Medical Urgent */}
            <button
              onClick={() => { setMedicalUrgentOnly(!medicalUrgentOnly); playSound('click'); }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                medicalUrgentOnly
                  ? 'bg-red-600 text-white border-red-500'
                  : 'border-white/[0.07] text-slate-400 hover:text-white bg-white/[0.02]'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Medical Urgent
            </button>

            {/* Status */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <button
                onClick={() => { setStatusFilter('missing_only'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === 'missing_only' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Missing
              </button>
              <button
                onClick={() => { setStatusFilter('all'); playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Sort */}
            <button
              onClick={() => { setSortBy(sortBy === 'bounty_desc' ? 'recent' : 'bounty_desc'); playSound('click'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.07] text-xs text-slate-400 hover:text-white font-semibold transition-all bg-white/[0.02]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{sortBy === 'bounty_desc' ? 'Highest Reward' : 'Most Recent'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* ── Pet Grid Listing ── */}
      {filteredPets.length === 0 ? (
        <div className="text-center py-20 card-flat space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-lg font-bold text-white font-display"
             style={{ fontFamily: 'Montserrat, sans-serif' }}>No companions match your search filters</p>
          <p className="text-sm text-slate-400">Try clearing the search box or adjusting the filter options above.</p>
          <button
            onClick={() => {
              setSpeciesFilter('all');
              setStatusFilter('missing_only');
              setHighBountyOnly(false);
              setMedicalUrgentOnly(false);
              setSearchQuery('');
            }}
            className="btn-ghost text-xs mx-auto"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => {
            const isMissing = pet.status === 'missing';
            const petImageSrc = failedImages[pet.id]
              ? fallbackPetImages[pet.species] || fallbackPetImages.dog
              : pet.imageUrl || fallbackPetImages[pet.species] || fallbackPetImages.dog;

            return (
              <article
                key={pet.id}
                className={`card overflow-hidden group flex flex-col justify-between ${
                  isMissing ? 'hover:border-red-500/40' : 'hover:border-[#2ec4b6]/40'
                }`}
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative h-60 bg-[#080c14] overflow-hidden">
                    <Image
                      src={petImageSrc}
                      alt={pet.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [pet.id]: true }));
                      }}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1526] via-[#0d1526]/20 to-transparent" />

                    {/* Status badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                      {isMissing ? (
                        <div className="badge-missing shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          Missing Alert
                        </div>
                      ) : (
                        <div className="badge-safe shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Safe at Home
                        </div>
                      )}
                      {pet.medicalUrgent && isMissing && (
                        <div className="badge-urgent shadow-md">Medical Urgent</div>
                      )}
                    </div>

                    {/* Species + City */}
                    <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-lg bg-[#080c14]/85 text-[11px] font-bold text-slate-200 border border-white/[0.1] backdrop-blur-md"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {pet.species === 'dog' ? 'Dog' : pet.species === 'cat' ? 'Cat' : 'Other'}
                      </span>
                      {pet.city && (
                        <span className="px-2 py-0.5 rounded-md bg-[#080c14]/80 text-[10px] text-slate-300 backdrop-blur-md">
                          {pet.city}
                        </span>
                      )}
                    </div>

                    {/* Escrow Bounty Badge */}
                    {isMissing && pet.bountySol > 0 && (
                      <div className="badge-bounty absolute bottom-3.5 right-3.5 shadow-lg">
                        Reward: {pet.bountySol} SOL
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3.5">
                    <div>
                      <h3 className="text-2xl font-bold text-white leading-tight"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {pet.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{pet.breed} — {pet.color}</p>
                    </div>

                    {pet.distinctiveFeatures && (
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {pet.distinctiveFeatures}
                      </p>
                    )}

                    {pet.lastSeenLocation && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span className="truncate">{pet.lastSeenLocation}</span>
                        </div>
                        {pet.timeElapsed && (
                          <div className="flex items-center gap-1.5 text-slate-500 pl-5 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>Missing {pet.timeElapsed}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Microchip Identification */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">
                        Tag: <span className="text-[#2ec4b6] font-semibold">{pet.microchipId}</span>
                      </span>
                      <a
                        href={getExplorerAddressUrl(pet.pdaAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#2ec4b6] flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Solana Record</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-6 pb-6 pt-1 flex items-center gap-2.5">
                  {isMissing ? (
                    <button
                      onClick={() => { onOpenClaimModal(pet); playSound('click'); }}
                      className="btn-danger flex-1 text-xs py-2.5 shadow-md"
                    >
                      I Found {pet.name}
                    </button>
                  ) : (
                    <div className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-semibold text-center"
                         style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Safe at Home
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
