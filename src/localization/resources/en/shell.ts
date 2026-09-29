import type { shell as fa } from '../fa/shell';
import type { Strings } from '../types';

export const shell: Strings<typeof fa> = {
  sections: 'RelTime sections',
  tabs: {
    home: 'Home',
    clock: 'Rel Clock',
    status: 'Status',
    note: 'Note',
    more: 'More',
  },
  unreadNoteSuffix: ', new note from your partner',
  skeleton: 'This section is built in a later step.',
  clockStyle: {
    title: 'Clock style',
    open: 'Open clock style',
    theme: 'Theme',
    background: 'Background',
    themes: 'Themes',
    backgrounds: 'Backgrounds',
    current: '{{name}}, current choice',
  },
  mock: {
    marker: 'Mock data',
    controls: 'Mock controls',
    reset: 'Reset mock data',
    resetDone: 'Mock data was reset.',
    noActions: 'No partner actions are registered yet.',
    partnerActions: 'Partner actions',
    signInCode: 'Mock sign-in code: {{code}}',
  },
  configError: {
    title: 'Configuration incomplete',
    body: 'This build is not connected to a server. Please install an updated version of the app.',
  },
  readiness: {
    foundation: 'Development foundation',
    ready: 'App foundation is ready',
    detail: 'Development builds for iOS and Android are ready. Product features come next.',
  },
};
