/**
 * @file BatchWriter.ts
 * @description Implements a batch writing mechanism for efficient storage of cached items.
 */

'use server';
import { StorageInterface, EncryptedValue, CacheItem, BatchWriterImplementation } from '../types';

/**
 * Represents the state of the batch writer.
 * @interface
 */
interface BatchWriterState {
  /** Stores the key-value pairs of cache items to be written in a batch. */
  batch: Map<string, CacheItem<EncryptedValue>>;
  /** Represents the current flush operation. Ensures only one flush operation runs at a time. */
  flushPromise: Promise<void> | null;
  /** Reference to the interval that periodically flushes the batch automatically. */
  flushInterval: NodeJS.Timeout | null;
}

/** Singleton instance of the BatchWriterImplementation. */
let writerInstance: BatchWriterImplementation | null = null;
/** Current state of the batch writer. */
let writerState: BatchWriterState | null = null;

/**
 * Creates a new instance of the BatchWriterImplementation.
 *
 * @param {StorageInterface} storage - The storage interface to use for persisting batched items.
 * @param {number} batchSize - The maximum number of items to store in a batch before flushing.
 * @param {number} flushIntervalMs - The interval (in milliseconds) at which to flush the batch automatically.
 * @returns {BatchWriterImplementation} An instance of the BatchWriterImplementation.
 */
function createBatchWriterImplementation(
  storage: StorageInterface,
  batchSize: number,
  flushIntervalMs: number,
): BatchWriterImplementation {
  writerState = {
    batch: new Map(),
    flushPromise: null,
    flushInterval: null,
  };

  /**
   * Persists a batch of items to storage.
   * @param {Map<string, CacheItem<EncryptedValue>>} batch - The batch of items to persist.
   * @returns {Promise<void>}
   */
  async function persistBatch(batch: Map<string, CacheItem<EncryptedValue>>): Promise<void> {
    for (const [key, item] of batch.entries()) {
      await storage.set(key, item);
    }
    console.log(`Batch of ${batch.size} items persisted to storage`);
  }

  /**
   * Flushes the current batch, persisting the items to storage.
   * @returns {Promise<void>}
   */
  async function flush(): Promise<void> {
    if (!writerState) return;
    if (writerState.flushPromise) {
      await writerState.flushPromise;
      return;
    }
    if (writerState.batch.size === 0) {
      return;
    }
    const batchToFlush = new Map(writerState.batch);
    writerState.batch.clear();
    writerState.flushPromise = persistBatch(batchToFlush);
    await writerState.flushPromise;
    writerState.flushPromise = null;
  }

  writerState.flushInterval = setInterval(flush, flushIntervalMs);

  return {
    /**
     * Adds a key-value pair with an expiration date to the current batch.
     * @param {string} key - The key of the item to add.
     * @param {EncryptedValue} value - The encrypted value of the item to add.
     * @param {Date} expirationDate - The expiration date of the item.
     * @returns {Promise<void>}
     */
    async add(key: string, value: EncryptedValue, expirationDate: Date): Promise<void> {
      if (!writerState) return;
      writerState.batch.set(key, {
        value,
        lastAccessed: Date.now(),
        expirationDate,
        hitCount: 0,
        compressed: false,
        size: Buffer.from(JSON.stringify(value)).length,
      });
      if (writerState.batch.size >= batchSize) {
        await flush();
      }
    },
    flush,
    /**
     * Stops the batch writer, flushing any remaining items and clearing the interval.
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
      if (!writerState) return;
      if (writerState.flushInterval) {
        clearInterval(writerState.flushInterval);
        writerState.flushInterval = null;
      }
      await flush();
    },
  };
}

/**
 * Creates a new instance of the BatchWriterImplementation or returns the existing one.
 *
 * @param {StorageInterface} storage - The storage interface to use for persisting batched items.
 * @param {number} batchSize - The maximum number of items to store in a batch before flushing.
 * @param {number} flushIntervalMs - The interval (in milliseconds) at which to flush the batch automatically.
 * @returns {Promise<BatchWriterImplementation>} A Promise that resolves to an instance of the BatchWriterImplementation.
 */
export async function createBatchWriter(
  storage: StorageInterface,
  batchSize: number,
  flushIntervalMs: number,
): Promise<BatchWriterImplementation> {
  if (!writerInstance) {
    writerInstance = createBatchWriterImplementation(storage, batchSize, flushIntervalMs);
  }
  return writerInstance;
}

/**
 * Adds a key-value pair with an expiration date to the batch using the provided batch writer.
 *
 * @param {BatchWriterImplementation} writer - The batch writer to use for adding the item.
 * @param {string} key - The key of the item to add.
 * @param {EncryptedValue} value - The encrypted value of the item to add.
 * @param {Date} expirationDate - The expiration date of the item.
 * @returns {Promise<void>}
 */
export async function addToBatch(
  writer: BatchWriterImplementation,
  key: string,
  value: EncryptedValue,
  expirationDate: Date,
): Promise<void> {
  await writer.add(key, value, expirationDate);
}

/**
 * Flushes the current batch using the provided batch writer.
 *
 * @param {BatchWriterImplementation} writer - The batch writer to use for flushing the batch.
 * @returns {Promise<void>}
 */
export async function flushBatch(writer: BatchWriterImplementation): Promise<void> {
  await writer.flush();
}

/**
 * Stops the batch writer, flushing any remaining items and clearing the interval.
 *
 * @param {BatchWriterImplementation} writer - The batch writer to stop.
 * @returns {Promise<void>}
 */
export async function stopBatchWriter(writer: BatchWriterImplementation): Promise<void> {
  await writer.stop();
}

export type { BatchWriterImplementation };
