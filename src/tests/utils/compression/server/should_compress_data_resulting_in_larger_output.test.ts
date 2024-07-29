import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-data-larger-output.log');
const log = createLogger(logStream);

describe('Compression Resulting in Larger Output', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle compression of small, non-compressible data', async () => {
    const smallData = 'abc';
    log('Testing compression of small, non-compressible data');

    log('Compressing small data');
    const compressed = await compressData(smallData);
    log(`Original size: ${smallData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    expect(compressed.length).toBeGreaterThan(smallData.length);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(smallData);
    log('Compression and decompression of small, non-compressible data successful');
  });

  it('should handle compression of random data', async () => {
    const randomData = Buffer.from(
      Array(1000)
        .fill(0)
        .map(() => Math.floor(Math.random() * 256)),
    ).toString('binary');
    log('Testing compression of random data');

    log('Compressing random data');
    const compressed = await compressData(randomData);
    log(`Original size: ${randomData.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    expect(compressed.length).toBeGreaterThanOrEqual(randomData.length);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(randomData);
    log('Compression and decompression of random data successful');
  });

  it('should handle compression of already compressed data', async () => {
    const originalData = 'This is some test data that will be compressed twice.';
    log('Testing compression of already compressed data');

    log('Performing first compression');
    const firstCompressed = await compressData(originalData);
    log(`First compression size: ${firstCompressed.length} bytes`);

    log('Performing second compression');
    const secondCompressed = await compressData(firstCompressed.toString('binary'));
    log(`Second compression size: ${secondCompressed.length} bytes`);

    expect(secondCompressed.length).toBeGreaterThan(firstCompressed.length);

    log('Performing double decompression');
    const firstDecompressed = await decompressData(secondCompressed);
    const finalDecompressed = await decompressData(Buffer.from(firstDecompressed, 'binary'));

    expect(finalDecompressed).toEqual(originalData);
    log('Compression and decompression of already compressed data successful');
  });
});
