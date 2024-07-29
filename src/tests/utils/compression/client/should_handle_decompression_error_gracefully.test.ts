import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { CompressionModule } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

jest.mock('../../../../../utils/compression.client');

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging(
      'decompression_error_handling.log',
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

  it('should handle decompression error gracefully', async () => {
    log('\nTesting decompression error handling...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const invalidCompressedData = new Uint8Array([1, 2, 3, 4, 5]);

      jest.spyOn(CompressionModule, 'decompressData').mockImplementation(() => {
        throw new Error('Decompression error');
      });

      expect(() => {
        CompressionModule.decompressData(invalidCompressedData, 'uint8array');
      }).toThrow('Decompression error');
    });

    jest.restoreAllMocks();
    log(`Decompression error handling test completed. Execution time: ${executionTime}ms`);
  });
});
