import { describe, expect, it } from 'vitest';

import { toCSV } from './exportCSV';

describe('toCSV', () => {
  it('neutralises formula injection in leading = + - @', () => {
    const rows = [{ v: '=1+1' }, { v: '+cmd' }, { v: '-cmd' }, { v: '@SUM(A1)' }];
    const csv = toCSV(rows, [{ accessor: 'v' }], { includeHeader: false });
    expect(csv.split('\r\n')).toEqual(['\t=1+1', '\t+cmd', '\t-cmd', '\t@SUM(A1)']);
  });
});
