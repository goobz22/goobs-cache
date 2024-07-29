import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('unicode_characters.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  afterAll(() => {
    closeLogStreams();
    log('Finishing Compression Client Utilities tests...');
  });

  it('should handle Uint8Array with Unicode characters', async () => {
    log('\nTesting compression and decompression with Unicode characters...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new TextEncoder().encode(
        '你好世界! こんにちは世界! Здравствуй, мир! مرحبا بالعالم!'.repeat(50),
      );
      const compressedData = compressData(testData);

      log(`Compressed data: ${compressedData.toString()}`);

      const decompressedData = decompressData(compressedData, 'uint8array') as Uint8Array;
      log('Decompressed data: ' + new TextDecoder().decode(decompressedData));

      expect(decompressedData).toEqual(testData);
    });

    log(`Unicode characters compression test completed. Execution time: ${executionTime}ms`);
  });
});
