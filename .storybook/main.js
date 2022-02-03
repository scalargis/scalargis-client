module.exports = {
  "stories": [
    "../src/stories/*.stories.mdx",
    "../src/stories/*.stories.@(js|jsx|ts|tsx)",
    "../packages/frontend/src/components/*/src/stories/*.stories.@(js|jsx|ts|tsx)",
    "../packages/primereact-renderers/src/stories/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-actions",
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ]
}