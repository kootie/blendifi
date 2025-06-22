import { useEffect, useState } from 'react';

export function useBalances(publicKey: string | null) {
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!publicKey) return;
    const fetchBalances = async () => {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      const data = await res.json();
      const bals: Record<string, number> = {};
      for (const bal of data.balances) {
        bals[bal.asset_code || 'XLM'] = parseFloat(bal.balance);
      }
      setBalances(bals);
    };
    fetchBalances();
  }, [publicKey]);

  return balances;
} 