import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-large-compressed-buffer.log');
const log = createLogger(logStream);

describe('Decompression of Large Compressed Buffer', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
    jest.setTimeout(60000); // Increase timeout to 60 seconds for large data operations
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a large buffer with repeated data', async () => {
    const repeatedData = 'abcdefghijklmnopqrstuvwxyz'.repeat(1000000); // ~26MB of data
    log('Testing decompression of large buffer with repeated data');

    log('Compressing large repeated data');
    const startCompress = Date.now();
    const compressed = await compressData(repeatedData);
    const compressTime = Date.now() - startCompress;
    log(`Compression time: ${compressTime}ms`);
    log(`Original size: ${repeatedData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const startDecompress = Date.now();
    const decompressed = await decompressData(compressed);
    const decompressTime = Date.now() - startDecompress;
    log(`Decompression time: ${decompressTime}ms`);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedData);
    log('Decompression of large buffer with repeated data successful');
  });

  it('should handle decompression of a large buffer with random data', async () => {
    const randomData = Array(10000000)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join(''); // ~10MB of random data
    log('Testing decompression of large buffer with random data');

    log('Compressing large random data');
    const startCompress = Date.now();
    const compressed = await compressData(randomData);
    const compressTime = Date.now() - startCompress;
    log(`Compression time: ${compressTime}ms`);
    log(`Original size: ${randomData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const startDecompress = Date.now();
    const decompressed = await decompressData(compressed);
    const decompressTime = Date.now() - startDecompress;
    log(`Decompression time: ${decompressTime}ms`);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(randomData);
    log('Decompression of large buffer with random data successful');
  });

  it('should decompress a large buffer with JSON data', async () => {
    const largeJsonObject = {
      data: Array(100000)
        .fill(0)
        .map((_, index) => ({
          id: index,
          name: `Item ${index}`,
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          value: Math.random(),
          tags: ['tag1', 'tag2', 'tag3'],
        })),
    };
    const jsonData = JSON.stringify(largeJsonObject);
    log('Testing decompression of large buffer with JSON data');

    log('Compressing large JSON data');
    const startCompress = Date.now();
    const compressed = await compressData(jsonData);
    const compressTime = Date.now() - startCompress;
    log(`Compression time: ${compressTime}ms`);
    log(`Original size: ${jsonData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const startDecompress = Date.now();
    const decompressed = await decompressData(compressed);
    const decompressTime = Date.now() - startDecompress;
    log(`Decompression time: ${decompressTime}ms`);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(jsonData);
    log('Decompression of large buffer with JSON data successful');
  });

  it('should handle decompression of a large buffer with mixed content', async () => {
    const mixedContent =
      'abcdefghijklmnopqrstuvwxyz'.repeat(100000) +
      JSON.stringify({ key: 'value', nested: { array: Array(10000).fill('item') } }) +
      '0123456789'.repeat(100000);
    log('Testing decompression of large buffer with mixed content');

    log('Compressing large mixed content');
    const startCompress = Date.now();
    const compressed = await compressData(mixedContent);
    const compressTime = Date.now() - startCompress;
    log(`Compression time: ${compressTime}ms`);
    log(`Original size: ${mixedContent.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const startDecompress = Date.now();
    const decompressed = await decompressData(compressed);
    const decompressTime = Date.now() - startDecompress;
    log(`Decompression time: ${decompressTime}ms`);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(mixedContent);
    log('Decompression of large buffer with mixed content successful');
  });

  it('should decompress a very large buffer', async () => {
    const veryLargeData = 'a'.repeat(100000000); // 100MB of data
    log('Testing decompression of very large buffer');

    log('Compressing very large data');
    const startCompress = Date.now();
    const compressed = await compressData(veryLargeData);
    const compressTime = Date.now() - startCompress;
    log(`Compression time: ${compressTime}ms`);
    log(`Original size: ${veryLargeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const startDecompress = Date.now();
    const decompressed = await decompressData(compressed);
    const decompressTime = Date.now() - startDecompress;
    log(`Decompression time: ${decompressTime}ms`);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(veryLargeData);
    log('Decompression of very large buffer successful');
  });
});
