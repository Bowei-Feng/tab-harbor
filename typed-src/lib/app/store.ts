export interface Store<T> {
  getState(): T;
  setState(next: T | ((prev: T) => T)): void;
  subscribe(listener: (state: T) => void): () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  return {
    getState() {
      return state;
    },
    setState(next) {
      // 这里故意保持成极简 store：同步更新、同步通知，方便扩展页场景直接推导界面。
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
