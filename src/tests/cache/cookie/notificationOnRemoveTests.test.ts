import { jest } from '@jest/globals';
import { StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache notification on remove tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('notificationOnRemoveTests.log', 'cookie');
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

  it('should notify subscribers when an item is removed', async () => {
    log('Starting test: should notify subscribers when an item is removed');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    const notificationPromise = new Promise<void>((resolve) => {
      const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', (data) => {
        expect(data).toBeUndefined();
        unsubscribe();
        log('Subscriber notified of removal');
        resolve();
      });
      log('Subscriber added');
    });

    cookieCache.remove('testKey', 'testStore');
    log('Item removed from cache');

    await notificationPromise;
  });

  it('should not notify unsubscribed listeners', async () => {
    log('Starting test: should not notify unsubscribed listeners');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    const listener = jest.fn();
    const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', listener);
    log('Listener subscribed');

    unsubscribe();
    log('Listener unsubscribed');

    cookieCache.remove('testKey', 'testStore');
    log('Item removed from cache');

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    expect(listener).not.toHaveBeenCalled();
    log('Verified that unsubscribed listener was not called');
  });

  it('should notify multiple subscribers when an item is removed', async () => {
    log('Starting test: should notify multiple subscribers when an item is removed');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    const notificationPromises = [1, 2, 3].map(
      (index) =>
        new Promise<void>((resolve) => {
          const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', (data) => {
            expect(data).toBeUndefined();
            unsubscribe();
            log(`Subscriber ${index} notified of removal`);
            resolve();
          });
          log(`Subscriber ${index} added`);
        }),
    );

    cookieCache.remove('testKey', 'testStore');
    log('Item removed from cache');

    await Promise.all(notificationPromises);
    log('All subscribers notified');
  });
});
