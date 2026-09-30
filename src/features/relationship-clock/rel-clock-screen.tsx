import { useIsFocused } from 'expo-router';
import { ClockStylePanel } from '@/features/clock-themes/clock-style-panel';
import { useClockStyle } from '@/features/clock-themes/use-clock-style';
import { useRelationship } from '@/features/relationship/use-relationship';
import { TabScreen } from '@/features/shell/tab-screen';
import { THEMES } from '@/theme/clock-themes';
import { ClockFace } from './clock-face';

/** The Rel Clock tab: the clock face over the theme background, then the Clock style panel. */
export function RelClockScreen() {
  const focused = useIsFocused();
  const style = useClockStyle();
  const relationship = useRelationship().data;
  return (
    <TabScreen tab="clock" backdrop heading={false}>
      {relationship ? (
        <ClockFace
          relationship={relationship}
          tone={style.tone}
          variant={THEMES[style.theme].dial}
          visible={focused}
        />
      ) : null}
      <ClockStylePanel />
    </TabScreen>
  );
}
