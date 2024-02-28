import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.216.0/testing/asserts.ts";

import { CircularBuffer } from "./circular-buffer.ts";

Deno.test("CircularBuffer: zero-length", () => {
  const buffer = new CircularBuffer(0);
  assertEquals(buffer.length, 0);
  assertEquals(buffer[0], undefined);
});
Deno.test("CircularBuffer: default length", () => {
  const buffer = new CircularBuffer();
  assertEquals(buffer.length, 0);
  assertEquals(buffer[0], undefined);
});

Deno.test("CircularBuffer: unshift", async (tt) => {
  await tt.step("within bounds", () => {
    const buffer = new CircularBuffer();
    let newLength = buffer.unshift("a");
    assertEquals(newLength, 1, "return value from unshift");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "a", "added value");

    newLength = buffer.unshift("b");
    assertEquals(newLength, 2, "return value from unshift");
    assertEquals(buffer.length, 2, "new buffer length");
    assertEquals(buffer[0], "b", "new value");
    assertEquals(buffer[1], "a", "old value");
  });
  await tt.step("out of bounds", () => {
    const buffer = new CircularBuffer(1);
    let newLength = buffer.unshift("a");
    assertEquals(newLength, 1, "return value from unshift");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "a", "added value");
    newLength = buffer.unshift("b");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "b", "added value");
  });
});

Deno.test("CircularBuffer: push", async (tt) => {
  await tt.step("within bounds", () => {
    const buffer = new CircularBuffer();
    let newLength = buffer.push("a");
    assertEquals(newLength, 1, "return value from push");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "a", "added value");

    newLength = buffer.push("b");
    assertEquals(newLength, 2, "return value from push");
    assertEquals(buffer.length, 2, "new buffer length");
    assertEquals(buffer[0], "a", "old value");
    assertEquals(buffer[1], "b", "new value");
  });
  await tt.step("out of bounds", () => {
    const buffer = new CircularBuffer(1);
    let newLength = buffer.push("a");
    assertEquals(newLength, 1, "return value from push");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "a", "added value");
    newLength = buffer.push("b");
    assertEquals(newLength, 1, "return value from push");
    assertEquals(buffer.length, 1, "new buffer length");
    assertEquals(buffer[0], "b", "added value");
  });
});

Deno.test("CircularBuffer: pop", async (tt) => {
  await tt.step("empty", () => {
    const buffer = new CircularBuffer();
    const poppedValue = buffer.pop();
    assertEquals(poppedValue, undefined);
    assertEquals(buffer.length, 0);
  });
  await tt.step("push/pop", () => {
    const buffer = new CircularBuffer();
    buffer.push("a");
    assertEquals(buffer.length, 1);
    const poppedValue = buffer.pop();
    assertEquals(poppedValue, "a");
    assertEquals(buffer.length, 0);
  });
});

Deno.test("CircularBuffer: shift", async (tt) => {
  await tt.step("empty", () => {
    const buffer = new CircularBuffer();
    const shiftedValue = buffer.shift();
    assertEquals(shiftedValue, undefined);
    assertEquals(buffer.length, 0);
  });
  await tt.step("unshift/shift", () => {
    const buffer = new CircularBuffer();
    buffer.unshift("a");
    assertEquals(buffer.length, 1);
    const shiftedValue = buffer.shift();
    assertEquals(shiftedValue, "a");
    assertEquals(buffer.length, 0);
  });
});

Deno.test("CircularBuffer: isEmpty", async (tt) => {
  await tt.step("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    assertEquals(buffer.isEmpty(), true);
  });
  await tt.step("one length buffer", () => {
    const buffer = new CircularBuffer();
    assertEquals(buffer.isEmpty(), true);
    buffer.push("a");
    assertEquals(buffer.isEmpty(), false);
    buffer.pop();
    assertEquals(buffer.isEmpty(), true);
  });
});

Deno.test("CircularBuffer: isFull", async (tt) => {
  await tt.step("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    assertEquals(buffer.isFull(), true);
  });
  await tt.step("one length buffer", () => {
    const buffer = new CircularBuffer();
    assertEquals(buffer.isFull(), false);
    buffer.push("a");
    assertEquals(buffer.isFull(), false);
    buffer.pop();
    assertEquals(buffer.isFull(), false);
  });
  await tt.step("two length buffer", () => {
    const buffer = new CircularBuffer(2);
    assertEquals(buffer.isFull(), false);
    buffer.push("a");
    assertEquals(buffer.isFull(), false);
    buffer.push("a");
    assertEquals(buffer.isFull(), true);
  });
});
Deno.test("CircularBuffer: findIndex", async (tt) => {
  await tt.step("zero length buffer", () => {
    const buffer = new CircularBuffer(0);
    assertEquals(
      buffer.findIndex((x) => x === 1),
      -1
    );
  });
  await tt.step("one length buffer", () => {
    const buffer = new CircularBuffer();
    buffer.push("a");
    assertEquals(
      buffer.findIndex((x) => x === "a"),
      0
    );
    assertEquals(
      buffer.findIndex((x) => x === "b"),
      -1
    );
  });
  await tt.step("two length buffer", () => {
    const buffer = new CircularBuffer(2);
    buffer.push("a");
    buffer.push("b");
    assertEquals(
      buffer.findIndex((x) => x === "a"),
      0
    );
    assertEquals(
      buffer.findIndex((x) => x === "b"),
      1
    );
  });
});
Deno.test("CircularBuffer: short FIFO", async () => {
  const fifo = new CircularBuffer(3);
  fifo.push(1);
  fifo.push(2);
  fifo.push(3);
  assertEquals(fifo.shift(), 1);
  assertEquals(fifo.shift(), 2);
  assertEquals(fifo.shift(), 3);
  fifo.push(4);
  fifo.push(5);
  fifo.push(6);
  assertEquals(fifo.shift(), 4);
  assertEquals(fifo.shift(), 5);
  assertEquals(fifo.shift(), 6);
});
Deno.test("CircularBuffer: complex find 1", async () => {
  const fifo = new CircularBuffer(3);
  fifo.unshift(1);
  fifo.push(2);
  fifo.unshift(2);
  assertEquals(fifo[0], 2, "check zeroth index");
  assertEquals(
    fifo.findIndex((x) => x === 2),
    0,
    "find with offset head"
  );
});
Deno.test("CircularBuffer: complex find", async () => {
  const fifo = new CircularBuffer(3);
  fifo.unshift(1);
  fifo.push(2);
  fifo.unshift(3);
  assertEquals(fifo[2], 2, "check expected index");
  assertEquals(
    fifo.findIndex((x) => x === 2),
    2,
    "find with offset head"
  );
});
