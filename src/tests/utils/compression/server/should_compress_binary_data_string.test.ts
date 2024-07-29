import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-decompress-binary-data.log');
const log = createLogger(logStream);

describe('Compression and Decompression of Binary Data String', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress binary data string', async () => {
    const binaryData = Buffer.from('Hello, Binary World!').toString('binary');
    log('Testing compression and decompression of binary data string');

    log('Compressing binary data');
    const compressed = await compressData(binaryData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(binaryData);
    log('Compression and decompression of binary data string successful');
  });

  it('should handle binary data with null bytes', async () => {
    const binaryDataWithNull = Buffer.from('Hello\0World').toString('binary');
    log('Testing compression and decompression of binary data with null bytes');

    log('Compressing binary data with null bytes');
    const compressed = await compressData(binaryDataWithNull);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(binaryDataWithNull);
    log('Compression and decompression of binary data with null bytes successful');
  });

  it('should compress and decompress large binary data', async () => {
    const largeBinaryData = Buffer.alloc(1024 * 1024)
      .fill('A')
      .toString('binary');
    log('Testing compression and decompression of large binary data');

    log('Compressing large binary data');
    const compressed = await compressData(largeBinaryData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(largeBinaryData);
    log('Compression and decompression of large binary data successful');
  });

  it('should handle binary data with various byte values', async () => {
    const variousByteData = Buffer.from([0, 1, 127, 128, 255]).toString('binary');
    log('Testing compression and decompression of binary data with various byte values');

    log('Compressing binary data with various byte values');
    const compressed = await compressData(variousByteData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(variousByteData);
    log('Compression and decompression of binary data with various byte values successful');
  });
});
