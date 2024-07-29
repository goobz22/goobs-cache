import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('increasing_blocks.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle compression and decompression of data with repeating blocks of increasing size', async () => {
    log(
      '\nTesting compression and decompression of data with repeating blocks of increasing size...',
    );

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(10000);
      let blockSize = 1;
      let blockStart = 0;
      while (blockStart < testData.length) {
        const blockEnd = Math.min(blockStart + blockSize, testData.length);
        const blockValue = Math.floor(Math.random() * 256);
        testData.fill(blockValue, blockStart, blockEnd);
        blockStart = blockEnd;
        blockSize *= 2;
      }

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeLessThan(0.2);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with repeating blocks of increasing size successful. Execution time: ${executionTime}ms`,
    );
  });
});
