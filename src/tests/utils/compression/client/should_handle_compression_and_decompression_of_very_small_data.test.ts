import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('small_data.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of very small data', async () => {
    log('\nTesting compression and decompression of very small data...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      // Test with a single byte
      const singleByteData = new Uint8Array([42]);
      const compressedSingleByte = compressData(singleByteData);
      const decompressedSingleByte = decompressData(
        compressedSingleByte,
        'uint8array',
      ) as Uint8Array;
      expect(decompressedSingleByte).toEqual(singleByteData);
      log('Compression and decompression of single byte data successful');

      // Test with two bytes
      const twoBytesData = new Uint8Array([0, 255]);
      const compressedTwoBytes = compressData(twoBytesData);
      const decompressedTwoBytes = decompressData(compressedTwoBytes, 'uint8array') as Uint8Array;
      expect(decompressedTwoBytes).toEqual(twoBytesData);
      log('Compression and decompression of two bytes data successful');

      // Test with three bytes
      const threeBytesData = new Uint8Array([1, 2, 3]);
      const compressedThreeBytes = compressData(threeBytesData);
      const decompressedThreeBytes = decompressData(
        compressedThreeBytes,
        'uint8array',
      ) as Uint8Array;
      expect(decompressedThreeBytes).toEqual(threeBytesData);
      log('Compression and decompression of three bytes data successful');
    });

    log(
      `Compression and decompression of very small data successful. Execution time: ${executionTime}ms`,
    );
  });
});
