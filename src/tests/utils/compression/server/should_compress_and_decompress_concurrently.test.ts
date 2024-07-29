import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-decompress-concurrently.log');
const log = createLogger(logStream);

describe('Concurrent Compression and Decompression', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress multiple data sets concurrently', async () => {
    const dataSets = [
      'This is the first data set',
      'Another data set with different content',
      'Yet another unique string to compress and decompress',
      'A fourth data set to ensure were testing concurrency',
    ];

    log('Starting concurrent compression and decompression');

    const tasks = dataSets.map(async (data, index) => {
      log(`Compressing data set ${index + 1}`);
      const compressed = await compressData(data);
      log(`Compressed data set ${index + 1}: ${compressed.length} bytes`);

      log(`Decompressing data set ${index + 1}`);
      const decompressed = await decompressData(compressed);
      log(`Decompressed data set ${index + 1}: ${decompressed.length} characters`);

      expect(decompressed).toEqual(data);
      return { original: data, decompressed };
    });

    const results = await Promise.all(tasks);

    results.forEach((result, index) => {
      expect(result.decompressed).toEqual(result.original);
      log(`Data set ${index + 1} successfully compressed and decompressed concurrently`);
    });

    log('All data sets processed concurrently');
  });

  it('should handle errors in concurrent operations', async () => {
    const validData = 'Valid data to compress and decompress';
    const invalidData = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]); // Invalid gzip header

    log('Starting concurrent operations with error handling');

    const tasks = [
      compressData(validData).then(decompressData),
      decompressData(invalidData).catch((error) => {
        log(`Expected error caught: ${error.message}`);
        return 'Error handled';
      }),
    ];

    const results = await Promise.all(tasks);

    expect(results[0]).toEqual(validData);
    expect(results[1]).toEqual('Error handled');

    log('Concurrent operations with error handling completed');
  });
});
