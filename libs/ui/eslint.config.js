const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // This lib is the PrimeReact-FREE foundation: recipes must survive the
      // Phase 5 primereact removal untouched. primeicons is fine (kept,
      // rendered via recipes/icons.tsx CSS classes).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primereact', 'primereact/*'],
              message:
                'libs/ui must not depend on primereact. Icon needs go through recipes/icons.tsx.',
            },
          ],
        },
      ],
    },
  },
];
