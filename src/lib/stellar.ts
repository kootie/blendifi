import { isConnected as freighterIsConnected, getAddress, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Networks, TransactionBuilder, BASE_FEE, Keypair, Operation, Account, nativeToScVal, xdr, scValToNative } from '@stellar/stellar-sdk';
import { Server } from 'soroban-client';
import { CONFIG } from './config';

// Connect to Stellar testnet
export const HORIZON_URL = CONFIG.NETWORK.HORIZON_URL;
export const SOROBAN_RPC_URL = CONFIG.NETWORK.SOROBAN_RPC_URL;
export const sorobanServer = new Server(SOROBAN_RPC_URL);

// Contract ID from config
export const CONTRACT_ID = CONFIG.CONTRACT_ID;

// Supported assets from your smart contract
export const SUPPORTED_ASSETS = {
  USDC: {
    address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM6GN",
    symbol: "USDC",
    decimals: 6,
    collateral_factor: 8500,
    is_collateral: true,
    dia_symbol: "USDC"
  },
  USDT: {
    address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    symbol: "USDT", 
    decimals: 6,
    collateral_factor: 8500,
    is_collateral: true,
    dia_symbol: "USDT"
  },
  XLM: {
    address: "CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUIGZ",
    symbol: "XLM",
    decimals: 7,
    collateral_factor: 7000,
    is_collateral: true,
    dia_symbol: "XLM"
  },
  BTC: {
    address: "CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMZZ4SNSHNP4OJ73J",
    symbol: "BTC",
    decimals: 8,
    collateral_factor: 7500,
    is_collateral: true,
    dia_symbol: "BTC"
  },
  ETH: {
    address: "CAJGCM4LVWAFDJSJQ6Q6XCQRMCAAFVZLWXGZ7NUFRBULQ3OHQMGQXHXW",
    symbol: "ETH",
    decimals: 18,
    collateral_factor: 7500,
    is_collateral: true,
    dia_symbol: "ETH"
  },
  DIA: {
    address: "CCXSYV2VNFVVDPGC4K2L2JCQJ6KMXLPYGJHXJ5Q3N7MFCOVHF4CLSSGX",
    symbol: "DIA",
    decimals: 18,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "DIA"
  },
  LINK: {
    address: "CAXPLP4OJFG5CT6SWJVHFGFBFNYP4CQYBZRQLXBX4QJSKKIWW7TLOYMD",
    symbol: "LINK",
    decimals: 18,
    collateral_factor: 6500,
    is_collateral: true,
    dia_symbol: "LINK"
  },
  UNI: {
    address: "CBAFSGCEKDVLCUDNMVK3T3YDQZ7WQBVTQZOXZ3KPKRFBGQN3VU77AMJA",
    symbol: "UNI",
    decimals: 18,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "UNI"
  },
  AAVE: {
    address: "CDYRQKK6FQWYZJ2RNQR7DXKFQP6Q6XJZV4K2MOXHDRFMCFLTJJBCMCDS",
    symbol: "AAVE",
    decimals: 18,
    collateral_factor: 6500,
    is_collateral: true,
    dia_symbol: "AAVE"
  },
  MATIC: {
    address: "CFQF2EDAHCDTJNXSHZ6XQZAHFQRW5WZBHQZWKGLB5FHLYRKQXK7Y2CPV",
    symbol: "MATIC",
    decimals: 18,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "MATIC"
  }
};

// Connect wallet (Freighter)
export async function connectWallet(): Promise<string | null> {
  try {
    // Prefer requestAccess for user prompt, fallback to getAddress
    const res = await requestAccess();
    if (res && res.address) return res.address;
    const addrRes = await getAddress();
    return addrRes && addrRes.address ? addrRes.address : null;
  } catch (e) {
    console.error('Failed to connect wallet:', e);
    return null;
  }
}

// Check if wallet is connected
export async function walletIsConnected(): Promise<boolean> {
  try {
    const res = await freighterIsConnected();
    return !!res.isConnected;
  } catch (e) {
    return false;
  }
}

// Helper to fetch account data from Horizon
export async function fetchAccount(pubKey: string) {
  const response = await fetch(`${HORIZON_URL}/accounts/${pubKey}`);
  if (!response.ok) throw new Error('Failed to fetch account');
  return response.json();
}

// Get user position from contract
export async function getUserPosition(userAddress: string) {
  try {
    const result = await sorobanServer.simulateTransaction({
      resourceConfig: { instructionLeeway: 1000000 },
      operations: [{
        invokeContractFunction: {
          contract: CONTRACT_ID,
          function: "get_user_position",
          args: [nativeToScVal(userAddress, { type: 'address' })]
        }
      }]
    });
    
    if (result.error) {
      throw new Error(`Simulation failed: ${result.error}`);
    }
    
    return result.result?.retval;
  } catch (e) {
    console.error('Failed to get user position:', e);
    return null;
  }
}

// Calculate health factor
export async function calculateHealthFactor(userAddress: string, additionalBorrow?: { asset: string, amount: number }) {
  try {
    const args = [nativeToScVal(userAddress, { type: 'address' })];
    
    if (additionalBorrow) {
      const assetAddress = SUPPORTED_ASSETS[additionalBorrow.asset as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!assetAddress) throw new Error('Invalid asset');
      
      args.push(nativeToScVal(assetAddress, { type: 'address' }));
      args.push(nativeToScVal(additionalBorrow.amount, { type: 'u128' }));
    } else {
      args.push(nativeToScVal(null, { type: 'void' }));
    }
    
    const result = await sorobanServer.simulateTransaction({
      resourceConfig: { instructionLeeway: 1000000 },
      operations: [{
        invokeContractFunction: {
          contract: CONTRACT_ID,
          function: "calculate_health_factor",
          args: args
        }
      }]
    });
    
    if (result.error) {
      throw new Error(`Simulation failed: ${result.error}`);
    }
    
    return scValToNative(result.result?.retval);
  } catch (e) {
    console.error('Failed to calculate health factor:', e);
    return null;
  }
}

// Get asset price
export async function getAssetPrice(assetAddress: string) {
  try {
    const result = await sorobanServer.simulateTransaction({
      resourceConfig: { instructionLeeway: 1000000 },
      operations: [{
        invokeContractFunction: {
          contract: CONTRACT_ID,
          function: "get_asset_price",
          args: [nativeToScVal(assetAddress, { type: 'address' })]
        }
      }]
    });
    
    if (result.error) {
      throw new Error(`Simulation failed: ${result.error}`);
    }
    
    return scValToNative(result.result?.retval);
  } catch (e) {
    console.error('Failed to get asset price:', e);
    return null;
  }
}

// Call Soroban contract method
export async function callContractMethod(
  method: 'swap_tokens' | 'supply_to_blend' | 'borrow_from_blend' | 'stake_btokens' | 'unstake_and_claim',
  params: Record<string, unknown>
) {
  // Get user public key
  let pubKey: string | null = null;
  try {
    const addrRes = await getAddress();
    if (addrRes && addrRes.address) pubKey = addrRes.address;
    if (!pubKey) {
      const reqRes = await requestAccess();
      if (reqRes && reqRes.address) pubKey = reqRes.address;
    }
  } catch (e) {
    console.error('Failed to get wallet address:', e);
  }
  
  if (!pubKey) throw new Error('Wallet not connected');

  // Build contract call arguments
  let contractArgs: xdr.ScVal[] = [];
  
  switch (method) {
    case 'swap_tokens': {
      const tokenA = SUPPORTED_ASSETS[params.fromCrypto as keyof typeof SUPPORTED_ASSETS]?.address;
      const tokenB = SUPPORTED_ASSETS[params.toCrypto as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!tokenA || !tokenB) throw new Error('Invalid token selection');
      
      contractArgs = [
        nativeToScVal(pubKey, { type: 'address' }),
        nativeToScVal(tokenA, { type: 'address' }),
        nativeToScVal(tokenB, { type: 'address' }),
        nativeToScVal(params.amount, { type: 'u128' }),
        nativeToScVal(params.minAmountOut || 1, { type: 'u128' }),
        nativeToScVal(Math.floor(Date.now() / 1000) + 600, { type: 'u64' }) // 10 min deadline
      ];
      break;
    }
      
    case 'supply_to_blend': {
      const supplyAsset = SUPPORTED_ASSETS[params.asset as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!supplyAsset) throw new Error('Invalid asset');
      
      contractArgs = [
        nativeToScVal(pubKey, { type: 'address' }),
        nativeToScVal(supplyAsset, { type: 'address' }),
        nativeToScVal(params.amount, { type: 'u128' })
      ];
      break;
    }
      
    case 'borrow_from_blend': {
      const borrowAsset = SUPPORTED_ASSETS[params.asset as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!borrowAsset) throw new Error('Invalid asset');
      
      contractArgs = [
        nativeToScVal(pubKey, { type: 'address' }),
        nativeToScVal(borrowAsset, { type: 'address' }),
        nativeToScVal(params.amount, { type: 'u128' })
      ];
      break;
    }
      
    case 'stake_btokens': {
      const btoken = SUPPORTED_ASSETS[params.btoken as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!btoken) throw new Error('Invalid bToken');
      
      contractArgs = [
        nativeToScVal(pubKey, { type: 'address' }),
        nativeToScVal(btoken, { type: 'address' }),
        nativeToScVal(params.amount, { type: 'u128' })
      ];
      break;
    }
      
    case 'unstake_and_claim': {
      const unstakeBtoken = SUPPORTED_ASSETS[params.btoken as keyof typeof SUPPORTED_ASSETS]?.address;
      if (!unstakeBtoken) throw new Error('Invalid bToken');
      
      contractArgs = [
        nativeToScVal(pubKey, { type: 'address' }),
        nativeToScVal(unstakeBtoken, { type: 'address' }),
        nativeToScVal(params.amount, { type: 'u128' })
      ];
      break;
    }
      
    default:
      throw new Error('Unsupported contract method');
  }

  try {
    // Prepare contract call
    const accountData = await fetchAccount(pubKey);
    const account = new Account(accountData.account_id, accountData.sequence);
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: method,
        args: contractArgs,
      }))
      .setTimeout(60)
      .build();

    // Ask Freighter to sign the transaction
    const signed = await signTransaction(tx.toXDR(), {
      networkPassphrase: Networks.TESTNET,
    });
    
    if (!signed || !signed.signedTxXdr) throw new Error('Signing failed');
    
    const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET);

    // Send the transaction to Soroban RPC
    const sendResponse = await sorobanServer.sendTransaction(signedTx);
    
    if (sendResponse.errorResultXdr) {
      throw new Error(`Transaction failed: ${sendResponse.errorResultXdr}`);
    }
    
    if (sendResponse.status === 'PENDING') {
      // Wait for transaction to be confirmed
      const getResponse = await sorobanServer.getTransaction(sendResponse.hash);
      if (getResponse.status === 'SUCCESS') {
        return { status: 'SUCCESS', hash: sendResponse.hash, result: getResponse.resultMetaXdr };
      } else {
        throw new Error(`Transaction failed with status: ${getResponse.status}`);
      }
    }
    
    return { status: sendResponse.status, hash: sendResponse.hash };
    
  } catch (e) {
    console.error(`Contract call failed for ${method}:`, e);
    throw e;
  }
}

// Get supported assets list
export async function getSupportedAssets() {
  try {
    const result = await sorobanServer.simulateTransaction({
      resourceConfig: { instructionLeeway: 1000000 },
      operations: [{
        invokeContractFunction: {
          contract: CONTRACT_ID,
          function: "get_supported_assets",
          args: []
        }
      }]
    });
    
    if (result.error) {
      throw new Error(`Simulation failed: ${result.error}`);
    }
    
    return scValToNative(result.result?.retval);
  } catch (e) {
    console.error('Failed to get supported assets:', e);
    return [];
  }
}

// Get staking pool information
export async function getStakingPool(btokenAddress: string) {
  try {
    const result = await sorobanServer.simulateTransaction({
      resourceConfig: { instructionLeeway: 1000000 },
      operations: [{
        invokeContractFunction: {
          contract: CONTRACT_ID,
          function: "get_staking_pool",
          args: [nativeToScVal(btokenAddress, { type: 'address' })]
        }
      }]
    });
    
    if (result.error) {
      throw new Error(`Simulation failed: ${result.error}`);
    }
    
    return scValToNative(result.result?.retval);
  } catch (e) {
    console.error('Failed to get staking pool:', e);
    return null;
  }
} 