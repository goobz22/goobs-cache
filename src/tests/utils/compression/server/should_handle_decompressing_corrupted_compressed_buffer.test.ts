import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('handle-decompressing-corrupted-buffer.log');
const log = createLogger(logStream);

describe('Handling Decompression of Corrupted Compressed Buffer', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should throw an error when decompressing a corrupted buffer', async () => {
    const originalData = 'This is a test string for corruption testing';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt the compressed data
    compressedData[Math.floor(compressedData.length / 2)] ^= 0xff;
    log('Corrupted the compressed data');

    log('Attempting to decompress corrupted data');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for corrupted compressed buffer');
  });

  it('should handle decompression of a buffer with corrupted header', async () => {
    const originalData = 'Testing corrupted header';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt the header
    compressedData[0] ^= 0xff;
    log('Corrupted the header of the compressed data');

    log('Attempting to decompress data with corrupted header');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for compressed buffer with corrupted header');
  });

  it('should throw an error when decompressing a truncated buffer', async () => {
    const originalData = 'This data will be truncated after compression';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Truncate the compressed data
    const truncatedData = compressedData.slice(0, Math.floor(compressedData.length / 2));
    log('Truncated the compressed data');

    log('Attempting to decompress truncated data');
    await expect(decompressData(truncatedData)).rejects.toThrow();
    log('Error thrown successfully for truncated compressed buffer');
  });

  it('should handle decompression of a buffer with corrupted footer', async () => {
    const originalData = 'Testing corrupted footer';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt the footer
    compressedData[compressedData.length - 1] ^= 0xff;
    log('Corrupted the footer of the compressed data');

    log('Attempting to decompress data with corrupted footer');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for compressed buffer with corrupted footer');
  });

  it('should throw an error when decompressing a buffer with invalid checksum', async () => {
    const originalData = 'This data will have an invalid checksum';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt the checksum
    compressedData[compressedData.length - 5] ^= 0xff;
    log('Corrupted the checksum of the compressed data');

    log('Attempting to decompress data with invalid checksum');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for compressed buffer with invalid checksum');
  });

  it('should handle decompression of a buffer with corrupted content', async () => {
    const originalData = 'This is the content that will be corrupted after compression';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt the content (avoid header and footer)
    const corruptionIndex = Math.floor(compressedData.length / 2);
    compressedData[corruptionIndex] ^= 0xff;
    log('Corrupted the content of the compressed data');

    log('Attempting to decompress data with corrupted content');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for compressed buffer with corrupted content');
  });

  it('should throw an error when decompressing a buffer with multiple corruptions', async () => {
    const originalData = 'This data will have multiple points of corruption';
    log('Compressing original data');
    const compressedData = await compressData(originalData);

    // Corrupt multiple points
    compressedData[10] ^= 0xff;
    compressedData[20] ^= 0xff;
    compressedData[30] ^= 0xff;
    log('Corrupted multiple points in the compressed data');

    log('Attempting to decompress data with multiple corruptions');
    await expect(decompressData(compressedData)).rejects.toThrow();
    log('Error thrown successfully for compressed buffer with multiple corruptions');
  });
});
