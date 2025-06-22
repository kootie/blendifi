# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Your Contract

1. Open `src/lib/config.ts`
2. Replace `YOUR_CONTRACT_ID_HERE` with your deployed contract ID:

```typescript
export const CONFIG = {
  CONTRACT_ID: 'your_actual_contract_id_here',
  // ... rest of config
};
```

## Step 3: Verify External Contracts

Make sure these contracts are deployed and accessible on your network:

- **Blend Pool Factory**: `CDEVVU3G2CFH6LJQG6LLSCSIU2BNRWDSJMDA44OA64XFV4YNWG7T22IU`
- **Soroswap Router**: `CAALXMGZL3JZHGXCPTJ2YFWYQN2F4CLHAKBLMGNR42XQNBTADSFQJCZD`
- **DIA Oracle**: `CAEDPEZDRCEJCF73ASC5JGNKCIJDV2QJQSW6DJ6B74MYALBNKCJ5IFP4`

## Step 4: Start Development Server

```bash
npm run dev
```

## Step 5: Connect Wallet

1. Install [Freighter Wallet](https://www.freighter.app/)
2. Create a testnet account
3. Get some test XLM from the [Stellar Testnet Faucet](https://laboratory.stellar.org/#account-creator?network=testnet)
4. Connect your wallet in the app

## Step 6: Test the Application

1. **Swap**: Try swapping between different tokens
2. **Supply**: Supply some assets to Blend pools
3. **Borrow**: Borrow against your supplied collateral
4. **Stake**: Stake bTokens to earn rewards

## Troubleshooting

### Contract ID Issues
- Ensure your contract is deployed to testnet
- Verify the contract ID is correct
- Check that the contract is initialized

### Wallet Issues
- Make sure Freighter is installed and unlocked
- Ensure you're on testnet network
- Check that you have test XLM for fees

### Transaction Failures
- Verify you have sufficient token balances
- Check that external contracts are accessible
- Ensure health factor is above 120% for borrowing

## Next Steps

1. Deploy your smart contract to mainnet
2. Update contract addresses in config
3. Test thoroughly on testnet first
4. Deploy frontend to production

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all contract addresses are correct
3. Ensure your smart contract is properly initialized
4. Check the main README.md for detailed documentation 