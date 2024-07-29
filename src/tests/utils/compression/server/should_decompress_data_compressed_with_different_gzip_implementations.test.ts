import { decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(zlib.gzip);
const logStream: WriteStream = createLogStream('decompress-different-gzip-implementations.log');
const log = createLogger(logStream);

describe('Decompression of Data Compressed with Different gzip Implementations', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData: string =
    'This is a test string that will be compressed using different gzip implementations and settings.'.repeat(
      100,
    );

  const compressionLevels: Array<[string, number]> = [
    ['NO_COMPRESSION', zlib.constants.Z_NO_COMPRESSION],
    ['BEST_SPEED', zlib.constants.Z_BEST_SPEED],
    ['BEST_COMPRESSION', zlib.constants.Z_BEST_COMPRESSION],
    ['DEFAULT_COMPRESSION', zlib.constants.Z_DEFAULT_COMPRESSION],
  ];

  compressionLevels.forEach(([levelName, level]) => {
    it(`should decompress data compressed with ${levelName}`, async () => {
      log(`Testing decompression of data compressed with ${levelName}`);

      log('Compressing data');
      const compressed: Buffer = await gzipAsync(testData, { level });
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed: string = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(testData);
      log(`Decompression of data compressed with ${levelName} successful`);
    });
  });

  it('should decompress data compressed with a custom dictionary', async () => {
    log('Testing decompression of data compressed with a custom dictionary');

    const dictionary: Buffer = Buffer.from('test string compressed decompressed');

    log('Compressing data with custom dictionary');
    const compressed: Buffer = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(testData, { dictionary }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed: string = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(testData);
    log('Decompression of data compressed with custom dictionary successful');
  });

  it('should decompress data compressed with different window sizes', async () => {
    log('Testing decompression of data compressed with different window sizes');

    const windowSizes: number[] = [9, 11, 13, 15]; // Valid window sizes for gzip

    for (const windowBits of windowSizes) {
      log(`Compressing data with window size 2^${windowBits}`);
      const compressed: Buffer = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(testData, { windowBits }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed: string = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(testData);
      log(`Decompression of data compressed with window size 2^${windowBits} successful`);
    }
  });

  it('should decompress data compressed with different memory levels', async () => {
    log('Testing decompression of data compressed with different memory levels');

    const memLevels: number[] = [1, 5, 9]; // Min, middle, and max memory levels

    for (const memLevel of memLevels) {
      log(`Compressing data with memory level ${memLevel}`);
      const compressed: Buffer = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(testData, { memLevel }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed: string = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(testData);
      log(`Decompression of data compressed with memory level ${memLevel} successful`);
    }
  });

  it('should decompress data compressed with different strategies', async () => {
    log('Testing decompression of data compressed with different strategies');

    const strategies: Array<[string, number]> = [
      ['DEFAULT_STRATEGY', zlib.constants.Z_DEFAULT_STRATEGY],
      ['FILTERED', zlib.constants.Z_FILTERED],
      ['HUFFMAN_ONLY', zlib.constants.Z_HUFFMAN_ONLY],
      ['RLE', zlib.constants.Z_RLE],
      ['FIXED', zlib.constants.Z_FIXED],
    ];

    for (const [strategyName, strategy] of strategies) {
      log(`Compressing data with ${strategyName}`);
      const compressed: Buffer = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(testData, { strategy }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed: string = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(testData);
      log(`Decompression of data compressed with ${strategyName} successful`);
    }
  });
});
