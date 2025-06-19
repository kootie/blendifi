import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const cryptos = [
  { code: "USDC", name: "USD Coin" },
  { code: "USDT", name: "Tether" },
  { code: "XLM", name: "Stellar" },
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "DIA", name: "DIA" },
  { code: "LINK", name: "Chainlink" },
  { code: "UNI", name: "Uniswap" },
  { code: "AAVE", name: "Aave" },
  { code: "MATIC", name: "Polygon" },
];

interface CryptoSelectorProps {
  selected: string;
  onSelect: (crypto: typeof cryptos[0]) => void;
  label?: string;
}

const CryptoSelector = ({ selected, onSelect, label }: CryptoSelectorProps) => {
  const selectedCrypto = cryptos.find((c) => c.code === selected);

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedCrypto ? `${selectedCrypto.name} (${selectedCrypto.code})` : "Select Cryptocurrency"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          {cryptos.map((crypto) => (
            <DropdownMenuItem
              key={crypto.code}
              onClick={() => onSelect(crypto)}
              className="justify-between"
            >
              {crypto.name} ({crypto.code})
              {selected === crypto.code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CryptoSelector;
export { CryptoSelector };
