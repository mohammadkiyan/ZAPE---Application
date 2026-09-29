import { MockDataFooter } from '@/features/development/mock-controls';
import { TabScreen } from '@/features/shell/tab-screen';

export default function More() {
  return <TabScreen tab="more" footer={<MockDataFooter />} />;
}
