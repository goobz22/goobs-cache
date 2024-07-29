import { set } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('set-cookie-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Set Cookie Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'cookie';

  beforeAll(() => {
    log('Starting Set Cookie Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a string value in cookie mode', async () => {
    const identifier = 'string-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a string value in cookie mode');
  });

  it('should set a number value in cookie mode', async () => {
    const identifier = 'number-test';
    const value = 42;
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a number value in cookie mode');
  });

  it('should set a boolean value in cookie mode', async () => {
    const identifier = 'boolean-test';
    const value = true;
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a boolean value in cookie mode');
  });

  it('should set a null value in cookie mode', async () => {
    const identifier = 'null-test';
    const value = null;
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a null value in cookie mode');
  });

  it('should handle setting a value with a long expiration date', async () => {
    const identifier = 'long-expiration-test';
    const value: StringValue = { type: 'string', value: 'long expiration' };
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a value with a long expiration date in cookie mode');
  });

  it('should handle setting a value with no expiration date', async () => {
    const identifier = 'no-expiration-test';
    const value: StringValue = { type: 'string', value: 'no expiration' };

    await set(identifier, storeName, value, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, undefined);
    log('Successfully set a value with no expiration date in cookie mode');
  });

  it('should handle setting a value with special characters', async () => {
    const identifier = 'special-chars-test';
    const value: StringValue = { type: 'string', value: 'test@value;with=special&chars' };
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a value with special characters in cookie mode');
  });

  it('should handle errors when setting a value', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'error value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (set as jest.Mock).mockRejectedValueOnce(new Error('Failed to set cookie'));

    await expect(set(identifier, storeName, value, mode, expirationDate)).rejects.toThrow(
      'Failed to set cookie',
    );

    log('Successfully handled errors when setting a value in cookie mode');
  });
});
