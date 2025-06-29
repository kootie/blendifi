import React from 'react';

interface DashboardProps {
  balances: Record<string, number>;
  supplied: Record<string, number>;
  borrowed: Record<string, number>;
  healthFactor: number;
  rewards: number;
}

const SUPPORTED_TOKENS = ['XLM', 'USDC', 'BLND', 'WETH', 'WBTC'];

const Dashboard: React.FC<DashboardProps> = ({ balances, supplied, borrowed, healthFactor, rewards }) => {
  const getHealthFactorColor = (factor: number) => {
    if (factor >= 1.15) return 'text-green-600';
    if (factor >= 1.03) return 'text-yellow-600';
    if (factor >= 1.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthFactorStatus = (factor: number) => {
    if (factor >= 1.15) return 'Healthy';
    if (factor >= 1.03) return 'Warning';
    if (factor >= 1.0) return 'Critical';
    return 'Liquidatable';
  };

  return (
    <div className="blendify-card p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Portfolio Dashboard</h2>
        <p className="text-muted-foreground">Monitor your DeFi positions and performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {healthFactor.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${getHealthFactorColor(healthFactor)}`}>
            {getHealthFactorStatus(healthFactor)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Health Factor</div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {rewards.toFixed(4)}
          </div>
          <div className="text-sm font-medium text-secondary">BLEND</div>
          <div className="text-xs text-muted-foreground mt-1">Rewards Earned</div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {Object.keys(supplied).length}
          </div>
          <div className="text-sm font-medium text-primary">Active</div>
          <div className="text-xs text-muted-foreground mt-1">Positions</div>
        </div>
      </div>

      {/* Token Balances */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Balances
          </h3>
          <div className="space-y-2">
            {Object.entries(balances)
              .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
              .map(([symbol, amount]) => (
                <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <span className="font-medium">{symbol}</span>
                  <span className="font-mono text-sm">{amount.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Supplied
          </h3>
          <div className="space-y-2">
            {Object.entries(supplied)
              .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
              .map(([symbol, amount]) => (
                <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <span className="font-medium">{symbol}</span>
                  <span className="font-mono text-sm">{amount.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Borrowed
          </h3>
          <div className="space-y-2">
            {Object.entries(borrowed)
              .filter(([symbol]) => SUPPORTED_TOKENS.includes(symbol))
              .map(([symbol, amount]) => (
                <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <span className="font-medium">{symbol}</span>
                  <span className="font-mono text-sm">{amount.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 