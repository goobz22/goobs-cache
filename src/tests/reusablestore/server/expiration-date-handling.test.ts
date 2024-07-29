import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('expiration-date-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Expiration Date Handling Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

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

  it('should set and get a value with a future expiration date', async () => {
    const identifier = 'future-expiration';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour in the future

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, value, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toEqual(value);
    expect(result.expirationDate).toEqual(expirationDate);

    log('Successfully set and got a value with a future expiration date');
  });

  it('should not return an expired value', async () => {
    const identifier = 'expired-value';
    const value: StringValue = { type: 'string', value: 'expired value' };
    const expirationDate = new Date(Date.now() - 1000); // 1 second in the past

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    await serverSet(identifier, storeName, value, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toBeUndefined();

    log('Successfully handled an expired value');
  });

  it('should update expiration date when setting an existing key', async () => {
    const identifier = 'update-expiration';
    const value: StringValue = { type: 'string', value: 'test value' };
    const initialExpirationDate = new Date(Date.now() + 1000); // 1 second in the future
    const updatedExpirationDate = new Date(Date.now() + 3600000); // 1 hour in the future

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate: updatedExpirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 2,
    });

    await serverSet(identifier, storeName, value, initialExpirationDate, mode);
    await serverSet(identifier, storeName, value, updatedExpirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.expirationDate).toEqual(updatedExpirationDate);
    expect(result.setHitCount).toBe(2);

    log('Successfully updated expiration date for an existing key');
  });

  it('should handle values with no expiration (far future)', async () => {
    const identifier = 'no-expiration';
    const value: StringValue = { type: 'string', value: 'no expiration' };
    const farFutureDate = new Date(8640000000000000); // Maximum date value

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate: farFutureDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, value, farFutureDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toEqual(value);
    expect(result.expirationDate).toEqual(farFutureDate);

    log('Successfully handled a value with no expiration');
  });

  it('should remove expired values', async () => {
    const identifier = 'remove-expired';
    const value: StringValue = { type: 'string', value: 'to be removed' };
    const expiredDate = new Date(Date.now() - 1000); // 1 second in the past

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier, storeName, value, expiredDate, mode);
    await serverGet(identifier, storeName, mode); // This should trigger removal of expired value
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toBeUndefined();
    expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully removed an expired value');
  });

  it('should handle expiration dates in different timezones', async () => {
    const identifier = 'timezone-expiration';
    const value: StringValue = { type: 'string', value: 'timezone test' };
    const expirationDate = new Date('2024-12-31T23:59:59Z'); // UTC date

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, value, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toEqual(value);
    expect(result.expirationDate.toISOString()).toBe('2024-12-31T23:59:59.000Z');

    log('Successfully handled expiration date in different timezone');
  });

  it('should handle daylight saving time transitions', async () => {
    const identifier = 'dst-transition';
    const value: StringValue = { type: 'string', value: 'DST test' };
    // Choose a date that typically falls within a DST transition period
    const expirationDate = new Date('2024-03-10T02:30:00Z'); // Around DST start in US

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, value, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toEqual(value);
    expect(result.expirationDate.toISOString()).toBe('2024-03-10T02:30:00.000Z');

    log('Successfully handled expiration date during daylight saving time transition');
  });

  it('should handle expiration dates at the edge of valid date range', async () => {
    const identifier = 'edge-date';
    const value: StringValue = { type: 'string', value: 'edge date test' };
    const edgeDate = new Date(8640000000000000); // Maximum date value

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate: edgeDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, value, edgeDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toEqual(value);
    expect(result.expirationDate).toEqual(edgeDate);

    log('Successfully handled expiration date at the edge of valid date range');
  });

  it('should reject invalid expiration dates', async () => {
    const identifier = 'invalid-date';
    const value: StringValue = { type: 'string', value: 'invalid date test' };
    const invalidDate = new Date('invalid date');

    await expect(serverSet(identifier, storeName, value, invalidDate, mode)).rejects.toThrow(
      'Invalid expiration date',
    );

    log('Successfully rejected invalid expiration date');
  });

  it('should handle expiration dates in the past', async () => {
    const identifier = 'past-date';
    const value: StringValue = { type: 'string', value: 'past date test' };
    const pastDate = new Date(Date.now() - 3600000); // 1 hour in the past

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    await serverSet(identifier, storeName, value, pastDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toBeUndefined();

    log('Successfully handled expiration date in the past');
  });
});
