import { useIsFocused } from 'expo-router';
import { ClockStylePanel } from '@/features/clock-themes/clock-style-panel';
import { useClockStyle } from '@/features/clock-themes/use-clock-style';
import { useRelationship } from '@/features/relationship/use-relationship';
import { TabScreen } from '@/features/shell/tab-screen';
import { ClockFace } from './clock-face';

/** The Rel Clock tab: the clock face on its own backdrop, then the Clock style panel. */
export function RelClockScreen() {
  const focused = useIsFocused();
  const style = useClockStyle();
  const relationship = useRelationship().data;
  return (
    <TabScreen tab="clock" heading={false}>
      {relationship ? (
        <ClockFace
          relationship={relationship}
          theme={style.theme}
          background={style.background}
          visible={focused}
        />
      ) : null}
      <ClockStylePanel />
    </TabScreen>
  );
}
