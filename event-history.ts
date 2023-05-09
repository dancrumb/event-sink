/**
 * An EventHistory is an ordered set of past events.
 *
 * It can be used to support replaying events following a reconnection
 */
export interface EventHistory<E> extends Pick<Array<E>, "push">, ArrayLike<E> {
  purge(): void;
}
