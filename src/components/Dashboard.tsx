import React, { useState, useEffect } from 'react';
import { useFreighter } from '../hooks/useFreighter';
import { getUserPosition, getHealthStatus, getAssetPrice, TOKEN_ADDRESSES } from '../lib/blendClient';
import { toast } from 'sonner';

interface UserPosition {
  supplied_assets: Record<string, string>;
  borrowed_assets: Record<string, string>;
  staked_blend: string;
  rewards_earned: string;
  health_factor: string;
}

interface DashboardProps {
  balances: Record<string, number>;
}

const SUPPORTED_TOKENS = ['XLM', 'USDC', 'BLND', 'WETH', 'WBTC'];

const Dashboard: React.FC<DashboardProps> = ({ balances }) => {
  const { publicKey, connected } = useFreighter();
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [healthStatus, setHealthStatus] = useState<number>(0);
  const [assetPrices, setAssetPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user position and health status
  useEffect(() => {
    if (!connected || !publicKey) {
      setUserPosition(null);
      setHealthStatus(0);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user position
        const position = await getUserPosition(publicKey);
        if (position && typeof position === 'object') {
          setUserPosition(position as UserPosition);
        }

        // Fetch health status
        const health = await getHealthStatus(publicKey);
        setHealthStatus(health);

        // Fetch asset prices
        const prices: Record<string, string> = {};
        for (const token of SUPPORTED_TOKENS) {
          try {
            const price = await getAssetPrice(token);
            prices[token] = price;
          } catch (error) {
            console.error(`Failed to get price for ${token}:`, error);
            prices[token] = '0';
          }
        }
        setAssetPrices(prices);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Failed to load portfolio data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

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

  const formatAmount = (amount: string, decimals: number = 7): string => {
    const numAmount = parseFloat(amount) / Math.pow(10, decimals);
    return numAmount.toFixed(4);
  };

  const calculateHealthFactor = (): number => {
    if (!userPosition) return 0;
    const healthFactor = parseFloat(userPosition.health_factor) / Math.pow(10, 18);
    return healthFactor;
  };

  const calculateRewards = (): number => {
    if (!userPosition) return 0;
    return parseFloat(userPosition.rewards_earned) / Math.pow(10, 7); // BLND decimals
  };

  const getSuppliedAssets = (): Record<string, number> => {
    if (!userPosition) return {};
    const supplied: Record<string, number> = {};
    
    Object.entries(userPosition.supplied_assets).forEach(([address, amount]) => {
      const symbol = Object.keys(TOKEN_ADDRESSES).find(key => 
        TOKEN_ADDRESSES[key as keyof typeof TOKEN_ADDRESSES] === address
      );
      if (symbol) {
        supplied[symbol] = parseFloat(formatAmount(amount, getTokenDecimals(symbol)));
      }
    });
    
    return supplied;
  };

  const getBorrowedAssets = (): Record<string, number> => {
    if (!userPosition) return {};
    const borrowed: Record<string, number> = {};
    
    Object.entries(userPosition.borrowed_assets).forEach(([address, amount]) => {
      const symbol = Object.keys(TOKEN_ADDRESSES).find(key => 
        TOKEN_ADDRESSES[key as keyof typeof TOKEN_ADDRESSES] === address
      );
      if (symbol) {
        borrowed[symbol] = parseFloat(formatAmount(amount, getTokenDecimals(symbol)));
      }
    });
    
    return borrowed;
  };

  const getTokenDecimals = (symbol: string): number => {
    switch (symbol) {
      case 'USDC': return 6;
      case 'WETH': return 18;
      case 'WBTC': return 8;
      case 'BLND': 
      case 'XLM': 
      default: return 7;
    }
  };

  const healthFactor = calculateHealthFactor();
  const rewards = calculateRewards();
  const supplied = getSuppliedAssets();
  const borrowed = getBorrowedAssets();

  if (!connected) {
    return (
      <div className="blendify-card p-8 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Portfolio Dashboard</h2>
        <p className="text-muted-foreground">Please connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="blendify-card p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Portfolio Dashboard</h2>
        <p className="text-muted-foreground">Monitor your DeFi positions and performance</p>
      </div>

      {isLoading && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading portfolio data...
          </div>
        </div>
      )}

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
            {Object.keys(supplied).length + Object.keys(borrowed).length}
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
            {SUPPORTED_TOKENS.map(symbol => {
              const amount = balances[symbol] || 0;
              const price = assetPrices[symbol] || '0';
              const value = amount * parseFloat(price);
              
              return (
                <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <div>
                    <span className="font-medium">{symbol}</span>
                    {price !== '0' && (
                      <div className="text-xs text-muted-foreground">
                        ${parseFloat(price).toFixed(4)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{amount.toFixed(4)}</div>
                    {value > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ${value.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            {Object.entries(supplied).length > 0 ? (
              Object.entries(supplied).map(([symbol, amount]) => {
                const price = assetPrices[symbol] || '0';
                const value = amount * parseFloat(price);
                
                return (
                  <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                    <div>
                      <span className="font-medium">{symbol}</span>
                      {price !== '0' && (
                        <div className="text-xs text-muted-foreground">
                          ${parseFloat(price).toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{amount.toFixed(4)}</div>
                      {value > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ${value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No supplied assets
              </div>
            )}
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
            {Object.entries(borrowed).length > 0 ? (
              Object.entries(borrowed).map(([symbol, amount]) => {
                const price = assetPrices[symbol] || '0';
                const value = amount * parseFloat(price);
                
                return (
                  <div key={symbol} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                    <div>
                      <span className="font-medium">{symbol}</span>
                      {price !== '0' && (
                        <div className="text-xs text-muted-foreground">
                          ${parseFloat(price).toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{amount.toFixed(4)}</div>
                      {value > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ${value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No borrowed assets
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staking Info */}
      {userPosition && parseFloat(userPosition.staked_blend) > 0 && (
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Staking Position
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
              <span className="font-medium">Staked BLEND</span>
              <span className="font-mono text-sm">
                {formatAmount(userPosition.staked_blend, 7)} BLEND
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
              <span className="font-medium">Rewards Earned</span>
              <span className="font-mono text-sm">
                {formatAmount(userPosition.rewards_earned, 7)} BLEND
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 