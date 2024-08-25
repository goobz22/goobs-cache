'use server';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { GlobalConfig } from '../types';
import { ServerLogger } from 'goobs-testing';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export const ServerCompressionModule = {
  globalConfig: {
    keySize: 256,
    batchSize: 100,
    autoTuneInterval: 3600000,
    loggingEnabled: true,
    logLevel: 'debug',
    logDirectory: 'logs',
  } as GlobalConfig,

  async compressData<T>(data: T): Promise<{ data: T; compressed: boolean }> {
    await ServerLogger.info('Starting data compression', {
      dataType: typeof data,
    });

    try {
      const serializedData = JSON.stringify(data);
      const inputBuffer = Buffer.from(serializedData);

      await ServerLogger.debug('Created input buffer', {
        bufferLength: inputBuffer.length,
      });

      const COMPRESSION_THRESHOLD = 100; // bytes

      if (inputBuffer.length < COMPRESSION_THRESHOLD) {
        return { data, compressed: false };
      }

      const startTime = process.hrtime();
      const compressionLevel = -1;
      const compressedData = await gzipAsync(inputBuffer, { level: compressionLevel });
      const endTime = process.hrtime(startTime);
      const compressionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      const compressionRatio = (compressedData.length / inputBuffer.length) * 100;

      await ServerLogger.info('Compression successful', {
        inputLength: inputBuffer.length,
        compressedLength: compressedData.length,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
        compressionTime: `${compressionTime.toFixed(2)}ms`,
      });

      return { data: compressedData as unknown as T, compressed: true };
    } catch (error) {
      await ServerLogger.error('Compression failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { data, compressed: false };
    }
  },

  async decompressData<T>(compressedData: T): Promise<T> {
    await ServerLogger.info('Starting data decompression', {
      compressedDataType: typeof compressedData,
    });

    try {
      const buffer = Buffer.isBuffer(compressedData)
        ? compressedData
        : Buffer.from(JSON.stringify(compressedData));

      const startTime = process.hrtime();
      const decompressedData = await gunzipAsync(buffer);
      const endTime = process.hrtime(startTime);
      const decompressionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      const decompressedString = decompressedData.toString('utf-8');
      const result = JSON.parse(decompressedString) as T;

      await ServerLogger.info('Decompression successful', {
        compressedLength: buffer.length,
        decompressedLength: decompressedData.length,
        decompressedStringLength: decompressedString.length,
        decompressionTime: `${decompressionTime.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      await ServerLogger.error('Decompression failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
};

// Initialize ServerLogger
ServerLogger.initializeLogger(ServerCompressionModule.globalConfig);

// Add an unhandled rejection handler
process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
  await ServerLogger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export default ServerCompressionModule;
