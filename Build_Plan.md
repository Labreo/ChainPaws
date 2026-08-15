# Project Blueprint: ChainPaws — Decentralized Pet Registry & Escrow Recovery Network

## 1. Project Overview & Value Proposition

* **Concept:** A decentralized, tamper-proof pet identification registry and trustless lost-and-found escrow protocol built on Solana.
* **Core Problem:** Millions of household pets go missing or are stolen annually. Centralized pet microchip registries are siloed, non-interoperable across regions, slow to update, and vulnerable to data manipulation. Furthermore, traditional "lost pet cash rewards" suffer from trust issues, scams, and lack of verified proof-of-recovery.
* **Solana Solution:**
* **Immutable Identity:** Pet microchip IDs and owner credentials are bound on-chain as Program Derived Accounts (PDAs).
* **Trustless Micro-Bounties:** Owners report a pet missing and lock a SOL bounty directly into an on-chain escrow vault.
* **Verified Settlement:** When a pet is scanned by an authorized shelter/vet or confirmed by the owner, the smart contract automatically releases the escrowed funds to the finder without intermediaries.


* **Target Prize Category:** **Best use of Solana** (DEV Weekend Challenge: Dog Days Edition).

---

## 2. Technical Architecture & State Machine

### System Architecture Overview

The system consists of three distinct layers:

1. **Solana On-Chain Program (Devnet):** Manages pet registrations, state transitions (`Safe` $\leftrightarrow$ `Lost`), and escrow vault logic.
2. **Decentralized Metadata Storage:** Pet photos, descriptions, and medical notes stored via Arweave or IPFS (or mock CID hashes on Devnet).
3. **Client Application (Next.js / Tailwind CSS):** Web interface integrated with `@solana/wallet-adapter` for owners, finders, and shelter verifiers.

---

### Data Models & Program Derived Accounts (PDAs)

| Account Type | Seed Derivation | Stored Fields & Metadata | Purpose |
| --- | --- | --- | --- |
| **Pet Record PDA** | `["pet", owner_pubkey, chip_hash]` | • Owner Public Key (`Pubkey`)<br>

<br>• Chip/Tag Hash (`[u8; 32]`)<br>

<br>• Species (`Dog` / `Cat`)<br>

<br>• Metadata URI (`String`)<br>

<br>• Current Status (`Safe` | `Missing`)<br>

<br>• Timestamp (`i64`) | Stores permanent, tamper-proof pet identity and current status. |
| **Bounty Escrow PDA** | `["bounty", pet_pda_pubkey]` | • Pet PDA Address (`Pubkey`)<br>

<br>• Bounty Amount in Lamports (`u64`)<br>

<br>• Escrow Bump (`u8`)<br>

<br>• Status (`Active` | `Claimed` | `Refunded`) | Holds the locked bounty reward in SOL securely until valid release. |
| **Verified Clinic Registry PDA** *(Optional/Mocked)* | `["clinic", clinic_pubkey]` | • Clinic Name (`String`)<br>

<br>• Verification Status (`bool`) | Grants authority to verify microchip scans and trigger bounty release. |

---

### Protocol State Machine

```
               [ Register Pet ]
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

## 3. Core Workflows

### Workflow A: Pet Registration

1. Pet owner connects their Solana wallet (Phantom or Solflare) on Devnet.
2. Owner inputs: Pet Name, Species (Dog/Cat), Breed, Distinctive Features, Photo, and Microchip/Collar Tag ID.
3. Client hashes the Microchip ID and derives the **Pet Record PDA**.
4. Transaction initializes the PDA account on Solana Devnet with status set to `Safe`.

### Workflow B: Reporting Missing & Locking Bounty

1. Owner opens their registered pet dashboard and toggles status to `Report Missing`.
2. Owner sets a bounty reward (e.g., `0.5 SOL`).
3. Transaction simultaneously:
* Updates Pet PDA status from `Safe` to `Missing`.
* Creates the **Bounty Escrow PDA**.
* Transfers `0.5 SOL` from the owner's wallet into the Escrow PDA.


4. The pet immediately appears on the public "Lost Dogs & Cats" live board.

### Workflow C: Pet Recovery & Bounty Payout

1. A finder spots the missing animal and scans the QR collar tag or brings the animal to a partner clinic.
2. The finder submits a recovery claim containing their wallet address.
3. The owner (or verified clinic) confirms identity match.
4. Transaction executes the release instruction:
* Empties the Escrow PDA lamports directly to the finder's wallet address.
* Closes the Escrow PDA account to reclaim rent.
* Toggles the Pet PDA status back to `Safe`.



---

## 4. 36-Hour Hackathon Implementation Timeline

| Time Block | Milestone | Core Objectives & Deliverables |
| --- | --- | --- |
| **Hours 0 – 8** *(Saturday Night)* | **Smart Contract & Local Env** | • Set up Anchor workspace configured for Solana Devnet.<br>

<br>• Implement instruction handlers: `register_pet`, `report_lost`, `cancel_bounty`, `claim_bounty`.<br>

<br>• Write local integration tests verifying account creation and lamport transfers. |
| **Hours 8 – 16** *(Sunday Morning)* | **Contract Deployment & Testing** | • Build and deploy program to **Solana Devnet**.<br>

<br>• Record deployed Program ID and verify PDA seed schemas.<br>

<br>• Confirm airdrop/faucet funding works smoothly for test wallets. |
| **Hours 16 – 26** *(Sunday Afternoon)* | **Frontend Development** | • Scaffold Next.js application with Tailwind CSS and `@solana/wallet-adapter-react`.<br>

<br>• Build 3 core views: **Public Missing Board**, **Register Pet Form**, and **My Pets Dashboard**.<br>

<br>• Connect frontend buttons to Anchor program instructions using Provider and Wallet signer. |
| **Hours 26 – 32** *(Sunday Evening)* | **End-to-End Integration & Polish** | • Run full lifecycle test: Register $\rightarrow$ Mark Lost (Escrow) $\rightarrow$ Claim Bounty $\rightarrow$ Funds Received.<br>

<br>• Add Solana Explorer transaction links to the UI for transparent proof.<br>

<br>• Style UI with responsive pet cards, badges, and status tags. |
| **Hours 32 – 36** *(Monday Early AM)* | **Demo Recording & DEV Submission** | • Record a 2-minute video walkthrough (Loom or YouTube) demonstrating the wallet transactions and escrow payout.<br>

<br>• Take screenshots of Devnet Explorer transactions.<br>

<br>• Write and publish the DEV post using the official `#weekendchallenge` template. |

---

## 5. Frontend UI/UX Structure

* **Top Navigation Bar:**
* App Branding (`ChainPaws 🐾`).
* Network Indicator (`Solana Devnet` badge).
* `WalletMultiButton` connection component.


* **View 1: Community Missing Pets Radar (Home Page)**
* Grid of missing animals showing photo, name, species, last seen location, and **Active Bounty in SOL**.
* Filter by species (`Dogs`, `Cats`, `All`).
* "I Found This Pet" button triggering a claim modal.


* **View 2: Register New Companion**
* Form for pet details: Name, Breed, Microchip/Tag ID, Image URL.
* Direct "Mint Identity on Solana" transaction trigger.


* **View 3: Owner Management Console**
* Card view of all pets owned by the connected wallet.
* Quick-action buttons: `Report Lost` (opens bounty input modal), `Cancel Alert`, or `Confirm Return`.
* Real-time escrow balance indicator.



---

## 6. DEV Community Submission Post Blueprint

When writing the final submission post on DEV, follow this structure to maximize judging scores:

* **Title:** `ChainPaws: Stopping Lost Pet Scams with Solana Escrow & Tamper-Proof Registries 🐕🐈`
* **Tags:** `#weekendchallenge`, `#solana`, `#web3`, `#showdev`
* **Section 1: The Inspiration:**
* Highlight the emotional pain of missing pets, pet theft, and how conventional reward flyers often lead to scams or go unpaid.
* Mention how the project was built for the DEV Dog Days Challenge to protect dogs and the cats who live with them.


* **Section 2: What We Built:**
* High-level architectural breakdown of the on-chain registry and escrow protocol.


* **Section 3: Why Solana Was the Only Viable Chain:**
* Emphasize that everyday pet owners cannot afford $10 gas fees just to register a pet.
* Solana's sub-second finality and sub-cent fees enable micro-bounties and instant status updates.


* **Section 4: Technical Deep Dive & State Architecture:**
* Explain the PDA structure (`["pet", ...]` and `["bounty", ...]`).
* Outline how the escrow program guarantees that funds cannot be stolen or locked indefinitely.


* **Section 5: Demo & Devnet Proof:**
* Embed 2-minute Loom/YouTube demo video.
* Provide Solana Devnet Explorer links for the Program ID and sample Escrow Settlement transactions.


* **Section 6: What's Next:**
* Physical NFC smart collars that automatically trigger Solana wallet lookups upon smartphone tap.
* DAO-governed community shelter funding pools.



---

## 7. Hackathon Guardrails & Speed Shortcuts

* **Avoid Metaplex Complexity:** Do not spend hours setting up complex NFT metadata programs or candy machines. Use standard Anchor Program Derived Accounts (PDAs) with basic string metadata for speed and reliability.
* **Use Devnet Faucets:** Ensure all demo instructions and video clips use Solana Devnet test SOL so no real capital is required.
* **Mock Clinic Whitelisting:** For the hackathon demo, allow the pet owner wallet to self-verify the return of the pet or use a simple hardcoded "Clinic Test Wallet" to demonstrate third-party verification.
* **Direct Explorer Linking:** Always surface a direct link to `[https://explorer.solana.com/tx/](https://explorer.solana.com/tx/)[signature]?cluster=devnet` in your UI toast notifications—judges love immediate, verifiable on-chain proof.