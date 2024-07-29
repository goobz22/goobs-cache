import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-very-small-compressed-buffer.log');
const log = createLogger(logStream);

describe('Decompression of Very Small Compressed Buffer', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress an empty string', async () => {
    const originalData = '';
    log('Testing decompression of an empty string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of empty string successful');
  });

  it('should handle decompression of a single character', async () => {
    const originalData = 'a';
    log('Testing decompression of a single character');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of single character successful');
  });

  it('should decompress a short string', async () => {
    const originalData = 'Hello';
    log('Testing decompression of a short string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of short string successful');
  });

  it('should handle decompression of a string with repeated characters', async () => {
    const originalData = 'aaaaaa';
    log('Testing decompression of a string with repeated characters');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with repeated characters successful');
  });

  it('should decompress a string with special characters', async () => {
    const originalData = '!@#$%';
    log('Testing decompression of a string with special characters');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with special characters successful');
  });

  it('should handle decompression of a short unicode string', async () => {
    const originalData = '你好';
    log('Testing decompression of a short unicode string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of short unicode string successful');
  });

  it('should decompress a short JSON string', async () => {
    const originalData = '{"a":1}';
    log('Testing decompression of a short JSON string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of short JSON string successful');
  });

  it('should handle decompression of a string with whitespace', async () => {
    const originalData = '  \t\n  ';
    log('Testing decompression of a string with whitespace');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with whitespace successful');
  });

  it('should decompress a short binary string', async () => {
    const originalData = Buffer.from([0, 1, 2, 3, 4]).toString('binary');
    log('Testing decompression of a short binary string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of short binary string successful');
  });

  it('should handle decompression of a string just below the block size', async () => {
    // Assuming a typical block size of 16KB for gzip
    const originalData = 'a'.repeat(16383);
    log('Testing decompression of a string just below the block size');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string just below the block size successful');
  });
});
