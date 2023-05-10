import { getLogger } from "./deps.ts";
import { EventHistory } from "./event-history.ts";
import { SSEEvent } from "./sse-event.ts";

function logger() {
  return getLogger("event-sink:circular-buffer");
}

/**
 * This is an implementation of the [Server-sent Events API](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)
 *
 * It acts as a complement to `EventSource`, providing an interface to _send_ SSEs.
 *
 * Events are pushed onto the EventHistory object.
 */
export class EventSink {
  private eventStream!: WritableStreamDefaultWriter<string>;
  private responseStream!: ReadableStream<Uint8Array>;
  private encoder = new TextEncoderStream();
  private response: Response | null = null;
  private history?: EventHistory<SSEEvent>;

  /**
   * An EventSink can be passed an EventHistory object to record previously sent events.
   * These can be used to replaying events should a reconnect occur with `Last-Event-ID` set.
   *
   * It's up to users of `EventSink` to handle the replaying of events
   *
   * @param history
   */
  constructor(history?: EventHistory<SSEEvent>) {
    this.setupStreams();
    this.history = history;
  }

  private setupStreams() {
    this.responseStream = this.encoder.readable;
    this.eventStream = this.encoder.writable.getWriter();
  }

  private async sendEvent(event: SSEEvent) {
    const { name = "message", content, id, comments = [] } = event;
    const eventBuilder: string[] = [];
    eventBuilder.push(`event: ${name}`);
    if (id !== undefined) {
      eventBuilder.push(`id: ${id}`);
    }
    comments.forEach((comment) => eventBuilder.push(`: ${comment}`));
    eventBuilder.push(`data: ${content}`);
    return this.eventStream.write(`${eventBuilder.join("\n")}\n\n`);
  }

  dispatchEvent(event: SSEEvent): Promise<void>;
  dispatchEvent(
    eventContent: string,
    eventName: string,
    id?: string,
    comments?: string[]
  ): Promise<void>;
  dispatchEvent(
    contentOrEvent: string | SSEEvent,
    eventName?: string,
    id?: string,
    comments?: string[]
  ): Promise<void> {
    logger().debug("dispatchEvent", {
      contentOrEvent,
      eventName,
      id,
      comments,
    });
    const event =
      typeof contentOrEvent === "string"
        ? {
            content: contentOrEvent ?? "",
            name: eventName ?? "message",
            id,
            comments,
          }
        : contentOrEvent;

    if (this.history) {
      this.history.push(event);
    }
    return this.sendEvent(event);
  }

  close(): Promise<void> {
    logger().debug("close", {
      eventStreamClosed: this.eventStream.closed,
      encoderReadableLocked: this.encoder.readable.locked,
      encoderWritableLocked: this.encoder.writable.locked,
    });
    this.eventStream.releaseLock();
    return this.encoder.writable.close();
  }

  getResponse(headers?: Headers): Response {
    if (this.response === null) {
      headers = headers ?? new Headers();
      headers.set("content-type", "text/event-stream");
      headers.set("cache-control", "no-store");

      this.response = new Response(this.responseStream, {
        headers,
      });
    } else if (headers !== undefined) {
      logger().warning(
        "Headers were provided to EventSink.getResponse, but the Response object has already been created"
      );
    }
    return this.response;
  }

  async reset() {
    this.response = null;
    await this.close();
    this.setupStreams();
  }
}
