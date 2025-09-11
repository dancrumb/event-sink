import { EventSink } from "../src/event-sink.js";
import { CircularBuffer } from "../src/circular-buffer.js";
import { describe, expect, it, vi } from "vitest";

describe("EventSink", async () => {
  it("basic", async () => {
    const sink = new EventSink();

    const response = sink.getResponse();
    const decoder = new TextDecoderStream();

    response.body?.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    sink.dispatchEvent({
      name: "test",
      content: "testing",
    });

    sink.dispatchEvent("testing2", "test2", "2");
    sink.dispatchEvent({
      name: "comments",
      id: "3",
      content: "comment content",
      comments: ["hello"],
    });

    sink.dispatchEvent({
      content: "minimal",
    });

    let result: Awaited<ReturnType<(typeof reader)["read"]>>;

    result = await reader.read();
    expect(result.value).toBe("event: test\ndata: testing\n\n");
    result = await reader.read();
    expect(result.value).toBe("event: test2\nid: 2\ndata: testing2\n\n");
    result = await reader.read();
    expect(result.value).toBe(
      "event: comments\nid: 3\n: hello\ndata: comment content\n\n"
    );
    result = await reader.read();
    expect(result.value).toBe("event: message\ndata: minimal\n\n");

    await sink.close();

    result = await reader.read();
    expect(result.done).toBe(true);
  });

  it("repeat getResponse", () => {
    const sink = new EventSink();

    const response1 = sink.getResponse();
    const response2 = sink.getResponse();

    expect(response1).toBe(response2);
  });

  it("reset", async () => {
    const sink = new EventSink();

    const response1 = sink.getResponse();
    await sink.reset();
    expect(response1).toBeDefined();
  });

  it("with history", async () => {
    const history = new CircularBuffer();
    const sink = new EventSink(history);
    const response = sink.getResponse();
    response.body?.pipeTo(new WritableStream({}));

    expect(history.length).toBe(0);

    await sink.dispatchEvent({
      name: "test",
      content: "testing",
    });
    expect(history.length).toBe(1);

    await sink.dispatchEvent({
      name: "test",
      content: "testing",
    });
    await sink.dispatchEvent({
      name: "test",
      content: "testing",
    });
    expect(history.length).toBe(3);

    await sink.close();
  });
});
