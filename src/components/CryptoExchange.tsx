import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CryptoSelector from "./CryptoSelector";
import UserPortfolio from "./UserPortfolio";
import { 
  callContractMethod, 
  connectWallet, 
  walletIsConnected, 
  getUserPosition, 
  calculateHealthFactor,
  getAssetPrice,
  SUPPORTED_ASSETS 
} from "@/lib/stellar";

const CryptoExchange = () => {
  const [fromCrypto, setFromCrypto] = useState("USDC");
  const [toCrypto, setToCrypto] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<Record<string, unknown> | null>(null);
  const [healthFactor, setHealthFactor] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Connect wallet on component mount
  useEffect(() => {
    const initWallet = async () => {
      const isConnected = await walletIsConnected();
      if (isConnected) {
        const address = await connectWallet();
        setWalletAddress(address);
        if (address) {
          loadUserData(address);
        }
      }
    };
    initWallet();
  }, []);

  // Load user position and health factor
  const loadUserData = async (address: string) => {
    try {
      const position = await getUserPosition(address);
      setUserPosition(position);
      
      const health = await calculateHealthFactor(address);
      setHealthFactor(health);
      
      // Load prices for supported assets
      const priceData: Record<string, number> = {};
      for (const [symbol, asset] of Object.entries(SUPPORTED_ASSETS)) {
        const price = await getAssetPrice(asset.address);
        if (price) {
          priceData[symbol] = price;
        }
      }
      setPrices(priceData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        await loadUserData(address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Please install Freighter wallet and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleSwap = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callContractMethod("swap_tokens", {
        fromCrypto,
        toCrypto,
        amount: parseFloat(amount),
        minAmountOut: 1, // You might want to calculate this based on slippage
      });
      
      toast({
        title: "Swap Successful",
        description: `Swapped ${amount} ${fromCrypto} for ${toCrypto}`,
      });
      
      // Reload user data
      await loadUserData(walletAddress);
      setAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupply = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callContractMethod("supply_to_blend", {
        asset: fromCrypto,
        amount: parseFloat(amount),
      });
      
      toast({
        title: "Supply Successful",
        description: `Supplied ${amount} ${fromCrypto} to Blend`,
      });
      
      await loadUserData(walletAddress);
      setAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast({
        title: "Supply Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Check health factor before borrowing
    if (healthFactor && healthFactor < 1200000) { // 120% in basis points
      toast({
        title: "Insufficient Collateral",
        description: "Your health factor is too low to borrow",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callContractMethod("borrow_from_blend", {
        asset: toCrypto,
        amount: parseFloat(amount),
      });
      
      toast({
        title: "Borrow Successful",
        description: `Borrowed ${amount} ${toCrypto} from Blend`,
      });
      
      await loadUserData(walletAddress);
      setAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast({
        title: "Borrow Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callContractMethod("stake_btokens", {
        btoken: fromCrypto,
        amount: parseFloat(amount),
      });
      
      toast({
        title: "Stake Successful",
        description: `Staked ${amount} ${fromCrypto} bTokens`,
      });
      
      await loadUserData(walletAddress);
      setAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast({
        title: "Stake Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletAddress ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setWalletAddress(null)}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectWallet} className="w-full">
              Connect Freighter Wallet
            </Button>
          )}
        </CardContent>
      </Card>

      {/* User Portfolio - Show when wallet is connected */}
      {walletAddress && <UserPortfolio walletAddress={walletAddress} />}

      {/* User Position Summary */}
      {walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthFactor ? (healthFactor / 10000).toFixed(2) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Health Factor</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {userPosition?.supplied_assets ? Object.keys(userPosition.supplied_assets).length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Supplied Assets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {userPosition?.borrowed_assets ? Object.keys(userPosition.borrowed_assets).length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Borrowed Assets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Exchange Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            DeFi Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="supply">Supply</TabsTrigger>
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
              <TabsTrigger value="stake">Stake</TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CryptoSelector
                  selected={fromCrypto}
                  onSelect={(crypto) => setFromCrypto(crypto.code)}
                  label="From"
                />
                <CryptoSelector
                  selected={toCrypto}
                  onSelect={(crypto) => setToCrypto(crypto.code)}
                  label="To"
                />
              </div>
              
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {fromCrypto}
                </span>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const temp = fromCrypto;
                    setFromCrypto(toCrypto);
                    setToCrypto(temp);
                  }}
                  disabled={loading}
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleSwap} className="w-full" disabled={loading || !walletAddress}>
                {loading ? "Processing..." : "Swap Tokens"}
              </Button>
            </TabsContent>

            <TabsContent value="supply" className="space-y-4">
              <CryptoSelector
                selected={fromCrypto}
                onSelect={(crypto) => setFromCrypto(crypto.code)}
                label="Asset to Supply"
              />
              
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Amount to supply"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {fromCrypto}
                </span>
              </div>

              <Button onClick={handleSupply} className="w-full" disabled={loading || !walletAddress}>
                {loading ? "Processing..." : "Supply to Blend"}
              </Button>
            </TabsContent>

            <TabsContent value="borrow" className="space-y-4">
              <CryptoSelector
                selected={toCrypto}
                onSelect={(crypto) => setToCrypto(crypto.code)}
                label="Asset to Borrow"
              />
              
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Amount to borrow"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {toCrypto}
                </span>
              </div>

              <Button onClick={handleBorrow} className="w-full" disabled={loading || !walletAddress}>
                {loading ? "Processing..." : "Borrow from Blend"}
              </Button>
            </TabsContent>

            <TabsContent value="stake" className="space-y-4">
              <CryptoSelector
                selected={fromCrypto}
                onSelect={(crypto) => setFromCrypto(crypto.code)}
                label="bToken to Stake"
              />
              
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Amount to stake"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {fromCrypto}
                </span>
              </div>

              <Button onClick={handleStake} className="w-full" disabled={loading || !walletAddress}>
                {loading ? "Processing..." : "Stake bTokens"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoExchange;
