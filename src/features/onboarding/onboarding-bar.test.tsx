import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { OnboardingBar } from './onboarding-bar';

function renderBar(props: Parameters<typeof OnboardingBar>[0]) {
  return render(
    <TestProviders tone="light">
      <OnboardingBar {...props} />
    </TestProviders>
  );
}

describe('onboarding bar', () => {
  beforeEach(() => setTestLocale('fa'));

  it('on the Account step: node 1 current, no skip, the ZAPE mark instead', () => {
    const onBack = jest.fn();
    renderBar({ step: 1, onBack });
    expect(screen.getByLabelText('مرحله ۱ از ۴')).toBeTruthy();
    expect(screen.getByTestId('progress-node-current')).toBeTruthy();
    expect(screen.getAllByTestId('progress-node-future')).toHaveLength(3);
    expect(screen.queryByTestId('progress-node-done')).toBeNull();
    expect(screen.getAllByTestId('progress-line-off')).toHaveLength(3);
    expect(screen.queryByTestId('onboarding-skip')).toBeNull();
    expect(screen.getByTestId('onboarding-brand', { includeHiddenElements: true })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'بازگشت' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('on the Relationship step: node 1 filled, node 2 current, 3–4 dashed', () => {
    renderBar({ step: 2, onBack: jest.fn() });
    expect(screen.getByLabelText('مرحله ۲ از ۴')).toBeTruthy();
    expect(screen.getAllByTestId('progress-node-done')).toHaveLength(1);
    expect(screen.getByTestId('progress-node-current')).toBeTruthy();
    expect(screen.getAllByTestId('progress-node-future')).toHaveLength(2);
    expect(screen.getAllByTestId('progress-line-on')).toHaveLength(1);
  });

  it('pins no layout direction, so the thread mirrors with the app', async () => {
    for (const locale of ['fa', 'en'] as const) {
      await setTestLocale(locale);
      const { unmount } = renderBar({ step: 1, onBack: jest.fn() });
      const style = StyleSheet.flatten(screen.getByTestId('onboarding-bar').props.style);
      expect(style.direction).toBeUndefined();
      unmount();
    }
  });

  it('offers «بعداً» on a skippable step', () => {
    const onSkip = jest.fn();
    renderBar({ step: 3, onBack: jest.fn(), onSkip });
    fireEvent.press(screen.getByText('بعداً'));
    expect(onSkip).toHaveBeenCalled();
    expect(screen.queryByTestId('onboarding-brand', { includeHiddenElements: true })).toBeNull();
  });

  it('on Ready: every node filled, no Back, labelled as complete', async () => {
    renderBar({ step: 5 });
    expect(screen.getByLabelText('راه‌اندازی کامل شد')).toBeTruthy();
    expect(screen.getAllByTestId('progress-node-done')).toHaveLength(4);
    expect(screen.getAllByTestId('progress-line-on')).toHaveLength(3);
    expect(screen.queryByTestId('onboarding-back')).toBeNull();

    await setTestLocale('en');
    renderBar({ step: 5 });
    expect(screen.getByLabelText('Setup complete')).toBeTruthy();
  });

  it('shows no progress on Welcome', () => {
    renderBar({ step: 0 });
    expect(screen.queryByTestId('onboarding-progress')).toBeNull();
  });
});
