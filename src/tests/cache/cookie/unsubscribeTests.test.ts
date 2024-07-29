import { jest } from '@jest/globals';
import { StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache unsubscribe tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('unsubscribeTests.log', 'cookie');
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

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('should stop notifying after unsubscribe', async () => {
    log('Starting test: should stop notifying after unsubscribe');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial data set');

    const listener = jest.fn();
    const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', listener);
    log('Listener subscribed');

    await cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Data updated');

    await wait(0); // Wait for any pending promises to resolve

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(updatedData);
    log('Listener called as expected');

    unsubscribe();
    log('Listener unsubscribed');

    await cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Data updated again');

    await wait(0); // Wait for any pending promises to resolve

    expect(listener).toHaveBeenCalledTimes(1);
    log('Listener not called after unsubscribe');
  });

  it('should allow resubscribing after unsubscribe', async () => {
    log('Starting test: should allow resubscribing after unsubscribe');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial data set');

    const listener = jest.fn();
    const unsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', listener);
    log('Listener subscribed');

    unsubscribe();
    log('Listener unsubscribed');

    const newUnsubscribe = cookieCache.subscribeToUpdates('testKey', 'testStore', listener);
    log('Listener resubscribed');

    await cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Data updated');

    await wait(0); // Wait for any pending promises to resolve

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(updatedData);
    log('Listener called as expected after resubscribe');

    newUnsubscribe();
    log('Listener unsubscribed again');
  });

  it('should handle multiple unsubscribes correctly', async () => {
    log('Starting test: should handle multiple unsubscribes correctly');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial data set');

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsubscribe1 = cookieCache.subscribeToUpdates('testKey', 'testStore', listener1);
    const unsubscribe2 = cookieCache.subscribeToUpdates('testKey', 'testStore', listener2);
    log('Two listeners subscribed');

    unsubscribe1();
    log('First listener unsubscribed');

    await cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Data updated');

    await wait(0); // Wait for any pending promises to resolve

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(updatedData);
    log('Only second listener called as expected');

    unsubscribe2();
    log('Second listener unsubscribed');
  });
});
