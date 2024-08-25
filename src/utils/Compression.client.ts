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

  compressData(data: Uint8Array | string): { data: Uint8Array; compressed: boolean } | null {
    let inputData: Uint8Array;
    if (typeof data === 'string') {
      inputData = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      inputData = data;
    } else {
      return null;
    }

    if (inputData.length === 0) {
      return null;
    }

    const COMPRESSION_THRESHOLD = 100; // bytes

    if (inputData.length < COMPRESSION_THRESHOLD) {
      return { data: inputData, compressed: false };
    }

    try {
      const compressedData = compress(inputData);

      if (
        !compressedData ||
        compressedData.length === 0 ||
        compressedData.length >= inputData.length
      ) {
        return { data: inputData, compressed: false };
      }

      return { data: compressedData, compressed: true };
    } catch {
      return { data: inputData, compressed: false };
    }
  },

  decompressData(
    compressedData: Uint8Array,
    outputFormat: 'uint8array' | 'string' = 'uint8array',
  ): Uint8Array | string | null {
    if (!(compressedData instanceof Uint8Array)) {
      return null;
    }

    if (compressedData.length === 0) {
      return null;
    }

    try {
      let decompressedData: Uint8Array;
      try {
        decompressedData = decompress(compressedData);
      } catch {
        return null;
      }

      if (!decompressedData || decompressedData.length === 0) {
        return null;
      }

      if (outputFormat === 'string') {
        return new TextDecoder().decode(decompressedData);
      }

      return decompressedData;
    } catch {
      return null;
    }
  },
};

export default ClientCompressionModule;
