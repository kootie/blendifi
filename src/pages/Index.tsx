import Navbar from "@/components/Navbar";
import CryptoExchange from "@/components/CryptoExchange";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Crypto Exchange
          </h1>
          <p className="text-xl text-muted-foreground">
            Exchange crypto seamlessly
          </p>
        </div>
        
        <div className="grid gap-8">
          <CryptoExchange />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">Swap your crypto</h3>
              <p className="text-sm text-muted-foreground">
                Swap your crypto instantly
              </p>
            </div>
            <div className="p-6 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">Staking Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Earn from your staked portion
              </p>
            </div>
            <div className="p-6 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">Multiple Cryptos</h3>
              <p className="text-sm text-muted-foreground">
                Support for multiple cryptocurrencies
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
