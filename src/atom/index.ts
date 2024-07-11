import { Atom, Listener, DerivedAtom, UseStateHook } from '../types';

/**
 * Creates an atom with the specified key, getter, and setter functions.
 *
 * @template T The type of the atom's value
 * @param {string} key The unique key for the atom
 * @param {() => T} getter The function to get the atom's value
 * @param {(value: T | ((prev: T) => T)) => void} setter The function to set the atom's value
 * @returns {Atom<T>} The created atom
 */
export function createAtom<T>(
  key: string,
  getter: () => T,
  setter: (value: T | ((prev: T) => T)) => void,
): Atom<T> {
  const listeners = new Set<Listener>();
  const atom: Atom<T> = {
    key,
    get: getter,
    set: (valueOrUpdater: T | ((prev: T) => T)) => {
      setter(valueOrUpdater);
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
export function useAtom<T>(atom: Atom<T>): UseStateHook<T> {
  return [atom.get(), atom.set];
}

/**
 * Creates a derived atom based on other atoms.
 *
 * @template T The type of the derived atom's value
 * @param {string} key The unique key for the derived atom
 * @param {(...args: any[]) => T} deriveFn The function to derive the atom's value
 * @param {Atom<any>[]} deps The atoms this derived atom depends on
 * @returns {DerivedAtom<T>} The created derived atom
 */
export function createDerivedAtom<T>(
  key: string,
  deriveFn: (...args: any[]) => T,
  deps: Atom<any>[],
): DerivedAtom<T> {
  const derivedAtom: DerivedAtom<T> = {
    key,
    deps,
    get: () => {
      const values = deps.map((dep) => dep.get());
      return deriveFn(...values);
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
