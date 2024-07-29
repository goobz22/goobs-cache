import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-large-data-chunks-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Very Large Data in Chunks', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (data: Uint8Array, config: CacheConfig): Promise<EncryptedValue> => {
    return new Promise((resolve) => {
      encrypt(data, config, resolve);
    });
  };

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: CacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  const generateLargeData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    expect(data.length).toBe(size);
    expect(data[0]).toBe(0);
    expect(data[255]).toBe(255);
    expect(data[256]).toBe(0);
    return data;
  };

  const chunkData = (data: Uint8Array, chunkSize: number): Uint8Array[] => {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    expect(chunks.length).toBe(Math.ceil(data.length / chunkSize));
    expect(chunks[0].length).toBe(chunkSize);
    if (data.length % chunkSize !== 0) {
      expect(chunks[chunks.length - 1].length).toBe(data.length % chunkSize);
    }
    return chunks;
  };

  const testLargeDataHandling = async (dataSize: number, chunkSize: number) => {
    const originalData = generateLargeData(dataSize);
    expect(originalData.length).toBe(dataSize);

    const chunks = chunkData(originalData, chunkSize);
    expect(chunks.length).toBe(Math.ceil(dataSize / chunkSize));

    log(`Encrypting large data of size ${dataSize} bytes in chunks of ${chunkSize} bytes`);
    const encryptedChunks: EncryptedValue[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const encryptedChunk = await encryptPromise(chunks[i], mockCacheConfig);
      encryptedChunks.push(encryptedChunk);
      log(`Encrypted chunk ${i + 1}/${chunks.length}`);
      expect(encryptedChunk).toBeDefined();
      expect(encryptedChunk.encryptedData).toBeDefined();
      expect(encryptedChunk.encryptedData.byteLength).toBeGreaterThan(0);
      expect(encryptedChunk.iv).toBeDefined();
      expect(encryptedChunk.iv.byteLength).toBe(12);
      expect(encryptedChunk.salt).toBeDefined();
      expect(encryptedChunk.salt.byteLength).toBe(16);
      expect(encryptedChunk.authTag).toBeDefined();
      expect(encryptedChunk.authTag.byteLength).toBe(16);
    }
    expect(encryptedChunks.length).toBe(chunks.length);

    log('Decrypting chunks');
    const decryptedChunks: Uint8Array[] = [];
    for (let i = 0; i < encryptedChunks.length; i++) {
      const decryptedChunk = await decryptPromise(encryptedChunks[i], mockCacheConfig);
      expect(decryptedChunk).not.toBeNull();
      expect(decryptedChunk).toBeDefined();
      expect(decryptedChunk!.byteLength).toBe(chunks[i].byteLength);
      decryptedChunks.push(decryptedChunk as Uint8Array);
      log(`Decrypted chunk ${i + 1}/${encryptedChunks.length}`);
      expect(decryptedChunk).toEqual(chunks[i]);
    }
    expect(decryptedChunks.length).toBe(chunks.length);

    const decryptedData = new Uint8Array(
      decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0),
    );
    expect(decryptedData.length).toBe(dataSize);

    let offset = 0;
    for (const chunk of decryptedChunks) {
      decryptedData.set(chunk, offset);
      offset += chunk.length;
    }
    expect(offset).toBe(dataSize);

    expect(decryptedData.length).toBe(originalData.length);
    expect(decryptedData).toEqual(originalData);
    expect(decryptedData[0]).toBe(0);
    expect(decryptedData[255]).toBe(255);
    expect(decryptedData[256]).toBe(0);
    expect(decryptedData[dataSize - 1]).toBe((dataSize - 1) % 256);

    log('Large data successfully encrypted and decrypted in chunks');
  };

  it('should handle 10MB data in 1MB chunks', async () => {
    const dataSize = 10 * 1024 * 1024;
    const chunkSize = 1 * 1024 * 1024;
    expect(dataSize).toBe(10485760);
    expect(chunkSize).toBe(1048576);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 30000);

  it('should handle 50MB data in 5MB chunks', async () => {
    const dataSize = 50 * 1024 * 1024;
    const chunkSize = 5 * 1024 * 1024;
    expect(dataSize).toBe(52428800);
    expect(chunkSize).toBe(5242880);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 60000);

  it('should handle 100MB data in 10MB chunks', async () => {
    const dataSize = 100 * 1024 * 1024;
    const chunkSize = 10 * 1024 * 1024;
    expect(dataSize).toBe(104857600);
    expect(chunkSize).toBe(10485760);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 120000);

  it('should handle 1GB data in 100MB chunks', async () => {
    const dataSize = 1024 * 1024 * 1024;
    const chunkSize = 100 * 1024 * 1024;
    expect(dataSize).toBe(1073741824);
    expect(chunkSize).toBe(104857600);
    expect(Math.floor(dataSize / chunkSize)).toBe(10);
    expect(dataSize % chunkSize).toBe(73741824);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 300000);

  it('should handle uneven chunk sizes', async () => {
    const dataSize = 10 * 1024 * 1024 + 100;
    const chunkSize = 1 * 1024 * 1024;
    expect(dataSize).toBe(10485860);
    expect(chunkSize).toBe(1048576);
    expect(Math.floor(dataSize / chunkSize)).toBe(10);
    expect(dataSize % chunkSize).toBe(100);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 30000);

  it('should handle very small chunks', async () => {
    const dataSize = 1 * 1024 * 1024;
    const chunkSize = 1024;
    expect(dataSize).toBe(1048576);
    expect(chunkSize).toBe(1024);
    expect(dataSize / chunkSize).toBe(1024);
    expect(dataSize % chunkSize).toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 60000);

  it('should handle prime number data size and chunk size', async () => {
    const dataSize = 17 * 1024 * 1024 + 1; // A prime number
    const chunkSize = 1024 * 1024 + 3; // Another prime number
    expect(dataSize).toBe(17825793);
    expect(chunkSize).toBe(1048579);
    expect(Math.floor(dataSize / chunkSize)).toBe(17);
    expect(dataSize % chunkSize).toBe(1);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 60000);

  it('should handle chunk size larger than data size', async () => {
    const dataSize = 1 * 1024 * 1024;
    const chunkSize = 2 * 1024 * 1024;
    expect(dataSize).toBe(1048576);
    expect(chunkSize).toBe(2097152);
    expect(Math.floor(dataSize / chunkSize)).toBe(0);
    expect(dataSize % chunkSize).toBe(dataSize);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 30000);

  it('should handle data size equal to chunk size', async () => {
    const dataSize = 5 * 1024 * 1024;
    const chunkSize = 5 * 1024 * 1024;
    expect(dataSize).toBe(5242880);
    expect(chunkSize).toBe(5242880);
    expect(dataSize / chunkSize).toBe(1);
    expect(dataSize % chunkSize).toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 30000);

  it('should handle very large number of small chunks', async () => {
    const dataSize = 10 * 1024 * 1024;
    const chunkSize = 256;
    expect(dataSize).toBe(10485760);
    expect(chunkSize).toBe(256);
    expect(dataSize / chunkSize).toBe(40960);
    expect(dataSize % chunkSize).toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 120000);

  it('should handle data size not divisible by 256', async () => {
    const dataSize = 10 * 1024 * 1024 + 123;
    const chunkSize = 1024 * 1024;
    expect(dataSize).toBe(10485883);
    expect(chunkSize).toBe(1048576);
    expect(Math.floor(dataSize / chunkSize)).toBe(10);
    expect(dataSize % chunkSize).toBe(123);
    expect(dataSize % 256).not.toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 30000);

  it('should handle encryption and decryption of empty data', async () => {
    const dataSize = 0;
    const chunkSize = 1024;
    expect(dataSize).toBe(0);
    expect(chunkSize).toBe(1024);
    expect(Math.floor(dataSize / chunkSize)).toBe(0);
    expect(dataSize % chunkSize).toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 10000);

  // This test case is to verify the behavior when chunk size is 1
  it('should handle chunk size of 1 byte', async () => {
    const dataSize = 1024;
    const chunkSize = 1;
    expect(dataSize).toBe(1024);
    expect(chunkSize).toBe(1);
    expect(dataSize / chunkSize).toBe(1024);
    expect(dataSize % chunkSize).toBe(0);
    await testLargeDataHandling(dataSize, chunkSize);
  }, 60000);
});
