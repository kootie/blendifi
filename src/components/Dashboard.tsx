import React from 'react';

interface DashboardProps {
  balances: Record<string, number>;
  supplied: Record<string, number>;
  borrowed: Record<string, number>;
  healthFactor: number;
  rewards: number;
}

const SUPPORTED_TOKENS = ['XLM', 'USDC', 'USDT', 'BLND'];

const Dashboard: React.FC<DashboardProps> = ({ balances, supplied, borrowed, healthFactor, rewards }) => {
  return (
    <div className="p-4 border rounded shadow bg-white max-w-2xl mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4">Portfolio Dashboard</h2>
      <div className="mb-2">Health Factor: <span className="font-mono">{healthFactor}</span></div>
      <div className="mb-2">Rewards: <span className="font-mono">{rewards}</span></div>
      <div className="mb-4">Balances:
        <ul className="ml-4">
          {Object.entries(balances)
            .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
            .map(([symbol, amount]) => (
              <li key={symbol}>{symbol}: {amount}</li>
            ))}
        </ul>
      </div>
      <div className="mb-4">Supplied:
        <ul className="ml-4">
          {Object.entries(supplied)
            .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
            .map(([symbol, amount]) => (
              <li key={symbol}>{symbol}: {amount}</li>
            ))}
        </ul>
      </div>
      <div className="mb-4">Borrowed:
        <ul className="ml-4">
          {Object.entries(borrowed)
            .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
            .map(([symbol, amount]) => (
              <li key={symbol}>{symbol}: {amount}</li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard; 