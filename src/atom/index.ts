import React from 'react';
import { Atom, Listener, DerivedAtom, UseStateHook, DataValue } from '../types';

/**
 * Creates an atom with the specified identifier, storeName, getter, and setter functions.
 *
 * @template T The type of the atom's value
 * @param {string} identifier The identifier for the atom
 * @param {string} storeName The store name for the atom
 * @param {() => Promise<T>} getter The function to get the atom's value
 * @param {(value: T | ((prev: T) => Promise<T>)) => Promise<void>} setter The function to set the atom's value
 * @returns {Atom<T>} The created atom
 */
export function createAtom<T extends DataValue>(
  identifier: string,
  storeName: string,
  getter: () => Promise<T>,
  setter: (value: T | ((prev: T) => Promise<T>)) => Promise<void>,
): Atom<T> {
  const listeners = new Set<Listener>();
  const atom: Atom<T> = {
    identifier,
    storeName,
    get: getter,
    set: async (valueOrUpdater: T | ((prev: T) => Promise<T>)) => {
      await setter(valueOrUpdater);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return atom;
}

/**
 * Hook to use an atom in a React component.
 *
 * @template T The type of the atom's value
 * @param {Atom<T>} atom The atom to use
 * @returns {UseStateHook<T>} A tuple containing the atom's value and a setter function
 */
export function useAtom<T extends DataValue>(atom: Atom<T>): UseStateHook<T> {
  const [value, setValue] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchValue = async () => {
      try {
        const newValue = await atom.get();
        if (isMounted) {
          setValue(newValue);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    fetchValue();
    const unsubscribe = atom.subscribe(fetchValue);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [atom]);

  const asyncSetValue = React.useCallback(
    async (newValueOrUpdater: T | ((prev: T) => Promise<T>)) => {
      try {
        await atom.set(newValueOrUpdater);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [atom],
  );

  if (error) {
    throw error;
  }

  return [value, asyncSetValue];
}

/**
 * Creates a derived atom based on other atoms.
 *
 * @template T The type of the derived atom's value
 * @template D The tuple type of the dependencies' values
 * @param {string} identifier The identifier for the derived atom
 * @param {string} storeName The store name for the derived atom
 * @param {(...args: D) => Promise<T>} deriveFn The function to derive the atom's value
 * @param {readonly [...{ [K in keyof D]: Atom<D[K]> }]} deps The atoms this derived atom depends on
 * @returns {DerivedAtom<T, D>} The created derived atom
 */
export function createDerivedAtom<T extends DataValue, D extends readonly Atom<DataValue>[]>(
  identifier: string,
  storeName: string,
  deriveFn: (...args: { [K in keyof D]: Awaited<ReturnType<D[K]['get']>> }) => Promise<T>,
  deps: D,
): DerivedAtom<T, D> {
  const derivedAtom: DerivedAtom<T, D> = {
    identifier,
    storeName,
    deps,
    get: async () => {
      const values = await Promise.all(deps.map((dep) => dep.get()));
      return deriveFn(...(values as { [K in keyof D]: Awaited<ReturnType<D[K]['get']>> }));
    },
    set: (() => {
      throw new Error('Derived atoms cannot be set directly');
    }) as never,
    subscribe: (listener: Listener) => {
      const unsubscribes = deps.map((dep) => dep.subscribe(listener));
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    },
  };
  return derivedAtom;
}
