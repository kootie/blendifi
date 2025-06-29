import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import TokenSelector, { Token } from './TokenSelector';
import TxButton from './TxButton';

const TOKENS: Token[] = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'native' },
  { symbol: 'USDC', name: 'USD Coin', address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
  { symbol: 'BLND', name: 'Blend Token', address: 'GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY' },
  { symbol: 'WETH', name: 'Wrapped Ethereum', address: 'GBETHKBLNBSBXVLTKWLB6L3X3RTMAKKI64JUNNQO5EUXYYTYO3O3G2YH' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: 'GDXTJEK4JZNSTNQAWA53RZNS2MDXYD2SMT6Q7JH2CU2B6Y2DRX6XM3UB' },
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
    <div className="blendify-card p-8">
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="swap" className="blendify-tab blendify-tab-inactive data-[state=active]:blendify-tab-active">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </div>
          </TabsTrigger>
          <TabsTrigger value="borrow" className="blendify-tab blendify-tab-inactive data-[state=active]:blendify-tab-active">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Borrow
            </div>
          </TabsTrigger>
          <TabsTrigger value="stake" className="blendify-tab blendify-tab-inactive data-[state=active]:blendify-tab-active">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Stake
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Token Swap</h3>
            <p className="text-muted-foreground">Exchange tokens with competitive rates and minimal slippage</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From Token</label>
              <TokenSelector tokens={TOKENS} selected={fromToken} onChange={setFromToken} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">To Token</label>
              <TokenSelector tokens={TOKENS} selected={toToken} onChange={setToToken} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <input
                className="blendify-input"
                type="number"
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <TxButton onClick={async () => alert('Swap logic goes here!')}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swap Tokens
              </div>
            </TxButton>
          </div>
        </TabsContent>

        <TabsContent value="borrow" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Borrow Assets</h3>
            <p className="text-muted-foreground">Borrow against your supplied collateral with flexible terms</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Asset to Borrow</label>
              <TokenSelector tokens={TOKENS} selected={borrowToken} onChange={setBorrowToken} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <input
                className="blendify-input"
                type="number"
                value={borrowAmount}
                onChange={e => setBorrowAmount(e.target.value)}
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <TxButton onClick={async () => alert('Borrow logic goes here!')}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Borrow Asset
              </div>
            </TxButton>
          </div>
        </TabsContent>

        <TabsContent value="stake" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Stake BLEND</h3>
            <p className="text-muted-foreground">Stake your BLEND tokens to earn rewards and participate in governance</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Token to Stake</label>
              <TokenSelector tokens={TOKENS.filter(t => t.symbol === 'BLND')} selected={stakeToken} onChange={setStakeToken} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <input
                className="blendify-input"
                type="number"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <TxButton onClick={async () => alert('Stake logic goes here!')}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Stake BLEND
              </div>
            </TxButton>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFiTabs; 