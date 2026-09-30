import { MockDataFooter } from '@/features/development/mock-controls';
import { RelationshipMoreRow } from '@/features/relationship/relationship-screen';
import { TabScreen } from '@/features/shell/tab-screen';

export default function More() {
  return (
    <TabScreen tab="more" footer={<MockDataFooter />}>
      <RelationshipMoreRow />
    </TabScreen>
  );
}
