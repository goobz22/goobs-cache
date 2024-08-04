'use server';
import { createLogger, format, transports } from 'winston';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { CompressionConfig, GlobalConfig } from '../types';

let logger: ReturnType<typeof createLogger>;

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class ServerCompressionModule {
  private config: CompressionConfig;
  private globalConfig: GlobalConfig;

  constructor(config: CompressionConfig, globalConfig: GlobalConfig) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.initializeLogger();
    logger.info('ServerCompressionModule initialized', {
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
      defaultMeta: { service: 'server-compression-module' },
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
        new transports.File({ filename: 'server-compression-error.log', level: 'error' }),
        new transports.File({ filename: 'server-compression-combined.log', level: 'debug' }),
      ],
    });
  }

  /**
   * Compresses the provided data using gzip compression.
   *
   * @param data The data to be compressed, as a string.
   * @returns A Promise that resolves to the compressed data as a Buffer.
   * @throws An error if the compression fails.
   */
  async compressData(data: string): Promise<Buffer> {
    logger.info('Starting data compression', {
      dataLength: data.length,
      compressionLevel: this.config.compressionLevel,
    });

    try {
      const inputBuffer = Buffer.from(data);
      logger.debug('Created input buffer', {
        bufferLength: inputBuffer.length,
      });

      const startTime = process.hrtime();
      const compressionLevel =
        typeof this.config.compressionLevel === 'number'
          ? this.config.compressionLevel
          : this.config.compressionLevel.level;
      const compressedData = await gzipAsync(inputBuffer, { level: compressionLevel });
      const endTime = process.hrtime(startTime);
      const compressionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      const compressionRatio = (compressedData.length / inputBuffer.length) * 100;
      logger.info('Compression successful', {
        inputLength: inputBuffer.length,
        compressedLength: compressedData.length,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
        compressionTime: `${compressionTime.toFixed(2)}ms`,
      });

      return compressedData;
    } catch (error) {
      logger.error('Compression failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Decompresses the provided compressed data using gzip decompression.
   *
   * @param compressedData The compressed data to be decompressed, as a Buffer.
   * @returns A Promise that resolves to the decompressed data as a string.
   * @throws An error if the decompression fails.
   */
  async decompressData(compressedData: Buffer): Promise<string> {
    logger.info('Starting data decompression', {
      compressedLength: compressedData.length,
    });

    try {
      const startTime = process.hrtime();
      const decompressedData = await gunzipAsync(compressedData);
      const endTime = process.hrtime(startTime);
      const decompressionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      const decompressedString = decompressedData.toString('utf-8');
      logger.info('Decompression successful', {
        compressedLength: compressedData.length,
        decompressedLength: decompressedData.length,
        decompressedStringLength: decompressedString.length,
        decompressionTime: `${decompressionTime.toFixed(2)}ms`,
      });

      return decompressedString;
    } catch (error) {
      logger.error('Decompression failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  updateConfig(newConfig: CompressionConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating ServerCompressionModule configuration', {
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

export function createServerCompressionModule(
  config: CompressionConfig,
  globalConfig: GlobalConfig,
): ServerCompressionModule {
  return new ServerCompressionModule(config, globalConfig);
}

export function initializeServerCompressionLogger(globalConfig: GlobalConfig): void {
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
    defaultMeta: { service: 'server-compression-module' },
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
      new transports.File({ filename: 'server-compression-error.log', level: 'error' }),
      new transports.File({ filename: 'server-compression-combined.log', level: 'debug' }),
    ],
  });

  logger.info('Server-side Compression module initialized', {
    nodeEnvironment: process.env.NODE_ENV,
  });
}

// Add an unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export { logger as serverCompressionLogger };
