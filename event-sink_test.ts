import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { EventSink } from "./event-sink.ts";
import { CircularBuffer } from "./circular-buffer.ts";

Deno.test("EventSink: basic", async () => {
  const sink = new EventSink();

  const response = sink.getResponse();
  const decoder = new TextDecoderStream();

  response.body?.pipeTo(decoder.writable);
  const reader = decoder.readable.getReader();
  sink.dispatchEvent({
    name: "test",
    content: "testing",
  });

  sink.dispatchEvent("test2", "testing2", "2");
  sink.dispatchEvent({
    name: "comments",
    id: "3",
    content: "comment content",
    comments: ["hello"],
  });

  let result: Awaited<ReturnType<(typeof reader)["read"]>>;

  result = await reader.read();
  assertEquals(result.value, "event: test\ndata: testing\n\n");
  result = await reader.read();
  assertEquals(result.value, "event: test2\nid: 2\ndata: testing2\n\n");
  result = await reader.read();
  assertEquals(
    result.value,
    "event: comments\nid: 3\n: hello\ndata: comment content\n\n"
  );

  await sink.close();

  result = await reader.read();
  assertEquals(result.done, true);
});

Deno.test("EventSink: repeat getResponse", () => {
  const sink = new EventSink();

  const response1 = sink.getResponse();
  const response2 = sink.getResponse();

  assertEquals(response1, response2);
});

Deno.test("EventSink: reset", async () => {
  const sink = new EventSink();

  const response1 = sink.getResponse();
  await sink.reset();
  assertExists(response1);
});

Deno.test("EventSink: with history", async () => {
  const history = new CircularBuffer();
  const sink = new EventSink(history);
  const response = sink.getResponse();
  response.body?.pipeTo(new WritableStream({}));

  assertEquals(history.length, 0);

  await sink.dispatchEvent({
    name: "test",
    content: "testing",
  });
  assertEquals(history.length, 1);

  await sink.dispatchEvent({
    name: "test",
    content: "testing",
  });
  await sink.dispatchEvent({
    name: "test",
    content: "testing",
  });
  assertEquals(history.length, 3);

  await sink.close();
});
