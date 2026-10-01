/* Lime green — a shipped palette theme (B2). The folder IS the theme: the
   name a deploy configures is the folder name, the Mantine override comes
   from the @scalargis/ui preset of the same name (where the tuple lives
   under the AA gate), and the default shell chrome is reused as-is — the
   brand paint hangs off the data-sg-theme attribute instead.
   Saira ships with the preset; the bright #9EC222 sits
   at primaryShade 7 for interactive surfaces. */
import { resolveClientThemePreset } from '@scalargis/ui';

import ThemeDefault from '../../../core/themes/default/main';

export const mantineTheme = resolveClientThemePreset('lime').theme;

export default ThemeDefault;
