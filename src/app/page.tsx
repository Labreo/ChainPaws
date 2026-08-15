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
import { ClaimModal } from '@/components/modals/ClaimModal';
import { BountyModal } from '@/components/modals/BountyModal';
import { QrTagModal } from '@/components/modals/QrTagModal';
import { INITIAL_PETS, INITIAL_CLINICS, INITIAL_TX_HISTORY } from '@/lib/mockData';
import { PetRecord, ClinicRecord, TxHistoryItem, ClaimRecord } from '@/types';
import { reportLostTransaction } from '@/lib/solana/service';
import { PublicKey } from '@solana/web3.js';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState<string>('radar');
  const [pets, setPets] = useState<PetRecord[]>(INITIAL_PETS);
  const [clinics, setClinics] = useState<ClinicRecord[]>(INITIAL_CLINICS);
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>(INITIAL_TX_HISTORY);

  // Modals state
  const [selectedClaimPet, setSelectedClaimPet] = useState<PetRecord | null>(null);
  const [selectedBountyPet, setSelectedBountyPet] = useState<PetRecord | null>(null);
  const [selectedQrPet, setSelectedQrPet] = useState<PetRecord | null>(null);

  // Load / Sync state from localStorage on mount if present
  useEffect(() => {
    try {
      const savedPets = localStorage.getItem('chainpaws_pets');
      if (savedPets) setPets(JSON.parse(savedPets));
      const savedTx = localStorage.getItem('chainpaws_txs');
      if (savedTx) setTxHistory(JSON.parse(savedTx));
    } catch {}
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('chainpaws_pets', JSON.stringify(pets));
      localStorage.setItem('chainpaws_txs', JSON.stringify(txHistory));
    } catch {}
  }, [pets, txHistory]);

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
  };

  const handleConfirmReportLost = async (petId: string, bountySol: number, location: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet || !wallet.publicKey) return;

    const result = await reportLostTransaction(
      connection,
      wallet as any,
      new PublicKey(pet.pdaAddress),
      bountySol
    );

    const updated: PetRecord = {
      ...pet,
      status: 'missing',
      bountySol,
      bountyEscrowPda: result.escrowPdaAddress,
      lastSeenLocation: location,
      lastSeenDate: 'Just now',
    };

    handleUpdatePet(updated);
    handleAddTxHistory({
      id: `tx-${Date.now()}`,
      signature: result.signature,
      type: 'report_lost',
      description: `Locked ${bountySol} SOL in Escrow PDA for ${pet.name} (Missing Alert)`,
      timestamp: Date.now(),
      petName: pet.name,
      amountSol: bountySol,
      status: result.isSimulated ? 'simulated' : 'finalized',
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

    handleUpdatePet(updated);
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
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAirdropSuccess={handleAirdropSuccess}
        missingCount={missingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'radar' && (
          <MissingBoardView
            pets={pets}
            onOpenClaimModal={(pet) => setSelectedClaimPet(pet)}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
            onNavigateRegister={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPetView
            onPetRegistered={handlePetRegistered}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
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
          />
        )}

        {activeTab === 'clinic' && (
          <ClinicPortalView
            pets={pets}
            clinics={clinics}
            onOpenClaimModal={(pet) => setSelectedClaimPet(pet)}
            onOpenQrModal={(pet) => setSelectedQrPet(pet)}
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

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
