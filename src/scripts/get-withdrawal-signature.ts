import "dotenv/config";
import { RainClient } from "../clients/RainClient.js";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";

async function main() {
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) throw new Error("RAIN_API_KEY is not set");

  const rain = new RainClient(rainApiKey);

  const data = await rain.getWithdrawalSignature(
    USER_ID,
    "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "5",
    "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
    "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
    "1501"
  );

  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
