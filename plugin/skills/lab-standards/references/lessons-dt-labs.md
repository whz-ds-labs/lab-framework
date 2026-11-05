# Lessons from the decision-tree lab

A lab with three tools (split workshop, complexity lab, forest lab) whose CART core matches scikit-learn 1.5.0 bit-exactly in TypeScript.

## Matching scikit-learn trees exactly

All rules were verified against 1.5.0; recheck when the pin changes.

- Nodes in preorder. `X` is held as float32 internally.
- Threshold between neighbours `a < b`: `f32(a)/2 + f32(b)/2`.
- Two values count as distinct only if `fround(a + fround(1e-7)) < b`; the same test decides constant features.
- A node is a leaf when `impurity <= 2.22e-16`.
- Split proxy for Gini **and** entropy: `-wR*I_R - wL*I_L` (not a sum of squared class sums divided by weight). Strict comparison keeps the first best candidate.
- Rows with weight 0 do not count in `n_node_samples`.
- `value` holds class fractions, not counts.
- Cost-complexity pruning collapses exactly one branch per iteration. The pruning path starts at alpha = 0, and equal alphas may appear several times.

## Ties

scikit-learn resolves equal gains through a random feature order (`random_state`). Use the oracle mode from `golden-tests.md`: tie nodes are found in the Python script, and the TypeScript test follows scikit-learn only inside its own argmax set. Seed invariance over seeds 0 to 4 was not enough; cases flipped at seeds 5 to 7.

## Forests

- Export bootstrap counts with `sklearn.ensemble._forest._generate_sample_indices(est.random_state, n, n)` and feed them as `sample_weight` to the own tree. That makes single trees and bagging exactly testable.
- Ensemble metrics with `max_features` below the feature count are compared statistically only.
- Measure rather than assert the variance formula rho*sigma^2 + (1-rho)*sigma^2/B on the bootstrap gallery.

## Process

- A plan review with real scikit-learn runs found six critical errors before any code: ties in golden cases, wrong pruning semantics, a slider range that missed the textbook values.
- 13 tasks with one subagent review each needed only two fix rounds; the final whole-project review still found three important UI and documentation problems. Keep the final review.
- Roadmap examples for further tools: regression staircase, information calculator (entropy, KL), exercise trainer, workflow and leakage lab, dataset explorer.

## Data

- A course CSV may differ from the textbook original by one row. Build presets from the published original and let learners upload the course file.
- Datasets that may not be redistributed (for example a Kaggle training file) are not committed; open ones (UCI, CC BY 4.0) ship with attribution.
- Deploy: GitHub Pages must be set to "GitHub Actions" before the first deploy, otherwise the job fails with "Creating Pages deployment failed (404)". Re-running the job after the setting is enough.
