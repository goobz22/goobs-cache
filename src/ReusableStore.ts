import { DataValue } from './types';

const isServer = typeof window === 'undefined';

export function set<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
  mode: 'server' | 'client' | 'cookie',
): void | Promise<void> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverSet }) =>
        serverSet(key, value, expirationDate),
      );
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientSet }) =>
        clientSet(key, value, expirationDate, 'session'),
      );
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientSet }) =>
        clientSet(key, value, expirationDate, 'cookie'),
      );
    }
  }
}

export function get<T extends DataValue>(
  key: string,
  mode: 'server' | 'client' | 'cookie',
): { value: T | null } | Promise<{ value: T | null }> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverGet }) => serverGet<T>(key));
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientGet }) => clientGet<T>(key, 'session'));
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientGet }) => clientGet<T>(key, 'cookie'));
    }
  }
  return { value: null };
}

export function remove(key: string, mode: 'server' | 'client' | 'cookie'): void | Promise<void> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverRemove }) => serverRemove(key));
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientRemove }) =>
        clientRemove(key, 'session'),
      );
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientRemove }) =>
        clientRemove(key, 'cookie'),
      );
    }
  }
}

export function cleanup(): Promise<void> {
  if (isServer) {
    return import('./ReusableStore.server').then(({ cleanup }) => cleanup());
  }
  return Promise.resolve();
}
