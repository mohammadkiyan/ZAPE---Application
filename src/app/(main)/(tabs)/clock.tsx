import { ClockStylePanel } from '@/features/clock-themes/clock-style-panel';
import { TabScreen } from '@/features/shell/tab-screen';

export default function RelClock() {
  return (
    <TabScreen tab="clock" backdrop>
      <ClockStylePanel />
    </TabScreen>
  );
}
