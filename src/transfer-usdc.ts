import "dotenv/config";
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk";

const WALLET_ADDRESS = "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L";
const RECIPIENT_ADDRESS = "CBGZ54U36DXQLMZTANIFRWRAR52QYEGBNDOXJWE55Z2NEKMRWZRQRLLJ";

async function main() {
  const apiKey = process.env["CROSSMINT_API_KEY"];
  if (!apiKey) {
    throw new Error("CROSSMINT_API_KEY is not set");
  }

  const crossmint = createCrossmint({ apiKey });
  const wallets = CrossmintWallets.from(crossmint);

  const walletSecret = process.env["STELLAR_WALLET_SECRET"];
  console.log("Wallet secret:", walletSecret);
  if (!walletSecret) {
    throw new Error("STELLAR_WALLET_SECRET is not set");
  }

  console.log("Fetching wallet...");
  const wallet = await wallets.getWallet(WALLET_ADDRESS, { chain: "stellar", recovery: { type: "server", secret: walletSecret }} as any);
  console.log("Wallet fetched:", wallet.address);

  await wallet.useSigner({ type: "server", secret: walletSecret });

  console.log(`\nTransferring USDC to ${RECIPIENT_ADDRESS}...`);
  const tx = await wallet.send(RECIPIENT_ADDRESS, "usdc", "0.05");
  console.log(JSON.stringify(tx, null, 2));
}

main().catch(console.error);
