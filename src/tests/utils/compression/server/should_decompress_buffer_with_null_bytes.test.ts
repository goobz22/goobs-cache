import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-buffer-with-null-bytes.log');
const log = createLogger(logStream);

describe('Decompression of Buffer with Null Bytes', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a buffer with null bytes interspersed', async () => {
    const originalString = 'Hello\0World\0Test';
    log('Testing decompression of buffer with null bytes interspersed');

    log('Compressing string with null bytes');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null bytes interspersed successful');
  });

  it('should handle decompression of a buffer with only null bytes', async () => {
    const originalString = '\0\0\0\0\0';
    log('Testing decompression of buffer with only null bytes');

    log('Compressing string with only null bytes');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with only null bytes successful');
  });

  it('should decompress a buffer with null bytes at the beginning and end', async () => {
    const originalString = '\0\0Hello World\0\0';
    log('Testing decompression of buffer with null bytes at beginning and end');

    log('Compressing string with null bytes at ends');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null bytes at beginning and end successful');
  });

  it('should handle decompression of a large buffer with null bytes', async () => {
    const originalString = 'Hello\0'.repeat(100000) + 'World\0'.repeat(100000);
    log('Testing decompression of large buffer with null bytes');

    log('Compressing large string with null bytes');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of large buffer with null bytes successful');
  });

  it('should decompress a buffer with null bytes and other special characters', async () => {
    const originalString = 'Hello\0World\nTest\tSpecial\0Characters\r\n';
    log('Testing decompression of buffer with null bytes and special characters');

    log('Compressing string with null bytes and special characters');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null bytes and special characters successful');
  });

  it('should handle decompression of a buffer with null bytes and Unicode characters', async () => {
    const originalString = '你好\0世界\0こんにちは\0';
    log('Testing decompression of buffer with null bytes and Unicode characters');

    log('Compressing string with null bytes and Unicode characters');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null bytes and Unicode characters successful');
  });

  it('should decompress a buffer with alternating null bytes', async () => {
    const originalString = 'H\0e\0l\0l\0o\0';
    log('Testing decompression of buffer with alternating null bytes');

    log('Compressing string with alternating null bytes');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with alternating null bytes successful');
  });

  it('should handle decompression of a buffer with null byte as the first character', async () => {
    const originalString = '\0FirstCharIsNull';
    log('Testing decompression of buffer with null byte as the first character');

    log('Compressing string with null byte as first character');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null byte as the first character successful');
  });

  it('should decompress a buffer with null byte as the last character', async () => {
    const originalString = 'LastCharIsNull\0';
    log('Testing decompression of buffer with null byte as the last character');

    log('Compressing string with null byte as last character');
    const compressed = await compressData(originalString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with null byte as the last character successful');
  });
});
