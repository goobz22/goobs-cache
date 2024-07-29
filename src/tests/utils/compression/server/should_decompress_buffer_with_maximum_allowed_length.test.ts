import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-buffer-with-maximum-allowed-length.log');
const log = createLogger(logStream);

describe('Decompression of Buffer with Maximum Allowed Length', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  // Adjust this value based on your system's limitations and the maximum buffer size you want to test
  const MAX_BUFFER_LENGTH = 1024 * 1024 * 1024; // 1GB

  it('should decompress a buffer with maximum allowed length', async () => {
    const largeString = 'a'.repeat(MAX_BUFFER_LENGTH);
    log(`Testing decompression of buffer with maximum allowed length (${MAX_BUFFER_LENGTH} bytes)`);

    log('Compressing large string');
    const compressed = await compressData(largeString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_BUFFER_LENGTH);
    expect(decompressed).toEqual(largeString);
    log('Decompression of buffer with maximum allowed length successful');
  });

  it('should handle decompression of a buffer slightly below maximum length', async () => {
    const nearMaxString = 'a'.repeat(MAX_BUFFER_LENGTH - 1000); // 1KB less than max
    log(
      `Testing decompression of buffer slightly below maximum length (${nearMaxString.length} bytes)`,
    );

    log('Compressing near-max length string');
    const compressed = await compressData(nearMaxString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_BUFFER_LENGTH - 1000);
    expect(decompressed).toEqual(nearMaxString);
    log('Decompression of buffer slightly below maximum length successful');
  });

  it('should decompress a buffer with varied content at maximum length', async () => {
    const variedContent = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(
      Math.floor(MAX_BUFFER_LENGTH / 36),
    );
    const maxLengthVariedString = variedContent.slice(0, MAX_BUFFER_LENGTH);
    log(
      `Testing decompression of buffer with varied content at maximum length (${maxLengthVariedString.length} bytes)`,
    );

    log('Compressing max length varied string');
    const compressed = await compressData(maxLengthVariedString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_BUFFER_LENGTH);
    expect(decompressed).toEqual(maxLengthVariedString);
    log('Decompression of buffer with varied content at maximum length successful');
  });

  it('should handle decompression of a buffer with Unicode characters at maximum byte length', async () => {
    const unicodeChar = '你'; // 3 bytes in UTF-8
    const unicodeStringLength = Math.floor(MAX_BUFFER_LENGTH / 3);
    const maxLengthUnicodeString = unicodeChar.repeat(unicodeStringLength);
    log(
      `Testing decompression of buffer with Unicode characters at maximum byte length (${Buffer.byteLength(maxLengthUnicodeString)} bytes)`,
    );

    log('Compressing max length Unicode string');
    const compressed = await compressData(maxLengthUnicodeString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed.length).toEqual(unicodeStringLength);
    expect(decompressed).toEqual(maxLengthUnicodeString);
    log('Decompression of buffer with Unicode characters at maximum byte length successful');
  });

  it('should throw an error when decompressing a buffer that would exceed maximum length', async () => {
    const slightlyOverMaxString = 'a'.repeat(MAX_BUFFER_LENGTH + 1);
    log(
      `Testing decompression of buffer that would exceed maximum length (${slightlyOverMaxString.length} bytes)`,
    );

    log('Compressing slightly over max length string');
    const compressed = await compressData(slightlyOverMaxString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Attempting to decompress data');
    await expect(decompressData(compressed)).rejects.toThrow();
    log('Decompression of buffer exceeding maximum length threw expected error');
  });

  it('should decompress a buffer with maximum length of repeated patterns', async () => {
    const repeatedPattern = 'abcdefghij'.repeat(MAX_BUFFER_LENGTH / 10);
    log(
      `Testing decompression of buffer with maximum length of repeated patterns (${repeatedPattern.length} bytes)`,
    );

    log('Compressing max length repeated pattern string');
    const compressed = await compressData(repeatedPattern);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toEqual(MAX_BUFFER_LENGTH);
    expect(decompressed).toEqual(repeatedPattern);
    log('Decompression of buffer with maximum length of repeated patterns successful');
  });
});
