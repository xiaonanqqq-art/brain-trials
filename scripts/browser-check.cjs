const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const qa = path.resolve(__dirname, '../.qa');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/brain-trials/';

(async()=>{
  await fs.mkdir(qa,{recursive:true});
  const chrome = spawn(process.env.BROWSER_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking',
     '--remote-debugging-port=9223',`--user-data-dir=${path.join(qa,'chrome-profile')}`,'about:blank'],
    {windowsHide:true,stdio:'ignore'});
  let spawnError; chrome.on('error',error=>{spawnError=error;});
  let ws;
  try {
    let targets;
    for(let i=0;i<50;i++) {if(spawnError)throw spawnError; try{targets=await(await fetch('http://127.0.0.1:9223/json/list')).json();break;}catch{await sleep(100);}}
    if(!targets)throw new Error('Browser did not start');
    ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
    let serial=0;const pending=new Map();const errors=[];
    ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}}else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
    const waitFor=async expression=>{for(let i=0;i<80;i++){try{if(await evaluate(expression))return;}catch(error){if(!/context|navigation/i.test(error.message))throw error;}await sleep(100);}throw new Error(`Timed out: ${expression}`);};
    const reload=async()=>{await evaluate('window.__qaReloadMarker=true');await send('Page.reload');await waitFor('!window.__qaReloadMarker && document.readyState === "complete"');};
    const click=async selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('Missing '+${JSON.stringify(selector)});el.click();return true;})()`);
    const shot=async name=>{const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(qa,name+'.png'),Buffer.from(result.data,'base64'));};
    await send('Page.enable');await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__clockOffset=0;const originalNow=Date.now.bind(Date);Date.now=()=>originalNow()+window.__clockOffset;'});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:base});
    await waitFor('document.readyState === "complete"');
    await evaluate('localStorage.clear()');
    await reload();
    await waitFor('document.querySelector(".hero-title")');
    assert.match(await evaluate('document.querySelector(".hero-title").textContent'),/进入状态/);
    await shot('home-desktop');
    await click('[data-action="start"]');
    await waitFor('document.querySelector(".question-title")');
    await shot('game-desktop');
    assert.equal(await evaluate('document.querySelectorAll(".answer-option").length'),4);
    console.log('PASS: home renders at a repository subpath and starts a game');
    const bank = require('../questions.js').questions;
    const saved=()=>evaluate('JSON.parse(localStorage.getItem("brain-trials:run:v1"))');
    const advance=async ms=>{await evaluate(`window.__clockOffset += ${ms}`);await sleep(160);};
    const fits=()=>evaluate('document.documentElement.scrollWidth <= innerWidth');
    assert.equal(await evaluate('document.querySelector("[data-action=submit]").disabled'),true);
    await click('[data-action="hint"]');
    await click('[data-answer="1"]');await click('[data-action="submit"]');
    assert.equal(await evaluate('document.activeElement.classList.contains("feedback")'),true,'keyboard focus should move to answer feedback');
    assert.equal((await saved()).results[0].correct,true);
    assert.equal((await saved()).results[0].hinted,true);
    await shot('feedback-desktop');
    await click('[data-action="next"]');
    const wrong=(bank[1].answer+1)%4;
    await click(`[data-answer="${wrong}"]`);await click('[data-action="submit"]');
    assert.equal((await saved()).results[1].correct,false);
    await click('[data-action="next"]');await click('[data-action="skip"]');
    assert.equal((await saved()).results[2].status,'skipped');
    await click('[data-action="next"]');await click('[data-action="observe"]');
    await advance(2000);await click('[data-action="pause"]');
    assert.equal(await evaluate('document.activeElement.dataset.action'),'resume','pause should focus the continue control');
    const remaining=(await saved()).observeMs;
    assert.ok(remaining>2500 && remaining<3100);
    assert.equal(await evaluate('document.querySelector(".memory-grid")'),null);
    await reload();await waitFor('document.querySelector("[data-action=continue]")');
    await click('[data-action="continue"]');
    assert.ok((await saved()).observeMs<=remaining);
    await shot('memory-desktop');
    await advance(4000);await waitFor('document.querySelector(".memory-cell:not(:disabled)")');
    for(const cell of bank[3].cells)await click(`[data-answer="${cell}"]`);
    await click('[data-action="submit"]');assert.equal((await saved()).results[3].correct,true);
    await click('[data-action="next"]');
    console.log('PASS: correct/wrong/hint/skip and paused memory survive reload');
    for(let index=4;index<15;index++){
      const q=bank[index];
      if(index===6){
        await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
        assert.equal(await fits(),true,'mobile pattern puzzle should not overflow');
        await shot('pattern-mobile');
      }
      if(q.category==='memory'){
        await click('[data-action="observe"]');await advance(5100);
        for(const cell of q.cells)await click(`[data-answer="${cell}"]`);
      }else await click(`[data-answer="${q.answer}"]`);
      await click('[data-action="submit"]');
      assert.equal((await saved()).results[index].correct,true,`question ${index+1}`);
      await click('[data-action="next"]');
    }
    await waitFor('document.querySelector(".result-score")');
    assert.equal(await fits(),true,'mobile results should fit');
    await shot('result-mobile');
    const recordBefore=await evaluate('localStorage.getItem("brain-trials:records:v1")');
    assert.equal(JSON.parse(recordBefore).timed.correct,13);
    assert.equal(await evaluate('localStorage.getItem("brain-trials:run:v1")'),null);
    await click('[data-action="practice-mistakes"]');
    for(const idx of [1,2]){await click(`[data-answer="${bank[idx].answer}"]`);await click('[data-action="submit"]');await click('[data-action="next"]');}
    assert.equal(await evaluate('localStorage.getItem("brain-trials:records:v1")'),recordBefore);
    console.log('PASS: all 15 levels complete, records save, practice preserves campaign records');
    await click('[data-action="home"]');await shot('home-mobile');assert.equal(await fits(),true,'mobile home should fit');
    await click('[data-action="map"]');assert.equal(await fits(),true,'mobile map should fit');await shot('map-mobile');
    await click('[data-action="home"]');await click('[data-mode="untimed"]');await click('[data-action="start"]');
    await advance(60000);assert.ok(await evaluate('document.querySelector(".answer-option:not(:disabled)") !== null'));
    await click('[data-answer="1"]');await click('[data-action="submit"]');assert.equal((await saved()).results[0].points,100);
    await click('[data-action="next"]');
    // Navigating away and practicing a completed level must not replace the current run.
    await click('[data-action="home"]');await click('[data-action="map"]');
    const preserved=await saved();await click('[data-level="0"]');await click('[data-answer="1"]');
    await click('[data-action="submit"]');await click('[data-action="next"]');
    assert.equal((await saved()).index,preserved.index);
    assert.equal((await saved()).results.length,preserved.results.length);
    await click('[data-action="home"]');await click('[data-action="continue"]');
    assert.equal(await evaluate('document.querySelector(".question-title").textContent'),bank[1].title);
    await click('[data-action="home"]');await click('[data-mode="timed"]');await click('[data-action="start"]');
    await click('[data-action="confirm-start"]');await advance(45001);
    assert.equal((await saved()).results[0].status,'timeout');
    console.log('PASS: untimed play, practice during an active run, mode separation and timeout');
    const blocked=await send('Page.addScriptToEvaluateOnNewDocument',{source:'Storage.prototype.getItem=Storage.prototype.setItem=Storage.prototype.removeItem=function(){throw new DOMException("Blocked", "SecurityError");};'});
    await reload();await waitFor('document.querySelector(".storage-notice")');
    await click('[data-action="start"]');await click('[data-answer="1"]');await click('[data-action="submit"]');
    assert.match(await evaluate('document.querySelector(".feedback-heading").textContent'),/思路正确/);
    await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
    const corrupted=await send('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.setItem("brain-trials:run:v1", "{broken"); localStorage.setItem("brain-trials:records:v1", "null");'});
    await reload();await waitFor('document.querySelector(".hero-title")');
    await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:corrupted.identifier});
    assert.equal(await evaluate('document.querySelector("[data-action=continue]")'),null);
    console.log('PASS: unavailable storage and corrupted saves do not block gameplay');
    await evaluate('window.__qaReloadMarker=true');
    await send('Page.navigate',{url:'file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/')});
    await waitFor('!window.__qaReloadMarker && document.querySelector(".hero-title")');
    await click('[data-action="start"]');
    await waitFor('document.querySelector(".question-title")');
    assert.equal(await evaluate('document.querySelectorAll(".answer-option").length'),4);
    assert.deepEqual(errors,[]);
    console.log('PASS: direct file opening works; no JavaScript exceptions across all journeys');
  } finally {if(ws)ws.close();chrome.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
