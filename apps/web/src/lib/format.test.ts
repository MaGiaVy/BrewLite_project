import { describe, expect, it } from 'vitest';
import { formatVnd } from './format';

describe('formatVnd', () => {
  it('appends the đ suffix', () => {
    expect(formatVnd(25000)).toMatch(/^25[.,\u00a0]?000đ$/);
  });
});
