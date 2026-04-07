import "dotenv/config";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";

async function main() {
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) {
    throw new Error("RAIN_API_KEY is not set");
  }

  const params = new URLSearchParams({
    chainId: "1501",
    token: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    amount: "5",
    adminAddress: "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
    recipientAddress: "CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L",
  });

  const response = await fetch(
    `https://api-dev.raincards.xyz/v1/issuing/users/${USER_ID}/signatures/withdrawals?${params}`,
    {
      method: "GET",
      headers: {
        "Api-Key": rainApiKey,
      },
    }
  );

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
