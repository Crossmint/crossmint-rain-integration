import { PublicKey, TransactionInstruction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

/**
 * Builds the Rain `withdrawSingleSignerCollateralAsset` instruction.
 *
 * This instruction is designed to execute inside a CPI (e.g. via Squads vault
 * transaction execute). The Rain program introspects the transaction's instruction
 * sysvar to find the Ed25519 precompile verification at a prior instruction index.
 *
 * Instruction discriminator: [13, 25, 64, 83, 111, 184, 70, 241]
 * (from the Rain v2.02 IDL)
 *
 * Accounts (in order):
 *   0. owner           — writable, signer (Squads vault PDA signs via CPI)
 *   1. coordinator     — the coordinator account
 *   2. collateral      — writable, the collateral account
 *   3. collateralAuthority — writable, PDA derived from ["CollateralAuthority", collateral]
 *   4. destination     — writable, recipient address
 *   5. asset           — optional, token mint (null for SOL)
 *   6. collateralTokenAccount — writable, optional, source ATA
 *   7. destinationTokenAccount — writable, optional, destination ATA
 *   8. tokenProgram    — SPL token program
 *   9. instructionSysvar — Sysvar1nstructions1111111111111111111111111
 *  10. systemProgram   — 11111111111111111111111111111111
 */

const WITHDRAW_SINGLE_SIGNER_DISCRIMINATOR = Buffer.from([13, 25, 64, 83, 111, 184, 70, 241]);

export function buildWithdrawalInstruction(params: {
  rainProgramId: PublicKey;
  owner: PublicKey;
  coordinator: PublicKey;
  collateral: PublicKey;
  destination: PublicKey;
  asset: PublicKey | null;
  amountInAsset: bigint;
  signatureExpirationTime: bigint;
  coordinatorSignatureSalt: Uint8Array;
}): TransactionInstruction {
  // Derive collateralAuthority PDA: ["CollateralAuthority", collateral]
  const [collateralAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("CollateralAuthority"), params.collateral.toBuffer()],
    params.rainProgramId,
  );

  // Resolve token accounts for SPL token withdrawals
  let collateralTokenAccount: PublicKey | null = null;
  let destinationTokenAccount: PublicKey | null = null;

  if (params.asset != null) {
    // depositAddress is the collateralAuthority for token account derivation
    collateralTokenAccount = getAssociatedTokenAddressSync(
      params.asset,
      collateralAuthority,
      true, // allowOwnerOffCurve — authority is a PDA
    );
    destinationTokenAccount = getAssociatedTokenAddressSync(
      params.asset,
      params.destination,
      false,
    );
  }

  // Encode instruction data:
  //   8 bytes  — discriminator
  //   8 bytes  — amountInAsset (u64 LE)
  //   8 bytes  — signatureExpirationTime (i64 LE)
  //  32 bytes  — coordinatorSignatureSalt ([u8; 32])
  const data = Buffer.alloc(8 + 8 + 8 + 32);
  WITHDRAW_SINGLE_SIGNER_DISCRIMINATOR.copy(data, 0);
  data.writeBigUInt64LE(params.amountInAsset, 8);
  data.writeBigInt64LE(params.signatureExpirationTime, 16);
  Buffer.from(params.coordinatorSignatureSalt).copy(data, 24);

  const keys = [
    { pubkey: params.owner, isSigner: true, isWritable: true },
    { pubkey: params.coordinator, isSigner: false, isWritable: false },
    { pubkey: params.collateral, isSigner: false, isWritable: true },
    { pubkey: collateralAuthority, isSigner: false, isWritable: true },
    { pubkey: params.destination, isSigner: false, isWritable: true },
    // Optional accounts: use the program ID as a sentinel for "None"
    { pubkey: params.asset ?? params.rainProgramId, isSigner: false, isWritable: false },
    { pubkey: collateralTokenAccount ?? params.rainProgramId, isSigner: false, isWritable: collateralTokenAccount != null },
    { pubkey: destinationTokenAccount ?? params.rainProgramId, isSigner: false, isWritable: destinationTokenAccount != null },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: params.rainProgramId,
    data,
  });
}
