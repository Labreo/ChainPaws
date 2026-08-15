# 🐾 ChainPaws — Decentralized Pet Registry & Escrow Recovery Network on Solana

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-14F195?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Anchor Framework](https://img.shields.io/badge/Anchor-0.30.1-9945FF?style=for-the-badge)](https://coral-xyz.github.io/anchor/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-00F3FF?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-38FE5E?style=for-the-badge)](LICENSE)

> **Submission for the DEV Weekend Challenge: Dog Days Edition** (Best Use of Solana)

---

## 🐶 1. Problem & Value Proposition

Millions of household pets go missing annually. Traditional recovery systems suffer from three critical points of failure:
1. **Siloed & Manipulable Registries:** Microchip databases are fragmented across proprietary vendors, slow to update across jurisdictions, and vulnerable to centralized record modification.
2. **Lost Pet Cash Reward Scams:** Traditional reward flyers rely on trust. Owners frequently fall victim to ransom extortion or fraudulent claims where scammers demand advance payment before handing over the pet.
3. **Unverified Proof-of-Recovery:** Finders hesitate to spend time securing animals because there is no cryptographically guaranteed escrow ensuring that promised rewards will actually be disbursed.

---

## ⚡ 2. The Solana Solution: Immutable Identity & Trustless Escrow

ChainPaws solves this by combining **on-chain Program Derived Accounts (PDAs)** with **non-custodial SOL escrow vaults**:

* **Immutable Pet Identity PDAs:** Every pet's microchip ISO 11784 ID and physical characteristics are hashed via SHA-256 and bound to the owner's Solana public key at `["pet", owner_pubkey, chip_hash]`.
* **Trustless Micro-Bounties:** When a pet is reported missing, the owner deposits SOL into an Escrow PDA vault at `["bounty", pet_pda]`.
* **Guaranteed Settlement:** When a finder submits proof or a licensed clinic scans the collar tag, the smart contract transfers the escrowed bounty directly to the finder and safely resets the pet's status to `Safe`.

```
               [ Register Pet PDA ]
                       │
                       ▼
                ┌──────────────┐
                │    SAFE      │ ◄────────────────────────┐
                └──────┬───────┘                          │
                       │                                  │
           [ Report Lost + Deposit Bounty ]     [ Cancel / Pet Found ]
                       │                                  │
                       ▼                                  │
                ┌──────────────┐                          │
                │   MISSING    │ ─────────────────────────┘
                │ (Escrow Live)│
                └──────┬───────┘
                       │
             [ Confirm Recovery ]
             (Clinic / Owner Sign)
                       │
                       ▼
         ┌─────────────────────────────┐
         │ Bounty Disbursed to Finder  │
         │      Status -> SAFE         │
         └─────────────────────────────┘
```

---

## 🏛️ 3. Program Derived Account (PDA) Seeds

| Account Type | Seed Derivation | Stored Fields & Purpose |
| :--- | :--- | :--- |
| **`PetRecord`** | `["pet", owner_pubkey, chip_hash]` | `owner`, `chip_hash`, `species`, `name`, `breed`, `status` (`Safe` / `Missing`), `created_at` |
| **`BountyEscrow`** | `["bounty", pet_pda_pubkey]` | `pet_record`, `owner`, `bounty_amount` (lamports), `status` (`Active` / `Claimed` / `Refunded`) |
| **`ClinicRecord`** | `["clinic", clinic_authority]` | `authority`, `name`, `location`, `is_verified` (licensed vet authority) |

---

## 🛠️ 4. Tech Stack & Architecture

- **Smart Contracts:** Rust, Solana Anchor Framework `0.30.1` (`PAWS9q8W5aYh7YgA82bQJg7Xf8M3g9Z9123456789abc`)
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Canvas Confetti
- **Solana Client:** `@solana/web3.js`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets`
- **Identity Tags:** SVG/Canvas QR Generator for printable collar tags linking directly to on-chain Pet PDAs

---

## 🚀 5. Getting Started Locally

### Prerequisites
- Node.js `v20+` or `v22+`
- `pnpm` or `npm`
- Solana Phantom or Solflare wallet set to **Devnet**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Labreo/ChainPaws.git
cd ChainPaws

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 🧪 6. Testing & Falsification Auditing

### Anchor Unit & PDA Derivation Tests
```bash
npx ts-node anchor/tests/chainpaws.ts
```

### Interactive Judges Falsification Engine
Visit the **Trust Inspector** tab in the UI to run live adversarial probes:
1. **Unauthorized Drain Intercept:** Proves third parties cannot withdraw escrow funds without owner/clinic signatures.
2. **Microchip Collision Probe:** Proves 256-bit entropy separation across microchip hashes.
3. **Rent Reclamation Test:** Proves closing the escrow account refunds all rent lamports.
4. **Non-Custodial Refund Guarantee:** Proves owners can cancel missing alerts and reclaim 100% of deposited SOL.

---

## 📄 License
MIT © 2026 ChainPaws Team
