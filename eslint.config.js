import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
    ],
  },
  {
    rules: {
      // override rules here
    },
  },
).removeRules(
  'test/no-only-tests',
)
