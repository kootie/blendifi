import { isConnected as freighterIsConnected, getAddress, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Networks, TransactionBuilder, BASE_FEE, Keypair, Operation, Account, nativeToScVal, xdr } from '@stellar/stellar-sdk';
// import { SorobanRpc, Contract, nativeToScVal, scValToNative } from 'soroban-client';

// Connect to Stellar testnet
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
// export const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

// Replace with your deployed contract ID
export const CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE';

// Connect wallet (Freighter)
export async function connectWallet(): Promise<string | null> {
  try {
    // Prefer requestAccess for user prompt, fallback to getAddress
    const res = await requestAccess();
    if (res && res.address) return res.address;
    const addrRes = await getAddress();
    return addrRes && addrRes.address ? addrRes.address : null;
  } catch (e) {
    return null;
  }
}

// Check if wallet is connected
export async function walletIsConnected(): Promise<boolean> {
  const res = await freighterIsConnected();
  return !!res.isConnected;
}

// Helper to fetch account data from Horizon
export async function fetchAccount(pubKey: string) {
  const response = await fetch(`${HORIZON_URL}/accounts/${pubKey}`);
  if (!response.ok) throw new Error('Failed to fetch account');
  return response.json();
}

// Call Soroban contract method using only @stellar/stellar-sdk
export async function callContractMethod(method: 'swap_tokens' | 'stake_btokens' | 'borrow_from_blend', params: Record<string, unknown>) {
  // Get user public key
  let pubKey: string | null = null;
  const addrRes = await getAddress();
  if (addrRes && addrRes.address) pubKey = addrRes.address;
  if (!pubKey) {
    const reqRes = await requestAccess();
    if (reqRes && reqRes.address) pubKey = reqRes.address;
  }
  if (!pubKey) throw new Error('Wallet not connected');

  // Build contract call arguments as ScVals using nativeToScVal
  let contractArgs: xdr.ScVal[] = [];
  if (method === 'swap_tokens') {
    contractArgs = [
      nativeToScVal(pubKey, { type: 'address' }), // user address
      nativeToScVal(params.fromCrypto, { type: 'address' }), // token_a
      nativeToScVal(params.toCrypto, { type: 'address' }),   // token_b
      nativeToScVal(params.amount, { type: 'u64' }),         // amount_in
      nativeToScVal(1, { type: 'u64' }),                     // min_amount_out (placeholder)
      nativeToScVal(Math.floor(Date.now() / 1000) + 600, { type: 'u64' }) // deadline (10 min from now)
    ];
  } else if (method === 'stake_btokens') {
    contractArgs = [
      nativeToScVal(pubKey, { type: 'address' }), // user address
      nativeToScVal(params.fromCrypto, { type: 'address' }), // btoken
      nativeToScVal(params.amount, { type: 'u64' })          // amount
    ];
  } else if (method === 'borrow_from_blend') {
    contractArgs = [
      nativeToScVal(pubKey, { type: 'address' }), // user address
      nativeToScVal(params.toCrypto, { type: 'address' }), // asset
      nativeToScVal(params.amount, { type: 'u64' })        // amount
    ];
  } else {
    throw new Error('Unsupported contract method');
  }

  // Prepare contract call using Operation.invokeContractFunction
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

  // You would send the transaction to Soroban RPC here (not implemented in this snippet)
  // const sendResponse = await sorobanServer.sendTransaction(signedTx);
  // ...

  return { status: 'SIGNED', signedTx };
} 