'use client';

import { compress, decompress } from 'lz4js';
import { GlobalConfig } from '../types';
import { ClientLogger } from 'goobs-testing';

export const ClientCompressionModule = {
  globalConfig: {
    keySize: 256,
    batchSize: 100,
    autoTuneInterval: 3600000,
    loggingEnabled: true,
    logLevel: 'debug',
    logDirectory: 'logs',
  } as GlobalConfig,

  compressData(data: Uint8Array | string): { data: Uint8Array; compressed: boolean } | null {
    ClientLogger.debug('compressData called', {
      inputType: typeof data,
      inputLength: typeof data === 'string' ? data.length : data.byteLength,
    });

    let inputData: Uint8Array;
    if (typeof data === 'string') {
      inputData = new TextEncoder().encode(data);
      ClientLogger.debug('String encoded to Uint8Array', {
        originalLength: data.length,
        encodedLength: inputData.length,
      });
    } else if (data instanceof Uint8Array) {
      inputData = data;
    } else {
      ClientLogger.error('Invalid input type', { inputType: typeof data });
      return null;
    }

    if (inputData.length === 0) {
      ClientLogger.warn('Input data is empty, returning null');
      return null;
    }

    // Define a threshold below which we won't attempt compression
    const COMPRESSION_THRESHOLD = 100; // bytes

    if (inputData.length < COMPRESSION_THRESHOLD) {
      ClientLogger.debug('Input data below compression threshold, returning uncompressed', {
        inputLength: inputData.length,
        threshold: COMPRESSION_THRESHOLD,
      });
      return { data: inputData, compressed: false };
    }

    try {
      ClientLogger.info('Attempting compression', { inputLength: inputData.length });
      const compressedData = compress(inputData);

      if (
        !compressedData ||
        compressedData.length === 0 ||
        compressedData.length >= inputData.length
      ) {
        ClientLogger.warn('Compression ineffective, returning original data', {
          inputLength: inputData.length,
          compressedLength: compressedData ? compressedData.length : 0,
        });
        return { data: inputData, compressed: false };
      }

      ClientLogger.info('Compression successful', {
        inputLength: inputData.length,
        compressedLength: compressedData.length,
        compressionRatio: `${((compressedData.length / inputData.length) * 100).toFixed(2)}%`,
      });

      return { data: compressedData, compressed: true };
    } catch (error) {
      ClientLogger.warn('Compression failed, returning original data', {
        error: error instanceof Error ? error.message : String(error),
        inputLength: inputData.length,
      });
      return { data: inputData, compressed: false };
    }
  },

  decompressData(
    compressedData: Uint8Array,
    outputFormat: 'uint8array' | 'string' = 'uint8array',
  ): Uint8Array | string | null {
    ClientLogger.debug('decompressData called', {
      inputType: typeof compressedData,
      inputLength: compressedData.length,
      outputFormat,
      inputSample: Array.from(compressedData.slice(0, 20)).join(','),
    });

    if (!(compressedData instanceof Uint8Array)) {
      const errorMessage = 'Input must be a Uint8Array';
      ClientLogger.error(errorMessage, {
        inputType: typeof compressedData,
      });
      return null;
    }

    if (compressedData.length === 0) {
      ClientLogger.warn('Compressed data is empty, returning null');
      return null;
    }

    try {
      ClientLogger.info('Starting decompression', {
        compressedLength: compressedData.length,
        outputFormat,
        compressedDataSample: Array.from(compressedData.slice(0, 20)).join(','),
      });

      const startTime = performance.now();

      let decompressedData: Uint8Array;
      try {
        ClientLogger.debug('Calling lz4js decompress function', {
          inputLength: compressedData.length,
          inputSample: Array.from(compressedData.slice(0, 20)).join(','),
        });
        decompressedData = decompress(compressedData);
        ClientLogger.debug('Decompression function called successfully', {
          decompressedLength: decompressedData.length,
          decompressedSample: Array.from(decompressedData.slice(0, 20)).join(','),
        });
      } catch (decompressError) {
        ClientLogger.error('Error during lz4js decompress function', {
          error:
            decompressError instanceof Error ? decompressError.message : String(decompressError),
          stack: decompressError instanceof Error ? decompressError.stack : undefined,
          compressedLength: compressedData.length,
          compressedSample: Array.from(compressedData.slice(0, 50)).join(','),
        });
        return null;
      }

      const endTime = performance.now();
      const decompressionTime = endTime - startTime;

      if (!decompressedData || decompressedData.length === 0) {
        const errorMessage = 'Decompression resulted in empty data';
        ClientLogger.error(errorMessage, {
          compressedLength: compressedData.length,
          decompressedDataType: typeof decompressedData,
          decompressedDataLength: decompressedData ? decompressedData.length : 'undefined',
          compressedSample: Array.from(compressedData.slice(0, 50)).join(','),
        });
        return null;
      }

      if (outputFormat === 'string') {
        ClientLogger.debug('Converting decompressed data to string', {
          decompressedLength: decompressedData.length,
          decompressedSample: Array.from(decompressedData.slice(0, 20)).join(','),
        });
        const result = new TextDecoder().decode(decompressedData);
        ClientLogger.info('Decompression successful', {
          compressedLength: compressedData.length,
          decompressedLength: decompressedData.length,
          outputLength: result.length,
          outputFormat: 'string',
          decompressionTime: `${decompressionTime.toFixed(2)}ms`,
          resultSample: result.slice(0, 50),
        });

        return result;
      }

      ClientLogger.info('Decompression successful', {
        compressedLength: compressedData.length,
        decompressedLength: decompressedData.length,
        outputFormat: 'uint8array',
        decompressionTime: `${decompressionTime.toFixed(2)}ms`,
        decompressedDataSample: Array.from(decompressedData.slice(0, 20)).join(','),
      });

      return decompressedData;
    } catch (error) {
      const errorMessage =
        'Decompression failed: ' + (error instanceof Error ? error.message : String(error));
      ClientLogger.error(errorMessage, {
        error,
        compressedLength: compressedData.length,
        compressedDataSample: Array.from(compressedData.slice(0, 50)).join(','),
      });
      return null;
    }
  },
};

// Initialize ClientLogger
ClientLogger.initializeLogger(ClientCompressionModule.globalConfig);

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default ClientCompressionModule;
