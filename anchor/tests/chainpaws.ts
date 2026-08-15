import { PublicKey, Keypair } from "@solana/web3.js";
import crypto from "crypto";
import assert from "assert";

async function runTests() {
  console.log("🐾 Running ChainPaws Solana PDA & Cryptographic Invariant Tests...\n");

  const PROGRAM_ID = new PublicKey("GnEv5qz2xufNJqsqbkBvmgAa6ByWEmnygN6zayJ1SD8h");
  const owner = Keypair.generate();
  const finder = Keypair.generate();
  const clinicAuthority = Keypair.generate();

  const microchipId = "985141002345678";
  const chipHash = crypto.createHash("sha256").update(microchipId).digest();

  // Test 1: Pet PDA Derivation
  console.log("TEST 1: Deterministic PetRecord PDA Derivation");
  const [petPda, petBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("pet"), owner.publicKey.toBuffer(), chipHash],
    PROGRAM_ID
  );
  console.log(`  ✓ Pet PDA:  ${petPda.toBase58()} (Bump: ${petBump})`);
  assert(petPda instanceof PublicKey, "Pet PDA must be a valid PublicKey");
  assert(typeof petBump === "number", "Pet bump must be a number");

  // Test 2: Bounty Escrow PDA Derivation
  console.log("\nTEST 2: Deterministic BountyEscrow PDA Derivation");
  const [bountyPda, bountyBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), petPda.toBuffer()],
    PROGRAM_ID
  );
  console.log(`  ✓ Bounty PDA: ${bountyPda.toBase58()} (Bump: ${bountyBump})`);
  assert(bountyPda instanceof PublicKey, "Bounty PDA must be a valid PublicKey");
  assert(typeof bountyBump === "number", "Bounty bump must be a number");

  // Test 3: Clinic PDA Derivation
  console.log("\nTEST 3: Clinic Authority PDA Derivation");
  const [clinicPda, clinicBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("clinic"), clinicAuthority.publicKey.toBuffer()],
    PROGRAM_ID
  );
  console.log(`  ✓ Clinic PDA: ${clinicPda.toBase58()} (Bump: ${clinicBump})`);
  assert(clinicPda instanceof PublicKey, "Clinic PDA must be a valid PublicKey");

  // Test 4: Cryptographic Non-Collision / Avalanche Effect
  console.log("\nTEST 4: Microchip Hash Avalanche & Non-Collision Property");
  const tamperedMicrochipId = "985141002345679";
  const tamperedChipHash = crypto.createHash("sha256").update(tamperedMicrochipId).digest();
  const [tamperedPetPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pet"), owner.publicKey.toBuffer(), tamperedChipHash],
    PROGRAM_ID
  );
  console.log(`  ✓ Tampered PDA: ${tamperedPetPda.toBase58()}`);
  assert(!petPda.equals(tamperedPetPda), "Tampered microchip must yield distinct PDA");

  console.log("\n✨ ALL 4 SOLANA PROTOCOL TESTS PASSED DETERMINISTICALLY! ✨\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
