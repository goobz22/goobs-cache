import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-very-short-string.log');
const log = createLogger(logStream);

describe('Compression of Very Short String', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a single character string', async () => {
    const singleChar = 'a';
    log('Testing compression of single character string');

    log('Compressing single character');
    const compressed = await compressData(singleChar);
    log(`Original size: ${Buffer.byteLength(singleChar)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(singleChar);
    log('Compression and decompression of single character successful');
  });

  it('should handle compression of a two-character string', async () => {
    const twoChars = 'ab';
    log('Testing compression of two-character string');

    log('Compressing two characters');
    const compressed = await compressData(twoChars);
    log(`Original size: ${Buffer.byteLength(twoChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(twoChars);
    log('Compression and decompression of two characters successful');
  });

  it('should compress a three-character string', async () => {
    const threeChars = 'abc';
    log('Testing compression of three-character string');

    log('Compressing three characters');
    const compressed = await compressData(threeChars);
    log(`Original size: ${Buffer.byteLength(threeChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(threeChars);
    log('Compression and decompression of three characters successful');
  });

  it('should handle compression of a short string with repeated characters', async () => {
    const repeatedChars = 'aaa';
    log('Testing compression of short string with repeated characters');

    log('Compressing repeated characters');
    const compressed = await compressData(repeatedChars);
    log(`Original size: ${Buffer.byteLength(repeatedChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(repeatedChars);
    log('Compression and decompression of repeated characters successful');
  });

  it('should compress a short string with special characters', async () => {
    const specialChars = '!@#';
    log('Testing compression of short string with special characters');

    log('Compressing special characters');
    const compressed = await compressData(specialChars);
    log(`Original size: ${Buffer.byteLength(specialChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(specialChars);
    log('Compression and decompression of special characters successful');
  });

  it('should handle compression of a short string with Unicode characters', async () => {
    const unicodeChars = '你好';
    log('Testing compression of short string with Unicode characters');

    log('Compressing Unicode characters');
    const compressed = await compressData(unicodeChars);
    log(`Original size: ${Buffer.byteLength(unicodeChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeChars);
    log('Compression and decompression of Unicode characters successful');
  });

  it('should compress a short string with mixed character types', async () => {
    const mixedChars = 'a1你';
    log('Testing compression of short string with mixed character types');

    log('Compressing mixed characters');
    const compressed = await compressData(mixedChars);
    log(`Original size: ${Buffer.byteLength(mixedChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mixedChars);
    log('Compression and decompression of mixed characters successful');
  });

  it('should handle compression of a single emoji', async () => {
    const singleEmoji = '😀';
    log('Testing compression of single emoji');

    log('Compressing single emoji');
    const compressed = await compressData(singleEmoji);
    log(`Original size: ${Buffer.byteLength(singleEmoji)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(singleEmoji);
    log('Compression and decompression of single emoji successful');
  });

  it('should compress a short string with whitespace', async () => {
    const whitespaceString = ' a ';
    log('Testing compression of short string with whitespace');

    log('Compressing string with whitespace');
    const compressed = await compressData(whitespaceString);
    log(`Original size: ${Buffer.byteLength(whitespaceString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(whitespaceString);
    log('Compression and decompression of string with whitespace successful');
  });
});
