import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-expanding-data.log');
const log = createLogger(logStream);

describe('Decompression of Data Expanding to Very Large Size', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
    jest.setTimeout(60000); // Increase timeout to 60 seconds
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress data that expands to a very large size', async () => {
    const repeatedPattern = 'a'.repeat(1000);
    const largeData = repeatedPattern.repeat(1000000); // 1 billion characters
    log('Testing decompression of data expanding to very large size');

    log('Compressing large repeating data');
    const compressed = await compressData(largeData);
    log(`Original size: ${largeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toBe(largeData.length);
    expect(decompressed).toEqual(largeData);
    log('Decompression of data expanding to very large size successful');
  });

  it('should handle decompression of data with alternating patterns expanding to large size', async () => {
    const pattern1 = 'a'.repeat(1000);
    const pattern2 = 'b'.repeat(1000);
    const largeData = (pattern1 + pattern2).repeat(500000); // 1 billion characters
    log('Testing decompression of alternating patterns expanding to large size');

    log('Compressing large alternating data');
    const compressed = await compressData(largeData);
    log(`Original size: ${largeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toBe(largeData.length);
    expect(decompressed).toEqual(largeData);
    log('Decompression of alternating patterns expanding to large size successful');
  });

  it('should decompress data with nested repetitions expanding to very large size', async () => {
    const innerPattern = 'abc'.repeat(100);
    const outerPattern = (innerPattern + '123').repeat(100);
    const largeData = outerPattern.repeat(100000); // Results in a very large string
    log('Testing decompression of nested repetitions expanding to very large size');

    log('Compressing large nested repeating data');
    const compressed = await compressData(largeData);
    log(`Original size: ${largeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toBe(largeData.length);
    expect(decompressed).toEqual(largeData);
    log('Decompression of nested repetitions expanding to very large size successful');
  });

  it('should handle decompression of data with increasing repetitions', async () => {
    let largeData = '';
    for (let i = 1; i <= 1000; i++) {
      largeData += 'a'.repeat(i);
    }
    largeData = largeData.repeat(1000); // Further increase the size
    log('Testing decompression of data with increasing repetitions');

    log('Compressing data with increasing repetitions');
    const compressed = await compressData(largeData);
    log(`Original size: ${largeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toBe(largeData.length);
    expect(decompressed).toEqual(largeData);
    log('Decompression of data with increasing repetitions successful');
  });

  it('should decompress data with multiple different repeated sections', async () => {
    const section1 = 'a'.repeat(1000000);
    const section2 = 'b'.repeat(2000000);
    const section3 = 'c'.repeat(3000000);
    const largeData = section1 + section2 + section3;
    log('Testing decompression of data with multiple different repeated sections');

    log('Compressing data with multiple repeated sections');
    const compressed = await compressData(largeData);
    log(`Original size: ${largeData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed.length).toBe(largeData.length);
    expect(decompressed).toEqual(largeData);
    log('Decompression of data with multiple different repeated sections successful');
  });
});
