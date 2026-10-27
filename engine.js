(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BrainEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1, LIMIT = 45000, OBSERVE = 5000;
  const currentQuestion = (run, questions) => questions[run.order[run.index]];

  function setupQuestion(run, now, questions) {
    const q = currentQuestion(run, questions);
    Object.assign(run, {phase: q.category === 'memory' ? 'ready' : 'answer',
      remainingMs: LIMIT, observeMs: OBSERVE, questionElapsedMs: 0,
      selection: q.category === 'memory' ? [] : null, hinted: false, lastTick: now, paused: false});
  }

  function createRun(mode, now, questions, options = {}) {
    const order = options.indices ? [...options.indices] : questions.map((_, i) => i);
    if (!['timed', 'untimed'].includes(mode) || !order.length ||
        order.some(i => !Number.isInteger(i) || !questions[i]) || new Set(order).size !== order.length) {
      throw new Error('Invalid game configuration');
    }
    const run = {version: VERSION, mode, order, index: 0, elapsedMs: 0,
      results: [], practice: Boolean(options.practice)};
    setupQuestion(run, now, questions);
    return run;
  }

  function score(correct, mode, remainingMs, hinted) {
    if (!correct) return 0;
    const bonus = mode === 'timed' ? Math.floor(40 * Math.max(0, Math.min(LIMIT, remainingMs)) / LIMIT) : 0;
    return 100 + bonus - (hinted ? 30 : 0);
  }

  function record(run, questions, status) {
    const q = currentQuestion(run, questions);
    const correct = status === 'correct';
    const result = {questionIndex: run.order[run.index], id: q.id, category: q.category,
      status, correct, points: score(correct, run.mode, run.remainingMs, run.hinted),
      elapsedMs: run.questionElapsedMs, remainingMs: run.remainingMs, hinted: run.hinted,
      selection: Array.isArray(run.selection) ? [...run.selection] : run.selection};
    run.results.push(result);
    run.phase = 'feedback';
    return result;
  }

  function tick(run, now, questions) {
    if (run.paused) return;
    let delta = Math.max(0, now - run.lastTick);
    run.lastTick = now;
    if (run.phase === 'observe') {
      const consumed = Math.min(run.observeMs, delta);
      run.observeMs -= consumed;
      delta -= consumed;
      if (run.observeMs <= 0) run.phase = 'answer';
    }
    if (run.phase !== 'answer') return;
    const elapsed = run.mode === 'timed' ? Math.min(run.remainingMs, delta) : delta;
    run.elapsedMs += elapsed;
    run.questionElapsedMs += elapsed;
    if (run.mode === 'timed') {
      run.remainingMs = Math.max(0, run.remainingMs - elapsed);
      if (run.remainingMs <= 0) record(run, questions, 'timeout');
    }
  }

  function pause(run, now, questions) {
    tick(run, now, questions);
    run.paused = true;
  }
  function resume(run, now) { run.paused = false; run.lastTick = now; }
  function beginMemory(run, now) {
    if (run.phase !== 'ready' || run.paused) return;
    run.phase = 'observe'; run.lastTick = now;
  }
  function selectAnswer(run, value, questions) {
    if (run.phase !== 'answer' || run.paused || !Number.isInteger(value)) return;
    const q = currentQuestion(run, questions);
    if (q.category === 'memory') {
      if (value < 0 || value >= q.gridSize ** 2) return;
      const index = run.selection.indexOf(value);
      if (index >= 0) run.selection.splice(index, 1);
      else if (run.selection.length < q.cells.length) run.selection.push(value);
    } else if (value >= 0 && value < q.options.length) run.selection = value;
  }
  function useHint(run) {
    if (run.paused || !['ready', 'observe', 'answer'].includes(run.phase)) return;
    run.hinted = true;
  }
  function submit(run, now, questions, action = 'answer') {
    if (run.paused || ['feedback', 'complete'].includes(run.phase)) return null;
    tick(run, now, questions);
    if (run.phase === 'feedback') return run.results.at(-1);
    if (action === 'skip') return record(run, questions, 'skipped');
    if (run.phase !== 'answer') return null;
    const q = currentQuestion(run, questions);
    let correct;
    if (q.category === 'memory') {
      if (run.selection.length !== q.cells.length) return null;
      correct = q.cells.every(i => run.selection.includes(i));
    } else {
      if (!Number.isInteger(run.selection) || !q.options[run.selection]) return null;
      correct = run.selection === q.answer;
    }
    return record(run, questions, correct ? 'correct' : 'incorrect');
  }
  function next(run, now, questions) {
    if (run.phase !== 'feedback') return;
    if (run.index === run.order.length - 1) { run.phase = 'complete'; run.paused = false; return; }
    run.index++;
    setupQuestion(run, now, questions);
  }

  const finite = value => Number.isFinite(value) && value >= 0;
  function validSelection(selection, q, allowEmpty) {
    if (q.category === 'memory') return Array.isArray(selection) &&
      selection.length <= q.cells.length && new Set(selection).size === selection.length &&
      selection.every(i => Number.isInteger(i) && i >= 0 && i < q.gridSize ** 2);
    return (allowEmpty && selection === null) || (Number.isInteger(selection) && selection >= 0 && selection < q.options.length);
  }
  function restore(serialized, questions, now) {
    try {
      const s = JSON.parse(serialized);
      if (!s || s.version !== VERSION || !['timed', 'untimed'].includes(s.mode) ||
          !Array.isArray(s.order) || !s.order.length || s.order.length > questions.length ||
          new Set(s.order).size !== s.order.length || s.order.some(i => !Number.isInteger(i) || !questions[i]) ||
          !Number.isInteger(s.index) || s.index < 0 || s.index >= s.order.length ||
          !['ready', 'observe', 'answer', 'feedback', 'complete'].includes(s.phase) ||
          !finite(s.remainingMs) || s.remainingMs > LIMIT || !finite(s.observeMs) || s.observeMs > OBSERVE ||
          !finite(s.elapsedMs) || !finite(s.questionElapsedMs) || typeof s.hinted !== 'boolean' ||
          typeof s.practice !== 'boolean' || !Array.isArray(s.results)) return null;
      const settled = ['feedback', 'complete'].includes(s.phase);
      if (s.results.length !== s.index + (settled ? 1 : 0) ||
          (s.phase === 'complete' && s.index !== s.order.length - 1)) return null;
      const q = currentQuestion(s, questions);
      if ((['ready', 'observe'].includes(s.phase) && q.category !== 'memory') ||
          !validSelection(s.selection, q, true)) return null;
      for (let i = 0; i < s.results.length; i++) {
        const r = s.results[i], question = questions[s.order[i]];
        if (!r || r.questionIndex !== s.order[i] || r.id !== question.id || r.category !== question.category ||
            !['correct', 'incorrect', 'skipped', 'timeout'].includes(r.status) ||
            r.correct !== (r.status === 'correct') || typeof r.hinted !== 'boolean' ||
            !finite(r.elapsedMs) || !finite(r.remainingMs) || r.remainingMs > LIMIT ||
            !validSelection(r.selection, question, true) ||
            r.points !== score(r.correct, s.mode, r.remainingMs, r.hinted)) return null;
      }
      s.paused = s.phase !== 'complete'; s.lastTick = now;
      return s;
    } catch (_) { return null; }
  }

  function summarize(run, questions) {
    const categories = {};
    for (const index of run.order) {
      const key = questions[index].category;
      if (!categories[key]) categories[key] = {correct: 0, total: 0};
      categories[key].total++;
    }
    for (const r of run.results) if (r.correct) categories[r.category].correct++;
    return {score: run.results.reduce((sum, r) => sum + r.points, 0),
      correct: run.results.filter(r => r.correct).length, total: run.order.length,
      hints: run.results.filter(r => r.hinted).length, elapsedMs: run.elapsedMs, categories};
  }
  return {createRun, currentQuestion, tick, pause, resume, beginMemory,
    selectAnswer, useHint, submit, next, score, restore, summarize};
});
