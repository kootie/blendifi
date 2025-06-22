import React, { useState } from 'react';
import { useFreighter } from '../hooks/useFreighter';

const WalletConnect: React.FC = () => {
  const { publicKey, network, error, connect } = useFreighter();

  return (
    <div className="p-4 border rounded shadow bg-white max-w-md mx-auto mt-8">
      <h2 className="text-lg font-bold mb-2">Connect Freighter Wallet</h2>
      {publicKey ? (
        <div>
          <div className="mb-2">Connected: <span className="font-mono">{publicKey}</span></div>
          <div className="mb-2">Network: <span className="font-mono">{network}</span></div>
        </div>
      ) : (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={connect}
        >
          Connect Freighter
        </button>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default WalletConnect; 