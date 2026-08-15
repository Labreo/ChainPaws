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
} from 'lucide-react';
import { PetRecord, Species } from '@/types';
import { calculateChipHash, derivePetPda, shortenAddress, getExplorerAddressUrl, getExplorerTxUrl } from '@/lib/solana/pda';
import { registerPetTransaction } from '@/lib/solana/service';

interface RegisterPetViewProps {
  onPetRegistered: (newPet: PetRecord, txSignature: string) => void;
  onOpenQrModal: (pet: PetRecord) => void;
}

export const RegisterPetView: React.FC<RegisterPetViewProps> = ({
  onPetRegistered,
  onOpenQrModal,
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

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccessPet, setRegisteredSuccessPet] = useState<{ pet: PetRecord; sig: string } | null>(null);

  // Suggested demo photo presets
  const sampleImages = [
    { label: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Husky', url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80' },
    { label: 'Frenchie', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tabby Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
    { label: 'Black Cat', url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80' },
  ];

  // Calculate live hash and PDA whenever microchip or wallet changes
  useEffect(() => {
    async function updatePda() {
      const chipInput = microchipId.trim() || 'SAMPLE-MICROCHIP-TAG-000';
      const { hex, bytes } = await calculateChipHash(chipInput);
      setChipHashHex(hex);
      setChipHashBytes(bytes);

      if (publicKey) {
        try {
          const { pda } = derivePetPda(publicKey, bytes);
          setDerivedPda(pda.toBase58());
        } catch {
          setDerivedPda('');
        }
      } else {
        setDerivedPda('');
      }
    }
    updatePda();
  }, [microchipId, publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your Solana wallet (Phantom or Solflare) on Devnet to register.');
      return;
    }
    if (!name.trim() || !breed.trim() || !microchipId.trim()) {
      setError('Please fill in Pet Name, Breed, and Microchip/Tag ID.');
      return;
    }
    if (!chipHashBytes) {
      setError('Failed to compute microchip cryptographic hash.');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
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

      const newPet: PetRecord = {
        id: `pet-${Date.now()}`,
        pdaAddress: result.pdaAddress,
        ownerAddress: publicKey.toBase58(),
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
        distinctiveFeatures: distinctiveFeatures.trim(),
        contactNote: contactNote.trim() || 'Registered on ChainPaws Protocol.',
        createdAt: Date.now(),
        claims: [],
      };

      setRegisteredSuccessPet({ pet: newPet, sig: result.signature });
      onPetRegistered(newPet, result.signature);

      // Reset form
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
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>ON-CHAIN TAMPER-PROOF IDENTITY</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Register New Companion
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Mint your pet&apos;s cryptographic identity directly to a Solana Program Derived Account (PDA). 
          Generates an immutable on-chain record and printable QR collar tag.
        </p>
      </div>

      {/* Success Notification Banner */}
      {registeredSuccessPet && (
        <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.2)] space-y-4 animate-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              <div>
                <h4 className="text-lg font-bold text-white">
                  🎉 {registeredSuccessPet.pet.name} is Protected on Solana!
                </h4>
                <p className="text-xs text-emerald-300 font-mono">
                  Pet Record PDA: {registeredSuccessPet.pet.pdaAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenQrModal(registeredSuccessPet.pet)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg hover:bg-emerald-400 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Get Collar Tag</span>
            </button>
          </div>

          <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono text-emerald-200">
            <span>Transaction Signature:</span>
            <a
              href={getExplorerTxUrl(registeredSuccessPet.sig)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center space-x-1 text-cyan-300 hover:text-white"
            >
              <span>{shortenAddress(registeredSuccessPet.sig, 8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Registration Form & Live Cryptographic Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-6">
          
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Atlas, Bella, Mochi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Species *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dog', 'cat', 'other'] as Species[]).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpecies(sp)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        species === sp
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Breed *
                </label>
                <input
                  type="text"
                  required
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Siberian Husky, Golden Retriever"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Coat Color / Markings
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Silver & White, Bi-color eyes"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Microchip ID / Smart Tag ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Microchip ISO 11784 ID or Collar Tag Number *</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">15-digit standard or custom</span>
              </label>
              <input
                type="text"
                required
                value={microchipId}
                onChange={(e) => setMicrochipId(e.target.value)}
                placeholder="e.g. 985141009823451 or TAG-SF-8891"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-sm font-mono text-cyan-300 placeholder-slate-500 outline-none"
              />
            </div>

            {/* Photo URL & Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pet Photo URL (or select sample demo asset)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-white placeholder-slate-500 outline-none"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {sampleImages.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setImageUrl(sample.url)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium transition-all"
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distinctive Features */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Distinctive Features & Medical Notes
              </label>
              <textarea
                rows={2}
                value={distinctiveFeatures}
                onChange={(e) => setDistinctiveFeatures(e.target.value)}
                placeholder="e.g. Wearing red harness, chipped tooth, needs heart medication."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-[0_0_30px_rgba(0,243,255,0.4)] hover:shadow-[0_0_40px_rgba(0,243,255,0.7)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isRegistering ? 'Minting Identity on Solana Devnet...' : 'Mint Pet Identity PDA on Solana'}</span>
            </button>

          </form>
        </div>

        {/* Right 1 Col: Live Cryptographic PDA Derivation Preview Terminal */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold">
              <Cpu className="w-4 h-4" />
              <span>PDA DERIVATION TELEMETRY</span>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Microchip SHA-256 Digest:</div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all leading-tight">
                {chipHashHex || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            {/* Program Seeds Diagram */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Deterministic PDA Seeds:</div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1.5">
                <div className="text-slate-400">1. Const: <span className="text-amber-300">&quot;pet&quot;</span></div>
                <div className="text-slate-400">2. Owner: <span className="text-purple-300">{publicKey ? shortenAddress(publicKey.toBase58(), 4) : 'Wallet Pubkey'}</span></div>
                <div className="text-slate-400">3. Hash: <span className="text-cyan-300">{chipHashHex ? `${chipHashHex.slice(0, 8)}...` : '[u8; 32]'}</span></div>
              </div>
            </div>

            {/* Derived Account Address */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">Target On-Chain Address:</div>
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono text-cyan-300 break-all font-semibold">
                {derivedPda || (publicKey ? 'Deriving...' : 'Connect Wallet to Preview')}
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Immutable storage rent paid once from owner wallet.</span>
            </div>
          </div>

          {/* Sample Photo Preview */}
          {imageUrl && (
            <div className="rounded-3xl overflow-hidden border border-white/10 relative h-48">
              <Image
                src={imageUrl}
                alt="Pet Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs text-white font-medium">
                Asset Preview
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
