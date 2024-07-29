import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-large-string.log');
const log = createLogger(logStream);

describe('Compression of Large String', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a large string with repeated content', async () => {
    const repeatedContent = 'This is a test string that will be repeated. '.repeat(100000);
    log('Testing compression of large string with repeated content');

    log('Compressing large string');
    const compressed = await compressData(repeatedContent);
    log(`Original size: ${repeatedContent.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedContent);
    log('Compression and decompression of large string with repeated content successful');
  });

  it('should compress and decompress a large string with random content', async () => {
    const randomContent = Array(1000000)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join('');
    log('Testing compression of large string with random content');

    log('Compressing large string');
    const compressed = await compressData(randomContent);
    log(`Original size: ${randomContent.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(randomContent);
    log('Compression and decompression of large string with random content successful');
  });

  it('should handle compression of a large string with mixed content', async () => {
    const mixedContent =
      'Start of mixed content. ' +
      'a'.repeat(100000) +
      'Middle of mixed content. ' +
      'b'.repeat(100000) +
      'End of mixed content. ' +
      Array(100000)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    log('Testing compression of large string with mixed content');

    log('Compressing large string');
    const compressed = await compressData(mixedContent);
    log(`Original size: ${mixedContent.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(mixedContent);
    log('Compression and decompression of large string with mixed content successful');
  });

  it('should compress a large string with Unicode characters', async () => {
    const unicodeContent = '你好，世界！'.repeat(100000) + 'こんにちは、世界！'.repeat(100000);
    log('Testing compression of large string with Unicode characters');

    log('Compressing large Unicode string');
    const compressed = await compressData(unicodeContent);
    log(`Original size: ${Buffer.byteLength(unicodeContent)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeContent);
    log('Compression and decompression of large string with Unicode characters successful');
  });

  it('should handle compression of a large string at the maximum allowed size', async () => {
    // Adjust this size based on your system's limitations
    const maxSize = 1024 * 1024 * 1024; // 1GB
    const largeContent = 'a'.repeat(maxSize);
    log(`Testing compression of large string at maximum size (${maxSize} bytes)`);

    log('Compressing maximum size string');
    const compressed = await compressData(largeContent);
    log(`Original size: ${largeContent.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(largeContent);
    log('Compression and decompression of maximum size string successful');
  });
});
