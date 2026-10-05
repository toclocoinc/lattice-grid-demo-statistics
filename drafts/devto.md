---
title: Statistics that follow your filters, inside the data grid
published: false
description: Profile columns, fit a regression, flag influential rows and compare groups in the grid itself. Filter to a segment and everything refits.
tags: javascript, datascience, webdev, dataviz
canonical_url: https://www.latticegrid.dev/statistics/
---

You open a table of 4,000 rows. You want to know whether shell weight predicts age, which rows are bending the model, and whether the answer is the same for infants as for adults.

The usual route: export to CSV, open a notebook, fit the model, plot the residuals, then go back to the table to find the rows you just flagged. Then someone asks "what about just the infants?" and you go round again.

What if the statistics lived in the grid, and followed the filter?

## The one-line version

Choose a segment. The column profile, the regression, the influence flags, the group comparison and the fitted chart all refit to just those rows, instantly. There is nothing to wire together, because they all read the same filtered rows the grid is showing.

The demo uses the UCI Abalone data (4,177 shellfish, measured and aged by counting rings, CC BY 4.0). Segment is sex: female, male or infant.

## The setup

Here is the part that matters. A model, a few columns and a side panel:

```js
const model = { predictors: ['shell', 'shucked', 'height', 'diameter'], response: 'rings' };

const grid = createGrid(el, {
  rowKey: 'id', rows,
  columns: [
    { field: 'rings', type: 'number' },
    { id: 'fitted',      title: 'Fitted rings', shadow: { kind: 'fitPredicted', model } },
    { id: 'residual',    title: 'Residual',     shadow: { kind: 'fitResidual',  model } },
    { id: 'influential', title: 'Influential',  shadow: { kind: 'fitInfluence', model } },
    { id: 'rings_odd',   title: 'Unusual age',  shadow: { kind: 'anomalyFlag', of: 'rings' } },
  ],
  toolPanel: { panels: ['statistics', { name: 'regression', props: model }] },
});
```

That is the whole statistical setup. No fitting code, no result handling.

## What you get

**A profile of any column.** The statistics panel shows count, quartiles, spread, shape, robust figures and a histogram for whichever column you pick, over the rows in view. Choose Infants and the mean shell weight drops from 47.8 g to 25.6 g, with the histogram redrawn to match.

**A regression with the working shown.** The regression panel opens with your model: coefficients with their standard errors and p-values, R-squared and adjusted R-squared, and a collinearity figure per predictor. Over all abalone the model explains 51% of the variation in age. Over infants alone it explains 58%, and height becomes a much stronger signal. Same model, different segment, different story, and you saw it without leaving the page.

**Influential rows, flagged in the table.** The columns with a `fit` shadow are ordinary columns. Fitted rings and the residual sit beside each row. The Influential flag marks rows whose removal would move the fit the most (Cook's distance), so you can sort by it, filter to it or export it. Across all abalone 224 rows are flagged. Among infants it is 79. Click a flagged row and you are looking at the data point itself, not a dot on a chart you have to trace back.

**Unusual values, one flag away.** `anomalyFlag` on the response marks rows whose ring count is out of line with the rest. A chip above the table counts them (62 overall, 3 among infants) and one click filters the grid to exactly those rows.

**A comparison you can trust.** `grid.statistics.compareGroups` answers "is the difference real?" with the difference, its 95% interval, the p-value and an effect size together, naming the test it used:

```js
const r = grid.statistics.compareGroups('shell', { by: 'sex', groups: ['Female', 'Male'] });
// r.interval  -> { estimate: 3.9, lower: 2.0, upper: 5.7 }
// r.pValue, r.effectSize, r.nA, r.nB
```

It returns data, not a verdict, so you decide what counts as significant.

**Charts that stay in step.** `regressionPlots` turns the fitted model into ready chart specs: the fit line with its confidence band, residuals against fitted, a QQ plot and an influence picture sized by Cook's distance. You hand a spec to `createChart` and the chart follows the grid's filters like everything else.

```js
const { plots } = regressionPlots(grid, { spec: { predictors: ['shell'], response: 'rings' } });
createChart({ grid, container: '#fit', ...plots.fit.spec });
```

## Why this matters

Analysis tools make you choose between a spreadsheet you can click and a notebook you can trust. Putting the statistics in the grid removes the choice. The people who know the data can ask a question by filtering, and the answer arrives with the same rigour a script would give: interval, effect size and method named, not hidden.

It also keeps the evidence next to the rows. A flagged row is a row in the table, so the step from "the model says this one is influential" to "why is this shell 226 mm high" is one scroll.

## Try it

The demo is plain JavaScript: an HTML file, one module and a stylesheet, with the grid loaded from the published package. No framework, no build step, no keys. The data ships with the repo.

- The demo: statistics you can filter, with the Abalone data
- How the statistics work in the grid: https://www.latticegrid.dev/statistics/

Filter to a segment and watch every number move. That is the point.
