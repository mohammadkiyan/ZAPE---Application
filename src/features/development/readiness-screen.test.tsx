import { render } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/localization/i18n';
import { ReadinessScreen } from './readiness-screen';

describe('development readiness', () => {
  it('shows a branded Persian infrastructure-only message', async () => {
    const result = await render(
      <I18nextProvider i18n={i18n}>
        <ReadinessScreen />
      </I18nextProvider>
    );
    expect(result.getByText('ZAPE')).toBeTruthy();
    expect(result.getByText('زیرساخت اپلیکیشن آماده است')).toBeTruthy();
  });
});
