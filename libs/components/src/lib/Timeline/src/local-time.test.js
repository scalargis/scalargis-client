import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('displays local time and sends UTC across Lisbon daylight-saving transitions', () => {
  const source = readFileSync(resolve(__dirname, 'time.js'), 'utf8');
  const script = source + `
    const second = Date.parse('2026-10-25T01:30:00Z');
    console.log(JSON.stringify([
      iso(parseLocalInput('2026-07-13T17:05')),
      iso(parseLocalInput('2026-11-13T17:05')),
      localInput(Date.parse('2026-07-13T16:05:00Z')),
      formatDate(Date.parse('2026-07-13T16:05:00Z'), '{h}:{m}'),
      Number.isNaN(parseLocalInput('2026-03-29T01:30')),
      parseLocalInput('2026-10-25T01:30', second) === second,
      iso(parseLocalInput('2026-10-25T01:30')),
      Number.isNaN(parseLocalInput('')),
      iso(snapDate(parseLocalInput('2026-07-14'), parseDimension({ values: '2026-07-01/2026-07-31/P1D' }), 1))
    ]));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...process.env, TZ: 'Europe/Lisbon' }, encoding: 'utf8',
  });
  expect(JSON.parse(output)).toEqual([
    '2026-07-13T16:05:00Z', '2026-11-13T17:05:00Z',
    '2026-07-13T17:05:00', '17:05', true, true, '2026-10-25T00:30:00Z', true, '2026-07-14T00:00:00Z',
  ]);
});
