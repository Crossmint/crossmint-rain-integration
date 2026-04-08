# Rain x Crossmint Integration

Scripts for integrating [Rain](https://rain.com) card collateral management with [Crossmint](https://crossmint.com) Stellar smart wallets.

## Setup

Install dependencies:

```bash
pnpm i
```

Copy `.env.example` to `.env` and fill in:

```
CROSSMINT_API_KEY=
RAIN_API_KEY=
STELLAR_WALLET_SECRET=
```

## Scripts

### `create-consumer-application`

```bash
pnpm create-consumer-application
```

Generates a new Stellar keypair, creates a Crossmint smart wallet using that keypair as the server signer, then registers a Rain consumer application linked to that wallet address. Prints the wallet address and Rain application data. Run this once to set up a new user.

---

### `get-contracts`

```bash
pnpm get-contracts
```

Fetches the Rain contracts associated with a user (configured by `USER_ID` in the script). Prints the full contract list including proxy and controller addresses. Useful for inspecting what collateral contracts exist for a user.

---

### `get-withdrawal-signature`

```bash
pnpm get-withdrawal-signature
```

Requests a withdrawal signature from the Rain API for a specific user, token, amount, and chain. Prints the signed parameters needed to execute a withdrawal on-chain. Useful for debugging the signature step in isolation.

---

### `transfer-usdc`

```bash
pnpm transfer-usdc
```

Transfers USDC from a Crossmint Stellar smart wallet to a recipient address. Requires `STELLAR_WALLET_SECRET` in your `.env`. Configure `WALLET_ADDRESS` and `RECIPIENT_ADDRESS` in the script before running.

---

### `withdraw`

```bash
pnpm withdraw
```

End-to-end withdrawal flow:
1. Requests a withdrawal signature from Rain
2. Fetches the user's contracts to resolve the coordinator address
3. Executes the withdrawal on-chain via the Crossmint Stellar wallet

Configure `USER_ID`, `TOKEN`, `AMOUNT`, `ADMIN_ADDRESS`, `RECIPIENT_ADDRESS`, and `CHAIN_ID` at the top of the script before running.
