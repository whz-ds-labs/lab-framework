# Golden tests against Python

Every number a learner sees comes from `core/` (TypeScript) and is compared with values computed by the reference library the course notebook uses. The TypeScript side never produces its own expectations.

## Pattern

1. `golden/make_golden.py` rebuilds the notebook setups without the notebook (same seeds, same data) and writes JSON with **inputs and expectations** to `tests/golden/`. Write with LF line endings on every platform.
2. `golden/test_golden.py` (pytest) recomputes every case and compares with the stored JSON using `assert_allclose(rtol=1e-12)`. Not exact equality: `sin`/`cos` and BLAS can differ in the last digit between CPUs.
3. `tests/unit/golden.test.ts` (Vitest) loads the same JSON and compares `core/` output with `expectClose(actual, expected, { rtol, atol })`.
4. CI order: guard, pytest, vitest, build.

## Paths

- Python scripts use paths relative to their own file (`Path(__file__).parent`) and run with the working directory = the golden folder.
- TypeScript tests locate files with `join(dirname(fileURLToPath(import.meta.url)), '..', 'golden')`. Never `new URL('../golden', import.meta.url)`: Vite rewrites `new URL(rel, import.meta.url)` under happy-dom and the path breaks.

## Environment

- Pins are exact `==` versions taken from the course's own environment (its requirements or lock file), not the newest releases. Record why in a comment.
- Run with `uv run --native-tls --locked --project <lab>/golden ...` and commit `uv.lock`. After editing a pin run `uv lock --project <lab>/golden`. `--native-tls` is needed on networks with HTTPS inspection (see windows-powershell).
- Python 3.12 via `uv python install 3.12` where missing. If the course pins an older Python for the reference library, follow the course.

## Tolerances

Separate by what the quantity depends on, and say why in a comment next to each tolerance.

| Quantity | Typical tolerance |
| --- | --- |
| Closed form with fixed parameters (linear algebra, kernels, losses) | `rtol` 1e-10 to 1e-12 |
| Anything that depends on an optimizer or iteration count | about 1e-3, or a one-sided check such as "objective at least reference minus 0.5" |
| Exact combinatorial output (tree structure, indices, counts) | exact equality |
| Ensemble statistics with random feature subsets | statistical comparison only |

- Know library details that change references: scikit-learn adds `alpha=1e-10` to a Gaussian-process diagonal; include it in the reference computation.
- When several libraries are involved, fix conventions explicitly (for example a length-scale parametrisation) and say so. A result without a counterpart in the reference library is a transcription, and the README must say so.

## Float-exact edge cases

Floating point arithmetic breaks "obvious" guards. Test the edges with values that expose them:

- A constant target must give `r2 = 1` (or the library's convention) through an **exact equality check on the data** (`max === min` on the raw values), not through `ssTot === 0` after accumulating sums: sums of a constant vector can be nonzero by rounding.
- Pivot and variance tests: `!(d > 0) || !Number.isFinite(d)`, so NaN cannot slip through.
- Near-constant columns: follow the library (scikit-learn sets a scale below a threshold to 1).
- Validity of a covariance is judged by eigenvalues with a relative threshold (`lambdaMin < -1e-8 * max|lambda|`), not by Cholesky success: jitter hides violations and rounding paints valid kernels red.

## Ties: the oracle mode

When the reference library breaks ties randomly (equal split gain, equal distance), do not search for a seed that happens to agree.

1. In `make_golden.py` detect tie nodes deterministically (recompute the criterion and collect the argmax set) and export them (for example `tieNodes`).
2. In the TypeScript test run `core/` in an **oracle mode** that, at those nodes, takes the library's choice, but only if it lies inside the core's own argmax set.
3. Make ties exact in the test data. Agreement across seeds 0 to 4 is no evidence: cases flip only at later seeds.

## Course pins and claims

- Reproduce numbers the course text states (for example a textbook table) as golden cases, and cite them as text references ("textbook ch. 9, notebook cell 39"), never as copied material.
- Notebook cell numbers in textbooks may be zero-based; cite them the way the book does.
- A plan review should run small `uv run` scripts against the real library before implementation: it finds wrong expected values and impossible golden cases early.
