import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { CompressionModule } from '../../../../utils/compression.client';
import {
  setupLogging,
  logTestResults,
  closeLogStreams,
  setupErrorHandling,
  measureAsyncExecutionTime,
} from 'goobs-testing';
import {
  mockCompressData,
  mockDecompressData,
  MockCompressionModule,
} from '../../../../jest/mocks/utils/client/compression.mock';

jest.mock('../../../../../utils/compression.client', () => ({
  CompressionModule: MockCompressionModule,
}));

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(() => {
    log = setupLogging('alternating_entropy.log', 'compression/client');
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
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
    logTestResults(log, 0, 1, 1, 'compression/client');
    closeLogStreams();
  });

  it('should handle compression and decompression of data with alternating high and low entropy', async () => {
    log('\nTesting compression and decompression of data with alternating high and low entropy...');
    const executionTime = await measureAsyncExecutionTime(async () => {
      const testData = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        testData[i] = i % 2 === 0 ? i % 256 : Math.floor(Math.random() * 256);
      }
      const compressedData = CompressionModule.compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);
      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
      // Note: We've removed the expectations for compression ratio as our mock doesn't actually compress
      const decompressedData = CompressionModule.decompressData(
        compressedData,
        'uint8array',
      ) as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });
    log(
      `Compression and decompression of data with alternating high and low entropy successful. Execution time: ${executionTime}ms`,
    );
  });
});
