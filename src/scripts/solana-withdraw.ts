/**
 * Rain Solana Collateral Withdrawal Demo
 *
 * Demonstrates withdrawing collateral from a Rain single-signer collateral account
 * owned by a Crossmint Solana smart wallet (Squads PDA).
 *
 * Flow:
 *   1. Get the Crossmint Solana wallet (Squads vault PDA)
 *   2. Request withdrawal signature from Rain API
 *   3. Fetch contracts to resolve the coordinator address
 *   4. Build Ed25519 precompile instruction (top-level signature verification)
 *   5. Build withdrawal instruction (executed via Squads CPI)
 *   6. Assemble a VersionedTransaction with both instructions
 *   7. Send via Crossmint SDK — Crossmint routes to Squads Developer API,
 *      which places [ed25519Ix (top-level), vaultTransactionExecute(withdrawalIx via CPI)]
 *   8. Crossmint treasury signs as fee payer (subsidized)
 *
 * Environment Variables:
 *   CROSSMINT_API_KEY    — Crossmint server API key with Wallet API scopes
 *   RAIN_API_KEY         — Rain API key
 *   SOLANA_WALLET_SECRET — hex-encoded secret for the Crossmint wallet's server signer
 *
 * Hardcoded values below should be replaced with your own Rain user/contract details.
 */
import "dotenv/config";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { SolanaCrossmintClient } from "../clients/SolanaCrossmintClient.js";
import { RainClient } from "../clients/RainClient.js";
import { createEd25519VerificationInstruction } from "../solana/ed25519-instruction.js";
import { getWithdrawSingleSignerMessage } from "../solana/coordinator-message.js";
import { buildWithdrawalInstruction } from "../solana/withdrawal-instruction.js";

// ── Configuration (replace with your own values) ────────────────────────────
const USER_ID = "YOUR_RAIN_USER_ID";
const TOKEN = "YOUR_SPL_TOKEN_MINT_ADDRESS";
const AMOUNT = "5";
const ADMIN_ADDRESS = "YOUR_CROSSMINT_SOLANA_WALLET_ADDRESS"; // Squads vault PDA
const RECIPIENT_ADDRESS = "YOUR_RECIPIENT_SOLANA_ADDRESS";
const CHAIN_ID = "901"; // 901 = Solana devnet, 900 = Solana mainnet
const SOLANA_RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const apiKey = process.env["CROSSMINT_API_KEY"];
  if (!apiKey) throw new Error("CROSSMINT_API_KEY is not set");

  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const walletSecret = process.env["SOLANA_WALLET_SECRET"];
  if (!walletSecret) throw new Error("SOLANA_WALLET_SECRET is not set");

  const crossmint = new SolanaCrossmintClient(apiKey);
  const rain = new RainClient(rainApiKey);
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  // Step 1: Get Crossmint Solana wallet (Squads PDA)
  console.log("Fetching Crossmint Solana wallet...");
  const solanaWallet = await crossmint.getWallet(ADMIN_ADDRESS, walletSecret);
  console.log("Wallet:", solanaWallet.address);

  // Step 2: Request withdrawal signature from Rain API
  console.log("\nRequesting withdrawal signature from Rain...");
  const signatureData = await rain.getWithdrawalSignature(
    USER_ID,
    TOKEN,
    AMOUNT,
    ADMIN_ADDRESS,
    RECIPIENT_ADDRESS,
    CHAIN_ID,
  );

  if (signatureData.status === "pending") {
    throw new Error("Signature is pending. Please retry shortly.");
  }

  const [
    collateralProxy,    // parameters[0] — collateral contract address
    assetAddress,       // parameters[1] — token mint address
    amountValue,        // parameters[2] — amount in smallest unit
    recipient,          // parameters[3] — recipient address
    expiresAt,          // parameters[4] — expiry timestamp
    salt,               // parameters[5] — salt byte array
    sig,                // parameters[6] — hex encoded coordinator signature
    _rainAdminPublicKey, // parameters[7] — hex encoded Rain admin public key (unused on Solana)
  ] = signatureData.parameters;

  console.log("  Collateral:", collateralProxy);
  console.log("  Asset:", assetAddress);
  console.log("  Amount:", amountValue);
  console.log("  Recipient:", recipient);
  console.log("  Expires:", new Date(expiresAt * 1000).toISOString());

  // Step 3: Fetch contracts to resolve coordinator + program addresses
  console.log("\nFetching Rain contracts...");
  const contracts = await rain.getContracts(USER_ID);
  const contract = contracts.find((c) => c.proxyAddress === collateralProxy);
  if (!contract) {
    throw new Error(`No contract found for collateral proxy: ${collateralProxy}`);
  }

  // On Solana, controllerAddress is the coordinator and the contract includes a programAddress
  const coordinatorAddress = new PublicKey(contract.controllerAddress);
  const collateralPubkey = new PublicKey(collateralProxy);
  const rainProgramId = new PublicKey((contract as any).programAddress);
  console.log("  Coordinator:", coordinatorAddress.toBase58());
  console.log("  Program:", rainProgramId.toBase58());

  // Step 4: Resolve the coordinator executor (from on-chain account)
  // In production, fetch the coordinator account to get the executor pubkey.
  // For this demo, we assume the executor is available from the contract metadata
  // or passed as config. The coordinator executor is who actually signed the message.
  //
  // NOTE: To fetch the coordinator account on-chain, you would use:
  //   const coordinatorAccountInfo = await connection.getAccountInfo(coordinatorAddress);
  //   // Parse the account data per the Rain IDL to extract executors[]
  //
  // For now, use the coordinator address itself as the executor (adjust as needed):
  const coordinatorExecutor = coordinatorAddress;

  // Step 5: Build the Ed25519 precompile instruction
  console.log("\nBuilding Ed25519 verification instruction...");
  const signatureSalt = Buffer.from(salt as unknown as number[]);
  const signatureBytes = Buffer.from(sig, "base64");

  const walletPubkey = new PublicKey(ADMIN_ADDRESS);
  const recipientPubkey = new PublicKey(recipient);
  const assetPubkey = new PublicKey(assetAddress);

  const coordinatorMessage = getWithdrawSingleSignerMessage({
    coordinator: coordinatorAddress,
    collateral: collateralPubkey,
    owner: walletPubkey,
    receiver: recipientPubkey,
    asset: assetPubkey,
    nonce: 0, // Fetch from on-chain collateral account in production
    amountInAsset: BigInt(amountValue),
    signatureExpirationTime: BigInt(expiresAt),
    coordinatorSignatureSalt: signatureSalt,
  });

  const ed25519Instruction = createEd25519VerificationInstruction([
    {
      signer: coordinatorExecutor,
      signature: signatureBytes,
      message: coordinatorMessage,
    },
  ]);

  // Step 6: Build the withdrawal instruction
  console.log("Building withdrawal instruction...");
  const withdrawalInstruction = buildWithdrawalInstruction({
    rainProgramId,
    owner: walletPubkey,
    coordinator: coordinatorAddress,
    collateral: collateralPubkey,
    destination: recipientPubkey,
    asset: assetPubkey,
    amountInAsset: BigInt(amountValue),
    signatureExpirationTime: BigInt(expiresAt),
    coordinatorSignatureSalt: signatureSalt,
  });

  // Step 7: Assemble the transaction
  console.log("Assembling transaction...");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const message = new TransactionMessage({
    payerKey: walletPubkey,
    recentBlockhash: blockhash,
    instructions: [
      ed25519Instruction,       // Instruction 0: Ed25519 verification (top-level)
      withdrawalInstruction,    // Instruction 1: withdrawal (Squads wraps in CPI)
    ],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  const serializedTx = Buffer.from(transaction.serialize()).toString("base64");

  // Step 8: Send via Crossmint SDK
  //
  // Crossmint routes this to the Squads Developer API, which:
  //   1. Creates a vault transaction with the withdrawal instruction
  //   2. Places the Ed25519 instruction as top-level in the execute transaction
  //   3. Final on-chain tx: [ed25519Ix (top-level), vaultTransactionExecute(withdrawalIx via CPI)]
  //   4. Treasury signs as fee payer (subsidized)
  console.log("\nSending transaction via Crossmint (Squads)...");
  const result = await solanaWallet.sendTransaction({
    serializedTransaction: serializedTx,
  });

  console.log("\nWithdrawal complete!");
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch((ex) => {
  console.error("Withdrawal failed:", ex);
  process.exit(1);
});
