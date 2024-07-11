/**
 * @file context.ts
 * @description Provides functions for creating and using synchronous and asynchronous contexts in a caching system.
 */

import { Context, AsyncContext, ContextProvider, AsyncContextProvider } from '../../types';

/**
 * Creates a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {T} defaultValue The default value for the context
 * @param {(key: string) => T | undefined} getValue Function to get the value from the cache
 * @param {(key: string, value: T, expirationDate: Date) => void} setValue Function to set the value in the cache
 * @returns {Context<T>} The created context
 */
export function createContext<T>(
  key: string,
  defaultValue: T,
  getValue: (key: string) => T | undefined,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): Context<T> {
  const context: Context<T> = {
    key,
    Provider: createContextProvider(key, defaultValue, setValue),
    Consumer: (props) => props.children(getValue(key) ?? defaultValue),
  };
  return context;
}

/**
 * Creates an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {T} defaultValue The default value for the context
 * @param {(key: string) => Promise<T | undefined>} getValue Function to asynchronously get the value from the cache
 * @param {(key: string, value: T, expirationDate: Date) => void} setValue Function to set the value in the cache
 * @returns {AsyncContext<T>} The created asynchronous context
 */
export function createAsyncContext<T>(
  key: string,
  defaultValue: T,
  getValue: (key: string) => Promise<T | undefined>,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): AsyncContext<T> {
  const context: AsyncContext<T> = {
    key,
    Provider: createAsyncContextProvider(key, defaultValue, setValue),
    Consumer: (props) => {
      getValue(key).then((value) => props.children(value ?? defaultValue));
      return null;
    },
  };
  return context;
}

/**
 * Creates a provider for a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {T} defaultValue The default value for the context
 * @param {(key: string, value: T, expirationDate: Date) => void} setValue Function to set the value in the cache
 * @returns {ContextProvider<T>} The created context provider
 */
function createContextProvider<T>(
  key: string,
  defaultValue: T,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): ContextProvider<T> {
  return (props) => {
    const value = props.value !== undefined ? props.value : defaultValue;
    setValue(key, value, new Date(8640000000000000));
    return props.children;
  };
}

/**
 * Creates a provider for an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {T} defaultValue The default value for the context
 * @param {(key: string, value: T, expirationDate: Date) => void} setValue Function to set the value in the cache
 * @returns {AsyncContextProvider<T>} The created asynchronous context provider
 */
function createAsyncContextProvider<T>(
  key: string,
  defaultValue: T,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): AsyncContextProvider<T> {
  return async (props) => {
    const value = await (props.value !== undefined ? props.value : Promise.resolve(defaultValue));
    setValue(key, value, new Date(8640000000000000));
    return props.children;
  };
}

/**
 * Hook to use a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {(key: string) => T | undefined} getValue Function to get the value from the cache
 * @returns {T | undefined} The context value or undefined if not found
 */
export function useContext<T>(
  key: string,
  getValue: (key: string) => T | undefined,
): T | undefined {
  return getValue(key);
}

/**
 * Hook to use an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} key The unique key for the context
 * @param {(key: string) => Promise<T | undefined>} getValue Function to asynchronously get the value from the cache
 * @returns {Promise<T | undefined>} A promise that resolves to the context value or undefined if not found
 */
export function useAsyncContext<T>(
  key: string,
  getValue: (key: string) => Promise<T | undefined>,
): Promise<T | undefined> {
  return getValue(key);
}
