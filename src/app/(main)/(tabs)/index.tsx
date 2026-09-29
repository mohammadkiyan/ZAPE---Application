import { HomeHeaderChip } from '@/features/shell/connectivity-ui';
import { TabScreen } from '@/features/shell/tab-screen';

export default function Home() {
  return <TabScreen tab="home" backdrop headerAccessory={<HomeHeaderChip />} />;
}
