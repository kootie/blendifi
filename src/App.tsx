import React from 'react';
import WalletConnect from './components/WalletConnect';
import DeFiTabs from './components/DeFiTabs';
import Dashboard from './components/Dashboard';
import { FreighterProvider, useFreighter } from './hooks/useFreighter.tsx';
import { useBalances } from './hooks/useBalances';

const AppContent: React.FC = () => {
  const { publicKey, connected } = useFreighter();
  const balances = useBalances(publicKey);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 blendify-gradient opacity-5"></div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
              Blendify DeFi Hub
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The next-generation DeFi platform on Stellar. Swap, borrow, and stake with advanced liquidation protection.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Wallet Connection */}
          <div className="mb-8">
            <WalletConnect />
          </div>

          {/* DeFi Interface */}
          {connected && publicKey && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                  DeFi Operations
                </h2>
                <p className="text-muted-foreground">
                  Connected: <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                  </span>
                </p>
              </div>
              
              {/* Dashboard */}
              <Dashboard balances={balances} />
              
              {/* DeFi Tabs */}
              <DeFiTabs />
            </div>
          )}

          {/* Features Grid */}
          {!connected && (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="blendify-card p-6 text-center">
                <div className="w-12 h-12 blendify-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Swapping</h3>
                <p className="text-muted-foreground">Swap tokens with competitive rates and minimal slippage</p>
              </div>

              <div className="blendify-card p-6 text-center">
                <div className="w-12 h-12 blendify-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Lending & Borrowing</h3>
                <p className="text-muted-foreground">Borrow against your assets with flexible terms</p>
              </div>

              <div className="blendify-card p-6 text-center">
                <div className="w-12 h-12 blendify-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Staking Rewards</h3>
                <p className="text-muted-foreground">Earn rewards by staking BLEND tokens</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Blendify. Built on Stellar with advanced DeFi protocols.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <FreighterProvider>
    <AppContent />
  </FreighterProvider>
);

export default App;
