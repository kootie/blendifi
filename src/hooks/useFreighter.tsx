import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  isConnected,
  requestAccess,
  getNetwork,
  getNetworkDetails,
  signTransaction as freighterSignTransaction,
  WatchWalletChanges
} from '@stellar/freighter-api';

interface NetworkDetails {
  network: string;
  networkUrl: string;
  networkPassphrase: string;
  sorobanRpcUrl?: string;
}

interface FreighterContextType {
  publicKey: string | null;
  network: string | null;
  networkDetails: NetworkDetails | null;
  error: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  signTransaction: (xdr: string, network: string) => Promise<{ signedTxXdr: string; signerAddress: string; }>;
  disconnect: () => void;
}

const FreighterContext = createContext<FreighterContextType | undefined>(undefined);

export function FreighterProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkDetails, setNetworkDetails] = useState<NetworkDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [watcher, setWatcher] = useState<WatchWalletChanges | null>(null);

  const connect = async () => {
    setError(null);
    try {
      const connectionStatus = await isConnected();
      console.log('Freighter connection status:', connectionStatus);
      
      if (!connectionStatus.isConnected) {
        setError('Freighter extension not found. Please install Freighter and refresh the page.');
        return;
      }

      const accessResult = await requestAccess();
      console.log('Freighter access result:', accessResult);
      
      if (accessResult.error) {
        setError(`Failed to get access: ${accessResult.error}`);
        return;
      }

      const address = accessResult.address;
      if (!address) {
        setError('Failed to get public key from Freighter.');
        return;
      }

      const networkResult = await getNetwork();
      console.log('Freighter network result:', networkResult);
      
      if (networkResult.error) {
        setError(`Failed to get network: ${networkResult.error}`);
        return;
      }

      const networkDetailsResult = await getNetworkDetails();
      console.log('Freighter network details result:', networkDetailsResult);

      setPublicKey(address);
      setNetwork(networkResult.network);
      setNetworkDetails(networkDetailsResult);
      setConnected(true);
      setError(null);

      startWatching();

    } catch (e) {
      console.error('Freighter connection error:', e);
      setError(`Failed to connect to Freighter: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const startWatching = () => {
    if (watcher) {
      watcher.stop();
    }
    
    const newWatcher = new WatchWalletChanges(3000);
    newWatcher.watch((results) => {
      console.log('Freighter wallet change detected:', results);
      setPublicKey(results.address);
      setNetwork(results.network);
    });
    
    setWatcher(newWatcher);
  };

  const disconnect = () => {
    if (watcher) {
      watcher.stop();
      setWatcher(null);
    }
    setPublicKey(null);
    setNetwork(null);
    setNetworkDetails(null);
    setConnected(false);
    setError(null);
  };

  const signTransaction = async (xdr: string, network: string) => {
    try {
      const result = await freighterSignTransaction(xdr, { 
        networkPassphrase: network === 'TESTNET' 
          ? 'Test SDF Network ; September 2015' 
          : 'Public Global Stellar Network ; September 2015'
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (e) {
      console.error('Transaction signing error:', e);
      throw e;
    }
  };

  useEffect(() => {
    return () => {
      if (watcher) {
        watcher.stop();
      }
    };
  }, [watcher]);

  return (
    <FreighterContext.Provider value={{ 
      publicKey, 
      network, 
      networkDetails,
      error, 
      connected, 
      connect, 
      signTransaction,
      disconnect 
    }}>
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