import { registerMessages } from '@whz-ds-labs/lab-kit'
import de from './messages/de'
import en from './messages/en'

/** Registers the framework's own DE/EN texts under the `kit` scope (keys `kit.*`). Safe to call more than once. */
export function installKitMessages(): void {
  registerMessages('kit', { de, en })
}
