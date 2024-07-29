'use client';
import { compress, decompress } from 'lz4js';

export const CompressionModule = {
  compressData(data: Uint8Array | string): Uint8Array {
    let inputData: Uint8Array;
    if (typeof data === 'string') {
      inputData = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      inputData = data;
    } else {
      throw new Error('Input must be a Uint8Array or string');
    }
    if (inputData.length === 0) {
      return new Uint8Array(0);
    }
    try {
      const compressedData = compress(inputData);
      if (compressedData.length === 0) {
        throw new Error('Compression resulted in empty data');
      }
      return compressedData;
    } catch (error) {
      throw new Error(
        'Compression failed: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  },

  decompressData(
    compressedData: Uint8Array,
    outputFormat: 'uint8array' | 'string' = 'uint8array',
  ): Uint8Array | string {
    if (!(compressedData instanceof Uint8Array)) {
      throw new Error('Input must be a Uint8Array');
    }
    if (compressedData.length === 0) {
      return outputFormat === 'string' ? '' : new Uint8Array(0);
    }
    try {
      const decompressedData = decompress(compressedData);
      if (decompressedData.length === 0) {
        throw new Error('Decompression resulted in empty data');
      }
      if (outputFormat === 'string') {
        return new TextDecoder().decode(decompressedData);
      }
      return decompressedData;
    } catch (error) {
      throw new Error(
        'Decompression failed: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  },
};

export const { compressData, decompressData } = CompressionModule;
