/* Light brown — a shipped palette theme (B2). The folder IS the theme: the
   name a deploy configures is the folder name, the Mantine override comes
   from the @scalargis/ui preset of the same name (where the tuple lives
   under the AA gate), and the default shell chrome is reused as-is — the
   brand paint hangs off the data-sg-theme attribute instead.
   White on #B08968 is 3.17:1 (UI/large-text only), so
   interactive surfaces sit at primaryShade 7. */
import { resolveClientThemePreset } from '@scalargis/ui';

import ThemeDefault from '../../../core/themes/default/main';

export const mantineTheme = resolveClientThemePreset('brown').theme;

export default ThemeDefault;
