import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-empty-buffer.log');
const log = createLogger(logStream);

describe('Decompression of Empty Buffer', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle decompression of an empty buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);
    log('Testing decompression of an empty buffer');

    log('Attempting to decompress empty buffer');
    try {
      const decompressed = await decompressData(emptyBuffer);
      log(`Decompressed size: ${decompressed.length} bytes`);
      expect(decompressed).toEqual('');
      log('Decompression of empty buffer successful');
    } catch (error: unknown) {
      if (error instanceof Error) {
        log(`Error during decompression: ${error.message}`);
      } else {
        log('Unknown error during decompression');
      }
      throw error;
    }
  });

  it('should compress and decompress an empty string', async () => {
    const emptyString = '';
    log('Testing compression and decompression of an empty string');

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(emptyString);
    log('Compression and decompression of empty string successful');
  });

  it('should handle decompression of a buffer with minimal valid compressed data', async () => {
    // This test depends on the specific compression algorithm used.
    // You may need to adjust this based on your compression implementation.
    const minimalValidCompressedData = Buffer.from([
      0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01,
    ]);
    log('Testing decompression of a buffer with minimal valid compressed data');

    log('Attempting to decompress minimal valid compressed data');
    try {
      const decompressed = await decompressData(minimalValidCompressedData);
      log(`Decompressed size: ${decompressed.length} bytes`);
      expect(decompressed).toEqual('');
      log('Decompression of minimal valid compressed data successful');
    } catch (error: unknown) {
      if (error instanceof Error) {
        log(`Error during decompression: ${error.message}`);
      } else {
        log('Unknown error during decompression');
      }
      throw error;
    }
  });

  it('should throw an error when decompressing an invalid empty buffer', async () => {
    const invalidEmptyBuffer = Buffer.from([]);
    log('Testing decompression of an invalid empty buffer');

    log('Attempting to decompress invalid empty buffer');
    await expect(decompressData(invalidEmptyBuffer)).rejects.toThrow();
    log('Decompression of invalid empty buffer threw expected error');
  });

  it('should handle decompression of a buffer with only header data', async () => {
    // This test depends on the specific compression algorithm used.
    // You may need to adjust this based on your compression implementation.
    const headerOnlyBuffer = Buffer.from([0x78, 0x9c]);
    log('Testing decompression of a buffer with only header data');

    log('Attempting to decompress buffer with only header data');
    try {
      const decompressed = await decompressData(headerOnlyBuffer);
      log(`Decompressed size: ${decompressed.length} bytes`);
      expect(decompressed).toEqual('');
      log('Decompression of buffer with only header data successful');
    } catch (error: unknown) {
      if (error instanceof Error) {
        log(`Error during decompression: ${error.message}`);
      } else {
        log('Unknown error during decompression');
      }
      // Depending on your implementation, this might throw an error instead
      // In that case, you would use the following assertion:
      // await expect(decompressData(headerOnlyBuffer)).rejects.toThrow();
      throw error;
    }
  });

  it('should compress and decompress a string with only whitespace', async () => {
    const whitespaceString = '    \t\n\r';
    log('Testing compression and decompression of a string with only whitespace');

    log('Compressing whitespace string');
    const compressed = await compressData(whitespaceString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(whitespaceString);
    log('Compression and decompression of whitespace string successful');
  });
});
