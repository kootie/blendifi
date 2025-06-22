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
      className="border rounded px-2 py-1"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      {tokens.map(token => (
        <option key={token.symbol} value={token.symbol}>
          {token.symbol} - {token.name}
        </option>
      ))}
    </select>
  );
};

export default TokenSelector; 