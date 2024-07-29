import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('repeated_substrings.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of data with repeated substrings', async () => {
    log('\nTesting compression and decompression of data with repeated substrings...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const repeatedSubstring = 'This is a test string that will be repeated. ';
      const testData = new TextEncoder().encode(repeatedSubstring.repeat(1000));

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(2)}`);

      expect(compressionRatio).toBeLessThan(0.1);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with repeated substrings successful. Execution time: ${executionTime}ms`,
    );
  });
});
