import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('chunk-encryption.log');
const log = createLogger(logStream);

describe('Chunk Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const chunkSize = 1024; // 1KB chunks

  const encryptChunks = async (
    data: Uint8Array,
    password: string,
    config: CacheConfig,
  ): Promise<Uint8Array[]> => {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const encryptedChunk = await encrypt(chunk, password, config);
      chunks.push(encryptedChunk.encryptedData);
    }
    return chunks;
  };

  const decryptChunks = async (
    chunks: Uint8Array[],
    password: string,
    config: CacheConfig,
  ): Promise<Uint8Array> => {
    const decryptedChunks: Uint8Array[] = [];
    for (const chunk of chunks) {
      const decryptedChunk = await decrypt(
        {
          type: 'encrypted',
          encryptedData: chunk,
          iv: new Uint8Array(16),
          salt: new Uint8Array(16),
          authTag: new Uint8Array(16),
          encryptionKey: new Uint8Array(32),
        },
        password,
        config,
      );
      decryptedChunks.push(decryptedChunk);
    }
    return new Uint8Array(decryptedChunks.reduce((acc, val) => [...acc, ...val], [] as number[]));
  };

  it('should encrypt and decrypt data in chunks', async () => {
    const originalData = new Uint8Array(1024 * 1024); // 1MB of data
    crypto.getRandomValues(originalData);
    const password = 'chunk-encryption-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedChunks = await encryptChunks(originalData, password, config);

    expect(encryptedChunks.length).toBeGreaterThan(0);
    expect(encryptedChunks[0].byteLength).toBeGreaterThan(0);

    const decryptedData = await decryptChunks(encryptedChunks, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData.length).toBe(originalData.length);
    expect(decryptedData).toEqual(originalData);
  });

  it('should handle the last chunk with different size', async () => {
    const originalData = new Uint8Array(1024 * 1024 + 512); // 1MB + 512 bytes
    crypto.getRandomValues(originalData);
    const password = 'last-chunk-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedChunks = await encryptChunks(originalData, password, config);

    expect(encryptedChunks.length).toBe(Math.ceil(originalData.length / chunkSize));

    const decryptedData = await decryptChunks(encryptedChunks, password, config);

    expect(decryptedData.length).toBe(originalData.length);
    expect(decryptedData).toEqual(originalData);
  });
});
