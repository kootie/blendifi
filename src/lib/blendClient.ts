// Simple contract integration using Freighter API
// This provides the interface for swap, borrow, and stake operations

import StellarSdk from 'stellar-sdk';
import { Server as SorobanServer, TransactionBuilder as SorobanTransactionBuilder, nativeToScVal, Contract } from 'soroban-client';
import { getNetworkDetails } from '@stellar/freighter-api';
const { Server, BASE_FEE, Networks } = StellarSdk;
const xdr = StellarSdk.xdr;

const BLEND_CONTRACT_ID = 'CA26SDP73CGMH5E5HHTHT3DN4YPH4DJUNRBRHPB4ZJTF2DQXDMCXXTZH';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const sorobanServer = new SorobanServer(SOROBAN_RPC_URL);
const horizonServer = new Server(HORIZON_URL);

// Token addresses from the smart contract
export const TOKEN_ADDRESSES = {
  XLM: 'native',
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
    return nativeToScVal('native');
  }
  return nativeToScVal(address);
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