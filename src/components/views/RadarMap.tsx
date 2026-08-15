'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Radio, Crosshair, MapPin, Coins, Flame, ShieldAlert, Sparkles, Navigation, PawPrint } from 'lucide-react';
import { PetRecord } from '@/types';
import { playSound } from '@/lib/sound';

interface RadarMapProps {
  pets: PetRecord[];
  onSelectPet: (pet: PetRecord) => void;
  onOpenClaim: (pet: PetRecord) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({ pets, onSelectPet, onOpenClaim }) => {
  const [activeHoverPet, setActiveHoverPet] = useState<PetRecord | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const missingPets = pets.filter((p) => p.status === 'missing');
  const filteredMissing = missingPets.filter(
    (p) => selectedCity === 'all' || (p.city || '').includes(selectedCity)
  );

  const cities = ['all', 'San Francisco', 'Los Angeles', 'Austin', 'Seattle', 'New York'];

  return (
    <div className="card p-6 sm:p-8 space-y-6">
      
      {/* Top Header of Radar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div>
          <p className="label-eyebrow mb-2">GPS & Escrow Radar Matrix</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span>Missing Pets Telemetry</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6] font-mono">
              {filteredMissing.length} Active Alerts
            </span>
          </h3>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#080c14]/80 border border-white/[0.07] text-xs"
             style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => {
                setSelectedCity(city);
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                selectedCity === city
                  ? 'bg-[#2ec4b6] text-[#080c14]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {city === 'all' ? 'All Hubs' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Radar Screen Canvas */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-[#080c14] border border-white/[0.08] overflow-hidden flex items-center justify-center">
        
        {/* Radar Concentric Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="w-[120px] h-[120px] rounded-full border border-[#2ec4b6] border-dashed" />
          <div className="w-[240px] h-[240px] rounded-full border border-[#2ec4b6]" />
          <div className="w-[360px] h-[360px] rounded-full border border-[#2ec4b6] border-dashed" />
          <div className="w-[480px] h-[480px] rounded-full border border-[#2ec4b6] opacity-40" />
          {/* Axis crosshair lines */}
          <div className="absolute w-full h-[1px] bg-[#2ec4b6]/20" />
          <div className="absolute h-full w-[1px] bg-[#2ec4b6]/20" />
        </div>

        {/* Animated Sweep Line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-transparent via-[#2ec4b6]/10 to-transparent animate-spin [animation-duration:10s]" />
        </div>

        {/* Coordinates Grid Labels */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-500 pointer-events-none flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-[#2ec4b6]" />
          <span>GRID: LAT 37.7749° N, LNG 122.4194° W</span>
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-600 pointer-events-none">
          SOLANA DEVNET CLUSTER • ESCROW ACTIVE
        </div>

        {/* Pet Ping Nodes */}
        {filteredMissing.map((pet) => {
          const x = pet.coordinates?.x ?? 50;
          const y = pet.coordinates?.y ?? 50;
          const isHovered = activeHoverPet?.id === pet.id;

          return (
            <div
              key={pet.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => {
                setActiveHoverPet(pet);
                playSound('radar');
              }}
              onMouseLeave={() => setActiveHoverPet(null)}
              onClick={() => {
                onSelectPet(pet);
                playSound('click');
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
            >
              {/* Pulsating Ping Wave */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-red-500 opacity-60"></span>
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white font-bold text-[10px] border border-white shadow-lg group-hover:scale-125 transition-transform">
                  <PawPrint className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Ping Tooltip Badge */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-9 w-48 p-3 rounded-xl bg-[#0d1526] border border-white/[0.1] backdrop-blur-xl shadow-2xl space-y-1.5 transition-all duration-200 pointer-events-auto ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {pet.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#f4a261] bg-[#f4a261]/15 px-1.5 py-0.5 rounded-md">
                    {pet.bountySol} SOL
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-300 truncate">
                  <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="truncate">{pet.lastSeenLocation}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClaim(pet);
                    playSound('click');
                  }}
                  className="btn-danger w-full py-1 text-[10px] rounded-lg"
                >
                  I Found {pet.name}
                </button>
              </div>
            </div>
          );
        })}

      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-[#2ec4b6]" />
          <span>Click any target beacon on the radar to inspect on-chain PDA bounty details.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">● 100% Non-Custodial</span>
          <span className="text-[#f4a261]">● Smart Escrow Locked</span>
        </div>
      </div>

    </div>
  );
};
