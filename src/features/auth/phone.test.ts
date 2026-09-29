import { normalizePhoneNumber, parsePhoneNumber, sanitizeCode } from './phone';

describe('phone numbers', () => {
  it.each([
    ['09123456789', '+989123456789'],
    ['۰۹۱۲ ۳۴۵ ۶۷۸۹', '+989123456789'],
    ['912-345-6789', '+989123456789'],
    ['989123456789', '+989123456789'],
    ['+98 912 345 6789', '+989123456789'],
  ])('normalizes %s to %s', (raw, e164) => {
    expect(normalizePhoneNumber(raw)).toBe(e164);
    expect(parsePhoneNumber(raw)).toBe(e164);
  });

  it.each([
    '',
    '0912',
    '0049 30 1234567',
    'mohammad@example.com',
    '+0123456789',
    '+98912345678901234',
  ])('rejects %j', (raw) => {
    expect(parsePhoneNumber(raw)).toBeNull();
  });

  it('keeps only six ASCII digits of a code', () => {
    expect(sanitizeCode('۳۱۸ ۷۴۲')).toBe('318742');
    expect(sanitizeCode('Your code: 318742.')).toBe('318742');
    expect(sanitizeCode('31874299')).toBe('318742');
  });
});
