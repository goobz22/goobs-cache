import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-data-multiple-times.log');
const log = createLogger(logStream);

describe('Decompression of Data Multiple Times', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress the same compressed data multiple times', async () => {
    const originalData = 'This is a test string for multiple decompressions.'.repeat(1000);
    log('Testing decompression of the same compressed data multiple times');

    log('Compressing original data');
    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressionCount = 5;
    for (let i = 1; i <= decompressionCount; i++) {
      log(`Performing decompression #${i}`);
      const decompressed = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(originalData);
      log(`Decompression #${i} successful`);
    }

    log('All decompressions of the same compressed data successful');
  });

  it('should handle multiple rounds of compression and decompression', async () => {
    let data = 'This is a test string for multiple rounds of compression and decompression.'.repeat(
      100,
    );
    const roundCount = 10;
    log(`Testing ${roundCount} rounds of compression and decompression`);

    for (let i = 1; i <= roundCount; i++) {
      log(`Round ${i} - Compressing data`);
      const compressed = await compressData(data);
      log(`Compressed size: ${compressed.length} bytes`);

      log(`Round ${i} - Decompressing data`);
      const decompressed = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(data);
      log(`Round ${i} successful`);

      // Prepare for next round
      data = decompressed + ` Round ${i} completed.`;
    }

    log('All rounds of compression and decompression successful');
  });

  it('should decompress large data multiple times', async () => {
    const largeData = 'a'.repeat(1000000); // 1 million characters
    log('Testing decompression of large data multiple times');

    log('Compressing large data');
    const compressed = await compressData(largeData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressionCount = 3;
    for (let i = 1; i <= decompressionCount; i++) {
      log(`Performing decompression #${i} of large data`);
      const decompressed = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(largeData);
      log(`Large data decompression #${i} successful`);
    }

    log('All decompressions of large data successful');
  });

  it('should handle decompression of different data types multiple times', async () => {
    const testData = [
      'Simple string data',
      '{"key": "JSON data", "nested": {"array": [1, 2, 3]}}',
      'a'.repeat(10000),
      '1234567890'.repeat(1000),
      'Mixed data: abc123!@#あいう',
    ];

    log('Testing decompression of different data types multiple times');

    for (const data of testData) {
      log(`Compressing data: ${data.slice(0, 20)}...`);
      const compressed = await compressData(data);
      log(`Compressed size: ${compressed.length} bytes`);

      const decompressionCount = 3;
      for (let i = 1; i <= decompressionCount; i++) {
        log(`Performing decompression #${i}`);
        const decompressed = await decompressData(compressed);
        log(`Decompressed size: ${decompressed.length} characters`);

        expect(decompressed).toEqual(data);
        log(`Decompression #${i} successful`);
      }
    }

    log('Decompression of all data types multiple times successful');
  });

  it('should decompress data with increasing size multiple times', async () => {
    let data = 'Initial data. ';
    const roundCount = 5;
    log(`Testing decompression with increasing data size for ${roundCount} rounds`);

    for (let i = 1; i <= roundCount; i++) {
      data += 'Additional data. '.repeat(Math.pow(2, i));

      log(`Round ${i} - Compressing data`);
      const compressed = await compressData(data);
      log(`Compressed size: ${compressed.length} bytes`);

      const decompressionCount = 3;
      for (let j = 1; j <= decompressionCount; j++) {
        log(`Round ${i}, Decompression #${j}`);
        const decompressed = await decompressData(compressed);
        log(`Decompressed size: ${decompressed.length} characters`);

        expect(decompressed).toEqual(data);
        log(`Round ${i}, Decompression #${j} successful`);
      }
    }

    log('Decompression with increasing data size successful');
  });
});
