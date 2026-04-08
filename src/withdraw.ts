import "dotenv/config";
import { CrossmintClient } from "./CrossmintClient.js";
import { RainClient } from "./RainClient.js";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";
const TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const AMOUNT = "5";
const ADMIN_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const RECIPIENT_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const CHAIN_ID = "1501";

async function main() {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("CROSSMINT_API_KEY is not set");

  const rainApiKey = process.env.RAIN_API_KEY;
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const walletSecret = process.env.STELLAR_WALLET_SECRET;
  if (!walletSecret) throw new Error("STELLAR_WALLET_SECRET is not set");

  const crossmint = new CrossmintClient(apiKey);
  const rain = new RainClient(rainApiKey);
  const stellarWallet = await crossmint.getWallet(ADMIN_ADDRESS, walletSecret);
  console.log("Wallet:", ADMIN_ADDRESS);

  // Step 1: Get withdrawal signature from Rain API
  console.log("Requesting withdrawal signature...");
  const signatureData = await rain.getWithdrawalSignature(
    USER_ID,
    TOKEN,
    AMOUNT,
    ADMIN_ADDRESS,
    RECIPIENT_ADDRESS,
    CHAIN_ID
  );

  if (signatureData.status === "pending") {
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
  ] = signatureData.parameters;

  // Step 2: Fetch contracts to resolve the coordinator address
  console.log("Fetching contracts...");
  const contracts = await rain.getContracts(USER_ID);
  const contract = contracts.find((c) => c.proxyAddress === collateralProxy);

  if (!contract) {
    throw new Error(`No contract found for collateral proxy: ${collateralProxy}`);
  }

  const { controllerAddress: coordinatorAddress } = contract;
  console.log("Coordinator:", coordinatorAddress);

  // Step 3: Execute the withdrawal on-chain
  console.log("Executing withdrawal...");
  const txHash = await rain.executeWithdrawal(
    stellarWallet,
    ADMIN_ADDRESS,
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

  console.log("Withdrawal complete. Transaction hash:", txHash);
}

main().catch((ex) => {
  console.error("Withdrawal failed:", ex);
  process.exit(1);
});
