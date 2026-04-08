export type ConsumerApplicationRequest = {
  sourceKey: string;
  ipAddress: string;
  occupation: string;
  annualSalary: string;
  accountPurpose: string;
  expectedMonthlyVolume: string;
  isTermsOfServiceAccepted: boolean;
  hasExistingDocuments: boolean;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  countryOfIssue: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  address: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
  stellarAddress: string;
};

export type ConsumerApplicationResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isTermsOfServiceAccepted: boolean;
  address: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
  phoneCountryCode: string;
  phoneNumber: string;
  applicationStatus: string;
  applicationReason: string;
};

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
