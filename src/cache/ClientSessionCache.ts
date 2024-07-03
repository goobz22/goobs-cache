'use client';

import {
  EncryptedValue,
  CacheItem,
  Listener,
  Selector,
  AtomGetter,
  AtomSetter,
  Atom,
  DerivedAtom,
  Context,
  ContextProvider,
  UseStateHook,
} from '../types';

/**
 * ClientSessionCache class provides a sophisticated caching and state management system.
 * It combines features of session storage, atom-based state, and Redux-like state management.
 * It also includes functionality similar to React's useContext and useState.
 */
class ClientSessionCache {
  private cache: Record<string, CacheItem<EncryptedValue>> = {};
  private listeners: Record<string, Set<Listener>> = {};
  private atoms: Record<string, Atom<any>> = {};
  private derivedAtoms: Record<string, DerivedAtom<any>> = {};
  private contexts: Record<string, Context<any>> = {};
  private batchedUpdates: Set<string> = new Set();
  private isBatchingUpdates = false;
  private devToolsEnabled = false;

  constructor() {
    this.loadFromSessionStorage();
  }

  /**
   * Loads the cache from session storage on initialization.
   */
  private loadFromSessionStorage() {
    const cacheString = sessionStorage.getItem('reusableStore');
    if (cacheString) {
      try {
        this.cache = JSON.parse(cacheString);
      } catch (error) {
        console.error('Failed to parse session cache', error);
      }
    }
  }

  /**
   * Saves the current cache state to session storage.
   */
  private saveToSessionStorage() {
    try {
      const cacheString = JSON.stringify(this.cache);
      sessionStorage.setItem('reusableStore', cacheString);
    } catch (error) {
      console.error('Failed to set session cache', error);
    }
  }

  /**
   * Notifies all listeners for a specific key about changes.
   * @param key The key for which to notify listeners.
   */
  private notifyListeners(key: string) {
    if (this.listeners[key]) {
      this.listeners[key].forEach((listener) => listener());
    }
  }

  /**
   * Starts batching updates to prevent unnecessary re-renders.
   */
  private batchStart() {
    this.isBatchingUpdates = true;
  }

  /**
   * Ends batching updates and notifies listeners of the batched changes.
   */
  private batchEnd() {
    this.isBatchingUpdates = false;
    this.batchedUpdates.forEach((key) => this.notifyListeners(key));
    this.batchedUpdates.clear();
  }

  /**
   * Updates the cache with a new value for a specific key.
   * @param key The key to update in the cache.
   * @param value The new value to set for the key.
   * @param expirationDate The expiration date for the cache item.
   */
  private updateCache(key: string, value: EncryptedValue, expirationDate: Date) {
    this.cache[key] = {
      value,
      lastAccessed: Date.now(),
      expirationDate,
      hitCount: 0,
      compressed: false,
      size: 0,
    };
    if (this.isBatchingUpdates) {
      this.batchedUpdates.add(key);
    } else {
      this.notifyListeners(key);
    }
    if (this.devToolsEnabled) {
      this.devToolsLog('update', key, value);
    }
  }

  /**
   * Retrieves a cache item from the client session cache by key.
   * @param key The key of the cache item to retrieve.
   * @returns The cache item if found and not expired, undefined otherwise.
   */
  getFromClientSessionCache(key: string): CacheItem<EncryptedValue> | undefined {
    const item = this.cache[key];
    if (item && new Date(item.expirationDate) > new Date()) {
      item.hitCount++;
      item.lastAccessed = Date.now();
      return item;
    }
    return undefined;
  }

  /**
   * Sets a value in the client session cache with a specific key and expiration date.
   * @param key The key to set in the cache.
   * @param value The value to set for the key.
   * @param expirationDate The expiration date for the cache item.
   */
  setToClientSessionCache(key: string, value: EncryptedValue, expirationDate: Date): void {
    this.updateCache(key, value, expirationDate);
    this.saveToSessionStorage();
  }

  /**
   * Removes a cache item from the client session cache by key.
   * @param key The key of the cache item to remove.
   */
  removeFromClientSessionCache(key: string): void {
    delete this.cache[key];
    this.saveToSessionStorage();
    this.notifyListeners(key);
    if (this.devToolsEnabled) {
      this.devToolsLog('remove', key);
    }
  }

  /**
   * Creates an atom with a specific key and initial value.
   * @template T The type of the atom value.
   * @param key The unique key for the atom.
   * @param initialValue The initial value for the atom.
   * @returns The created atom.
   */
  createAtom<T>(key: string, initialValue: T): Atom<T> {
    if (!this.atoms[key]) {
      const atomGetter: AtomGetter = <U>(atom: Atom<U>) => {
        const value = this.getFromClientSessionCache(key)?.value;
        return value as U;
      };

      const atomSetter: AtomSetter = <U>(atom: Atom<U>, valueOrUpdater: U | ((prev: U) => U)) => {
        const currentValue = atomGetter(atom);
        const newValue =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (prev: U) => U)(currentValue)
            : valueOrUpdater;
        this.setToClientSessionCache(
          key,
          newValue as unknown as EncryptedValue,
          new Date(8640000000000000),
        );
      };

      const atom: Atom<T> = {
        key,
        get: () => atomGetter(atom as Atom<T>),
        set: (valueOrUpdater: T | ((prev: T) => T)) => atomSetter(atom as Atom<T>, valueOrUpdater),
        subscribe: (listener: Listener) => {
          if (!this.listeners[key]) {
            this.listeners[key] = new Set();
          }
          this.listeners[key].add(listener);
          return () => {
            this.listeners[key].delete(listener);
            if (this.listeners[key].size === 0) {
              delete this.listeners[key];
            }
          };
        },
      };

      this.atoms[key] = atom;
      this.setToClientSessionCache(
        key,
        initialValue as unknown as EncryptedValue,
        new Date(8640000000000000),
      );
    }
    return this.atoms[key] as Atom<T>;
  }

  /**
   * Hook to use an atom in a component.
   * @template T The type of the atom value.
   * @param atom The atom to use.
   * @returns A tuple with a getter and setter for the atom value.
   */
  useAtom<T>(atom: Atom<T>): [() => T, (value: T | ((prev: T) => T)) => void] {
    return [
      () => atom.get() as T,
      (valueOrUpdater: T | ((prev: T) => T)) => atom.set(valueOrUpdater),
    ];
  }

  /**
   * Creates a derived atom that depends on other atoms.
   * @template T The type of the derived atom value.
   * @param key The unique key for the derived atom.
   * @param deriveFn The function to derive the value from the dependencies.
   * @param deps The dependency atoms.
   * @returns The created derived atom.
   */
  createDerivedAtom<T>(
    key: string,
    deriveFn: (...args: any[]) => T,
    deps: Atom<any>[],
  ): DerivedAtom<T> {
    if (!this.derivedAtoms[key]) {
      const derivedAtom: DerivedAtom<T> = {
        key,
        deps,
        get: () => deriveFn(...deps.map((dep) => dep.get())),
        set: () => {
          throw new Error('Derived atoms cannot be set directly');
        },
        subscribe: (listener: Listener) => {
          const unsubscribes = deps.map((dep) => dep.subscribe(listener));
          return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
        },
      };
      this.derivedAtoms[key] = derivedAtom;
    }
    return this.derivedAtoms[key] as DerivedAtom<T>;
  }

  private reducers: Record<string, (state: any, action: any) => any> = {};

  /**
   * Creates a reducer with a specific key, reducer function, and initial state.
   * @template T The type of the reducer state.
   * @param key The unique key for the reducer.
   * @param reducer The reducer function.
   * @param initialState The initial state for the reducer.
   */
  createReducer<T>(key: string, reducer: (state: T, action: any) => T, initialState: T) {
    this.reducers[key] = reducer;
    if (!this.cache[key]) {
      this.setToClientSessionCache(
        key,
        initialState as unknown as EncryptedValue,
        new Date(8640000000000000),
      );
    }
  }

  /**
   * Dispatches an action to update the state using the reducers.
   * @param action The action to dispatch.
   */
  dispatch(action: { type: string; payload?: any }) {
    this.batchStart();
    Object.keys(this.reducers).forEach((key) => {
      const currentState = this.getFromClientSessionCache(key)?.value;
      const newState = this.reducers[key](currentState, action);
      if (newState !== currentState) {
        this.setToClientSessionCache(
          key,
          newState as unknown as EncryptedValue,
          new Date(8640000000000000),
        );
      }
    });
    this.batchEnd();
    if (this.devToolsEnabled) {
      this.devToolsLog('dispatch', action.type, action.payload);
    }
  }

  /**
   * Selects a part of the state using a selector function.
   * @template T The type of the state.
   * @template R The return type of the selector.
   * @param selector The selector function.
   * @returns The selected part of the state.
   */
  select<T, R>(selector: Selector<T>): R {
    return selector(this.cache as unknown as T);
  }

  /**
   * Batches multiple state updates into a single update.
   * @param callback The callback function containing the state updates.
   */
  batch(callback: () => void) {
    this.batchStart();
    callback();
    this.batchEnd();
  }

  /**
   * Creates a context with a specific key and default value.
   * @template T The type of the context value.
   * @param key The unique key for the context.
   * @param defaultValue The default value for the context.
   * @returns The created context.
   */
  createContext<T>(key: string, defaultValue: T): Context<T> {
    if (!this.contexts[key]) {
      const context: Context<T> = {
        key,
        Provider: this.createContextProvider(key, defaultValue),
        Consumer: (props) => props.children(this.useContext(key)),
      };
      this.contexts[key] = context;
    }
    return this.contexts[key] as Context<T>;
  }

  /**
   * Creates a context provider component for a specific key and default value.
   * @template T The type of the context value.
   * @param key The unique key for the context.
   * @param defaultValue The default value for the context.
   * @returns The created context provider component.
   */
  private createContextProvider<T>(key: string, defaultValue: T): ContextProvider<T> {
    return (props) => {
      const value = props.value !== undefined ? props.value : defaultValue;
      this.setToClientSessionCache(
        key,
        value as unknown as EncryptedValue,
        new Date(8640000000000000),
      );
      return props.children;
    };
  }

  /**
   * Hook to use a context value in a component.
   * @template T The type of the context value.
   * @param key The unique key for the context.
   * @returns The context value.
   */
  useContext<T>(key: string): T {
    const value = this.getFromClientSessionCache(key)?.value;
    return value as T;
  }

  /**
   * Hook to use state in a component.
   * @template T The type of the state value.
   * @param key The unique key for the state.
   * @param initialValue The initial value for the state.
   * @returns A tuple with the current state value and a function to update it.
   */
  useState<T>(key: string, initialValue: T): UseStateHook<T> {
    const atom = this.createAtom(key, initialValue);
    const [getter, setter] = this.useAtom(atom);
    return [getter(), setter];
  }

  /**
   * Enables the dev tools for the ClientSessionCache.
   */
  enableDevTools() {
    this.devToolsEnabled = true;
    console.log('Dev tools enabled for ClientSessionCache');
  }

  /**
   * Logs dev tools messages for the ClientSessionCache.
   * @param action The action performed.
   * @param key The key associated with the action.
   * @param value The value associated with the action (optional).
   */
  private devToolsLog(action: string, key: string, value?: any) {
    console.log(`[ClientSessionCache] ${action}: ${key}`, value);
  }
}

const clientSessionCache = new ClientSessionCache();
export default clientSessionCache;
