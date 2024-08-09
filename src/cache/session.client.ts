'use client';

import { atom as createAtom, useAtom as useVanillaAtom } from '../utils/session.client';
import { ClientLogger } from 'goobs-testing';

/**
 * Creates a new atom for session storage.
 *
 * @template Value The type of the atom's value
 * @param initialValue The initial value of the atom
 * @returns A new session atom
 *
 * @example
 * const myAtom = atom(0)
 * const myStringAtom = atom('hello')
 * const myObjectAtom = atom({ foo: 'bar' })
 */
function atom<Value>(initialValue: Value) {
  return createAtom(initialValue);
}

/**
 * A hook to use session atoms in React components.
 *
 * @template Value The type of the atom's value
 * @param anAtom The atom to use
 * @returns A tuple containing the current value and a setter function
 *
 * @example
 * function Counter() {
 *   const [count, setCount] = useAtom(countAtom)
 *   return (
 *     <div>
 *       Count: {count}
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   )
 * }
 */
function useAtom<Value>(anAtom: ReturnType<typeof atom<Value>>) {
  return useVanillaAtom(anAtom);
}

export const session = {
  atom,
  useAtom,
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default session;
