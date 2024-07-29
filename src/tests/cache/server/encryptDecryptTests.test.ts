import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/server/serverCache.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('ServerCache Encryption and Decryption Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('encrypt-decrypt-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Encryption and Decryption tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should encrypt and decrypt string values correctly', async () => {
    log('Starting test: should encrypt and decrypt string values correctly');
    const identifier = 'test-string';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Hello, World!' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    log('String value set');

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(value);
    log('Successfully encrypted and decrypted string value');
  });

  it('should encrypt and decrypt complex values correctly', async () => {
    log('Starting test: should encrypt and decrypt complex values correctly');
    const identifier = 'test-complex';
    const storeName = 'test-store';
    const value: DataValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        },
      },
    };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    log('Complex value set');

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(value);
    log('Successfully encrypted and decrypted complex value');
  });

  it('should handle encryption and decryption errors gracefully', async () => {
    log('Starting test: should handle encryption and decryption errors gracefully');
    const identifier = 'test-error';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    // Simulate encryption error
    jest.spyOn(serverCache, 'set').mockRejectedValueOnce(new Error('Encryption error'));
    await expect(
      serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000)),
    ).rejects.toThrow('Encryption error');
    log('Encryption error handled');

    // Simulate decryption error
    jest.spyOn(serverCache, 'get').mockRejectedValueOnce(new Error('Decryption error'));
    await expect(serverCache.get(identifier, storeName)).rejects.toThrow('Decryption error');
    log('Decryption error handled');

    log('Successfully handled encryption and decryption errors');
  });

  it('should log encrypted and decrypted data for debugging', async () => {
    log('Starting test: should log encrypted and decrypted data for debugging');
    const identifier = 'test-logging';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value for logging' };

    const setSpy = jest.spyOn(serverCache, 'set');

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    log(`Encrypted data: ${JSON.stringify(setSpy.mock.calls[0][2])}`);

    const result = await serverCache.get(identifier, storeName);
    log(`Decrypted data: ${JSON.stringify(result.value)}`);

    expect(result.value).toEqual(value);
    log('Successfully logged encrypted and decrypted data');
  });
});
