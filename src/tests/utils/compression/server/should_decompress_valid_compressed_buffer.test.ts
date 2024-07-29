import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-valid-compressed-buffer.log');
const log = createLogger(logStream);

describe('Decompression of Valid Compressed Buffer', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a simple string', async () => {
    const originalData = 'Hello, world!';
    log('Testing decompression of a simple string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of simple string successful');
  });

  it('should handle decompression of an empty string', async () => {
    const originalData = '';
    log('Testing decompression of an empty string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of empty string successful');
  });

  it('should decompress a JSON object', async () => {
    const originalData = JSON.stringify({
      name: 'John Doe',
      age: 30,
      city: 'New York',
      hobbies: ['reading', 'swimming', 'cycling'],
    });
    log('Testing decompression of a JSON object');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of JSON object successful');
  });

  it('should handle decompression of a large repeated string', async () => {
    const originalData = 'abcdefghijklmnopqrstuvwxyz'.repeat(10000);
    log('Testing decompression of a large repeated string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of large repeated string successful');
  });

  it('should decompress a string with special characters', async () => {
    const originalData = 'Special characters: !@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    log('Testing decompression of a string with special characters');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with special characters successful');
  });

  it('should handle decompression of a string with unicode characters', async () => {
    const originalData =
      'Unicode characters: ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
    log('Testing decompression of a string with unicode characters');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with unicode characters successful');
  });

  it('should decompress a buffer with binary data', async () => {
    const originalData = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).toString('binary');
    log('Testing decompression of a buffer with binary data');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of buffer with binary data successful');
  });

  it('should handle decompression of a very small string', async () => {
    const originalData = 'a';
    log('Testing decompression of a very small string');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of very small string successful');
  });

  it('should decompress a string with repeating patterns', async () => {
    const originalData = 'abcabcabc'.repeat(1000);
    log('Testing decompression of a string with repeating patterns');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of string with repeating patterns successful');
  });

  it('should handle decompression of a large JSON array', async () => {
    const originalData = JSON.stringify(
      Array(10000)
        .fill(0)
        .map((_, i) => ({ id: i, value: `Item ${i}` })),
    );
    log('Testing decompression of a large JSON array');

    const compressed = await compressData(originalData);
    log(`Compressed size: ${compressed.length} bytes`);

    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(originalData);
    log('Decompression of large JSON array successful');
  });
});
