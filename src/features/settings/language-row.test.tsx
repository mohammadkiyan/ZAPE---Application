import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preferencesStore } from '@/preferences/preferences';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { LanguageRow } from './language-row';

function renderRow() {
  return render(
    <TestProviders>
      <LanguageRow />
    </TestProviders>
  );
}

describe('language row', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setTestLocale('fa');
  });

  it('marks the current language and names the row in it', () => {
    const result = renderRow();
    expect(result.getByText('زبان')).toBeTruthy();
    expect(result.getByTestId('more-language-fa')).toBeSelected();
    expect(result.getByTestId('more-language-en')).not.toBeSelected();
  });

  it('switches to English and persists the choice', async () => {
    const result = renderRow();
    fireEvent.press(result.getByTestId('more-language-en'));
    await waitFor(() => expect(preferencesStore.getState().locale).toBe('en'));
    expect(await AsyncStorage.getItem('zape.locale')).toBe('en');
    expect(result.getByTestId('more-language-en')).toBeSelected();
  });

  it('does nothing when the current language is tapped again', async () => {
    const result = renderRow();
    fireEvent.press(result.getByTestId('more-language-fa'));
    expect(await AsyncStorage.getItem('zape.locale')).toBeNull();
  });
});
