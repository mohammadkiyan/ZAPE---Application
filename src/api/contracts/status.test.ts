import contract from './fixtures/zape-status-notes.contract.json';
import {
  MOODS,
  STATUS_ERROR_CODES,
  setStatusSchema,
  statusBoardSchema,
  statusSchema,
} from './status';

describe('status contract', () => {
  it('parses the status board ZAPE returns', () => {
    const board = statusBoardSchema.parse(contract.responses.statusBoard);
    expect(board).toEqual(contract.responses.statusBoard);
    expect(board.you).toEqual({ mood: 'happy', at: '2026-10-03T12:45:00.000Z' });
    expect(board.today.map((event) => event.owner)).toEqual(['you', 'partner', 'you']);
  });

  it('parses a board after the relationship day turned over: statuses stay, today is empty', () => {
    const board = statusBoardSchema.parse(contract.responses.statusBoardAfterMidnight);
    expect(board).toEqual({
      you: { mood: 'happy', at: '2026-10-03T12:45:00.000Z' },
      partner: null,
      today: [],
    });
  });

  it('parses the status a save returns', () => {
    expect(statusSchema.parse(contract.responses.status)).toEqual({
      mood: 'tired',
      at: '2026-10-03T13:05:12.345Z',
    });
  });

  it('has the ten moods in picker order', () => {
    expect(MOODS).toEqual([
      'happy',
      'calm',
      'loved',
      'missing',
      'focused',
      'tired',
      'sad',
      'upset',
      'stressed',
      'unwell',
    ]);
  });

  it('rejects a mood outside the catalog, a local time and an unknown owner', () => {
    expect(statusSchema.safeParse({ mood: 'angry', at: '2026-10-03T12:45:00.000Z' }).success).toBe(
      false
    );
    expect(statusSchema.safeParse({ mood: 'happy', at: '2026-10-03 16:15' }).success).toBe(false);
    expect(
      statusBoardSchema.safeParse({
        you: null,
        partner: null,
        today: [{ owner: 'user-1002', mood: 'happy', at: '2026-10-03T12:45:00.000Z' }],
      }).success
    ).toBe(false);
  });

  it('sends only the mood: no owner and no time', () => {
    expect(
      setStatusSchema.parse({ mood: 'loved', owner: 'partner', at: '2020-01-01T00:00:00.000Z' })
    ).toEqual({ mood: 'loved' });
    expect(setStatusSchema.safeParse({ mood: 'angry' }).success).toBe(false);
  });

  it('knows every status error code ZAPE answers with', () => {
    for (const code of STATUS_ERROR_CODES) {
      expect(contract.errors).toHaveProperty(code);
    }
    expect(contract.errors.invalid_mood).toBe(400);
  });
});
