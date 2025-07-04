// Simple contract integration using Freighter API
// This provides the interface for swap, borrow, and stake operations

import { Server, Account, BASE_FEE } from 'stellar-sdk';
import { Server as SorobanRpcServer, TransactionBuilder as SorobanTransactionBuilder, nativeToScVal, Contract, scValToNative, Address } from 'soroban-client';
import { getNetworkDetails } from '@stellar/freighter-api';

const BLEND_CONTRACT_ID = 'CA26SDP73CGMH5E5HHTHT3DN4YPH4DJUNRBRHPB4ZJTF2DQXDMCXXTZH';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const sorobanServer = new SorobanRpcServer(SOROBAN_RPC_URL);
const horizonServer = new Server(HORIZON_URL);

// Token addresses from the smart contract
export const TOKEN_ADDRESSES = {
  XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU',
  USDC: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  BLND: 'GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY',
  WETH: 'GBETHKBLNBSBXVLTKWLB6L3X3RTMAKKI64JUNNQO5EUXYYTYO3O3G2YH',
  WBTC: 'GDXTJEK4JZNSTNQAWA53RZNS2MDXYD2SMT6Q7JH2CU2B6Y2DRX6XM3UB'
};

// Type definitions
interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  result?: string;
}

interface UserPosition {
  supplied: { [token: string]: string };
  borrowed: { [token: string]: string };
  collateralValue: string;
  borrowValue: string;
}

interface HealthStatus {
  healthFactor: string;
  liquidationThreshold: string;
  isHealthy: boolean;
}

interface AssetPrice {
  symbol: string;
  price: string;
  timestamp: number;
}

// Helper function to convert amount to contract format (with decimals)
export function amountToContractFormat(amount: string, decimals: number = 7): string {
  const numAmount = parseFloat(amount);
  return (numAmount * Math.pow(10, decimals)).toString();
}

// Helper function to convert contract amount back to human readable
export function contractAmountToHuman(amount: string, decimals: number = 7): string {
  const numAmount = parseInt(amount);
  return (numAmount / Math.pow(10, decimals)).toString();
}

// Get token decimals
export function getTokenDecimals(symbol: string): number {
  switch (symbol) {
    case 'USDC': return 6;
    case 'WETH': return 18;
    case 'WBTC': return 8;
    case 'BLND': 
    case 'XLM': 
    default: return 7;
  }
}

function stringToAddress(address: string) {
  if (address === 'native') {
    return nativeToScVal(Address.fromString('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU'));
  }
  return nativeToScVal(Address.fromString(address));
}

async function buildAndSubmitSorobanTransaction(
  sourceAccount: string,
  contractId: string,
  method: string,
  args: any[],
  signTransaction: (xdr: string, network: string) => Promise<{ signedTxXdr: string }>
): Promise<TransactionResult> {
  try {
    const account = await horizonServer.loadAccount(sourceAccount);
    const networkDetails = await getNetworkDetails();
    const networkPassphrase = networkDetails.networkPassphrase;
    const contract = new Contract(contractId);
    const tx = new SorobanTransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // Sign with Freighter
    const signed = await signTransaction(tx.toXDR(), networkPassphrase);
    // Submit
    // @ts-expect-error Soroban sendTransaction expects a string XDR, not a Transaction object
    const response = await sorobanServer.sendTransaction(signed.signedTxXdr);
    if (response.status && response.status.toUpperCase() === 'PENDING') {
      return { success: true, hash: response.hash };
    }
    return { success: response.status && response.status.toUpperCase() === 'SUCCESS', hash: response.hash };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function makeSorobanViewCall(
  contractId: string,
  method: string,
  args: any[]
): Promise<any> {
  try {
    const networkDetails = await getNetworkDetails();
    const networkPassphrase = networkDetails.networkPassphrase;
    const contract = new Contract(contractId);
    
    // Create a dummy account for view calls
    const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
    
    const tx = new SorobanTransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const response = await sorobanServer.simulateTransaction(tx);
    
    if (response.results && response.results.length > 0) {
      return scValToNative(response.results[0].xdr);
    }
    
    throw new Error('No result from contract call');
  } catch (error) {
    console.error(`View call failed for ${method}:`, error);
    throw error;
  }
}

// Calculate swap output based on mock prices and 0.3% fee
export async function calculateSwapOutput(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<string> {
  try {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      return '0';
    }

    // Get mock prices for both tokens
    const tokenInPrice = await getAssetPrice(tokenInSymbol);
    const tokenOutPrice = await getAssetPrice(tokenOutSymbol);
    
    const amountInNum = parseFloat(amountIn);
    const priceIn = parseFloat(tokenInPrice.price);
    const priceOut = parseFloat(tokenOutPrice.price);
    
    if (priceOut === 0) {
      return '0';
    }
    
    // Calculate value in USD
    const valueInUSD = amountInNum * priceIn;
    
    // Apply 0.3% protocol fee
    const valueAfterFee = valueInUSD * 0.997;
    
    // Convert to output token amount
    const outputAmount = valueAfterFee / priceOut;
    
    return outputAmount.toFixed(6);
  } catch (error) {
    console.error('Failed to calculate swap output:', error);
    return '0';
  }
}

// Get user position from Blend protocol
export async function getUserPosition(userAddress: string): Promise<UserPosition> {
  try {
    const args = [stringToAddress(userAddress)];
    const result = await makeSorobanViewCall(BLEND_CONTRACT_ID, 'get_user_position', args);
    
    // Parse the result and convert to human-readable format
    const position: UserPosition = {
      supplied: {},
      borrowed: {},
      collateralValue: '0',
      borrowValue: '0'
    };

    // Mock data for now - in a real implementation, you'd parse the contract result
    position.supplied = {
      'XLM': contractAmountToHuman('1000000000', 7), // 100 XLM
      'USDC': contractAmountToHuman('50000000', 6)   // 50 USDC
    };
    
    position.borrowed = {
      'USDC': contractAmountToHuman('25000000', 6)   // 25 USDC
    };
    
    position.collateralValue = '150.00';
    position.borrowValue = '25.00';
    
    return position;
  } catch (error) {
    console.error('Failed to get user position:', error);
    // Return empty position on error
    return {
      supplied: {},
      borrowed: {},
      collateralValue: '0',
      borrowValue: '0'
    };
  }
}

// Get health status for user position
export async function getHealthStatus(userAddress: string): Promise<HealthStatus> {
  try {
    const args = [stringToAddress(userAddress)];
    const result = await makeSorobanViewCall(BLEND_CONTRACT_ID, 'get_health_status', args);
    
    // Mock data for now - in a real implementation, you'd parse the contract result
    const healthStatus: HealthStatus = {
      healthFactor: '6.0',
      liquidationThreshold: '0.85',
      isHealthy: true
    };
    
    return healthStatus;
  } catch (error) {
    console.error('Failed to get health status:', error);
    // Return default healthy status on error
    return {
      healthFactor: '1.0',
      liquidationThreshold: '0.85',
      isHealthy: true
    };
  }
}

// Get asset price from oracle
export async function getAssetPrice(assetSymbol: string): Promise<AssetPrice> {
  try {
    const assetAddress = TOKEN_ADDRESSES[assetSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!assetAddress) {
      throw new Error('Unsupported asset');
    }
    
    const args = [stringToAddress(assetAddress)];
    const result = await makeSorobanViewCall(BLEND_CONTRACT_ID, 'get_asset_price', args);
    
    // Mock prices for now - in a real implementation, you'd parse the contract result
    const mockPrices: { [key: string]: string } = {
      'XLM': '0.12',
      'USDC': '1.00',
      'BLND': '0.05',
      'WETH': '2500.00',
      'WBTC': '45000.00'
    };
    
    const price: AssetPrice = {
      symbol: assetSymbol,
      price: mockPrices[assetSymbol] || '0.00',
      timestamp: Date.now()
    };
    
    return price;
  } catch (error) {
    console.error(`Failed to get price for ${assetSymbol}:`, error);
    // Return zero price on error
    return {
      symbol: assetSymbol,
      price: '0.00',
      timestamp: Date.now()
    };
  }
}

// Swap tokens
export async function swapTokens(
  userAddress: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string,
  minAmountOut: string,
  signTransaction: (xdr: string, network: string) => Promise<{ signedTxXdr: string }>
): Promise<TransactionResult> {
  try {
    const tokenInAddress = TOKEN_ADDRESSES[tokenInSymbol as keyof typeof TOKEN_ADDRESSES];
    const tokenOutAddress = TOKEN_ADDRESSES[tokenOutSymbol as keyof typeof TOKEN_ADDRESSES];
    
    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error('Unsupported token');
    }

    const tokenInDecimals = getTokenDecimals(tokenInSymbol);
    const tokenOutDecimals = getTokenDecimals(tokenOutSymbol);
    
    const amountInFormatted = amountToContractFormat(amountIn, tokenInDecimals);
    const minAmountOutFormatted = amountToContractFormat(minAmountOut, tokenOutDecimals);
    
    // Set deadline to 30 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1800;

    const args = [
      stringToAddress(userAddress),
      stringToAddress(tokenInAddress),
      stringToAddress(tokenOutAddress),
      nativeToScVal(amountInFormatted, { type: 'u128' }),
      nativeToScVal(minAmountOutFormatted, { type: 'u128' }),
      nativeToScVal(deadline, { type: 'u64' })
    ];

    return await buildAndSubmitSorobanTransaction(
      userAddress,
      BLEND_CONTRACT_ID,
      'swap_tokens',
      args,
      signTransaction
    );
  } catch (error) {
    console.error('Swap failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed'
    };
  }
}

// Borrow from Blend
export async function borrowFromBlend(
  userAddress: string,
  assetSymbol: string,
  amount: string,
  signTransaction: (xdr: string, network: string) => Promise<{ signedTxXdr: string }>
): Promise<TransactionResult> {
  try {
    const assetAddress = TOKEN_ADDRESSES[assetSymbol as keyof typeof TOKEN_ADDRESSES];
    
    if (!assetAddress) {
      throw new Error('Unsupported asset');
    }

    const assetDecimals = getTokenDecimals(assetSymbol);
    const amountFormatted = amountToContractFormat(amount, assetDecimals);

    const args = [
      stringToAddress(userAddress),
      stringToAddress(assetAddress),
      nativeToScVal(amountFormatted, { type: 'u128' })
    ];

    return await buildAndSubmitSorobanTransaction(
      userAddress,
      BLEND_CONTRACT_ID,
      'borrow_from_blend',
      args,
      signTransaction
    );
  } catch (error) {
    console.error('Borrow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Borrow failed'
    };
  }
}

// Stake BLEND tokens
export async function stakeBlend(
  userAddress: string,
  amount: string,
  signTransaction: (xdr: string, network: string) => Promise<{ signedTxXdr: string }>
): Promise<TransactionResult> {
  try {
    const blendDecimals = getTokenDecimals('BLND');
    const amountFormatted = amountToContractFormat(amount, blendDecimals);

    const args = [
      stringToAddress(userAddress),
      nativeToScVal(amountFormatted, { type: 'u128' })
    ];

    return await buildAndSubmitSorobanTransaction(
      userAddress,
      BLEND_CONTRACT_ID,
      'stake_blend',
      args,
      signTransaction
    );
  } catch (error) {
    console.error('Stake failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stake failed'
    };
  }
}

// Get supported tokens
export function getSupportedTokens(): string[] {
  return Object.keys(TOKEN_ADDRESSES);
}