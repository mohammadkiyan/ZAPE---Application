import { AppState, Platform, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { ApiError } from './client';

/** Shared data the partner can change refreshes at least this often while the app is in the foreground. */
export const PARTNER_DATA_INTERVAL_MS = 30_000;

/** Spread into queries for partner-mutable data (status, note, check-ins, proposals, membership, devices). */
export const partnerDataRefresh = {
  refetchInterval: PARTNER_DATA_INTERVAL_MS,
  refetchIntervalInBackground: false,
} as const;

export function isConnectivityError(error: unknown): boolean {
  return error instanceof ApiError && (error.code === 'network_error' || error.code === 'timeout');
}

function isOnline(state: NetInfoState): boolean {
  // `null` means "not determined yet"; only a definite false counts as offline.
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * Wires TanStack Query to the phone: refetch on foreground (AppState) and on reconnect (NetInfo).
 * Returns a cleanup function.
 */
export function wireQueryManagers(): () => void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(isOnline(state)))
  );
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (Platform.OS !== 'web') setFocused(status === 'active');
    });
    return () => subscription.remove();
  });
  return () => {
    onlineManager.setEventListener(() => undefined);
    focusManager.setEventListener(() => undefined);
  };
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'online',
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        // Client errors (bad request, unauthorized, not found, invalid payload) will not fix themselves.
        retry: (failureCount, error) =>
          failureCount < 2 &&
          !(
            error instanceof ApiError &&
            (error.code === 'invalid_response' ||
              error.code === 'invalid_request' ||
              (error.status !== undefined && error.status < 500))
          ),
      },
      mutations: {
        // Paused while offline; a request dropped mid-flight waits for the connection and retries.
        networkMode: 'online',
        retry: (failureCount, error) => failureCount < 3 && isConnectivityError(error),
      },
    },
  });
}
