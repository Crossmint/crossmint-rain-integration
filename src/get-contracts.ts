import "dotenv/config";
import { RainClient } from "./RainClient.js";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";

async function main() {
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const rain = new RainClient(rainApiKey);
  const data = await rain.getContracts(USER_ID);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
