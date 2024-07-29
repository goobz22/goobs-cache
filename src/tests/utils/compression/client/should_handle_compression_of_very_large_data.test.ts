import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging(
      'large_data_compression.log',
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

  it('should handle compression of very large data', async () => {
    log('\nTesting compression of very large data...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const totalSize = 50 * 1024 * 1024; // 50 MB
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

      // Calculate compression ratio
      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(2)}`);

      // Check if compression ratio is within a reasonable range
      // For random data, we might not achieve much compression, so we'll allow up to 1.05 (5% larger)
      expect(compressionRatio).toBeLessThanOrEqual(1.05);
    });

    log(`Compression of very large data test completed. Execution time: ${executionTime}ms`);
  });
});
