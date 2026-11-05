"""Recomputes the golden cases and compares them with tests/golden/fit.json."""
import json
from pathlib import Path

import pytest
from numpy.testing import assert_allclose

import make_golden

GOLDEN = Path(__file__).resolve().parent.parent / "tests" / "golden" / "fit.json"


@pytest.fixture(scope="module")
def stored():
    return json.loads(GOLDEN.read_text(encoding="utf8"))


@pytest.mark.parametrize("name", sorted(make_golden.CASES))
def test_case_matches_json(stored, name):
    fresh = make_golden.fit_case(make_golden.CASES[name])
    saved = stored["cases"][name]
    for key in ("intercept", "slope", "r2"):
        assert_allclose(saved[key], fresh[key], rtol=1e-10, atol=1e-12, err_msg=f"{name}.{key}")
    assert saved["points"] == fresh["points"]


def test_no_case_has_zero_slope_or_intercept(stored):
    for name, case in stored["cases"].items():
        assert case["slope"] != 0, name
        assert case["intercept"] != 0, name


def test_json_is_current(stored):
    assert set(stored["cases"]) == set(make_golden.CASES)
