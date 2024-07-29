import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('empty_uint8array.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle empty Uint8Array', async () => {
    log('\nTesting compression and decompression with empty Uint8Array...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(0);

      log('Compressing empty data...');
      const compressedData = compressData(testData);

      log('Decompressing empty data...');
      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;

      expect(decompressedData).toEqual(testData);
      expect(decompressedData).toBeInstanceOf(Uint8Array);
      expect(decompressedData.length).toBe(0);
    });

    log(
      `Empty Uint8Array compression and decompression test completed. Execution time: ${executionTime}ms`,
    );
  });
});
