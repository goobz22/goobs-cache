import { jest } from '@jest/globals';
import { StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache subscribeToUpdates tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('subscribeToUpdatesTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should notify subscribers when a value is updated', async () => {
    log('Starting test: should notify subscribers when a value is updated');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial value set in cache');

    const updatePromise = new Promise<void>((resolve) => {
      const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', (data) => {
        expect(data).toEqual(updatedData);
        log('Subscriber notified with updated value');
        unsubscribe();
        resolve();
      });
    });

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Updated value set in cache');

    await updatePromise;
  });

  it('should not notify unsubscribed listeners', async () => {
    log('Starting test: should not notify unsubscribed listeners');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial value set in cache');

    const listener = jest.fn();
    const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', listener);
    unsubscribe();
    log('Listener unsubscribed');

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Updated value set in cache');

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    expect(listener).not.toHaveBeenCalled();
    log('Unsubscribed listener not notified');
  });

  it('should notify multiple subscribers', async () => {
    log('Starting test: should notify multiple subscribers');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial value set in cache');

    const updatePromises = [1, 2, 3].map(
      (index) =>
        new Promise<void>((resolve) => {
          const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', (data) => {
            expect(data).toEqual(updatedData);
            log(`Subscriber ${index} notified with updated value`);
            unsubscribe();
            resolve();
          });
        }),
    );

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Updated value set in cache');

    await Promise.all(updatePromises);
    log('All subscribers notified');
  });
});
