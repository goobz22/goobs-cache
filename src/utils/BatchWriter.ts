'use server';
import { StorageInterface, CacheItem } from '../storage/StorageInterface';
import { EncryptedValue } from '../types/DataTypes';

/**
 * BatchWriterImplementation interface defines the methods that a batch writer implementation should provide.
 * It includes methods for adding items to the batch, flushing the batch, and stopping the writer.
 */
interface BatchWriterImplementation {
  /**
   * add method adds a key-value pair with an expiration date to the batch.
   * @param key The key of the item to add.
   * @param value The encrypted value of the item to add.
   * @param expirationDate The expiration date of the item.
   */
  add(key: string, value: EncryptedValue, expirationDate: Date): Promise<void>;

  /**
   * flush method flushes the current batch, persisting the items to storage.
   */
  flush(): Promise<void>;

  /**
   * stop method stops the batch writer, flushing any remaining items and clearing the interval.
   */
  stop(): Promise<void>;
}

/**
 * BatchWriterState interface represents the state of the batch writer.
 * It includes the current batch, the flush promise, and the flush interval.
 */
interface BatchWriterState {
  batch: Map<string, CacheItem<EncryptedValue>>;
  flushPromise: Promise<void> | null;
  flushInterval: NodeJS.Timeout | null;
}

let writerInstance: BatchWriterImplementation | null = null;
let writerState: BatchWriterState | null = null;

/**
 * createBatchWriterImplementation function creates a new instance of the BatchWriterImplementation.
 * It takes a storage interface, batch size, and flush interval as parameters.
 * @param storage The storage interface to use for persisting the batched items.
 * @param batchSize The maximum number of items to store in a batch before flushing.
 * @param flushIntervalMs The interval (in milliseconds) at which to flush the batch automatically.
 * @returns An instance of the BatchWriterImplementation.
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
   * persistBatch function persists a batch of items to storage.
   * @param batch The batch of items to persist.
   */
  async function persistBatch(batch: Map<string, CacheItem<EncryptedValue>>): Promise<void> {
    for (const [key, item] of batch.entries()) {
      await storage.set(key, item);
    }
    console.log(`Batch of ${batch.size} items persisted to storage`);
  }

  /**
   * flush function flushes the current batch, persisting the items to storage.
   * It ensures that only one flush operation is running at a time.
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
    async add(key: string, value: EncryptedValue, expirationDate: Date): Promise<void> {
      if (!writerState) return;
      writerState.batch.set(key, { value, lastAccessed: Date.now(), expirationDate });
      if (writerState.batch.size >= batchSize) {
        await flush();
      }
    },
    flush,
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
 * createBatchWriter function creates a new instance of the BatchWriterImplementation.
 * It takes a storage interface, batch size, and flush interval as parameters.
 * @param storage The storage interface to use for persisting the batched items.
 * @param batchSize The maximum number of items to store in a batch before flushing.
 * @param flushIntervalMs The interval (in milliseconds) at which to flush the batch automatically.
 * @returns A Promise that resolves to an instance of the BatchWriterImplementation.
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
 * addToBatch function adds a key-value pair with an expiration date to the batch using the provided batch writer.
 * @param writer The batch writer to use for adding the item.
 * @param key The key of the item to add.
 * @param value The encrypted value of the item to add.
 * @param expirationDate The expiration date of the item.
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
 * flushBatch function flushes the current batch using the provided batch writer.
 * @param writer The batch writer to use for flushing the batch.
 */
export async function flushBatch(writer: BatchWriterImplementation): Promise<void> {
  await writer.flush();
}

/**
 * stopBatchWriter function stops the batch writer, flushing any remaining items and clearing the interval.
 * @param writer The batch writer to stop.
 */
export async function stopBatchWriter(writer: BatchWriterImplementation): Promise<void> {
  await writer.stop();
}
