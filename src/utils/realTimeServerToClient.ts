'use client';

import { DataValue, CacheResult, Listener } from '../types';

class RealTimeServerToClientSync {
  private listeners: Map<string, Set<Listener<DataValue>>> = new Map();

  subscribe<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: Listener<T>,
  ): () => void {
    const key = `${identifier}:${storeName}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener as Listener<DataValue>);

    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener as Listener<DataValue>);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  notify<T extends DataValue>(identifier: string, storeName: string, data: T): void {
    const key = `${identifier}:${storeName}`;
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  handleCacheUpdate(cacheResult: CacheResult): void {
    if (cacheResult.value !== undefined) {
      this.notify(cacheResult.identifier, cacheResult.storeName, cacheResult.value);
    }
  }
}

export const realTimeSync = new RealTimeServerToClientSync();

export function useRealTimeSync<T extends DataValue>(
  identifier: string,
  storeName: string,
  callback: (data: T) => void,
): () => void {
  return realTimeSync.subscribe<T>(identifier, storeName, callback);
}
