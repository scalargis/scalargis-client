import React, { useEffect, useState } from 'react';
import { Checkbox, Divider, Group, Stack, Text } from '@mantine/core';

import * as i18nUtils from '../utils/i18n';

import styles from './PasswordRules.module.css';


// The password rules come from the server, never from this file.
//
// GET /api/security/password_policy publishes the live policy that
// app/utils/password_policy.py enforces in set_password/register_user:
//
//   { min_length, require_uppercase, require_lowercase, require_digit,
//     require_special }
//
// Both the rule text and the pre-submit check are built from that object, so
// re-tuning SCALARGIS_PASSWORD_* on a deployment changes what the forms say
// *and* what they accept, with no edit here. What this module still owns is only
// the character class each rule id means (uppercase = /[A-Z]/), mirroring the
// server's regex table — the policy itself (which rules are on, how long) is the
// server's word.
//
// This lives in the shared lib so the viewer login/register/reset forms and the
// backoffice user-create and account password-change forms all read one source.
// The fetch takes the API base as an argument (`apiUrl`) because each app
// resolves it differently, keeping the module app-agnostic.
//
// The client check is an early-out convenience: it saves the API round-trip on
// an obviously-bad password. The server's failed_rules stays the authority, and
// if the policy cannot be fetched we render nothing and check nothing rather
// than guess — the server still rejects, exactly as before this endpoint.

// Ordered as the list is shown. `flag` is the field in the policy that turns the
// rule on; `test` is the character class the matching server rule looks for.
const CHARACTER_RULES = [
  { id: 'lowercase', flag: 'require_lowercase', i18nKey: 'passwordLowerRule',
    defaultText: 'Pelo menos uma minúscula', test: (pw) => /[a-z]/.test(pw) },
  { id: 'uppercase', flag: 'require_uppercase', i18nKey: 'passwordUpperRule',
    defaultText: 'Pelo menos uma maiúscula', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'digit', flag: 'require_digit', i18nKey: 'passwordDigitRule',
    defaultText: 'Pelo menos um dígito', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', flag: 'require_special', i18nKey: 'passwordSpecialRule',
    defaultText: 'Pelo menos um caractere especial', test: (pw) => /[^A-Za-z0-9]/.test(pw) }
];

// One in-flight request per API base per page load, shared by every form that
// asks. Keyed by base so the viewer and backoffice (different origins in dev)
// don't share a wrong answer.
const policyPromises = {};

export function fetchPasswordPolicy(apiUrl) {
  const base = apiUrl || '';
  if (!policyPromises[base]) {
    policyPromises[base] = fetch(base + '/security/password_policy')
      .then((res) => (res.ok ? res.json() : null))
      // Resolve to null rather than reject: no policy means "stay quiet and let
      // the server decide", which is the pre-endpoint behaviour.
      .catch(() => null);
  }
  return policyPromises[base];
}

// Drops the cache so a test (or a deliberate re-fetch) starts clean.
export function resetPasswordPolicyCache() {
  Object.keys(policyPromises).forEach((key) => delete policyPromises[key]);
}

export function usePasswordPolicy(apiUrl, { skip = false } = {}) {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    if (skip) return undefined;
    let active = true;
    fetchPasswordPolicy(apiUrl).then((res) => { if (active) setPolicy(res); });
    return () => { active = false; };
  }, [apiUrl, skip]);

  return policy;
}

/**
 * The rules the given policy actually turns on, in display order.
 * Returns [] for a null policy (not fetched / fetch failed).
 */
export function getPasswordRules(policy) {
  if (!policy) return [];

  const rules = CHARACTER_RULES
    .filter((rule) => policy[rule.flag])
    .map((rule) => ({
      id: rule.id,
      test: rule.test,
      text: i18nUtils.translateValue(rule.i18nKey, rule.defaultText)
    }));

  const minLength = policy.min_length;
  if (minLength > 0) {
    rules.push({
      id: 'min_length',
      test: (pw) => (pw || '').length >= minLength,
      // The number is interpolated from the policy — the string must never
      // hardcode it, or a re-tuned min_length would leave the text lying.
      text: i18nUtils.translateValue('passwordSizeRule', 'Pelo menos {{min_length}} caracteres',
        undefined, undefined, undefined, { min_length: minLength })
    });
  }

  return rules;
}

/**
 * Ids of the rules `password` breaks, using the same identifiers the server
 * returns in failed_rules. Empty when it complies — or when there is no policy,
 * in which case the client offers no verdict and the server decides.
 */
export function validatePasswordAgainstPolicy(policy, password) {
  return getPasswordRules(policy)
    .filter((rule) => !rule.test(password || ''))
    .map((rule) => rule.id);
}

/**
 * Live requirements checklist, shown under a password field. Each rule is a
 * read-only checkbox: unmet reads as quiet guidance (empty box, plain label),
 * met ticks green and strikes the label through — "done, move on", never an
 * error red. `password` drives the live state; `policy` is the fetched policy
 * (pass it from the form's usePasswordPolicy so the fetch isn't repeated).
 */
export default function PasswordRules({ policy, password, title }) {
  const rules = getPasswordRules(policy);

  if (!rules.length) return null;

  const heading = title || i18nUtils.translateValue('passwordRequirements', 'A password deve conter');

  return (
    <React.Fragment>
      <Divider className="mt-2" />
      <Text className="mt-2" size="sm" c="dimmed">{heading}:</Text>
      <Stack gap={4} className="mt-1">
        {rules.map((rule) => {
          const met = rule.test(password || '');
          return (
            <Group key={rule.id} gap={8} wrap="nowrap" align="center">
              {/* Read-only, out of tab order, but kept in the a11y tree and named
                  so a screen reader announces the rule and whether it is met —
                  the state is not conveyed by colour alone. The visible label is
                  the decorative duplicate. */}
              <Checkbox
                checked={met}
                readOnly
                tabIndex={-1}
                size="xs"
                color="green"
                aria-label={rule.text}
              />
              <Text
                size="sm"
                aria-hidden="true"
                data-met={met ? 'true' : 'false'}
                className={styles.ruleLabel}
              >
                {rule.text}
              </Text>
            </Group>
          );
        })}
      </Stack>
    </React.Fragment>
  );
}
