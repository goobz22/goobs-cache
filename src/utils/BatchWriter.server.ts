'use server';
import { StorageInterface, EncryptedValue, CacheItem, BatchWriterImplementation } from '../types';

/**
 * BatchWriterState interface represents the state of the batch writer.
 * It includes the current batch, the flush promise, and the flush interval.
 *
 * - batch: A Map object that stores the key-value pairs of cache items to be written in a batch.
 * - flushPromise: A Promise that represents the current flush operation. It is used to ensure that only one flush operation is running at a time.
 * - flushInterval: A reference to the interval that periodically flushes the batch automatically.
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
 *
 * The function initializes the writerState with an empty batch, null flushPromise, and null flushInterval.
 *
 * It defines two inner functions:
 * - persistBatch: Persists a batch of items to storage by iterating over the batch and calling the set method of the storage interface for each item.
 * - flush: Flushes the current batch, persisting the items to storage. It ensures that only one flush operation is running at a time by checking the flushPromise. If a flush operation is already in progress, it waits for it to complete before proceeding. It creates a new Map object with the current batch items, clears the current batch, and assigns the persistBatch operation to flushPromise. Once the persist operation is complete, it sets flushPromise back to null.
 *
 * The function starts an interval that periodically calls the flush function based on the provided flushIntervalMs.
 *
 * Finally, it returns an object that implements the BatchWriterImplementation interface, with the following methods:
 * - add: Adds a key-value pair with an expiration date to the current batch. If the batch size reaches the provided batchSize, it triggers a flush operation.
 * - flush: Exposes the flush function to allow manual flushing of the current batch.
 * - stop: Stops the batch writer by clearing the flush interval and flushing any remaining items in the batch.
 *
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

  async function persistBatch(batch: Map<string, CacheItem<EncryptedValue>>): Promise<void> {
    for (const [key, item] of batch.entries()) {
      await storage.set(key, item);
    }
    console.log(`Batch of ${batch.size} items persisted to storage`);
  }

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
 *
 * If a writerInstance does not exist, it calls the createBatchWriterImplementation function to create a new instance and assigns it to writerInstance.
 *
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
 *
 * It calls the add method of the provided BatchWriterImplementation instance with the given key, value, and expirationDate.
 *
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
 *
 * It calls the flush method of the provided BatchWriterImplementation instance.
 *
 * @param writer The batch writer to use for flushing the batch.
 */
export async function flushBatch(writer: BatchWriterImplementation): Promise<void> {
  await writer.flush();
}

/**
 * stopBatchWriter function stops the batch writer, flushing any remaining items and clearing the interval.
 *
 * It calls the stop method of the provided BatchWriterImplementation instance.
 *
 * @param writer The batch writer to stop.
 */
export async function stopBatchWriter(writer: BatchWriterImplementation): Promise<void> {
  await writer.stop();
}

export type { BatchWriterImplementation };
