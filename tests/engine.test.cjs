const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

const choice = {id:'a', category:'number', options:[{label:'10'},{label:'12'},{label:'14'},{label:'16'}], answer:1};
const memory = {id:'b', category:'memory', gridSize:3, cells:[0,4,8]};
const bank = [choice, memory];
const run = (mode='timed') => E.createRun(mode, 1000, bank);

test('correct answers earn base, time bonus, and at most one hint deduction', () => {
  const s=run(); E.selectAnswer(s,1,bank); E.useHint(s); E.useHint(s);
  const result=E.submit(s,12250,bank);
  assert.equal(result.points,100); assert.equal(result.correct,true); assert.equal(result.hinted,true);
  assert.equal(s.remainingMs,33750);
});
test('wrong, skipped, and expired answers score zero and cannot settle twice', () => {
  const s=run(); E.selectAnswer(s,0,bank);
  assert.equal(E.submit(s,1000,bank).points,0);
  assert.equal(E.submit(s,1001,bank),null); assert.equal(s.results.length,1);
  const skipped=run(); assert.equal(E.submit(skipped,1000,bank,'skip').status,'skipped');
  const expired=run(); E.selectAnswer(expired,1,bank);
  assert.equal(E.submit(expired,46000,bank).status,'timeout'); assert.equal(expired.results[0].points,0);
});
test('empty or out-of-range selections cannot be submitted or receive points', () => {
  const s=run(); assert.equal(E.submit(s,1000,bank),null);
  E.selectAnswer(s,8,bank); assert.equal(s.selection,null);
  E.selectAnswer(s,-1,bank); assert.equal(E.submit(s,1000,bank),null);
});
test('pausing settles elapsed time and resume excludes time spent away', () => {
  const s=run(); E.pause(s,11000,bank); assert.equal(s.remainingMs,35000);
  E.tick(s,40000,bank); assert.equal(s.remainingMs,35000);
  E.resume(s,50000); E.tick(s,51000,bank); assert.equal(s.remainingMs,34000);
  assert.equal(s.elapsedMs,11000);
});
test('memory observation does not consume answering time and requires exact selected positions', () => {
  const s=run(); E.submit(s,1000,bank,'skip'); E.next(s,2000,bank);
  assert.equal(s.phase,'ready'); E.beginMemory(s,3000);
  E.tick(s,5000,bank); assert.equal(s.observeMs,3000); assert.equal(s.remainingMs,45000);
  E.selectAnswer(s,0,bank); assert.deepEqual(s.selection,[]);
  E.tick(s,8000,bank); assert.equal(s.phase,'answer'); assert.equal(s.elapsedMs,0);
  E.selectAnswer(s,0,bank); E.selectAnswer(s,4,bank); assert.equal(E.submit(s,8100,bank),null);
  E.selectAnswer(s,8,bank); assert.equal(E.submit(s,9000,bank).correct,true);
  E.next(s,10000,bank); assert.equal(s.phase,'complete'); assert.equal(s.results.length,2);
});
test('memory selection toggles and prevents over-selection or invalid grid cells', () => {
  const s=E.createRun('untimed',0,bank,{indices:[1],practice:true}); E.beginMemory(s,0); E.tick(s,5000,bank);
  [0,4,8,2,12,-1].forEach(i=>E.selectAnswer(s,i,bank)); assert.deepEqual(s.selection,[0,4,8]);
  E.selectAnswer(s,4,bank); assert.deepEqual(s.selection,[0,8]);
});
test('untimed mode has no deadline or speed bonus', () => {
  const s=run('untimed'); E.tick(s,101000,bank); assert.equal(s.phase,'answer');
  E.selectAnswer(s,1,bank); assert.equal(E.submit(s,101000,bank).points,100);
});
test('restoring an observation pauses it with its remaining time and prior selections', () => {
  const s=E.createRun('timed',0,bank,{indices:[1]}); E.beginMemory(s,0); E.tick(s,2000,bank);
  const loaded=E.restore(JSON.stringify(s),bank,99999);
  assert.equal(loaded.paused,true); assert.equal(loaded.observeMs,3000);
  E.resume(loaded,100000); E.tick(loaded,102000,bank);
  assert.equal(loaded.phase,'observe'); assert.equal(loaded.observeMs,1000);
});
test('corrupt, incompatible or invalid save data is rejected safely', () => {
  for(const data of ['oops','null','{}',JSON.stringify({...run(),version:8}),JSON.stringify({...run(),index:20}),JSON.stringify({...run(),remainingMs:-100}),JSON.stringify({...run(),order:[999]}),JSON.stringify({...run(),results:[{points:9999}]})]) {
    assert.equal(E.restore(data,bank,0),null);
  }
});
test('completed result summarizes categories and hints without mutating history', () => {
  const s=run('untimed'); E.selectAnswer(s,1,bank); E.submit(s,2000,bank); E.next(s,3000,bank);
  E.useHint(s); E.submit(s,3000,bank,'skip'); E.next(s,4000,bank);
  const summary=E.summarize(s,bank);
  assert.equal(summary.score,100); assert.equal(summary.correct,1); assert.equal(summary.total,2);
  assert.equal(summary.hints,1); assert.equal(summary.categories.number.correct,1);
  assert.equal(summary.categories.memory.correct,0); assert.equal(s.phase,'complete');
});
test('practice uses its own ordered questions and cannot modify a campaign', () => {
  const campaign=run(); const practice=E.createRun('untimed',0,bank,{indices:[1],practice:true});
  E.submit(practice,0,bank,'skip'); E.next(practice,1,bank);
  assert.equal(practice.phase,'complete'); assert.equal(campaign.results.length,0); assert.equal(campaign.index,0);
});
