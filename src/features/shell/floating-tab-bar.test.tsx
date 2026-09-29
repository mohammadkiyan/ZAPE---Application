import { fireEvent, render } from '@testing-library/react-native';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { FloatingTabBar } from './floating-tab-bar';

function renderBar(props: Partial<Parameters<typeof FloatingTabBar>[0]> = {}) {
  const onSelect = jest.fn();
  const result = render(
    <TestProviders>
      <FloatingTabBar active="home" onSelect={onSelect} {...props} />
    </TestProviders>
  );
  return { ...result, onSelect };
}

describe('floating tab bar', () => {
  beforeEach(() => setTestLocale('fa'));

  it('shows the five Persian tabs in order with Home selected', () => {
    const result = renderBar();
    const tabs = result.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'خانه',
      'زمان ما',
      'حال',
      'یادداشت',
      'بیشتر',
    ]);
    expect(result.getByRole('tab', { name: 'خانه' })).toBeSelected();
    expect(result.getByRole('tab', { name: 'حال' })).not.toBeSelected();
    expect(result.getByTestId('tab-bar').props).toMatchObject({
      accessibilityRole: 'tablist',
      accessibilityLabel: 'بخش‌های RelTime',
    });
  });

  it('shows English labels', async () => {
    await setTestLocale('en');
    const result = renderBar({ active: 'clock' });
    expect(result.getByText('Rel Clock')).toBeTruthy();
    expect(result.getByRole('tab', { name: 'Rel Clock' })).toBeSelected();
  });

  it('moves the active state and reports selection', () => {
    const result = renderBar();
    fireEvent.press(result.getByRole('tab', { name: 'حال' }));
    expect(result.onSelect).toHaveBeenCalledWith('status');
    result.rerender(
      <TestProviders>
        <FloatingTabBar active="status" onSelect={result.onSelect} />
      </TestProviders>
    );
    expect(result.getByRole('tab', { name: 'حال' })).toBeSelected();
    expect(result.getByRole('tab', { name: 'خانه' })).not.toBeSelected();
  });

  it('marks an unread partner note unless the Note tab is active', async () => {
    const result = renderBar({ unread: true });
    expect(result.getByTestId('tab-note-unread')).toBeTruthy();
    expect(result.getByRole('tab', { name: 'یادداشت، یادداشت تازه از همراه شما' })).toBeTruthy();

    result.rerender(
      <TestProviders>
        <FloatingTabBar active="note" unread onSelect={result.onSelect} />
      </TestProviders>
    );
    expect(result.queryByTestId('tab-note-unread')).toBeNull();
    expect(result.getByRole('tab', { name: 'یادداشت' })).toBeSelected();

    await setTestLocale('en');
    result.rerender(
      <TestProviders>
        <FloatingTabBar active="home" unread onSelect={result.onSelect} />
      </TestProviders>
    );
    expect(result.getByRole('tab', { name: 'Note, new note from your partner' })).toBeTruthy();
  });

  it('gives every tab a touch target of at least 44 points', () => {
    const result = renderBar();
    for (const tab of result.getAllByRole('tab')) {
      expect(tab.props.style.height).toBeGreaterThanOrEqual(44);
    }
  });
});
