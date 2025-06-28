import React from 'react';
import WalletConnect from './components/WalletConnect';
import DeFiTabs from './components/DeFiTabs';
import { FreighterProvider, useFreighter } from './hooks/useFreighter.tsx';

const AppContent: React.FC = () => {
  const { publicKey } = useFreighter();
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-center mt-6">Stellar DeFi Hub (Freighter Only)</h1>
      <WalletConnect />
      {publicKey && <DeFiTabs />}
    </div>
  );
};

const App: React.FC = () => (
  <FreighterProvider>
    <AppContent />
  </FreighterProvider>
);

export default App;
