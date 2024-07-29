import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-simple-string.log');
const log = createLogger(logStream);

describe('Compression of Simple String', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a simple string', async () => {
    const simpleString = 'Hello, world!';
    log('Testing compression of simple string');

    log('Compressing simple string');
    const compressed = await compressData(simpleString);
    log(`Original size: ${simpleString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(simpleString);
    log('Compression and decompression of simple string successful');
  });

  it('should handle compression of a string with repeated characters', async () => {
    const repeatedString = 'aaaaaaaaaa';
    log('Testing compression of string with repeated characters');

    log('Compressing repeated string');
    const compressed = await compressData(repeatedString);
    log(`Original size: ${repeatedString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedString);
    log('Compression and decompression of repeated string successful');
  });

  it('should compress a string with special characters', async () => {
    const specialString = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    log('Testing compression of string with special characters');

    log('Compressing special string');
    const compressed = await compressData(specialString);
    log(`Original size: ${specialString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(specialString);
    log('Compression and decompression of special string successful');
  });

  it('should compress a string with Unicode characters', async () => {
    const unicodeString = '你好，世界！こんにちは、世界！안녕하세요, 세계!';
    log('Testing compression of string with Unicode characters');

    log('Compressing Unicode string');
    const compressed = await compressData(unicodeString);
    log(`Original size: ${Buffer.byteLength(unicodeString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeString);
    log('Compression and decompression of Unicode string successful');
  });

  it('should handle compression of an empty string', async () => {
    const emptyString = '';
    log('Testing compression of empty string');

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Original size: ${emptyString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(emptyString);
    log('Compression and decompression of empty string successful');
  });

  it('should compress a string with numeric characters', async () => {
    const numericString = '1234567890';
    log('Testing compression of string with numeric characters');

    log('Compressing numeric string');
    const compressed = await compressData(numericString);
    log(`Original size: ${numericString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(numericString);
    log('Compression and decompression of numeric string successful');
  });

  it('should handle compression of a string with mixed content', async () => {
    const mixedString = 'abc123!@#あいう';
    log('Testing compression of string with mixed content');

    log('Compressing mixed string');
    const compressed = await compressData(mixedString);
    log(`Original size: ${Buffer.byteLength(mixedString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mixedString);
    log('Compression and decompression of mixed string successful');
  });

  it('should compress a string with whitespace characters', async () => {
    const whitespaceString = '  \t\n\r  ';
    log('Testing compression of string with whitespace characters');

    log('Compressing whitespace string');
    const compressed = await compressData(whitespaceString);
    log(`Original size: ${whitespaceString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(whitespaceString);
    log('Compression and decompression of whitespace string successful');
  });
});
