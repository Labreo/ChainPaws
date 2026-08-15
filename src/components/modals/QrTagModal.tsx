'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { PetRecord } from '@/types';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/solana/pda';

interface QrTagModalProps {
  pet: PetRecord | null;
  onClose: () => void;
}

export const QrTagModal: React.FC<QrTagModalProps> = ({ pet, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!pet) return null;

  const petProfileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pet=${pet.id}`
    : `https://chainpaws.io/?pet=${pet.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:bg-white print:p-0">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,243,255,0.25)] overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none print:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 print:mb-4">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2 print:text-black print:border-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SOLANA IMMUTABLE COLLAR TAG</span>
          </div>
          <h3 className="text-2xl font-black text-white print:text-black">
            {pet.name}
          </h3>
          <p className="text-xs text-slate-400 print:text-gray-600">
            {pet.breed} • {pet.species.toUpperCase()}
          </p>
        </div>

        {/* Printable Card Area */}
        <div
          ref={printRef}
          className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#080c14] border border-white/10 text-center space-y-4 print:bg-white print:border-2 print:border-black print:text-black"
        >
          {/* QR Code */}
          <div className="inline-block p-4 rounded-2xl bg-white shadow-lg">
            <QRCodeSVG
              value={petProfileUrl}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#080c14"
              bgColor="#ffffff"
            />
          </div>

          <p className="text-xs text-cyan-300 font-medium print:text-black">
            Scan to view On-Chain Identity & Escrow Bounty
          </p>

          <div className="space-y-1 text-left p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono print:bg-gray-100 print:border-gray-300">
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-gray-600">Microchip Hash:</span>
              <span className="text-slate-300 font-semibold print:text-black">
                {pet.chipHash ? `${pet.chipHash.slice(0, 10)}...${pet.chipHash.slice(-8)}` : 'On-Chain Verified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-gray-600">Pet Record PDA:</span>
              <span className="text-cyan-400 font-semibold print:text-black">
                {shortenAddress(pet.pdaAddress, 5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-gray-600">Owner Key:</span>
              <span className="text-slate-300 print:text-black">
                {shortenAddress(pet.ownerAddress, 5)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center space-x-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Collar Tag</span>
          </button>
          
          <a
            href={getExplorerAddressUrl(pet.pdaAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
