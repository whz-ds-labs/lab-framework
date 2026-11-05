import type { Catalog } from '@whz-ds-labs/lab-kit'

// Keys are relative to the lab scope (the lab id); the shell prefixes them.
export const en: Catalog = {
  line: {
    plot: { title: 'Point cloud and fitted line' },
    formula: { title: 'Estimated line' },
    n: { label: 'Number of points n' },
    noise: { label: 'Noise' },
    seed: { label: 'Seed (random start value)' },
    click: {
      label: 'Click in the plot',
      hint: 'Click in the plot or use "Add point" to add a point of your own; move it with the arrow keys.',
      full: 'No more than 30 own points are possible.',
    },
    add: 'Add point',
    userPoint: 'Own point',
    reset: 'Reset points',
    slope: 'Slope',
    intercept: 'Intercept',
    r2: 'Coefficient of determination R²',
    bootstrap: {
      title: 'Bootstrap interval',
      label: 'Bootstrap interval (1000×)',
      cancel: 'Cancel',
      result: 'Bootstrap interval of the slope (95 %)',
    },
    ciError: 'Unavailable (background computation not possible).',
    error: {
      TOO_FEW_POINTS: 'At least two points are needed.',
      DEGENERATE_X: 'All x values are equal.',
      UNKNOWN: 'Unexpected error.',
    },
    help: {
      purpose: 'This tool fits a least squares line through a point cloud and shows how certain its slope is.',
      read: {
        plot: 'The dots are the data, the coloured line is the fitted line. Randomly generated points and your own points enter the fit alike.',
        formula:
          'The formula shows the line with intercept and slope; the two values and R² are listed below it. R² close to 1 means the line explains almost all of the spread.',
        bootstrap:
          'The interval is the central 95 % range of the slopes from 1000 redraws of the points. The wider it is, the less certain the slope.',
      },
      controls: {
        n: 'n sets how many points are generated at random.',
        noise: 'Noise sets how far the points scatter around the true line.',
        seed: 'The seed selects the random numbers: the same seed always gives the same points.',
        click:
          'A click in the plot or the "Add point" button adds a point of your own (30 at most). Dragging or the arrow keys move it, a right click or Delete removes it; "Reset points" clears them all.',
        bootstrap: 'Starts the interval computation in the background; when the points change, the result is discarded.',
      },
    },
  },
  scenario: {
    s1: {
      title: 'Few, very noisy points',
      short: 'n = 8, noise 3: the slope wobbles',
      see: 'Only 8 points scatter widely around the true line (slope 0.5). The fitted line has a slope of about 0.34, and R² is just 0.08.',
      watch:
        'The bootstrap interval of the slope runs from about -0.27 to 1.58 and contains 0: the data do not even show for sure whether the line rises. It is more than five times as wide as in the default view (0.26).',
      next: 'Raise n step by step or pick another seed and watch how slope and interval change.',
    },
    s2: {
      title: 'One outlier pulls the line',
      short: 'One point at (9, -3) far below the cloud',
      see: 'An outlier at (9, -3) joins the 20 points. The slope drops from 0.38 to 0.20, and R² from 0.53 to 0.08.',
      watch:
        'The bootstrap interval is computed as soon as you arrive here. With a width of 0.69 it is more than twice as wide as without the outlier (0.26) and reaches down to -0.21, so below 0.',
      next: 'Remove the outlier with "Reset points" and compare; then put it back with a click in the plot.',
    },
  },
}
