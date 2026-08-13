import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import i18next from 'i18next';

import PasswordRules, {
  fetchPasswordPolicy,
  resetPasswordPolicyCache,
  getPasswordRules,
  validatePasswordAgainstPolicy
} from './index';


// What GET /api/security/password_policy answers with the shipped defaults.
const DEFAULT_POLICY = {
  min_length: 12,
  require_uppercase: true,
  require_lowercase: true,
  require_digit: true,
  require_special: true
};

// The block renders Mantine primitives, so it needs the provider.
const render = (ui) => rtlRender(<MantineProvider>{ui}</MantineProvider>);

// One read-only checkbox per rule; a met rule is a checked checkbox.
const checkboxes = () => screen.getAllByRole('checkbox');
const checkedCount = () => checkboxes().filter((cb) => cb.checked).length;

beforeAll(() => {
  // jsdom has no matchMedia and the lib has no vitest setup file; MantineProvider
  // reads it on mount.
  window.matchMedia = window.matchMedia || ((query) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  }));

  // Empty resources: translateValue falls back to the module's pt defaults, and
  // i18next still interpolates {{min_length}} into the default string — so a
  // hardcoded number in a rule label would fail these tests rather than hide.
  i18next.init({
    lng: 'pt',
    fallbackLng: 'pt',
    defaultNS: 'common',
    resources: {},
    interpolation: { escapeValue: false }
  });
});


describe('the checklist is built from the server policy', () => {

  it('shows one rule per class the policy turns on', () => {
    render(<PasswordRules policy={DEFAULT_POLICY} password="" />);
    expect(checkboxes()).toHaveLength(5);
    expect(screen.getByText('Pelo menos um caractere especial')).toBeTruthy();
    expect(screen.getByText('A password deve conter:')).toBeTruthy();
  });

  it('takes the length from the policy rather than a hardcoded 12', () => {
    render(<PasswordRules policy={{ ...DEFAULT_POLICY, min_length: 16 }} password="" />);
    // Re-tuning SCALARGIS_PASSWORD_MIN_LENGTH must change the label with no edit.
    expect(screen.getByText('Pelo menos 16 caracteres')).toBeTruthy();
    expect(screen.queryByText('Pelo menos 12 caracteres')).toBeNull();
  });

  it('drops a rule the deployment switched off', () => {
    render(<PasswordRules policy={{ ...DEFAULT_POLICY, require_special: false, require_digit: false }} password="" />);
    expect(checkboxes()).toHaveLength(3);
    expect(screen.queryByText('Pelo menos um caractere especial')).toBeNull();
  });

  it('renders nothing when there is no policy', () => {
    render(<PasswordRules policy={null} password="" />);
    // No guessing: no policy means no advertised rules, and the server still
    // rejects a bad password exactly as before this endpoint existed.
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByText('A password deve conter:')).toBeNull();
  });
});


describe('the checklist reacts to what is typed', () => {

  it('ticks nothing for an empty field', () => {
    render(<PasswordRules policy={DEFAULT_POLICY} password="" />);
    expect(checkedCount()).toBe(0);
  });

  it('ticks every rule once the password complies', () => {
    render(<PasswordRules policy={DEFAULT_POLICY} password="Abcdefgh1234!" />);
    expect(checkedCount()).toBe(5);
  });

  it('ticks only the rules already met, live', () => {
    // 12 lowercase letters: lowercase + min_length met; the rest not yet.
    render(<PasswordRules policy={DEFAULT_POLICY} password="abcdefghijkl" />);
    expect(checkedCount()).toBe(2);
    expect(screen.getByText('Pelo menos uma minúscula').getAttribute('data-met')).toBe('true');
    expect(screen.getByText('Pelo menos uma maiúscula').getAttribute('data-met')).toBe('false');
  });
});


describe('the pre-submit check uses the same policy', () => {

  it('reports the ids the server uses in failed_rules', () => {
    expect(validatePasswordAgainstPolicy(DEFAULT_POLICY, '')).toEqual(
      ['lowercase', 'uppercase', 'digit', 'special', 'min_length']);
  });

  it('accepts a compliant password', () => {
    expect(validatePasswordAgainstPolicy(DEFAULT_POLICY, 'Abcdefgh1234!')).toEqual([]);
  });

  it.each([
    ['abcdefghijkl1!', 'uppercase'],
    ['ABCDEFGHIJKL1!', 'lowercase'],
    ['Abcdefghijkl!!', 'digit'],
    ['Abcdefghijkl12', 'special'],
    ['Ab1!', 'min_length']
  ])('flags %s as breaking %s', (password, expected) => {
    expect(validatePasswordAgainstPolicy(DEFAULT_POLICY, password)).toEqual([expected]);
  });

  it('follows the policy when a rule is off', () => {
    const policy = { ...DEFAULT_POLICY, require_special: false };
    expect(validatePasswordAgainstPolicy(DEFAULT_POLICY, 'Abcdefghijkl12')).toEqual(['special']);
    expect(validatePasswordAgainstPolicy(policy, 'Abcdefghijkl12')).toEqual([]);
  });

  it('respects a re-tuned min_length', () => {
    expect(validatePasswordAgainstPolicy({ ...DEFAULT_POLICY, min_length: 16 }, 'Abcdefgh1234!')).toEqual(['min_length']);
    expect(validatePasswordAgainstPolicy({ ...DEFAULT_POLICY, min_length: 8 }, 'Abcd123!')).toEqual([]);
  });

  it('offers no verdict without a policy, leaving it to the server', () => {
    expect(getPasswordRules(null)).toEqual([]);
    expect(validatePasswordAgainstPolicy(null, '123')).toEqual([]);
  });
});


describe('the policy is fetched once per API base', () => {

  beforeEach(() => resetPasswordPolicyCache());

  it('caches the request and reset clears it', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(DEFAULT_POLICY) }));

    expect(await fetchPasswordPolicy('http://server/api')).toEqual(DEFAULT_POLICY);
    await fetchPasswordPolicy('http://server/api');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('http://server/api/security/password_policy');

    resetPasswordPolicyCache();
    await fetchPasswordPolicy('http://server/api');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('resolves to null when the fetch fails, leaving it to the server', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    expect(await fetchPasswordPolicy('http://x/api')).toBeNull();
  });
});
