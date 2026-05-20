import { describe, expect, it } from 'vitest';
import { hasExistingCopyright } from '../src/services/copyrightService.js';

describe('copyrightService', () => {
  it('detects existing copyright metadata', () => {
    expect(hasExistingCopyright({ copyright: 'Someone' } as never)).toBe(true);
  });

  it('treats blank copyright as absent', () => {
    expect(hasExistingCopyright({ copyright: '   ' } as never)).toBe(false);
  });
});
