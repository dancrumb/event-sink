# EventSink

This module provides a complement to the [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) interface defined as part of the Web APIs. The `EventSink` can be used in a server to provide a simple interface to sending Server-sent Events.

## Usage

```typescript
const sink = new EventSink();
const response = sink.getResponse(); // HTTP Response with appropriate headers for SSE

// Can pass in an event object
await sink.dispatchEvent({
  name: "test",
  content: "testing",
});

// Can pass in event name, content (and optional ID)
await sink.dispatchEvent("test2", "testing2", "2");

await sink.close;
```

### History

An `EventSink` can take an `EventHistory` object. If this is provided, every dispatched event is pushed into the history object. Each entry is a single Server-sent event.

## CircularBuffer

The `CircularBuffer` object implements the `EventHistory` (along with a number of other `Array<T>` methods).

It's designed to be a fixed size buffer that can be constantly added to and removed from. As such, it can retain the last _N_ events.

This can be used to replay events for a client that has to reconnect and who sends the `Last-Event-ID` header.

Since it's a circular buffer, if it fills faster than it is drained, older events will get lost; however, this is generally reasonable behaviour for SSEs, since old events will have limited value.
