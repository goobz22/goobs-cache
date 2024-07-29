import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-json-stringified-object.log');
const log = createLogger(logStream);

describe('Compression of JSON Stringified Object', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a simple JSON stringified object', async () => {
    const simpleObject = { name: 'John Doe', age: 30, city: 'New York' };
    const jsonString = JSON.stringify(simpleObject);
    log('Testing compression of simple JSON stringified object');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Original size: ${jsonString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(JSON.parse(decompressed)).toEqual(simpleObject);
    log('Compression and decompression of simple JSON stringified object successful');
  });

  it('should compress and decompress a complex nested JSON stringified object', async () => {
    const complexObject = {
      id: 1,
      name: 'Complex Object',
      details: {
        description: 'This is a complex nested object',
        created: new Date().toISOString(),
        tags: ['test', 'json', 'compression'],
      },
      data: Array(100)
        .fill(0)
        .map((_, i) => ({ key: `item${i}`, value: Math.random() })),
    };
    const jsonString = JSON.stringify(complexObject);
    log('Testing compression of complex nested JSON stringified object');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Original size: ${jsonString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(JSON.parse(decompressed)).toEqual(complexObject);
    log('Compression and decompression of complex nested JSON stringified object successful');
  });

  it('should handle compression of large JSON stringified array', async () => {
    const largeArray = Array(10000)
      .fill(0)
      .map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
        active: i % 2 === 0,
      }));
    const jsonString = JSON.stringify(largeArray);
    log('Testing compression of large JSON stringified array');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Original size: ${jsonString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(JSON.parse(decompressed)).toEqual(largeArray);
    log('Compression and decompression of large JSON stringified array successful');
  });

  it('should compress JSON with special characters and Unicode', async () => {
    const specialObject = {
      text: 'Special characters: !@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`',
      unicode: '你好，世界！こんにちは、世界！안녕하세요, 세계!',
      emoji: '😀🌍🚀',
    };
    const jsonString = JSON.stringify(specialObject);
    log('Testing compression of JSON with special characters and Unicode');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Original size: ${jsonString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(JSON.parse(decompressed)).toEqual(specialObject);
    log('Compression and decompression of JSON with special characters and Unicode successful');
  });
});
