import "dotenv/config";
import * as StellarSdk from "@stellar/stellar-sdk";
import { createCrossmint, CrossmintWallets, StellarWallet } from "@crossmint/wallets-sdk";

const BASE_URL = process.env.RAIN_API_URL || "https://api-dev.raincards.xyz";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";
const TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const AMOUNT = "5";
const ADMIN_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const RECIPIENT_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const CHAIN_ID = "1501";

const CACHED_SIGNATURE_RESPONSE = {
  status: "ready",
  signature: {
    data: "78a045a855b2d8bf58538f33e7f913cf0b8fe15216fef8d6be6391a38898cacf28a5d1cfccfa88c8e248e50bd2ac5656f649a6d26b6d3a85b82c19303ef6c40c",
    salt: "7mzxAj4VGlj+HS2PTWA8LZD8Bai8wOspVCybPTf/d2A=",
  },
  expiresAt: "2026-04-07T21:17:45.000Z",
  sender: "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
  chainId: "0x5dd",
  parameters: [
    "CBGZ54U36DXQLMZTANIFRWRAR52QYEGBNDOXJWE55Z2NEKMRWZRQRLLJ",
    "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "500000",
    "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
    1775596665,
    [238, 108, 241, 2, 62, 21, 26, 88, 254, 29, 45, 143, 77, 96, 60, 45, 144, 252, 5, 168, 188, 192, 235, 41, 84, 44, 155, 61, 55, 255, 119, 96],
    "78a045a855b2d8bf58538f33e7f913cf0b8fe15216fef8d6be6391a38898cacf28a5d1cfccfa88c8e248e50bd2ac5656f649a6d26b6d3a85b82c19303ef6c40c",
    "f9704810ffb6cafdf39e13270a1acca389c2346795058c104862c97b34f34fe1",
  ],
};

async function getWithdrawalSignature(
  userId: string,
  token: string,
  amount: string,
  adminAddress: string,
  recipientAddress: string,
  chainId: string
) {
  const rainApiKey = process.env.RAIN_API_KEY;
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const params = new URLSearchParams({
    token,
    amount,
    adminAddress,
    recipientAddress,
    chainId,
  });

  try {
    const response = await fetch(
      `${BASE_URL}/v1/issuing/users/${userId}/signatures/withdrawals?${params}`,
      {
        headers: { "Api-Key": rainApiKey },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get withdrawal signature: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (err) {
    console.warn(`[getWithdrawalSignature] Request failed (${(err as Error).message}). Falling back to cached response.`);
    return CACHED_SIGNATURE_RESPONSE;
  }
}

async function getContracts(userId: string) {
  const rainApiKey = process.env.RAIN_API_KEY;
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const response = await fetch(
    `${BASE_URL}/v1/issuing/users/${userId}/contracts`,
    {
      headers: { "Api-Key": rainApiKey },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get contracts: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function getCrossmintWallet(): Promise<StellarWallet> {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("CROSSMINT_API_KEY is not set");

  const walletSecret = process.env.STELLAR_WALLET_SECRET;
  if (!walletSecret) throw new Error("STELLAR_WALLET_SECRET is not set");

  const crossmint = createCrossmint({ apiKey });
  const wallets = CrossmintWallets.from(crossmint);

  const wallet = await wallets.getWallet(ADMIN_ADDRESS, {
    chain: "stellar",
    recovery: { type: "server", secret: walletSecret },
  } as any);

  await wallet.useSigner({ type: "server", secret: walletSecret });

  return StellarWallet.from(wallet);
}

// Option B: High-level contract call — Crossmint handles encoding
async function executeWithdrawal(
  stellarWallet: StellarWallet,
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

  const saltHex = Buffer.from(salt).toString("base64");
  console.log("Salt:", salt);
  console.log("Hex salt", saltHex);

  const result = await stellarWallet.sendTransaction({
    contractId: coordinatorAddress,
    method: "withdraw_assets",
    args: {
      caller: ADMIN_ADDRESS,
      collateral: collateralAddress,
      asset: assetAddress,
      amount: amount.toString(),
      recipient: recipientAddress,
      expires_at: expiresAt,
      salt: saltHex, // type: scSpecTypeBytesN
      signature: Buffer.from(sig, "hex").toString("base64"),
      public_key: Buffer.from(rainAdminPublicKey, "hex").toString("base64"),
    },
  });

  return result.hash;
}

// Option A: Raw XDR transaction — build with Stellar SDK, sign via Crossmint
async function executeWithdrawalRaw(
  stellarWallet: StellarWallet,
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
  const rpcUrl = process.env.STELLAR_RPC_URL;
  if (!rpcUrl) throw new Error("STELLAR_RPC_URL is not set");

  const { Client, AssembledTransaction } = await import("@stellar/stellar-sdk/contract");

  const server = new StellarSdk.rpc.Server(rpcUrl);
  const { passphrase: networkPassphrase } = await server.getNetwork();

  const { spec } = await Client.from({
    contractId: coordinatorAddress,
    networkPassphrase,
    rpcUrl,
    server,
  });

  const encodedArgs = spec.funcArgsToScVals("withdraw_assets", {
    caller: ADMIN_ADDRESS,
    collateral: collateralAddress,
    asset: assetAddress,
    amount: BigInt(amount),
    recipient: recipientAddress,
    expires_at: BigInt(expiresAt),
    salt: Buffer.from(salt),
    signature: Buffer.from(sig, "hex"),
    public_key: Buffer.from(rainAdminPublicKey, "hex"),
  });

  const assembledTransaction = await AssembledTransaction.build({
    contractId: coordinatorAddress,
    method: "withdraw_assets",
    args: encodedArgs,
    parseResultXdr: (result) => result,
    networkPassphrase,
    rpcUrl,
    server,
    simulate: false,
  });

  await assembledTransaction.simulate();

  const xdrString = assembledTransaction.toXDR();

  // const signedTransaction = await stellarWallet.signer?.signTransaction(xdrString);

  const result = await stellarWallet.sendTransaction({
    contractId: coordinatorAddress,
    transaction: xdrString,
  });

  return result.hash;
}

async function main() {
  const stellarWallet = await getCrossmintWallet();
  console.log("Wallet:", ADMIN_ADDRESS);

  // Step 1: Get withdrawal signature from Rain API
  console.log("\nRequesting withdrawal signature...");
  const signatureData = await getWithdrawalSignature(
    USER_ID,
    TOKEN,
    AMOUNT,
    ADMIN_ADDRESS,
    RECIPIENT_ADDRESS,
    CHAIN_ID
  );

  if ((signatureData as any).status === "pending") {
    throw new Error("Signature is pending. Please retry shortly.");
  }

  const [
    collateralProxy,    // parameters[0] - collateral contract address
    assetAddress,       // parameters[1] - token contract address
    amountValue,        // parameters[2] - amount in smallest unit
    recipient,          // parameters[3] - recipient address
    expiresAt,          // parameters[4] - expiry timestamp
    salt,               // parameters[5] - byte array
    sig,                // parameters[6] - hex encoded signature
    rainAdminPublicKey, // parameters[7] - hex encoded Rain admin public key
  ] = (signatureData as any).parameters;

  const definedSalt = (signatureData as any).signature.salt;
  console.log("Defined salt:", definedSalt);
  

  // Step 2: Fetch contracts to resolve the coordinator address
  console.log("\nFetching contracts...");
  const contracts = await getContracts(USER_ID);
  const contract = (contracts as any).find((c: any) => c.proxyAddress === collateralProxy);

  if (!contract) {
    throw new Error(`No contract found for collateral proxy: ${collateralProxy}`);
  }

  const { controllerAddress: coordinatorAddress } = contract;
  console.log("Coordinator:", coordinatorAddress);

  // Step 3: Execute the withdrawal on-chain
  console.log("\nExecuting withdrawal...");
  const txHash = await executeWithdrawal(
  // const txHash = await executeWithdrawalRaw(
    stellarWallet,
    coordinatorAddress,
    collateralProxy,
    assetAddress,
    BigInt(amountValue),
    recipient,
    expiresAt,
    salt,
    sig,
    rainAdminPublicKey
  );

  console.log("\nWithdrawal complete. Transaction hash:", txHash);
}

main().catch((ex) => {
  console.error("Withdrawal failed:", ex);
  process.exit(1);
});
