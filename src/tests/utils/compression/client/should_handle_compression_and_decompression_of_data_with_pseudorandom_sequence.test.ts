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
      'pseudorandom_sequence.log',
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

  it('should handle compression and decompression of data with pseudorandom sequence', async () => {
    log('\nTesting compression and decompression of data with pseudorandom sequence...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(10000);
      let seed = 12345;
      for (let i = 0; i < testData.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        testData[i] = seed & 0xff;
      }

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeGreaterThan(0.9);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with pseudorandom sequence successful. Execution time: ${executionTime}ms`,
    );
  });
});
