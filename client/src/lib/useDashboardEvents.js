// Authenticated SSE connection with bounded reconnect delays (PS-28).
import { useEffect } from 'react';
import { tokenStore } from './api.js';

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

const waitForReconnect = (delayMs, signal) =>
  new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);
    if (signal.aborted) finish();
    else signal.addEventListener('abort', finish, { once: true });
  });

const readDashboardStream = async (signal) => {
  const token = tokenStore.get();
  const response = await fetch('/api/reports/events', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  if (response.status === 401) window.dispatchEvent(new Event('auth:expired'));
  if (!response.ok || !response.body) throw new Error(`Dashboard stream returned ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = `${buffer}${decoder.decode(value, { stream: true })}`.replace(/\r\n/g, '\n');
      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const event = frame
          .split('\n')
          .find((line) => line.startsWith('event:'))
          ?.slice(6)
          .trim();
        if (event === 'changed') window.dispatchEvent(new Event('dashboard:changed'));
        frameEnd = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export function useDashboardEvents(isActive) {
  useEffect(() => {
    if (!isActive) return undefined;

    const controller = new AbortController();
    let retryDelay = INITIAL_RETRY_DELAY_MS;

    const maintainConnection = async () => {
      while (!controller.signal.aborted) {
        try {
          await readDashboardStream(controller.signal);
          throw new Error('Dashboard event stream closed');
        } catch (connectionError) {
          if (controller.signal.aborted || connectionError.name === 'AbortError') return;
          await waitForReconnect(retryDelay, controller.signal);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
        }
      }
    };

    void maintainConnection();
    return () => controller.abort();
  }, [isActive]);
}
