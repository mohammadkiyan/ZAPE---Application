import { Fragment, type ReactNode } from 'react';
import { useIsFocused } from 'expo-router';
import type { Relationship } from '@/api/contracts/relationship';
import { useClockStyle, type ClockStyle } from '@/features/clock-themes/use-clock-style';
import { ClockHero } from '@/features/relationship-clock/clock-hero';
import { HomeNoteCard } from '@/features/notes/home-note-card';
import { InviteCard } from '@/features/relationship/invite-card';
import { useRelationship } from '@/features/relationship/use-relationship';
import { HomeHeaderChip } from '@/features/shell/connectivity-ui';
import { TabScreen } from '@/features/shell/tab-screen';
import { HomeStatusThread } from '@/features/status/home-status-thread';
import { THEMES } from '@/theme/clock-themes';

export interface HomeSlotContext {
  relationship: Relationship;
  style: ClockStyle;
  focused: boolean;
}

interface HomeSlot {
  id: string;
  render(context: HomeSlotContext): ReactNode;
}

/**
 * Home, top to bottom, after the header. Later changes insert their slots in place: the
 * occasion eyebrow before the thread, the note card next to the invite card (one of the two
 * shows), the thread/next-up row and the device row at the end. A slot that renders nothing
 * leaves no gap.
 */
const HOME_SLOTS: HomeSlot[] = [
  {
    id: 'thread',
    render: ({ relationship }) => <HomeStatusThread relationship={relationship} />,
  },
  {
    id: 'clock',
    render: ({ relationship, style, focused }) => (
      <ClockHero
        relationship={relationship}
        tone={style.tone}
        variant={THEMES[style.theme].dial}
        visible={focused}
      />
    ),
  },
  { id: 'invite', render: ({ relationship }) => <InviteCard relationship={relationship} /> },
  // Takes the invite card's place once the partner has joined and either of you has a note.
  { id: 'note', render: ({ relationship }) => <HomeNoteCard relationship={relationship} /> },
];

export function HomeScreen() {
  const focused = useIsFocused();
  const style = useClockStyle();
  const relationship = useRelationship().data;
  return (
    <TabScreen tab="home" backdrop heading={false} headerAccessory={<HomeHeaderChip />}>
      {relationship
        ? HOME_SLOTS.map((slot) => (
            <Fragment key={slot.id}>{slot.render({ relationship, style, focused })}</Fragment>
          ))
        : null}
    </TabScreen>
  );
}
