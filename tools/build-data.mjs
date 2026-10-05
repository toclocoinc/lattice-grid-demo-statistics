// Turns the three raw UCI files into data/abalone.json (4,177 rows).
// The published measurements are scaled by 200; this puts them back in millimetres and grams.
//   node tools/build-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SEX = { M: 'Male', F: 'Female', I: 'Infant' };
const rows = readFileSync(new URL('../data/raw/abalone.data', import.meta.url), 'utf8')
  .trim().split('\n').map((line, i) => {
    const [sex, length, diameter, height, whole, shucked, viscera, shell, rings] = line.split(',');
    const mm = (v) => Math.round(Number(v) * 200 * 10) / 10;
    return { id: i + 1, sex: SEX[sex], length: mm(length), diameter: mm(diameter), height: mm(height),
      whole: mm(whole), shucked: mm(shucked), viscera: mm(viscera), shell: mm(shell), rings: Number(rings) };
  });
writeFileSync(new URL('../data/abalone.json', import.meta.url), JSON.stringify(rows));
console.log(`${rows.length} rows written`);
