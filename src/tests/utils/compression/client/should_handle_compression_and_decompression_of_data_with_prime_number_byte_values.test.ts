import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('prime_number_bytes.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of data with prime number byte values', async () => {
    log('\nTesting compression and decompression of data with prime number byte values...');

    const isPrime = (n: number): boolean => {
      for (let i = 2, s = Math.sqrt(n); i <= s; i++) {
        if (n % i === 0) return false;
      }
      return n > 1;
    };

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(1000);
      let value = 0;
      for (let i = 0; i < testData.length; i++) {
        while (!isPrime(value)) value++;
        testData[i] = value % 256;
        value++;
      }

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeLessThan(1.1);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with prime number byte values successful. Execution time: ${executionTime}ms`,
    );
  });
});
