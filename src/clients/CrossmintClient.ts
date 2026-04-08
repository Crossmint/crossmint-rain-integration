import { createCrossmint, CrossmintWallets, StellarWallet } from "@crossmint/wallets-sdk";

export class CrossmintClient {
  private wallets: CrossmintWallets;

  constructor(apiKey: string) {
    const crossmint = createCrossmint({ apiKey });
    this.wallets = CrossmintWallets.from(crossmint);
  }

  async createWallet(secret: string): Promise<StellarWallet> {
    const wallet = await this.wallets.createWallet({
      chain: "stellar",
      recovery: { type: "server", secret },
    });
    return StellarWallet.from(wallet);
  }

  async getWallet(address: string, secret: string): Promise<StellarWallet> {
    const wallet = await this.wallets.getWallet(address, {
      chain: "stellar",
      recovery: { type: "server", secret },
    } as any);
    await wallet.useSigner({ type: "server", secret });
    return StellarWallet.from(wallet);
  }
}
