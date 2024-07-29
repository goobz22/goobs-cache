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
    log = setupLogging('buffer_edge_capacity.log', 'compression/client');
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    log('Test setup complete');

    // Set up mock implementations
    mockCompressData.mockImplementation((data: Uint8Array | string): Uint8Array => {
      const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      return new Uint8Array([...inputData, 0, 1, 2]); // Append some dummy bytes
    });

    mockDecompressData.mockImplementation(
      (data: Uint8Array, outputFormat?: 'string' | 'uint8array'): string | Uint8Array => {
        const decompressed = data.slice(0, -3); // Remove the dummy bytes
        return outputFormat === 'string' ? new TextDecoder().decode(decompressed) : decompressed;
      },
    );
  });

  afterAll(() => {
    logTestResults(log, 0, 1, 1, 'compression/client');
    closeLogStreams();
  });

  const generateRandomData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i += 65536) {
      const chunkSize = Math.min(65536, size - i);
      const chunk = new Uint8Array(chunkSize);
      crypto.getRandomValues(chunk);
      data.set(chunk, i);
    }
    return data;
  };

  it('should handle compression and decompression of data at the edge of buffer capacity', async () => {
    log('\nTesting compression and decompression of data at the edge of buffer capacity...');
    const executionTime = await measureAsyncExecutionTime(async () => {
      const bufferCapacity = 1024 * 1024; // 1MB
      const testData = generateRandomData(bufferCapacity - 1); // Just 1 byte short of the capacity
      const compressedData = CompressionModule.compressData(testData);
      log(`Original data length: ${testData.length}`);
      log(`Compressed data length: ${compressedData.length}`);
      const compressionRatio = compressedData.length / testData.length;
      log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
      const decompressedData = CompressionModule.decompressData(
        compressedData,
        'uint8array',
      ) as Uint8Array;
      expect(decompressedData).toEqual(testData);
    });
    log(
      `Compression and decompression of data at the edge of buffer capacity successful. Execution time: ${executionTime}ms`,
    );
  });
});
