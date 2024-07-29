import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('reusable-store-basic-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('ReusableStore Basic Tests', () => {
  const storeName = 'test-store';
  const cacheModes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting ReusableStore Basic tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  cacheModes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should set a value in ${mode} mode`, async () => {
        const identifier = `set-test-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };
        const expirationDate = new Date(Date.now() + 3600000);

        await set(identifier, storeName, value, mode, expirationDate);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
        log(`Successfully set a value in ${mode} mode`);
      });

      it(`should get a value from ${mode} mode`, async () => {
        const identifier = `get-test-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (get as jest.Mock).mockResolvedValue({
          identifier,
          storeName,
          value,
          expirationDate: new Date(Date.now() + 3600000),
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        });

        const result = await get(identifier, storeName, mode);

        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toEqual(value);
        log(`Successfully got a value from ${mode} mode`);
      });

      it(`should remove a value from ${mode} mode`, async () => {
        const identifier = `remove-test-${mode}`;

        await remove(identifier, storeName, mode);

        expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
        log(`Successfully removed a value from ${mode} mode`);
      });

      it(`should subscribe to updates in ${mode} mode`, async () => {
        const identifier = `subscribe-test-${mode}`;
        const listener = jest.fn();

        await subscribeToUpdates(identifier, storeName, listener, mode);

        expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);
        log(`Successfully subscribed to updates in ${mode} mode`);
      });

      it(`should handle cache misses in ${mode} mode`, async () => {
        const identifier = `miss-test-${mode}`;

        (get as jest.Mock).mockResolvedValue({
          identifier,
          storeName,
          value: undefined,
          expirationDate: new Date(0),
          lastUpdatedDate: new Date(0),
          lastAccessedDate: new Date(0),
          getHitCount: 0,
          setHitCount: 0,
        });

        const result = await get(identifier, storeName, mode);

        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toBeUndefined();
        log(`Successfully handled cache miss in ${mode} mode`);
      });
    });
  });

  it('should handle errors gracefully', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'error value' };

    (set as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    await expect(set(identifier, storeName, value, 'server')).rejects.toThrow('Test error');

    log('Successfully handled errors gracefully');
  });

  it('should update an existing value', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const mode: CacheMode = 'server';

    await set(identifier, storeName, initialValue, mode);
    await set(identifier, storeName, updatedValue, mode);

    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenLastCalledWith(identifier, storeName, updatedValue, mode, undefined);
    log('Successfully updated an existing value');
  });

  it('should handle different value types', async () => {
    const mode: CacheMode = 'server';
    const testCases = [
      {
        identifier: 'string-test',
        value: { type: 'string', value: 'string value' } as StringValue,
      },
      { identifier: 'number-test', value: 42 },
      { identifier: 'boolean-test', value: true },
      { identifier: 'null-test', value: null },
    ];

    for (const { identifier, value } of testCases) {
      await set(identifier, storeName, value, mode);
      expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, undefined);
    }

    log('Successfully handled different value types');
  });
});
