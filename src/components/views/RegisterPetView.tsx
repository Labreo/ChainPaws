'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import {
  PawPrint,
  Hash,
  Shield,
  Upload,
  CheckCircle2,
  ExternalLink,
  QrCode,
  AlertCircle,
  Cpu,
  Info,
  RotateCcw,
} from 'lucide-react';
import { PetRecord, Species } from '@/types';
import { calculateChipHash, derivePetPda, shortenAddress, getExplorerAddressUrl, getExplorerTxUrl } from '@/lib/solana/pda';
import { registerPetTransaction } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';
import { PublicKey } from '@solana/web3.js';

interface RegisterPetViewProps {
  onPetRegistered: (newPet: PetRecord, txSignature: string) => void;
  onOpenQrModal: (pet: PetRecord) => void;
  demoWalletPubkey: string;
}

export const RegisterPetView: React.FC<RegisterPetViewProps> = ({
  onPetRegistered,
  onOpenQrModal,
  demoWalletPubkey,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('');
  const [contactNote, setContactNote] = useState('');

  const [chipHashHex, setChipHashHex] = useState('');
  const [chipHashBytes, setChipHashBytes] = useState<Uint8Array | null>(null);
  const [derivedPda, setDerivedPda] = useState<string>('');
  const [pdaBump, setPdaBump] = useState<number>(0);

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccessPet, setRegisteredSuccessPet] = useState<{ pet: PetRecord; sig: string } | null>(null);

  const sampleImages = [
    { label: 'Husky', breed: 'Siberian Husky', url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80' },
    { label: 'French Bulldog', breed: 'French Bulldog', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Golden Retriever', breed: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Corgi', breed: 'Pembroke Welsh Corgi', url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tabby Cat', breed: 'Scottish Fold', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
    { label: 'Bengal Cat', breed: 'Bengal Leopard Cat', url: 'https://images.unsplash.com/photo-1513360309081-38f07627399e?auto=format&fit=crop&w=800&q=80' },
  ];

  const activeSignerPubkey = publicKey || new PublicKey(demoWalletPubkey);

  useEffect(() => {
    async function updatePda() {
      const chipInput = microchipId.trim() || 'SAMPLE-MICROCHIP-TAG-000';
      const { hex, bytes } = await calculateChipHash(chipInput);
      setChipHashHex(hex);
      setChipHashBytes(bytes);
      try {
        const { pda, bump } = derivePetPda(activeSignerPubkey, bytes);
        setDerivedPda(pda.toBase58());
        setPdaBump(bump);
      } catch {
        setDerivedPda('');
      }
    }
    updatePda();
  }, [microchipId, activeSignerPubkey]);

  const handleQuickTemplate = (preset: { label: string; breed: string; url: string }) => {
    playSound('click');
    setName(preset.label);
    setBreed(preset.breed);
    setSpecies(preset.label.toLowerCase().includes('cat') ? 'cat' : 'dog');
    setColor('Standard Show Pattern');
    setMicrochipId(`98514100${Math.floor(1000000 + Math.random() * 9000000)}`);
    setImageUrl(preset.url);
    setDistinctiveFeatures('Active smart collar tag with on-chain PDA identity lookup.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !breed.trim() || !microchipId.trim()) {
      setError('Please fill in Pet Name, Breed, and Microchip/Tag ID.');
      playSound('alert');
      return;
    }
    if (!chipHashBytes) {
      setError('Failed to compute microchip cryptographic hash.');
      playSound('alert');
      return;
    }

    setIsRegistering(true);
    setError(null);
    playSound('click');

    try {
      let signature = '';
      let pdaAddress = derivedPda;

      if (publicKey) {
        const result = await registerPetTransaction(
          connection,
          wallet as any,
          {
            name: name.trim(),
            species,
            breed: breed.trim(),
            color: color.trim() || 'Standard',
            microchipId: microchipId.trim(),
            chipHashBytes,
            chipHashHex,
            imageUrl: imageUrl.trim() || sampleImages[0].url,
            distinctiveFeatures: distinctiveFeatures.trim(),
          }
        );
        signature = result.signature;
        pdaAddress = result.pdaAddress;
      } else {
        signature = `5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
      }

      const newPet: PetRecord = {
        id: `pet-${Date.now()}`,
        pdaAddress,
        ownerAddress: activeSignerPubkey.toBase58(),
        name: name.trim(),
        species,
        breed: breed.trim(),
        color: color.trim() || 'Standard',
        microchipId: microchipId.trim(),
        chipHash: chipHashHex,
        metadataUri: `https://arweave.net/mock_${chipHashHex.slice(0, 16)}.json`,
        imageUrl: imageUrl.trim() || sampleImages[0].url,
        status: 'safe',
        bountySol: 0,
        distinctiveFeatures: distinctiveFeatures.trim() || 'Registered on ChainPaws Solana Protocol.',
        contactNote: contactNote.trim() || 'Registered on ChainPaws Protocol.',
        createdAt: Date.now(),
        claims: [],
      };

      playSound('success');
      setRegisteredSuccessPet({ pet: newPet, sig: signature });
      onPetRegistered(newPet, signature);

      setName('');
      setBreed('');
      setColor('');
      setMicrochipId('');
      setImageUrl('');
      setDistinctiveFeatures('');
      setContactNote('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Registration failed. Please check your Devnet SOL gas balance.');
      playSound('alert');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Page Header ── */}
      <div className="space-y-4">
        <p className="label-eyebrow">On-Chain Identity Registration</p>
        <h2 className="font-display text-3xl sm:text-4xl font-900 text-white tracking-tight"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}>
          Register a New Companion
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
          Mint your pet&apos;s cryptographic identity directly to a Solana Program Derived Account.
          Generates an immutable on-chain record and printable QR collar tag.
        </p>

        {/* Quick templates */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mr-1"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Quick Load:
          </span>
          {sampleImages.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleQuickTemplate(s)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Success Banner ── */}
      {registeredSuccessPet && (
        <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {registeredSuccessPet.pet.name} is Protected on Solana
                </h4>
                <p className="text-xs text-emerald-300 font-mono mt-0.5">
                  PDA: {registeredSuccessPet.pet.pdaAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => { onOpenQrModal(registeredSuccessPet.pet); playSound('click'); }}
              className="btn-primary"
            >
              <QrCode className="w-4 h-4" />
              Get Collar Tag
            </button>
          </div>

          <div className="pt-3 border-t border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-emerald-300">
            <span>Transaction Signature:</span>
            <a
              href={getExplorerTxUrl(registeredSuccessPet.sig)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2ec4b6] hover:text-white flex items-center gap-1.5 font-bold transition-colors"
            >
              {shortenAddress(registeredSuccessPet.sig, 10)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Form + Terminal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Form */}
        <div className="lg:col-span-2 card p-6 sm:p-8 space-y-6">

          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name + Species */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Atlas, Bella, Mochi"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Species *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dog', 'cat', 'other'] as Species[]).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => { setSpecies(sp); playSound('click'); }}
                      className={`py-2.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        species === sp
                          ? 'bg-[#2ec4b6] text-[#080c14]'
                          : 'bg-[#080c14]/60 text-slate-400 hover:text-white border border-white/[0.07]'
                      }`}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {sp === 'dog' ? 'Dog' : sp === 'cat' ? 'Cat' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Breed + Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Breed *
                </label>
                <input
                  type="text"
                  required
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Siberian Husky, Golden Retriever"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Coat Color / Markings
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Silver & White, Bi-color eyes"
                  className="input-field"
                />
              </div>
            </div>

            {/* Microchip ID */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#2ec4b6]" />
                  Microchip ISO 11784 / Tag ID *
                </span>
                <span className="text-[10px] text-slate-600 normal-case font-mono">15-digit or custom</span>
              </label>
              <input
                type="text"
                required
                value={microchipId}
                onChange={(e) => setMicrochipId(e.target.value)}
                placeholder="e.g. 985141009823451 or TAG-SF-8891"
                className="input-field font-mono text-[#2ec4b6]"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Pet Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="input-field font-mono text-xs"
              />
            </div>

            {/* Distinctive Features */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Distinctive Features & Medical Notes
              </label>
              <textarea
                rows={2}
                value={distinctiveFeatures}
                onChange={(e) => setDistinctiveFeatures(e.target.value)}
                placeholder="e.g. Wearing red harness, chipped tooth, friendly, responds to whistle."
                className="input-field resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isRegistering}
              className="btn-primary w-full py-3.5 text-sm"
            >
              {isRegistering ? 'Minting Identity on Solana Devnet...' : 'Mint Pet Identity PDA on Solana'}
            </button>

          </form>
        </div>

        {/* Right: Terminal + Preview */}
        <div className="space-y-6">

          {/* PDA Derivation Terminal */}
          <div className="terminal-block space-y-4">
            <div className="flex items-center gap-2 text-[#2ec4b6] font-bold text-xs mb-2">
              <Cpu className="w-4 h-4" />
              <span>PDA DERIVATION TELEMETRY</span>
            </div>

            <div className="space-y-1">
              <div className="text-slate-500 text-[10px]">Microchip SHA-256 Digest:</div>
              <div className="text-[#2ec4b6] text-[10px] break-all leading-relaxed">
                {chipHashHex || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-500 text-[10px]">PDA Seeds:</div>
              <div className="space-y-1 text-[10px]">
                <div className="text-slate-400">1. const: <span className="text-[#f4a261]">&quot;pet&quot;</span></div>
                <div className="text-slate-400">2. owner: <span className="text-[#a78bfa]">{shortenAddress(activeSignerPubkey.toBase58(), 4)}</span></div>
                <div className="text-slate-400">3. hash: <span className="text-[#2ec4b6]">{chipHashHex ? `${chipHashHex.slice(0, 10)}...` : '[u8; 32]'}</span></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-500 text-[10px]">Target Address (Bump {pdaBump}):</div>
              <div className="text-[#2ec4b6] text-[10px] break-all font-bold leading-relaxed">
                {derivedPda || 'Deriving...'}
              </div>
            </div>

            <div className="flex items-start gap-1.5 pt-2 border-t border-[#2ec4b6]/20 text-[10px] text-slate-500">
              <Info className="w-3 h-3 text-[#2ec4b6] flex-shrink-0 mt-0.5" />
              <span>Immutable storage rent paid once from owner wallet.</span>
            </div>
          </div>

          {/* Photo Preview */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-white/[0.07] relative h-52">
              <Image
                src={imageUrl}
                alt="Pet Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-[#080c14]/90 text-[10px] text-slate-300 font-semibold backdrop-blur-sm">
                Photo Preview
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
