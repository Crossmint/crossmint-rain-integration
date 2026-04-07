
> rain-xmint-integration@1.0.0 dev /Users/panos/Projects/rain-xmint-integration
> tsx src/index.ts

Generated Stellar keypair:
  Public key: GAFEX5PSMRZGWZJUFTQCCX426SCJDNPCNHT66NB37Y3YVXEN5YRLQXHI
  Secret key (Stellar): SDGQLO66ZHKYCKTIJE5LZAZRAJJEDA3FFLZTAV6BNRSYXNBTKNV35NZF
  Secret key (hex): cd05bbdec9d5812a68493abc833102524183652af33057c16c658bb433536bbe
[SDK] wallets.sdk.initialized {
  sdk_version: '1.0.6',
  sdk_name: '@crossmint/wallets-sdk',
  platform: 'server',
  environment: 'staging',
  project_id: '8807b9ce-d44c-4255-8de0-365ea25ed4ee',
  package: '@crossmint/wallets-sdk',
  origin: 'crossmint-sdk'
}

Creating Stellar smart wallet...
[SDK] walletFactory.createWallet.start {
  sdk_version: '1.0.6',
  sdk_name: '@crossmint/wallets-sdk',
  platform: 'server',
  environment: 'staging',
  project_id: '8807b9ce-d44c-4255-8de0-365ea25ed4ee',
  package: '@crossmint/wallets-sdk',
  origin: 'crossmint-sdk',
  execution_id: 'mnnme15d-20jfavno',
  method: 'walletFactory.createWallet',
  chain: 'stellar'
}
[SDK] wallets.api.createWallet {
  sdk_version: '1.0.6',
  sdk_name: '@crossmint/wallets-sdk',
  platform: 'server',
  environment: 'staging',
  project_id: '8807b9ce-d44c-4255-8de0-365ea25ed4ee',
  package: '@crossmint/wallets-sdk',
  origin: 'crossmint-sdk',
  execution_id: 'mnnme15d-20jfavno',
  method: 'walletFactory.createWallet',
  chain: 'stellar',
  chainType: 'stellar',
  walletType: 'smart'
}
[SDK] wallets.api.createWallet.success {
  sdk_version: '1.0.6',
  sdk_name: '@crossmint/wallets-sdk',
  platform: 'server',
  environment: 'staging',
  project_id: '8807b9ce-d44c-4255-8de0-365ea25ed4ee',
  package: '@crossmint/wallets-sdk',
  origin: 'crossmint-sdk',
  execution_id: 'mnnme15d-20jfavno',
  method: 'walletFactory.createWallet',
  chain: 'stellar',
  address: 'CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L',
  chainType: 'stellar'
}
[SDK] walletFactory.createWallet.success {
  sdk_version: '1.0.6',
  sdk_name: '@crossmint/wallets-sdk',
  platform: 'server',
  environment: 'staging',
  project_id: '8807b9ce-d44c-4255-8de0-365ea25ed4ee',
  package: '@crossmint/wallets-sdk',
  origin: 'crossmint-sdk',
  execution_id: 'mnnme15d-20jfavno',
  method: 'walletFactory.createWallet',
  chain: 'stellar',
  address: 'CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L'
}
Wallet created!
  Address: CDT3EIEVTH4EY4ENHQSQ4DIKS3YISWANZW26U3JK7QPJNK2L3TFNMO7L

Creating Rain consumer application...
Rain application created!
{
  "id": "cdf68c70-b4eb-45a2-b59b-01ddb08e86f8",
  "firstName": "testing",
  "lastName": "testingApproved",
  "email": "testing@test.com",
  "isActive": true,
  "isTermsOfServiceAccepted": true,
  "address": {
    "line1": "dkfjdk",
    "city": "kdfjdk",
    "region": "kjfdkfj",
    "postalCode": "kjkj",
    "countryCode": "US"
  },
  "phoneCountryCode": "1",
  "phoneNumber": "5555555555",
  "applicationStatus": "approved",
  "applicationReason": "WRONG_USER_REGION, REGULATIONS_VIOLATIONS"
}