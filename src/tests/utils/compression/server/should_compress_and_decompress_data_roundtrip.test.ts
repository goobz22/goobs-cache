import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-decompress-roundtrip.log');
const log = createLogger(logStream);

describe('Roundtrip Compression and Decompression', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should correctly roundtrip compress and decompress various data types', async () => {
    const testCases = [
      { name: 'Empty string', data: '' },
      { name: 'Short string', data: 'Hello, World!' },
      { name: 'Long string', data: 'a'.repeat(10000) },
      {
        name: 'String with special characters',
        data: 'áéíóú ñÑ ¿¡ @#$%^&*()_+{}[]|\\:;"\'<>,.?/~`',
      },
      { name: 'JSON string', data: JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } }) },
      { name: 'Numeric string', data: '12345678901234567890' },
      { name: 'Repeated pattern', data: 'abcabcabc'.repeat(1000) },
    ];

    for (const { name, data } of testCases) {
      log(`Testing roundtrip for: ${name}`);

      log('Compressing data');
      const compressed = await compressData(data);
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      expect(decompressed).toEqual(data);
      log(`Roundtrip successful for: ${name}`);
    }
  });

  it('should handle multiple roundtrips', async () => {
    const originalData = 'This is a test string for multiple roundtrips';
    let currentData = originalData;

    log('Starting multiple roundtrip test');

    for (let i = 0; i < 5; i++) {
      log(`Roundtrip ${i + 1}`);

      log('Compressing data');
      const compressed = await compressData(currentData);
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      currentData = await decompressData(compressed);
      log(`Decompressed size: ${currentData.length} characters`);

      expect(currentData).toEqual(originalData);
      log(`Roundtrip ${i + 1} successful`);
    }

    log('Multiple roundtrips completed successfully');
  });

  it('should maintain data integrity for large datasets', async () => {
    const largeData = 'a'.repeat(1000000) + 'b'.repeat(1000000) + 'c'.repeat(1000000);

    log('Starting large dataset roundtrip test');

    log('Compressing large dataset');
    const compressed = await compressData(largeData);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing large dataset');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(largeData);
    log('Large dataset roundtrip successful');
  });
});
