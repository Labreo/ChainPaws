'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import {
  PawPrint,
  Hash,
  Shield,
  Sparkles,
  Upload,
  CheckCircle2,
  ExternalLink,
  QrCode,
  AlertCircle,
  Cpu,
  Info,
  Zap,
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

  // Suggested demo photo presets
  const sampleImages = [
    { label: 'Husky', breed: 'Siberian Husky', url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80' },
    { label: 'French Bulldog', breed: 'French Bulldog', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Golden Retriever', breed: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Corgi', breed: 'Pembroke Welsh Corgi', url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tabby Cat', breed: 'Scottish Fold', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
    { label: 'Bengal Cat', breed: 'Bengal Leopard Cat', url: 'https://images.unsplash.com/photo-1513360309081-38f07627399e?auto=format&fit=crop&w=800&q=80' },
  ];

  const activeSignerPubkey = publicKey || new PublicKey(demoWalletPubkey);

  // Calculate live hash and PDA whenever microchip or wallet changes
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
        // Real Solana Devnet Transaction
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
        // Instant Testnet Demo Signer
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

      // Reset form fields
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
      
      {/* Header Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>ON-CHAIN TAMPER-PROOF IDENTITY</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Register New Companion
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Mint your pet&apos;s cryptographic identity directly to a Solana Program Derived Account (PDA). 
          Generates an immutable on-chain record and printable QR collar tag.
        </p>

        {/* Quick Template loader bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">⚡ Instant Templates:</span>
          {sampleImages.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleQuickTemplate(s)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-bold transition-all shadow cursor-pointer"
            >
              + {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification Banner */}
      {registeredSuccessPet && (
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.3)] space-y-4 animate-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-black text-white">
                  🎉 {registeredSuccessPet.pet.name} is Protected on Solana!
                </h4>
                <p className="text-xs text-emerald-300 font-mono">
                  Pet Record PDA: {registeredSuccessPet.pet.pdaAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onOpenQrModal(registeredSuccessPet.pet);
                playSound('click');
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Get Collar Tag</span>
            </button>
          </div>

          <div className="pt-3 border-t border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-emerald-200 gap-2">
            <span>Transaction Signature:</span>
            <a
              href={getExplorerTxUrl(registeredSuccessPet.sig)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center space-x-1 text-cyan-300 hover:text-white font-bold"
            >
              <span>{shortenAddress(registeredSuccessPet.sig, 10)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Registration Form & Live Cryptographic Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-2xl space-y-6 shadow-2xl">
          
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Pet Name & Species */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Atlas, Bella, Mochi"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Species *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dog', 'cat', 'other'] as Species[]).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => { setSpecies(sp); playSound('click'); }}
                      className={`py-3 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        species === sp
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {sp === 'dog' ? '🐕 Dog' : sp === 'cat' ? '🐈 Cat' : '🐾 Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Breed & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Breed *
                </label>
                <input
                  type="text"
                  required
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Siberian Husky, Golden Retriever"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Coat Color / Markings
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Silver & White, Bi-color eyes"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Microchip ID / Smart Tag ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Microchip ISO 11784 ID or Collar Tag Number *</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">15-digit standard or custom</span>
              </label>
              <input
                type="text"
                required
                value={microchipId}
                onChange={(e) => setMicrochipId(e.target.value)}
                placeholder="e.g. 985141009823451 or TAG-SF-8891"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm font-mono text-cyan-300 placeholder-slate-500 outline-none font-bold"
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pet Photo URL (or select sample image)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Distinctive Features */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Distinctive Features & Medical Notes
              </label>
              <textarea
                rows={2}
                value={distinctiveFeatures}
                onChange={(e) => setDistinctiveFeatures(e.target.value)}
                placeholder="e.g. Wearing red harness, chipped tooth, friendly, responds to whistle."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_35px_rgba(0,243,255,0.45)] hover:shadow-[0_0_45px_rgba(0,243,255,0.75)] hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>{isRegistering ? 'Minting Identity on Solana Devnet...' : 'Mint Pet Identity PDA on Solana'}</span>
            </button>

          </form>
        </div>

        {/* Right 1 Col: Live Cryptographic PDA Derivation Preview Terminal */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold">
              <Cpu className="w-4 h-4" />
              <span>PDA DERIVATION TELEMETRY</span>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Microchip SHA-256 Digest:</div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all leading-tight">
                {chipHashHex || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            {/* Program Seeds Diagram */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Deterministic PDA Seeds:</div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1.5">
                <div className="text-slate-400">1. Const: <span className="text-amber-300 font-bold">&quot;pet&quot;</span></div>
                <div className="text-slate-400">2. Owner: <span className="text-purple-300 font-bold">{shortenAddress(activeSignerPubkey.toBase58(), 4)}</span></div>
                <div className="text-slate-400">3. Hash: <span className="text-cyan-300 font-bold">{chipHashHex ? `${chipHashHex.slice(0, 10)}...` : '[u8; 32]'}</span></div>
              </div>
            </div>

            {/* Derived Account Address */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Target On-Chain Address (Bump {pdaBump}):</div>
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 text-xs font-mono text-cyan-300 break-all font-bold">
                {derivedPda || 'Deriving...'}
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Immutable storage rent paid once from owner wallet.</span>
            </div>
          </div>

          {/* Photo Preview */}
          {imageUrl && (
            <div className="rounded-3xl overflow-hidden border border-white/10 relative h-52 shadow-xl">
              <Image
                src={imageUrl}
                alt="Pet Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs text-white font-bold">
                Photo Asset Preview
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
