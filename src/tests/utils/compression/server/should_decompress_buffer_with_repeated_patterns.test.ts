import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-buffer-with-repeated-patterns.log');
const log = createLogger(logStream);

describe('Decompression of Buffer with Repeated Patterns', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a buffer with simple repeated pattern', async () => {
    const originalString = 'abcabcabc'.repeat(1000);
    log('Testing decompression of buffer with simple repeated pattern');

    log('Compressing string with simple repeated pattern');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with simple repeated pattern successful');
  });

  it('should handle decompression of a buffer with long repeated pattern', async () => {
    const longPattern = 'This is a long pattern that will be repeated multiple times. ';
    const originalString = longPattern.repeat(1000);
    log('Testing decompression of buffer with long repeated pattern');

    log('Compressing string with long repeated pattern');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with long repeated pattern successful');
  });

  it('should decompress a buffer with alternating patterns', async () => {
    const originalString = ('abc123'.repeat(500) + 'xyz789'.repeat(500)).repeat(10);
    log('Testing decompression of buffer with alternating patterns');

    log('Compressing string with alternating patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with alternating patterns successful');
  });

  it('should handle decompression of a buffer with nested repeated patterns', async () => {
    const originalString = ('abc'.repeat(10) + '123'.repeat(10)).repeat(1000);
    log('Testing decompression of buffer with nested repeated patterns');

    log('Compressing string with nested repeated patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with nested repeated patterns successful');
  });

  it('should decompress a buffer with repeated Unicode patterns', async () => {
    const originalString = '你好世界'.repeat(10000);
    log('Testing decompression of buffer with repeated Unicode patterns');

    log('Compressing string with repeated Unicode patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${Buffer.byteLength(originalString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with repeated Unicode patterns successful');
  });

  it('should handle decompression of a buffer with repeated special characters', async () => {
    const originalString = '!@#$%^&*()_+'.repeat(10000);
    log('Testing decompression of buffer with repeated special characters');

    log('Compressing string with repeated special characters');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with repeated special characters successful');
  });

  it('should decompress a large buffer with a mix of repeated patterns', async () => {
    const originalString = (
      'abcABC123'.repeat(1000) +
      '你好世界'.repeat(500) +
      '!@#$%^&*()'.repeat(300)
    ).repeat(100);
    log('Testing decompression of large buffer with a mix of repeated patterns');

    log('Compressing large string with mixed repeated patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${Buffer.byteLength(originalString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of large buffer with mixed repeated patterns successful');
  });

  it('should handle decompression of a buffer with repeated whitespace patterns', async () => {
    const originalString = '   \t\n\r'.repeat(10000);
    log('Testing decompression of buffer with repeated whitespace patterns');

    log('Compressing string with repeated whitespace patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with repeated whitespace patterns successful');
  });

  it('should decompress a buffer with a single character repeated', async () => {
    const originalString = 'a'.repeat(100000);
    log('Testing decompression of buffer with a single character repeated');

    log('Compressing string with single repeated character');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with single repeated character successful');
  });

  it('should handle decompression of a buffer with repeated patterns of prime length', async () => {
    const primePattern = 'abcdefg'.repeat(17); // 17 is a prime number
    const originalString = primePattern.repeat(1000);
    log('Testing decompression of buffer with repeated patterns of prime length');

    log('Compressing string with prime length repeated pattern');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with prime length repeated pattern successful');
  });

  it('should decompress a buffer with repeated patterns and non-repeated data', async () => {
    const repeatedPart = 'abc123'.repeat(1000);
    const nonRepeatedPart = 'This is some non-repeated data';
    const originalString = repeatedPart + nonRepeatedPart + repeatedPart;
    log('Testing decompression of buffer with repeated patterns and non-repeated data');

    log('Compressing string with mixed repeated and non-repeated data');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with mixed repeated and non-repeated data successful');
  });

  it('should handle decompression of a buffer with repeated emoji patterns', async () => {
    const emojiPattern = '😀🌍🚀💻🎉';
    const originalString = emojiPattern.repeat(10000);
    log('Testing decompression of buffer with repeated emoji patterns');

    log('Compressing string with repeated emoji pattern');
    const compressed = await compressData(originalString);
    log(`Original size: ${Buffer.byteLength(originalString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with repeated emoji pattern successful');
  });

  it('should decompress a buffer with repeated patterns of varying lengths', async () => {
    const pattern1 = 'a'.repeat(10);
    const pattern2 = 'b'.repeat(100);
    const pattern3 = 'c'.repeat(1000);
    const originalString = (pattern1 + pattern2 + pattern3).repeat(100);
    log('Testing decompression of buffer with repeated patterns of varying lengths');

    log('Compressing string with varying length repeated patterns');
    const compressed = await compressData(originalString);
    log(`Original size: ${originalString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(originalString);
    log('Decompression of buffer with varying length repeated patterns successful');
  });
});
