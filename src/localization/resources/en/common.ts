import type { common as fa } from '../fa/common';
import type { Strings } from '../types';

export const common: Strings<typeof fa> = {
  back: 'Back',
  backTo: 'Back to {{origin}}',
  retry: 'Try again',
  close: 'Close',
  offline: 'Offline · the clock keeps counting',
  reconnectToContinue: 'Reconnect to the internet to continue.',
  waitingToSync: 'Waiting to sync',
  errors: {
    network: "Couldn't connect. Check your internet and try again.",
    timeout: 'No response. Try again.',
    server: 'Something went wrong. Try again in a moment.',
    notFound: "This item couldn't be found.",
    invalidResponse: 'The response was invalid. Try again.',
    unauthorized: 'Your session ended. Sign in again.',
    request: "The request couldn't be completed.",
    saveFailed: "Couldn't save — try again",
  },
};
