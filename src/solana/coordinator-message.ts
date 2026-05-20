import { keccak256 } from "js-sha3";
import { PublicKey } from "@solana/web3.js";

/**
 * Coordinator message encoding for Rain's single-signer withdrawal.
 *
 * Rain uses an EIP-712-like structured hashing scheme on Solana. The coordinator
 * signs a keccak256 hash of: padding bytes ‖ domain separator ‖ withdraw message.
 *
 * The resulting 32-byte hash is what the Ed25519 precompile verifies at the
 * transaction level.
 *
 * Adapted from: https://github.com/SignifyHQ/collateral-contract-integration-examples
 */

function keccak256Hex(hexData: string): string {
  return keccak256(Buffer.from(hexData, "hex"));
}

function keccak256Utf8(data: string): string {
  return keccak256(data);
}

function encodeAddress(value: PublicKey): string {
  return value.toBuffer().toString("hex");
}

function encodeUInt32(value: number): string {
  return value.toString(16).padStart(8, "0");
}

function encodeUInt64(value: bigint): string {
  return value.toString(16).padStart(16, "0");
}

function encodeBytes(value: Uint8Array): string {
  return Array.from(value)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PADDING_BYTES = encodeBytes(new Uint8Array(Buffer.from("\x19\x01", "latin1")));

const DOMAIN_TYPE_HASH = keccak256Utf8(
  "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)",
);

const WITHDRAW_TYPE_HASH = keccak256Utf8(
  "Withdraw(address user,address collateral,address asset,uint256 amount,address recipient,uint256 nonce,uint256 expiresAt)",
);

function encodeDomainSeparator(
  name: string,
  version: string,
  chainId: bigint,
  verifyingContract: PublicKey,
  salt: Uint8Array,
): string {
  const encodedStructure = [
    DOMAIN_TYPE_HASH,
    keccak256Utf8(name),
    keccak256Utf8(version),
    encodeUInt64(chainId),
    encodeAddress(verifyingContract),
    encodeBytes(salt),
  ].join("");
  return keccak256Hex(encodedStructure);
}

function encodeWithdrawMessage(
  collateral: PublicKey,
  owner: PublicKey,
  destination: PublicKey,
  asset: PublicKey,
  amountInAsset: bigint,
  signatureExpirationTime: bigint,
  nonce: number,
): string {
  const encodedStructure = [
    WITHDRAW_TYPE_HASH,
    encodeAddress(owner),
    encodeAddress(collateral),
    encodeAddress(asset),
    encodeUInt64(amountInAsset),
    encodeAddress(destination),
    encodeUInt32(nonce),
    encodeUInt64(signatureExpirationTime),
  ].join("");
  return keccak256Hex(encodedStructure);
}

/**
 * Builds the 32-byte message that the coordinator signs for a single-signer withdrawal.
 */
export function getWithdrawSingleSignerMessage(params: {
  coordinator: PublicKey;
  collateral: PublicKey;
  owner: PublicKey;
  receiver: PublicKey;
  asset: PublicKey;
  nonce: number;
  chainId: bigint;
  amountInAsset: bigint;
  signatureExpirationTime: bigint;
  coordinatorSignatureSalt: Uint8Array;
}): Buffer {
  const encodedData = [
    PADDING_BYTES,
    encodeDomainSeparator(
      "Coordinator",
      "2",
      params.chainId,
      params.coordinator,
      params.coordinatorSignatureSalt,
    ),
    encodeWithdrawMessage(
      params.collateral,
      params.owner,
      params.receiver,
      params.asset,
      params.amountInAsset,
      params.signatureExpirationTime,
      params.nonce,
    ),
  ].join("");

  const encodedDataHash = keccak256Hex(encodedData);
  return Buffer.from(encodedDataHash, "hex");
}
