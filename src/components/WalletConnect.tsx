import React from 'react';
import { useFreighter } from '../hooks/useFreighter.tsx';

const WalletConnect: React.FC = () => {
  const { publicKey, network, networkDetails, error, connected, connect, disconnect } = useFreighter();

  return (
    <div className="blendify-card p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 blendify-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Wallet</h2>
        <p className="text-muted-foreground">Connect your Freighter wallet to access DeFi features</p>
      </div>
      
      {connected && publicKey ? (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Address:</span>
                <div className="font-mono text-sm bg-background px-3 py-2 rounded border break-all">
                  {publicKey}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-muted-foreground">Network:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{network}</span>
                  {network === 'TESTNET' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Testnet
                    </span>
                  )}
                </div>
              </div>
              
              {networkDetails && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Network URL:</span>
                  <div className="text-sm text-muted-foreground truncate">
                    {networkDetails.networkUrl}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            className="w-full blendify-button-secondary"
            onClick={disconnect}
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Disconnected
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Make sure Freighter extension is installed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Set network to Testnet for development</span>
              </div>
            </div>
          </div>
          
          <button
            className="w-full blendify-button-primary"
            onClick={connect}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Freighter
            </div>
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-destructive mb-1">Connection Error</h4>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 