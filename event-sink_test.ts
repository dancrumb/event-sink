import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { EventSink } from "./event-sink.ts";

Deno.test("EventSink", async (t) => {
  const sink = new EventSink();

  const response = sink.getResponse();
  const decoder = new TextDecoderStream();

  response.body?.pipeTo(decoder.writable);
  const reader = decoder.readable.getReader();
  sink.dispatchEvent({
    name: "test",
    content: "testing",
  });

  sink.dispatchEvent({
    name: "test2",
    id: "2",
    content: "testing2",
  });
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
