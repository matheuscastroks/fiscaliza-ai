import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { focusManager, onlineManager } from '@tanstack/react-query';

/**
 * O React Native não tem os eventos de foco e de rede do navegador. Sem isto,
 * as consultas não pausam sem internet, não voltam ao reconectar e não se
 * renovam quando o app volta para a frente.
 */
let started = false;
const reconnectListeners = new Set<() => void>();

/** Chamado quando a internet volta ou o app volta para a frente. */
export function onReconnectOrForeground(listener: () => void): () => void {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}

function notify() {
  for (const listener of reconnectListeners) listener();
}

export function startQueryLifecycle() {
  if (started || Platform.OS === 'web') return;
  started = true;

  onlineManager.setEventListener((setOnline) => {
    let wasOnline = true;
    const subscription = Network.addNetworkStateListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(online);
      if (online && !wasOnline) notify();
      wasOnline = online;
    });
    return () => subscription.remove();
  });

  let previous: AppStateStatus | string | null | undefined = AppState.currentState;
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
    if (status === 'active' && previous !== 'active') notify();
    previous = status;
  });
}
