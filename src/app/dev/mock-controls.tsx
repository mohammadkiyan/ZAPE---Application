import { View } from 'react-native';
import { MockControlsSheet } from '@/features/development/mock-controls';

export default function MockControls() {
  return (
    <View className="flex-1 bg-background">
      <MockControlsSheet />
    </View>
  );
}
