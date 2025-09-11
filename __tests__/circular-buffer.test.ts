import { expect, it } from "vitest";
import { CircularBuffer } from "../src/circular-buffer.js";
import { describe } from "node:test";

describe("CircularBuffer: zero-length", () => {
  const buffer = new CircularBuffer(0);
  expect(buffer.length).toBe(0);
  expect(buffer[0]).toBe(undefined);
});
describe("CircularBuffer: default length", () => {
  const buffer = new CircularBuffer();
  expect(buffer.length).toBe(0);
  expect(buffer[0]).toBe(undefined);
});

describe("CircularBuffer: unshift", async (tt) => {
  it("within bounds", () => {
    const buffer = new CircularBuffer();
    let newLength = buffer.unshift("a");
    expect(newLength, "return value from unshift").toBe(1);
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("a");

    newLength = buffer.unshift("b");
    expect(newLength, "return value from unshift").toBe(2);
    expect(buffer.length, "new buffer length").toBe(2);
    expect(buffer[0], "new value").toBe("b");
    expect(buffer[1], "old value").toBe("a");
  });
  it("out of bounds", () => {
    const buffer = new CircularBuffer(1);
    let newLength = buffer.unshift("a");
    expect(newLength, "return value from unshift").toBe(1);
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("a");
    newLength = buffer.unshift("b");
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("b");
  });
});

describe("CircularBuffer: push", async (tt) => {
  it("within bounds", () => {
    const buffer = new CircularBuffer();
    let newLength = buffer.push("a");
    expect(newLength, "return value from push").toBe(1);
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("a");

    newLength = buffer.push("b");
    expect(newLength, "return value from push").toBe(2);
    expect(buffer.length, "new buffer length").toBe(2);
    expect(buffer[0], "old value").toBe("a");
    expect(buffer[1], "new value").toBe("b");
  });
  it("out of bounds", () => {
    const buffer = new CircularBuffer(1);
    let newLength = buffer.push("a");
    expect(newLength, "return value from push").toBe(1);
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("a");
    newLength = buffer.push("b");
    expect(newLength, "return value from push").toBe(1);
    expect(buffer.length, "new buffer length").toBe(1);
    expect(buffer[0], "added value").toBe("b");
  });
});

describe("CircularBuffer: pop", async (tt) => {
  it("empty", () => {
    const buffer = new CircularBuffer();
    const poppedValue = buffer.pop();
    expect(poppedValue).toBe(undefined);
    expect(buffer.length).toBe(0);
  });
  it("push/pop", () => {
    const buffer = new CircularBuffer();
    buffer.push("a");
    expect(buffer.length).toBe(1);
    const poppedValue = buffer.pop();
    expect(poppedValue).toBe("a");
    expect(buffer.length).toBe(0);
  });
});

describe("CircularBuffer: shift", async (tt) => {
  it("empty", () => {
    const buffer = new CircularBuffer();
    const shiftedValue = buffer.shift();
    expect(shiftedValue).toBe(undefined);
    expect(buffer.length).toBe(0);
  });
  it("unshift/shift", () => {
    const buffer = new CircularBuffer();
    buffer.unshift("a");
    expect(buffer.length).toBe(1);
    const shiftedValue = buffer.shift();
    expect(shiftedValue).toBe("a");
    expect(buffer.length).toBe(0);
  });
});

describe("CircularBuffer: isEmpty", async (tt) => {
  it("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    expect(buffer.isEmpty()).toBe(true);
  });
  it("one length buffer", () => {
    const buffer = new CircularBuffer();
    expect(buffer.isEmpty()).toBe(true);
    buffer.push("a");
    expect(buffer.isEmpty()).toBe(false);
    buffer.pop();
    expect(buffer.isEmpty()).toBe(true);
  });
});

describe("CircularBuffer: isFull", async (tt) => {
  it("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    expect(buffer.isFull()).toBe(true);
  });
  it("one length buffer", () => {
    const buffer = new CircularBuffer();
    expect(buffer.isFull()).toBe(false);
    buffer.push("a");
    expect(buffer.isFull()).toBe(false);
    buffer.pop();
    expect(buffer.isFull()).toBe(false);
  });
  it("two length buffer", () => {
    const buffer = new CircularBuffer(2);
    expect(buffer.isFull()).toBe(false);
    buffer.push("a");
    expect(buffer.isFull()).toBe(false);
    buffer.push("a");
    expect(buffer.isFull()).toBe(true);
  });
});
describe("CircularBuffer: findIndex", async (tt) => {
  it("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    expect(buffer.findIndex((x) => x === 1)).toBe(-1);
  });
  it("one length buffer", () => {
    const buffer = new CircularBuffer();
    buffer.push("a");
    expect(buffer.findIndex((x) => x === "a")).toBe(0);
    expect(buffer.findIndex((x) => x === "b")).toBe(-1);
  });
  it("two length buffer", () => {
    const buffer = new CircularBuffer(2);
    buffer.push("a");
    buffer.push("b");
    expect(buffer.findIndex((x) => x === "a")).toBe(0);
    expect(buffer.findIndex((x) => x === "b")).toBe(1);
  });
});
describe("CircularBuffer: short FIFO", async () => {
  const fifo = new CircularBuffer(3);
  fifo.push(1);
  fifo.push(2);
  fifo.push(3);
  expect(fifo.shift()).toBe(1);
  expect(fifo.shift()).toBe(2);
  expect(fifo.shift()).toBe(3);
  fifo.push(4);
  fifo.push(5);
  fifo.push(6);
  expect(fifo.shift()).toBe(4);
  expect(fifo.shift()).toBe(5);
  expect(fifo.shift()).toBe(6);
});
describe("CircularBuffer: complex find 1", async () => {
  const fifo = new CircularBuffer(3);
  fifo.unshift(1);
  fifo.push(2);
  fifo.unshift(2);
  expect(fifo[0], "check zeroth index").toBe(2);
  expect(
    fifo.findIndex((x) => x === 2),
    "find with offset head"
  ).toBe(0);
});
describe("CircularBuffer: complex find", async () => {
  const fifo = new CircularBuffer(3);
  fifo.unshift(1);
  fifo.push(2);
  fifo.unshift(3);
  expect(fifo[2], "check expected index").toBe(2);
  expect(
    fifo.findIndex((x) => x === 2),
    "find with offset head"
  ).toBe(2);
});
