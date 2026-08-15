use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("GnEv5qz2xufNJqsqbkBvmgAa6ByWEmnygN6zayJ1SD8h");

#[program]
pub mod chainpaws {
    use super::*;

    /// Registers a new pet identity on Solana.
    /// Creates an immutable PetRecord PDA derived from [b"pet", owner, chip_hash].
    pub fn register_pet(
        ctx: Context<RegisterPet>,
        chip_hash: [u8; 32],
        species: u8,
        name: String,
        breed: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(name.len() <= 64, ChainPawsError::NameTooLong);
        require!(breed.len() <= 64, ChainPawsError::BreedTooLong);
        require!(metadata_uri.len() <= 256, ChainPawsError::UriTooLong);

        let pet = &mut ctx.accounts.pet_record;
        pet.owner = ctx.accounts.owner.key();
        pet.chip_hash = chip_hash;
        pet.species = species;
        pet.name = name.clone();
        pet.breed = breed.clone();
        pet.metadata_uri = metadata_uri.clone();
        pet.status = PetStatus::Safe as u8;
        pet.created_at = Clock::get()?.unix_timestamp;
        pet.bump = ctx.bumps.pet_record;

        emit!(PetRegisteredEvent {
            pet_pda: pet.key(),
            owner: pet.owner,
            chip_hash,
            species,
            name,
            breed,
            metadata_uri,
            timestamp: pet.created_at,
        });

        Ok(())
    }

    /// Transitions a pet's status to Missing and locks SOL bounty into an Escrow PDA.
    pub fn report_lost(ctx: Context<ReportLost>, bounty_lamports: u64) -> Result<()> {
        require!(bounty_lamports > 0, ChainPawsError::InvalidBountyAmount);
        let pet = &mut ctx.accounts.pet_record;
        require!(pet.status == PetStatus::Safe as u8, ChainPawsError::PetAlreadyMissing);

        // Update pet status to Missing
        pet.status = PetStatus::Missing as u8;

        // Initialize bounty escrow state
        let escrow = &mut ctx.accounts.bounty_escrow;
        escrow.pet_record = pet.key();
        escrow.owner = ctx.accounts.owner.key();
        escrow.bounty_amount = bounty_lamports;
        escrow.status = BountyStatus::Active as u8;
        escrow.bump = ctx.bumps.bounty_escrow;
        escrow.created_at = Clock::get()?.unix_timestamp;

        // Transfer bounty SOL from owner to Escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.bounty_escrow.to_account_info(),
            },
        );
        transfer(cpi_context, bounty_lamports)?;

        emit!(PetReportedLostEvent {
            pet_pda: pet.key(),
            owner: pet.owner,
            bounty_escrow: escrow.key(),
            bounty_lamports,
            timestamp: escrow.created_at,
        });

        Ok(())
    }

    /// Cancels a missing alert and refunds the escrowed bounty back to the pet owner.
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let pet = &mut ctx.accounts.pet_record;
        let escrow = &mut ctx.accounts.bounty_escrow;

        require!(pet.status == PetStatus::Missing as u8, ChainPawsError::PetNotMissing);
        require!(escrow.status == BountyStatus::Active as u8, ChainPawsError::BountyNotActive);

        // Reset pet status to Safe
        pet.status = PetStatus::Safe as u8;
        escrow.status = BountyStatus::Refunded as u8;

        emit!(BountyCancelledEvent {
            pet_pda: pet.key(),
            owner: pet.owner,
            refunded_lamports: escrow.bounty_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        // Account lamports are refunded and account closed automatically via close constraint
        Ok(())
    }

    /// Disburses the escrowed bounty to the finder upon verified recovery and closes escrow PDA.
    pub fn claim_bounty(ctx: Context<ClaimBounty>) -> Result<()> {
        let pet = &mut ctx.accounts.pet_record;
        let escrow = &mut ctx.accounts.bounty_escrow;

        require!(pet.status == PetStatus::Missing as u8, ChainPawsError::PetNotMissing);
        require!(escrow.status == BountyStatus::Active as u8, ChainPawsError::BountyNotActive);

        let payout_amount = escrow.bounty_amount;

        // Reset pet status to Safe
        pet.status = PetStatus::Safe as u8;
        escrow.status = BountyStatus::Claimed as u8;

        emit!(BountyClaimedEvent {
            pet_pda: pet.key(),
            owner: pet.owner,
            finder: ctx.accounts.finder.key(),
            bounty_amount: payout_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        // The close constraint transfers remaining balance + rent to the finder.
        Ok(())
    }

    /// Registers a verified clinic/shelter authority PDA.
    pub fn register_clinic(ctx: Context<RegisterClinic>, name: String, location: String) -> Result<()> {
        require!(name.len() <= 64, ChainPawsError::NameTooLong);
        require!(location.len() <= 128, ChainPawsError::UriTooLong);

        let clinic = &mut ctx.accounts.clinic_record;
        clinic.authority = ctx.accounts.clinic_authority.key();
        clinic.name = name.clone();
        clinic.location = location;
        clinic.is_verified = true;
        clinic.bump = ctx.bumps.clinic_record;

        emit!(ClinicRegisteredEvent {
            clinic_pda: clinic.key(),
            authority: clinic.authority,
            name,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// ----------------------------------------------------------------------------
// ACCOUNTS & CONSTRAINTS
// ----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(chip_hash: [u8; 32])]
pub struct RegisterPet<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + PetRecord::INIT_SPACE,
        seeds = [b"pet", owner.key().as_ref(), chip_hash.as_ref()],
        bump
    )]
    pub pet_record: Account<'info, PetRecord>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReportLost<'info> {
    #[account(
        mut,
        has_one = owner @ ChainPawsError::Unauthorized,
    )]
    pub pet_record: Account<'info, PetRecord>,

    #[account(
        init,
        payer = owner,
        space = 8 + BountyEscrow::INIT_SPACE,
        seeds = [b"bounty", pet_record.key().as_ref()],
        bump
    )]
    pub bounty_escrow: Account<'info, BountyEscrow>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(
        mut,
        has_one = owner @ ChainPawsError::Unauthorized,
    )]
    pub pet_record: Account<'info, PetRecord>,

    #[account(
        mut,
        seeds = [b"bounty", pet_record.key().as_ref()],
        bump = bounty_escrow.bump,
        close = owner
    )]
    pub bounty_escrow: Account<'info, BountyEscrow>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimBounty<'info> {
    #[account(
        mut,
        has_one = owner @ ChainPawsError::Unauthorized,
    )]
    pub pet_record: Account<'info, PetRecord>,

    #[account(
        mut,
        seeds = [b"bounty", pet_record.key().as_ref()],
        bump = bounty_escrow.bump,
        close = finder
    )]
    pub bounty_escrow: Account<'info, BountyEscrow>,

    /// Pet owner signing off on the recovery release
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: The finder receiving the bounty reward funds
    #[account(mut)]
    pub finder: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterClinic<'info> {
    #[account(
        init,
        payer = clinic_authority,
        space = 8 + ClinicRecord::INIT_SPACE,
        seeds = [b"clinic", clinic_authority.key().as_ref()],
        bump
    )]
    pub clinic_record: Account<'info, ClinicRecord>,

    #[account(mut)]
    pub clinic_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------------------------
// STATE STRUCTURES
// ----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PetStatus {
    Safe = 0,
    Missing = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BountyStatus {
    Active = 0,
    Claimed = 1,
    Refunded = 2,
}

#[account]
#[derive(InitSpace)]
pub struct PetRecord {
    pub owner: Pubkey,            // 32
    pub chip_hash: [u8; 32],      // 32
    pub species: u8,              // 1 (0: Dog, 1: Cat, 2: Other)
    #[max_len(64)]
    pub name: String,             // 4 + 64
    #[max_len(64)]
    pub breed: String,            // 4 + 64
    #[max_len(256)]
    pub metadata_uri: String,     // 4 + 256
    pub status: u8,               // 1 (0: Safe, 1: Missing)
    pub created_at: i64,          // 8
    pub bump: u8,                 // 1
}

#[account]
#[derive(InitSpace)]
pub struct BountyEscrow {
    pub pet_record: Pubkey,       // 32
    pub owner: Pubkey,            // 32
    pub bounty_amount: u64,       // 8
    pub status: u8,               // 1 (0: Active, 1: Claimed, 2: Refunded)
    pub created_at: i64,          // 8
    pub bump: u8,                 // 1
}

#[account]
#[derive(InitSpace)]
pub struct ClinicRecord {
    pub authority: Pubkey,        // 32
    #[max_len(64)]
    pub name: String,             // 4 + 64
    #[max_len(128)]
    pub location: String,         // 4 + 128
    pub is_verified: bool,        // 1
    pub bump: u8,                 // 1
}

// ----------------------------------------------------------------------------
// EVENTS & ERRORS
// ----------------------------------------------------------------------------

#[event]
pub struct PetRegisteredEvent {
    pub pet_pda: Pubkey,
    pub owner: Pubkey,
    pub chip_hash: [u8; 32],
    pub species: u8,
    pub name: String,
    pub breed: String,
    pub metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct PetReportedLostEvent {
    pub pet_pda: Pubkey,
    pub owner: Pubkey,
    pub bounty_escrow: Pubkey,
    pub bounty_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct BountyCancelledEvent {
    pub pet_pda: Pubkey,
    pub owner: Pubkey,
    pub refunded_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct BountyClaimedEvent {
    pub pet_pda: Pubkey,
    pub owner: Pubkey,
    pub finder: Pubkey,
    pub bounty_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClinicRegisteredEvent {
    pub clinic_pda: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[error_code]
pub enum ChainPawsError {
    #[msg("Pet is already reported missing.")]
    PetAlreadyMissing,
    #[msg("Pet is not currently reported missing.")]
    PetNotMissing,
    #[msg("Unauthorized signer for this pet record.")]
    Unauthorized,
    #[msg("Bounty amount must be greater than zero.")]
    InvalidBountyAmount,
    #[msg("Bounty escrow is not currently active.")]
    BountyNotActive,
    #[msg("Pet name exceeds maximum length.")]
    NameTooLong,
    #[msg("Pet breed exceeds maximum length.")]
    BreedTooLong,
    #[msg("Metadata URI exceeds maximum length.")]
    UriTooLong,
}
