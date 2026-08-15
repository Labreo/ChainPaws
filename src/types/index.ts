export type Species = 'dog' | 'cat' | 'other';
export type PetStatus = 'safe' | 'missing';
export type BountyStatus = 'active' | 'claimed' | 'refunded';

export interface PetRecord {
  id: string;
  pdaAddress: string;
  ownerAddress: string;
  name: string;
  species: Species;
  breed: string;
  color: string;
  microchipId: string;
  chipHash: string;
  metadataUri: string;
  imageUrl: string;
  status: PetStatus;
  bountySol: number;
  bountyEscrowPda?: string;
  lastSeenLocation?: string;
  city?: string;
  lastSeenDate?: string;
  timeElapsed?: string;
  distinctiveFeatures?: string;
  contactNote?: string;
  medicalUrgent?: boolean;
  coordinates?: { x: number; y: number }; // Radar percentage coordinates (0 to 100)
  createdAt: number;
  qrCodeUrl?: string;
  claims?: ClaimRecord[];
}

export interface ClaimRecord {
  id: string;
  finderAddress: string;
  finderName?: string;
  contactInfo: string;
  foundLocation: string;
  notes: string;
  timestamp: number;
  status: 'pending' | 'verified' | 'paid' | 'rejected';
  txSignature?: string;
  verifiedByClinic?: boolean;
}

export interface ClinicRecord {
  pdaAddress: string;
  authorityAddress: string;
  name: string;
  location: string;
  isVerified: boolean;
  registeredAt: number;
}

export interface TxHistoryItem {
  id: string;
  signature: string;
  type: 'register' | 'report_lost' | 'cancel_bounty' | 'claim_bounty' | 'clinic_verify' | 'airdrop';
  description: string;
  timestamp: number;
  petName?: string;
  amountSol?: number;
  status: 'confirmed' | 'finalized' | 'simulated';
}

export interface FalsificationProbe {
  id: string;
  title: string;
  description: string;
  expectedResult: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  details?: string;
  log?: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description: string;
  txSig?: string;
}
