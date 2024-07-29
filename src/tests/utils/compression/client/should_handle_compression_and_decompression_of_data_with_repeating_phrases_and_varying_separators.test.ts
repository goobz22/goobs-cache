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
      'phrases_with_separators.log',
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

  it('should handle compression and decompression of data with repeating phrases and varying separators', async () => {
    log(
      '\nTesting compression and decompression of data with repeating phrases and varying separators...',
    );

    const executionTime = await measureAsyncExecutionTime(async () => {
      const phrases = ['Hello', 'World', 'Compression', 'Test', 'Data'];
      const separators = [' ', ', ', ' - ', ': ', '\n'];
      let testString = '';
      for (let i = 0; i < 1000; i++) {
        testString += phrases[Math.floor(Math.random() * phrases.length)];
        testString += separators[Math.floor(Math.random() * separators.length)];
      }
      const testData = new TextEncoder().encode(testString);

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeLessThan(0.3);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with repeating phrases and varying separators successful. Execution time: ${executionTime}ms`,
    );
  });
});
