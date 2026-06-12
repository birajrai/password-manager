import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_DIGEST = 'sha512';

export function deriveKey(
  password: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS
): Buffer {
  return pbkdf2Sync(password, salt, iterations, KEY_LENGTH, PBKDF2_DIGEST);
}

export function generateSalt(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateIv(): string {
  return randomBytes(12).toString('hex');
}

function encrypt(plaintext: Buffer, key: Buffer): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decrypt(
  data: { ciphertext: string; iv: string; tag: string },
  key: Buffer
): Buffer {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(data.ciphertext, 'hex')),
    decipher.final(),
  ]);
}

export function encryptDerivedKey(derivedKey: Buffer, secretKey: Buffer) {
  return encrypt(derivedKey, secretKey);
}

export function decryptDerivedKey(
  data: { ciphertext: string; iv: string; tag: string },
  secretKey: Buffer
): Buffer {
  return decrypt(data, secretKey);
}

export function encryptVaultPassword(plaintext: string, vaultKey: Buffer) {
  return encrypt(Buffer.from(plaintext, 'utf-8'), vaultKey);
}

export function decryptVaultPassword(
  data: { ciphertext: string; iv: string; tag: string },
  vaultKey: Buffer
): string {
  return decrypt(data, vaultKey).toString('utf-8');
}
