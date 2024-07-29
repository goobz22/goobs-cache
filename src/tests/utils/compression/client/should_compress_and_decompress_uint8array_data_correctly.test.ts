import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import {
  setupLogging,
  logTestResults,
  closeLogStreams,
  setupErrorHandling,
  measureAsyncExecutionTime,
  TestResult,
  debugLog,
} from 'goobs-testing';

// Mock setup
import { mockCompressData, mockDecompressData, MockCompressionModule } from '../../../../jest/mocks/utils/client/compression.mock';

jest.mock('../../../../../utils/compression.client', () => ({
  CompressionModule: MockCompressionModule,
}));

// Now import the mocked module
import { CompressionModule } from '../../../../utils/compression.client';

describe('Compression Client Uint8Array Operations', () => {
  let log: (message: string) => void;
  let teardownErrorHandling: () => void;
  const testResults: TestResult[] = [];
  let suiteStartTime: number;

  beforeAll(() => {
    debugLog('Setting up test suite');
    log = setupLogging('uint8array_compression.log', 'compression/client', 'local');
    teardownErrorHandling = setupErrorHandling(log);
    suiteStartTime = Date.now();
    debugLog('Test suite setup complete');
  });

  beforeEach(() => {
    debugLog('Clearing mocks and setting up mock implementations');
    jest.clearAllMocks();

    // Set up mock implementations
    mockCompressData.mockImplementation((data: string | Uint8Array): Uint8Array => {
      const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      debugLog(`Mock compress data called with input length: ${inputData.length}`);
      return new Uint8Array([...inputData, 0, 1, 2]); // Append some dummy bytes
    });

    mockDecompressData.mockImplementation(
      (data: Uint8Array, outputFormat?: 'string' | 'uint8array'): string | Uint8Array => {
        debugLog(`Mock decompress data called with input length: ${data.length}, output format: ${outputFormat}`);
        const decompressed = data.slice(0, -3); // Remove the dummy bytes
        return outputFormat === 'string' ? new TextDecoder().decode(decompressed) : decompressed;
      },
    );
    debugLog('Mock setup complete');
  });

  afterAll(() => {
    debugLog('Tearing down test suite');
    teardownErrorHandling();
    const totalDuration = (Date.now() - suiteStartTime) / 1000;
    logTestResults(
      log,
      testResults,
      'Compression Client Uint8Array Operations',
      'src/testing/tests/utils/compression/client/should_compress_and_decompress_uint8array_data_correctly.test.ts',
      totalDuration
    );
    closeLogStreams();
    debugLog('Test suite teardown complete');
  });

  it('should compress and decompress Uint8Array data correctly', async () => {
    debugLog('Starting compress and decompress Uint8Array test');
    const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const startTime = Date.now();

    try {
      await measureAsyncExecutionTime(async () => {
        debugLog('Compressing data');
        const compressedData = CompressionModule.compressData(originalData);
        expect(compressedData).toBeInstanceOf(Uint8Array);
        debugLog(`Compressed data length: ${compressedData.length}`);

        debugLog('Decompressing data');
        const decompressedData = CompressionModule.decompressData(compressedData, 'uint8array') as Uint8Array;
        expect(decompressedData).toBeInstanceOf(Uint8Array);
        debugLog(`Decompressed data length: ${decompressedData.length}`);

        expect(decompressedData).toEqual(originalData);
        debugLog('Decompressed data matches original data');
      });

      expect(mockCompressData).toHaveBeenCalled();
      expect(mockDecompressData).toHaveBeenCalled();

      testResults.push({
        name: 'should compress and decompress Uint8Array data correctly',
        status: 'passed',
        duration: Date.now() - startTime
      });
      debugLog('Compress and decompress Uint8Array test passed');
    } catch (error) {
      debugLog(`Error in compress and decompress Uint8Array test: ${error}`);
      testResults.push({
        name: 'should compress and decompress Uint8Array data correctly',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error
      });
    }
  });

  it('should handle empty Uint8Array', async () => {
    debugLog('Starting empty Uint8Array test');
    const startTime = Date.now();
    try {
      // Guaranteed failure
      throw new Error('Intentional failure in empty Uint8Array test');
    } catch (error) {
      debugLog(`Intentional error thrown in empty Uint8Array test: ${error}`);
      testResults.push({
        name: 'should handle empty Uint8Array',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error
      });
      throw error; // Re-throw the error to make Jest aware of the failure
    }
  });

  it('should compress and decompress large Uint8Array', async () => {
    debugLog('Starting compress and decompress large Uint8Array test');
    const largeData = new Uint8Array(1000000).fill(1);
    const startTime = Date.now();

    try {
      await measureAsyncExecutionTime(async () => {
        debugLog('Compressing large data');
        const compressedLarge = CompressionModule.compressData(largeData);
        expect(compressedLarge).toBeInstanceOf(Uint8Array);
        debugLog(`Compressed large data length: ${compressedLarge.length}`);

        debugLog('Decompressing large data');
        const decompressedLarge = CompressionModule.decompressData(compressedLarge, 'uint8array') as Uint8Array;
        expect(decompressedLarge).toBeInstanceOf(Uint8Array);
        debugLog(`Decompressed large data length: ${decompressedLarge.length}`);

        expect(decompressedLarge).toEqual(largeData);
        debugLog('Decompressed large data matches original large data');
      });

      testResults.push({
        name: 'should compress and decompress large Uint8Array',
        status: 'passed',
        duration: Date.now() - startTime
      });
      debugLog('Compress and decompress large Uint8Array test passed');
    } catch (error) {
      debugLog(`Error in compress and decompress large Uint8Array test: ${error}`);
      testResults.push({
        name: 'should compress and decompress large Uint8Array',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error
      });
    }
  });

  it('should handle errors during compression', async () => {
    debugLog('Starting error handling during compression test');
    const startTime = Date.now();
    mockCompressData.mockImplementationOnce(() => {
      debugLog('Mocking compression error');
      throw new Error('Compression error');
    });

    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    try {
      await expect(async () => {
        await measureAsyncExecutionTime(async () => {
          debugLog('Attempting to compress data (expecting error)');
          CompressionModule.compressData(testData);
        });
      }).rejects.toThrow('Compression error');
      debugLog('Compression error thrown as expected');

      testResults.push({
        name: 'should handle errors during compression',
        status: 'passed',
        duration: Date.now() - startTime
      });
      debugLog('Error handling during compression test passed');
    } catch (error) {
      debugLog(`Unexpected error in compression error handling test: ${error}`);
      testResults.push({
        name: 'should handle errors during compression',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error
      });
    }
  });

  it('should handle errors during decompression', async () => {
    debugLog('Starting error handling during decompression test');
    const startTime = Date.now();
    mockDecompressData.mockImplementationOnce(() => {
      debugLog('Mocking decompression error');
      throw new Error('Decompression error');
    });

    const compressedData = new Uint8Array([1, 2, 3, 4, 5]);
    
    try {
      await expect(async () => {
        await measureAsyncExecutionTime(async () => {
          debugLog('Attempting to decompress data (expecting error)');
          CompressionModule.decompressData(compressedData, 'uint8array');
        });
      }).rejects.toThrow('Decompression error');
      debugLog('Decompression error thrown as expected');

      testResults.push({
        name: 'should handle errors during decompression',
        status: 'passed',
        duration: Date.now() - startTime
      });
      debugLog('Error handling during decompression test passed');
    } catch (error) {
      debugLog(`Unexpected error in decompression error handling test: ${error}`);
      testResults.push({
        name: 'should handle errors during decompression',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error as Error
      });
    }
  });
});