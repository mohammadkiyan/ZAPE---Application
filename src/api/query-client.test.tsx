import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ApiError } from './client';
import { useConnectivity } from './connectivity';
import { createQueryClient, partnerDataRefresh, wireQueryManagers } from './query-client';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));

function emitNetInfo(isConnected: boolean) {
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls.at(-1)![0];
  act(() => listener({ isConnected, isInternetReachable: isConnected } as NetInfoState));
}

describe('query client connectivity', () => {
  let unwire: () => void;
  const clients: QueryClient[] = [];
  beforeEach(() => {
    unwire = wireQueryManagers();
  });
  afterEach(() => {
    cleanup();
    clients.splice(0).forEach((client) => client.clear());
    unwire();
    onlineManager.setOnline(true);
  });

  function trackedClient() {
    const client = createQueryClient();
    // No garbage-collection timers, so Jest can exit.
    const defaults = client.getDefaultOptions();
    client.setDefaultOptions({
      queries: { ...defaults.queries, gcTime: Infinity },
      mutations: { ...defaults.mutations, gcTime: Infinity },
    });
    clients.push(client);
    return client;
  }

  function wrapper(client = trackedClient()) {
    return ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  it('refetches queries when connectivity returns', async () => {
    const fetcher = jest.fn(async () => 'status');
    const { result } = renderHook(
      () => useQuery({ queryKey: ['partner-status'], queryFn: fetcher, ...partnerDataRefresh }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.data).toBe('status'));
    expect(fetcher).toHaveBeenCalledTimes(1);

    emitNetInfo(false);
    emitNetInfo(true);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it('exposes connectivity for banners and disabled actions', () => {
    const { result } = renderHook(() => useConnectivity());
    expect(result.current.online).toBe(true);
    emitNetInfo(false);
    expect(result.current.online).toBe(false);
    emitNetInfo(true);
    expect(result.current.online).toBe(true);
  });

  it('pauses writes while offline and sends them on reconnect', async () => {
    const write = jest.fn(async () => 'saved');
    const { result } = renderHook(() => useMutation({ mutationFn: write }), {
      wrapper: wrapper(),
    });
    emitNetInfo(false);
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isPaused).toBe(true));
    expect(write).not.toHaveBeenCalled();

    emitNetInfo(true);
    await waitFor(() => expect(result.current.data).toBe('saved'));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('retries a write that lost its connection mid-request once back online', async () => {
    const write = jest
      .fn()
      .mockRejectedValueOnce(new ApiError('Network request failed', 'network_error'))
      .mockResolvedValue('saved');
    const client = trackedClient();
    client.setDefaultOptions({
      mutations: { ...client.getDefaultOptions().mutations, retryDelay: 0 },
    });
    const { result } = renderHook(() => useMutation({ mutationFn: write }), {
      wrapper: wrapper(client),
    });
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.data).toBe('saved'));
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('polls partner data every 30 seconds in the foreground only', () => {
    expect(partnerDataRefresh).toEqual({
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    });
  });
});
