'use server';
import crypto from 'crypto';
import { CacheConfig, EncryptedValue } from '../types';

/**
 * Generates a random encryption key based on the provided cache configuration.
 * The key size is determined by parsing the algorithm specified in the configuration.
 *
 * @param config The cache configuration object.
 * @returns A Promise that resolves to the generated encryption key as a Buffer.
 */
async function generateEncryptionKey(config: CacheConfig): Promise<Buffer> {
  const keySize = parseInt(config.algorithm.split('-')[1]) / 8;
  return crypto.randomBytes(keySize);
}

/**
 * Encrypts the provided value using the specified cache configuration.
 * It generates a random encryption key and initialization vector (IV),
 * creates a cipher using the specified algorithm, and encrypts the value.
 * If the algorithm includes 'gcm', it also generates an authentication tag.
 *
 * @param value The value to be encrypted.
 * @param config The cache configuration object.
 * @returns A Promise that resolves to an EncryptedValue object containing the encrypted data,
 *          IV, authentication tag (if applicable), and the encryption key.
 * @throws An error if the encryption fails.
 */
export async function encrypt(value: string, config: CacheConfig): Promise<EncryptedValue> {
  const key = await generateEncryptionKey(config);
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);

  return new Promise((resolve, reject) => {
    try {
      const cipher = crypto.createCipheriv(config.algorithm, key, iv);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      let authTag: string | undefined;
      if (config.algorithm.toLowerCase().includes('gcm')) {
        authTag = (cipher as crypto.CipherGCM).getAuthTag().toString('hex');
      }
      resolve({
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag,
        encryptionKey: key.toString('hex'),
        salt: salt.toString('hex'),
      });
    } catch (error) {
      reject(new Error(`Encryption failed: ${(error as Error).message}`));
    }
  });
}

/**
 * Decrypts the provided encrypted value using the specified cache configuration,
 * initialization vector (IV), authentication tag (authTag), and encryption key.
 * It creates a decipher using the specified algorithm, sets the authentication tag (if applicable),
 * and decrypts the encrypted value.
 *
 * @param encryptedValue The encrypted value to be decrypted.
 * @param iv The initialization vector used for the encryption.
 * @param authTag The authentication tag used for the encryption (required for GCM mode).
 * @param encryptionKey The encryption key used for the encryption.
 * @param config The cache configuration object.
 * @returns A Promise that resolves to the decrypted value as a string.
 * @throws An error if the decryption fails or if the authentication tag is missing for GCM mode.
 */
export async function decrypt(
  encryptedValue: EncryptedValue,
  config: CacheConfig,
): Promise<string> {
  const { encryptedData, iv, authTag, encryptionKey } = encryptedValue;
  return new Promise((resolve, reject) => {
    try {
      const decipher = crypto.createDecipheriv(
        config.algorithm,
        Buffer.from(encryptionKey, 'hex'),
        Buffer.from(iv, 'hex'),
      );
      if (config.algorithm.toLowerCase().includes('gcm')) {
        if (!authTag) {
          throw new Error('Auth tag is required for GCM mode');
        }
        (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, 'hex'));
      }
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      resolve(decrypted);
    } catch (error) {
      reject(new Error(`Decryption failed: ${(error as Error).message}`));
    }
  });
}
