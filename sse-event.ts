/**
 * A representation of a Server-sent Event
 */
export type SSEEvent = {
  name: string;
  content: string;
  id?: string;
  comments?: string[];
};
