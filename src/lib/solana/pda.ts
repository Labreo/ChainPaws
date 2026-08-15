import { PublicKey } from '@solana/web3.js';

export const CHAINPAWS_PROGRAM_ID = new PublicKey('GnEv5qz2xufNJqsqbkBvmgAa6ByWEmnygN6zayJ1SD8h');

/**
 * Calculates SHA-256 hash of a microchip or collar tag string
 */
export async function calculateChipHash(microchipId: string): Promise<{ hex: string; bytes: Uint8Array }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(microchipId.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { hex, bytes };
}

/**
 * Derives the PetRecord PDA address and bump
 * Seeds: [b"pet", owner_pubkey, chip_hash]
 */
export function derivePetPda(
  ownerPubkey: PublicKey,
  chipHashBytes: Uint8Array,
  programId: PublicKey = CHAINPAWS_PROGRAM_ID
): { pda: PublicKey; bump: number } {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('pet'), ownerPubkey.toBuffer(), Buffer.from(chipHashBytes)],
    programId
  );
  return { pda, bump };
}

/**
 * Derives the BountyEscrow PDA address and bump
 * Seeds: [b"bounty", pet_pda_pubkey]
 */
export function deriveBountyPda(
  petPdaPubkey: PublicKey,
  programId: PublicKey = CHAINPAWS_PROGRAM_ID
): { pda: PublicKey; bump: number } {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('bounty'), petPdaPubkey.toBuffer()],
    programId
  );
  return { pda, bump };
}

/**
 * Derives the ClinicRecord PDA address and bump
 * Seeds: [b"clinic", clinic_authority_pubkey]
 */
export function deriveClinicPda(
  clinicAuthorityPubkey: PublicKey,
  programId: PublicKey = CHAINPAWS_PROGRAM_ID
): { pda: PublicKey; bump: number } {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('clinic'), clinicAuthorityPubkey.toBuffer()],
    programId
  );
  return { pda, bump };
}

/**
 * Formats a long public key into a compact display string
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Returns the Solana Explorer URL for a transaction signature
 */
export function getExplorerTxUrl(signature: string, cluster = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Returns the Solana Explorer URL for an account / PDA address
 */
export function getExplorerAddressUrl(address: string, cluster = 'devnet'): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}

/**
 * Generates a realistic mock Devnet transaction signature for immediate feedback
 */
export function generateMockTxSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}
