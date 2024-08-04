'use server';

import { promisify } from 'util';
import {
  randomBytes,
  scrypt,
  createCipheriv,
  createDecipheriv,
  CipherGCM,
  CipherCCM,
  DecipherGCM,
  DecipherCCM,
} from 'crypto';
import { EncryptionConfig, EncryptedValue, GlobalConfig } from '../types';
import { createLogger, format, transports } from 'winston';

let logger: ReturnType<typeof createLogger>;

const randomBytesAsync = promisify(randomBytes);
const scryptAsync = promisify(scrypt);

const SUPPORTED_ALGORITHMS = ['aes-256-gcm', 'aes-256-ccm'];

export class ServerEncryptionModule {
  private config: EncryptionConfig;
  private globalConfig: GlobalConfig;

  constructor(config: EncryptionConfig, globalConfig: GlobalConfig) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.initializeLogger();
    logger.info('ServerEncryptionModule initialized', {
      config: { ...config, encryptionPassword: '[REDACTED]' },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
      supportedAlgorithms: SUPPORTED_ALGORITHMS,
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
      defaultMeta: { service: 'server-encryption-service' },
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
        new transports.File({ filename: 'server-encryption-error.log', level: 'error' }),
        new transports.File({ filename: 'server-encryption-combined.log', level: 'debug' }),
      ],
    });
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<Buffer> {
    logger.debug('Deriving encryption key', {
      passwordLength: password.length,
      saltLength: salt.length,
    });

    const startTime = process.hrtime();

    try {
      const key = (await scryptAsync(password, salt, 32)) as Buffer;

      const endTime = process.hrtime(startTime);
      const derivationTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      logger.debug('Encryption key derived successfully', {
        derivationTime: `${derivationTime.toFixed(2)}ms`,
        keyLength: key.length,
      });

      return key;
    } catch (error) {
      logger.error('Error deriving encryption key', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async encrypt(value: Uint8Array): Promise<EncryptedValue> {
    logger.info('Starting encryption process', {
      valueLength: value.length,
      algorithm: this.config.algorithm,
    });

    const startTime = process.hrtime();

    if (!SUPPORTED_ALGORITHMS.includes(this.config.algorithm)) {
      const error = new Error(
        `Unsupported encryption algorithm: ${this.config.algorithm}. Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(', ')}`,
      );
      logger.error('Unsupported encryption algorithm', { error: error.message });
      throw error;
    }

    try {
      const iv = new Uint8Array(await randomBytesAsync(16));
      const salt = new Uint8Array(await randomBytesAsync(16));
      const key = new Uint8Array(await this.deriveKey(this.config.encryptionPassword, salt));

      let cipher: CipherGCM | CipherCCM;
      if (this.config.algorithm === 'aes-256-ccm') {
        cipher = createCipheriv(this.config.algorithm, key, iv) as CipherCCM;
      } else {
        cipher = createCipheriv(this.config.algorithm, key, iv) as CipherGCM;
      }

      logger.debug('Cipher created', { algorithm: this.config.algorithm });

      const encryptedParts: Uint8Array[] = [];
      encryptedParts.push(new Uint8Array(cipher.update(value)));
      encryptedParts.push(new Uint8Array(cipher.final()));

      const encryptedData = new Uint8Array(
        encryptedParts.reduce((acc, curr) => acc + curr.length, 0),
      );
      let offset = 0;
      for (const part of encryptedParts) {
        encryptedData.set(part, offset);
        offset += part.length;
      }

      const authTag =
        'getAuthTag' in cipher ? new Uint8Array(cipher.getAuthTag()) : new Uint8Array(0);

      const endTime = process.hrtime(startTime);
      const encryptionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      logger.info('Encryption process completed successfully', {
        encryptionTime: `${encryptionTime.toFixed(2)}ms`,
        inputLength: value.length,
        encryptedLength: encryptedData.length,
        ivLength: iv.length,
        saltLength: salt.length,
        authTagLength: authTag.length,
        keyLength: key.length,
      });

      return {
        type: 'encrypted',
        encryptedData,
        iv,
        salt,
        authTag,
        encryptionKey: key,
      };
    } catch (error) {
      logger.error('Error during encryption process', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async decrypt(encryptedValue: EncryptedValue): Promise<Uint8Array> {
    logger.info('Starting decryption process', {
      encryptedDataLength: encryptedValue.encryptedData.length,
      algorithm: this.config.algorithm,
      ivLength: encryptedValue.iv.length,
      saltLength: encryptedValue.salt.length,
      authTagLength: encryptedValue.authTag.length,
    });

    const startTime = process.hrtime();

    if (!SUPPORTED_ALGORITHMS.includes(this.config.algorithm)) {
      const error = new Error(
        `Unsupported decryption algorithm: ${this.config.algorithm}. Supported algorithms are: ${SUPPORTED_ALGORITHMS.join(', ')}`,
      );
      logger.error('Unsupported decryption algorithm', { error: error.message });
      throw error;
    }

    try {
      const { encryptedData, iv, salt, authTag } = encryptedValue;
      const key = new Uint8Array(await this.deriveKey(this.config.encryptionPassword, salt));

      logger.debug('Decryption key derived', { keyLength: key.length });

      let decipher: DecipherGCM | DecipherCCM;
      if (this.config.algorithm === 'aes-256-gcm') {
        decipher = createDecipheriv(this.config.algorithm, key, iv) as DecipherGCM;
        decipher.setAuthTag(authTag);
      } else {
        decipher = createDecipheriv(this.config.algorithm, key, iv) as DecipherCCM;
        (decipher as DecipherCCM).setAuthTag(authTag);
      }

      logger.debug('Decipher created', { algorithm: this.config.algorithm });

      const decryptedParts: Uint8Array[] = [];
      decryptedParts.push(new Uint8Array(decipher.update(encryptedData)));
      decryptedParts.push(new Uint8Array(decipher.final()));

      logger.debug('Decryption completed', {
        decryptedPartsCount: decryptedParts.length,
      });

      const decryptedData = new Uint8Array(
        decryptedParts.reduce((acc, curr) => acc + curr.length, 0),
      );
      let offset = 0;
      for (const part of decryptedParts) {
        decryptedData.set(part, offset);
        offset += part.length;
      }

      const endTime = process.hrtime(startTime);
      const decryptionTime = (endTime[0] * 1e9 + endTime[1]) / 1e6;

      logger.info('Decryption process completed successfully', {
        decryptionTime: `${decryptionTime.toFixed(2)}ms`,
        encryptedLength: encryptedData.length,
        decryptedLength: decryptedData.length,
        ivLength: iv.length,
        saltLength: salt.length,
        authTagLength: authTag.length,
        keyLength: key.length,
      });

      return decryptedData;
    } catch (error) {
      logger.error('Error during decryption process', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  updateConfig(newConfig: EncryptionConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating ServerEncryptionModule configuration', {
      oldConfig: { ...this.config, encryptionPassword: '[REDACTED]' },
      newConfig: { ...newConfig, encryptionPassword: '[REDACTED]' },
      oldGlobalConfig: { ...this.globalConfig, encryptionPassword: '[REDACTED]' },
      newGlobalConfig: { ...newGlobalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.config = newConfig;
    this.globalConfig = newGlobalConfig;
    this.initializeLogger();
  }
}

export function createServerEncryptionModule(
  config: EncryptionConfig,
  globalConfig: GlobalConfig,
): ServerEncryptionModule {
  return new ServerEncryptionModule(config, globalConfig);
}

export function initializeServerEncryptionLogger(globalConfig: GlobalConfig): void {
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
    defaultMeta: { service: 'server-encryption-service' },
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
      new transports.File({ filename: 'server-encryption-error.log', level: 'error' }),
      new transports.File({ filename: 'server-encryption-combined.log', level: 'debug' }),
    ],
  });

  logger.info('Server Encryption module initialized', {
    supportedAlgorithms: SUPPORTED_ALGORITHMS,
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

export { logger as serverEncryptionLogger };
