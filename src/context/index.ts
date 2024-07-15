/**
 * @file context.ts
 * @description Provides functions for creating and using synchronous and asynchronous contexts in a caching system.
 */

import React from 'react';
import {
  Context,
  AsyncContext,
  ContextProvider,
  AsyncContextProvider,
  DataValue,
  StringValue,
  ListValue,
  SetValue,
  HashValue,
  StreamValue,
  ZSetValue,
  HLLValue,
  GeoValue,
  JSONValue,
} from '../types';

type ContextValue =
  | DataValue
  | StringValue
  | ListValue
  | SetValue
  | HashValue
  | StreamValue
  | ZSetValue
  | HLLValue
  | GeoValue
  | JSONValue;

/**
 * Creates a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {T} defaultValue The default value for the context
 * @param {(identifier: string, storeName: string) => Promise<T | undefined>} getValue Function to get the value from the cache
 * @param {(identifier: string, value: T, expirationDate: Date, storeName: string) => Promise<void>} setValue Function to set the value in the cache
 * @returns {Context<T>} The created context
 */
export function createContext<T extends ContextValue>(
  identifier: string,
  storeName: string,
  defaultValue: T,
  getValue: (identifier: string, storeName: string) => Promise<T | undefined>,
  setValue: (
    identifier: string,
    value: T,
    expirationDate: Date,
    storeName: string,
  ) => Promise<void>,
): Context<T> {
  const context: Context<T> = {
    identifier,
    storeName,
    Provider: createContextProvider(identifier, storeName, defaultValue, setValue),
    Consumer: (props: { children: (value: T) => React.ReactNode }) => {
      getValue(identifier, storeName).then((value) => props.children(value ?? defaultValue));
      return null;
    },
  };
  return context;
}

/**
 * Creates an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {T} defaultValue The default value for the context
 * @param {(identifier: string, storeName: string) => Promise<T | undefined>} getValue Function to asynchronously get the value from the cache
 * @param {(identifier: string, value: T, expirationDate: Date, storeName: string) => Promise<void>} setValue Function to set the value in the cache
 * @returns {AsyncContext<T>} The created asynchronous context
 */
export function createAsyncContext<T extends ContextValue>(
  identifier: string,
  storeName: string,
  defaultValue: T,
  getValue: (identifier: string, storeName: string) => Promise<T | undefined>,
  setValue: (
    identifier: string,
    value: T,
    expirationDate: Date,
    storeName: string,
  ) => Promise<void>,
): AsyncContext<T> {
  const context: AsyncContext<T> = {
    identifier,
    storeName,
    Provider: createAsyncContextProvider(identifier, storeName, defaultValue, setValue),
    Consumer: (props: { children: (value: T) => React.ReactNode }) => {
      getValue(identifier, storeName).then((value) => props.children(value ?? defaultValue));
      return null;
    },
  };
  return context;
}

/**
 * Creates a provider for a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {T} defaultValue The default value for the context
 * @param {(identifier: string, value: T, expirationDate: Date, storeName: string) => Promise<void>} setValue Function to set the value in the cache
 * @returns {ContextProvider<T>} The created context provider
 */
function createContextProvider<T extends ContextValue>(
  identifier: string,
  storeName: string,
  defaultValue: T,
  setValue: (
    identifier: string,
    value: T,
    expirationDate: Date,
    storeName: string,
  ) => Promise<void>,
): ContextProvider<T> {
  return (props: { value?: T; children: React.ReactNode }) => {
    const value = props.value !== undefined ? props.value : defaultValue;
    setValue(identifier, value, new Date(8640000000000000), storeName);
    return props.children;
  };
}

/**
 * Creates a provider for an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {T} defaultValue The default value for the context
 * @param {(identifier: string, value: T, expirationDate: Date, storeName: string) => Promise<void>} setValue Function to set the value in the cache
 * @returns {AsyncContextProvider<T>} The created asynchronous context provider
 */
function createAsyncContextProvider<T extends ContextValue>(
  identifier: string,
  storeName: string,
  defaultValue: T,
  setValue: (
    identifier: string,
    value: T,
    expirationDate: Date,
    storeName: string,
  ) => Promise<void>,
): AsyncContextProvider<T> {
  return async (props: { value?: Promise<T>; children: React.ReactNode }) => {
    const value = await (props.value !== undefined ? props.value : Promise.resolve(defaultValue));
    await setValue(identifier, value, new Date(8640000000000000), storeName);
    return props.children;
  };
}

/**
 * Hook to use a synchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {(identifier: string, storeName: string) => Promise<T | undefined>} getValue Function to get the value from the cache
 * @returns {Promise<T | undefined>} A promise that resolves to the context value or undefined if not found
 */
export function useContext<T extends ContextValue>(
  identifier: string,
  storeName: string,
  getValue: (identifier: string, storeName: string) => Promise<T | undefined>,
): Promise<T | undefined> {
  return getValue(identifier, storeName);
}

/**
 * Hook to use an asynchronous context.
 *
 * @template T The type of the context value
 * @param {string} identifier The identifier for the context
 * @param {string} storeName The store name for the context
 * @param {(identifier: string, storeName: string) => Promise<T | undefined>} getValue Function to asynchronously get the value from the cache
 * @returns {Promise<T | undefined>} A promise that resolves to the context value or undefined if not found
 */
export function useAsyncContext<T extends ContextValue>(
  identifier: string,
  storeName: string,
  getValue: (identifier: string, storeName: string) => Promise<T | undefined>,
): Promise<T | undefined> {
  return getValue(identifier, storeName);
}
