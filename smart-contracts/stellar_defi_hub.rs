#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, IntoVal,
    Address, Env, String, Vec, Map
};

/// Blend pool structure for lending/borrowing
#[contracttype]
pub struct BlendPool {
    pub pool_id: Address,
    pub underlying_asset: Address,
    pub reserve_asset: Address, // blended token (bToken)
}

/// User position tracking for lending, borrowing, staking, and rewards
#[contracttype]
pub struct UserPosition {
    pub supplied_assets: Map<Address, u128>,
    pub borrowed_assets: Map<Address, u128>,
    pub staked_lp_tokens: Map<Address, u128>,
    pub rewards_earned: u128,
    pub last_reward_update: u64,
}

/// Staking pool for rewards
#[contracttype]
pub struct StakingPool {
    pub total_staked: u128,
    pub reward_rate: u128,
    pub last_update_time: u64,
    pub reward_per_token_stored: u128,
    pub total_rewards_distributed: u128,
}

/// Asset configuration
#[contracttype]
pub struct AssetConfig {
    pub address: Address,
    pub symbol: String,
    pub decimals: u32,
    pub collateral_factor: u128,
    pub is_collateral: bool,
    pub dia_symbol: String,
}

/// Error types for the DeFi hub
#[contracttype]
pub enum HubError {
    OracleFailure = 1,
    InsufficientLiquidity = 2,
    InvalidAsset = 3,
    PriceStale = 4,
    PoolNotFound = 5,
    InsufficientCollateral = 6,
    AssetNotSupported = 7,
    SwapFailed = 8,
    NotAdmin = 9,
    NotLiquidatable = 10,
}

#[contract]
pub struct StellarDeFiHub;

const PROTOCOL_FEE: u128 = 50;
const MAX_PRICE_AGE: u64 = 3600;
const LIQUIDATION_THRESHOLD: u128 = 8000;
const SECONDS_PER_DAY: u64 = 86400;

const BLEND_POOL_FACTORY: &str = "CDEVVU3G2CFH6LJQG6LLSCSIU2BNRWDSJMDA44OA64XFV4YNWG7T22IU";
const SOROSWAP_ROUTER: &str = "CAALXMGZL3JZHGXCPTJ2YFWYQN2F4CLHAKBLMGNR42XQNBTADSFQJCZD";
const DIA_ORACLE_TESTNET: &str = "CAEDPEZDRCEJCF73ASC5JGNKCIJDV2QJQSW6DJ6B74MYALBNKCJ5IFP4";

/// Oracle configuration
#[contracttype]
pub struct DIAOracleConfig {
    pub oracle_address: Address,
    pub max_price_age: u64,
    pub price_precision: u128,
}

/// DIA price data
#[contracttype]
pub struct DIAPriceData {
    pub price: u128,
    pub timestamp: u64,
    pub round_id: u64,
}

#[contractimpl]
impl StellarDeFiHub {
    /// Initialize the DeFi Hub with admin and oracle config
    pub fn initialize(env: Env, admin: Address) -> Result<(), HubError> {
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        let oracle_config = DIAOracleConfig {
            oracle_address: Address::from_string(&String::from_str(&env, DIA_ORACLE_TESTNET)),
            max_price_age: MAX_PRICE_AGE,
            price_precision: 100_000_000,
        };
        env.storage().instance().set(&symbol_short!("oracle"), &oracle_config);
        env.storage().instance().set(&symbol_short!("init"), &true);
        Ok(())
    }

    /// Add a supported asset (admin only)
    pub fn add_supported_asset(env: Env, admin: Address, config: AssetConfig) -> Result<(), HubError> {
        Self::require_admin(&env, &admin)?;
        let mut assets: Map<u32, AssetConfig> = env.storage().instance().get(&symbol_short!("assets")).unwrap_or(Map::new(&env));
        let next_id = assets.len();
        assets.set(next_id, config);
        env.storage().instance().set(&symbol_short!("assets"), &assets);
        Ok(())
    }

    /// Remove a supported asset (admin only)
    pub fn remove_supported_asset(env: Env, admin: Address, asset_id: u32) -> Result<(), HubError> {
        Self::require_admin(&env, &admin)?;
        let mut assets: Map<u32, AssetConfig> = env.storage().instance().get(&symbol_short!("assets")).unwrap_or(Map::new(&env));
        assets.remove(asset_id);
        env.storage().instance().set(&symbol_short!("assets"), &assets);
        Ok(())
    }

    /// Update the oracle config (admin only)
    pub fn update_oracle_config(env: Env, admin: Address, config: DIAOracleConfig) -> Result<(), HubError> {
        Self::require_admin(&env, &admin)?;
        env.storage().instance().set(&symbol_short!("oracle"), &config);
        Ok(())
    }

    /// Example: Swap tokens (returns error on failure)
    pub fn swap_tokens(
        env: Env,
        user: Address,
        token_a: Address,
        token_b: Address,
        amount_in: u128,
        min_amount_out: u128,
        deadline: u64,
    ) -> Result<u128, HubError> {
        user.require_auth();
        if !Self::is_asset_supported(&env, &token_a)? {
            return Err(HubError::AssetNotSupported);
        }
        if !Self::is_asset_supported(&env, &token_b)? {
            return Err(HubError::AssetNotSupported);
        }
        if env.ledger().timestamp() > deadline {
            return Err(HubError::PriceStale);
        }
        // Calculate protocol fee
        let fee_amount = (amount_in * PROTOCOL_FEE) / 10000;
        let swap_amount = amount_in - fee_amount;
        // Transfer tokens from user to contract
        Self::transfer_from_user(&env, &token_a, &user, &env.current_contract_address(), amount_in);
        // Call Soroswap router to swap
        let amount_out = Self::execute_soroswap(&env, &token_a, &token_b, swap_amount, min_amount_out);
        // Add fee to reward pool
        Self::add_to_reward_pool(&env, &token_a, fee_amount);
        // Transfer swapped tokens to user
        Self::transfer_to_user(&env, &token_b, &user, amount_out);
        // Emit swap event (pseudo)
        // env.events().publish((symbol_short!("swap"), &user), (token_a, token_b, amount_in, amount_out, fee_amount));
        Ok(amount_out)
    }

    /// Calculate health factor (returns error on failure)
    pub fn calculate_health_factor(env: &Env, user: &Address, additional_borrow: Option<(Address, u128)>) -> Result<u128, HubError> {
        let position = Self::get_user_position(env.clone(), user.clone());
        let mut total_collateral_value = 0u128;
        let mut total_debt_value = 0u128;
        // Collateral value
        for (asset, amount) in position.supplied_assets.iter() {
            if let Some(price) = Self::get_asset_price_safe(env.clone(), asset.clone()) {
                let asset_config = Self::get_asset_config(env, &asset);
                if asset_config.is_collateral {
                    let collateral_value = (amount * price * asset_config.collateral_factor) /
                        (Self::get_price_precision(env, &asset) * 10000);
                    total_collateral_value += collateral_value;
                }
            }
        }
        // Debt value
        for (asset, amount) in position.borrowed_assets.iter() {
            if let Some(price) = Self::get_asset_price_safe(env.clone(), asset.clone()) {
                let debt_value = (amount * price) / Self::get_price_precision(env, &asset);
                total_debt_value += debt_value;
            }
        }
        // Add additional borrow if provided
        if let Some((borrow_asset, borrow_amount)) = additional_borrow {
            if let Some(price) = Self::get_asset_price_safe(env.clone(), borrow_asset.clone()) {
                let additional_debt = (borrow_amount * price) / Self::get_price_precision(env, &borrow_asset);
                total_debt_value += additional_debt;
            }
        }
        if total_debt_value == 0 {
            return Ok(u128::MAX);
        }
        Ok((total_collateral_value * 1_000_000) / total_debt_value)
    }

    /// Liquidate an undercollateralized user
    pub fn liquidate(env: Env, liquidator: Address, user: Address, repay_asset: Address, repay_amount: u128) -> Result<(), HubError> {
        // Check if user is undercollateralized
        let health = Self::calculate_health_factor(&env, &user, None)?;
        if health >= 1_000_000 {
            return Err(HubError::NotLiquidatable);
        }
        // Repay borrower's debt
        Self::transfer_from_user(&env, &repay_asset, &liquidator, &env.current_contract_address(), repay_amount);
        // Reduce user's debt
        let mut position = Self::get_user_position(env.clone(), user.clone());
        let prev_borrow = position.borrowed_assets.get(repay_asset.clone()).unwrap_or(0);
        let repay_final = repay_amount.min(prev_borrow);
        position.borrowed_assets.set(repay_asset.clone(), prev_borrow - repay_final);
        // Seize collateral (simplified: seize all supplied assets)
        for (collateral_asset, supplied) in position.supplied_assets.iter() {
            if supplied > 0 {
                Self::transfer_to_user(&env, &collateral_asset, &liquidator, supplied);
                position.supplied_assets.set(collateral_asset, 0);
            }
        }
        // Update user position
        Self::set_user_position(&env, &user, &position);
        // Emit liquidation event (pseudo)
        // env.events().publish((symbol_short!("liquidate"), &liquidator), (user, repay_asset, repay_final));
        Ok(())
    }

    /// Require admin helper
    fn require_admin(env: &Env, admin: &Address) -> Result<(), HubError> {
        let stored_admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        if *admin != stored_admin {
            return Err(HubError::NotAdmin);
        }
        Ok(())
    }

    /// Check if asset is supported
    fn is_asset_supported(env: &Env, asset: &Address) -> Result<bool, HubError> {
        let assets: Map<u32, AssetConfig> = env.storage().instance().get(&symbol_short!("assets")).unwrap_or(Map::new(env));
        for (_, config) in assets.iter() {
            if config.address == *asset {
                return Ok(true);
            }
        }
        Ok(false)
    }
}

// (Paste the full contract code here) 