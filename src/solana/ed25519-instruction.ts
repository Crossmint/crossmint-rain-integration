import { Ed25519Program, PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * Builds an Ed25519 signature verification instruction for Rain's coordinator signature.
 *
 * This instruction MUST be placed as a top-level instruction in the final transaction
 * (not inside a CPI). The Rain collateral program uses the instruction sysvar to
 * introspect the transaction and locate this Ed25519 verification at a prior index.
 *
 * Adapted from: https://github.com/SignifyHQ/collateral-contract-integration-examples
 */

const INSTRUCTION_INDEX = 2 ** 16 - 1;
const SIGNATURE_STRUCTURE_SIZE = 14;
const PUBKEY_SIZE = 32;
const SIGNATURE_SIZE = 64;
const MESSAGE_SIZE = 32;
const SIGNATURE_DATA_SIZE = PUBKEY_SIZE + SIGNATURE_SIZE + MESSAGE_SIZE;
const SIGNATURE_DATA_PLUS_STRUCTURE_SIZE = SIGNATURE_STRUCTURE_SIZE + SIGNATURE_DATA_SIZE;

export type SignatureVerificationData = {
  signer: PublicKey;
  signature: Buffer;
  message: Buffer;
};

class SignatureStructure {
  readonly publicKeyOffset: number;
  readonly signatureOffset: number;
  readonly messageOffset: number;
  readonly structureOffset: number;

  constructor(signatureIndex: number, signaturesStartOffset: number) {
    this.structureOffset = signatureIndex * SIGNATURE_STRUCTURE_SIZE + 2;
    this.publicKeyOffset = signatureIndex * SIGNATURE_DATA_SIZE + signaturesStartOffset;
    this.signatureOffset = this.publicKeyOffset + 32;
    this.messageOffset = this.signatureOffset + 64;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(SIGNATURE_STRUCTURE_SIZE);
    buffer.writeUInt16LE(this.signatureOffset, 0);
    buffer.writeUInt16LE(INSTRUCTION_INDEX, 2);
    buffer.writeUInt16LE(this.publicKeyOffset, 4);
    buffer.writeUInt16LE(INSTRUCTION_INDEX, 6);
    buffer.writeUInt16LE(this.messageOffset, 8);
    buffer.writeUInt16LE(MESSAGE_SIZE, 10);
    buffer.writeUInt16LE(INSTRUCTION_INDEX, 12);
    return buffer;
  }
}

export function createEd25519VerificationInstruction(
  signatures: SignatureVerificationData[],
): TransactionInstruction {
  const dataBuffer = Buffer.alloc(signatures.length * SIGNATURE_DATA_PLUS_STRUCTURE_SIZE + 2);

  dataBuffer.writeUInt8(signatures.length, 0);

  const signaturesStartOffset = signatures.length * SIGNATURE_STRUCTURE_SIZE + 2;

  for (let i = 0; i < signatures.length; i++) {
    const entry = signatures[i];
    if (entry == null) {
      throw new Error(`Missing signature entry at index ${i}`);
    }

    const { signer, signature, message } = entry;

    if (signature.length !== SIGNATURE_SIZE) {
      throw new Error(`Signature size must be ${SIGNATURE_SIZE} bytes, got ${signature.length}`);
    }
    if (message.length !== MESSAGE_SIZE) {
      throw new Error(`Message size must be ${MESSAGE_SIZE} bytes, got ${message.length}`);
    }

    const signatureOffset = new SignatureStructure(i, signaturesStartOffset);
    signatureOffset.toBuffer().copy(dataBuffer, signatureOffset.structureOffset);
    signer.toBuffer().copy(dataBuffer, signatureOffset.publicKeyOffset);
    signature.copy(dataBuffer, signatureOffset.signatureOffset);
    message.copy(dataBuffer, signatureOffset.messageOffset);
  }

  return new TransactionInstruction({
    keys: [],
    programId: Ed25519Program.programId,
    data: dataBuffer,
  });
}
