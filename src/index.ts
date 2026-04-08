import "dotenv/config";
import { Keypair } from "@stellar/stellar-sdk";
import { CrossmintClient } from "./CrossmintClient.js";
import { RainClient } from "./RainClient.js";

async function main() {
  const apiKey = process.env["CROSSMINT_API_KEY"];
  if (!apiKey) throw new Error("CROSSMINT_API_KEY is not set");

  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  // Generate a new Stellar keypair
  const keypair = Keypair.random();
  const secretHex = Buffer.from(keypair.rawSecretKey()).toString("hex");
  console.log("Generated Stellar keypair:");
  console.log("  Public key:", keypair.publicKey());
  console.log("  Secret key (Stellar):", keypair.secret());
  console.log("  Secret key (hex):", secretHex);

  const crossmint = new CrossmintClient(apiKey);

  // Create a Stellar smart wallet with the keypair as the server signer
  console.log("\nCreating Stellar smart wallet...");
  const wallet = await crossmint.createWallet(secretHex);

  console.log("Wallet created!");
  console.log("  Address:", wallet.address);

  // Create Rain consumer application
  console.log("\nCreating Rain consumer application...");
  const rain = new RainClient(rainApiKey);
  const rainData = await rain.createDummyConsumerApplication(wallet.address);
  console.log("Rain application created!");
  console.log(JSON.stringify(rainData, null, 2));
}

main().catch(console.error);
