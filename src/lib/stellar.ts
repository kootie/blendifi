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
    address: "GA5ZSE9EQLFZB5E34TRTFWNW5T76W2KQZ7ZYPZB2O2C3Y5QTKH7C5OL6",
    symbol: "USDC",
    decimals: 6,
    collateral_factor: 8500,
    is_collateral: true,
    dia_symbol: "USDC"
  },
  USDT: {
    address: "GAP5LETOVHK3YHGGQ5DLVZ5P7FSVJYZAPVZCFAWAW7A4M23TLH6Y2D2I",
    symbol: "USDT",
    decimals: 6,
    collateral_factor: 8500,
    is_collateral: true,
    dia_symbol: "USDT"
  },
  XLM: {
    address: "native",
    symbol: "XLM",
    decimals: 7,
    collateral_factor: 7000,
    is_collateral: true,
    dia_symbol: "XLM"
  },
  BTC: {
    address: "GDXTJEK4JZNSTNQAWA53RZNS2MDXYD2SMT6Q7JH2CU2B6Y2DRX6XM3UB",
    symbol: "BTC",
    decimals: 8,
    collateral_factor: 7500,
    is_collateral: true,
    dia_symbol: "BTC"
  },
  ETH: {
    address: "GBETHKBLNBSBXVLTKWLB6L3X3RTMAKKI64JUNNQO5EUXYYTYO3O3G2YH",
    symbol: "ETH",
    decimals: 18,
    collateral_factor: 7500,
    is_collateral: true,
    dia_symbol: "ETH"
  },
  AQUA: {
    address: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    symbol: "AQUA",
    decimals: 7,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "AQUA"
  },
  VELO: {
    address: "GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M",
    symbol: "VELO",
    decimals: 7,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "VELO"
  },
  SHX: {
    address: "GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH",
    symbol: "SHX",
    decimals: 6,
    collateral_factor: 6500,
    is_collateral: true,
    dia_symbol: "SHX"
  },
  WXT: {
    address: "GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT",
    symbol: "WXT",
    decimals: 6,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "WXT"
  },
  RIO: {
    address: "GBNLJIYH34UWO5YZFA3A3HD3N76R6DOI33N4JONUOHEEYZYCAYTEJ5AK",
    symbol: "RIO",
    decimals: 7,
    collateral_factor: 6000,
    is_collateral: true,
    dia_symbol: "RIO"
  },
  BLND: {
    address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    symbol: "BLND",
    decimals: 7,
    collateral_factor: 6500,
    is_collateral: true,
    dia_symbol: "BLND"
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
  let debugArgs: any = {};
  
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
      debugArgs = {
        user: pubKey,
        token_a: tokenA,
        token_b: tokenB,
        amount_in: params.amount,
        min_amount_out: params.minAmountOut || 1,
        deadline: Math.floor(Date.now() / 1000) + 600
      };
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
      debugArgs = {
        user: pubKey,
        asset: supplyAsset,
        amount: params.amount
      };
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
      debugArgs = {
        user: pubKey,
        asset: borrowAsset,
        amount: params.amount
      };
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
      debugArgs = {
        user: pubKey,
        btoken: btoken,
        amount: params.amount
      };
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
      debugArgs = {
        user: pubKey,
        btoken: unstakeBtoken,
        amount: params.amount
      };
      break;
    }
      
    default:
      throw new Error('Unsupported contract method');
  }

  // Debug log the arguments
  console.log(`[Soroban] Calling method: ${method}`);
  console.log('[Soroban] Arguments:', debugArgs);
  console.log('[Soroban] Raw contractArgs:', contractArgs);

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
    
    console.log('[Soroban] sendTransaction response:', sendResponse);

    if (sendResponse.errorResultXdr) {
      throw new Error(`Transaction failed: ${sendResponse.errorResultXdr}`);
    }
    
    if (sendResponse.status === 'PENDING') {
      // Wait for transaction to be confirmed
      const getResponse = await sorobanServer.getTransaction(sendResponse.hash);
      console.log('[Soroban] getTransaction response:', getResponse);
      if (getResponse.status === 'SUCCESS') {
        return { status: 'SUCCESS', hash: sendResponse.hash, result: getResponse.resultMetaXdr };
      } else {
        throw new Error(`Transaction failed with status: ${getResponse.status}`);
      }
    }
    
    return { status: sendResponse.status, hash: sendResponse.hash };
    
  } catch (e) {
    console.error(`[Soroban] Contract call failed for ${method}:`, e);
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