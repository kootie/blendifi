#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, IntoVal,
    Address, Env, String, Vec, Map
};

// User position tracking with health factor
#[contracttype]
pub struct UserPosition {
    pub supplied_assets: Map<Address, u128>, // asset -> amount supplied to Blend
    pub borrowed_assets: Map<Address, u128>, // asset -> amount borrowed from Blend
    pub staked_blend: u128, // Only BLEND can be staked
    pub rewards_earned: u128,
    pub last_reward_update: u64,
    pub health_factor: u128, // Scaled by 1e18 (1.0 = 1e18)
    pub liquidation_threshold: u128, // User-specific liquidation threshold
}

// Blend staking pool (for BLEND token only)
#[contracttype]
pub struct BlendStakingPool {
    pub total_staked: u128,
    pub reward_rate: u128, // rewards per second per token staked
    pub last_update_time: u64,
    pub reward_per_token_stored: u128,
    pub total_rewards_distributed: u128,
}

// Asset configuration with testnet addresses
#[contracttype]
pub struct AssetConfig {
    pub address: Address,
    pub symbol: String,
    pub decimals: u32,
    pub is_active: bool,
    pub ltv_ratio: u32, // Loan-to-value ratio in basis points
    pub reserve_index: u32, // Blend's reserve index
    pub liquidation_bonus: u32, // Bonus for liquidators in basis points
}

// Fixed exchange rates for DEX simulation
#[contracttype]
pub struct ExchangeRate {
    pub from_asset: Address,
    pub to_asset: Address,
    pub rate: u128, // Rate scaled by 1e18
    pub last_update: u64,
}

// Liquidation protection settings
#[contracttype]
pub struct LiquidationProtection {
    pub enabled: bool,
    pub auto_repay_threshold: u128, // Health factor threshold for auto-repayment
    pub max_repay_percentage: u32, // Max percentage of debt to repay automatically
    pub protection_fee: u32, // Fee for liquidation protection service
}

// Blend Request struct
#[contracttype]
pub struct BlendRequest {
    pub request_type: u32,
    pub address: Address,
    pub amount: i128,
}

// Health factor status
#[contracttype]
pub enum HealthStatus {
    Healthy = 0,    // > 1.15
    Warning = 1,    // 1.03 - 1.15  
    Critical = 2,   // 1.0 - 1.03
    Liquidatable = 3, // < 1.0
}

#[contracttype]
pub enum HubError {
    NotInitialized = 1,
    Unauthorized = 2,
    InvalidAsset = 3,
    InsufficientBalance = 4,
    SwapFailed = 5,
    BlendError = 6,
    InvalidAmount = 7,
    UnhealthyPosition = 8,
    PoolFrozen = 9,
    OnlyBlendStakeable = 10,
    PriceOracleError = 11,
    LiquidationProtectionFailed = 12,
}

#[contract]
pub struct StellarDeFiHub;

const PROTOCOL_FEE: u128 = 50; // 0.5% (50 basis points)
const SECONDS_PER_DAY: u64 = 86400;
const HEALTH_FACTOR_SCALE: u128 = 1_000_000_000_000_000_000; // 1e18
const MIN_HEALTH_FACTOR: u128 = 1_030_000_000_000_000_000; // 1.03 * 1e18
const LIQUIDATION_THRESHOLD: u128 = 1_000_000_000_000_000_000; // 1.0 * 1e18
const AUTO_REPAY_THRESHOLD: u128 = 1_050_000_000_000_000_000; // 1.05 * 1e18
const PRICE_SCALE: u128 = 1_000_000_000_000_000_000; // 1e18

#[contractimpl]
impl StellarDeFiHub {
    
    /// Initialize the DeFi Hub with testnet addresses including oracle mock
    pub fn initialize(
        env: Env, 
        admin: Address,
    ) {
        admin.require_auth();
        
        // Testnet addresses from Blend config
        let blend_pool = Address::from_string(&String::from_str(&env, "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"));
        let backstop = Address::from_string(&String::from_str(&env, "CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV"));
        let oracle_mock = Address::from_string(&String::from_str(&env, "CCYHURAC5VTN2ZU663UUS5F24S4GURDPO4FHZ75JLN5DMLRTLCG44H44"));
        
        // Store configuration
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("blend"), &blend_pool);
        env.storage().instance().set(&symbol_short!("backstop"), &backstop);
        env.storage().instance().set(&symbol_short!("oracle"), &oracle_mock);
        env.storage().instance().set(&symbol_short!("init"), &true);
        
        // Initialize default assets from testnet
        Self::initialize_testnet_assets(&env);
        
        // Initialize fixed exchange rates
        Self::initialize_exchange_rates(&env);
        
        // Initialize liquidation protection
        Self::initialize_liquidation_protection(&env);
        
        env.events().publish(
            (symbol_short!("init"), &admin),
            (blend_pool, backstop, oracle_mock)
        );
    }
    
    /// Initialize testnet assets with liquidation bonuses
    fn initialize_testnet_assets(env: &Env) {
        let assets = [
            ("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", "XLM", 7, 7000, 0, 500),
            ("CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF", "BLND", 7, 6500, 1, 800),
            ("CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU", "USDC", 6, 8500, 2, 300),
            ("CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE", "wETH", 18, 7500, 3, 600),
            ("CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI", "wBTC", 8, 7500, 4, 700),
        ];
        
        for &(addr_str, symbol, decimals, ltv, reserve_idx, liq_bonus) in assets.iter() {
            let address = Address::from_string(&String::from_str(env, addr_str));
            let config = AssetConfig {
                address: address.clone(),
                symbol: String::from_str(env, symbol),
                decimals,
                is_active: true,
                ltv_ratio: ltv,
                reserve_index: reserve_idx,
                liquidation_bonus: liq_bonus,
            };
            
            let key = (symbol_short!("asset"), address.clone());
            env.storage().persistent().set(&key, &config);
        }
    }

    /// Initialize fixed exchange rates for DEX simulation
    fn initialize_exchange_rates(env: &Env) {
        let xlm = Address::from_string(&String::from_str(env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"));
        let usdc = Address::from_string(&String::from_str(env, "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU"));
        let weth = Address::from_string(&String::from_str(env, "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE"));
        let wbtc = Address::from_string(&String::from_str(env, "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI"));
        let blend = Address::from_string(&String::from_str(env, "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF"));

        // Fixed rates (scaled by 1e18)
        let rates = [
            (xlm.clone(), usdc.clone(), 120_000_000_000_000_000), // 1 XLM = 0.12 USDC
            (usdc.clone(), xlm.clone(), 8_333_333_333_333_333_333), // 1 USDC = 8.33 XLM
            (weth.clone(), usdc.clone(), 2500_000_000_000_000_000_000), // 1 wETH = 2500 USDC
            (usdc.clone(), weth.clone(), 400_000_000_000_000), // 1 USDC = 0.0004 wETH
            (wbtc.clone(), usdc.clone(), 45000_000_000_000_000_000_000), // 1 wBTC = 45000 USDC
            (usdc.clone(), wbtc.clone(), 22_222_222_222_222), // 1 USDC = 0.000022 wBTC
            (blend.clone(), usdc.clone(), 50_000_000_000_000_000), // 1 BLEND = 0.05 USDC
            (usdc.clone(), blend.clone(), 20_000_000_000_000_000_000), // 1 USDC = 20 BLEND
        ];

        for (from_asset, to_asset, rate) in rates.iter() {
            let exchange_rate = ExchangeRate {
                from_asset: from_asset.clone(),
                to_asset: to_asset.clone(),
                rate: *rate,
                last_update: env.ledger().timestamp(),
            };
            
            let key = (symbol_short!("rate"), from_asset.clone(), to_asset.clone());
            env.storage().persistent().set(&key, &exchange_rate);
        }
    }

    /// Initialize liquidation protection settings
    fn initialize_liquidation_protection(env: &Env) {
        let protection = LiquidationProtection {
            enabled: true,
            auto_repay_threshold: AUTO_REPAY_THRESHOLD,
            max_repay_percentage: 5000, // 50% max repayment
            protection_fee: 100, // 1% fee
        };
        
        env.storage().persistent().set(&symbol_short!("liq_prot"), &protection);
    }

    /// Supply assets to Blend with health factor check
    pub fn supply_to_blend(
        env: Env,
        user: Address,
        asset: Address,
        amount: u128,
        as_collateral: bool,
    ) {
        user.require_auth();
        Self::require_initialized(&env);
        
        assert!(amount > 0, "Amount must be positive");
        assert!(Self::is_asset_supported(&env, &asset), "Asset not supported");
        
        let blend_pool: Address = env.storage().instance().get(&symbol_short!("blend")).unwrap();
        
        // Check pool status
        let pool_status = Self::get_pool_status(&env, &blend_pool);
        assert!(pool_status <= 3, "Pool is frozen");
        
        // Transfer and approve
        Self::transfer_from_user(&env, &asset, &user, &env.current_contract_address(), amount);
        Self::approve_token(&env, &asset, &blend_pool, amount);
        
        // Create request
        let request_type = if as_collateral { 2u32 } else { 0u32 };
        let request = BlendRequest {
            request_type,
            address: asset.clone(),
            amount: amount as i128,
        };
        
        let mut requests = Vec::new(&env);
        requests.push_back(request);
        
        // Submit to Blend
        env.invoke_contract::<()>(
            &blend_pool,
            &symbol_short!("submit"),
            soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                requests.into_val(&env),
            ],
        );
        
        // Update position and health factor
        Self::update_user_supply_position(&env, &user, &asset, amount);
        Self::update_user_health_factor(&env, &user);
        
        env.events().publish(
            (symbol_short!("supply"), &user),
            (asset, amount, as_collateral)
        );
    }

    /// Borrow with health factor validation and liquidation protection
    pub fn borrow_from_blend(
        env: Env,
        user: Address,
        asset: Address,
        amount: u128,
    ) {
        user.require_auth();
        Self::require_initialized(&env);
        
        assert!(amount > 0, "Amount must be positive");
        assert!(Self::is_asset_supported(&env, &asset), "Asset not supported");
        
        let blend_pool: Address = env.storage().instance().get(&symbol_short!("blend")).unwrap();
        
        // Check pool status for borrowing
        let pool_status = Self::get_pool_status(&env, &blend_pool);
        assert!(pool_status <= 1, "Borrowing disabled");
        
        // Check health factor BEFORE borrowing
        let mut temp_position = Self::get_user_position(env.clone(), user.clone());
        temp_position.borrowed_assets.set(
            asset.clone(), 
            temp_position.borrowed_assets.get(asset.clone()).unwrap_or(0) + amount
        );
        
        let projected_health = Self::calculate_health_factor(&env, &temp_position);
        assert!(projected_health >= MIN_HEALTH_FACTOR, "Would make position unhealthy");
        
        // Execute borrow
        let request = BlendRequest {
            request_type: 4u32, // Borrow
            address: asset.clone(),
            amount: amount as i128,
        };
        
        let mut requests = Vec::new(&env);
        requests.push_back(request);
        
        env.invoke_contract::<()>(
            &blend_pool,
            &symbol_short!("submit"),
            soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                requests.into_val(&env),
            ],
        );
        
        // Update positions
        Self::update_user_borrow_position(&env, &user, &asset, amount);
        Self::update_user_health_factor(&env, &user);
        
        // Check if liquidation protection is needed
        Self::check_and_trigger_liquidation_protection(&env, &user);
        
        // Transfer to user
        Self::transfer_to_user(&env, &asset, &user, amount);
        
        env.events().publish(
            (symbol_short!("borrow"), &user),
            (asset, amount)
        );
    }

    /// Swap tokens with fixed exchange rates and health factor check
    pub fn swap_tokens(
        env: Env,
        user: Address,
        token_in: Address,
        token_out: Address,
        amount_in: u128,
        min_amount_out: u128,
        deadline: u64,
    ) -> u128 {
        user.require_auth();
        Self::require_initialized(&env);
        
        assert!(amount_in > 0, "Amount must be positive");
        assert!(env.ledger().timestamp() <= deadline, "Expired");
        assert!(Self::is_asset_supported(&env, &token_in), "Input token not supported");
        assert!(Self::is_asset_supported(&env, &token_out), "Output token not supported");
        
        // Calculate fee
        let fee_amount = (amount_in * PROTOCOL_FEE) / 10000;
        let swap_amount = amount_in - fee_amount;
        
        // Transfer from user
        Self::transfer_from_user(&env, &token_in, &user, &env.current_contract_address(), amount_in);
        
        // Execute swap with fixed rates
        let amount_out = Self::execute_swap_fixed_rate(&env, &token_in, &token_out, swap_amount, min_amount_out);
        
        // Store protocol fee for staking rewards
        Self::add_to_reward_pool(&env, fee_amount);
        
        // Transfer to user
        Self::transfer_to_user(&env, &token_out, &user, amount_out);
        
        // Update health factor if user has borrowed positions
        Self::update_user_health_factor(&env, &user);
        
        // Check liquidation protection after swap
        Self::check_and_trigger_liquidation_protection(&env, &user);
        
        env.events().publish(
            (symbol_short!("swap"), &user),
            (token_in, token_out, amount_in, amount_out, fee_amount)
        );
        
        amount_out
    }

    /// Enable/disable liquidation protection for user
    pub fn set_liquidation_protection(
        env: Env,
        user: Address,
        enabled: bool,
    ) {
        user.require_auth();
        Self::require_initialized(&env);
        
        let mut position = Self::get_user_position(env.clone(), user.clone());
        position.liquidation_threshold = if enabled {
            AUTO_REPAY_THRESHOLD
        } else {
            LIQUIDATION_THRESHOLD
        };
        
        Self::save_user_position(&env, &user, &position);
        
        env.events().publish(
            (symbol_short!("liq_prot"), &user),
            enabled
        );
    }

    /// Manual liquidation protection trigger
    pub fn trigger_liquidation_protection(
        env: Env,
        user: Address,
    ) -> u128 {
        Self::require_initialized(&env);
        
        let position = Self::get_user_position(env.clone(), user.clone());
        assert!(position.health_factor <= AUTO_REPAY_THRESHOLD, "Position not at risk");
        
        Self::execute_liquidation_protection(&env, &user)
    }

    /// Get asset price from oracle mock
    pub fn get_asset_price(env: Env, asset: Address) -> u128 {
        Self::require_initialized(&env);
        Self::get_asset_price_from_oracle(&env, &asset)
    }

    /// Update exchange rate (admin only)
    pub fn update_exchange_rate(
        env: Env,
        admin: Address,
        from_asset: Address,
        to_asset: Address,
        new_rate: u128,
    ) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        
        let exchange_rate = ExchangeRate {
            from_asset: from_asset.clone(),
            to_asset: to_asset.clone(),
            rate: new_rate,
            last_update: env.ledger().timestamp(),
        };
        
        let key = (symbol_short!("rate"), from_asset.clone(), to_asset.clone());
        env.storage().persistent().set(&key, &exchange_rate);
        
        env.events().publish(
          (symbol_short!("rate_upd"), &admin),
            (from_asset, to_asset, new_rate)
        );
    }

    /// Get user health status
    pub fn get_health_status(env: Env, user: Address) -> HealthStatus {
        let position = Self::get_user_position(env.clone(), user.clone());
        let health_factor = position.health_factor;
        
        if health_factor < HEALTH_FACTOR_SCALE {
            HealthStatus::Liquidatable
        } else if health_factor < 1_030_000_000_000_000_000 { // 1.03
            HealthStatus::Critical
        } else if health_factor < 1_150_000_000_000_000_000 { // 1.15
            HealthStatus::Warning
        } else {
            HealthStatus::Healthy
        }
    }

    /// Get user position with current health factor
    pub fn get_user_position(env: Env, user: Address) -> UserPosition {
        let mut position = env.storage()
            .persistent()
            .get(&(symbol_short!("pos"), user.clone()))
            .unwrap_or(UserPosition {
                supplied_assets: Map::new(&env),
                borrowed_assets: Map::new(&env),
                staked_blend: 0,
                rewards_earned: 0,
                last_reward_update: env.ledger().timestamp(),
                health_factor: HEALTH_FACTOR_SCALE, // Default to 1.0
                liquidation_threshold: LIQUIDATION_THRESHOLD,
            });
        
        // Update health factor
        position.health_factor = Self::calculate_health_factor(&env, &position);
        position
    }

    // ===================
    // INTERNAL FUNCTIONS
    // ===================

    fn require_initialized(env: &Env) {
        assert!(
            env.storage().instance().get::<_, bool>(&symbol_short!("init")).unwrap_or(false),
            "Contract not initialized"
        );
    }

    fn require_admin(env: &Env, user: &Address) {
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        assert_eq!(*user, admin, "Only admin allowed");
    }

    fn get_pool_status(env: &Env, blend_pool: &Address) -> u32 {
        env.invoke_contract::<u32>(
            blend_pool,
            &symbol_short!("get_stat"),
            soroban_sdk::vec![env],
        )
    }

    fn is_asset_supported(env: &Env, asset: &Address) -> bool {
        let key = (symbol_short!("asset"), asset.clone());
        if let Some(config) = env.storage().persistent().get::<_, AssetConfig>(&key) {
            config.is_active
        } else {
            false
        }
    }

    fn calculate_health_factor(env: &Env, position: &UserPosition) -> u128 {
        let mut total_collateral_value = 0u128;
        let mut total_debt_value = 0u128;
        
        // Calculate collateral value (with LTV)
        for (asset, amount) in position.supplied_assets.iter() {
            let price = Self::get_asset_price_from_oracle(env, &asset);
            let config = Self::get_asset_config(env, &asset);
            let value = (amount * price) / (10u128.pow(config.decimals));
            let ltv_adjusted_value = (value * config.ltv_ratio as u128) / 10000;
            total_collateral_value += ltv_adjusted_value;
        }
        
        // Calculate debt value
        for (asset, amount) in position.borrowed_assets.iter() {
            let price = Self::get_asset_price_from_oracle(env, &asset);
            let config = Self::get_asset_config(env, &asset);
            let value = (amount * price) / (10u128.pow(config.decimals));
            total_debt_value += value;
        }
        
        if total_debt_value == 0 {
            return HEALTH_FACTOR_SCALE * 1000; // Very healthy if no debt
        }
        
        (total_collateral_value * HEALTH_FACTOR_SCALE) / total_debt_value
    }

    fn get_asset_config(env: &Env, asset: &Address) -> AssetConfig {
        let key = (symbol_short!("asset"), asset.clone());
        env.storage().persistent().get(&key).unwrap()
    }

    fn get_asset_price_from_oracle(env: &Env, asset: &Address) -> u128 {
        let oracle_mock: Address = env.storage().instance().get(&symbol_short!("oracle")).unwrap();
        
        // Call oracle mock to get price
        let price = env.invoke_contract::<u128>(
            &oracle_mock,
            &symbol_short!("get_price"),
            soroban_sdk::vec![env, asset.into_val(env)],
        );
        
        // Fallback to fixed prices if oracle fails
        if price == 0 {
            Self::get_fallback_price(env, asset)
        } else {
            price
        }
    }

    fn get_fallback_price(env: &Env, asset: &Address) -> u128 {
        // Fallback fixed prices (scaled by 1e18)
        let xlm = Address::from_string(&String::from_str(env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"));
        let usdc = Address::from_string(&String::from_str(env, "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU"));
        let weth = Address::from_string(&String::from_str(env, "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE"));
        let wbtc = Address::from_string(&String::from_str(env, "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI"));
        let blend = Address::from_string(&String::from_str(env, "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF"));

        if *asset == xlm {
            120_000_000_000_000_000 // $0.12
        } else if *asset == usdc {
            PRICE_SCALE // $1.00
        } else if *asset == weth {
            2500_000_000_000_000_000_000 // $2500
        } else if *asset == wbtc {
            45000_000_000_000_000_000_000 // $45000
        } else if *asset == blend {
            50_000_000_000_000_000 // $0.05
        } else {
            PRICE_SCALE // Default to $1
        }
    }

    fn execute_swap_fixed_rate(
        env: &Env,
        token_in: &Address,
        token_out: &Address,
        amount_in: u128,
        min_amount_out: u128,
    ) -> u128 {
        let key = (symbol_short!("rate"), token_in.clone(), token_out.clone());
        
        if let Some(exchange_rate) = env.storage().persistent().get::<_, ExchangeRate>(&key) {
            let config_in = Self::get_asset_config(env, token_in);
            let config_out = Self::get_asset_config(env, token_out);
            
            // Adjust for decimals
            let amount_in_normalized = amount_in * 10u128.pow(18 - config_in.decimals);
            let amount_out_normalized = (amount_in_normalized * exchange_rate.rate) / PRICE_SCALE;
            let amount_out = amount_out_normalized / 10u128.pow(18 - config_out.decimals);
            
            assert!(amount_out >= min_amount_out, "Insufficient output amount");
            amount_out
        } else {
            // Fallback to oracle-based calculation
            let price_in = Self::get_asset_price_from_oracle(env, token_in);
            let price_out = Self::get_asset_price_from_oracle(env, token_out);
            
            let config_in = Self::get_asset_config(env, token_in);
            let config_out = Self::get_asset_config(env, token_out);
            
            let value_in = (amount_in * price_in) / 10u128.pow(config_in.decimals);
            let amount_out = (value_in * 10u128.pow(config_out.decimals)) / price_out;
            
            assert!(amount_out >= min_amount_out, "Insufficient output amount");
            amount_out
        }
    }

    fn check_and_trigger_liquidation_protection(env: &Env, user: &Address) {
        let position = Self::get_user_position(env.clone(), user.clone());
        
        if position.health_factor <= position.liquidation_threshold {
            let protection: LiquidationProtection = env.storage()
                .persistent()
                .get(&symbol_short!("liq_prot"))
                .unwrap();
            
            if protection.enabled {
                Self::execute_liquidation_protection(env, user);
            }
        }
    }

    fn execute_liquidation_protection(env: &Env, user: &Address) -> u128 {
        let position = Self::get_user_position(env.clone(), user.clone());
        let protection: LiquidationProtection = env.storage()
            .persistent()
            .get(&symbol_short!("liq_prot"))
            .unwrap();
        
        let mut total_repaid = 0u128;
        
        // Find the largest debt to repay first
        let mut largest_debt_asset = None;
        let mut largest_debt_amount = 0u128;
        
        for (asset, amount) in position.borrowed_assets.iter() {
            if amount > largest_debt_amount {
                largest_debt_amount = amount;
                largest_debt_asset = Some(asset);
            }
        }
        
        if let Some(debt_asset) = largest_debt_asset {
            // Calculate repayment amount (max percentage of debt)
            let max_repay = (largest_debt_amount * protection.max_repay_percentage as u128) / 10000;
            
            // Find collateral to swap for repayment
            let mut collateral_asset = None;
            let mut collateral_amount = 0u128;
            
            for (asset, amount) in position.supplied_assets.iter() {
                if amount > 0 && asset != debt_asset {
                    collateral_asset = Some(asset);
                    collateral_amount = amount;
                    break;
                }
            }
            
            if let Some(coll_asset) = collateral_asset {
                // Calculate how much collateral to swap
                let debt_price = Self::get_asset_price_from_oracle(env, &debt_asset);
                let coll_price = Self::get_asset_price_from_oracle(env, &coll_asset);
                
                let debt_config = Self::get_asset_config(env, &debt_asset);
                let coll_config = Self::get_asset_config(env, &coll_asset);
                
                let debt_value = (max_repay * debt_price) / 10u128.pow(debt_config.decimals);
                let coll_needed = (debt_value * 10u128.pow(coll_config.decimals)) / coll_price;
                
                // Add protection fee
                let coll_with_fee = coll_needed + (coll_needed * protection.protection_fee as u128) / 10000;
                
                if coll_with_fee <= collateral_amount {
                    // Execute the protection swap
                    let swapped_amount = Self::execute_swap_fixed_rate(
                        env, 
                        &coll_asset, 
                        &debt_asset, 
                        coll_with_fee, 
                        max_repay
                    );
                    
                    // Repay debt to Blend
                    Self::repay_debt_to_blend(env, user, &debt_asset, swapped_amount);
                    
                    total_repaid = swapped_amount;
                    
                    env.events().publish(
                        (symbol_short!("auto_rep"), user),
                        (debt_asset, swapped_amount, coll_asset, coll_with_fee)
                    );
                }
            }
        }
        
        total_repaid
    }

    fn repay_debt_to_blend(env: &Env, user: &Address, asset: &Address, amount: u128) {
        let blend_pool: Address = env.storage().instance().get(&symbol_short!("blend")).unwrap();
        
        // Approve and repay
        Self::approve_token(env, asset, &blend_pool, amount);
        
        let request = BlendRequest {
            request_type: 5u32, // Repay
            address: asset.clone(),
            amount: amount as i128,
        };
        
        let mut requests = Vec::new(env);
        requests.push_back(request);
        
        env.invoke_contract::<()>(
            &blend_pool,
            &symbol_short!("submit"),
            soroban_sdk::vec![
                env,
                env.current_contract_address().into_val(env),
                env.current_contract_address().into_val(env),
                env.current_contract_address().into_val(env),
                requests.into_val(env),
            ],
        );
        
        // Update user position
        let mut position = Self::get_user_position(env.clone(), user.clone());
        let current_debt = position.borrowed_assets.get(asset.clone()).unwrap_or(0);
        let new_debt = current_debt.saturating_sub(amount);
        
        if new_debt == 0 {
            position.borrowed_assets.remove(asset.clone());
        } else {
            position.borrowed_assets.set(asset.clone(), new_debt);
        }
        
        Self::save_user_position(env, user, &position);
        Self::update_user_health_factor(env, user);
    }

    /// Stake BLEND tokens (only BLEND can be staked)
    pub fn stake_blend(
        env: Env,
        user: Address,
        amount: u128,
    ) {
        user.require_auth();
        Self::require_initialized(&env);
        
        assert!(amount > 0, "Amount must be positive");
        
        // Get BLEND token address
        let blend_token = Address::from_string(&String::from_str(&env, "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF"));
        
        // Transfer BLEND from user
        Self::transfer_from_user(&env, &blend_token, &user, &env.current_contract_address(), amount);
        
        // Update rewards before changing stake
        Self::update_blend_rewards(&env, &user);
        
        // Update staking position
        let mut position = Self::get_user_position(env.clone(), user.clone());
        position.staked_blend += amount;
        Self::save_user_position(&env, &user, &position);
        
        // Update staking pool
        Self::update_blend_staking_pool(&env, amount, true);
        
        env.events().publish(
            (symbol_short!("stake_bld"), &user),
            amount
        );
    }

    /// Unstake BLEND and claim rewards
    pub fn unstake_blend(
        env: Env,
        user: Address,
        amount: u128,
    ) -> u128 {
        user.require_auth();
        Self::require_initialized(&env);
        
        let mut position = Self::get_user_position(env.clone(), user.clone());
        assert!(position.staked_blend >= amount, "Insufficient staked balance");
        
        // Update rewards before unstaking
        Self::update_blend_rewards(&env, &user);
        
        // Get rewards to claim
        let rewards = position.rewards_earned;
        
        // Update positions
        position.staked_blend -= amount;
        position.rewards_earned = 0;
        Self::save_user_position(&env, &user, &position);
        
        // Update staking pool
        Self::update_blend_staking_pool(&env, amount, false);
        
        let blend_token = Address::from_string(&String::from_str(&env, "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF"));
        
        // Transfer staked BLEND back to user
        Self::transfer_to_user(&env, &blend_token, &user, amount);
        
        // Transfer rewards (in BLEND or protocol fees)
        if rewards > 0 {
            Self::transfer_rewards(&env, &user, rewards);
        }
        
        env.events().publish(
            (symbol_short!("unstk_bld"), &user),
            (amount, rewards)
        );
        
        rewards
    }

    /// Emergency withdraw (admin only) - for frozen pools
    pub fn emergency_withdraw(
        env: Env,
        admin: Address,
        user: Address,
        asset: Address,
        amount: u128,
    ) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        
        // Emergency function to help users when pools are frozen
        let blend_pool: Address = env.storage().instance().get(&symbol_short!("blend")).unwrap();
        
        let request = BlendRequest {
            request_type: 3u32, // Withdraw Collateral
            address: asset.clone(),
            amount: amount as i128,
        };
        
        let mut requests = Vec::new(&env);
        requests.push_back(request);
        
        env.invoke_contract::<()>(
            &blend_pool,
            &symbol_short!("submit"),
            soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                env.current_contract_address().into_val(&env),
                requests.into_val(&env),
            ],
        );
        
        Self::transfer_to_user(&env, &asset, &user, amount);
        
        env.events().publish(
            (symbol_short!("emergency"), &admin),
            (user, asset, amount)
        );
    }

    /// Liquidate unhealthy position (anyone can call)
    pub fn liquidate_position(
        env: Env,
        liquidator: Address,
        borrower: Address,
        debt_asset: Address,
        collateral_asset: Address,
        debt_to_cover: u128,
    ) -> u128 {
        liquidator.require_auth();
        Self::require_initialized(&env);
        
        let position = Self::get_user_position(env.clone(), borrower.clone());
        assert!(position.health_factor < LIQUIDATION_THRESHOLD, "Position is healthy");
        
        let debt_amount = position.borrowed_assets.get(debt_asset.clone()).unwrap_or(0);
        assert!(debt_amount >= debt_to_cover, "Debt amount too low");
        
        let collateral_amount = position.supplied_assets.get(collateral_asset.clone()).unwrap_or(0);
        assert!(collateral_amount > 0, "No collateral available");
        
        // Calculate liquidation bonus
        let collateral_config = Self::get_asset_config(&env, &collateral_asset);
        let liquidation_bonus = collateral_config.liquidation_bonus;
        
        // Calculate collateral to seize
        let debt_price = Self::get_asset_price_from_oracle(&env, &debt_asset);
        let collateral_price = Self::get_asset_price_from_oracle(&env, &collateral_asset);
        
        let debt_config = Self::get_asset_config(&env, &debt_asset);
        
        let debt_value = (debt_to_cover * debt_price) / 10u128.pow(debt_config.decimals);
        let collateral_value_needed = debt_value + (debt_value * liquidation_bonus as u128) / 10000;
        let collateral_to_seize = (collateral_value_needed * 10u128.pow(collateral_config.decimals)) / collateral_price;
        
        assert!(collateral_to_seize <= collateral_amount, "Insufficient collateral");
        
        // Transfer debt payment from liquidator
        Self::transfer_from_user(&env, &debt_asset, &liquidator, &env.current_contract_address(), debt_to_cover);
        
        // Repay debt to Blend
        Self::repay_debt_to_blend(&env, &borrower, &debt_asset, debt_to_cover);
        
        // Transfer collateral to liquidator
        Self::transfer_to_user(&env, &collateral_asset, &liquidator, collateral_to_seize);
        
        // Update borrower's position
        let mut borrower_position = Self::get_user_position(env.clone(), borrower.clone());
        let current_collateral = borrower_position.supplied_assets.get(collateral_asset.clone()).unwrap_or(0);
        let new_collateral = current_collateral.saturating_sub(collateral_to_seize);
        
        if new_collateral == 0 {
            borrower_position.supplied_assets.remove(collateral_asset.clone());
        } else {
            borrower_position.supplied_assets.set(collateral_asset.clone(), new_collateral);
        }
        
        Self::save_user_position(&env, &borrower, &borrower_position);
        Self::update_user_health_factor(&env, &borrower);
        
        env.events().publish(
            (symbol_short!("liquidate"), &liquidator),
            (borrower, debt_asset, collateral_asset, debt_to_cover, collateral_to_seize)
        );
        
        collateral_to_seize
    }

    fn update_user_health_factor(env: &Env, user: &Address) {
        let mut position = Self::get_user_position(env.clone(), user.clone());
        position.health_factor = Self::calculate_health_factor(env, &position);
        Self::save_user_position(env, user, &position);
    }

    fn update_blend_rewards(env: &Env, user: &Address) {
        let mut position = Self::get_user_position(env.clone(), user.clone());
        let current_time = env.ledger().timestamp();
        
        if position.staked_blend > 0 {
            let time_elapsed = current_time - position.last_reward_update;
            let daily_rate = 100; // 1% daily APY as example
            let rewards = (position.staked_blend * daily_rate * time_elapsed as u128) / (10000 * SECONDS_PER_DAY as u128);
            position.rewards_earned += rewards;
        }
        
        position.last_reward_update = current_time;
        Self::save_user_position(env, user, &position);
    }

    fn update_blend_staking_pool(env: &Env, amount: u128, is_stake: bool) {
        let key = symbol_short!("bld_pool");
        let mut pool = env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(BlendStakingPool {
                total_staked: 0,
                reward_rate: 1000,
                last_update_time: env.ledger().timestamp(),
                reward_per_token_stored: 0,
                total_rewards_distributed: 0,
            });
        
        if is_stake {
            pool.total_staked += amount;
        } else {
            pool.total_staked = pool.total_staked.saturating_sub(amount);
        }
        
        pool.last_update_time = env.ledger().timestamp();
        env.storage().persistent().set(&key, &pool);
    }

    fn transfer_from_user(env: &Env, token: &Address, user: &Address, to: &Address, amount: u128) {
        env.invoke_contract::<()>(
            token,
            &symbol_short!("trans_frm"),
            soroban_sdk::vec![env, user.into_val(env), to.into_val(env), amount.into_val(env)],
        );
    }

    fn transfer_to_user(env: &Env, token: &Address, user: &Address, amount: u128) {
        env.invoke_contract::<()>(
            token,
            &symbol_short!("transfer"),
            soroban_sdk::vec![env, user.into_val(env), amount.into_val(env)],
        );
    }

    fn approve_token(env: &Env, token: &Address, spender: &Address, amount: u128) {
        env.invoke_contract::<()>(
            token,
            &symbol_short!("approve"),
            soroban_sdk::vec![env, spender.into_val(env), amount.into_val(env)],
        );
    }

    fn add_to_reward_pool(env: &Env, amount: u128) {
        let key = symbol_short!("rewards");
        let current: u128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(current + amount));
    }

    fn transfer_rewards(env: &Env, user: &Address, amount: u128) {
        // Transfer from reward pool to user
        // Could be BLEND tokens or other protocol fee tokens
        let blend_token = Address::from_string(&String::from_str(env, "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF"));
        Self::transfer_to_user(env, &blend_token, user, amount);
    }

    fn update_user_supply_position(env: &Env, user: &Address, asset: &Address, amount: u128) {
        let mut position = Self::get_user_position(env.clone(), user.clone());
        let current = position.supplied_assets.get(asset.clone()).unwrap_or(0);
        position.supplied_assets.set(asset.clone(), current + amount);
        Self::save_user_position(env, user, &position);
    }

    fn update_user_borrow_position(env: &Env, user: &Address, asset: &Address, amount: u128) {
        let mut position = Self::get_user_position(env.clone(), user.clone());
        let current = position.borrowed_assets.get(asset.clone()).unwrap_or(0);
        position.borrowed_assets.set(asset.clone(), current + amount);
        Self::save_user_position(env, user, &position);
    }

    fn save_user_position(env: &Env, user: &Address, position: &UserPosition) {
        env.storage().persistent().set(&(symbol_short!("pos"), user.clone()), position);
    }
}