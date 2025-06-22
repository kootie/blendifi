import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import TokenSelector, { Token } from './TokenSelector';
import TxButton from './TxButton';

const TOKENS: Token[] = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'native' },
  { symbol: 'USDC', name: 'USD Coin', address: 'GA5ZSE9EQLFZB5E34TRTFWNW5T76W2KQZ7ZYPZB2O2C3Y5QTKH7C5OL6' },
  { symbol: 'USDT', name: 'Tether', address: 'GAP5LETOVHK3YHGGQ5DLVZ5P7FSVJYZAPVZCFAWAW7A4M23TLH6Y2D2I' },
  { symbol: 'BLND', name: 'Blend Token', address: 'GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY' },
];

const DeFiTabs: React.FC = () => {
  const [fromToken, setFromToken] = useState('XLM');
  const [toToken, setToToken] = useState('USDC');
  const [swapAmount, setSwapAmount] = useState('');
  const [borrowToken, setBorrowToken] = useState('USDC');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [stakeToken, setStakeToken] = useState('BLND');
  const [stakeAmount, setStakeAmount] = useState('');

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <Tabs defaultValue="swap">
        <TabsList className="mb-4">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="borrow">Borrow</TabsTrigger>
          <TabsTrigger value="stake">Stake</TabsTrigger>
        </TabsList>
        <TabsContent value="swap">
          <div className="flex gap-4 items-end mb-4">
            <div>
              <label className="block mb-1">From:</label>
              <TokenSelector tokens={TOKENS} selected={fromToken} onChange={setFromToken} />
            </div>
            <div>
              <label className="block mb-1">To:</label>
              <TokenSelector tokens={TOKENS} selected={toToken} onChange={setToToken} />
            </div>
            <div>
              <label className="block mb-1">Amount:</label>
              <input
                className="border rounded px-2 py-1 w-24"
                type="number"
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                min="0"
              />
            </div>
            <TxButton onClick={async () => alert('Swap logic goes here!')}>Swap</TxButton>
          </div>
        </TabsContent>
        <TabsContent value="borrow">
          <div className="flex gap-4 items-end mb-4">
            <div>
              <label className="block mb-1">Asset:</label>
              <TokenSelector tokens={TOKENS} selected={borrowToken} onChange={setBorrowToken} />
            </div>
            <div>
              <label className="block mb-1">Amount:</label>
              <input
                className="border rounded px-2 py-1 w-24"
                type="number"
                value={borrowAmount}
                onChange={e => setBorrowAmount(e.target.value)}
                min="0"
              />
            </div>
            <TxButton onClick={async () => alert('Borrow logic goes here!')}>Borrow</TxButton>
          </div>
        </TabsContent>
        <TabsContent value="stake">
          <div className="flex gap-4 items-end mb-4">
            <div>
              <label className="block mb-1">Token:</label>
              <TokenSelector tokens={TOKENS} selected={stakeToken} onChange={setStakeToken} />
            </div>
            <div>
              <label className="block mb-1">Amount:</label>
              <input
                className="border rounded px-2 py-1 w-24"
                type="number"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                min="0"
              />
            </div>
            <TxButton onClick={async () => alert('Stake logic goes here!')}>Stake</TxButton>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFiTabs; 