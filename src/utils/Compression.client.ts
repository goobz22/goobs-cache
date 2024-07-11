'use client';

import { compress, decompress } from 'lz4js';

/**
 * Compresses the provided data using LZ4 compression.
 *
 * @param data The data to be compressed, as a string.
 * @returns The compressed data as a Uint8Array.
 */
export function compressData(data: string): Uint8Array {
  const inputBuffer = new TextEncoder().encode(data);
  return compress(inputBuffer);
}

/**
 * Decompresses the provided compressed data using LZ4 decompression.
 *
 * @param compressedData The compressed data to be decompressed, as a Uint8Array.
 * @returns The decompressed data as a string.
 */
export function decompressData(compressedData: Uint8Array): string {
  const decompressedData = decompress(compressedData);
  return new TextDecoder().decode(decompressedData);
}
