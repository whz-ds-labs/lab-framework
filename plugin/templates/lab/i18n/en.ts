import type { Catalog } from '@whz-ds-labs/lab-kit'

// Keys are relative to the lab scope (the lab id); the shell prefixes them.
export const en: Catalog = {
  line: {
    fit: { title: 'Least squares line' },
    n: { label: 'Number of points n' },
    slope: 'Slope',
    intercept: 'Intercept',
    r2: 'Coefficient of determination R²',
    ci: 'Bootstrap interval of the slope (95 %)',
    ciError: 'Unavailable (background computation not possible).',
    error: {
      TOO_FEW_POINTS: 'At least two points are needed.',
      DEGENERATE_X: 'All x values are equal.',
      UNKNOWN: 'Unexpected error.',
    },
    help: {
      purpose: 'This tool fits a least squares line through a point cloud.',
      read: {
        fit: 'Slope, intercept and R² describe the fitted line; R² close to 1 means the line explains almost all of the spread.',
      },
      controls: { n: 'n sets how many points are generated at random.' },
    },
  },
}
