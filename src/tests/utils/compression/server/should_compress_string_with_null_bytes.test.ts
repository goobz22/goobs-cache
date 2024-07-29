import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-string-with-null-bytes.log');
const log = createLogger(logStream);

describe('Compression of String with Null Bytes', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a string with null bytes', async () => {
    const stringWithNullBytes = 'Hello\0World\0Test';
    log('Testing compression of string with null bytes');

    log('Compressing string with null bytes');
    const compressed = await compressData(stringWithNullBytes);
    log(`Original size: ${Buffer.byteLength(stringWithNullBytes)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(stringWithNullBytes);
    log('Compression and decompression of string with null bytes successful');
  });

  it('should handle compression of a string with only null bytes', async () => {
    const nullByteString = '\0\0\0\0\0';
    log('Testing compression of string with only null bytes');

    log('Compressing string with only null bytes');
    const compressed = await compressData(nullByteString);
    log(`Original size: ${Buffer.byteLength(nullByteString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(nullByteString);
    log('Compression and decompression of string with only null bytes successful');
  });

  it('should compress a string with null bytes at the beginning and end', async () => {
    const nullBytesAtEnds = '\0\0Hello World\0\0';
    log('Testing compression of string with null bytes at beginning and end');

    log('Compressing string with null bytes at ends');
    const compressed = await compressData(nullBytesAtEnds);
    log(`Original size: ${Buffer.byteLength(nullBytesAtEnds)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(nullBytesAtEnds);
    log('Compression and decompression of string with null bytes at ends successful');
  });

  it('should handle compression of a large string with null bytes', async () => {
    const largeStringWithNullBytes = 'Hello\0'.repeat(100000) + 'World\0'.repeat(100000);
    log('Testing compression of large string with null bytes');

    log('Compressing large string with null bytes');
    const compressed = await compressData(largeStringWithNullBytes);
    log(`Original size: ${Buffer.byteLength(largeStringWithNullBytes)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(largeStringWithNullBytes);
    log('Compression and decompression of large string with null bytes successful');
  });

  it('should compress a string with mixed null bytes and other special characters', async () => {
    const mixedString = 'Hello\0World\nTest\tSpecial\0Characters\r\n';
    log('Testing compression of string with mixed null bytes and special characters');

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

  it('should handle compression of a string with null bytes and Unicode characters', async () => {
    const unicodeWithNullBytes = '你好\0世界\0こんにちは\0';
    log('Testing compression of string with null bytes and Unicode characters');

    log('Compressing Unicode string with null bytes');
    const compressed = await compressData(unicodeWithNullBytes);
    log(`Original size: ${Buffer.byteLength(unicodeWithNullBytes)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeWithNullBytes);
    log('Compression and decompression of Unicode string with null bytes successful');
  });

  it('should compress a string with alternating null bytes', async () => {
    const alternatingNullBytes = 'H\0e\0l\0l\0o\0';
    log('Testing compression of string with alternating null bytes');

    log('Compressing string with alternating null bytes');
    const compressed = await compressData(alternatingNullBytes);
    log(`Original size: ${Buffer.byteLength(alternatingNullBytes)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(alternatingNullBytes);
    log('Compression and decompression of string with alternating null bytes successful');
  });
});
