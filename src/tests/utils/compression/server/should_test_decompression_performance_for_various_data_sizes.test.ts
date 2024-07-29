import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompression-performance.log');
const log = createLogger(logStream);

describe('Decompression Performance for Various Data Sizes', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
    jest.setTimeout(60000); // Increase timeout to 60 seconds for larger data sets
  });

  afterAll(() => {
    logStream.end();
  });

  const performDecompressionTest = async (originalData: string, description: string) => {
    log(`Testing decompression performance for ${description}`);
    const compressed = await compressData(originalData);

    const startTime = process.hrtime();
    const decompressed = await decompressData(compressed);
    const endTime = process.hrtime(startTime);
    const decompressionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    log(`Original size: ${Buffer.byteLength(originalData)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);
    log(`Decompression time: ${decompressionTime.toFixed(2)} ms`);

    expect(decompressed).toEqual(originalData);

    return { decompressionTime };
  };

  it('should decompress small data (100 bytes)', async () => {
    const data = 'a'.repeat(100);
    const { decompressionTime } = await performDecompressionTest(data, 'small data (100 bytes)');
    expect(decompressionTime).toBeLessThan(50); // Assuming decompression should be quick for small data
  });

  it('should decompress medium data (10 KB)', async () => {
    const data = 'abcdefghij'.repeat(1000);
    const { decompressionTime } = await performDecompressionTest(data, 'medium data (10 KB)');
    expect(decompressionTime).toBeLessThan(100); // Adjust based on expected performance
  });

  it('should decompress large data (1 MB)', async () => {
    const data = 'abcdefghijklmnopqrstuvwxyz'.repeat(40000);
    const { decompressionTime } = await performDecompressionTest(data, 'large data (1 MB)');
    expect(decompressionTime).toBeLessThan(500); // Adjust based on expected performance
  });

  it('should decompress very large data (10 MB)', async () => {
    const data = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(280000);
    const { decompressionTime } = await performDecompressionTest(data, 'very large data (10 MB)');
    expect(decompressionTime).toBeLessThan(2000); // Adjust based on expected performance
  });

  it('should decompress repeated pattern data', async () => {
    const data = 'abcdef'.repeat(1000000);
    const { decompressionTime } = await performDecompressionTest(data, 'repeated pattern data');
    expect(decompressionTime).toBeLessThan(1000); // Adjust based on expected performance
  });

  it('should decompress random data', async () => {
    const data = Array.from({ length: 1000000 }, () => Math.random().toString(36)[2]).join('');
    const { decompressionTime } = await performDecompressionTest(data, 'random data');
    expect(decompressionTime).toBeLessThan(2000); // Adjust based on expected performance
  });

  it('should decompress JSON data', async () => {
    const jsonData = JSON.stringify(
      Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
        tags: ['tag1', 'tag2', 'tag3'],
      })),
    );
    const { decompressionTime } = await performDecompressionTest(jsonData, 'JSON data');
    expect(decompressionTime).toBeLessThan(1000); // Adjust based on expected performance
  });

  it('should decompress text data with many repeating words', async () => {
    const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
    const data = Array.from(
      { length: 100000 },
      () => words[Math.floor(Math.random() * words.length)],
    ).join(' ');
    const { decompressionTime } = await performDecompressionTest(
      data,
      'text data with repeating words',
    );
    expect(decompressionTime).toBeLessThan(500); // Adjust based on expected performance
  });

  it('should decompress binary data', async () => {
    const binaryData = Buffer.from(
      Array.from({ length: 1000000 }, () => Math.floor(Math.random() * 256)),
    ).toString('binary');
    const { decompressionTime } = await performDecompressionTest(binaryData, 'binary data');
    expect(decompressionTime).toBeLessThan(2000); // Adjust based on expected performance
  });

  it('should decompress data with long runs of the same byte', async () => {
    const data = '0'.repeat(500000) + '1'.repeat(500000);
    const { decompressionTime } = await performDecompressionTest(
      data,
      'data with long runs of the same byte',
    );
    expect(decompressionTime).toBeLessThan(500); // Adjust based on expected performance
  });

  it('should decompress data with alternating patterns', async () => {
    const data = ('abc123'.repeat(1000) + 'xyz789'.repeat(1000)).repeat(100);
    const { decompressionTime } = await performDecompressionTest(
      data,
      'data with alternating patterns',
    );
    expect(decompressionTime).toBeLessThan(1000); // Adjust based on expected performance
  });

  it('should decompress data with unicode characters', async () => {
    const data = '你好世界'.repeat(250000); // Approximately 2MB of data
    const { decompressionTime } = await performDecompressionTest(
      data,
      'data with unicode characters',
    );
    expect(decompressionTime).toBeLessThan(1000); // Adjust based on expected performance
  });

  it('should decompress data with special characters', async () => {
    const data = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`'.repeat(50000);
    const { decompressionTime } = await performDecompressionTest(
      data,
      'data with special characters',
    );
    expect(decompressionTime).toBeLessThan(500); // Adjust based on expected performance
  });
});
