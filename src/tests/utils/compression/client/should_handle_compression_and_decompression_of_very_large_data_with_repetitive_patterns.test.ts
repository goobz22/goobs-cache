import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging(
      'large_repetitive_data.log',
      'compression/client',
    );
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of very large data with repetitive patterns', async () => {
    log('\nTesting compression and decompression of very large data with repetitive patterns...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const patternSize = 1024; // 1KB pattern
      const repetitions = 1024 * 100; // Repeat pattern 100K times to create ~100MB of data
      const pattern = new Uint8Array(patternSize);
      for (let i = 0; i < patternSize; i++) {
        pattern[i] = Math.floor(Math.random() * 256);
      }
      const testData = new Uint8Array(patternSize * repetitions);
      for (let i = 0; i < repetitions; i++) {
        testData.set(pattern, i * patternSize);
      }

      log(`Original data size: ${testData.length} bytes`);

      const startCompress = performance.now();
      const compressedData = compressData(testData);
      const endCompress = performance.now();

      log(`Compressed data size: ${compressedData.length} bytes`);
      log(`Compression time: ${(endCompress - startCompress).toFixed(2)} ms`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeLessThan(0.01);

      const startDecompress = performance.now();
      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      const endDecompress = performance.now();

      log(`Decompression time: ${(endDecompress - startDecompress).toFixed(2)} ms`);

      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of very large data with repetitive patterns successful. Execution time: ${executionTime}ms`,
    );
  });
});
