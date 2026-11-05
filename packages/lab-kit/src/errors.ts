/**
 * Error type shared by the lab-kit core and by lab code. The generic parameter lets a lab narrow the code
 * union (`LabError<'EMPTY_DATA' | 'BAD_PARAM'>`); the default accepts any string.
 */
export class LabError<C extends string = string> extends Error {
  code: C
  details?: Record<string, unknown>

  constructor(code: C, details?: Record<string, unknown>, message?: string) {
    super(message ?? code)
    this.name = 'LabError'
    this.code = code
    this.details = details
  }
}
