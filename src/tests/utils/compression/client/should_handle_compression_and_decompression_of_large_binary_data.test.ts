import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('large_binary_data.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of large binary data', async () => {
    log('\nTesting compression and decompression of large binary data...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const totalSize = 1024 * 1024; // 1 MB
      const chunkSize = 65536; // Maximum size for crypto.getRandomValues()
      const testData = new Uint8Array(totalSize);

      // Fill the array with random values in chunks
      for (let offset = 0; offset < totalSize; offset += chunkSize) {
        const chunk = new Uint8Array(Math.min(chunkSize, totalSize - offset));
        crypto.getRandomValues(chunk);
        testData.set(chunk, offset);
      }

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      log(`Decompressed data length: ${decompressedData.length}`);

      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of large binary data successful. Execution time: ${executionTime}ms`,
    );
  });
});
