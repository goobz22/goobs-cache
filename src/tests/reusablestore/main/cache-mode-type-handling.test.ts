import { set, get } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import {
  CacheMode,
  StringValue,
  ListValue,
  SetValue,
  HashValue,
  StreamValue,
  ZSetValue,
  HLLValue,
  GeoValue,
  JSONValue,
  EncryptedValue,
  JSONObject,
} from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-mode-type-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Mode Type Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Cache Mode Type Handling tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should handle StringValue in ${mode} mode`, async () => {
        const identifier = `string-value-${mode}`;
        const value: StringValue = { type: 'string', value: 'test string' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled StringValue in ${mode} mode`);
      });

      it(`should handle ListValue in ${mode} mode`, async () => {
        const identifier = `list-value-${mode}`;
        const value: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled ListValue in ${mode} mode`);
      });

      it(`should handle SetValue in ${mode} mode`, async () => {
        const identifier = `set-value-${mode}`;
        const value: SetValue = { type: 'set', value: ['unique1', 'unique2', 'unique3'] };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled SetValue in ${mode} mode`);
      });

      it(`should handle HashValue in ${mode} mode`, async () => {
        const identifier = `hash-value-${mode}`;
        const value: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled HashValue in ${mode} mode`);
      });

      it(`should handle StreamValue in ${mode} mode`, async () => {
        const identifier = `stream-value-${mode}`;
        const value: StreamValue = {
          type: 'stream',
          value: [
            { id: '1-0', fields: { name: 'John', age: '30' } },
            { id: '2-0', fields: { name: 'Jane', age: '25' } },
          ],
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled StreamValue in ${mode} mode`);
      });

      it(`should handle ZSetValue in ${mode} mode`, async () => {
        const identifier = `zset-value-${mode}`;
        const value: ZSetValue = { type: 'zset', value: { member1: 1, member2: 2, member3: 3 } };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled ZSetValue in ${mode} mode`);
      });

      it(`should handle HLLValue in ${mode} mode`, async () => {
        const identifier = `hll-value-${mode}`;
        const value: HLLValue = { type: 'hll', value: ['item1', 'item2', 'item3'] };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled HLLValue in ${mode} mode`);
      });

      it(`should handle GeoValue in ${mode} mode`, async () => {
        const identifier = `geo-value-${mode}`;
        const value: GeoValue = {
          type: 'geo',
          value: { 'New York': [40.7128, -74.006], London: [51.5074, -0.1278] },
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled GeoValue in ${mode} mode`);
      });

      it(`should handle JSONValue in ${mode} mode`, async () => {
        const identifier = `json-value-${mode}`;
        const value: JSONValue = {
          type: 'json',
          value: { nested: { array: [1, 2, 3], object: { key: 'value' } } },
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled JSONValue in ${mode} mode`);
      });

      it(`should handle EncryptedValue in ${mode} mode`, async () => {
        const identifier = `encrypted-value-${mode}`;
        const value: EncryptedValue = {
          type: 'encrypted',
          encryptedData: new Uint8Array([1, 2, 3, 4, 5]),
          iv: new Uint8Array([6, 7, 8, 9]),
          salt: new Uint8Array([10, 11, 12, 13]),
          authTag: new Uint8Array([14, 15, 16, 17]),
          encryptionKey: new Uint8Array([18, 19, 20, 21]),
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled EncryptedValue in ${mode} mode`);
      });

      it(`should handle null values in ${mode} mode`, async () => {
        const identifier = `null-value-${mode}`;
        const value = null;

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toBeNull();
        log(`Successfully handled null value in ${mode} mode`);
      });

      it(`should handle undefined values in ${mode} mode`, async () => {
        const identifier = `undefined-value-${mode}`;
        const value = undefined;

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toBeUndefined();
        log(`Successfully handled undefined value in ${mode} mode`);
      });

      it(`should handle complex nested structures in ${mode} mode`, async () => {
        const identifier = `complex-nested-${mode}`;
        const value = {
          string: 'test',
          number: 123,
          boolean: true,
          null: null,
          undefined: undefined,
          array: [1, 'two', { three: 3 }],
          object: {
            nested: {
              deep: [{ deeper: 'value' }],
            },
          },
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled complex nested structure in ${mode} mode`);
      });

      it(`should handle large data in ${mode} mode`, async () => {
        const identifier = `large-data-${mode}`;
        const value: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024) }; // 1MB string

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        log(`Successfully handled large data in ${mode} mode`);
      });

      it(`should handle Date objects in ${mode} mode`, async () => {
        const identifier = `date-object-${mode}`;
        const dateValue = new Date('2023-01-01T00:00:00Z');
        const value: JSONValue = {
          type: 'json',
          value: { date: dateValue.toISOString() },
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(value);
        expect(new Date(((result.value as JSONValue).value as { date: string }).date)).toEqual(
          dateValue,
        );
        log(`Successfully handled Date object in ${mode} mode`);
      });

      it(`should handle circular references gracefully in ${mode} mode`, async () => {
        const identifier = `circular-reference-${mode}`;
        const circularObj: JSONObject = { name: 'circular' };
        circularObj.self = circularObj;

        const value: JSONValue = {
          type: 'json',
          value: circularObj as JSONObject,
        };

        (set as jest.Mock).mockImplementation(() => {
          throw new Error('Circular reference detected');
        });

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow(
          'Circular reference detected',
        );

        log(`Successfully handled circular reference in ${mode} mode`);
      });

      it(`should handle Symbol properties gracefully in ${mode} mode`, async () => {
        const identifier = `symbol-property-${mode}`;
        const symbolKey = Symbol('testSymbol');
        const obj = { regularKey: 'value', [symbolKey]: 'symbol value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value: { regularKey: 'value' } });

        await set(identifier, storeName, obj, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual({ regularKey: 'value' });

        // Check that no Symbol properties exist on the result
        const resultSymbols = Object.getOwnPropertySymbols(result.value);
        expect(resultSymbols.length).toBe(0);

        log(`Successfully handled Symbol properties in ${mode} mode`);
      });
    });
  });

  it('should maintain type consistency across different cache modes', async () => {
    const identifier = 'cross-mode-type-consistency';
    const value: JSONValue = { type: 'json', value: { test: 'cross-mode consistency' } };

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, value, setMode);

      for (const getMode of modes) {
        (get as jest.Mock).mockResolvedValue({ value });
        const result = await get(identifier, storeName, getMode);
        expect(result.value).toEqual(value);
      }
    }

    log('Successfully maintained type consistency across different cache modes');
  });
});
