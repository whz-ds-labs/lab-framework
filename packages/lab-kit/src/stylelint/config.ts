import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'stylelint'

// Absolute path of the built plugin entry next to this file (dist/stylelint/index.js).
// Not `new URL('./index.js', import.meta.url)`: Vite would inline that as an asset.
const plugin = join(dirname(fileURLToPath(import.meta.url)), 'index.js')

const config: Config = {
  plugins: [plugin],
  rules: {
    'ds-labs/no-separator-lines': true,
    'ds-labs/color-tokens-only': true,
  },
  overrides: [{ files: ['**/*.vue'], customSyntax: 'postcss-html' }],
}

export default config
