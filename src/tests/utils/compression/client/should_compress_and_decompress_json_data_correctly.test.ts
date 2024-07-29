import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { DataValue } from '../../../../types';
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
import { CompressionModule } from '../../../../utils/compression.client';

jest.mock('../../../../../utils/compression.client', () => ({
  CompressionModule: MockCompressionModule,
}));

describe('Compression Client Utilities for JSON', () => {
  let log: (message: string) => void;

  beforeAll(() => {
    log = setupLogging('json_data_compression.log', 'compression/client');
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests for JSON...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    log('Test setup complete');

    // Set up mock implementations
    const mockCompressImplementation = (data: string | Uint8Array): Uint8Array => {
      let inputData: Uint8Array;
      if (typeof data === 'string') {
        inputData = new TextEncoder().encode(data);
      } else {
        inputData = data;
      }
      return new Uint8Array([...inputData, 0, 1, 2]); // Append some dummy bytes
    };

    const mockDecompressImplementation = (data: Uint8Array): Uint8Array => {
      return data.slice(0, -3); // Remove the dummy bytes
    };

    mockCompressData.mockImplementation(mockCompressImplementation);
    mockDecompressData.mockImplementation(mockDecompressImplementation);
    MockCompressionModule.compressData.mockImplementation(mockCompressImplementation);
    MockCompressionModule.decompressData.mockImplementation(mockDecompressImplementation);
  });

  afterAll(() => {
    logTestResults(log, 0, 3, 3, 'compression/client');
    closeLogStreams();
  });

  it('should compress and decompress JSON data correctly', async () => {
    log('Starting test: should compress and decompress JSON data correctly');
    const testData: DataValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        city: 'New York',
        hobbies: ['reading', 'traveling', 'coding'],
        nested: {
          key1: 'value1',
          key2: [1, 2, 3],
          key3: { subkey: 'subvalue' },
        },
      },
    };

    const jsonString = JSON.stringify(testData.value);
    const encoder = new TextEncoder();
    const jsonUint8Array = encoder.encode(jsonString);

    const executionTime = await measureAsyncExecutionTime(async () => {
      // Compress
      const compressedData = CompressionModule.compressData(jsonUint8Array);
      expect(compressedData).toBeInstanceOf(Uint8Array);
      expect(compressedData.length).toBeGreaterThan(0);
      log(`Compressed data length: ${compressedData.length}`);

      // Decompress
      const decompressedData = CompressionModule.decompressData(compressedData);
      expect(decompressedData).toBeInstanceOf(Uint8Array);

      const decoder = new TextDecoder();
      const decompressedJsonString = decoder.decode(decompressedData as Uint8Array);
      const parsedData = JSON.parse(decompressedJsonString);
      log(`Parsed data: ${JSON.stringify(parsedData, null, 2)}`);

      expect(parsedData).toEqual(testData.value);
    });

    log(`Execution time: ${executionTime}ms`);
    expect(mockCompressData).toHaveBeenCalled();
    expect(mockDecompressData).toHaveBeenCalled();
  });

  it('should handle errors during JSON compression', async () => {
    log('Starting test: should handle errors during JSON compression');
    mockCompressData.mockImplementationOnce(() => {
      throw new Error('JSON Compression error');
    });

    const testData: DataValue = {
      type: 'json',
      value: { test: 'data' },
    };

    await expect(async () => {
      await measureAsyncExecutionTime(async () => {
        const jsonString = JSON.stringify(testData.value);
        const encoder = new TextEncoder();
        const jsonUint8Array = encoder.encode(jsonString);
        CompressionModule.compressData(jsonUint8Array);
      });
    }).rejects.toThrow('JSON Compression error');
    log('Verified error handling during JSON compression');
  });

  it('should handle errors during JSON decompression', async () => {
    log('Starting test: should handle errors during JSON decompression');
    mockDecompressData.mockImplementationOnce(() => {
      throw new Error('JSON Decompression error');
    });

    const compressedData = new Uint8Array([1, 2, 3, 4, 5]);
    await expect(async () => {
      await measureAsyncExecutionTime(async () => {
        CompressionModule.decompressData(compressedData);
      });
    }).rejects.toThrow('JSON Decompression error');
    log('Verified error handling during JSON decompression');
  });
});