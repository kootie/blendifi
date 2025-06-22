# Stellar DeFi Hub Whitepaper

## System Overview

Stellar DeFi Hub is a decentralized finance platform built on the Stellar blockchain, designed to provide seamless asset swaps, lending and borrowing through Blend pools, and staking rewards. The system leverages Soroban smart contracts for all DeFi logic, ensuring transparency, security, and composability. Users interact with the platform via a modern React frontend, connecting securely through the Freighter wallet extension.

### Key Components
- **Soroban Smart Contract**: Implements all DeFi logic (swap, supply, borrow, stake, rewards, health factor, price feeds).
- **Frontend (React/TypeScript)**: User interface for all DeFi actions, portfolio analytics, and wallet management.
- **Freighter Wallet**: Secure browser extension for Stellar account management and transaction signing.
- **External Integrations**: Soroswap for swaps, Blend Pool Factory for lending pools, DIA Oracle for price feeds.

## Core Functions

### 1. Swap
**Purpose:** Instantly exchange one supported asset for another using Soroswap liquidity pools, with protocol fee collection.

**How it works:**
- User selects source and destination assets and inputs the amount to swap.
- The frontend calls the `swap_tokens` method on the Soroban contract, passing user address, asset addresses, amount, minimum output, and deadline.
- The contract:
  - Validates asset support and deadline.
  - Calculates and deducts protocol fee.
  - Transfers input tokens from the user to the contract.
  - Calls Soroswap router to perform the swap.
  - Adds protocol fee to the reward pool.
  - Transfers output tokens to the user.
  - Emits a swap event for analytics.

### 2. Supply (Lend)
**Purpose:** Supply assets to Blend lending pools to earn yield and receive bTokens representing your position.

**How it works:**
- User selects an asset and amount to supply.
- The frontend calls `supply_to_blend` on the contract with user address, asset, and amount.
- The contract:
  - Validates asset support.
  - Gets or creates the Blend pool for the asset.
  - Transfers the asset from the user to the contract.
  - Supplies the asset to the Blend pool and receives bTokens.
  - Updates the user's supply position.
  - Transfers bTokens to the user.
  - Emits a supply event.

### 3. Borrow
**Purpose:** Borrow supported assets from Blend pools using supplied assets as collateral, with health factor enforcement.

**How it works:**
- User selects an asset and amount to borrow.
- The frontend calls `borrow_from_blend` on the contract with user address, asset, and amount.
- The contract:
  - Validates asset support.
  - Calculates the user's health factor (collateral/debt ratio) including the new borrow.
  - Ensures health factor is above the minimum threshold (e.g., 120%).
  - Gets the Blend pool for the asset.
  - Borrows the asset from the pool.
  - Updates the user's borrow position.
  - Transfers the borrowed asset to the user.
  - Emits a borrow event.

### 4. Stake
**Purpose:** Stake bTokens to earn a share of protocol fees and rewards, incentivizing long-term participation.

**How it works:**
- User selects a bToken and amount to stake.
- The frontend calls `stake_btokens` on the contract with user address, bToken, and amount.
- The contract:
  - Transfers bTokens from the user to the contract.
  - Updates user rewards before changing the stake.
  - Updates the user's staking position and the staking pool state.
  - Emits a stake event.

### 5. Unstake & Claim
**Purpose:** Unstake bTokens and claim accumulated rewards.

**How it works:**
- User selects a bToken and amount to unstake.
- The frontend calls `unstake_and_claim` on the contract.
- The contract:
  - Updates user rewards.
  - Calculates claimable rewards.
  - Updates staking positions and pool state.
  - Transfers bTokens and rewards to the user.
  - Emits an unstake event.

## Security & Risk Management
- **Health Factor Enforcement:** Ensures users cannot borrow beyond safe collateralization, reducing liquidation risk.
- **Oracle & DEX Price Feeds:** Multiple price sources (DIA, DEX, admin, mock) for robust asset valuation.
- **Protocol Fees:** Collected on swaps and distributed as staking rewards.
- **Event Emission:** All actions emit events for transparency and analytics.

## Conclusion
Stellar DeFi Hub provides a secure, composable, and user-friendly DeFi experience on Stellar, supporting swaps, lending, borrowing, and staking with real-time analytics and robust risk controls. All logic is on-chain via Soroban smart contracts, and the frontend is optimized for usability and transparency. 