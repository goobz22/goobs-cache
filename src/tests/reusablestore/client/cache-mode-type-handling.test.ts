import { clientSet, clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import {
  CacheMode,
  CacheResult,
  StringValue,
  ListValue,
  SetValue,
  HashValue,
  StreamValue,
  ZSetValue,
  HLLValue,
  GeoValue,
  JSONValue,
} from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('cache-mode-type-handling-test.log');
const log = createLogger(logStream);

describe('Cache Mode Type Handling Tests', () => {
  const modes: CacheMode[] = ['client', 'cookie'];
  const storeName = 'test-store';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Cache Mode Type Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle StringValue correctly', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`StringValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle ListValue correctly', async () => {
    const identifier = 'list-test';
    const testValue: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`ListValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle SetValue correctly', async () => {
    const identifier = 'set-test';
    const testValue: SetValue = { type: 'set', value: ['unique1', 'unique2', 'unique3'] };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`SetValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle HashValue correctly', async () => {
    const identifier = 'hash-test';
    const testValue: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`HashValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle StreamValue correctly', async () => {
    const identifier = 'stream-test';
    const testValue: StreamValue = {
      type: 'stream',
      value: [
        { id: '1-0', fields: { name: 'John', age: '30' } },
        { id: '2-0', fields: { name: 'Jane', age: '28' } },
      ],
    };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`StreamValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle ZSetValue correctly', async () => {
    const identifier = 'zset-test';
    const testValue: ZSetValue = { type: 'zset', value: { member1: 1, member2: 2, member3: 3 } };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`ZSetValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle HLLValue correctly', async () => {
    const identifier = 'hll-test';
    const testValue: HLLValue = { type: 'hll', value: ['item1', 'item2', 'item3'] };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`HLLValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle GeoValue correctly', async () => {
    const identifier = 'geo-test';
    const testValue: GeoValue = {
      type: 'geo',
      value: { 'New York': [40.7128, -74.006], 'Los Angeles': [34.0522, -118.2437] },
    };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`GeoValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle JSONValue correctly', async () => {
    const identifier = 'json-test';
    const testValue: JSONValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        isStudent: false,
        hobbies: ['reading', 'swimming'],
        address: {
          street: '123 Main St',
          city: 'Anytown',
          country: 'USA',
        },
      },
    };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`JSONValue test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle complex nested structures', async () => {
    const identifier = 'complex-test';
    const testValue: JSONValue = {
      type: 'json',
      value: {
        user: {
          name: 'Alice',
          age: 28,
          preferences: {
            colors: ['blue', 'green'],
            notifications: {
              email: true,
              sms: false,
            },
          },
        },
        posts: [
          {
            id: 1,
            title: 'First Post',
            comments: [
              { user: 'Bob', text: 'Great post!' },
              { user: 'Charlie', text: 'I agree' },
            ],
          },
          {
            id: 2,
            title: 'Second Post',
            comments: [],
          },
        ],
      },
    };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Complex nested structure test for ${mode} mode: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle undefined values', async () => {
    const identifier = 'undefined-test';
    const testValue = undefined;

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Undefined value test for ${mode} mode: ${result.value}`);
      expect(result.value).toBeUndefined();
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should handle null values', async () => {
    const identifier = 'null-test';
    const testValue = null;

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Null value test for ${mode} mode: ${result.value}`);
      expect(result.value).toBeNull();
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
    }
  });
});
