import { type EventHistory } from "./event-history.js";

/**
 * A circular buffer can have items constantly added and removed without exceeding a maximum size.
 *
 * However, if the buffer gets full, data will be lost as new elements are added.
 */
export class CircularBuffer<R = any> implements EventHistory<R> {
  private internalBuffer: R[] = [];
  private bufferHead = 0;
  private bufferLength = 0;

  readonly [n: number]: R;

  private static indexHandler: ProxyHandler<CircularBuffer> = {
    get: (original, key) => {
      if (key === "length") {
        return original.length;
      }
      if (typeof key === "symbol") {
        throw new Error("Circular Buffer only supports numeric indexes");
      }
      if (/^\d+$/.test(key)) {
        const indexNum = parseInt(key, 10);
        return original.get(indexNum);
      }

      //@ts-expect-error
      return original[key];
    },
  };

  constructor(length: number = 10) {
    this.internalBuffer.length = length;
    return new Proxy(this, CircularBuffer.indexHandler);
  }

  /**
   * The number of items currently in the buffer
   */
  get length() {
    return Math.min(this.bufferLength, this.internalBuffer.length);
  }

  private rawIndexToBufferIndex(rawIndex: number): number {
    return (rawIndex + this.bufferHead) % this.internalBuffer.length;
  }

  private get(index: number): R | undefined {
    if (index >= this.bufferLength) {
      return undefined;
    }
    const offset = this.rawIndexToBufferIndex(index);
    return this.internalBuffer[offset];
  }

  private set(index: number, value: R): void {
    if (index > this.bufferLength) {
      this.bufferLength = index;
    }
    const offset = this.rawIndexToBufferIndex(index);
    this.internalBuffer[offset] = value;
  }

  private moveBufferHeadUp() {
    this.bufferHead += 1;
    if (this.bufferHead === this.internalBuffer.length) {
      this.bufferHead = 0;
    }
  }

  private moveBufferHeadDown() {
    this.bufferHead -= 1;
    if (this.bufferHead < 0) {
      this.bufferHead = this.internalBuffer.length - 1;
    }
  }

  private incrementLength() {
    this.bufferLength = Math.min(
      this.bufferLength + 1,
      this.internalBuffer.length
    );
    return this.bufferLength;
  }

  private decrementLength() {
    this.bufferLength = Math.max(this.bufferLength - 1, 0);
    return this.bufferLength;
  }

  /**
   * true if the buffer contains nothing
   */
  isEmpty() {
    return this.bufferLength === 0;
  }
  /**
   * true if the buffer is full.
   * Attempting to add an item when the buffer is full will result in an error
   */
  isFull() {
    return this.bufferLength >= this.internalBuffer.length;
  }

  /**
   * Add a single element to the beginning of the buffer
   */
  unshift(value: R) {
    this.moveBufferHeadDown();
    this.set(0, value);
    this.incrementLength();

    return this.bufferLength;
  }

  /**
   * Remove a single element to the beginning of the buffer
   */
  shift(): R | undefined {
    if (this.bufferLength === 0) {
      return undefined;
    }
    const value = this.get(0);
    this.decrementLength();
    this.moveBufferHeadUp();

    return value;
  }

  /**
   * Add a single element to the end of the buffer
   */
  push(value: R) {
    if (this.isFull()) {
      this.moveBufferHeadUp();
    }
    this.set(this.bufferLength, value);
    return this.incrementLength();
  }

  /**
   * Remove a single element from the end of the buffer
   */
  pop(): R | undefined {
    if (this.bufferLength === 0) {
      return undefined;
    }
    const value = this.get(this.bufferHead + this.bufferLength - 1);
    this.decrementLength();
    this.moveBufferHeadDown();

    return value;
  }

  /**
   * Returns the buffer index of the first entry in the buffer that matches the predicate
   */
  findIndex(
    predicate: (value: R, index: number, buff: R[]) => boolean
  ): number {
    let bufferIndex = this.internalBuffer
      .slice(this.bufferHead)
      .findIndex(predicate);

    if (bufferIndex !== -1) {
      return bufferIndex;
    }
    bufferIndex = this.internalBuffer
      .slice(0, this.bufferHead)
      .findIndex(predicate);

    if (bufferIndex !== -1) {
      return bufferIndex + this.bufferHead + 1;
    }
    return -1;
  }

  purge(): void {
    this.bufferHead = 0;
    this.bufferLength = 0;
    const internalLength = this.internalBuffer.length;
    this.internalBuffer.length = 0;
    this.internalBuffer.length = internalLength;
  }
}
