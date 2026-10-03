import type { notes as fa } from '../fa/notes';
import type { Strings } from '../types';

export const notes: Strings<typeof fa> = {
  title: 'Notes',
  subtitle: 'Something small to leave for each other.',
  partnerNote: 'Partner’s note',
  yourNote: 'Your note',
  new: 'NEW',
  noPartnerNote: 'No note yet.',
  noYourNote: 'You haven’t left a note yet.',
  today: 'Today · {{time}}',
  yesterday: 'Yesterday · {{time}}',
  updated: 'Updated {{when}}',
  edited: 'Edited · {{when}}',
  seen: 'Seen by partner · {{when}}',
  edit: 'Edit note',
  write: 'Write a note',
  offline: 'Reconnect to edit your note.',
  compose: {
    counter: '{{count}} / {{max}}',
    helper: 'Your partner sees it on their phone and RelTime.',
    cancel: 'Cancel',
    save: 'Leave note',
  },
  saved: 'Your note was left',
  home: {
    you: 'You',
    partner: 'Partner',
    quote: '“{{text}}”',
    open: 'Open Notes',
  },
};
