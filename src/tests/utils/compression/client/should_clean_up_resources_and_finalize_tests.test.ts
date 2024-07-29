import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { DataValue } from '../../../../types';
import {
  setupLogging,
  logTestResults,
  closeLogStreams,
  setupErrorHandling,
  measureAsyncExecutionTime,
  expectToBeNonEmptyString,
  expectToBeGreaterThan,
  expectToHaveBeenCalledOnceWith,
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

describe('Compression Client Utilities', () => {
  let log: (message: string) => void;

  beforeAll(() => {
    log = setupLogging('clean_up_resources.log', 'compression/client');
    setupErrorHandling(log);
    log('Starting Compression Client Utilities tests...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    log('Test setup complete');
  });

  afterAll(() => {
    logTestResults(log, 0, 4, 4, 'compression/client');
    closeLogStreams();
  });

  it('should compress string data correctly', async () => {
    log('Starting test: should compress string data correctly');
    const testData: DataValue = { type: 'string', value: 'test data' };
    const executionTime = await measureAsyncExecutionTime(async () => {
      if (typeof testData.value !== 'string') {
        throw new Error('Invalid test data type');
      }
      const result = CompressionModule.compressData(testData.value);
      expect(result).toBeInstanceOf(Uint8Array);
      expectToBeGreaterThan(result.length, 0);
    });
    log(`Execution time: ${executionTime}ms`);
    expectToHaveBeenCalledOnceWith(mockCompressData, testData.value);
  });

  it('should decompress data to string correctly', async () => {
    log('Starting test: should decompress data to string correctly');
    const compressedData = new Uint8Array([1, 2, 3, 4, 5]);
    mockDecompressData.mockReturnValue('decompressed test data');
    const executionTime = await measureAsyncExecutionTime(async () => {
      const result = CompressionModule.decompressData(compressedData, 'string');
      expectToBeNonEmptyString(result);
    });
    log(`Execution time: ${executionTime}ms`);
    expectToHaveBeenCalledOnceWith(mockDecompressData, compressedData, 'string');
    expect(mockDecompressData).toHaveBeenCalled();
  });

  it('should handle errors during compression', async () => {
    log('Starting test: should handle errors during compression');
    mockCompressData.mockImplementationOnce(() => {
      throw new Error('Compression error');
    });
    const testData: DataValue = { type: 'string', value: 'test data' };
    await expect(async () => {
      await measureAsyncExecutionTime(async () => {
        if (typeof testData.value === 'string') {
          CompressionModule.compressData(testData.value);
        } else {
          throw new Error('Invalid test data type');
        }
      });
    }).rejects.toThrow('Compression error');
    log('Verified error handling during compression');
  });

  it('should handle errors during decompression', async () => {
    log('Starting test: should handle errors during decompression');
    mockDecompressData.mockImplementationOnce(() => {
      throw new Error('Decompression error');
    });
    const compressedData = new Uint8Array([1, 2, 3, 4, 5]);
    await expect(async () => {
      await measureAsyncExecutionTime(async () => {
        CompressionModule.decompressData(compressedData);
      });
    }).rejects.toThrow('Decompression error');
    log('Verified error handling during decompression');
  });
});