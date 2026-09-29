import { refreshAuthorization, setSessionRefresher } from './session';

describe('session seam', () => {
  afterEach(() => setSessionRefresher(async () => false));

  it('shares one refresh between concurrent callers, then allows the next one', async () => {
    let resolve!: (value: boolean) => void;
    const refresher = jest.fn(() => new Promise<boolean>((r) => (resolve = r)));
    setSessionRefresher(refresher);

    const first = refreshAuthorization();
    const second = refreshAuthorization();
    await Promise.resolve();
    resolve(true);
    expect(await Promise.all([first, second])).toEqual([true, true]);
    expect(refresher).toHaveBeenCalledTimes(1);

    setSessionRefresher(async () => false);
    expect(await refreshAuthorization()).toBe(false);
  });
});
