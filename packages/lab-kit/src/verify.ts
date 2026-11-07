/** In-DOM verification contract: `data-verify-*` attributes that tests read instead of scraping text. */
export type VerifyState = 'loading' | 'empty' | 'ready' | 'error'

/** `data-verify-error` is set only when `state === 'error'`; `data-verify-count` only when a count is given. */
export function verifyAttrs(
  unit: string,
  state: VerifyState,
  opts: { count?: number; error?: string } = {},
): Record<string, string> {
  const attrs: Record<string, string> = { 'data-verify-unit': unit, 'data-verify-state': state }
  if (opts.count !== undefined) attrs['data-verify-count'] = String(opts.count)
  if (state === 'error') attrs['data-verify-error'] = opts.error ?? 'unknown'
  return attrs
}
