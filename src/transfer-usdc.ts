import "dotenv/config";
import { CrossmintClient } from "./CrossmintClient.js";

const WALLET_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const RECIPIENT_ADDRESS = "CBGZ54U36DXQLMZTANIFRWRAR52QYEGBNDOXJWE55Z2NEKMRWZRQRLLJ";

async function main() {
  const apiKey = process.env["CROSSMINT_API_KEY"];
  if (!apiKey) throw new Error("CROSSMINT_API_KEY is not set");

  const walletSecret = process.env["STELLAR_WALLET_SECRET"];
  if (!walletSecret) throw new Error("STELLAR_WALLET_SECRET is not set");

  const crossmint = new CrossmintClient(apiKey);

  console.log("Fetching wallet...");
  const wallet = await crossmint.getWallet(WALLET_ADDRESS, walletSecret);
  console.log("Wallet fetched:", wallet.address);

  console.log(`Transferring USDC to ${RECIPIENT_ADDRESS}...`);
  const tx = await wallet.send(RECIPIENT_ADDRESS, "usdc", "2");
  console.log(JSON.stringify(tx, null, 2));
}

main().catch(console.error);
