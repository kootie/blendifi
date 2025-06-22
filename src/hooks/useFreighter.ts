import { createContext, useContext, useState, ReactNode } from 'react';

interface FreighterContextType {
  publicKey: string | null;
  network: string | null;
  error: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  signTransaction: (xdr: string, network: string) => Promise<any>;
}

const FreighterContext = createContext<FreighterContextType | undefined>(undefined);

export function FreighterProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = async () => {
    setError(null);
    if (!('freighterApi' in window)) {
      setError('Freighter extension not found.');
      return;
    }
    try {
      const isConnected = await (window as any).freighterApi.isConnected();
      if (!isConnected) {
        await (window as any).freighterApi.connect();
      }
      const pubKey = await (window as any).freighterApi.getPublicKey();
      const net = await (window as any).freighterApi.getNetwork();
      setPublicKey(pubKey);
      setNetwork(net);
      setConnected(true);
    } catch (e) {
      setError('Failed to connect to Freighter.');
    }
  };

  const signTransaction = async (xdr: string, network: string) => {
    if (!('freighterApi' in window)) throw new Error('Freighter not found');
    return (window as any).freighterApi.signTransaction(xdr, { network });
  };

  return (
    <FreighterContext.Provider value={{ publicKey, network, error, connected, connect, signTransaction }}>
      {children}
    </FreighterContext.Provider>
  );
}

export function useFreighter() {
  const context = useContext(FreighterContext);
  if (!context) {
    throw new Error('useFreighter must be used within a FreighterProvider');
  }
  return context;
} 