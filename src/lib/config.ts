// Configuration file for Stellar DeFi Hub
// Update these values with your deployed contract information

export const CONFIG = {
  // Replace with your deployed contract ID
  CONTRACT_ID: 'CBV3Q4PBHOAIHTJUR433DUWHWFI3PBDS4AR52YQM32KMX62APVFK6PMT',
  
  // Network configuration
  NETWORK: {
    HORIZON_URL: 'https://horizon-testnet.stellar.org',
    SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015'
  },
  
  // Protocol settings
  PROTOCOL: {
    FEE_BASIS_POINTS: 50, // 0.5%
    MAX_PRICE_AGE: 3600, // 1 hour
    LIQUIDATION_THRESHOLD: 8000, // 80%
    MIN_HEALTH_FACTOR: 1200000, // 120%
  },
  
  // External contract addresses (testnet)
  CONTRACTS: {
    BLEND_POOL_FACTORY: 'CDEVVU3G2CFH6LJQG6LLSCSIU2BNRWDSJMDA44OA64XFV4YNWG7T22IU',
    SOROSWAP_ROUTER: 'CAALXMGZL3JZHGXCPTJ2YFWYQN2F4CLHAKBLMGNR42XQNBTADSFQJCZD',
    DIA_ORACLE: 'CAEDPEZDRCEJCF73ASC5JGNKCIJDV2QJQSW6DJ6B74MYALBNKCJ5IFP4'
  }
};

// Instructions for setup:
// 1. Deploy your smart contract to Stellar testnet
// 2. Replace 'YOUR_CONTRACT_ID_HERE' with your actual contract ID
// 3. Ensure your contract is initialized with the correct admin address
// 4. Make sure all external contracts (Blend, Soroswap, DIA Oracle) are deployed and accessible 