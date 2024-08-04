'use client';
import { createLogger, format, transports } from 'winston';
import { compress, decompress } from 'lz4js';
import { CompressionConfig, GlobalConfig } from '../types';

let logger: ReturnType<typeof createLogger>;

export class CompressionModule {
  private config: CompressionConfig;
  private globalConfig: GlobalConfig;

  constructor(config: CompressionConfig, globalConfig: GlobalConfig) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.initializeLogger();
    logger.info('CompressionModule initialized', {
      config: { ...config },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
    });
  }

  private initializeLogger(): void {
    logger = createLogger({
      level: this.globalConfig.logLevel,
      silent: !this.globalConfig.loggingEnabled,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      ),
      defaultMeta: { service: 'compression-module' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += '\n\t' + JSON.stringify(metadata);
              }
              return msg;
            }),
          ),
        }),
        new transports.File({ filename: 'compression-error.log', level: 'error' }),
        new transports.File({ filename: 'compression-combined.log', level: 'debug' }),
      ],
    });
  }

  compressData(data: Uint8Array | string): Uint8Array {
    let inputData: Uint8Array;
    if (typeof data === 'string') {
      logger.debug('Input data is a string, encoding to Uint8Array', {
        dataType: 'string',
        dataLength: data.length,
      });
      inputData = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      logger.debug('Input data is a Uint8Array', {
        dataType: 'Uint8Array',
        dataLength: data.length,
      });
      inputData = data;
    } else {
      const errorMessage = 'Input must be a Uint8Array or string';
      logger.error(errorMessage, { inputType: typeof data });
      throw new Error(errorMessage);
    }

    if (inputData.length === 0) {
      logger.warn('Input data is empty, returning empty Uint8Array');
      return new Uint8Array(0);
    }

    try {
      logger.info('Compressing data', {
        inputLength: inputData.length,
        compressionLevel: this.config.compressionLevel,
      });

      const startTime = performance.now();
      const compressionLevel =
        typeof this.config.compressionLevel === 'number'
          ? this.config.compressionLevel
          : this.config.compressionLevel.level;
      const compressedData = compress(inputData, compressionLevel);
      const endTime = performance.now();
      const compressionTime = endTime - startTime;

      if (compressedData.length === 0) {
        const errorMessage = 'Compression resulted in empty data';
        logger.error(errorMessage, { inputLength: inputData.length });
        throw new Error(errorMessage);
      }

      const compressionRatio = (compressedData.length / inputData.length) * 100;
      logger.info('Compression successful', {
        inputLength: inputData.length,
        compressedLength: compressedData.length,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
        compressionTime: `${compressionTime.toFixed(2)}ms`,
      });

      return compressedData;
    } catch (error) {
      const errorMessage =
        'Compression failed: ' + (error instanceof Error ? error.message : String(error));
      logger.error(errorMessage, {
        error,
        inputLength: inputData.length,
      });
      throw new Error(errorMessage);
    }
  }

  decompressData(
    compressedData: Uint8Array,
    outputFormat: 'uint8array' | 'string' = 'uint8array',
  ): Uint8Array | string {
    if (!(compressedData instanceof Uint8Array)) {
      const errorMessage = 'Input must be a Uint8Array';
      logger.error(errorMessage, { inputType: typeof compressedData });
      throw new Error(errorMessage);
    }

    if (compressedData.length === 0) {
      logger.warn('Compressed data is empty, returning empty result', { outputFormat });
      return outputFormat === 'string' ? '' : new Uint8Array(0);
    }

    try {
      logger.info('Decompressing data', {
        compressedLength: compressedData.length,
        outputFormat,
      });

      const startTime = performance.now();
      const decompressedData = decompress(compressedData);
      const endTime = performance.now();
      const decompressionTime = endTime - startTime;

      if (decompressedData.length === 0) {
        const errorMessage = 'Decompression resulted in empty data';
        logger.error(errorMessage, { compressedLength: compressedData.length });
        throw new Error(errorMessage);
      }

      if (outputFormat === 'string') {
        logger.debug('Converting decompressed data to string', {
          decompressedLength: decompressedData.length,
        });
        const result = new TextDecoder().decode(decompressedData);
        logger.info('Decompression successful', {
          compressedLength: compressedData.length,
          decompressedLength: decompressedData.length,
          outputLength: result.length,
          outputFormat: 'string',
          decompressionTime: `${decompressionTime.toFixed(2)}ms`,
        });

        return result;
      }

      logger.info('Decompression successful', {
        compressedLength: compressedData.length,
        decompressedLength: decompressedData.length,
        outputFormat: 'uint8array',
        decompressionTime: `${decompressionTime.toFixed(2)}ms`,
      });

      return decompressedData;
    } catch (error) {
      const errorMessage =
        'Decompression failed: ' + (error instanceof Error ? error.message : String(error));
      logger.error(errorMessage, {
        error,
        compressedLength: compressedData.length,
      });
      throw new Error(errorMessage);
    }
  }

  updateConfig(newConfig: CompressionConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating CompressionModule configuration', {
      oldConfig: { ...this.config },
      newConfig: { ...newConfig },
      oldGlobalConfig: { ...this.globalConfig, encryptionPassword: '[REDACTED]' },
      newGlobalConfig: { ...newGlobalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.config = newConfig;
    this.globalConfig = newGlobalConfig;
    this.initializeLogger();
  }
}

export function createCompressionModule(
  config: CompressionConfig,
  globalConfig: GlobalConfig,
): CompressionModule {
  return new CompressionModule(config, globalConfig);
}

export function initializeCompressionLogger(globalConfig: GlobalConfig): void {
  logger = createLogger({
    level: globalConfig.logLevel,
    silent: !globalConfig.loggingEnabled,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
      format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    ),
    defaultMeta: { service: 'compression-module' },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ level, message, timestamp, metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
              msg += '\n\t' + JSON.stringify(metadata);
            }
            return msg;
          }),
        ),
      }),
      new transports.File({ filename: 'compression-error.log', level: 'error' }),
      new transports.File({ filename: 'compression-combined.log', level: 'debug' }),
    ],
  });
}

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export { logger as compressionLogger };
