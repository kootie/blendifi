import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";
import CryptoSelector from "./CryptoSelector";
import { callContractMethod } from "@/lib/stellar";

const CryptoExchange = () => {
  const [fromCrypto, setFromCrypto] = useState("USDC");
  const [toCrypto, setToCrypto] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSwap = async () => {
    setLoading(true);
    try {
      const result = await callContractMethod("swap_tokens", {
        fromCrypto,
        toCrypto,
        amount: Number(amount),
      });
      alert("Swap successful: " + JSON.stringify(result));
    } catch (e: any) {
      alert("Swap failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStaking = async () => {
    setLoading(true);
    try {
      const result = await callContractMethod("stake_btokens", {
        fromCrypto,
        amount: Number(amount),
      });
      alert("Staking successful: " + JSON.stringify(result));
    } catch (e: any) {
      alert("Staking failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoan = async () => {
    setLoading(true);
    try {
      const result = await callContractMethod("borrow_from_blend", {
        toCrypto,
        amount: Number(amount),
      });
      alert("Loan request successful: " + JSON.stringify(result));
    } catch (e: any) {
      alert("Loan request failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Exchange Cryptocurrency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <CryptoSelector
            selected={fromCrypto}
            onSelect={(crypto) => setFromCrypto(crypto.code)}
            label="From"
          />
          
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

        <CryptoSelector
          selected={toCrypto}
          onSelect={(crypto) => setToCrypto(crypto.code)}
          label="To"
        />

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Select staking or loan amounts based on your collateral.
          </div>
          <Button onClick={handleSwap} className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Swap"}
          </Button>
          <Button onClick={handleStaking} className="w-full" variant="outline" disabled={loading}>
            Staking
          </Button>
          <Button onClick={handleLoan} className="w-full" variant="outline" disabled={loading}>
            Loan Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoExchange;
