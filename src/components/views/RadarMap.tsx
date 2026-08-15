'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Radio, Crosshair, MapPin, Coins, Flame, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0a1122] to-[#060a14] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
      
      {/* Top Header of Radar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-20">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>LIVE GPS & ESCROW RADAR SWEEP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <span>Missing Pets Telemetry Matrix</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
              {filteredMissing.length} Active Targets
            </span>
          </h3>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 text-xs">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => {
                setSelectedCity(city);
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all ${
                selectedCity === city
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {city === 'all' ? 'All Hubs' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Radar Screen Canvas */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-[#040812] border border-cyan-500/20 overflow-hidden flex items-center justify-center">
        
        {/* Radar Concentric Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="w-[120px] h-[120px] rounded-full border border-cyan-400 border-dashed" />
          <div className="w-[240px] h-[240px] rounded-full border border-cyan-400" />
          <div className="w-[360px] h-[360px] rounded-full border border-cyan-400 border-dashed" />
          <div className="w-[480px] h-[480px] rounded-full border border-cyan-400 opacity-50" />
          {/* Axis crosshair lines */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
        </div>

        {/* Animated Sweep Line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent animate-spin [animation-duration:8s]" />
        </div>

        {/* Coordinates Grid Labels */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-500/60 pointer-events-none flex items-center space-x-1">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>GRID SEC: LAT 37.7749° N, LNG 122.4194° W</span>
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
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
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-60"></span>
                <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-xs border-2 border-white shadow-[0_0_20px_rgba(244,63,94,0.8)] group-hover:scale-125 transition-transform">
                  {pet.species === 'dog' ? '🐕' : '🐈'}
                </div>
              </div>

              {/* Ping Tooltip Badge */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-9 w-48 p-3 rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl space-y-1.5 transition-all duration-200 pointer-events-auto ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{pet.name}</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                    {pet.bountySol} SOL
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">
                  📍 {pet.lastSeenLocation}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClaim(pet);
                    playSound('click');
                  }}
                  className="w-full py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] shadow"
                >
                  I Found {pet.name}
                </button>
              </div>
            </div>
          );
        })}

      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any target beacon on the radar to inspect on-chain PDA bounty details.</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400">● 100% Non-Custodial</span>
          <span className="text-amber-400">● Smart Escrow Locked</span>
        </div>
      </div>

    </div>
  );
};
