import { act, render } from '@testing-library/react-native';
import { Pressable, Text as RNText } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { HomeHeaderChip, useOnlineAction } from './connectivity-ui';

function SaveButton() {
  const { disabled, hint } = useOnlineAction();
  return (
    <>
      <Pressable testID="save" accessibilityRole="button" disabled={disabled} />
      {hint ? <RNText>{hint}</RNText> : null}
    </>
  );
}

describe('connectivity UI', () => {
  beforeEach(() => setTestLocale('fa'));
  afterEach(() => act(() => onlineManager.setOnline(true)));

  it('swaps the Home chip for the offline notice and back', async () => {
    const result = render(
      <TestProviders>
        <HomeHeaderChip>
          <RNText>streak chip</RNText>
        </HomeHeaderChip>
      </TestProviders>
    );
    expect(result.getByText('streak chip')).toBeTruthy();

    act(() => onlineManager.setOnline(false));
    expect(result.getByText('آفلاین · ساعت همچنان می‌شمارد')).toBeTruthy();
    expect(result.queryByText('streak chip')).toBeNull();

    await setTestLocale('en');
    result.rerender(
      <TestProviders>
        <HomeHeaderChip />
      </TestProviders>
    );
    expect(result.getByText('Offline · the clock keeps counting')).toBeTruthy();

    act(() => onlineManager.setOnline(true));
    expect(result.queryByTestId('offline-chip')).toBeNull();
  });

  it('disables shared-data writes while offline with a reconnect message', () => {
    const result = render(
      <TestProviders>
        <SaveButton />
      </TestProviders>
    );
    expect(result.getByTestId('save')).toBeEnabled();

    act(() => onlineManager.setOnline(false));
    expect(result.getByTestId('save')).toBeDisabled();
    expect(result.getByText('برای ادامه به اینترنت وصل شوید.')).toBeTruthy();

    act(() => onlineManager.setOnline(true));
    expect(result.getByTestId('save')).toBeEnabled();
  });
});
