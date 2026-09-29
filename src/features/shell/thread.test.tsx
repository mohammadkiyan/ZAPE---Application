import { act, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import Svg from 'react-native-svg';
import { Thread } from './thread';

describe('thread draw-in', () => {
  afterEach(() => jest.restoreAllMocks());

  function renderThread() {
    return render(
      <Svg width={100} height={10}>
        <Thread testID="thread" d="M0 5H100" length={100} />
      </Svg>
    );
  }

  it('renders fully drawn when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const result = renderThread();
    await waitFor(() => expect(result.getByTestId('thread').props.strokeDasharray).toBeUndefined());
  });

  it('draws in with a dash when motion is allowed', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const result = renderThread();
    await waitFor(() => expect(result.getByTestId('thread').props.strokeDasharray).toBeDefined());
  });

  it('follows the reduce motion setting when it changes', async () => {
    let listener: ((value: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      listener = handler as unknown as (value: boolean) => void;
      return { remove: jest.fn() } as never;
    });
    const result = renderThread();
    await waitFor(() => expect(listener).toBeDefined());
    act(() => listener!(true));
    await waitFor(() => expect(result.getByTestId('thread').props.strokeDasharray).toBeUndefined());
  });
});
