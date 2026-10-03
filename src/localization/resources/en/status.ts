import type { status as fa } from '../fa/status';
import type { Strings } from '../types';

export const status: Strings<typeof fa> = {
  title: 'Status',
  subtitle: 'How are you both feeling right now?',
  you: 'You',
  partner: 'Partner',
  moods: {
    happy: 'Happy',
    calm: 'Calm',
    loved: 'Loved',
    missing: 'Missing you',
    focused: 'Focused',
    tired: 'Tired',
    sad: 'Sad',
    upset: 'Upset',
    stressed: 'Stressed',
    unwell: 'Unwell',
  },
  notSet: 'Not set',
  partnerNotSet: 'No status yet',
  change: 'Change status',
  set: 'Set status',
  updated: 'Status updated',
  inSync: 'You’re in sync',
  today: 'Today',
  history: 'Today’s status history',
  historyEmpty: 'No status changes yet today.',
  entry: '{{mood}}, {{time}}, {{owner}}',
  offline: 'Reconnect to change your status.',
  picker: {
    title: 'How are you feeling?',
    current: '{{mood}}, current status',
    hint: 'Your status updates for both of you right away.',
  },
  home: {
    set: 'Set status',
    none: 'No status',
    meta: '{{who}} · {{when}}',
    open: 'Open Status',
  },
};
