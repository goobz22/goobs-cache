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
    throw error;
  }
}

/**
 * Decompresses the provided compressed data using gzip decompression.
 *
 * @param compressedData The compressed data to be decompressed, as a Buffer, Uint8Array, or a Buffer-like object.
 * @returns A Promise that resolves to the decompressed data as a string.
 * @throws An error if the decompression fails.
 */
export async function decompressData(compressedData: any): Promise<string> {
  let inputData: Buffer;

  // Convert the input data to a Buffer based on its type
  if (typeof compressedData === 'string') {
    inputData = Buffer.from(compressedData, 'base64');
  } else if (compressedData instanceof Uint8Array) {
    inputData = Buffer.from(compressedData);
  } else if (
    compressedData &&
    typeof compressedData === 'object' &&
    'type' in compressedData &&
    compressedData.type === 'Buffer' &&
    Array.isArray(compressedData.data)
  ) {
    inputData = Buffer.from(compressedData.data);
  } else if (Buffer.isBuffer(compressedData)) {
    inputData = compressedData;
  } else {
    return String(compressedData);
  }

  // Check if the input data has the correct gzip header
  if (inputData[0] !== 0x1f || inputData[1] !== 0x8b) {
    try {
      const stringResult = inputData.toString('utf-8');
      return stringResult;
    } catch (stringifyError) {
      return JSON.stringify(compressedData);
    }
  }

  try {
    const decompressedData = await gunzipAsync(inputData);
    const result = decompressedData.toString('utf-8');
    return result;
  } catch (error) {
    try {
      const stringResult = inputData.toString('utf-8');
      return stringResult;
    } catch (stringifyError) {
      return JSON.stringify(compressedData);
    }
  }
}
