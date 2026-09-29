import { Redirect, Stack, useSegments } from 'expo-router';
import { EntryPending } from '@/features/onboarding/entry-pending';
import { entryHref } from '@/features/onboarding/resolve-entry';
import { takeDeferredLink, useEntry } from '@/features/onboarding/use-entry';
import { ToneProvider } from '@/theme/theme';

/** Screens the gate places people on; registered step screens navigate themselves. */
const GATE_SCREENS = ['welcome', 'sign-in', 'name', 'ready'];
const SIGNED_OUT_SCREENS = ['welcome', 'sign-in'];

function OnboardingGate() {
  const { entry, session, meQuery } = useEntry();
  const screen = useSegments().at(-1) ?? 'welcome';

  if (entry === 'main') return <Redirect href={takeDeferredLink() ?? '/'} />;
  if (entry === 'loading') return <EntryPending query={meQuery} />;
  if (session === 'signed-out' && !SIGNED_OUT_SCREENS.includes(screen)) {
    return <Redirect href="/welcome" />;
  }
  if (session === 'signed-in' && GATE_SCREENS.includes(screen) && screen !== entry) {
    return <Redirect href={entryHref(entry)} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Onboarding always uses the white brand canvas, whatever clock theme is stored. */
export default function OnboardingLayout() {
  return (
    <ToneProvider tone="light">
      <OnboardingGate />
    </ToneProvider>
  );
}
