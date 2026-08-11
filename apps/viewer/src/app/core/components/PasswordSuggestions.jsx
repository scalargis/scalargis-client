import React, { useMemo } from 'react';
import { Divider } from '@mantine/core';

import { i18n as i18nUtils } from '@scalargis/components';


// The five server-enforced password rules, shown below the password field.
// Prime's strength meter had no Mantine twin; this static, always-visible block
// replaces it on both the /password (PasswordWidget) and the registration
// (RegistrationWidget) forms — the actual rule is the server's set_password,
// which returns failed_rules, so this only advertises what it will check.
export default function PasswordSuggestions() {
  return useMemo(() => (
    <React.Fragment>
      <Divider className="mt-2" />
      <p className="mt-2">{i18nUtils.translateValue("suggestions", "Sugestões")}:</p>
      <ul className="pl-2 ml-2 mt-0" style={{ lineHeight: '1.5' }}>
        <li>{i18nUtils.translateValue("passwordLowerRule", "Pelo menos uma minúscula")}</li>
        <li>{i18nUtils.translateValue("passwordUpperRule", "Pelo menos uma maiúscula")}</li>
        <li>{i18nUtils.translateValue("passwordDigitRule", "Pelo menos um dígito")}</li>
        <li>{i18nUtils.translateValue("passwordSpecialRule", "Pelo menos um caractere especial")}</li>
        <li>{i18nUtils.translateValue("passwordSizeRule", "Pelo menos 12 caracteres")}</li>
      </ul>
    </React.Fragment>
  ), [i18nUtils.getResolvedLanguage()]);
}
