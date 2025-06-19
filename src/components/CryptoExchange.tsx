import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";
import CryptoSelector from "./CryptoSelector";
import { callContractMethod } from "@/lib/stellar";

// Map crypto codes to their Stellar addresses or contract addresses
const ASSET_ADDRESSES: Record<string, string> = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  BLND: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
  USDC: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
  wETH: "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE",
  wBTC: "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI",
  // Add other tokens as needed
};

const CryptoExchange = () => {
  const [fromCrypto, setFromCrypto] = useState("USDC");
  const [toCrypto, setToCrypto] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSwap = async () => {
    setLoading(true);
    try {
      const result = await callContractMethod("swap_tokens", {
        fromCrypto: ASSET_ADDRESSES[fromCrypto] || fromCrypto,
        toCrypto: ASSET_ADDRESSES[toCrypto] || toCrypto,
        amount: Number(amount),
      });
      alert("Swap successful: " + JSON.stringify(result));
    } catch (e: unknown) {
      const message = typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
      alert("Swap failed: " + message);
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
    } catch (e: unknown) {
      const message = typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
      alert("Staking failed: " + message);
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
    } catch (e: unknown) {
      const message = typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
      alert("Loan request failed: " + message);
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
