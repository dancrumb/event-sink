import console from "console";
import { type EventHistory } from "./event-history.js";
import { type SSEEvent } from "./sse-event.js";

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

  /**
   * Replay events in the history since the provided event ID
   *
   * @param lastEventId The ID of the last event received by the client; generally this will come from the Last-Event-ID header
   */
  async replaySince(lastEventId: string): Promise<void> {
    if (!this.history) {
      console.warn(
        "No history object provided to EventSink, cannot replay events"
      );
      return Promise.resolve();
    }
    if (!this.response) {
      console.warn("Response object not yet created, cannot replay events");
      return Promise.resolve();
    }
    let foundLastId = false;
    for (let i = 0; i < this.history.length; i++) {
      const event = this.history[i];
      if (event.id === lastEventId) {
        foundLastId = true;
      }
      if (foundLastId) {
        await this.sendEvent(event);
      }
    }
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
    this.eventStream.releaseLock();
    return this.encoder.writable.close();
  }

  getResponse(headers?: Headers): Response {
    if (this.response === null) {
      headers = headers ?? new Headers();
      headers.set("content-type", "text/event-stream");
      headers.set("cache-control", "no-store");
      headers.set("x-accel-buffering", "no"); // for nginx

      this.response = new Response(this.responseStream, {
        headers,
      });
    } else if (headers !== undefined) {
      /* v8 ignore start */
      console.warn(
        "Headers were provided to EventSink.getResponse, but the Response object has already been created"
      );
      /* v8 ignore end */
    }
    return this.response;
  }

  async reset() {
    this.response = null;
    await this.close();
    this.setupStreams();
  }
}
