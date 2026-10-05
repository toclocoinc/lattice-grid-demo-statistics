// Wiring only. One grid holds the data; its statistics and regression panels, the fitted
// columns and the two charts all read the grid's filtered rows, so choosing a segment
// refits all of them with no code to keep them in step.
import { createGrid, setLicence } from '@toclocoinc/lattice-grid';
import { createChart, regressionPlots } from '@toclocoinc/lattice-grid/modules/charts';

// Bound to toclocoinc.github.io; does nothing anywhere else. localhost never needs a key.
setLicence('LG1.eyJ2IjoxLCJwIjoibGF0dGljZS1ncmlkIiwidCI6IlRPQ0xPQ08gSW5jIC0gcHVibGljIGRlbW9zIiwiZSI6IjIwMzAtMDEtMDEiLCJkIjpbInRvY2xvY29pbmMuZ2l0aHViLmlvIl19.9De42ua3aCGpiMB6EVRP7Tv-upUlDI-0T07rlSPzvCrsqg8t4YJi7SRnStEpAg48uzmcG7il1fR_TfwkUE7iCA');

const el = (id) => document.getElementById(id);
const rows = await (await fetch('data/abalone.json')).json();

// The model: how many growth rings (age) the measurements predict.
const model = { predictors: ['shell', 'shucked', 'height', 'diameter'], response: 'rings' };
const trend = { predictors: ['shell'], response: 'rings' }; // one predictor, so the chart can draw a band

const num = (field, title, tooltip, decimals = 1, width = 84) =>
  ({ field, title, type: 'number', format: { decimals }, layout: { width }, header: { tooltip } });
const grid = createGrid(el('grid'), {
  rowKey: 'id', rows, source: { mode: 'memory' },
  columns: [
    num('shell', 'Shell g', "Shell g: dried shell weight, in grams.", 1, 76),
    { field: 'sex', title: 'Segment', layout: { width: 80 }, header: { tooltip: 'Segment: female, male or infant.' } },
    { field: 'rings', title: 'Rings', type: 'number', layout: { width: 66 },
      header: { tooltip: 'Rings: growth rings on the shell, a proxy for age.' } },
    { id: 'fitted', title: 'Fitted rings', layout: { width: 92 }, format: { decimals: 1 }, shadow: { kind: 'fitPredicted', model },
      header: { tooltip: "Fitted rings: the model's predicted ring count." } },
    { id: 'residual', title: 'Residual', layout: { width: 84 }, format: { decimals: 1 }, shadow: { kind: 'fitResidual', model },
      header: { tooltip: 'Residual: actual rings minus predicted rings.' } },
    { id: 'influential', title: 'Influential', layout: { width: 92 }, shadow: { kind: 'fitInfluence', model },
      header: { tooltip: 'Influential: rows that move the fitted line the most.' } },
    { id: 'rings_odd', title: 'Unusual age', layout: { width: 96 }, shadow: { of: 'rings', kind: 'anomalyFlag' },
      header: { tooltip: 'Unusual age: a ring count that stands out from the rest.' } },
    { id: 'cooks', title: "Cook's D", layout: { width: 84 }, format: { decimals: 3 }, shadow: { kind: 'fitCooksD', model },
      header: { tooltip: "Cook's D: how much the fit would change if this row were removed." } },
    num('shucked', 'Meat g', 'Meat g: shucked (edible) weight, in grams.', 1, 76),
    num('height', 'Height mm', 'Height mm: shell height, in millimetres.', 1, 90),
    num('diameter', 'Diameter mm', 'Diameter mm: shell diameter, in millimetres.', 1, 100),
    { id: 'stdres', title: 'Std residual', layout: { width: 96 }, format: { decimals: 2 }, shadow: { kind: 'fitStdResidual', model },
      header: { tooltip: 'Std residual: the residual scaled by its standard error.' } },
    { field: 'id', title: '#', type: 'number', layout: { hidden: true } },
    { id: 'leverage', title: 'Leverage', layout: { width: 84 }, format: { decimals: 3 }, shadow: { kind: 'fitLeverage', model },
      header: { tooltip: "Leverage: how unusual this row's measurements are among the predictors." } },
  ],
  formatting: { influential: [{ when: { op: 'eq', value: true }, style: { background: '#fbeceb', color: '#a4262c', fontWeight: 600 } }] },
  anomalySummary: { column: 'rings' },
  toolPanel: { panels: ['statistics', { name: 'regression', props: model }], openPanel: 'regression' },
});

// The fitted line with its confidence band, and the influence picture, both over the same grid.
const { plots } = regressionPlots(grid, { spec: trend });
const influence = regressionPlots(grid, { spec: model, stdResidual: 'stdres', leverage: 'leverage', cooksD: 'cooks' }).plots;
createChart({ grid, container: '#fit', ...plots.fit.spec });
createChart({ grid, container: '#influence', ...influence.residualsLeverage.spec });

// Group comparison: females and males, shell weight, over whatever the segment leaves.
const SEGMENTS = {
  all: ['All abalone'], adults: ['Adults (females and males)'], Female: ['Females'], Male: ['Males'], Infant: ['Infants'],
};
const both = (v) => v === 'all' || v === 'adults';
function compare() {
  const r = both(el('segment').value) && grid.statistics.compareGroups('shell', { by: 'sex', groups: ['Female', 'Male'] });
  el('compare').innerHTML = r
    ? `<b>${r.nA.toLocaleString()} females</b> against <b>${r.nB.toLocaleString()} males</b><br>
       Females minus males, shell weight: <b>${r.interval.estimate.toFixed(2)} g</b> (95% interval ${r.interval.lower.toFixed(2)} to ${r.interval.upper.toFixed(2)})<br>
       p ${r.pValue < 0.001 ? '< 0.001' : '= ' + r.pValue.toFixed(3)} (${r.statisticName}-test), effect size ${r.effectSize.value.toFixed(2)}`
    : 'This segment holds one group only. Choose All abalone or Adults to compare females with males.';
  el('summary').textContent = `${grid.rows.matchCount().toLocaleString()} rows in view`;
}
for (const [value, [label]] of Object.entries(SEGMENTS)) el('segment').add(new Option(label, value));
el('segment').onchange = () => {
  const v = el('segment').value;
  if (v === 'all') grid.filters.clear();
  else grid.filters.set(v === 'adults' ? { col: 'sex', op: 'in', value: ['Female', 'Male'] } : { col: 'sex', op: 'eq', value: v });
  compare();
};
compare();
window.__demo = { grid, model };
