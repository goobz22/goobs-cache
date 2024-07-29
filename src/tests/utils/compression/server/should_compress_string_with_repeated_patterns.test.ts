import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-string-with-repeated-patterns.log');
const log = createLogger(logStream);

describe('Compression of String with Repeated Patterns', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a string with simple repeated pattern', async () => {
    const repeatedPattern = 'abcabcabc'.repeat(1000);
    log('Testing compression of string with simple repeated pattern');

    log('Compressing string with simple repeated pattern');
    const compressed = await compressData(repeatedPattern);
    log(`Original size: ${repeatedPattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedPattern);
    log('Compression and decompression of string with simple repeated pattern successful');
  });

  it('should handle compression of a string with long repeated pattern', async () => {
    const longPattern = 'This is a long pattern that will be repeated multiple times. ';
    const repeatedLongPattern = longPattern.repeat(1000);
    log('Testing compression of string with long repeated pattern');

    log('Compressing string with long repeated pattern');
    const compressed = await compressData(repeatedLongPattern);
    log(`Original size: ${repeatedLongPattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedLongPattern);
    log('Compression and decompression of string with long repeated pattern successful');
  });

  it('should compress a string with alternating patterns', async () => {
    const alternatingPattern = ('abc123'.repeat(500) + 'xyz789'.repeat(500)).repeat(10);
    log('Testing compression of string with alternating patterns');

    log('Compressing string with alternating patterns');
    const compressed = await compressData(alternatingPattern);
    log(`Original size: ${alternatingPattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(alternatingPattern);
    log('Compression and decompression of string with alternating patterns successful');
  });

  it('should handle compression of a string with nested repeated patterns', async () => {
    const nestedPattern = ('abc'.repeat(10) + '123'.repeat(10)).repeat(1000);
    log('Testing compression of string with nested repeated patterns');

    log('Compressing string with nested repeated patterns');
    const compressed = await compressData(nestedPattern);
    log(`Original size: ${nestedPattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(nestedPattern);
    log('Compression and decompression of string with nested repeated patterns successful');
  });

  it('should compress a string with repeated Unicode patterns', async () => {
    const unicodePattern = '你好世界'.repeat(10000);
    log('Testing compression of string with repeated Unicode patterns');

    log('Compressing string with repeated Unicode patterns');
    const compressed = await compressData(unicodePattern);
    log(`Original size: ${Buffer.byteLength(unicodePattern)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodePattern);
    log('Compression and decompression of string with repeated Unicode patterns successful');
  });

  it('should handle compression of a string with repeated special characters', async () => {
    const specialCharPattern = '!@#$%^&*()_+'.repeat(10000);
    log('Testing compression of string with repeated special characters');

    log('Compressing string with repeated special characters');
    const compressed = await compressData(specialCharPattern);
    log(`Original size: ${specialCharPattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(specialCharPattern);
    log('Compression and decompression of string with repeated special characters successful');
  });

  it('should compress a large string with a mix of repeated patterns', async () => {
    const mixedPattern = (
      'abcABC123'.repeat(1000) +
      '你好世界'.repeat(500) +
      '!@#$%^&*()'.repeat(300)
    ).repeat(100);
    log('Testing compression of large string with a mix of repeated patterns');

    log('Compressing large string with mixed repeated patterns');
    const compressed = await compressData(mixedPattern);
    log(`Original size: ${Buffer.byteLength(mixedPattern)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mixedPattern);
    log('Compression and decompression of large string with mixed repeated patterns successful');
  });

  it('should handle compression of a string with repeated whitespace patterns', async () => {
    const whitespacePattern = '   \t\n\r'.repeat(10000);
    log('Testing compression of string with repeated whitespace patterns');

    log('Compressing string with repeated whitespace patterns');
    const compressed = await compressData(whitespacePattern);
    log(`Original size: ${whitespacePattern.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(whitespacePattern);
    log('Compression and decompression of string with repeated whitespace patterns successful');
  });
});
