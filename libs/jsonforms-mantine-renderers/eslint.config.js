const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // This lib is the Mantine twin of jsonforms-primereact-renderers and must
      // survive the Phase 5 primereact removal untouched — same ban as libs/ui.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primereact', 'primereact/*'],
              message:
                'jsonforms-mantine-renderers must not depend on primereact.',
            },
          ],
        },
      ],
    },
  },
];
