import "dotenv/config";

const USER_ID = "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8";

async function main() {
  const rainApiKey = process.env["RAIN_API_KEY"];
  if (!rainApiKey) {
    throw new Error("RAIN_API_KEY is not set");
  }

  const response = await fetch(
    `https://api-dev.raincards.xyz/v1/issuing/users/${USER_ID}/contracts`,
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
