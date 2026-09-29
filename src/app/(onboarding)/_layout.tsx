import { Stack } from 'expo-router';
import { ToneProvider } from '@/theme/theme';

/** Onboarding always uses the white brand canvas, whatever clock theme is stored. */
export default function OnboardingLayout() {
  return (
    <ToneProvider tone="light">
      <Stack screenOptions={{ headerShown: false }} />
    </ToneProvider>
  );
}
