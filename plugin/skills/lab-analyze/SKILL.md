---
name: lab-analyze
description: Inventory of course materials (notebooks, PDFs) and potential analysis for interactive labs. Use after lab-start when the user has materials in the intern repo and wants to know which topics make good interactive learning tools; large files are summarised by script, never loaded in full.
---

# lab-analyze

Turn the course materials into a ranked list of lab ideas. Materials live only in `<course>-intern/materials/` (private repo). Results go to `<course>-intern/docs/<topic>/potenzialanalyse.md`. Never copy material content into the public course repo.

## Step 1: Inventory by script

Never read notebooks or PDFs in full. Run the inventory script, which prints outlines only (notebook headings, code-cell count, imports; PDF table of contents and page count; exercises found by heading keywords):

```
uv run --native-tls --with nbformat --with pypdf python "${CLAUDE_PLUGIN_ROOT}/skills/lab-analyze/scripts/inventory.py" "<materials-dir>"
```

`<materials-dir>` is `<course>-intern/materials`. If the script prints `no materials found`, tell the user to put the course files into `materials/` (see its README) and stop.

Read the output. For a candidate section, look at a narrow slice only (one notebook cell range, one PDF page range) with a small script that prints just that slice. If a file turns out to be large, summarise it with a script or delegate the reading to a subagent and keep only the conclusion.

## Step 2: Find the ideas

Look for places where a learner gains from moving a parameter and watching the result:

- A formula or algorithm with two to four meaningful parameters.
- A result that surprises when the data changes (outliers, noise, sample size, ties, scaling).
- An exercise that today needs a notebook run and could be a tool.
- A concept the course explains with a static figure.

Skip ideas that need data the course may not publish, or heavy training runs: labs run in the browser, anything above about 50 ms goes to a worker, and anything above a few seconds is out of scope.

## Step 3: Write the potential analysis

Write `<course>-intern/docs/<topic>/potenzialanalyse.md` (create the folder) in the user's language, using this template:

```markdown
# Potential analysis: <course>

## Materials seen
<n notebooks, m PDFs; one line each with what they cover>

## Ideas
### <idea title>
- Learning goal: <one sentence, what the learner can do or see afterwards>
- Source in the materials: <notebook and cell, or PDF and page>
- Tool sketch: <controls, what is plotted, what the learner can change>
- Data source: <generated with a seed / provided in the materials / public dataset>
- Golden target: <which Python library or function the numbers are checked against, and which quantities>
- Effort: <S / M / L> and why
- Risks: <numerical traps, licensing of data, runtime>

(repeat for each idea, 5 to 10 ideas)

## Roadmap
<ideas in the suggested order, one line of reasoning each; the first lab should be small and prove the whole chain>

## Recommendation
<which idea to start with and why>
```

Every idea needs a golden target. If no Python reference exists, say so explicitly; such an idea ranks lower.

## Step 4: Hand over

Show the roadmap and the recommendation, ask which idea to take, then continue with `superpowers:brainstorming` (see the flow in `lab-start`). Note the later ideas for the `roadmap` list in `site/course.ts`, which `lab-release` updates.
