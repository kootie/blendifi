import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import TokenSelector, { Token } from './TokenSelector';
import TxButton from './TxButton';
import { swapTokens, borrowFromBlend, stakeBlend, calculateSwapOutput, TOKEN_ADDRESSES } from '../lib/blendClient';
import { useFreighter } from '../hooks/useFreighter';
import { toast } from 'sonner';

const TOKENS: Token[] = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'native' },
  { symbol: 'USDC', name: 'USD Coin', address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
  { symbol: 'BLND', name: 'Blend Token', address: 'GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY' },
  { symbol: 'WETH', name: 'Wrapped Ethereum', address: 'GBETHKBLNBSBXVLTKWLB6L3X3RTMAKKI64JUNNQO5EUXYYTYO3O3G2YH' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: 'GDXTJEK4JZNSTNQAWA53RZNS2MDXYD2SMT6Q7JH2CU2B6Y2DRX6XM3UB' },
];

const DeFiTabs: React.FC = () => {
  const { publicKey, connected } = useFreighter();
  const [fromToken, setFromToken] = useState('XLM');
  const [toToken, setToToken] = useState('USDC');
  const [swapAmount, setSwapAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [borrowToken, setBorrowToken] = useState('USDC');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [stakeToken, setStakeToken] = useState('BLND');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate estimated output when swap inputs change
  React.useEffect(() => {
    if (swapAmount && fromToken && toToken && fromToken !== toToken) {
      const output = calculateSwapOutput(fromToken, toToken, swapAmount);
      setEstimatedOutput(output);
    } else {
      setEstimatedOutput('');
    }
  }, [swapAmount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (fromToken === toToken) {
      toast.error('Cannot swap the same token');
      return;
    }

    setIsLoading(true);
    try {
      const minAmountOut = estimatedOutput ? (parseFloat(estimatedOutput) * 0.99).toString() : '0';
      
      const result = await swapTokens(
        publicKey,
        fromToken,
        toToken,
        swapAmount,
        minAmountOut
      );

      if (result.success) {
        toast.success(`Swap successful! Hash: ${result.hash}`);
        setSwapAmount('');
        setEstimatedOutput('');
      } else {
        toast.error(`Swap failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Swap failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const result = await borrowFromBlend(
        publicKey,
        borrowToken,
        borrowAmount
      );

      if (result.success) {
        toast.success(`Borrow successful! Hash: ${result.hash}`);
        setBorrowAmount('');
      } else {
        toast.error(`Borrow failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Borrow error:', error);
      toast.error('Borrow failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (stakeToken !== 'BLND') {
      toast.error('Only BLND tokens can be staked');
      return;
    }

    setIsLoading(true);
    try {
      const result = await stakeBlend(
        publicKey,
        stakeAmount
      );

      if (result.success) {
        toast.success(`Stake successful! Hash: ${result.hash}`);
        setStakeAmount('');
      } else {
        toast.error(`Stake failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Stake error:', error);
      toast.error('Stake failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="blendify-card p-8 text-center">
        <h3 className="text-xl font-semibold text-foreground mb-4">Connect Your Wallet</h3>
        <p className="text-muted-foreground">Please connect your Freighter wallet to use DeFi features</p>
      </div>
    );
  }

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

          {estimatedOutput && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Estimated Output:</p>
              <p className="text-lg font-semibold text-foreground">{estimatedOutput} {toToken}</p>
              <p className="text-xs text-muted-foreground mt-1">0.3% protocol fee applied</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <TxButton onClick={handleSwap}>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
                {isLoading ? 'Swapping...' : 'Swap Tokens'}
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

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Health Factor Required: &gt; 1.0</p>
            <p className="text-xs text-muted-foreground mt-1">Ensure you have sufficient collateral before borrowing</p>
          </div>
          
          <div className="flex justify-center">
            <TxButton onClick={handleBorrow}>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                )}
                {isLoading ? 'Borrowing...' : 'Borrow Asset'}
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

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Staking Rewards: Earn protocol fees and governance rights</p>
            <p className="text-xs text-muted-foreground mt-1">Rewards are distributed proportionally to stakers</p>
          </div>
          
          <div className="flex justify-center">
            <TxButton onClick={handleStake}>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {isLoading ? 'Staking...' : 'Stake BLEND'}
              </div>
            </TxButton>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFiTabs; 