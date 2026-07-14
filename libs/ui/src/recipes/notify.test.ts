/**
 * Contract tests for the Toast replacement — 76 call sites migrate onto
 * these defaults, so they are locked here rather than re-checked per screen.
 * @mantine/notifications is mocked: what matters is the payload shape
 * `notify` hands over, not Mantine's own rendering.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';

import { notify } from './notify';

// Hoisted above the imports by vitest.
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn(() => 'id'), hide: vi.fn(), clean: vi.fn() },
}));

const shown = vi.mocked(notifications.show);

beforeEach(() => {
  shown.mockClear();
});

describe('notify', () => {
  it('maps each severity to its immutable ADS foundation palette', () => {
    notify.success('S');
    notify.info('I');
    notify.warn('W');
    notify.error('E');
    expect(shown.mock.calls.map(([data]) => data.color)).toEqual([
      'success',
      'informative',
      'warning',
      'danger',
    ]);
  });

  it('auto-dismisses every severity — errors are NOT sticky (visual pass 2)', () => {
    notify.success('S');
    notify.info('I');
    notify.warn('W');
    notify.error('E');
    expect(shown.mock.calls.map(([data]) => data.autoClose)).toEqual([
      3000, 3000, 5000, 5000,
    ]);
  });

  it('keeps Prime’s summary/detail shape: summary-only renders as the message', () => {
    notify.error('Save failed');
    expect(shown).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined, message: 'Save failed' })
    );
  });

  it('promotes the summary to title when a detail is given', () => {
    notify.success('Saved', 'Record 42 written');
    expect(shown).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved', message: 'Record 42 written' })
    );
  });

  it('treats an empty-string detail as absent, like Prime does', () => {
    notify.warn('Careful', '');
    expect(shown).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined, message: 'Careful' })
    );
  });

  it('lets explicit options win over the defaults (persistent toast opt-in)', () => {
    notify.error('Blocked', 'Action required', { autoClose: false });
    expect(shown).toHaveBeenCalledWith(expect.objectContaining({ autoClose: false }));
  });

  it('always carries an icon — severity is never colour-alone (WCAG 1.4.1)', () => {
    notify.warn('W');
    expect(shown.mock.calls[0][0].icon).toBeTruthy();
  });
});
