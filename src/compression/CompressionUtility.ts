'use server';
import { createGunzip, createGzip, ZlibOptions } from 'zlib';
import { pipeline, Readable } from 'stream';
import { promisify } from 'util';
import getConfig from '../config/config';

const pipelineAsync = promisify(pipeline);

/**
 * compressDataImpl function compresses the provided data using gzip compression
 * with the specified compression level.
 * @param data The data to compress.
 * @param compressionLevel The compression level to use (0-9).
 * @returns A Promise that resolves to the compressed data as a Buffer.
 */
async function compressDataImpl(data: string, compressionLevel: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gzip = createGzip({ level: compressionLevel } as ZlibOptions);
    const buffer = Buffer.from(data);
    const chunks: Buffer[] = [];

    pipelineAsync(Readable.from(buffer), gzip)
      .then(() => {
        gzip.on('data', (chunk) => chunks.push(chunk));
        gzip.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .catch(reject);
  });
}

/**
 * decompressDataImpl function decompresses the provided compressed data using gunzip.
 * @param compressedData The compressed data to decompress.
 * @returns A Promise that resolves to the decompressed data as a string.
 */
async function decompressDataImpl(compressedData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Buffer[] = [];

    pipelineAsync(Readable.from(compressedData), gunzip)
      .then(() => {
        gunzip.on('data', (chunk) => chunks.push(chunk));
        gunzip.on('end', () => resolve(Buffer.concat(chunks).toString()));
      })
      .catch(reject);
  });
}

/**
 * compressData function compresses the provided data using gzip compression.
 * It retrieves the compression level from the configuration using the 'config' module.
 * @param data The data to compress.
 * @returns A Promise that resolves to the compressed data as a Buffer.
 */
export async function compressData(data: string): Promise<Buffer> {
  const config = await getConfig();
  return compressDataImpl(data, config.compressionLevel);
}

/**
 * decompressData function decompresses the provided compressed data using gunzip.
 * @param compressedData The compressed data to decompress.
 * @returns A Promise that resolves to the decompressed data as a string.
 */
export async function decompressData(compressedData: Buffer): Promise<string> {
  return decompressDataImpl(compressedData);
}
