import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-decompress-compression-levels.log');
const log = createLogger(logStream);

describe('Compression and Decompression Server Utilities', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = 'a'.repeat(10000) + 'b'.repeat(10000) + 'c'.repeat(10000);

  it('should compress and decompress data correctly', async () => {
    log('Testing compression and decompression');

    log('Compressing data');
    const compressed = await compressData(testData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(testData);
    log('Compression and decompression successful');
  });

  it('should handle empty string', async () => {
    log('Testing compression and decompression with empty string');

    const emptyString = '';

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(emptyString);
    log('Empty string compression and decompression successful');
  });

  it('should handle large data', async () => {
    log('Testing compression and decompression with large data');

    const largeData = 'a'.repeat(1000000);

    log('Compressing large data');
    const compressed = await compressData(largeData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(largeData);
    log('Large data compression and decompression successful');
  });

  it('should achieve some level of compression', async () => {
    log('Testing compression ratio');

    const compressed = await compressData(testData);
    const compressionRatio = compressed.length / testData.length;

    log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
    expect(compressionRatio).toBeLessThan(1);
    log('Compression ratio test successful');
  });
});
