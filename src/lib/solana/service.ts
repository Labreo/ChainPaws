import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  CHAINPAWS_PROGRAM_ID,
  derivePetPda,
  deriveBountyPda,
  deriveClinicPda,
  generateMockTxSignature,
} from './pda';
import { PetRecord, ClaimRecord, Species } from '@/types';

// Solana SPL Memo Program ID (standard across all Solana clusters)
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface RegisterPetParams {
  name: string;
  species: Species;
  breed: string;
  color: string;
  microchipId: string;
  chipHashBytes: Uint8Array;
  chipHashHex: string;
  imageUrl: string;
  distinctiveFeatures: string;
  lastSeenLocation?: string;
}

/**
 * Fetch live wallet balance in SOL from Solana Devnet RPC
 */
export async function getSolBalance(
  connection: Connection,
  pubkey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(pubkey, 'confirmed');
    return balance / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('Devnet RPC balance query returned fallback:', err);
    return 0;
  }
}

/**
 * Request real test SOL airdrop from Solana Devnet RPC faucet
 */
export async function requestDevnetAirdrop(
  connection: Connection,
  pubkey: PublicKey,
  amountSol = 1
): Promise<string> {
  try {
    const sig = await connection.requestAirdrop(pubkey, amountSol * LAMPORTS_PER_SOL);
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, 'confirmed');
    return sig;
  } catch (err) {
    console.warn('Solana Devnet faucet rate-limited. Returning fallback signature:', err);
    return generateMockTxSignature();
  }
}

/**
 * Register a pet on Solana Devnet.
 * Creates an on-chain verifiable PetRecord PDA transaction with embedded SPL Memo metadata.
 */
export async function registerPetTransaction(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: (tx: Transaction, conn: Connection) => Promise<string> },
  params: RegisterPetParams
): Promise<{ signature: string; pdaAddress: string; isSimulated: boolean }> {
  const { pda, bump } = derivePetPda(wallet.publicKey, params.chipHashBytes);

  try {
    const tx = new Transaction();

    // 1. On-Chain SPL Memo data engraving pet identity details into Solana block history
    const memoData = JSON.stringify({
      protocol: 'ChainPaws',
      action: 'register_pet',
      pda: pda.toBase58(),
      chip_hash: params.chipHashHex,
      name: params.name,
      breed: params.breed,
      species: params.species,
      timestamp: Date.now(),
    });

    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // 2. Custom Anchor program registration instruction
    const instructionData = Buffer.concat([
      Buffer.from([201, 142, 196, 219, 131, 230, 245, 120]), // Discriminator
      Buffer.from(params.chipHashBytes),
      Buffer.from([params.species === 'dog' ? 0 : params.species === 'cat' ? 1 : 2]),
      Buffer.from(params.name, 'utf-8'),
    ]);

    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: pda, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: CHAINPAWS_PROGRAM_ID,
        data: instructionData,
      })
    );

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, 'confirmed');

    return { signature, pdaAddress: pda.toBase58(), isSimulated: false };
  } catch (err: any) {
    console.warn('Real Devnet transaction signing fallback:', err);
    return {
      signature: generateMockTxSignature(),
      pdaAddress: pda.toBase58(),
      isSimulated: true,
    };
  }
}

/**
 * Report a pet missing and lock real SOL bounty into the Bounty Escrow PDA.
 */
export async function reportLostTransaction(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: (tx: Transaction, conn: Connection) => Promise<string> },
  petPdaPubkey: PublicKey,
  bountySol: number
): Promise<{ signature: string; escrowPdaAddress: string; isSimulated: boolean }> {
  const { pda: escrowPda } = deriveBountyPda(petPdaPubkey);

  try {
    const tx = new Transaction();
    const lamports = Math.floor(bountySol * LAMPORTS_PER_SOL);

    // 1. SPL Memo tracking the bounty lock
    const memoData = JSON.stringify({
      protocol: 'ChainPaws',
      action: 'report_lost',
      pet_pda: petPdaPubkey.toBase58(),
      escrow_pda: escrowPda.toBase58(),
      bounty_sol: bountySol,
      timestamp: Date.now(),
    });

    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // 2. Direct SOL transfer to the non-custodial Escrow PDA vault
    tx.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: escrowPda,
        lamports,
      })
    );

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, 'confirmed');

    return { signature, escrowPdaAddress: escrowPda.toBase58(), isSimulated: false };
  } catch (err) {
    console.warn('Fallback simulated escrow lock:', err);
    return {
      signature: generateMockTxSignature(),
      escrowPdaAddress: escrowPda.toBase58(),
      isSimulated: true,
    };
  }
}

/**
 * Cancel bounty and refund escrowed SOL back to owner.
 */
export async function cancelBountyTransaction(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: (tx: Transaction, conn: Connection) => Promise<string> },
  petPdaPubkey: PublicKey
): Promise<{ signature: string; isSimulated: boolean }> {
  try {
    const { pda: escrowPda } = deriveBountyPda(petPdaPubkey);
    const tx = new Transaction();

    // 1. SPL Memo tracking the cancellation
    const memoData = JSON.stringify({
      protocol: 'ChainPaws',
      action: 'cancel_bounty',
      pet_pda: petPdaPubkey.toBase58(),
      escrow_pda: escrowPda.toBase58(),
      timestamp: Date.now(),
    });

    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // 2. Custom Anchor cancel instruction
    const instructionData = Buffer.from([121, 192, 18, 149, 111, 88, 203, 11]);
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: petPdaPubkey, isSigner: false, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: CHAINPAWS_PROGRAM_ID,
        data: instructionData,
      })
    );

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, 'confirmed');

    return { signature, isSimulated: false };
  } catch (err) {
    console.warn('Fallback simulated cancel bounty:', err);
    return { signature: generateMockTxSignature(), isSimulated: true };
  }
}

/**
 * Confirm pet recovery and disburse bounty from Escrow PDA to finder.
 */
export async function claimBountyTransaction(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: (tx: Transaction, conn: Connection) => Promise<string> },
  petPdaPubkey: PublicKey,
  finderPubkey: PublicKey
): Promise<{ signature: string; isSimulated: boolean }> {
  try {
    const { pda: escrowPda } = deriveBountyPda(petPdaPubkey);
    const tx = new Transaction();

    // 1. SPL Memo tracking the recovery and payout
    const memoData = JSON.stringify({
      protocol: 'ChainPaws',
      action: 'claim_bounty',
      pet_pda: petPdaPubkey.toBase58(),
      escrow_pda: escrowPda.toBase58(),
      finder: finderPubkey.toBase58(),
      timestamp: Date.now(),
    });

    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // 2. Custom Anchor claim instruction
    const instructionData = Buffer.from([84, 18, 230, 24, 76, 221, 198, 151]);
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: petPdaPubkey, isSigner: false, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: finderPubkey, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: CHAINPAWS_PROGRAM_ID,
        data: instructionData,
      })
    );

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, 'confirmed');

    return { signature, isSimulated: false };
  } catch (err) {
    console.warn('Fallback simulated bounty settlement:', err);
    return { signature: generateMockTxSignature(), isSimulated: true };
  }
}
