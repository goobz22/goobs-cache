import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-empty-string.log');
const log = createLogger(logStream);

describe('Compression of Empty String', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress an empty string', async () => {
    const emptyString = '';
    log('Testing compression of an empty string');

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Compressed size: ${compressed.length} bytes`);

    expect(compressed.length).toBeGreaterThan(0);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(emptyString);
    log('Compression and decompression of empty string successful');
  });

  it('should handle multiple compressions of an empty string', async () => {
    const emptyString = '';
    const compressionCount = 3;
    log(`Testing ${compressionCount} consecutive compressions of an empty string`);

    let compressedData = Buffer.from(emptyString);

    for (let i = 0; i < compressionCount; i++) {
      log(`Performing compression #${i + 1}`);
      compressedData = await compressData(compressedData.toString('binary'));
      log(`Compression #${i + 1} size: ${compressedData.length} bytes`);

      expect(compressedData.length).toBeGreaterThan(0);
    }

    let decompressedData = compressedData;
    for (let i = 0; i < compressionCount; i++) {
      log(`Performing decompression #${compressionCount - i}`);
      decompressedData = Buffer.from(await decompressData(decompressedData));
    }

    expect(decompressedData.toString()).toEqual(emptyString);
    log('Multiple compressions and decompressions of empty string successful');
  });

  it('should compare empty string compression to single character compression', async () => {
    const emptyString = '';
    const singleChar = 'a';
    log('Comparing compression of empty string to single character');

    log('Compressing empty string');
    const emptyCompressed = await compressData(emptyString);
    log(`Empty string compressed size: ${emptyCompressed.length} bytes`);

    log('Compressing single character');
    const charCompressed = await compressData(singleChar);
    log(`Single character compressed size: ${charCompressed.length} bytes`);

    expect(emptyCompressed.length).toBeLessThanOrEqual(charCompressed.length);

    log('Decompressing empty string');
    const emptyDecompressed = await decompressData(emptyCompressed);
    expect(emptyDecompressed).toEqual(emptyString);

    log('Decompressing single character');
    const charDecompressed = await decompressData(charCompressed);
    expect(charDecompressed).toEqual(singleChar);

    log('Comparison of empty string and single character compression successful');
  });
});
