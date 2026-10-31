// PostgreSQL-backed change notifications shared by authenticated dashboard streams (PS-28).
import { EventEmitter } from 'node:events';
import { Client } from 'pg';

const CHANNEL_NAME = 'dashboard_changed';
const RECONNECT_DELAY_MS = 5_000;
const dashboardEvents = new EventEmitter();
dashboardEvents.setMaxListeners(0);

let listenerClient = null;
let reconnectTimer = null;
let isConnecting = false;
let isStopped = false;

const scheduleReconnect = () => {
  if (isStopped || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectListener();
  }, RECONNECT_DELAY_MS);
  reconnectTimer.unref?.();
};

const connectListener = async () => {
  if (isStopped || isConnecting || !process.env.DATABASE_URL) return;
  isConnecting = true;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const handleDisconnect = () => {
    if (listenerClient === client) listenerClient = null;
    client.end().catch(scheduleReconnect);
    scheduleReconnect();
  };

  client.on('notification', ({ channel }) => {
    if (channel === CHANNEL_NAME) dashboardEvents.emit('changed');
  });
  client.on('error', handleDisconnect);
  client.on('end', handleDisconnect);

  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL_NAME}`);
    listenerClient = client;
  } catch {
    await client.end().catch(scheduleReconnect);
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};

export const startDashboardListener = () => {
  isStopped = false;
  void connectListener();
};

export const stopDashboardListener = async () => {
  isStopped = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (!listenerClient) return;
  const client = listenerClient;
  listenerClient = null;
  await client.end();
};

export const subscribeToDashboardChanges = (listener) => {
  dashboardEvents.on('changed', listener);
  return () => dashboardEvents.off('changed', listener);
};
