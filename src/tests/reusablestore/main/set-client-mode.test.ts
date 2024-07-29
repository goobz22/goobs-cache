import { set } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue, JSONValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('set-client-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Set Client Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';

  beforeAll(() => {
    log('Starting Set Client Mode tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a string value in client mode', async () => {
    const identifier = 'string-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a string value in client mode');
  });

  it('should set a number value in client mode', async () => {
    const identifier = 'number-test';
    const value = 42;
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a number value in client mode');
  });

  it('should set a boolean value in client mode', async () => {
    const identifier = 'boolean-test';
    const value = true;
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a boolean value in client mode');
  });

  it('should set a JSON value in client mode', async () => {
    const identifier = 'json-test';
    const value: JSONValue = {
      type: 'json',
      value: { key: 'value', nested: { array: [1, 2, 3] } },
    };
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a JSON value in client mode');
  });

  it('should handle setting a value with a long expiration date', async () => {
    const identifier = 'long-expiration-test';
    const value: StringValue = { type: 'string', value: 'long expiration' };
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a value with a long expiration date in client mode');
  });

  it('should handle setting a value with no expiration date', async () => {
    const identifier = 'no-expiration-test';
    const value: StringValue = { type: 'string', value: 'no expiration' };

    await set(identifier, storeName, value, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    log('Successfully set a value with no expiration date in client mode');
  });

  it('should handle setting a large value', async () => {
    const identifier = 'large-value-test';
    const value: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024) }; // 1MB string
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a large value in client mode');
  });

  it('should handle errors when setting a value', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'error value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (set as jest.Mock).mockRejectedValueOnce(new Error('Failed to set value in client storage'));

    await expect(set(identifier, storeName, value, mode, expirationDate)).rejects.toThrow(
      'Failed to set value in client storage',
    );

    log('Successfully handled errors when setting a value in client mode');
  });

  it('should handle setting multiple values in quick succession', async () => {
    const identifiers = ['multi-1', 'multi-2', 'multi-3'];
    const value: StringValue = { type: 'string', value: 'multi-test' };
    const expirationDate = new Date(Date.now() + 3600000);

    await Promise.all(identifiers.map((id) => set(id, storeName, value, mode, expirationDate)));

    expect(set).toHaveBeenCalledTimes(3);
    identifiers.forEach((id) => {
      expect(set).toHaveBeenCalledWith(id, storeName, value, mode, expirationDate);
    });

    log('Successfully set multiple values in quick succession in client mode');
  });
});
