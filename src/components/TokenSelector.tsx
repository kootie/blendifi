import React from 'react';

export interface Token {
  symbol: string;
  name: string;
  address: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selected: string;
  onChange: (symbol: string) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ tokens, selected, onChange }) => {
  return (
    <select
      className="blendify-input appearance-none cursor-pointer"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      {tokens.map(token => (
        <option key={token.symbol} value={token.symbol} className="py-2">
          {token.symbol} - {token.name}
        </option>
      ))}
    </select>
  );
};

export default TokenSelector; 