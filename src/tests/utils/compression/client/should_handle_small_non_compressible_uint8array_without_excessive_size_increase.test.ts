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
      'small_non_compressible.log',
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

  it('should handle small, non-compressible Uint8Array without excessive size increase', async () => {
    log('\nTesting compression with small, non-compressible Uint8Array...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz');
      const compressedData = compressData(testData);

      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);
      log(`Compressed data: ${compressedData.toString()}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(2)}`);

      expect(compressionRatio).toBeLessThan(2);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      log('Decompressed data: ' + new TextDecoder().decode(decompressedData));

      expect(decompressedData).toEqual(testData);
    });

    log(
      `Small, non-compressible Uint8Array compression test completed. Execution time: ${executionTime}ms`,
    );
  });
});
