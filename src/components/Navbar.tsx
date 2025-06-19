import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { connectWallet } from "@/lib/stellar";

const Navbar = () => {
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    const pubKey = await connectWallet();
    setAddress(pubKey);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img src="/blendifi2.jpg" alt="BlendiFi Logo" className="h-8 w-auto" />
            <span className="hidden font-bold sm:inline-block">BlendiFi</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {address ? (
            <span className="text-xs font-mono bg-muted px-3 py-1 rounded">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          ) : (
            <Button onClick={handleConnect}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
