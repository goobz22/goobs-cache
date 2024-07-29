import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('long_uint8array.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle long Uint8Array', async () => {
    log('\nTesting compression and decompression with long Uint8Array...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(10000).fill(65); // 'A' repeated 10000 times
      const compressedData = compressData(testData);

      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);
      log(`Compressed data: ${compressedData.slice(0, 100).toString()}...`); // Log first 100 elements

      expect(compressedData.length).toBeLessThan(testData.length);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      log(`Decompressed data length: ${decompressedData.length}`);

      expect(decompressedData).toEqual(testData);
      expect(decompressedData).toBeInstanceOf(Uint8Array);
      expect(decompressedData.length).toEqual(testData.length);
    });

    log(
      `Long Uint8Array compression and decompression test completed. Execution time: ${executionTime}ms`,
    );
  });
});
