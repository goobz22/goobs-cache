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
      'varying_length_substrings.log',
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

  it('should handle compression and decompression of data with repeating substrings of varying lengths', async () => {
    log(
      '\nTesting compression and decompression of data with repeating substrings of varying lengths...',
    );

    const executionTime = await measureAsyncExecutionTime(async () => {
      const generateSubstring = (length: number): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array(length)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join('');
      };

      let testString = '';
      const substrings: string[] = [];
      for (let i = 0; i < 20; i++) {
        const substring = generateSubstring(Math.floor(Math.random() * 20) + 1);
        substrings.push(substring);
        testString += substring.repeat(Math.floor(Math.random() * 50) + 1);
      }
      const testData = new TextEncoder().encode(testString);

      const compressedData = compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);

      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);

      expect(compressionRatio).toBeLessThan(0.5);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });

    log(
      `Compression and decompression of data with repeating substrings of varying lengths successful. Execution time: ${executionTime}ms`,
    );
  });
});
