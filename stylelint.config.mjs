// Needs the built lab-kit: run `npm run build` before `npm run lint:css`.
import dsLabs from './packages/lab-kit/dist/stylelint/config.js'

export default {
  ...dsLabs,
  // Linted files come from the lint:css script (packages/ui/src/**/*.{css,vue}).
  ignoreFiles: ['packages/ui/tokens.css', 'plugin/templates/**', 'examples/**', '**/dist/**'],
}
