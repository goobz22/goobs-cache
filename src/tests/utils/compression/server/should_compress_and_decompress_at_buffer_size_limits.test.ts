import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-decompress-buffer-size-limits.log');
const log = createLogger(logStream);

describe('Compression and Decompression at Buffer Size Limits', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress data at maximum buffer size', async () => {
    const maxSize = 1024 * 1024 * 1024; // 1GB, adjust based on your system's limits
    const largeData = 'a'.repeat(maxSize);

    log('Starting compression of large data');
    const compressed = await compressData(largeData);
    log(`Compressed data size: ${compressed.length} bytes`);

    log('Starting decompression of large data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed data size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(largeData);
    log('Compression and decompression at maximum buffer size successful');
  });

  it('should handle compression of empty string', async () => {
    const emptyString = '';

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Compressed empty string size: ${compressed.length} bytes`);

    log('Decompressing empty string data');
    const decompressed = await decompressData(compressed);

    expect(decompressed).toEqual(emptyString);
    log('Empty string compression and decompression successful');
  });

  it('should handle decompression of empty buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);

    log('Attempting to decompress empty buffer');
    await expect(decompressData(emptyBuffer)).rejects.toThrow();
    log('Empty buffer decompression threw expected error');
  });

  it('should compress and decompress data near buffer size limit', async () => {
    const nearMaxSize = 1024 * 1024 * 1024 - 1024; // 1GB minus 1KB
    const largeData = 'a'.repeat(nearMaxSize);

    log('Starting compression of near-max size data');
    const compressed = await compressData(largeData);
    log(`Compressed near-max data size: ${compressed.length} bytes`);

    log('Starting decompression of near-max size data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed near-max data size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(largeData);
    log('Compression and decompression near maximum buffer size successful');
  });
});
