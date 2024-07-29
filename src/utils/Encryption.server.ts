'use server';

import { promisify } from 'util';
import {
  randomBytes,
  scrypt,
  createCipheriv,
  createDecipheriv,
  CipherGCM,
  CipherCCM,
  DecipherGCM,
  DecipherCCM,
} from 'crypto';
import { CacheConfig, EncryptedValue } from '../types';

const randomBytesAsync = promisify(randomBytes);
const scryptAsync = promisify(scrypt);

const SUPPORTED_ALGORITHMS = ['aes-256-gcm', 'aes-256-ccm'];

async function deriveKey(password: string, salt: Uint8Array): Promise<Buffer> {
  return scryptAsync(password, salt, 32) as Promise<Buffer>;
}

export async function encrypt(
  value: Uint8Array,
  password: string,
  config: CacheConfig,
): Promise<EncryptedValue> {
  if (!SUPPORTED_ALGORITHMS.includes(config.algorithm)) {
    throw new Error(
      `Unsupported algorithm: ${config.algorithm}. Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(', ')}`,
    );
  }

  const iv = new Uint8Array(await randomBytesAsync(16));
  const salt = new Uint8Array(await randomBytesAsync(16));
  const key = new Uint8Array(await deriveKey(password, salt));

  let cipher: CipherGCM | CipherCCM;
  if (config.algorithm === 'aes-256-ccm') {
    cipher = createCipheriv(config.algorithm, key, iv) as CipherCCM;
  } else if (config.algorithm === 'aes-256-gcm') {
    cipher = createCipheriv(config.algorithm, key, iv) as CipherGCM;
  } else {
    throw new Error(`Unsupported algorithm: ${config.algorithm}`);
  }

  const encryptedParts: Uint8Array[] = [];
  encryptedParts.push(new Uint8Array(cipher.update(value)));
  encryptedParts.push(new Uint8Array(cipher.final()));

  const encryptedData = new Uint8Array(encryptedParts.reduce((acc, curr) => acc + curr.length, 0));
  let offset = 0;
  for (const part of encryptedParts) {
    encryptedData.set(part, offset);
    offset += part.length;
  }

  const authTag = 'getAuthTag' in cipher ? new Uint8Array(cipher.getAuthTag()) : new Uint8Array(0);

  return {
    type: 'encrypted',
    encryptedData,
    iv,
    salt,
    authTag,
    encryptionKey: key,
  };
}

export async function decrypt(
  encryptedValue: EncryptedValue,
  password: string,
  config: CacheConfig,
): Promise<Uint8Array> {
  if (!SUPPORTED_ALGORITHMS.includes(config.algorithm)) {
    throw new Error(
      `Unsupported algorithm: ${config.algorithm}. Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(', ')}`,
    );
  }

  const { encryptedData, iv, salt, authTag } = encryptedValue;

  // Derive the key using the provided salt
  const key = new Uint8Array(await deriveKey(password, salt));

  let decipher: DecipherGCM | DecipherCCM;
  if (config.algorithm === 'aes-256-gcm') {
    decipher = createDecipheriv(config.algorithm, key, iv) as DecipherGCM;
    decipher.setAuthTag(authTag);
  } else if (config.algorithm === 'aes-256-ccm') {
    decipher = createDecipheriv(config.algorithm, key, iv) as DecipherCCM;
    (decipher as DecipherCCM).setAuthTag(authTag);
  } else {
    throw new Error(`Unsupported algorithm: ${config.algorithm}`);
  }

  const decryptedParts: Uint8Array[] = [];
  decryptedParts.push(new Uint8Array(decipher.update(encryptedData)));
  decryptedParts.push(new Uint8Array(decipher.final()));

  const decryptedData = new Uint8Array(decryptedParts.reduce((acc, curr) => acc + curr.length, 0));
  let offset = 0;
  for (const part of decryptedParts) {
    decryptedData.set(part, offset);
    offset += part.length;
  }

  return decryptedData;
}
