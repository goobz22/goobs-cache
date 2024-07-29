'use client';

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherKey,
  BinaryLike,
  CipherGCM,
  DecipherGCM,
  Decipher,
  pbkdf2,
} from 'crypto';
import { CacheConfig, EncryptedValue } from '../types';

const isBrowser = typeof window !== 'undefined' && window.crypto;

function getRandomValues(array: Uint8Array): Uint8Array {
  if (isBrowser) {
    return window.crypto.getRandomValues(array);
  } else {
    return Uint8Array.from(randomBytes(array.length));
  }
}

interface CryptoImplementation {
  deriveKey(password: string, salt: Uint8Array, callback: (key: CipherKey) => void): void;
  encrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    callback: (result: { encrypted: Uint8Array; authTag: Uint8Array }) => void,
  ): void;
  decrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    authTag: Uint8Array,
    callback: (result: Uint8Array | null) => void,
  ): void;
  exportKey(key: CipherKey, callback: (result: Uint8Array) => void): void;
}

class BrowserCrypto implements CryptoImplementation {
  deriveKey(password: string, salt: Uint8Array, callback: (key: CipherKey) => void): void {
    const enc = new TextEncoder();
    window.crypto.subtle
      .importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, [
        'deriveBits',
        'deriveKey',
      ])
      .then((keyMaterial) =>
        window.crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt'],
        ),
      )
      .then((key) => callback(key as unknown as CipherKey));
  }

  encrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    callback: (result: { encrypted: Uint8Array; authTag: Uint8Array }) => void,
  ): void {
    window.crypto.subtle
      .encrypt({ name: 'AES-GCM', iv: iv }, key as unknown as CryptoKey, data)
      .then((encrypted) => {
        const encryptedContent = new Uint8Array(encrypted, 0, encrypted.byteLength - 16);
        const authTag = new Uint8Array(encrypted, encrypted.byteLength - 16);
        callback({
          encrypted: encryptedContent,
          authTag: authTag,
        });
      });
  }

  decrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    authTag: Uint8Array,
    callback: (result: Uint8Array | null) => void,
  ): void {
    const combinedData = new Uint8Array(data.length + authTag.length);
    combinedData.set(data, 0);
    combinedData.set(authTag, data.length);

    window.crypto.subtle
      .decrypt({ name: 'AES-GCM', iv: iv }, key as unknown as CryptoKey, combinedData)
      .then((decrypted) => callback(new Uint8Array(decrypted)))
      .catch((error) => {
        console.error('Decryption error (browser):', error);
        callback(null);
      });
  }

  exportKey(key: CipherKey, callback: (result: Uint8Array) => void): void {
    window.crypto.subtle
      .exportKey('raw', key as unknown as CryptoKey)
      .then((exported) => callback(new Uint8Array(exported)));
  }
}

class NodeCrypto implements CryptoImplementation {
  deriveKey(password: string, salt: Uint8Array, callback: (key: CipherKey) => void): void {
    pbkdf2(password, salt, 100000, 32, 'sha256', (err: Error | null, derivedKey: Buffer) => {
      if (err) {
        console.error('Key derivation error:', err);
        throw err;
      }
      callback(derivedKey as unknown as CipherKey);
    });
  }

  encrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    callback: (result: { encrypted: Uint8Array; authTag: Uint8Array }) => void,
  ): void {
    const cipher: CipherGCM = createCipheriv('aes-256-gcm', key, iv as BinaryLike) as CipherGCM;
    const encryptedChunks: Uint8Array[] = [];
    encryptedChunks.push(new Uint8Array(cipher.update(data)));
    encryptedChunks.push(new Uint8Array(cipher.final()));

    const encrypted = new Uint8Array(encryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of encryptedChunks) {
      encrypted.set(chunk, offset);
      offset += chunk.length;
    }

    const authTag = new Uint8Array(cipher.getAuthTag());
    callback({ encrypted, authTag });
  }

  decrypt(
    key: CipherKey,
    iv: Uint8Array,
    data: Uint8Array,
    authTag: Uint8Array,
    callback: (result: Uint8Array | null) => void,
  ): void {
    const decipher: Decipher = createDecipheriv('aes-256-gcm', key, iv);
    (decipher as DecipherGCM).setAuthTag(authTag);

    const decryptedChunks: Uint8Array[] = [];

    try {
      decryptedChunks.push(new Uint8Array(decipher.update(data)));
      decryptedChunks.push(new Uint8Array(decipher.final()));
    } catch (error) {
      callback(null);
      return;
    }

    const decrypted = new Uint8Array(decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of decryptedChunks) {
      decrypted.set(chunk, offset);
      offset += chunk.length;
    }

    callback(decrypted);
  }

  exportKey(key: CipherKey, callback: (result: Uint8Array) => void): void {
    if (Buffer.isBuffer(key)) {
      callback(new Uint8Array(key));
    } else if (typeof key === 'string') {
      callback(new TextEncoder().encode(key));
    } else if (key instanceof Uint8Array) {
      callback(key);
    } else {
      callback(new Uint8Array(Buffer.from(key as ArrayBuffer)));
    }
  }
}

const cryptoImpl: CryptoImplementation = isBrowser ? new BrowserCrypto() : new NodeCrypto();

export function encrypt(
  value: Uint8Array,
  config: CacheConfig,
  callback: (result: EncryptedValue) => void,
): void {
  const iv = getRandomValues(new Uint8Array(12));
  const salt = getRandomValues(new Uint8Array(16));

  // Handle empty string case
  if (value.length === 0) {
    callback({
      type: 'encrypted',
      encryptedData: new Uint8Array(0),
      iv: iv,
      salt: salt,
      authTag: new Uint8Array(16),
      encryptionKey: new Uint8Array(32),
    });
    return;
  }

  cryptoImpl.deriveKey(config.encryptionPassword, salt, (key) => {
    cryptoImpl.encrypt(key, iv, value, ({ encrypted, authTag }) => {
      cryptoImpl.exportKey(key, (exportedKey) => {
        callback({
          type: 'encrypted',
          encryptedData: encrypted,
          iv: iv,
          salt: salt,
          authTag: authTag,
          encryptionKey: exportedKey,
        });
      });
    });
  });
}

export function decrypt(
  encryptedValue: EncryptedValue,
  config: CacheConfig,
  callback: (result: Uint8Array | null) => void,
): void {
  const { iv, salt, encryptedData, authTag } = encryptedValue;

  // Handle empty string case
  if (encryptedData.length === 0) {
    callback(new Uint8Array(0));
    return;
  }

  cryptoImpl.deriveKey(config.encryptionPassword, salt, (key) => {
    cryptoImpl.decrypt(key, iv, encryptedData, authTag, (decrypted) => {
      if (decrypted === null) {
        console.error('Decryption error:');
        console.error('Decryption parameters:');
        console.error('Key:', key);
        console.error('IV:', iv);
        console.error('Data:', encryptedData);
        console.error('Auth Tag:', authTag);
        console.error('Decryption failed. Encrypted value:', encryptedValue);
      }
      callback(decrypted);
    });
  });
}
