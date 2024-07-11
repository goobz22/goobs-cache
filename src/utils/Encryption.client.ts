'use client';
import { CacheConfig, EncryptedValue } from '../types';

/**
 * Converts a string to an ArrayBuffer.
 *
 * @param {string} str - The string to convert.
 * @returns {ArrayBuffer} The converted ArrayBuffer.
 */
export function str2ab(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

/**
 * Converts an ArrayBuffer to a string.
 *
 * @param {ArrayBuffer} buf - The ArrayBuffer to convert.
 * @returns {string} The converted string.
 */
export function ab2str(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 *
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert.
 * @returns {string} The converted hexadecimal string.
 */
function ab2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hexadecimal string to an ArrayBuffer.
 *
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {ArrayBuffer} The converted ArrayBuffer.
 */
function hex2ab(hex: string): ArrayBuffer {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))).buffer;
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 *
 * @param {string} password - The password used for key derivation.
 * @param {Uint8Array} salt - The salt used for key derivation.
 * @returns {Promise<CryptoKey>} A promise that resolves to the derived cryptographic key.
 */
function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );
  return keyMaterial.then((km) =>
    window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      km,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    ),
  );
}

/**
 * Encrypts a value using AES-GCM encryption.
 *
 * @param {string} value - The value to encrypt.
 * @param {CacheConfig} config - The cache configuration containing the encryption password.
 * @returns {Promise<EncryptedValue>} A promise that resolves to the encrypted value.
 */
export function encrypt(value: string, config: CacheConfig): Promise<EncryptedValue> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const keyPromise = deriveKey(config.encryptionPassword, salt);
  return keyPromise.then((key) =>
    window.crypto.subtle
      .encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        str2ab(value),
      )
      .then((encrypted) =>
        window.crypto.subtle.exportKey('raw', key).then((exportedKey) => ({
          type: 'encrypted',
          encryptedData: ab2hex(encrypted),
          iv: ab2hex(iv),
          salt: ab2hex(salt),
          encryptionKey: ab2hex(exportedKey),
        })),
      ),
  );
}

/**
 * Decrypts an encrypted value using AES-GCM decryption.
 *
 * @param {EncryptedValue} encryptedValue - The encrypted value to decrypt.
 * @param {CacheConfig} config - The cache configuration containing the encryption password.
 * @returns {Promise<string>} A promise that resolves to the decrypted string value.
 */
export function decrypt(encryptedValue: EncryptedValue, config: CacheConfig): Promise<string> {
  const keyPromise = deriveKey(
    config.encryptionPassword,
    new Uint8Array(hex2ab(encryptedValue.salt)),
  );
  return keyPromise
    .then((key) =>
      window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: hex2ab(encryptedValue.iv),
        },
        key,
        hex2ab(encryptedValue.encryptedData),
      ),
    )
    .then(ab2str);
}
