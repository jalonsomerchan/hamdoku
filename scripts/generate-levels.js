// Rebuild levels.json and its file:// compatible JavaScript mirror deterministically.
const fs = require('fs');
let seed = 938715;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
function pick(a) { return a[Math.floor(random() * a.length)]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function arrangements(n) {
  const result = [];
  function visit(cols) {
    if (cols.length === n) { result.push(cols); return; }
    for (let c = 0; c < n; c++) if (!cols.includes(c) && (!cols.length || Math.abs(c - cols[cols.length - 1]) > 1)) visit([...cols, c]);
  }
  visit([]); return result;
}
function makeRegions(n) {
  const regions = Array(n * n).fill(-1);
  shuffle([...regions.keys()]).slice(0, n).forEach((cell, i) => { regions[cell] = i; });
  for (let remaining = n * n - n; remaining; remaining--) {
    const options = [];
    for (let cell = 0; cell < regions.length; cell++) if (regions[cell] < 0) {
      const neighbours = [cell % n ? cell - 1 : -1, cell % n < n - 1 ? cell + 1 : -1, cell >= n ? cell - n : -1, cell < n * (n - 1) ? cell + n : -1].filter(i => i >= 0 && regions[i] >= 0);
      if (neighbours.length) options.push([cell, neighbours]);
    }
    const [cell, neighbours] = pick(options); regions[cell] = regions[pick(neighbours)];
  }
  return regions;
}
const cache = new Map(), seen = new Set(), levels = [];
for (let id = 1; id <= 300; id++) {
  const n = id <= 10 ? 4 : id <= 35 ? 5 : id <= 75 ? 6 : id <= 125 ? 7 : id <= 190 ? 8 : 9;
  if (!cache.has(n)) cache.set(n, arrangements(n));
  for (;;) {
    const regions = makeRegions(n), key = `${n}:${regions.join(',')}`;
    if (seen.has(key)) continue;
    const solutions = cache.get(n).filter(cols => new Set(cols.map((c, r) => regions[r * n + c])).size === n);
    if (!solutions.length) continue;
    const solution = pick(solutions), initial = [];
    let candidates = solutions;
    // Add the fewest useful clues found by greedy elimination when needed for uniqueness.
    while (candidates.length > 1) {
      let best = -1, smallest = candidates.length;
      for (let row = 0; row < n; row++) if (!initial.includes(row * n + solution[row])) {
        const count = candidates.filter(cols => cols[row] === solution[row]).length;
        if (count < smallest) { smallest = count; best = row; }
      }
      if (best < 0) throw Error('No se puede distinguir la solución');
      initial.push(best * n + solution[best]);
      candidates = candidates.filter(cols => cols[best] === solution[best]);
    }
    // Prefer puzzles with few starting hamsters, especially in later levels.
    const maxInitial = id <= 35 ? 1 : id <= 125 ? 1 : 1;
    if (initial.length > maxInitial) continue;
    // Early levels receive an extra starting hamster when it leaves a puzzle to solve.
    if (id <= 5 && initial.length === 0) { const row = Math.floor(random() * n); initial.push(row * n + solution[row]); }
    seen.add(key); levels.push({id, size:n, regions, initial}); break;
  }
}
const json = JSON.stringify(levels);
fs.writeFileSync('levels.json', json + '\n');
fs.writeFileSync('levels.js', `// Generated from levels.json by scripts/generate-levels.js.\nwindow.HAMDOKU_LEVELS = ${json};\n`);
console.log(`Generados ${levels.length} niveles.`);
