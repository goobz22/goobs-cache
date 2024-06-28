'use server';

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import getConfig from '../config/config';

/**
 * EncryptionMaterial interface represents the structure for encryption materials.
 * It includes the encryption key, initialization vector (IV), and creation timestamp.
 */
interface EncryptionMaterial {
  key: Buffer;
  iv: Buffer;
  createdAt: number;
}

const MAX_KEYS = 3; // Maximum number of encryption keys to keep
let encryptionMaterials: EncryptionMaterial[] = [];
const ENCRYPTION_MATERIALS_FILE = path.join(process.cwd(), '.encryption_materials');
let isRotating = false;
let lastRotationTime = 0;

/**
 * loadEncryptionMaterials function loads the encryption materials from a file.
 * It reads the file, parses the JSON, and converts the base64 strings back to Buffers for key and IV.
 * If the file doesn't exist, it's not considered an error, and an empty array is used.
 */
async function loadEncryptionMaterials() {
  try {
    const data = await fs.readFile(ENCRYPTION_MATERIALS_FILE, 'utf8');
    encryptionMaterials = JSON.parse(data, (key, value) => {
      if (key === 'key' || key === 'iv') return Buffer.from(value, 'base64');
      return value;
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    encryptionMaterials = [];
  }
}

/**
 * saveEncryptionMaterials function saves the encryption materials to a file.
 * It converts the Buffers to base64 strings for storage and writes the JSON to the file.
 */
async function saveEncryptionMaterials() {
  const data = JSON.stringify(encryptionMaterials, (key, value) => {
    if (value instanceof Buffer) return value.toString('base64');
    return value;
  });
  await fs.writeFile(ENCRYPTION_MATERIALS_FILE, data, 'utf8');
}

/**
 * generateEncryptionMaterial function generates a new encryption material.
 * It retrieves the configuration, determines the key size based on the algorithm,
 * generates random bytes for the key and IV, and returns the encryption material.
 * @returns A Promise that resolves to the generated encryption material.
 */
async function generateEncryptionMaterial(): Promise<EncryptionMaterial> {
  const config = await getConfig();
  const keySize = parseInt(config.algorithm.split('-')[1]) / 8;
  const key = crypto.randomBytes(keySize);
  const iv = crypto.randomBytes(16);
  return { key, iv, createdAt: Date.now() };
}

/**
 * getOrCreateEncryptionMaterial function retrieves or creates an encryption material.
 * If no encryption materials exist, it loads them from the file.
 * If still no materials exist, it generates a new one, saves it to the file, and returns it.
 * @returns A Promise that resolves to the latest encryption material.
 */
async function getOrCreateEncryptionMaterial(): Promise<EncryptionMaterial> {
  if (encryptionMaterials.length === 0) {
    await loadEncryptionMaterials();
    if (encryptionMaterials.length === 0) {
      const newMaterial = await generateEncryptionMaterial();
      encryptionMaterials.push(newMaterial);
      await saveEncryptionMaterials();
    }
  }
  return encryptionMaterials[encryptionMaterials.length - 1];
}

/**
 * encrypt function encrypts a value using the latest encryption material.
 * It retrieves the configuration, gets or creates the encryption material,
 * creates a cipher using the algorithm, key, and IV, encrypts the value,
 * and returns the encrypted data, authentication tag, and key ID.
 * @param value The value to encrypt.
 * @returns A Promise that resolves to an object containing the encrypted data, authentication tag, and key ID.
 */
export async function encrypt(
  value: string,
): Promise<{ encryptedData: string; authTag: string; keyId: number }> {
  const config = await getConfig();
  const { key, iv } = await getOrCreateEncryptionMaterial();

  return new Promise((resolve, reject) => {
    try {
      const cipher = crypto.createCipheriv(config.algorithm, key, iv);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      resolve({ encryptedData: encrypted, authTag, keyId: encryptionMaterials.length - 1 });
    } catch (error) {
      reject(new Error(`Encryption failed: ${(error as Error).message}`));
    }
  });
}

/**
 * decrypt function decrypts an encrypted value using the specified key ID and authentication tag.
 * It retrieves the configuration, loads the encryption materials if not loaded,
 * and tries to decrypt the value using the specified key ID.
 * If decryption fails with the specified key, it tries all available keys in reverse order.
 * @param encryptedValue The encrypted value to decrypt.
 * @param authTag The authentication tag for the encrypted value.
 * @param keyId The ID of the key to use for decryption.
 * @returns A Promise that resolves to the decrypted value.
 * @throws An error if decryption fails with all available keys.
 */
export async function decrypt(
  encryptedValue: string,
  authTag: string,
  keyId: number,
): Promise<string> {
  const config = await getConfig();

  /**
   * tryDecrypt function attempts to decrypt the value using a specific encryption material.
   * It creates a decipher using the algorithm, key, and IV from the material,
   * sets the authentication tag, decrypts the value, and returns the decrypted value.
   * @param material The encryption material to use for decryption.
   * @returns A Promise that resolves to the decrypted value.
   * @throws An error if decryption fails with the provided material.
   */
  const tryDecrypt = (material: EncryptionMaterial): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const decipher = crypto.createDecipheriv(config.algorithm, material.key, material.iv);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        resolve(decrypted);
      } catch (error) {
        reject(error);
      }
    });
  };

  if (encryptionMaterials.length === 0) {
    await loadEncryptionMaterials();
  }

  if (keyId >= 0 && keyId < encryptionMaterials.length) {
    try {
      return await tryDecrypt(encryptionMaterials[keyId]);
    } catch (error) {
      // Decryption with specified key failed, will try other keys
    }
  }

  for (let i = encryptionMaterials.length - 1; i >= 0; i--) {
    try {
      return await tryDecrypt(encryptionMaterials[i]);
    } catch (error) {
      if (i === 0) {
        throw new Error(`Decryption failed with all available keys: ${(error as Error).message}`);
      }
    }
  }

  throw new Error('Decryption failed: No valid encryption key found');
}

/**
 * rotateEncryptionKey function rotates the encryption key.
 * It retrieves the configuration, checks if it's too soon or rotation is already in progress,
 * loads the encryption materials, generates a new material, adds it to the materials array,
 * removes the oldest key if the maximum number of keys is exceeded,
 * saves the updated materials to the file, and updates the last rotation time.
 * @returns A Promise that resolves to a boolean indicating whether the rotation was successful.
 */
export async function rotateEncryptionKey(): Promise<boolean> {
  const config = await getConfig();
  const currentTime = Date.now();
  if (isRotating || currentTime - lastRotationTime < config.keyRotationIntervalMs) {
    return false; // Skip rotation if it's too soon or already in progress
  }

  isRotating = true;
  try {
    await loadEncryptionMaterials();
    const newMaterial = await generateEncryptionMaterial();
    encryptionMaterials.push(newMaterial);
    if (encryptionMaterials.length > MAX_KEYS) {
      encryptionMaterials.shift(); // Remove oldest key if we exceed MAX_KEYS
    }
    await saveEncryptionMaterials();
    lastRotationTime = currentTime;
    return true;
  } catch (error) {
    return false;
  } finally {
    isRotating = false;
  }
}

/**
 * getLastRotationTime function returns the timestamp of the last key rotation.
 * @returns A Promise that resolves to the timestamp of the last key rotation.
 */
export async function getLastRotationTime(): Promise<number> {
  return lastRotationTime;
}

// Initialize encryption materials on module load
loadEncryptionMaterials().catch(() => {
  // Silently fail if loading fails, new materials will be generated when needed
});
