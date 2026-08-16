'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PetRecord } from '@/types';
import { playSound } from '@/lib/sound';
import { Compass, ZoomIn, ZoomOut, CheckCircle2, Radio, Filter } from 'lucide-react';

interface PetDiscoveryMapProps {
  pets: PetRecord[];
  onSelectPet: (pet: PetRecord) => void;
  onOpenClaim: (pet: PetRecord) => void;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  all: { lat: 39.8283, lng: -98.5795, zoom: 4, name: 'National Overview' },
  'San Francisco': { lat: 37.7749, lng: -122.4194, zoom: 13, name: 'San Francisco, CA' },
  'Los Angeles': { lat: 34.0195, lng: -118.4912, zoom: 12, name: 'Los Angeles, CA' },
  Austin: { lat: 30.2672, lng: -97.7431, zoom: 13, name: 'Austin, TX' },
  Seattle: { lat: 47.6062, lng: -122.3321, zoom: 13, name: 'Seattle, WA' },
  'New York': { lat: 40.7829, lng: -73.9654, zoom: 13, name: 'New York, NY' },
  Chicago: { lat: 41.8781, lng: -87.6298, zoom: 13, name: 'Chicago, IL' },
  Miami: { lat: 25.7617, lng: -80.1918, zoom: 13, name: 'Miami, FL' },
};

export const PetDiscoveryMap: React.FC<PetDiscoveryMapProps> = ({
  pets,
  onSelectPet,
  onOpenClaim,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [selectedCity, setSelectedCity] = useState<string>('San Francisco');
  const [mapStyle, setMapStyle] = useState<'carto_voyager' | 'carto_dark' | 'osm'>('carto_voyager');
  const [mapSpeciesFilter, setMapSpeciesFilter] = useState<'all' | 'dog' | 'cat'>('all');

  const missingPets = pets.filter((p) => {
    if (p.status !== 'missing' || !p.lat || !p.lng) return false;
    if (mapSpeciesFilter !== 'all' && p.species !== mapSpeciesFilter) return false;
    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    async function initMap() {
      const L = await import('leaflet');

      if (!mapContainerRef.current || !isMounted) return;

      // Clean up previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter = CITY_COORDINATES[selectedCity] || CITY_COORDINATES['San Francisco'];

      const map = L.map(mapContainerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialCenter.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Tile URLs
      const tileUrls = {
        carto_voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        carto_dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      };

      L.tileLayer(tileUrls[mapStyle], {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap contributors, CARTO' }).addTo(map);

      mapInstanceRef.current = map;
      renderMarkers(L, map);

      // Invalidate size after layout
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapStyle]);

  // Dynamically re-render markers whenever pets or filters change
  useEffect(() => {
    if (mapInstanceRef.current && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (mapInstanceRef.current) {
          renderMarkers(L, mapInstanceRef.current);
        }
      });
    }
  }, [pets, mapSpeciesFilter]);

  // Render Pet Markers on Map
  const renderMarkers = (L: any, map: any) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    missingPets.forEach((pet) => {
      if (!pet.lat || !pet.lng) return;

      const fallbackImg = pet.species === 'cat'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
      const imgSrc = pet.imageUrl || fallbackImg;

      // Custom HTML Marker Pin with active radar pulse
      const customIcon = L.divIcon({
        className: 'pet-pin-marker',
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -28],
        html: `
          <div class="pet-pin-bubble ${pet.medicalUrgent ? 'pulse-urgent' : ''}">
            <img src="${imgSrc}" alt="${pet.name}" onerror="this.src='${fallbackImg}'" style="width:100%;height:100%;object-fit:cover;" />
            ${pet.bountySol > 0 ? `<div class="pet-pin-badge">${pet.bountySol} SOL</div>` : ''}
          </div>
        `,
      });

      const marker = L.marker([pet.lat, pet.lng], { icon: customIcon }).addTo(map);

      // Interactive Popup Content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-4 max-w-[280px] space-y-3';
      popupContent.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${imgSrc}" alt="${pet.name}" onerror="this.src='${fallbackImg}'" style="width:48px;height:48px;border-radius:0.75rem;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.15);" />
          <div>
            <div style="font-family:Montserrat,sans-serif;font-weight:800;font-size:1rem;color:#fff;line-height:1.2;">
              ${pet.name}
            </div>
            <div style="font-size:0.75rem;color:#94a3b8;font-weight:500;">
              ${pet.breed}
            </div>
            ${pet.medicalUrgent ? `<span style="display:inline-block;font-size:0.6rem;font-weight:700;background:rgba(239,68,68,0.9);color:#fff;padding:1px 6px;border-radius:4px;margin-top:2px;font-family:Montserrat,sans-serif;text-transform:uppercase;">Medical Urgent</span>` : ''}
          </div>
        </div>
        
        <div style="font-size:0.75rem;color:#cbd5e1;line-height:1.4;">
          <div style="display:flex;align-items:center;gap:4px;color:#f1f5f9;">
            <strong style="color:#2ec4b6;">Location:</strong> ${pet.lastSeenLocation || pet.city || 'Nearby'}
          </div>
          <div style="color:#64748b;font-size:0.7rem;margin-top:2px;">
            Missing ${pet.timeElapsed || 'Recently'}
          </div>
        </div>

        ${pet.bountySol > 0 ? `
          <div style="background:rgba(244,162,97,0.15);border:1px solid rgba(244,162,97,0.3);padding:6px 10px;border-radius:0.625rem;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-family:Montserrat,sans-serif;font-size:0.7rem;font-weight:700;color:#f4a261;text-transform:uppercase;">Escrow Reward:</span>
            <span style="font-family:Montserrat,sans-serif;font-size:0.9rem;font-weight:900;color:#f4a261;">${pet.bountySol} SOL</span>
          </div>
        ` : ''}

        <div style="display:flex;gap:6px;padding-top:4px;">
          <button id="popup-claim-${pet.id}" style="flex:1;padding:8px 12px;background:#dc2626;color:#fff;font-family:Montserrat,sans-serif;font-size:0.75rem;font-weight:700;text-transform:uppercase;border-radius:0.5rem;border:none;cursor:pointer;">
            I Found ${pet.name}
          </button>
          <button id="popup-qr-${pet.id}" style="padding:8px 10px;background:rgba(255,255,255,0.06);color:#f1f5f9;border:1px solid rgba(255,255,255,0.12);font-family:Montserrat,sans-serif;font-size:0.75rem;font-weight:600;border-radius:0.5rem;cursor:pointer;">
            Collar Tag
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('popupopen', () => {
        playSound('click');
        const claimBtn = document.getElementById(`popup-claim-${pet.id}`);
        if (claimBtn) {
          claimBtn.onclick = () => {
            onOpenClaim(pet);
            playSound('click');
          };
        }
        const qrBtn = document.getElementById(`popup-qr-${pet.id}`);
        if (qrBtn) {
          qrBtn.onclick = () => {
            onSelectPet(pet);
            playSound('click');
          };
        }
      });

      markersRef.current.push(marker);
    });
  };

  // Fly map to city
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    playSound('click');
    if (!mapInstanceRef.current) return;

    const target = CITY_COORDINATES[cityName];
    if (target) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
      playSound('click');
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
      playSound('click');
    }
  };

  const cities = ['all', 'San Francisco', 'Los Angeles', 'Austin', 'Seattle', 'New York', 'Chicago', 'Miami'];

  return (
    <div className="card p-5 sm:p-7 space-y-5" style={{ position: 'relative', zIndex: 1 }}>

      {/* Map Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="label-eyebrow mb-0">Live Missing Pet Discovery Radar</p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span>Real-Time Recovery Map</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6] font-mono font-bold">
              {missingPets.length} Live Active Pins
            </span>
          </h3>
        </div>

        {/* Filters and City Selector */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Quick Species Filter */}
          <div className="flex items-center p-1 rounded-xl bg-[#080c14] border border-white/[0.08] text-xs"
               style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {(['all', 'dog', 'cat'] as const).map((sp) => (
              <button
                key={sp}
                onClick={() => { setMapSpeciesFilter(sp); playSound('click'); }}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  mapSpeciesFilter === sp
                    ? 'bg-[#2ec4b6] text-[#080c14] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sp === 'all' ? 'All' : sp === 'dog' ? 'Dogs' : 'Cats'}
              </button>
            ))}
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#080c14] border border-white/[0.08] text-xs"
               style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  selectedCity === city
                    ? 'bg-[#2ec4b6] text-[#080c14] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {city === 'all' ? 'US Overview' : city}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Real Map Canvas */}
      <div
        className="map-isolation-container relative w-full h-[420px] sm:h-[480px] border border-white/[0.1] shadow-2xl"
        style={{ isolation: 'isolate', position: 'relative', zIndex: 1, overflow: 'hidden' }}
      >
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full" style={{ position: 'relative', zIndex: 1 }} />

        {/* Floating Custom Zoom Controls */}
        <div className="absolute top-4 right-4 z-[10] flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl bg-[#0d1526]/95 hover:bg-[#0d1526] text-white border border-white/[0.15] flex items-center justify-center shadow-lg transition-colors backdrop-blur-md"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl bg-[#0d1526]/95 hover:bg-[#0d1526] text-white border border-white/[0.15] flex items-center justify-center shadow-lg transition-colors backdrop-blur-md"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Map Style Switcher */}
        <div className="absolute bottom-4 left-4 z-[10] flex items-center gap-1 p-1 rounded-xl bg-[#0d1526]/95 border border-white/[0.15] text-xs font-mono backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setMapStyle('carto_voyager')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === 'carto_voyager' ? 'bg-[#2ec4b6] text-[#080c14] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Street Map
          </button>
          <button
            onClick={() => setMapStyle('carto_dark')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === 'carto_dark' ? 'bg-[#2ec4b6] text-[#080c14] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Mode
          </button>
        </div>

      </div>

      {/* Footer Info Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2 font-medium">
          <Compass className="w-4 h-4 text-[#2ec4b6]" />
          <span>Click any marker to view location details, verify microchip ID, and submit an instant recovery claim.</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            OpenStreetMap Verified Tiles
          </span>
          <span className="text-[#f4a261]">Solana Escrow Protected</span>
        </div>
      </div>

    </div>
  );
};
