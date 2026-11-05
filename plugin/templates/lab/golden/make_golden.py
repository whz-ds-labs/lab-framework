"""Generate tests/golden/fit.json, the oracle for core/fit.ts (scikit-learn LinearRegression).

Run via `npm run golden` in the course repo. Paths are relative to this file, so the script works from any
working directory.
"""
import json
from pathlib import Path

import numpy as np
import sklearn
from sklearn.linear_model import LinearRegression

OUT = Path(__file__).resolve().parent.parent / "tests" / "golden" / "fit.json"

# No case has a slope or an intercept of exactly 0 (a relative tolerance on 0 would be meaningless).
CASES = {
    "clean": [(float(x), 2.0 + 0.7 * x) for x in range(10)],
    "noisy": [
        (0.5, 2.6), (1.2, 2.4), (2.0, 4.1), (2.8, 3.5), (3.5, 5.2),
        (4.1, 4.4), (5.3, 6.4), (6.0, 5.6), (7.2, 7.9), (8.4, 7.1), (9.5, 9.0),
    ],
    "outlier": [
        (0.0, 2.1), (1.0, 2.6), (2.0, 3.5), (3.0, 4.0), (4.0, 4.7),
        (5.0, 5.4), (6.0, 6.3), (7.0, 6.9), (8.0, 13.0), (9.0, 8.2),
    ],
}


def fit_case(points):
    x = np.array([p[0] for p in points]).reshape(-1, 1)
    y = np.array([p[1] for p in points])
    model = LinearRegression().fit(x, y)
    return {
        "intercept": float(model.intercept_),
        "slope": float(model.coef_[0]),
        "r2": float(model.score(x, y)),
        "points": [{"x": px, "y": py} for px, py in points],
    }


def build():
    return {
        "cases": {name: fit_case(points) for name, points in CASES.items()},
        "meta": {"numpy": np.__version__, "sklearn": sklearn.__version__, "generated_by": "golden/make_golden.py"},
    }


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # newline="\n": the same bytes on Windows and Linux (the repo is LF-only).
    with OUT.open("w", encoding="utf8", newline="\n") as f:
        f.write(json.dumps(build(), indent=2, sort_keys=True) + "\n")
    print(f"wrote {OUT}")
