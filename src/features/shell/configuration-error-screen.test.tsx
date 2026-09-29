import { render } from '@testing-library/react-native';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { Text } from 'react-native';
import { BackendGate, ConfigurationErrorScreen } from './configuration-error-screen';

describe('configuration error screen', () => {
  it('explains a misconfigured release build in Persian and English', async () => {
    await setTestLocale('fa');
    const result = render(
      <TestProviders>
        <ConfigurationErrorScreen />
      </TestProviders>
    );
    expect(result.getByText('پیکربندی ناقص است')).toBeTruthy();
    expect(result.queryByRole('button')).toBeNull();

    await setTestLocale('en');
    result.rerender(
      <TestProviders>
        <ConfigurationErrorScreen />
      </TestProviders>
    );
    expect(result.getByText('Configuration incomplete')).toBeTruthy();
  });

  it('replaces the app when the backend is misconfigured', () => {
    const app = <Text>app content</Text>;
    const misconfigured = render(
      <TestProviders>
        <BackendGate backend="misconfigured">{app}</BackendGate>
      </TestProviders>
    );
    expect(misconfigured.getByTestId('configuration-error')).toBeTruthy();
    expect(misconfigured.queryByText('app content')).toBeNull();

    for (const backend of ['real', 'mock'] as const) {
      const result = render(
        <TestProviders>
          <BackendGate backend={backend}>{app}</BackendGate>
        </TestProviders>
      );
      expect(result.getByText('app content')).toBeTruthy();
      expect(result.queryByTestId('configuration-error')).toBeNull();
    }
  });
});
