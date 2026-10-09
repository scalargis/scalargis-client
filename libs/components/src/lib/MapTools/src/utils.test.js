import { describe, expect, it } from 'vitest';
import { defaultLengthText } from './utils';

describe('defaultLengthText', () => {
  it('gives km with 2 decimals from 1 km', () => {
    expect(defaultLengthText(8092.672)).toBe('8.09 km');
    expect(defaultLengthText(1000)).toBe('1.00 km');
  });

  it('gives m with 2 decimals below 1 km', () => {
    expect(defaultLengthText(999.994)).toBe('999.99 m');
    expect(defaultLengthText(12.3)).toBe('12.30 m');
  });
});
