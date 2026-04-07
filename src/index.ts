import "dotenv/config";
import { Keypair } from "@stellar/stellar-sdk";
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk";

async function main() {
  const apiKey = process.env["CROSSMINT_API_KEY"];
  if (!apiKey) {
    throw new Error("CROSSMINT_API_KEY is not set");
  }

  // Generate a new Stellar keypair
  const keypair = Keypair.random();
  const secretHex = Buffer.from(keypair.rawSecretKey()).toString("hex");
  console.log("Generated Stellar keypair:");
  console.log("  Public key:", keypair.publicKey());
  console.log("  Secret key (Stellar):", keypair.secret());
  console.log("  Secret key (hex):", secretHex);

  // Initialize Crossmint
  const crossmint = createCrossmint({ apiKey });
  const wallets = CrossmintWallets.from(crossmint);

  // Create a Stellar smart wallet with the keypair as the server signer
  console.log("\nCreating Stellar smart wallet...");
  const wallet = await wallets.createWallet({
    chain: "stellar",
    recovery: {
      type: "server",
      secret: secretHex,
    },
  });

  console.log("Wallet created!");
  console.log("  Address:", wallet.address);

  // Create Rain consumer application
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) {
    throw new Error("RAIN_API_KEY is not set");
  }

  console.log("\nCreating Rain consumer application...");
  const rainResponse = await fetch(
    "https://api-dev.raincards.xyz/v1/issuing/applications/user",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": rainApiKey,
      },
      body: JSON.stringify({
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
        stellarAddress: wallet.address,
      }),
    }
  );

  const rainData = await rainResponse.json();
  if (!rainResponse.ok) {
    console.error("Rain API error:", rainResponse.status, rainData);
  } else {
    console.log("Rain application created!");
    console.log(JSON.stringify(rainData, null, 2));
  }
}

main().catch(console.error);
