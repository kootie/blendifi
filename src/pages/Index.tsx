import Navbar from "@/components/Navbar";
import CryptoExchange from "@/components/CryptoExchange";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Stellar DeFi Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Swap, lend, borrow, and stake on Stellar with Blend integration
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>• Multi-asset support</span>
            <span>• Blend lending pools</span>
            <span>• Soroswap integration</span>
            <span>• Staking rewards</span>
          </div>
        </div>
        
        <CryptoExchange />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-lg bg-muted">
            <h3 className="font-semibold mb-2">Swap Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Exchange cryptocurrencies instantly with Soroswap integration and protocol fee collection
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted">
            <h3 className="font-semibold mb-2">Lend & Borrow</h3>
            <p className="text-sm text-muted-foreground">
              Supply assets to Blend pools and borrow against your collateral with health factor monitoring
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted">
            <h3 className="font-semibold mb-2">Stake & Earn</h3>
            <p className="text-sm text-muted-foreground">
              Stake bTokens to earn protocol fees and rewards from collected swap fees
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-lg bg-card border">
          <h2 className="text-2xl font-bold mb-4 text-center">Supported Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries({
              USDC: "USD Coin",
              USDT: "Tether",
              XLM: "Stellar",
              BTC: "Bitcoin",
              ETH: "Ethereum",
              DIA: "DIA",
              LINK: "Chainlink",
              UNI: "Uniswap",
              AAVE: "Aave",
              MATIC: "Polygon"
            }).map(([symbol, name]) => (
              <div key={symbol} className="text-center p-3 rounded border">
                <div className="font-semibold">{symbol}</div>
                <div className="text-sm text-muted-foreground">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
