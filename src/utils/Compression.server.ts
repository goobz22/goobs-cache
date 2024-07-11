'use server';

import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Compresses the provided data using gzip compression.
 *
 * @param data The data to be compressed, as a string.
 * @returns A Promise that resolves to the compressed data as a Buffer.
 * @throws An error if the compression fails.
 */
export async function compressData(data: string): Promise<Buffer> {
  try {
    const inputBuffer = Buffer.from(data);
    const compressedData = await gzipAsync(inputBuffer);
    return compressedData;
  } catch (error) {
    console.error('Compression error:', error);
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
export async function decompressData(compressedData: Buffer): Promise<string> {
  try {
    const decompressedData = await gunzipAsync(compressedData);
    return decompressedData.toString('utf-8');
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}
