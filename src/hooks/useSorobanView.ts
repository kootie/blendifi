import { useEffect, useState } from 'react';

export function useSorobanView(publicKey: string | null) {
  const [supplied, setSupplied] = useState<Record<string, number>>({});
  const [borrowed, setBorrowed] = useState<Record<string, number>>({});
  const [healthFactor, setHealthFactor] = useState(0);
  const [rewards, setRewards] = useState(0);

  useEffect(() => {
    if (!publicKey) return;
    // TODO: Fetch from Blend contract using soroban-client
    // Placeholder values:
    setSupplied({ USDC: 100, XLM: 50 });
    setBorrowed({ USDT: 20 });
    setHealthFactor(1.5);
    setRewards(10);
  }, [publicKey]);

  return { supplied, borrowed, healthFactor, rewards };
} 