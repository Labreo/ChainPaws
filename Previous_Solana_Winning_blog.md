# Stellamint: A message to the stars, and proof of the night you looked up

*Published on 12 Jul 2026 09:26:10 +0000*  
*Source URL: [https://dev.to/msadlok/stellamint-a-message-to-the-stars-and-proof-of-the-night-you-looked-up-109p](https://dev.to/msadlok/stellamint-a-message-to-the-stars-and-proof-of-the-night-you-looked-up-109p)*  
*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09)*

---

## What I Built

> When I was a kid I'd lie in the grass and wonder if someone, somewhere, was looking back.  
> This weekend I built the thing I wanted then.

The deepest human passion isn't a rivalry or a team — it's the oldest question we have: **are we alone, and can we reach out?**

**Stellamint** is a web app about two directions of that one passion for the cosmos:

- **Reach out** — write a message to a **real exoplanet**, watch how many years your words travel at lightspeed, see an **AI-painted vision of that world**, and keep the message on-chain — a crowdsourced Voyager Golden Record.
- **Look up** — mark *where you are* and *which real celestial event is overhead right now*. When the sky is genuinely open to you, mint an on-chain **proof of the moment**.

Both fill one personal **sky map** with achievement badges — and every mint flows into a shared **Collective Sky** dashboard.

**The goal:** turn "are we alone?" from a passive wonder into something you can *do* — reach out, look up, and keep a permanent, honest record of both.

---

## Demo

![Animated walkthrough of Stellamint: rendered exoplanet cards with distance and Earth-similarity data bars, then Gemini's AI-painted vision of the chosen world](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fhprzkca563cway8ypn2m.gif)

[![Stellamint Demo Video](https://img.youtube.com/vi/07mQKRZYIPU/maxresdefault.jpg)](https://www.youtube.com/watch?v=07mQKRZYIPU)

*Video Link:* [Watch on YouTube (07mQKRZYIPU)](https://www.youtube.com/watch?v=07mQKRZYIPU)

**Live app:** [https://stellamint.vercel.app](https://stellamint.vercel.app)

> **You need a wallet to mint.** Install [Phantom](https://phantom.app), switch it to **Devnet** (Settings → Developer Settings → Devnet), and grab free test SOL from [faucet.solana.com](https://faucet.solana.com). It's a test network — **no real money, no financial claims.**

**Try it in 30 seconds:**

1. **Reach out** → write a message, hear it in a *chorus of Earth* (many languages), tap **Envision this world** for an AI planet image, pick a target, **Transmit & mint**.
2. **Look up** → allow location (or pick a city), and **claim a proof** of what's above you.
3. **Your sky** → watch your constellation + badges fill up. **Collective Sky** → see what all of humanity is sending.

![A grey alien with glowing eyes gazing into a spiral galaxy, with ringed planets floating in deep space — the Stellamint home screen](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fn76u2s7fkv0e65glp29i.jpg)

![Stellamint's Reach Out screen: a message, the multilingual Chorus of Earth, and a Gemini-generated Arecibo-style pictogram with its interpretation](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fmol8ru61ho1tp5gzb4mz.jpg)

![Stellamint's exoplanet picker — rendered planets with distance and Earth-similarity bars — and an AI-painted vision of a world](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Ffpp0dui16oefuok9ox9c.jpg)

![Stellamint's Look Up screen showing Venus tagged Common and Jupiter tagged Rare, each with a Claim proof button](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fb3nsly6qc0ccxpq9qk2g.jpg)

---

## Code

[![GitHub logo](https://assets.dev.to/assets/github-logo-5a155e1f9a670af7944dd5e12375bc76ed542ea80224905ecaf878b9157cdefc.svg) **monsad / stellamint**](https://github.com/monsad/stellamint)

### 🌌 Stellamint

**A message to the stars, and proof of the night you looked up.**

Two directions of one passion for the cosmos, recorded on-chain:

- 🔭 **Look up** — mark *where you are* and *which real celestial event is overhead right now* (a planet, the Moon, a meteor shower). When the sky is genuinely open to you, mint an on-chain **proof of the moment**. A logbook of the nights you actually looked up.
- 🛰️ **Reach out** — write a message to a **real exoplanet**, watch how many years your words travel at lightspeed, and keep it on-chain — a crowdsourced Voyager Golden Record.

Both fill one personal **sky map**, read straight from the blockchain.

> Built for the [DEV Weekend Challenge: Passion Edition](https://dev.to/devteam).

🌐 **Live:** [https://stellamint.vercel.app](https://stellamint.vercel.app)  
💻 **Runs on Solana devnet** — no real money, no financial claims.

[View on GitHub](https://github.com/monsad/stellamint)

---

## How I Built It

Next.js (App Router) on Vercel, TypeScript, Tailwind. TDD throughout — 25 unit tests over the pure logic; `tsc` clean, production build green, live mint verified end-to-end.

- **Solana** — the chain **is** the product. Every message and proof is an [mpl-core](https://developers.metaplex.com/core) asset on devnet, with **no database at all** — your wallet's on-chain assets *are* your collection, and the sky map is rendered purely by reading them back. A Solana tx caps at 1232 bytes, so the on-chain `uri` carries a **compact ~150-byte seed** and the server rebuilds full metadata + image from it.
- **Snowflake** — every mint fire-and-forgets into Snowflake (`VARIANT` + `PARSE_JSON`) as a public data lake. The **Collective Sky** dashboard reads it back (total light-years in flight, most-messaged worlds, recent whispers) and powers **Witness Together**. The app stays no-DB; Snowflake is the *collective* layer over on-chain data.
- **Google Gemini** — encodes your message into an **Arecibo-style pictogram** and writes a one-line **interpretation of how an alien might read it**.
- **ElevenLabs** — the Voyager Golden Record carried greetings in **55 human languages**, so Stellamint speaks your message back in a **chorus of Earth**.
- **The gamification** — *Look Up* is a game to catch the sky:
  - **Rarity** — a body high overhead is **Common**; one barely above the horizon is a **Legendary** catch.
  - **Witness Together** — Snowflake tells you *"you're one of N who witnessed this."* Not *my* sky — *our* sky.
  - **Badges** — First Contact, Stargazer, Constellation, Voice of Earth, Sky Collector. Collect the sky.

**What makes it different (and honest):**
- **Not "buy a star."** Nothing fake is sold; every artifact is a real, honest on-chain record.
- **Not just a sky viewer.** Others show the sky — Stellamint turns it into a **collective, on-chain, gamified** record of humanity looking up *together*.
- **Honest by design.** Proof of Sky attests the *opportunity to observe* (real ephemeris math), not that you literally looked — and says so.
- **Four sponsor techs, each essential** to one story, not bolted on.

---

## Prize Categories

- **Best Use of Solana** — no-database, on-chain-as-source-of-truth; compact-seed metadata.
- **Best Use of Snowflake** — the Collective Sky data lake + Witness Together.
- **Best Use of Google AI** — Gemini Arecibo encoding + alien interpretation.
- **Best Use of ElevenLabs** — the multilingual Chorus of Earth.

---

*Thanks for reading — this one was built out of pure love for the night sky. If you're out there: this one's for you.*

`#devchallenge` `#weekendchallenge` `#solana` `#snowflake`