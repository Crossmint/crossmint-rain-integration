import type { StellarWallet } from "@crossmint/wallets-sdk";
import type { CollateralContract, ConsumerApplicationRequest, ConsumerApplicationResponse, WithdrawalSignatureResponse } from "./types.js";

const BASE_URL = "https://api-dev.raincards.xyz";

export class RainClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWithdrawalSignature(
    userId: string,
    token: string,
    amount: string,
    adminAddress: string,
    recipientAddress: string,
    chainId: string
  ): Promise<WithdrawalSignatureResponse> {
    const params = new URLSearchParams({
      token,
      amount,
      adminAddress,
      recipientAddress,
      chainId,
    });

    const response = await fetch(
      `${BASE_URL}/v1/issuing/users/${userId}/signatures/withdrawals?${params}`,
      { headers: { "Api-Key": this.apiKey } }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get withdrawal signature: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<WithdrawalSignatureResponse>;
  }

  async getContracts(userId: string): Promise<CollateralContract[]> {
    const response = await fetch(
      `${BASE_URL}/v1/issuing/users/${userId}/contracts`,
      { headers: { "Api-Key": this.apiKey } }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get contracts: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<CollateralContract[]>;
  }

  async executeWithdrawal(
    stellarWallet: StellarWallet,
    callerAddress: string,
    coordinatorAddress: string,
    collateralAddress: string,
    assetAddress: string,
    amount: bigint,
    recipientAddress: string,
    expiresAt: number,
    salt: number[],
    sig: string,
    rainAdminPublicKey: string
  ): Promise<string> {
    const result = await stellarWallet.sendTransaction({
      contractId: coordinatorAddress,
      method: "withdraw_assets",
      args: {
        caller: callerAddress,
        collateral: collateralAddress,
        asset: assetAddress,
        amount: amount.toString(),
        recipient: recipientAddress,
        expires_at: expiresAt,
        salt: Buffer.from(salt).toString("base64"),
        signature: Buffer.from(sig, "hex").toString("base64"),
        public_key: Buffer.from(rainAdminPublicKey, "hex").toString("base64"),
      },
    });

    return result.hash;
  }

  async createDummyConsumerApplication(stellarAddress: string): Promise<ConsumerApplicationResponse> {
    const body: ConsumerApplicationRequest = {
      sourceKey: "crossmint",
      ipAddress: "127.0.0.1",
      occupation: "Chief Executives",
      annualSalary: "500000",
      accountPurpose: "testing",
      expectedMonthlyVolume: "10000",
      isTermsOfServiceAccepted: true,
      hasExistingDocuments: true,
      firstName: "testing",
      lastName: "testingApproved",
      birthDate: "1990-01-01",
      nationalId: "121111111",
      countryOfIssue: "US",
      email: "testing@test.com",
      phoneCountryCode: "1",
      phoneNumber: "5555555555",
      address: {
        line1: "dkfjdk",
        city: "kdfjdk",
        region: "kjfdkfj",
        postalCode: "kjkj",
        countryCode: "US",
      },
      stellarAddress,
    };

    const response = await fetch(`${BASE_URL}/v1/issuing/applications/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to create consumer application: ${response.status} ${JSON.stringify(data)}`
      );
    }

    return data as ConsumerApplicationResponse;
  }
}
