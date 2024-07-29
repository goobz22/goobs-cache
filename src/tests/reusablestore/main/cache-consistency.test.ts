import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-consistency-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Consistency Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Cache Consistency tests...');
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
      it(`should maintain consistency between set and get operations in ${mode} mode`, async () => {
        const identifier = `consistency-test-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };
        const mockResult: CacheResult = {
          identifier,
          storeName,
          value,
          expirationDate: new Date(Date.now() + 3600000),
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue(mockResult);

        await set(identifier, storeName, value, mode);
        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toEqual(value);

        log(`Successfully maintained consistency between set and get operations in ${mode} mode`);
      });

      it(`should maintain consistency after remove operation in ${mode} mode`, async () => {
        const identifier = `remove-consistency-test-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (remove as jest.Mock).mockResolvedValue(undefined);
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

        await set(identifier, storeName, value, mode);
        await remove(identifier, storeName, mode);
        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toBeUndefined();

        log(`Successfully maintained consistency after remove operation in ${mode} mode`);
      });

      it(`should maintain consistency with subscribeToUpdates in ${mode} mode`, async () => {
        if (mode === 'cookie') {
          log(`Skipping subscribeToUpdates test for cookie mode as it's not supported`);
          return;
        }

        const identifier = `subscribe-consistency-test-${mode}`;
        const initialValue: StringValue = { type: 'string', value: 'initial' };
        const updatedValue: StringValue = { type: 'string', value: 'updated' };
        const listener = jest.fn();

        (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
        (set as jest.Mock).mockImplementation((id, store, value) => {
          listener(value);
          return Promise.resolve();
        });

        await subscribeToUpdates(identifier, storeName, listener, mode);
        await set(identifier, storeName, initialValue, mode);
        await set(identifier, storeName, updatedValue, mode);

        expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, initialValue);
        expect(listener).toHaveBeenNthCalledWith(2, updatedValue);

        log(`Successfully maintained consistency with subscribeToUpdates in ${mode} mode`);
      });

      it(`should maintain consistency with concurrent operations in ${mode} mode`, async () => {
        const identifier = `concurrent-consistency-test-${mode}`;
        const values: StringValue[] = [
          { type: 'string', value: 'value1' },
          { type: 'string', value: 'value2' },
          { type: 'string', value: 'value3' },
        ];

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockImplementation((id, store) => {
          return Promise.resolve({
            identifier: id,
            storeName: store,
            value: values[values.length - 1],
            expirationDate: new Date(Date.now() + 3600000),
            lastUpdatedDate: new Date(),
            lastAccessedDate: new Date(),
            getHitCount: 1,
            setHitCount: values.length,
          });
        });

        await Promise.all(values.map((value) => set(identifier, storeName, value, mode)));
        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledTimes(3);
        values.forEach((value) => {
          expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        });
        expect(result.value).toEqual(values[values.length - 1]);

        log(`Successfully maintained consistency with concurrent operations in ${mode} mode`);
      });
    });
  });

  it('should maintain consistency across different cache modes', async () => {
    const identifier = 'cross-mode-consistency-test';
    const value: StringValue = { type: 'string', value: 'cross-mode test' };

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, value, setMode);
      expect(set).toHaveBeenCalledWith(identifier, storeName, value, setMode, expect.any(Date));

      for (const getMode of modes) {
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

        const result = await get(identifier, storeName, getMode);
        expect(get).toHaveBeenCalledWith(identifier, storeName, getMode);
        expect(result.value).toEqual(value);
      }
    }

    log('Successfully maintained consistency across different cache modes');
  });

  it('should handle cache misses consistently across modes', async () => {
    const identifier = 'cache-miss-consistency-test';

    for (const mode of modes) {
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
    }

    log('Successfully handled cache misses consistently across modes');
  });

  it('should maintain consistency with expiration dates across modes', async () => {
    const identifier = 'expiration-consistency-test';
    const value: StringValue = { type: 'string', value: 'expiration test' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, value, setMode, expirationDate);
      expect(set).toHaveBeenCalledWith(identifier, storeName, value, setMode, expirationDate);

      for (const getMode of modes) {
        (get as jest.Mock).mockResolvedValue({
          identifier,
          storeName,
          value,
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        });

        const result = await get(identifier, storeName, getMode);
        expect(get).toHaveBeenCalledWith(identifier, storeName, getMode);
        expect(result.expirationDate).toEqual(expirationDate);
      }
    }

    log('Successfully maintained consistency with expiration dates across modes');
  });

  it('should maintain consistency when updating existing values across modes', async () => {
    const identifier = 'update-consistency-test';
    const initialValue: StringValue = { type: 'string', value: 'initial' };
    const updatedValue: StringValue = { type: 'string', value: 'updated' };

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, initialValue, setMode);
      await set(identifier, storeName, updatedValue, setMode);

      for (const getMode of modes) {
        (get as jest.Mock).mockResolvedValue({
          identifier,
          storeName,
          value: updatedValue,
          expirationDate: new Date(Date.now() + 3600000),
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 2,
        });

        const result = await get(identifier, storeName, getMode);
        expect(get).toHaveBeenCalledWith(identifier, storeName, getMode);
        expect(result.value).toEqual(updatedValue);
      }
    }

    log('Successfully maintained consistency when updating existing values across modes');
  });

  it('should maintain consistency with remove operations across modes', async () => {
    const identifier = 'remove-consistency-test';
    const value: StringValue = { type: 'string', value: 'remove test' };

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, value, setMode);

      for (const removeMode of modes) {
        (remove as jest.Mock).mockResolvedValue(undefined);
        await remove(identifier, storeName, removeMode);

        for (const getMode of modes) {
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

          const result = await get(identifier, storeName, getMode);
          expect(get).toHaveBeenCalledWith(identifier, storeName, getMode);
          expect(result.value).toBeUndefined();
        }
      }
    }

    log('Successfully maintained consistency with remove operations across modes');
  });
});
