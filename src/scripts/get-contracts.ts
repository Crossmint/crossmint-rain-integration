import "dotenv/config";
import { RainClient } from "../clients/RainClient.js";

const APPROVED_USER_ID = "239ad72f-26b2-4be1-b01f-2342e2f9c02d";
const NON_APPROVED_USER_ID = "33492a06-8ba0-4399-8148-4d256a7efd0a";

async function main() {
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const rain = new RainClient(rainApiKey);
  const approvedData = await rain.getContracts(APPROVED_USER_ID);
  const nonApprovedData = await rain.getContracts(NON_APPROVED_USER_ID);
  
  console.log("approvedData");
  console.log(JSON.stringify(approvedData, null, 2));
  console.log("--------------------------------");
  console.log("nonApprovedData");
  console.log(JSON.stringify(nonApprovedData, null, 2));
}

main().catch(console.error);
