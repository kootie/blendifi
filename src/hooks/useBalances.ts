import { useEffect, useState } from 'react';
import { TOKEN_ADDRESSES } from '../lib/blendClient';

const ASSET_ISSUERS: Record<string, string> = {
  USDC: TOKEN_ADDRESSES.USDC,
  BLND: TOKEN_ADDRESSES.BLND,
  WETH: TOKEN_ADDRESSES.WETH,
  WBTC: TOKEN_ADDRESSES.WBTC,
};

const SUPPORTED_TOKENS = ['XLM', 'USDC', 'BLND', 'WETH', 'WBTC'];

export function useBalances(publicKey: string | null) {
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!publicKey) return;
    const fetchBalances = async () => {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      const data = await res.json();
      const bals: Record<string, number> = {};
      for (const bal of data.balances) {
        if (bal.asset_type === 'native') {
          bals['XLM'] = parseFloat(bal.balance);
        } else {
          // Find the symbol by asset_code and asset_issuer
          const symbol = Object.entries(ASSET_ISSUERS).find(
            ([sym, issuer]) => bal.asset_code === sym && bal.asset_issuer === issuer
          )?.[0];
          if (symbol) {
            bals[symbol] = parseFloat(bal.balance);
          }
        }
      }
      // Ensure all supported tokens are present (default to 0)
      for (const sym of SUPPORTED_TOKENS) {
        if (!(sym in bals)) bals[sym] = 0;
      }
      setBalances(bals);
    };
    fetchBalances();
  }, [publicKey]);

  return balances;
} 