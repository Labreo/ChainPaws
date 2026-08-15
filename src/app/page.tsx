'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MissingBoardView } from '@/components/views/MissingBoardView';
import { RegisterPetView } from '@/components/views/RegisterPetView';
import { OwnerConsoleView } from '@/components/views/OwnerConsoleView';
import { ClinicPortalView } from '@/components/views/ClinicPortalView';
import { TrustInspectorView } from '@/components/views/TrustInspectorView';
import { GuardianBadgesView } from '@/components/views/GuardianBadgesView';
import { ClaimModal } from '@/components/modals/ClaimModal';
import { BountyModal } from '@/components/modals/BountyModal';
import { QrTagModal } from '@/components/modals/QrTagModal';
import { EmergencyFlyerModal } from '@/components/modals/EmergencyFlyerModal';
import { ToastContainer } from '@/components/ui/Toast';
import { INITIAL_PETS, INITIAL_CLINICS, INITIAL_TX_HISTORY, DEMO_WALLET_PUBKEY } from '@/lib/mockData';
import { PetRecord, ClinicRecord, TxHistoryItem, ClaimRecord, ToastMessage } from '@/types';
import { reportLostTransaction } from '@/lib/solana/service';
import { playSound } from '@/lib/sound';
import { PublicKey } from '@solana/web3.js';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState<string>('radar');
  const [pets, setPets] = useState<PetRecord[]>(INITIAL_PETS);
  const [clinics, setClinics] = useState<ClinicRecord[]>(INITIAL_CLINICS);
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>(INITIAL_TX_HISTORY);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Modals state
  const [selectedClaimPet, setSelectedClaimPet] = useState<PetRecord | null>(null);
  const [selectedBountyPet, setSelectedBountyPet] = useState<PetRecord | null>(null);
  const [selectedQrPet, setSelectedQrPet] = useState<PetRecord | null>(null);
  const [selectedFlyerPet, setSelectedFlyerPet] = useState<PetRecord | null>(null);

  // Load / Sync state from localStorage on mount if present (v7 clean key)
  useEffect(() => {
    try {
      const savedPets = localStorage.getItem('chainpaws_pets_v7');
      if (savedPets) {
        const parsed = JSON.parse(savedPets);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_PETS.length) {
          setPets(parsed);
        }
      }
      const savedTx = localStorage.getItem('chainpaws_txs_v7');
      if (savedTx) setTxHistory(JSON.parse(savedTx));
    } catch {}
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('chainpaws_pets_v7', JSON.stringify(pets));
      localStorage.setItem('chainpaws_txs_v7', JSON.stringify(txHistory));
    } catch {}
  }, [pets, txHistory]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const missingCount = pets.filter((p) => p.status === 'missing').length;

  const handleAddTxHistory = (item: TxHistoryItem) => {
    setTxHistory((prev) => [item, ...prev]);
  };

  const handleUpdatePet = (updatedPet: PetRecord) => {
    setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
  };

  const handlePetRegistered = (newPet: PetRecord, txSig: string) => {
    setPets((prev) => [newPet, ...prev]);
    handleAddTxHistory({
      id: `tx-${Date.now()}`,
      signature: txSig,
      type: 'register',
      description: `Minted PDA identity for ${newPet.name} (${newPet.breed}) on Solana Devnet`,
      timestamp: Date.now(),
      petName: newPet.name,
      status: 'finalized',
    });
    addToast({
      type: 'success',
      title: `${newPet.name} Registered on Solana`,
      description: `Immutable PetRecord PDA created on Solana Devnet.`,
      txSig,
    });
  };

  const handleConfirmReportLost = async (petId: string, bountySol: number, location: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return;

    let signature = '';
    let escrowPdaAddress = '';
    let isSimulated = false;

    if (wallet.publicKey) {
      const result = await reportLostTransaction(
        connection,
        wallet as any,
        new PublicKey(pet.pdaAddress),
        bountySol
      );
      signature = result.signature;
      escrowPdaAddress = result.escrowPdaAddress;
      isSimulated = result.isSimulated;
    } else {
      signature = `5K2eB8uY1k9bLmNpRqTsVwXzAcEfGhIjKlMnOpQrStUvWxYz${Math.floor(Math.random() * 1000000)}`;
      escrowPdaAddress = '6JAPUGJ5emxfDTqJS7rAd98BQkGN5Lg1VGygengfWphB';
      isSimulated = true;
    }

    const updated: PetRecord = {
      ...pet,
      status: 'missing',
      bountySol,
      bountyEscrowPda: escrowPdaAddress,
      lastSeenLocation: location,
      lastSeenDate: 'Just now',
      timeElapsed: 'Just now',
    };

    playSound('lock');
    handleUpdatePet(updated);
    handleAddTxHistory({
      id: `tx-${Date.now()}`,
      signature,
      type: 'report_lost',
      description: `Locked ${bountySol} SOL in Escrow PDA for ${pet.name} (Missing Alert)`,
      timestamp: Date.now(),
      petName: pet.name,
      amountSol: bountySol,
      status: isSimulated ? 'simulated' : 'finalized',
    });

    addToast({
      type: 'warning',
      title: `Missing Alert: ${pet.name}`,
      description: `Locked ${bountySol} SOL in Escrow Vault. Broadcast live on Map.`,
      txSig: signature,
    });
  };

  const handleSubmitClaim = async (
    petId: string,
    claimData: Omit<ClaimRecord, 'id' | 'timestamp' | 'status'>
  ) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return;

    const newClaim: ClaimRecord = {
      ...claimData,
      id: `claim-${Date.now()}`,
      timestamp: Date.now(),
      status: 'pending',
    };

    const updated: PetRecord = {
      ...pet,
      claims: [newClaim, ...(pet.claims || [])],
    };

    playSound('success');
    handleUpdatePet(updated);

    addToast({
      type: 'info',
      title: `Sighting Claim Submitted`,
      description: `Finder report submitted for ${pet.name}. Owner can verify & disburse bounty.`,
    });
  };

  const handleAirdropSuccess = (sig: string) => {
    handleAddTxHistory({
      id: `tx-${Date.now()}`,
      signature: sig,
      type: 'airdrop',
      description: 'Devnet Airdrop (+1.0 SOL) confirmed to connected wallet',
      timestamp: Date.now(),
      amountSol: 1.0,
      status: 'finalized',
    });
    addToast({
      type: 'success',
      title: 'Devnet Faucet Airdrop Confirmed',
      description: '+1.0 SOL credited for gas & escrow bounty deposits.',
      txSig: sig,
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAirdropSuccess={handleAirdropSuccess}
        missingCount={missingCount}
        demoWalletPubkey={DEMO_WALLET_PUBKEY}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'radar' && (
          <MissingBoardView
            pets={pets}
            onOpenClaimModal={(pet) => setSelectedClaimPet(pet)}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
            onOpenFlyerModal={(pet) => setSelectedFlyerPet(pet)}
            onNavigateRegister={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPetView
            onPetRegistered={handlePetRegistered}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
            demoWalletPubkey={DEMO_WALLET_PUBKEY}
          />
        )}

        {activeTab === 'mypets' && (
          <OwnerConsoleView
            pets={pets}
            onOpenBountyModal={(pet) => setSelectedBountyPet(pet)}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
            onUpdatePet={handleUpdatePet}
            onAddTxHistory={handleAddTxHistory}
            onNavigateRegister={() => setActiveTab('register')}
            demoWalletPubkey={DEMO_WALLET_PUBKEY}
          />
        )}

        {activeTab === 'badges' && (
          <GuardianBadgesView
            pets={pets}
            txHistory={txHistory}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'clinic' && (
          <ClinicPortalView
            pets={pets}
            clinics={clinics}
            onOpenClaimModal={(pet) => setSelectedClaimPet(pet)}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
            demoWalletPubkey={DEMO_WALLET_PUBKEY}
          />
        )}

        {activeTab === 'trust' && (
          <TrustInspectorView txHistory={txHistory} />
        )}
      </main>

      {/* Global Modals */}
      {selectedClaimPet && (
        <ClaimModal
          pet={selectedClaimPet}
          onClose={() => setSelectedClaimPet(null)}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {selectedBountyPet && (
        <BountyModal
          pet={selectedBountyPet}
          onClose={() => setSelectedBountyPet(null)}
          onConfirmReportLost={handleConfirmReportLost}
        />
      )}

      {selectedQrPet && (
        <QrTagModal
          pet={selectedQrPet}
          onClose={() => setSelectedQrPet(null)}
        />
      )}

      {selectedFlyerPet && (
        <EmergencyFlyerModal
          pet={selectedFlyerPet}
          onClose={() => setSelectedFlyerPet(null)}
        />
      )}

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
