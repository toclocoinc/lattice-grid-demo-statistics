# Statistics you can filter

Profile any column, fit a regression, flag the rows that pull the model off course and
compare groups, all inside the grid. Pick a segment and every number, flag and chart
refits to just those rows, instantly. No export, no second tool, no code to keep the
pieces in step.

| | |
| --- | --- |
| Grid on npm | [@toclocoinc/lattice-grid](https://www.npmjs.com/package/@toclocoinc/lattice-grid) |
| Product site | [latticegrid.dev](https://www.latticegrid.dev) |
| Statistics in the grid | [latticegrid.dev/statistics](https://www.latticegrid.dev/statistics/) |

## About the data

Abalone are marine snails harvested for food and mother-of-pearl shell. These measurements
come from abalone collected in Tasmania, published in 1994 through the
[UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/1/abalone) under a
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) licence. An abalone's shell grows a
ring every year, so counting rings gives its age in years, about rings plus one and a half.
Counting rings means cutting the shell, staining it and counting under a microscope, so this
demo asks whether simple measurements of size and weight can predict the ring count instead.

## What it shows

One table of 4,177 abalone, with a **Segment** picker above it (all, adults, females, males, infants).

- **Column profile.** The statistics panel profiles any column over the rows in view: count,
  quartiles, spread, shape, robust figures and a histogram. Choose Infants and the shell
  weight mean goes from 47.8 g to 25.6 g.
- **A regression you did not have to build.** The regression panel opens with a sensible
  model already set up (rings from shell weight, meat weight, height and diameter) and shows
  its coefficients, R-squared and collinearity. Over all abalone the model explains 51% of
  the variation in age. Over infants alone it explains 58%, and height matters more.
- **Influential rows flagged in the table.** Fitted rings, the residual and an Influential
  flag sit beside each row as ordinary columns, so you can sort, filter and export them. Across
  all abalone, 224 rows are flagged; among infants, 79.
- **Unusual ages.** A second flag marks rows whose ring count is out of line with the rest.
  The chip above the table counts them (62 over all abalone, 3 among infants) and one click
  filters the table to just those rows.
- **Group comparison.** Females against males on shell weight: the difference, its 95% interval,
  the p-value and the effect size, so you can see how big and how sure. Females carry 3.9 g more
  shell on average, 1,307 females against 1,528 males.
- **Charts that follow the filter.** A fitted line with its confidence band, and a picture of
  influence (residual against leverage, sized by Cook's D).

## The setup

The whole page is plain JavaScript: `index.html`, `main.js` and a stylesheet. The grid and
its charts module load from the published package, so there is nothing to install and no
build step. The wiring is about 55 lines of code. The part that matters:

```js
const model = { predictors: ['shell', 'shucked', 'height', 'diameter'], response: 'rings' };

createGrid(el, {
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

## Run it

    npm install        # only needed for the check script
    npm run serve      # then open http://localhost:8000/

Add `?theme=dark` for the dark theme.

## Check it

    node tools/verify.mjs [--shots dir]     # Node 22+, real headless Chrome

It loads the page at 1280 by 800 and at 390 wide, picks a segment, and checks that every
panel is filled, the numbers change, and the console stays clean.

## Data

[Abalone](https://archive.ics.uci.edu/dataset/1/abalone), Nash, Sellers, Talbot, Cawthorn and
Ford (1994), Marine Resources Division, Tasmania, from the UCI Machine Learning Repository,
licence **CC BY 4.0**. The raw files are in `data/raw/`; `tools/build-data.mjs` turns them into
`data/abalone.json` (4,177 rows), restoring the measurements to millimetres and grams.

## Licence

Demo code: MIT, see `LICENSE`. Lattice Grid is loaded from the package CDN under its own
licence; the page carries the public-demo licence for `toclocoinc.github.io`, so no watermark
shows there. Keyless, no analytics.
