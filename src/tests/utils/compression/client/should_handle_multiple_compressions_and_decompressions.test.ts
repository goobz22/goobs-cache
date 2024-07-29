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
      'multiple_compressions.log',
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

  it('should handle multiple compressions and decompressions', async () => {
    log('\nTesting multiple compressions and decompressions...');

    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData1 = new TextEncoder().encode('First test string');
      const testData2 = new TextEncoder().encode('Second test string');
      const testData3 = new TextEncoder().encode('Third test string');

      const compressed1 = compressData(testData1);
      const compressed2 = compressData(testData2);
      const compressed3 = compressData(testData3);

      const decompressed1 = decompressData(compressed1, 'uint8array') as Uint8Array;
      const decompressed2 = decompressData(compressed2, 'uint8array') as Uint8Array;
      const decompressed3 = decompressData(compressed3, 'uint8array') as Uint8Array;

      expect(decompressed1).toEqual(testData1);
      expect(decompressed2).toEqual(testData2);
      expect(decompressed3).toEqual(testData3);
    });

    log(
      `Multiple compressions and decompressions test completed. Execution time: ${executionTime}ms`,
    );
  });
});
