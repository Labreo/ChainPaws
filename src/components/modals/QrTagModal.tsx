'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShieldCheck, ExternalLink } from 'lucide-react';
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
      <div className="relative w-full max-w-md rounded-2xl bg-[#0d1526] border border-white/[0.1] p-6 sm:p-8 shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 print:mb-4">
          <p className="label-eyebrow justify-center mb-2 print:text-black">
            Solana Immutable Collar Tag
          </p>
          <h3 className="text-2xl font-bold text-white print:text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {pet.name}
          </h3>
          <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
            {pet.breed} — {pet.species.toUpperCase()}
          </p>
        </div>

        {/* Printable Card Area */}
        <div
          ref={printRef}
          className="p-6 rounded-xl bg-[#080c14] border border-white/[0.08] text-center space-y-4 print:bg-white print:border-2 print:border-black print:text-black"
        >
          {/* QR Code */}
          <div className="inline-block p-4 rounded-xl bg-white shadow-md">
            <QRCodeSVG
              value={petProfileUrl}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#080c14"
              bgColor="#ffffff"
            />
          </div>

          <p className="text-xs text-[#2ec4b6] font-semibold print:text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Scan to view On-Chain Identity & Escrow Bounty
          </p>

          <div className="space-y-1.5 text-left p-3.5 rounded-lg bg-[#0d1526] border border-white/[0.06] text-[11px] font-mono print:bg-gray-100 print:border-gray-300">
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-gray-600">Microchip Hash:</span>
              <span className="text-slate-300 font-semibold print:text-black">
                {pet.chipHash ? `${pet.chipHash.slice(0, 10)}...${pet.chipHash.slice(-8)}` : 'On-Chain Verified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-gray-600">Pet Record PDA:</span>
              <span className="text-[#2ec4b6] font-semibold print:text-black">
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
        <div className="mt-6 flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="btn-ghost flex-1 py-2.5 text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Collar Tag</span>
          </button>

          <a
            href={getExplorerAddressUrl(pet.pdaAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 py-2.5 text-xs"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
