'use client';
import { compress, decompress } from 'lz4js';
import { GlobalConfig } from '../types';

export const ClientCompressionModule = {
  globalConfig: {
    keySize: 256,
    batchSize: 100,
    autoTuneInterval: 3600000,
    loggingEnabled: true,
    logLevel: 'debug',
    logDirectory: 'logs',
  } as GlobalConfig,

  compressData<T>(data: T): { data: T; compressed: boolean } | null {
    if (data === null || data === undefined) {
      return null;
    }

    const serializedData = JSON.stringify(data);
    const COMPRESSION_THRESHOLD = 100; // characters

    if (serializedData.length < COMPRESSION_THRESHOLD) {
      return { data, compressed: false };
    }

    try {
      const compressedData = compress(new TextEncoder().encode(serializedData));

      if (compressedData.length >= serializedData.length) {
        return { data, compressed: false };
      }

      return { data: compressedData as unknown as T, compressed: true };
    } catch {
      return { data, compressed: false };
    }
  },

  decompressData<T>(compressedData: T): T | null {
    if (compressedData === null || compressedData === undefined) {
      return null;
    }

    try {
      const decompressedData = decompress(compressedData as unknown as Uint8Array);
      return JSON.parse(new TextDecoder().decode(decompressedData)) as T;
    } catch {
      return null;
    }
  },
};

export default ClientCompressionModule;
