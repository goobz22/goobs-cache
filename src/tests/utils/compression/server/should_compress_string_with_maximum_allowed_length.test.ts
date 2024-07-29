import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-max-length-string.log');
const log = createLogger(logStream);

describe('Compression of String with Maximum Allowed Length', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  // Adjust this value based on your system's limitations and the maximum string size you want to test
  const MAX_STRING_LENGTH = 1024 * 1024 * 1024; // 1GB

  it('should compress and decompress a string with maximum allowed length', async () => {
    const maxLengthString = 'a'.repeat(MAX_STRING_LENGTH);
    log(`Testing compression of string with maximum allowed length (${MAX_STRING_LENGTH} bytes)`);

    log('Compressing max length string');
    const compressed = await compressData(maxLengthString);
    log(`Original size: ${maxLengthString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_STRING_LENGTH);
    expect(decompressed).toEqual(maxLengthString);
    log('Compression and decompression of max length string successful');
  });

  it('should handle compression of a string slightly below maximum length', async () => {
    const nearMaxLengthString = 'a'.repeat(MAX_STRING_LENGTH - 1000); // 1KB less than max
    log(
      `Testing compression of string slightly below maximum length (${nearMaxLengthString.length} bytes)`,
    );

    log('Compressing near-max length string');
    const compressed = await compressData(nearMaxLengthString);
    log(`Original size: ${nearMaxLengthString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_STRING_LENGTH - 1000);
    expect(decompressed).toEqual(nearMaxLengthString);
    log('Compression and decompression of near-max length string successful');
  });

  it('should compress a max length string with varied content', async () => {
    const variedContent = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(
      Math.floor(MAX_STRING_LENGTH / 36),
    );
    const maxLengthVariedString = variedContent.slice(0, MAX_STRING_LENGTH);
    log(
      `Testing compression of max length string with varied content (${maxLengthVariedString.length} bytes)`,
    );

    log('Compressing max length varied string');
    const compressed = await compressData(maxLengthVariedString);
    log(`Original size: ${maxLengthVariedString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_STRING_LENGTH);
    expect(decompressed).toEqual(maxLengthVariedString);
    log('Compression and decompression of max length varied string successful');
  });

  it('should handle compression of max length string with Unicode characters', async () => {
    const unicodeChar = '你'; // 3 bytes in UTF-8
    const unicodeStringLength = Math.floor(MAX_STRING_LENGTH / 3);
    const maxLengthUnicodeString = unicodeChar.repeat(unicodeStringLength);
    log(
      `Testing compression of max length Unicode string (${Buffer.byteLength(maxLengthUnicodeString)} bytes)`,
    );

    log('Compressing max length Unicode string');
    const compressed = await compressData(maxLengthUnicodeString);
    log(`Original size: ${Buffer.byteLength(maxLengthUnicodeString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed.length).toEqual(unicodeStringLength);
    expect(decompressed).toEqual(maxLengthUnicodeString);
    log('Compression and decompression of max length Unicode string successful');
  });

  it('should throw an error when compressing a string exceeding maximum length', async () => {
    const exceedingString = 'a'.repeat(MAX_STRING_LENGTH + 1);
    log(`Testing compression of string exceeding maximum length (${exceedingString.length} bytes)`);

    await expect(compressData(exceedingString)).rejects.toThrow();
    log('Compression of string exceeding maximum length threw expected error');
  });
});
