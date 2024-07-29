import { compressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compression-performance.log');
const log = createLogger(logStream);

describe('Compression Performance for Various Data Sizes', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
    jest.setTimeout(60000); // Increase timeout to 60 seconds for larger data sets
  });

  afterAll(() => {
    logStream.end();
  });

  const performCompressionTest = async (data: string, description: string) => {
    log(`Testing compression performance for ${description}`);
    const startTime = process.hrtime();
    const compressed = await compressData(data);
    const endTime = process.hrtime(startTime);
    const compressionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    const compressionRatio = compressed.length / Buffer.byteLength(data);
    log(`Original size: ${Buffer.byteLength(data)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);
    log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
    log(`Compression time: ${compressionTime.toFixed(2)} ms`);

    return { compressionRatio, compressionTime };
  };

  it('should compress small data (100 bytes)', async () => {
    const data = 'a'.repeat(100);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'small data (100 bytes)',
    );
    expect(compressionRatio).toBeLessThan(1);
    expect(compressionTime).toBeLessThan(100); // Assuming compression should be quick for small data
  });

  it('should compress medium data (10 KB)', async () => {
    const data = 'abcdefghij'.repeat(1000);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'medium data (10 KB)',
    );
    expect(compressionRatio).toBeLessThan(1);
    expect(compressionTime).toBeLessThan(500); // Adjust based on expected performance
  });

  it('should compress large data (1 MB)', async () => {
    const data = 'abcdefghijklmnopqrstuvwxyz'.repeat(40000);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'large data (1 MB)',
    );
    expect(compressionRatio).toBeLessThan(1);
    expect(compressionTime).toBeLessThan(2000); // Adjust based on expected performance
  });

  it('should compress very large data (10 MB)', async () => {
    const data = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(280000);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'very large data (10 MB)',
    );
    expect(compressionRatio).toBeLessThan(1);
    expect(compressionTime).toBeLessThan(10000); // Adjust based on expected performance
  });

  it('should compress repeated pattern data', async () => {
    const data = 'abcdef'.repeat(1000000);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'repeated pattern data',
    );
    expect(compressionRatio).toBeLessThan(0.1); // Expecting high compression for repeated data
    expect(compressionTime).toBeLessThan(5000); // Adjust based on expected performance
  });

  it('should compress random data', async () => {
    const data = Array.from({ length: 1000000 }, () => Math.random().toString(36)[2]).join('');
    const { compressionRatio, compressionTime } = await performCompressionTest(data, 'random data');
    expect(compressionRatio).toBeGreaterThan(0.9); // Expecting low compression for random data
    expect(compressionTime).toBeLessThan(10000); // Adjust based on expected performance
  });

  it('should compress JSON data', async () => {
    const jsonData = JSON.stringify(
      Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
        tags: ['tag1', 'tag2', 'tag3'],
      })),
    );
    const { compressionRatio, compressionTime } = await performCompressionTest(
      jsonData,
      'JSON data',
    );
    expect(compressionRatio).toBeLessThan(0.5);
    expect(compressionTime).toBeLessThan(5000); // Adjust based on expected performance
  });

  it('should compress text data with many repeating words', async () => {
    const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
    const data = Array.from(
      { length: 100000 },
      () => words[Math.floor(Math.random() * words.length)],
    ).join(' ');
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'text data with repeating words',
    );
    expect(compressionRatio).toBeLessThan(0.3);
    expect(compressionTime).toBeLessThan(5000); // Adjust based on expected performance
  });

  it('should compress binary data', async () => {
    const binaryData = Buffer.from(
      Array.from({ length: 1000000 }, () => Math.floor(Math.random() * 256)),
    ).toString('binary');
    const { compressionRatio, compressionTime } = await performCompressionTest(
      binaryData,
      'binary data',
    );
    expect(compressionRatio).toBeGreaterThan(0.9); // Expecting low compression for random binary data
    expect(compressionTime).toBeLessThan(10000); // Adjust based on expected performance
  });

  it('should compress data with long runs of the same byte', async () => {
    const data = '0'.repeat(500000) + '1'.repeat(500000);
    const { compressionRatio, compressionTime } = await performCompressionTest(
      data,
      'data with long runs of the same byte',
    );
    expect(compressionRatio).toBeLessThan(0.01); // Expecting very high compression
    expect(compressionTime).toBeLessThan(2000); // Adjust based on expected performance
  });
});
