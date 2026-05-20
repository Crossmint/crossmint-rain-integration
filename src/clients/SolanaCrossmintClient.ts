import { createCrossmint, CrossmintWallets, SolanaWallet } from "@crossmint/wallets-sdk";

export class SolanaCrossmintClient {
  private wallets: CrossmintWallets;

  constructor(apiKey: string) {
    const crossmint = createCrossmint({ apiKey });
    this.wallets = CrossmintWallets.from(crossmint);
  }

  async createWallet(secret: string): Promise<SolanaWallet> {
    const wallet = await this.wallets.createWallet({
      chain: "solana",
      recovery: { type: "server", secret },
    });
    return SolanaWallet.from(wallet);
  }

  async getWallet(address: string, secret: string): Promise<SolanaWallet> {
    const wallet = await this.wallets.getWallet(address, {
      chain: "solana",
      recovery: { type: "server", secret },
    } as any);
    await wallet.useSigner({ type: "server", secret });
    return SolanaWallet.from(wallet);
  }
}
