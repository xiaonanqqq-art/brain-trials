const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { questions, categories, chapters } = require('../questions.js');

const question = id => questions.find(item => item.id === id);
const chosen = id => { const q = question(id); return q.options[q.answer]; };
const permutations = values => values.length ? values.flatMap((item, i) => permutations(values.filter((_, j) => i !== j)).map(rest => [item, ...rest])) : [[]];

test('campaign provides playable questions in all five categories in each chapter', () => {
  assert.equal(questions.length, 15);
  assert.equal(chapters.length, 3);
  const order = ['number', 'pattern', 'logic', 'memory', 'spatial'];
  assert.deepEqual(Object.keys(categories).sort(), [...order].sort());
  for (let chapter = 0; chapter < 3; chapter++) assert.deepEqual(questions.slice(chapter * 5, chapter * 5 + 5).map(q => q.category), order);
  questions.forEach((q, i) => {
    assert.equal(q.id, `q${i + 1}`);
    for (const field of ['title', 'prompt', 'hint', 'explanation']) assert.equal(typeof q[field], 'string');
    if (q.category !== 'memory') {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map(o => o.label)).size, 4);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
    }
  });
});

test('classic browser script exports the same campaign without CommonJS or network', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../questions.js'), 'utf8'), context);
  assert.equal(context.BrainQuestions.questions.length, 15);
  assert.equal(context.BrainQuestions.questions[14].id, 'q15');
});

test('number answers follow the stated constant difference, alternating subsequences and alternating operations', () => {
  assert.equal(chosen('q1').label, String(15 + (7 - 3)));
  assert.equal(chosen('q6').label, String(16 + (13 - 10)));
  assert.equal(chosen('q11').label, String(18 * 2 + 1));
  for (const id of ['q1', 'q6', 'q11']) assert.match(question(id).visual, /class="number-sequence"/);
});

test('count and cancellation puzzles give unique visible options', () => {
  assert.equal(chosen('q2').label, '4 个圆点');
  const q = question('q7');
  const result = [2, 6].filter(cell => ![2, 4].includes(cell)).concat([2, 4].filter(cell => ![2, 6].includes(cell))).sort((a, b) => a - b);
  assert.deepEqual(result, [4, 6]);
  assert.deepEqual(cells(q.options[q.answer].visual), result);
  assert.equal(q.options.filter(option => JSON.stringify(cells(option.visual)) === JSON.stringify(result)).length, 1);
});

test('first logic puzzle has one ordering and the advertised person is in the middle', () => {
  const solutions = permutations(['小林', '小周', '小许']).filter(row => row.indexOf('小林') < row.indexOf('小周') && row.indexOf('小许') > row.indexOf('小周'));
  assert.equal(solutions.length, 1);
  assert.equal(chosen('q3').label, solutions[0][1]);
});

test('exactly one true box statement determines the red box', () => {
  const solutions = ['红盒', '蓝盒', '绿盒'].filter(box => [box === '蓝盒', box !== '蓝盒', box !== '红盒'].filter(Boolean).length === 1);
  assert.deepEqual(solutions, ['红盒']);
  assert.equal(chosen('q8').label, solutions[0]);
});

test('every role and drink assignment is enumerated for the final logic puzzle', () => {
  const solutions = [];
  for (const roles of permutations(['程序员', '画家', '作家'])) for (const drinks of permutations(['茶', '咖啡', '水'])) {
    if (drinks[0] === '茶' || drinks[roles.indexOf('画家')] !== '咖啡' || roles[1] !== '作家' || drinks[2] === '咖啡' || drinks[roles.indexOf('程序员')] !== '水') continue;
    solutions.push({ roles, drinks });
  }
  assert.equal(solutions.length, 1);
  assert.equal(chosen('q13').label, `${solutions[0].roles[0]}，喝${solutions[0].drinks[0]}`);
});

test('memory challenges contain the required number of distinct valid cells', () => {
  for (const [id, size, count] of [['q4', 3, 3], ['q9', 4, 4], ['q14', 4, 5]]) {
    const q = question(id);
    assert.equal(q.gridSize, size);
    assert.equal(q.cells.length, count);
    assert.equal(new Set(q.cells).size, count);
    assert.ok(q.cells.every(cell => Number.isInteger(cell) && cell >= 0 && cell < size * size));
    assert.equal(q.options, undefined);
  }
});

function cells(svg) {
  return [...svg.matchAll(/data-cell="(\d+)"/g)].map(match => Number(match[1])).sort((a, b) => a - b);
}

test('clockwise rotation uses the center of the grid and has exactly one matching diagram', () => {
  const q = question('q5');
  const expected = cells(q.visual).map(cell => (cell % 3) * 3 + 2 - Math.floor(cell / 3)).sort((a, b) => a - b);
  assert.deepEqual(expected, [1, 2, 4]);
  assert.deepEqual(cells(q.options[q.answer].visual), expected);
  assert.equal(q.options.filter(option => JSON.stringify(cells(option.visual)) === JSON.stringify(expected)).length, 1);
});

test('vertical-axis reflection preserves rows and reverses columns', () => {
  const q = question('q10');
  const expected = cells(q.visual).map(cell => Math.floor(cell / 4) * 4 + 3 - cell % 4).sort((a, b) => a - b);
  assert.deepEqual(expected, [2, 3, 6, 10]);
  assert.deepEqual(cells(q.options[q.answer].visual), expected);
  assert.equal(q.options.filter(option => JSON.stringify(cells(option.visual)) === JSON.stringify(expected)).length, 1);
});

test('two simultaneous Latin-square constraints determine the missing shape and count', () => {
  const shapeRows = [['triangle', 'circle', 'square'], ['square', 'triangle', 'circle'], ['circle', 'square']];
  const countRows = [[1, 2, 3], [2, 3, 1], [3, 1]];
  const candidates = [];
  for (const shape of ['triangle', 'circle', 'square']) for (const count of [1, 2, 3]) {
    if (shapeRows[2].includes(shape) || [shapeRows[0][2], shapeRows[1][2]].includes(shape)) continue;
    if (countRows[2].includes(count) || [countRows[0][2], countRows[1][2]].includes(count)) continue;
    candidates.push({ shape, count });
  }
  assert.deepEqual(candidates, [{ shape: 'triangle', count: 2 }]);
  assert.equal(chosen('q12').label, '2 个三角形');
});

test('folding all six net faces puts face 6 opposite face 1', () => {
  // Independently track each face normal, right and down vectors when folding.
  const net = [[1, 1, 1], [2, 1, 0], [3, 0, 1], [4, 2, 1], [5, 1, 2], [6, 1, 3]];
  const frames = new Map([[1, { normal: [0, 0, 1], right: [1, 0, 0], down: [0, 1, 0] }]]);
  const neg = vector => vector.map(n => -n);
  const queue = [1];
  while (queue.length) {
    const id = queue.shift(), [, x, y] = net.find(face => face[0] === id), frame = frames.get(id);
    for (const [next, nx, ny] of net) {
      if (frames.has(next) || Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      const dx = nx - x, dy = ny - y;
      frames.set(next, dx === 1 ? { normal: frame.right, right: neg(frame.normal), down: frame.down }
        : dx === -1 ? { normal: neg(frame.right), right: frame.normal, down: frame.down }
          : dy === 1 ? { normal: frame.down, right: frame.right, down: neg(frame.normal) }
            : { normal: neg(frame.down), right: frame.right, down: frame.normal });
      queue.push(next);
    }
  }
  assert.equal(new Set([...frames.values()].map(frame => frame.normal.join(','))).size, 6);
  const opposite = [...frames.entries()].find(([, frame]) => frame.normal[2] === -1)[0];
  assert.equal(opposite, 6);
  assert.equal(chosen('q15').label, String(opposite));
});
