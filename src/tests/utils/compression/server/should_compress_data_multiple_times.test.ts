import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-data-multiple-times.log');
const log = createLogger(logStream);

describe('Compression of Data Multiple Times', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress data multiple times and decompress correctly', async () => {
    const originalData = 'This is a test string for multiple compressions.';
    const compressionCount = 5;
    log(`Testing ${compressionCount} consecutive compressions`);

    let compressedData = Buffer.from(originalData);
    const compressionSizes: number[] = [];

    // Perform multiple compressions
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing compression #${i + 1}`);
      compressedData = await compressData(compressedData.toString('binary'));
      compressionSizes.push(compressedData.length);
      log(`Compression #${i + 1} size: ${compressedData.length} bytes`);
    }

    // Perform multiple decompressions
    let decompressedData = compressedData;
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing decompression #${compressionCount - i}`);
      decompressedData = Buffer.from(await decompressData(decompressedData));
    }

    expect(decompressedData.toString()).toEqual(originalData);
    log('Multiple compressions and decompressions successful');

    // Log compression ratios
    compressionSizes.forEach((size, index) => {
      const ratio = size / Buffer.from(originalData).length;
      log(`Compression #${index + 1} ratio: ${ratio.toFixed(4)}`);
    });
  });

  it('should handle empty string with multiple compressions', async () => {
    const emptyString = '';
    const compressionCount = 3;
    log(`Testing ${compressionCount} consecutive compressions on empty string`);

    let compressedData = Buffer.from(emptyString);

    // Perform multiple compressions
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing compression #${i + 1} on empty string`);
      compressedData = await compressData(compressedData.toString('binary'));
      log(`Compression #${i + 1} size: ${compressedData.length} bytes`);
    }

    // Perform multiple decompressions
    let decompressedData = compressedData;
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing decompression #${compressionCount - i} on empty string`);
      decompressedData = Buffer.from(await decompressData(decompressedData));
    }

    expect(decompressedData.toString()).toEqual(emptyString);
    log('Multiple compressions and decompressions on empty string successful');
  });

  it('should compress already compressed data', async () => {
    const originalData = 'This is already compressed data.'.repeat(100);
    log('Testing compression of already compressed data');

    log('Performing initial compression');
    const initialCompressed = await compressData(originalData);
    log(`Initial compression size: ${initialCompressed.length} bytes`);

    log('Performing second compression');
    const secondCompressed = await compressData(initialCompressed.toString('binary'));
    log(`Second compression size: ${secondCompressed.length} bytes`);

    log('Decompressing twice');
    const firstDecompressed = await decompressData(secondCompressed);
    const finalDecompressed = await decompressData(Buffer.from(firstDecompressed, 'binary'));

    expect(finalDecompressed).toEqual(originalData);
    log('Compression of already compressed data successful');
  });

  it('should handle large data with multiple compressions', async () => {
    const largeData = 'A'.repeat(1000000); // 1MB of data
    const compressionCount = 3;
    log(`Testing ${compressionCount} consecutive compressions on large data`);

    let compressedData = Buffer.from(largeData);
    const compressionSizes: number[] = [];

    // Perform multiple compressions
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing compression #${i + 1} on large data`);
      compressedData = await compressData(compressedData.toString('binary'));
      compressionSizes.push(compressedData.length);
      log(`Compression #${i + 1} size: ${compressedData.length} bytes`);
    }

    // Perform multiple decompressions
    let decompressedData = compressedData;
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing decompression #${compressionCount - i} on large data`);
      decompressedData = Buffer.from(await decompressData(decompressedData));
    }

    expect(decompressedData.toString()).toEqual(largeData);
    log('Multiple compressions and decompressions on large data successful');

    // Log compression ratios
    compressionSizes.forEach((size, index) => {
      const ratio = size / Buffer.from(largeData).length;
      log(`Compression #${index + 1} ratio for large data: ${ratio.toFixed(4)}`);
    });
  });
});
