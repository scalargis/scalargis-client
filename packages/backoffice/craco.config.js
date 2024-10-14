// this file overrides the default CRA configurations (webpack, eslint, babel, etc)
// ---
// Implmentação alternativa: https://stackoverflow.com/questions/44114436/the-create-react-app-imports-restriction-outside-of-src-directory/68017931#68017931
// ---
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  webpack: {
    configure: (config) => {
      // Remove ModuleScopePlugin which throws when we try to import something
      // outside of src/.
      config.resolve.plugins.pop();

      // Resolve the path aliases.
      config.resolve.plugins.push(new TsconfigPathsPlugin());

      config.resolve.symlinks = false;

      // https://github.com/diegomura/react-pdf/issues/2016#issuecomment-1495764432
      // https://stackoverflow.com/questions/74738438/add-polyfill-to-craco-issue-add-a-fallback-resolve-fallback
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback.buffer = config.resolve.fallback.buffer ?? require.resolve("buffer");
      config.resolve.fallback.timers = config.resolve.fallback.timer ?? require.resolve("timers-browserify");
      config.resolve.fallback.stream = config.resolve.fallback.stream ?? require.resolve("stream-browserify");

      // Let Babel compile outside of src/.
      const oneOfRule = config.module.rules.find((rule) => rule.oneOf);
      const tsRule = oneOfRule.oneOf.find((rule) =>
        rule.test.toString().includes("ts|tsx")
      );

      tsRule.include = undefined;
      tsRule.exclude = /node_modules/;

      return config;
    },
  },
};
