import { set, get } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

const logStream: WriteStream = createLogStream('expiration-date-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Expiration Date Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Expiration Date Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should set and get a value with a future expiration date in ${mode} mode`, async () => {
        const identifier = `future-expiration-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };
        const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

        await set(identifier, storeName, value, mode, expirationDate);

        const mockResult: CacheResult = {
          identifier,
          storeName,
          value,
          expirationDate,
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 1,
        };

        (get as jest.Mock).mockResolvedValue(mockResult);

        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result).toEqual(mockResult);

        log(`Successfully set and got a value with a future expiration date in ${mode} mode`);
      });

      it(`should handle an expired value in ${mode} mode`, async () => {
        const identifier = `expired-value-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };
        const expiredDate = new Date(Date.now() - 1000); // 1 second ago

        await set(identifier, storeName, value, mode, expiredDate);

        const mockResult: CacheResult = {
          identifier,
          storeName,
          value: undefined,
          expirationDate: expiredDate,
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 1,
        };

        (get as jest.Mock).mockResolvedValue(mockResult);

        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expiredDate);
        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toBeUndefined();

        log(`Successfully handled an expired value in ${mode} mode`);
      });

      it(`should update expiration date when setting an existing value in ${mode} mode`, async () => {
        const identifier = `update-expiration-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };
        const initialExpirationDate = new Date(Date.now() + 3600000); // 1 hour from now
        const updatedExpirationDate = new Date(Date.now() + 7200000); // 2 hours from now

        await set(identifier, storeName, value, mode, initialExpirationDate);
        await set(identifier, storeName, value, mode, updatedExpirationDate);

        const mockResult: CacheResult = {
          identifier,
          storeName,
          value,
          expirationDate: updatedExpirationDate,
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 2,
        };

        (get as jest.Mock).mockResolvedValue(mockResult);

        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledTimes(2);
        expect(set).toHaveBeenLastCalledWith(
          identifier,
          storeName,
          value,
          mode,
          updatedExpirationDate,
        );
        expect(result.expirationDate).toEqual(updatedExpirationDate);

        log(`Successfully updated expiration date when setting an existing value in ${mode} mode`);
      });

      it(`should handle a value with no expiration date in ${mode} mode`, async () => {
        const identifier = `no-expiration-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        await set(identifier, storeName, value, mode);

        const mockResult: CacheResult = {
          identifier,
          storeName,
          value,
          expirationDate: expect.any(Date),
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 1,
        };

        (get as jest.Mock).mockResolvedValue(mockResult);

        const result = await get(identifier, storeName, mode);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
        expect(result.value).toEqual(value);

        log(`Successfully handled a value with no expiration date in ${mode} mode`);
      });
    });
  });

  it('should maintain consistent expiration date behavior across all modes', async () => {
    const identifier = 'cross-mode-expiration';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    for (const setMode of modes) {
      await set(identifier, storeName, value, setMode, expirationDate);

      for (const getMode of modes) {
        const mockResult: CacheResult = {
          identifier,
          storeName,
          value,
          expirationDate,
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 1,
        };

        (get as jest.Mock).mockResolvedValue(mockResult);

        const result = await get(identifier, storeName, getMode);

        expect(result.expirationDate).toEqual(expirationDate);
      }
    }

    log('Successfully maintained consistent expiration date behavior across all modes');
  });
});
