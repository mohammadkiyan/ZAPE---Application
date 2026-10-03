import { createApiClient } from './client';
import { getServerOffsetMs, recordServerDate, resetServerClock, serverNow } from './server-clock';

const PHONE_NOW = Date.parse('2026-10-03T12:00:00.000Z');

describe('server clock', () => {
  beforeEach(() => {
    resetServerClock();
    jest.spyOn(Date, 'now').mockReturnValue(PHONE_NOW);
  });
  afterEach(() => jest.restoreAllMocks());

  it('is the phone clock until a response says otherwise', () => {
    expect(getServerOffsetMs()).toBe(0);
    expect(serverNow()).toBe(PHONE_NOW);
  });

  it('follows a server that is ahead of the phone', () => {
    // The phone is 7 minutes slow; the request took 200 ms.
    recordServerDate('Sat, 03 Oct 2026 12:07:00 GMT', PHONE_NOW - 200, PHONE_NOW);
    expect(getServerOffsetMs()).toBe(7 * 60_000 + 500 + 100);
    expect(serverNow()).toBe(PHONE_NOW + 7 * 60_000 + 600);
  });

  it('follows a server that is behind the phone', () => {
    recordServerDate('Sat, 03 Oct 2026 11:50:00 GMT', PHONE_NOW, PHONE_NOW);
    expect(getServerOffsetMs()).toBe(-10 * 60_000 + 500);
  });

  it('ignores a difference smaller than the header can express', () => {
    recordServerDate('Sat, 03 Oct 2026 12:00:01 GMT', PHONE_NOW - 300, PHONE_NOW);
    expect(getServerOffsetMs()).toBe(0);
    recordServerDate('Sat, 03 Oct 2026 11:59:59 GMT', PHONE_NOW, PHONE_NOW);
    expect(getServerOffsetMs()).toBe(0);
  });

  it('keeps the last offset when a response has no usable Date', () => {
    recordServerDate('Sat, 03 Oct 2026 12:07:00 GMT', PHONE_NOW, PHONE_NOW);
    const offset = getServerOffsetMs();
    recordServerDate(null, PHONE_NOW, PHONE_NOW);
    recordServerDate(undefined, PHONE_NOW, PHONE_NOW);
    recordServerDate('not a date', PHONE_NOW, PHONE_NOW);
    expect(getServerOffsetMs()).toBe(offset);
  });
});

describe('API client and the server clock', () => {
  beforeEach(() => {
    resetServerClock();
    jest.spyOn(Date, 'now').mockReturnValue(PHONE_NOW);
  });
  afterEach(() => jest.restoreAllMocks());

  function respond(status: number, body: unknown, date?: string) {
    return jest.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
      headers: { get: (name: string) => (name.toLowerCase() === 'date' ? (date ?? null) : null) },
    })) as unknown as typeof fetch;
  }

  it('captures the offset from a response Date header', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.test/',
      fetcher: respond(200, { ok: true }, 'Sat, 03 Oct 2026 12:07:00 GMT'),
    });
    await api.request('relationships/current/statuses');
    expect(getServerOffsetMs()).toBe(7 * 60_000 + 500);
  });

  it('captures it from an error response too', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.test/',
      fetcher: respond(404, { code: 'no_relationship' }, 'Sat, 03 Oct 2026 11:50:00 GMT'),
    });
    await expect(api.request('relationships/current/notes')).rejects.toMatchObject({
      serverCode: 'no_relationship',
    });
    expect(getServerOffsetMs()).toBe(-10 * 60_000 + 500);
  });

  it('works with a response that has no headers at all', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '{"ok":true}',
    })) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'https://api.example.test/', fetcher });
    await expect(api.request('health')).resolves.toEqual({ ok: true });
    expect(getServerOffsetMs()).toBe(0);
  });
});
