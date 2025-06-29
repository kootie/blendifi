interface FreighterAPI {
  isConnected(): Promise<boolean>;
  connect(): Promise<void>;
  getPublicKey(): Promise<string>;
  getNetwork(): Promise<string>;
  signTransaction(xdr: string, options: { network: string }): Promise<any>;
}

declare global {
  interface Window {
    freighterApi?: FreighterAPI;
    stellar?: {
      freighterApi?: FreighterAPI;
    };
    freighter?: FreighterAPI;
    StellarFreighter?: FreighterAPI;
    freighterWallet?: FreighterAPI;
  }
}

export {}; 