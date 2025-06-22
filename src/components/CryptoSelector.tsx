import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_ASSETS } from "@/lib/stellar";

// Convert SUPPORTED_ASSETS to the format expected by the component
const cryptos = Object.entries(SUPPORTED_ASSETS).map(([code, asset]) => ({
  code,
  name: asset.symbol,
  address: asset.address,
  decimals: asset.decimals,
  collateral_factor: asset.collateral_factor,
}));

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
        <DropdownMenuContent className="w-[200px] max-h-60 overflow-y-auto">
          {cryptos.map((crypto) => (
            <DropdownMenuItem
              key={crypto.code}
              onClick={() => onSelect(crypto)}
              className="justify-between"
            >
              <div className="flex flex-col">
                <span>{crypto.name} ({crypto.code})</span>
                <span className="text-xs text-muted-foreground">
                  Collateral: {(crypto.collateral_factor / 100).toFixed(0)}%
                </span>
              </div>
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
