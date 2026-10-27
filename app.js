(function () {
  'use strict';
  const {questions, categories, chapters} = window.BrainQuestions;
  const E = window.BrainEngine;
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const keys = {run:'brain-trials:run:v1', records:'brain-trials:records:v1', settings:'brain-trials:settings:v1'};
  let storageAvailable = true, screen = 'home', session = null, lastSave = 0;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = key => {try {return localStorage.getItem(key);} catch (_) {storageAvailable = false; return null;}};
  const write = (key, value) => {try {value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value);} catch (_) {storageAvailable = false;}};
  const parse = value => {try {return JSON.parse(value);} catch (_) {return null;}};
  let campaign = E.restore(read(keys.run),questions,Date.now());
  if (campaign && (campaign.practice || campaign.phase === 'complete' || campaign.order.length !== questions.length)) campaign = null;
  let records = parse(read(keys.records));
  if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
  let lastCompleted = E.restore(records.last,questions,Date.now());
  if (lastCompleted?.phase !== 'complete' || lastCompleted.practice) lastCompleted = null;
  let mode = parse(read(keys.settings))?.mode === 'untimed' ? 'untimed' : 'timed';
  for (const value of ['timed','untimed']) {
    const item = records[value];
    if (!item || !Number.isInteger(item.score) || item.score < 0 || item.score > (value === 'timed' ? 2100 : 1500) ||
        !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 15 || !Number.isFinite(item.elapsedMs) || item.elapsedMs < 0) delete records[value];
  }
  // Probe storage once: browsers can allow reads while refusing writes.
  write(keys.settings,JSON.stringify({mode}));
  const clock = ms => `${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}`;
  const modeLabel = value => value === 'timed' ? '计时挑战' : '从容思考';
  const icon = (name,size=22) => {
    const paths = {arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 5 11 7-11 7Z"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-13h-7Z"/>',check:'<path d="m5 12 4 4L19 6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',bulb:'<path d="M9 18h6m-5 3h4M8.5 15.5a6 6 0 1 1 7 0L15 18H9Z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'};
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;
  };
  const button = (action,label,style='primary',extra='') => `<button type="button" class="btn btn-${style}" data-action="${action}" ${extra}>${label}</button>`;
  const notice = () => !storageAvailable ? '<p class="storage-notice" role="status">当前浏览器无法保存进度，本次仍可正常游玩。</p>' : '';
  function persist() {
    if (campaign && campaign.phase !== 'complete') write(keys.run,JSON.stringify(campaign));
    else write(keys.run,null);
    lastSave = Date.now();
    if (!storageAvailable && !document.querySelector('.storage-notice')) app.insertAdjacentHTML('afterbegin',notice());
  }
  function pauseActive() {
    if (session && session.phase !== 'complete') E.pause(session,Date.now(),questions);
    persist();
  }
  function navigate(nextScreen) {
    screen = nextScreen;
    render();
    app.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function art() {
    return `<svg class="orbit-art" viewBox="0 0 480 410" fill="none" aria-hidden="true">
      <defs><linearGradient id="facet" x1="172" y1="120" x2="310" y2="293" gradientUnits="userSpaceOnUse"><stop stop-color="#ffbf8c"/><stop offset="1" stop-color="#f37e48"/></linearGradient><radialGradient id="halo"><stop stop-color="#fca778" stop-opacity=".13"/><stop offset="1" stop-color="#fca778" stop-opacity="0"/></radialGradient></defs>
      <circle cx="240" cy="205" r="170" fill="url(#halo)"/>
      <circle cx="240" cy="205" r="152" stroke="#71758d" stroke-opacity=".19"/>
      <circle cx="240" cy="205" r="117" stroke="#818598" stroke-opacity=".15" stroke-dasharray="3 7"/>
      <ellipse cx="240" cy="205" rx="201" ry="71" transform="rotate(-32 240 205)" stroke="#7d859e" stroke-opacity=".32"/>
      <ellipse cx="240" cy="205" rx="181" ry="77" transform="rotate(42 240 205)" stroke="#7d859e" stroke-opacity=".16"/>
      <path d="m240 111 87 49v99l-87 50-87-50v-99Z" fill="#ff8c55" fill-opacity=".08" stroke="#ffb08c" stroke-opacity=".4"/>
      <path d="m240 126 73 42-73 43-73-43Z" fill="#ffd1ad"/>
      <path d="m167 168 73 43v83l-73-42Z" fill="url(#facet)"/>
      <path d="m240 211 73-43v84l-73 42Z" fill="#dc6c40"/>
      <path d="m240 126-24 56 24 29 24-29Z" fill="#fff0da" fill-opacity=".46"/>
      <path d="m167 168 49 14-18 42 42 70m73-126-49 14 18 42-42 70m-42-70 42-13 42 13" stroke="#ffe1c9" stroke-opacity=".36"/>
      <g transform="translate(73 105) rotate(-12)"><rect width="55" height="55" rx="14" fill="#202c2d" stroke="#81d8b5" stroke-opacity=".35"/><path d="M17 36 28 16l11 20Z" stroke="#81d8b5" stroke-width="2"/></g>
      <g transform="translate(356 232) rotate(12)"><rect width="56" height="56" rx="15" fill="#27263b" stroke="#a39af5" stroke-opacity=".4"/><circle cx="28" cy="28" r="12" stroke="#b1a6fa" stroke-width="2"/><circle cx="28" cy="28" r="4" fill="#b1a6fa"/></g>
      <g transform="translate(330 63) rotate(10)"><rect width="44" height="44" rx="12" fill="#292522" stroke="#ffb789" stroke-opacity=".3"/><path d="M14 14h16v16H14Z" stroke="#ffc390" stroke-width="2"/></g>
      <circle cx="97" cy="257" r="5" fill="#a39af5"/><circle cx="299" cy="345" r="4" fill="#81d8b5"/><circle cx="229" cy="53" r="3" fill="#ffb086"/>
      <path d="M119 315h25m-12-12v25M391 140h14m-7-7v14" stroke="#7c8a9e" stroke-opacity=".5"/>
      <text x="39" y="217" fill="#7d879d" font-family="monospace" font-size="9" letter-spacing="3">THINK</text>
      <text x="305" y="328" fill="#7d879d" font-family="monospace" font-size="9" letter-spacing="3">BEYOND</text>
      <text x="211" y="366" fill="#737b8f" font-family="monospace" font-size="9" letter-spacing="4">MIND IN MOTION</text>
    </svg>`;
  }
  function chapterCards() {
    const history = campaign || lastCompleted;
    return chapters.map((chapter,i)=>{
      const count = history ? history.results.filter(r=>Math.floor(r.questionIndex/5)===i).length : 0;
      return `<article class="chapter-card chapter-${i+1}"><div class="chapter-top"><span class="chapter-number">CHAPTER 0${i+1}</span><span class="chapter-icon">${icon(['bolt','target','spark'][i])}</span></div>
        <h3 class="chapter-title">${chapter.name}<span>${['入门','进阶','挑战'][i]}</span></h3><p class="chapter-description">${['从规律出发，给思维一个轻盈的热身。','越过表象，连接那些隐藏的线索。','多想一步，挑战你的思考边界。'][i]}</p>
        <div class="chapter-progress"><div class="level-dots" aria-label="已完成 ${count} / 5 关">${Array.from({length:5},(_,n)=>`<span class="level-dot ${n<count?'done':n===count&&i===Math.floor((campaign?.index||0)/5)?'active':'locked'}"></span>`).join('')}</div></div>
        <div class="chapter-bottom"><span>第 ${i*5+1}—${i*5+5} 关 <span class="muted">· ${count}/5 完成</span></span><button class="text-button" data-action="map" aria-label="查看${chapter.name}关卡">查看关卡 ${icon('arrow',16)}</button></div></article>`;
    }).join('');
  }
  function renderHome() {
    return `<div class="container">${notice()}<section class="hero"><div class="hero-copy"><p class="eyebrow">A LITTLE CHALLENGE. A SHARPER MIND.</p>
      <h1 class="hero-title">让大脑，<br><span>进入状态。</span></h1><p class="hero-description">在数字、图形与线索之间，发现思考的乐趣。<br>15 道脑力关卡，等你逐一破解。</p>
      <div class="hero-actions">${button('start',`开始挑战 ${icon('arrow',18)}`)}${campaign?button('continue',`继续 · 第 ${campaign.index+1} 关`,'secondary'):button('help','怎么玩？','ghost')}</div>
      <div class="mode-switch" role="group" aria-label="挑战模式" style="margin-top:18px">${['timed','untimed'].map(m=>`<button class="mode-option" type="button" data-mode="${m}" aria-pressed="${mode===m}">${m==='timed'?'◷ 计时挑战':'∞ 从容思考'}</button>`).join('')}</div>
      <div class="hero-stats"><div class="hero-stat"><strong>15<span class="sr-only">道</span></strong><span>精选关卡</span></div><div class="hero-stat"><strong>05</strong><span>思维维度</span></div><div class="hero-stat"><strong>5–10</strong><span>分钟，唤醒大脑</span></div></div></div>
      <div class="hero-art">${art()}</div></section>
      <section class="journey" aria-labelledby="journey-title"><div class="section-heading"><div><h2 id="journey-title">你的闯关路线</h2><p>循序渐进，让每一次思考都有新的发现。</p></div><span class="pill">3 个章节 · 15 个挑战</span></div><div class="chapter-grid">${chapterCards()}</div></section>
      <div class="category-strip">${Object.values(categories).map(c=>`<div class="category-item"><span aria-hidden="true">${c.icon}</span><span>${c.name}</span></div>`).join('')}</div></div>`;
  }
  function renderMap() {
    const history = campaign || lastCompleted;
    const done = new Set(history?.results.map(r=>r.questionIndex)||[]);
    const current = campaign ? campaign.order[campaign.index] : lastCompleted ? -1 : 0;
    return `<div class="container map-page">${notice()}<div class="section-heading"><div><p class="eyebrow">YOUR NEXT CHALLENGE</p><h1>每一步，都算数。</h1><p>按顺序解锁关卡，已完成的题目可以随时练习。</p></div>${button('home','返回大厅','ghost')}</div>${chapters.map((ch,i)=>`<section class="map-chapter"><h2><span class="muted">0${i+1} / </span>${ch.name}</h2><div class="map-grid">${questions.slice(i*5,i*5+5).map((q,n)=>{
      const idx=i*5+n, completed=done.has(idx), unlocked=completed||idx===current;
      return `<button class="map-level ${completed?'done':unlocked?'current':'locked'}" data-level="${idx}" ${unlocked?'':'disabled'}><span class="map-number">${String(idx+1).padStart(2,'0')}</span><span class="map-symbol" aria-hidden="true">${categories[q.category].icon}</span><strong>${q.title}</strong><small>${categories[q.category].name}</small><span class="map-state">${completed?'✓ 再练一次':unlocked?'开始这一关 →':'尚未解锁'}</span></button>`;
    }).join('')}</div></section>`).join('')}</div>`;
  }
  function renderMemory(q) {
    if (session.phase === 'ready') return `<div class="memory-status"><span class="memory-intro-icon" aria-hidden="true">▦</span><h2>准备好你的记忆力</h2><p>你有 <strong>5 秒</strong> 记住 ${q.cells.length} 个亮格的位置。<br>图案消失后，点选你记住的格子。</p>${button('observe',`准备好了 ${icon('arrow',18)}`)}</div>`;
    const observing=session.phase==='observe', settled=session.phase==='feedback';
    return `<p class="memory-status">${observing?'<span data-observe>5</span> 秒 · 记住这些亮格':settled?'正确位置已亮起，带 × 的格子是误选位置':`已选 <span data-selected-count>${session.selection.length}</span> / ${q.cells.length} 格 · 再点一次可取消`}</p>
      <div class="memory-grid" style="--grid-size:${q.gridSize}" role="group" aria-label="${q.gridSize} 行 ${q.gridSize} 列记忆网格">${Array.from({length:q.gridSize*q.gridSize},(_,i)=>{
        const lit=(observing||settled)&&q.cells.includes(i), selected=session.selection.includes(i), missed=settled&&selected&&!lit;
        return `<button type="button" class="memory-cell ${lit?'lit':''} ${selected?'selected':''} ${missed?'missed':''}" data-answer="${i}" aria-label="第 ${Math.floor(i/q.gridSize)+1} 行第 ${i%q.gridSize+1} 列${lit?'，亮格':''}" aria-pressed="${selected}" ${observing||settled?'disabled':''}>${missed?'×':selected&&!observing?'✓':''}</button>`;
      }).join('')}</div>`;
  }
  function renderAnswers(q) {
    const settled=session.phase==='feedback';
    return `<div class="answer-grid" role="group" aria-label="选择一个答案">${q.options.map((opt,i)=>`<button type="button" class="answer-option ${session.selection===i?'selected':''} ${settled&&q.answer===i?'correct':''} ${settled&&session.selection===i&&q.answer!==i?'incorrect':''}" data-answer="${i}" aria-pressed="${session.selection===i}" ${settled?'disabled':''}><span class="option-letter">${'ABCD'[i]}</span><span class="option-content">${opt.visual?`<span class="option-visual">${opt.visual}</span>`:''}<span>${escape(opt.label)}</span></span>${settled&&q.answer===i?'<span aria-label="正确答案">✓</span>':''}</button>`).join('')}</div>`;
  }
  function renderGame() {
    if (!session) return renderHome();
    const q=E.currentQuestion(session,questions), globalIndex=session.order[session.index], chapterIndex=Math.floor(globalIndex/5);
    const settled=session.phase==='feedback', answered=session.results.at(-1);
    const readyToSubmit=q.category==='memory'?session.selection.length===q.cells.length:Number.isInteger(session.selection);
    const timerText=session.mode==='untimed'?'不限时':`${Math.ceil(session.remainingMs/1000)}s`;
    return `<div class="container">${notice()}<div class="game-layout"><aside class="game-sidebar"><p class="eyebrow">${session.practice?'PRACTICE MODE':'YOUR JOURNEY'}</p>${chapters.map((c,i)=>`<div class="sidebar-chapter ${i===chapterIndex?'active':i<chapterIndex?'done':''}"><span>0${i+1}</span><div><strong>${c.name}</strong><small>第 ${i*5+1}—${i*5+5} 关</small></div>${i<chapterIndex?icon('check',16):''}</div>`).join('')}
      <div class="sidebar-note"><span class="muted">${session.practice?'练习成绩不计入挑战记录':'本局累计得分'}</span><strong>${E.summarize(session,questions).score}<small> 分</small></strong></div>${button('map','查看关卡地图','ghost')}</aside>
      <section class="game-main"><div class="game-topline"><span><strong>${String(globalIndex+1).padStart(2,'0')}</strong><span class="muted"> / 15</span> <span class="pill">${session.practice?'自由练习':modeLabel(session.mode)}</span></span><div class="timer-group"><span class="timer" data-timer>${timerText}</span>${!settled?`<button class="text-button" data-action="pause" aria-label="暂停游戏">${icon('pause')}</button>`:''}</div></div><div class="progress-track" role="progressbar" aria-label="闯关进度" aria-valuemin="0" aria-valuemax="${session.order.length}" aria-valuenow="${session.results.length}"><div class="progress-fill" style="width:${session.results.length/session.order.length*100}%"></div></div>
      ${session.paused&&!settled?`<div class="question-card pause-card"><div class="pause-icon">${icon('pause',40)}</div><p class="eyebrow">TAKE YOUR TIME</p><h1>思考，也需要喘口气。</h1><p class="muted">进度已暂停，准备好后从这里继续。</p>${button('resume',`继续挑战 ${icon('play',17)}`)}${button('home','回到大厅','ghost')}</div>`:
      `<article class="question-card"><div class="question-meta"><span class="pill">${categories[q.category].icon} ${categories[q.category].name}</span><span class="muted">${chapters[chapterIndex].name} · ${['入门','进阶','挑战'][chapterIndex]}</span></div><h1 class="question-title">${escape(q.title)}</h1><p class="question-prompt">${escape(q.prompt)}</p>
      ${q.category==='memory'?renderMemory(q):`${q.visual?`<div class="question-visual">${q.visual}</div>`:''}${renderAnswers(q)}`}
      ${session.hinted?`<div class="hint-panel" role="status">${icon('bulb',18)}<span>${escape(q.hint)}</span></div>`:''}
      ${settled?`<div class="feedback ${answered.correct?'correct':'incorrect'}" role="status"><div class="feedback-heading"><strong>${answered.correct?'✓ 思路正确，漂亮！':answered.status==='skipped'?'↗ 先看看这道题的思路':answered.status==='timeout'?'◷ 时间到，一起来拆解答案':'再想一步，就接近答案了'}</strong><span class="score-badge">+${answered.points} 分</span></div><p class="feedback-explanation">${escape(q.explanation)}</p></div><div class="question-actions"><span class="muted">${session.index+1===session.order.length?'最后一关已完成':'准备好后，继续下一道挑战。'}</span>${button('next',`${session.index+1===session.order.length?'查看成绩':'下一关'} ${icon('arrow',18)}`)}</div>`:
      `<div class="question-actions"><button class="text-button hint-button" data-action="hint" ${session.hinted?'disabled':''}>${icon('bulb',17)} ${session.hinted?'提示已使用':'一点提示'} <small>−30 分</small></button><div class="answer-actions"><button class="text-button" data-action="skip">跳过</button>${button('submit',`确认答案 ${icon('arrow',16)}`,'primary',`${session.phase!=='answer'||!readyToSubmit?'disabled':''}`)}</div></div>`}</article>`}</section></div></div>`;
  }
  function renderResult() {
    const target=session?.phase==='complete'?session:lastCompleted;
    if (!target) return `<div class="container empty-state"><p class="eyebrow">YOUR FIRST CHALLENGE AWAITS</p><h1>第一份成绩，等你写下。</h1><p class="muted">完成挑战后，在这里回顾你的思考轨迹。</p>${button('home','去挑战大厅')}</div>`;
    const summary=E.summarize(target,questions), mistakes=target.results.filter(r=>!r.correct);
    const title=summary.correct===summary.total?'思路全开，漂亮通关！':summary.correct>=summary.total*.66?'思考的火花，已经点亮。':'每一次思考，都是进步。';
    return `<div class="container result-page">${notice()}<section class="result-hero"><p class="eyebrow">${target.practice?'PRACTICE COMPLETE':'CHALLENGE COMPLETE'}</p><span class="result-emblem">${icon('spark',36)}</span><h1>${title}</h1><p class="muted">${target.practice?'自由练习已完成，挑战记录保持不变。':'15 道挑战已完成，来看看你的表现。'}</p><div class="result-score">${summary.score}<span> / ${target.order.length*(target.mode==='timed'?140:100)}</span></div><span class="pill">${modeLabel(target.mode)} · ${target.practice?'练习成绩':'本次得分'}</span><div class="result-stats"><div><strong>${summary.correct}<small> / ${summary.total}</small></strong><span>答对题数</span></div><div><strong>${clock(summary.elapsedMs)}</strong><span>思考用时</span></div><div><strong>${summary.hints}<small> 次</small></strong><span>使用提示</span></div></div><div class="hero-actions">${button('restart',`再挑战一次 ${icon('arrow',18)}`)}${mistakes.length?button('practice-mistakes','练习错题','secondary'):''}${button('home','返回大厅','ghost')}</div></section>
      <section><div class="section-heading"><div><h2>你的思维足迹</h2><p>看见擅长的，也发现下一次的突破点。</p></div></div><div class="ability-grid">${Object.entries(summary.categories).map(([key,data])=>`<article class="ability-card"><span aria-hidden="true">${categories[key].icon}</span><h3>${categories[key].name}</h3><strong>${data.correct}<small> / ${data.total}</small></strong><div class="progress-track"><div class="progress-fill" style="width:${data.correct/data.total*100}%"></div></div></article>`).join('')}</div></section>
      ${mistakes.length?`<section class="review-section"><div class="section-heading"><h2>再看一眼，就懂了</h2><span class="pill">${mistakes.length} 道待巩固</span></div><div class="review-list">${mistakes.map(r=>{const q=questions[r.questionIndex];return `<details class="review-item"><summary><span>${String(r.questionIndex+1).padStart(2,'0')} · ${escape(q.title)}</span><span class="muted">${r.status==='timeout'?'超时':r.status==='skipped'?'已跳过':'答错'} ＋</span></summary><p>${escape(q.explanation)}</p><button class="text-button" data-practice="${r.questionIndex}">单独练习这道题 →</button></details>`;}).join('')}</div></section>`:''}<p class="result-footnote muted">分数记录本次游戏表现，保持好奇比满分更有意义。</p></div>`;
  }
  function render() {
    app.innerHTML=({home:renderHome,map:renderMap,game:renderGame,result:renderResult}[screen]||renderHome)();
    document.querySelectorAll('.desktop-nav button').forEach(el=>el.classList.toggle('active',el.dataset.action===(screen==='result'?'records':'home')));
    updateClock();
  }
  function updateClock() {
    if (!session || screen!=='game') return;
    const timer=app.querySelector('[data-timer]');
    if(timer){timer.textContent=session.mode==='untimed'?'不限时':`${Math.ceil(session.remainingMs/1000)}s`;timer.classList.toggle('warning',session.mode==='timed'&&session.remainingMs<=10000);}
    const observe=app.querySelector('[data-observe]');if(observe)observe.textContent=Math.ceil(session.observeMs/1000);
  }
  function showDialog(title,body,actions=button('dialog-close','知道了')) {
    if (screen==='game') {pauseActive();render();}
    document.getElementById('modal-content').innerHTML=`<div class="modal-header"><h2>${title}</h2><button class="text-button" data-action="dialog-close" aria-label="关闭对话框">${icon('close')}</button></div>${body}<div class="modal-actions">${actions}</div>`;
    if(!modal.open)modal.showModal();
  }
  function showHelp() {
    showDialog('给大脑一个小挑战',`<ol class="rules-list"><li><strong>15 关，5 种思维挑战</strong><p>数字、图形、逻辑、记忆和空间题轮流登场，分为三个难度章节。</p></li><li><strong>选择你的节奏</strong><p>计时模式每题 45 秒，答对 100 分，越快最多加 40 分。从容思考不限时，每题最高 100 分。两种模式分别记录最佳成绩。</p></li><li><strong>卡住时，换个角度</strong><p>每题可用一次提示，答对时扣 30 分。跳过、答错、超时均为 0 分，结算后可看解析并继续。</p></li><li><strong>记忆挑战有 5 秒观察时间</strong><p>点击准备后记住亮格，图案隐藏后选出相同位置。暂停或离开标签页会隐藏题面。</p></li><li><strong>随时回来，接着思考</strong><p>进度保存在当前浏览器，刷新后点击继续即可。已完成关卡可以练习，练习不会改动挑战成绩。</p></li></ol>`);
  }
  function showRecords() {
    showDialog('我的最佳表现',`<div class="record-grid">${['timed','untimed'].map(m=>`<article class="record-card"><span class="pill">${modeLabel(m)}</span><strong>${records[m]?.score??'—'}<small> 分</small></strong><p class="muted">${records[m]?`${records[m].correct} / 15 答对 · ${clock(records[m].elapsedMs)}`:'完成整局挑战后点亮记录'}</p></article>`).join('')}</div><p class="muted">成绩仅保存在当前浏览器，两种模式分别记录。</p>`,`${lastCompleted?button('last-result','查看最近一局','secondary'):''}${button('dialog-close','继续探索')}`);
  }
  function startGame(force=false) {
    if(campaign&&!force){showDialog('开始新一轮挑战？','<p class="muted">新挑战会替换当前未完成的进度，已获得的最佳成绩会保留。</p>',`${button('dialog-close','保留当前进度','ghost')}${button('confirm-start','开始新挑战')}`);return;}
    if(modal.open)modal.close();
    campaign=E.createRun(mode,Date.now(),questions);session=campaign;persist();navigate('game');
  }
  function practice(indices) {
    pauseActive();
    session=E.createRun('untimed',Date.now(),questions,{indices,practice:true});navigate('game');
  }
  function finishGame() {
    if(!session.practice){
      const summary=E.summarize(session,questions);
      if(!records[session.mode]||summary.score>records[session.mode].score)records[session.mode]={score:summary.score,correct:summary.correct,elapsedMs:summary.elapsedMs};
      records.last=JSON.stringify(session);lastCompleted=session;campaign=null;
      write(keys.records,JSON.stringify(records));persist();
    }
    navigate('result');
  }
  function keepFocus(selector) {
    render();
    const node=app.querySelector(selector);
    if(node&&!node.disabled){
      if(!node.matches('button, a, input, select, textarea'))node.tabIndex=-1;
      node.focus({preventScroll:true});
    }
  }
  document.addEventListener('click',event=>{
    const control=event.target.closest('button');if(!control||control.disabled)return;
    if(control.dataset.mode){mode=control.dataset.mode;write(keys.settings,JSON.stringify({mode}));keepFocus(`[data-mode="${mode}"]`);return;}
    if(control.dataset.answer!==undefined&&session){E.tick(session,Date.now(),questions);E.selectAnswer(session,Number(control.dataset.answer),questions);persist();keepFocus(`[data-answer="${control.dataset.answer}"]`);return;}
    if(control.dataset.practice!==undefined){practice([Number(control.dataset.practice)]);return;}
    if(control.dataset.level!==undefined){
      const index=Number(control.dataset.level),history=campaign||lastCompleted;
      if(history?.results.some(r=>r.questionIndex===index))practice([index]);
      else if(campaign&&campaign.order[campaign.index]===index){session=campaign;E.resume(session,Date.now());navigate('game');}
      else if(!campaign&&index===0)startGame();return;
    }
    const action=control.dataset.action;
    if(action==='dialog-close'){modal.close();return;}
    if(action==='home'){pauseActive();navigate('home');return;}
    if(action==='map'){pauseActive();navigate('map');return;}
    if(action==='help'){showHelp();return;}
    if(action==='records'){showRecords();return;}
    if(action==='start'||action==='restart'){startGame();return;}
    if(action==='confirm-start'){startGame(true);return;}
    if(action==='continue'&&campaign){session=campaign;E.resume(session,Date.now());navigate('game');return;}
    if(action==='last-result'){modal.close();session=lastCompleted;navigate('result');return;}
    if(action==='practice-mistakes'){
      const target=session?.phase==='complete'?session:lastCompleted;
      if(target)practice(target.results.filter(r=>!r.correct).map(r=>r.questionIndex));return;
    }
    if(!session||screen!=='game')return;
    if(action==='pause'){E.pause(session,Date.now(),questions);persist();keepFocus(session.phase==='feedback'?'.feedback':'[data-action="resume"]');return;}
    if(action==='resume'){E.resume(session,Date.now());persist();keepFocus('.question-title');return;}
    if(action==='observe'){E.beginMemory(session,Date.now());persist();keepFocus('.memory-status');return;}
    if(action==='hint'){E.tick(session,Date.now(),questions);E.useHint(session);persist();keepFocus(session.phase==='feedback'?'.feedback':'.hint-panel');return;}
    if(action==='submit'||action==='skip'){E.submit(session,Date.now(),questions,action==='skip'?'skip':'answer');persist();keepFocus('.feedback');return;}
    if(action==='next'){E.next(session,Date.now(),questions);if(session.phase==='complete')finishGame();else{persist();navigate('game');}}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&session&&screen==='game'){pauseActive();render();}});
  window.addEventListener('pagehide',pauseActive);
  setInterval(()=>{
    if(!session||screen!=='game'||session.paused||session.phase==='complete')return;
    const before=session.phase;E.tick(session,Date.now(),questions);
    if(session.phase!==before){persist();keepFocus(session.phase==='feedback'?'.feedback':'.memory-status');}else updateClock();
    if(Date.now()-lastSave>=700)persist();
  },100);
  render();
})();
