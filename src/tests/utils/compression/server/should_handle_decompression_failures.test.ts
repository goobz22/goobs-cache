import { decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('handle-decompression-failures.log');
const log = createLogger(logStream);

describe('Handling Decompression Failures', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should throw an error when decompressing invalid input', async () => {
    const invalidInput = Buffer.from('This is not compressed data');
    log('Testing decompression of invalid input');

    await expect(decompressData(invalidInput)).rejects.toThrow();
    log('Error thrown successfully for invalid input');
  });

  it('should handle decompression of empty buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);
    log('Testing decompression of empty buffer');

    await expect(decompressData(emptyBuffer)).rejects.toThrow();
    log('Error thrown successfully for empty buffer');
  });

  it('should throw an error when decompressing corrupted data', async () => {
    const corruptedData = Buffer.from([
      0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x01, 0x00, 0x00, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    log('Testing decompression of corrupted data');

    await expect(decompressData(corruptedData)).rejects.toThrow();
    log('Error thrown successfully for corrupted data');
  });

  it('should handle decompression of data with invalid gzip header', async () => {
    const invalidHeader = Buffer.from([0x1f, 0x8b, 0x00, 0x00]); // Invalid compression method
    log('Testing decompression of data with invalid gzip header');

    await expect(decompressData(invalidHeader)).rejects.toThrow();
    log('Error thrown successfully for invalid gzip header');
  });

  it('should throw an error when decompressing truncated data', async () => {
    const truncatedData = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]);
    log('Testing decompression of truncated data');

    await expect(decompressData(truncatedData)).rejects.toThrow();
    log('Error thrown successfully for truncated data');
  });

  it('should handle decompression of data with incorrect checksum', async () => {
    // This is a minimal valid gzip stream with an incorrect checksum
    const incorrectChecksumData = Buffer.from([
      0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x01, 0x00, 0x00, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    log('Testing decompression of data with incorrect checksum');

    await expect(decompressData(incorrectChecksumData)).rejects.toThrow();
    log('Error thrown successfully for incorrect checksum');
  });

  it('should throw an error when decompressing non-gzip data', async () => {
    const nonGzipData = Buffer.from('This is just a plain text string');
    log('Testing decompression of non-gzip data');

    await expect(decompressData(nonGzipData)).rejects.toThrow();
    log('Error thrown successfully for non-gzip data');
  });

  it('should handle decompression of very large invalid data', async () => {
    const largeInvalidData = Buffer.alloc(1024 * 1024, 0xff); // 1MB of 0xFF bytes
    log('Testing decompression of very large invalid data');

    await expect(decompressData(largeInvalidData)).rejects.toThrow();
    log('Error thrown successfully for very large invalid data');
  });
});
