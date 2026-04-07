export type CollateralToken = {
  address: string;
  balance: string;
  exchangeRate: number;
  advanceRate: number;
};

export type CollateralContract = {
  id: string;
  chainId: number;
  controllerAddress: string;
  proxyAddress: string;
  depositAddress: string;
  tokens: CollateralToken[];
  contractVersion: number;
};

export type WithdrawalSignatureResponse = {
  status: "ready" | "pending";
  signature: {
    data: string;  // hex encoded signature
    salt: string;  // base64 encoded salt
  };
  expiresAt: string;  // ISO 8601 timestamp
  sender: string;     // Stellar address
  chainId: string;    // hex encoded chain id
  parameters: [
    string,    // [0] collateral proxy contract address
    string,    // [1] token contract address
    string,    // [2] amount in smallest unit
    string,    // [3] recipient address
    number,    // [4] expiry timestamp (unix seconds)
    number[],  // [5] salt as byte array
    string,    // [6] hex encoded signature
    string,    // [7] hex encoded Rain admin public key
  ];
};
