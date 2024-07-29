import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-compressed-json-stringified-object.log');
const log = createLogger(logStream);

describe('Decompression of Compressed JSON Stringified Object', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a compressed simple JSON stringified object', async () => {
    const simpleObject = { name: 'John Doe', age: 30, city: 'New York' };
    const jsonString = JSON.stringify(simpleObject);
    log('Testing decompression of compressed simple JSON stringified object');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    expect(parsedObject).toEqual(simpleObject);
    log('Decompression of compressed simple JSON stringified object successful');
  });

  it('should handle decompression of a compressed complex nested JSON stringified object', async () => {
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
    log('Testing decompression of compressed complex nested JSON stringified object');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    expect(parsedObject).toEqual(complexObject);
    log('Decompression of compressed complex nested JSON stringified object successful');
  });

  it('should decompress a compressed large JSON stringified array', async () => {
    const largeArray = Array(10000)
      .fill(0)
      .map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
        active: i % 2 === 0,
      }));
    const jsonString = JSON.stringify(largeArray);
    log('Testing decompression of compressed large JSON stringified array');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedArray = JSON.parse(decompressed);
    expect(parsedArray).toEqual(largeArray);
    log('Decompression of compressed large JSON stringified array successful');
  });

  it('should handle decompression of a compressed JSON with special characters and Unicode', async () => {
    const specialObject = {
      text: 'Special characters: !@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`',
      unicode: '你好，世界！こんにちは、世界！안녕하세요, 세계!',
      emoji: '😀🌍🚀',
    };
    const jsonString = JSON.stringify(specialObject);
    log('Testing decompression of compressed JSON with special characters and Unicode');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    expect(parsedObject).toEqual(specialObject);
    log('Decompression of compressed JSON with special characters and Unicode successful');
  });

  it('should decompress a compressed JSON stringified object with nested arrays and objects', async () => {
    const nestedObject = {
      level1: {
        level2: {
          level3: {
            array: [1, 2, 3, { nestedObject: { key: 'value' } }],
          },
        },
        siblingArray: ['a', 'b', 'c'],
      },
      topLevelArray: [{ obj1: 1 }, { obj2: 2 }, { obj3: [{ deeplyNested: true }] }],
    };
    const jsonString = JSON.stringify(nestedObject);
    log(
      'Testing decompression of compressed JSON stringified object with nested arrays and objects',
    );

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    expect(parsedObject).toEqual(nestedObject);
    log(
      'Decompression of compressed JSON stringified object with nested arrays and objects successful',
    );
  });

  it('should handle decompression of a compressed JSON stringified object with null and undefined values', async () => {
    const objectWithNulls = {
      nullValue: null,
      undefinedValue: undefined,
      emptyString: '',
      zero: 0,
      falseValue: false,
      nestedNull: { null: null },
      arrayWithNulls: [null, 1, null, 2, null],
    };
    const jsonString = JSON.stringify(objectWithNulls);
    log(
      'Testing decompression of compressed JSON stringified object with null and undefined values',
    );

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    // Note: undefined values are lost in JSON stringification
    expect(parsedObject).toEqual({
      nullValue: null,
      emptyString: '',
      zero: 0,
      falseValue: false,
      nestedNull: { null: null },
      arrayWithNulls: [null, 1, null, 2, null],
    });
    log(
      'Decompression of compressed JSON stringified object with null and undefined values successful',
    );
  });

  it('should decompress a compressed JSON stringified object with circular references', async () => {
    interface CircularObject {
      name: string;
      self?: CircularObject;
    }

    const circularObject: CircularObject = { name: 'Circular Object' };
    circularObject.self = circularObject;

    const replacer = (): ((key: string, value: unknown) => unknown) => {
      const seen = new WeakSet();
      return (key: string, value: unknown): unknown => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value as object)) {
            return '[Circular]';
          }
          seen.add(value as object);
        }
        return value;
      };
    };

    const jsonString = JSON.stringify(circularObject, replacer());
    log('Testing decompression of compressed JSON stringified object with circular references');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed) as CircularObject;
    expect(parsedObject).toEqual({ name: 'Circular Object', self: '[Circular]' });
    log('Decompression of compressed JSON stringified object with circular references successful');
  });

  it('should handle decompression of a compressed JSON stringified object with Date objects', async () => {
    const objectWithDates = {
      currentDate: new Date(),
      pastDate: new Date('1990-01-01'),
      futureDates: [new Date('2030-01-01'), new Date('2040-12-31')],
    };

    const jsonString = JSON.stringify(objectWithDates, (key, value) =>
      value instanceof Date ? value.toISOString() : value,
    );
    log('Testing decompression of compressed JSON stringified object with Date objects');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed, (key, value) =>
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
        ? new Date(value)
        : value,
    );

    expect(parsedObject.currentDate).toBeInstanceOf(Date);
    expect(parsedObject.pastDate).toBeInstanceOf(Date);
    expect(parsedObject.futureDates[0]).toBeInstanceOf(Date);
    expect(parsedObject.futureDates[1]).toBeInstanceOf(Date);
    log('Decompression of compressed JSON stringified object with Date objects successful');
  });

  it('should decompress a compressed JSON stringified object with BigInt values', async () => {
    const objectWithBigInt = {
      bigIntValue: BigInt(9007199254740991), // Max safe integer in JavaScript
      bigIntArray: [BigInt(1), BigInt(2), BigInt(3)],
    };

    const jsonString = JSON.stringify(objectWithBigInt, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value,
    );
    log('Testing decompression of compressed JSON stringified object with BigInt values');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed, (key, value) => {
      if (typeof value === 'string' && /^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
      }
      return value;
    });

    expect(parsedObject.bigIntValue).toBe(BigInt(9007199254740991));
    expect(parsedObject.bigIntArray).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
    log('Decompression of compressed JSON stringified object with BigInt values successful');
  });

  it('should handle decompression of a compressed very large JSON stringified object', async () => {
    const largeObject = {
      data: Array(100000)
        .fill(0)
        .map((_, i) => ({
          id: i,
          value: Math.random(),
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        })),
    };

    const jsonString = JSON.stringify(largeObject);
    log('Testing decompression of compressed very large JSON stringified object');

    log('Compressing JSON string');
    const compressed = await compressData(jsonString);
    log(`Original size: ${jsonString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    const parsedObject = JSON.parse(decompressed);
    expect(parsedObject.data.length).toBe(100000);
    expect(parsedObject.data[0]).toHaveProperty('id');
    expect(parsedObject.data[0]).toHaveProperty('value');
    expect(parsedObject.data[0]).toHaveProperty('text');
    log('Decompression of compressed very large JSON stringified object successful');
  });
});
