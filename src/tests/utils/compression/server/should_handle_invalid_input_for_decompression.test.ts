import { decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('handle-invalid-input-decompression.log');
const log = createLogger(logStream);

describe('Handling Invalid Input for Decompression', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should throw an error when decompressing undefined input', async () => {
    log('Testing decompression of undefined input');
    await expect(decompressData(undefined as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for undefined input');
  });

  it('should throw an error when decompressing null input', async () => {
    log('Testing decompression of null input');
    await expect(decompressData(null as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for null input');
  });

  it('should throw an error when decompressing number input', async () => {
    log('Testing decompression of number input');
    await expect(decompressData(123 as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for number input');
  });

  it('should throw an error when decompressing boolean input', async () => {
    log('Testing decompression of boolean input');
    await expect(decompressData(true as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for boolean input');
  });

  it('should throw an error when decompressing string input', async () => {
    log('Testing decompression of string input');
    await expect(decompressData('not a buffer' as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for string input');
  });

  it('should throw an error when decompressing object input', async () => {
    log('Testing decompression of object input');
    await expect(decompressData({} as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for object input');
  });

  it('should throw an error when decompressing array input', async () => {
    log('Testing decompression of array input');
    await expect(decompressData([] as unknown as Buffer)).rejects.toThrow();
    log('Error thrown successfully for array input');
  });

  it('should throw an error when decompressing empty buffer', async () => {
    log('Testing decompression of empty buffer');
    await expect(decompressData(Buffer.alloc(0))).rejects.toThrow();
    log('Error thrown successfully for empty buffer');
  });

  it('should throw an error when decompressing buffer with invalid header', async () => {
    log('Testing decompression of buffer with invalid header');
    const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    await expect(decompressData(invalidBuffer)).rejects.toThrow();
    log('Error thrown successfully for buffer with invalid header');
  });

  it('should throw an error when decompressing truncated buffer', async () => {
    log('Testing decompression of truncated buffer');
    const truncatedBuffer = Buffer.from([0x1f, 0x8b, 0x08, 0x00]); // Valid gzip header, but truncated
    await expect(decompressData(truncatedBuffer)).rejects.toThrow();
    log('Error thrown successfully for truncated buffer');
  });

  it('should throw an error when decompressing buffer with incorrect checksum', async () => {
    log('Testing decompression of buffer with incorrect checksum');
    // This is a minimal valid gzip stream with an incorrect checksum
    const invalidChecksumBuffer = Buffer.from([
      0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x03, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    await expect(decompressData(invalidChecksumBuffer)).rejects.toThrow();
    log('Error thrown successfully for buffer with incorrect checksum');
  });

  it('should throw an error when decompressing extremely large buffer', async () => {
    log('Testing decompression of extremely large buffer');
    const largeBuffer = Buffer.alloc(1024 * 1024 * 1024); // 1GB buffer
    await expect(decompressData(largeBuffer)).rejects.toThrow();
    log('Error thrown successfully for extremely large buffer');
  });

  it('should throw an error when decompressing buffer with unsupported compression method', async () => {
    log('Testing decompression of buffer with unsupported compression method');
    const unsupportedMethodBuffer = Buffer.from([0x1f, 0x8b, 0x09, 0x00]); // 0x09 is an unsupported method
    await expect(decompressData(unsupportedMethodBuffer)).rejects.toThrow();
    log('Error thrown successfully for buffer with unsupported compression method');
  });
});
