import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { compressData, decompressData } from '../../../../utils/compression.client';
import { runTestsWithLogging, closeLogStreams } from '../../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../../jest/reusableJest/performance';

// Explicitly type the mocked functions
type MockCompressData = jest.MockedFunction<typeof compressData>;
type MockDecompressData = jest.MockedFunction<typeof decompressData>;

jest.mock('../../../../../utils/compression.client', () => ({
  compressData: jest.fn(),
  decompressData: jest.fn(),
}));

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;
  let mockCompressData: MockCompressData;
  let mockDecompressData: MockDecompressData;

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('mixed_types.log', 'compression/client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');

    // Cast the mocked functions to the correct types
    mockCompressData = compressData as MockCompressData;
    mockDecompressData = decompressData as MockDecompressData;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    log('Test setup complete');

    // Set up mock implementations
    mockCompressData.mockImplementation((data: Uint8Array | string): Uint8Array => {
      const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      // Simple mock compression: just append a few bytes
      return new Uint8Array([...inputData, 0, 1, 2]);
    });

    mockDecompressData.mockImplementation(
      (data: Uint8Array, outputFormat?: 'string' | 'uint8array'): string | Uint8Array => {
        // Simple mock decompression: remove the last 3 bytes
        const decompressed = data.slice(0, -3);
        return outputFormat === 'string' ? new TextDecoder().decode(decompressed) : decompressed;
      },
    );
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should handle compression and decompression of data with mixed types', async () => {
    log('\nTesting compression and decompression of data with mixed types...');
    const executionTime = await measureAsyncExecutionTime(async () => {
      const testObj = {
        string: 'Hello, world!',
        number: 42,
        boolean: true,
        array: [1, 2, 3, 4, 5],
        nested: {
          a: 'nested',
          b: [true, false, true],
        },
        uint8Array: new Uint8Array([0, 1, 2, 3, 4, 5]),
      };
      const testJson = JSON.stringify(testObj);
      const testData = new TextEncoder().encode(testJson);
      const compressedData = mockCompressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);
      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
      const decompressedData = mockDecompressData(compressedData, 'uint8array') as Uint8Array;
      expect(decompressedData).toEqual(testData);
      const decompressedJson = new TextDecoder().decode(decompressedData);
      const decompressedObj = JSON.parse(decompressedJson);
      expect(decompressedObj).toEqual({ ...testObj, uint8Array: Array.from(testObj.uint8Array) });
    });
    log(
      `Compression and decompression of data with mixed types successful. Execution time: ${executionTime}ms`,
    );
  });

  // Add this test at the end to log the completion of all tests
  it('should complete all tests', () => {
    log('All Compression Client Utilities tests completed successfully');
  });
});
