import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, DollarSign, Activity } from "lucide-react";
import { 
  getUserPosition, 
  calculateHealthFactor, 
  getAssetPrice, 
  SUPPORTED_ASSETS 
} from "@/lib/stellar";

interface UserPortfolioProps {
  walletAddress: string | null;
}

interface AssetPosition {
  symbol: string;
  amount: number;
  value: number;
  price: number;
}

const UserPortfolio = ({ walletAddress }: UserPortfolioProps) => {
  const [userPosition, setUserPosition] = useState<Record<string, unknown> | null>(null);
  const [healthFactor, setHealthFactor] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [suppliedAssets, setSuppliedAssets] = useState<AssetPosition[]>([]);
  const [borrowedAssets, setBorrowedAssets] = useState<AssetPosition[]>([]);
  const [totalCollateralValue, setTotalCollateralValue] = useState(0);
  const [totalBorrowedValue, setTotalBorrowedValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadPortfolioData();
    }
  }, [walletAddress]);

  const loadPortfolioData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Load user position
      const position = await getUserPosition(walletAddress);
      setUserPosition(position);

      // Load health factor
      const health = await calculateHealthFactor(walletAddress);
      setHealthFactor(health);

      // Load prices for all supported assets
      const priceData: Record<string, number> = {};
      for (const [symbol, asset] of Object.entries(SUPPORTED_ASSETS)) {
        const price = await getAssetPrice(asset.address);
        if (price) {
          priceData[symbol] = price;
        }
      }
      setPrices(priceData);

      // Process supplied assets
      if (position?.supplied_assets) {
        const supplied: AssetPosition[] = [];
        let totalCollateral = 0;

        for (const [assetAddress, amount] of Object.entries(position.supplied_assets)) {
          const asset = Object.entries(SUPPORTED_ASSETS).find(([_, config]) => config.address === assetAddress);
          if (asset) {
            const [symbol, config] = asset;
            const price = priceData[symbol] || 0;
            const value = (amount as number) * price;
            const collateralValue = value * (config.collateral_factor / 10000);
            
            supplied.push({
              symbol,
              amount: amount as number,
              value,
              price
            });
            
            totalCollateral += collateralValue;
          }
        }
        
        setSuppliedAssets(supplied);
        setTotalCollateralValue(totalCollateral);
      }

      // Process borrowed assets
      if (position?.borrowed_assets) {
        const borrowed: AssetPosition[] = [];
        let totalBorrowed = 0;

        for (const [assetAddress, amount] of Object.entries(position.borrowed_assets)) {
          const asset = Object.entries(SUPPORTED_ASSETS).find(([_, config]) => config.address === assetAddress);
          if (asset) {
            const [symbol, config] = asset;
            const price = priceData[symbol] || 0;
            const value = (amount as number) * price;
            
            borrowed.push({
              symbol,
              amount: amount as number,
              value,
              price
            });
            
            totalBorrowed += value;
          }
        }
        
        setBorrowedAssets(borrowed);
        setTotalBorrowedValue(totalBorrowed);
      }

    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthFactorColor = (health: number) => {
    if (health >= 1500000) return "text-green-600"; // > 150%
    if (health >= 1200000) return "text-yellow-600"; // > 120%
    return "text-red-600"; // < 120%
  };

  const getHealthFactorStatus = (health: number) => {
    if (health >= 1500000) return "Safe";
    if (health >= 1200000) return "Warning";
    return "Danger";
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">
                ${totalCollateralValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Collateral</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600">
                ${totalBorrowedValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Borrowed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600">
                ${(totalCollateralValue - totalBorrowedValue).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Net Position</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
              <div className={`text-2xl font-bold ${getHealthFactorColor(healthFactor || 0)}`}>
                {healthFactor ? (healthFactor / 10000).toFixed(2) : 'N/A'}%
              </div>
              <div className="text-sm text-muted-foreground">Health Factor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Factor Details */}
      {healthFactor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Health Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Health Factor</span>
                <Badge variant={healthFactor >= 1200000 ? "default" : "destructive"}>
                  {getHealthFactorStatus(healthFactor)}
                </Badge>
              </div>
              <Progress 
                value={Math.min((healthFactor / 10000), 200)} 
                max={200}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Health factor below 120% may result in liquidation
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplied Assets */}
      {suppliedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Supplied Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suppliedAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.amount.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.value.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      ${asset.price.toFixed(4)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Borrowed Assets */}
      {borrowedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Borrowed Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {borrowedAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.amount.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.value.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      ${asset.price.toFixed(4)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && suppliedAssets.length === 0 && borrowedAssets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Positions</h3>
            <p className="text-muted-foreground">
              Start by supplying assets or borrowing to see your portfolio here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserPortfolio; 