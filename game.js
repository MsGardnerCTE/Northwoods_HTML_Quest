window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const screens = ['startScreen','level1Screen','level2Screen','level3Screen','transitionScreen','finalScreen'];
  const state = { score:0, attempts:0, correct:0, streak:0, bestStreak:0, currentLevel:1 };

  function show(id){ screens.forEach(s => $(s).classList.toggle('active', s === id)); window.scrollTo({top:0,behavior:'smooth'}); }
  function accuracy(){ return state.attempts ? Math.round(state.correct/state.attempts*100) : 100; }
  function addCorrect(points=100){ state.attempts++; state.correct++; state.streak++; state.bestStreak=Math.max(state.bestStreak,state.streak); state.score += points + Math.min(state.streak*10,100); }
  function addWrong(){ state.attempts++; state.streak=0; }
  function shuffled(a){ const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }
  function escapeHTML(v){ return v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // LEVEL 1: TAG DROP
  const tagPool = [
    '<h1>','</h1>','<h2>','</h2>','<h3>','</h3>','<h4>','</h4>','<h5>','</h5>','<h6>','</h6>',
    '<ol>','</ol>','<ul>','</ul>','<li>','</li>'
  ];
  let l1Timer=null, l1SpawnTimer=null, l1Seconds=45, l1Hits=0, l1Clicks=0, l1CorrectClicks=0, l1Running=false;
  const L1_GOAL=18;

  function startLevel1(){
    state.currentLevel=1; show('level1Screen');
    l1Seconds=45; l1Hits=0; l1Clicks=0; l1CorrectClicks=0; l1Running=false;
    $('tagArena').querySelectorAll('.falling-tag,.pop-text').forEach(e=>e.remove());
    updateL1HUD();
    const c=$('countdown'); let n=3; c.textContent=n;
    const cd=setInterval(()=>{ n--; if(n>0)c.textContent=n; else if(n===0)c.textContent='GO!'; else {clearInterval(cd);c.textContent='';beginL1();}},700);
  }
  function beginL1(){
    l1Running=true;
    l1SpawnTimer=setInterval(spawnTag,650);
    l1Timer=setInterval(()=>{ l1Seconds--; updateL1HUD(); if(l1Seconds<=0)finishLevel1(); },1000);
    for(let i=0;i<3;i++) setTimeout(spawnTag,i*180);
  }
  function spawnTag(){
    if(!l1Running)return;
    const arena=$('tagArena'); const el=document.createElement('button');
    const tag=tagPool[Math.floor(Math.random()*tagPool.length)];
    el.className='falling-tag'; el.textContent=tag; el.dataset.open=String(!tag.startsWith('</'));
    const maxLeft=Math.max(10,arena.clientWidth-130); el.style.left=`${Math.floor(Math.random()*maxLeft)}px`;
    const duration=3.7+Math.random()*2.2; el.style.animationDuration=`${duration}s`;
    el.addEventListener('click',()=>handleFallingTag(el));
    el.addEventListener('animationend',()=>el.remove());
    arena.appendChild(el);
  }
  function handleFallingTag(el){
    if(!l1Running || el.dataset.done)return; el.dataset.done='1'; l1Clicks++;
    if(el.dataset.open==='true'){
      l1Hits++; l1CorrectClicks++; addCorrect(90); el.classList.add('hit'); popup(el,'+ OPEN!','good');
      if(l1Hits>=L1_GOAL) setTimeout(finishLevel1,250);
    } else { addWrong(); el.classList.add('wrong'); popup(el,'✕ CLOSING TAG','bad'); }
    updateL1HUD(); setTimeout(()=>el.remove(),350);
  }
  function popup(el,text,type){
    const arena=$('tagArena'), p=document.createElement('div'); p.className=`pop-text ${type}`; p.textContent=text;
    p.style.left=el.style.left; p.style.top=`${Math.max(20,el.offsetTop)}px`; p.style.color=type==='good'?'#73f0b5':'#ff8e8e'; arena.appendChild(p); setTimeout(()=>p.remove(),750);
  }
  function updateL1HUD(){
    $('l1Score').textContent=state.score.toLocaleString(); $('l1Hits').textContent=`${l1Hits} / ${L1_GOAL}`; $('l1Time').textContent=l1Seconds;
    $('l1Accuracy').textContent=`${l1Clicks?Math.round(l1CorrectClicks/l1Clicks*100):100}%`; $('l1TimeBar').style.width=`${Math.max(0,l1Seconds/45*100)}%`;
  }
  function finishLevel1(){
    if(!l1Running)return; l1Running=false; clearInterval(l1Timer); clearInterval(l1SpawnTimer); $('tagArena').querySelectorAll('.falling-tag').forEach(e=>e.remove());
    transition(1,'Tag Drop Complete!','You can recognize opening tags while code is moving. Next, find tags inside real HTML.','NEXT LEVEL → CODE DETECTIVE');
  }

  // LEVEL 2: CODE DETECTIVE
  const detectiveChallenges = [
    {prompt:'Click the tag that creates the bulleted list.', lines:[['<h2>','Favorite Foods','</h2>'],['<ul>'],['<li>','Pizza','</li>'],['<li>','Tacos','</li>'],['</ul>']], answer:'<ul>'},
    {prompt:'Click the tag that creates the numbered list.', lines:[['<h2>','Morning Routine','</h2>'],['<ol>'],['<li>','Wake up','</li>'],['<li>','Eat breakfast','</li>'],['</ol>']], answer:'<ol>'},
    {prompt:'Click the closing tag for the heading.', lines:[['<h1>','Nighthawk News','</h1>'],['<p>','Today is a great day!','</p>']], answer:'</h1>'},
    {prompt:'Click one opening list item tag.', lines:[['<ul>'],['<li>','Soccer','</li>'],['<li>','Gaming','</li>'],['</ul>']], answer:'<li>'},
    {prompt:'Click the tag that closes the bulleted list.', lines:[['<ul>'],['<li>','Blue','</li>'],['<li>','Silver','</li>'],['</ul>']], answer:'</ul>'},
    {prompt:'Click the tag that closes the numbered list.', lines:[['<ol>'],['<li>','First','</li>'],['<li>','Second','</li>'],['</ol>']], answer:'</ol>'},
    {prompt:'Click the largest heading tag.', lines:[['<h1>','My Website','</h1>'],['<h3>','About Me','</h3>'],['<h6>','Tiny Note','</h6>']], answer:'<h1>'},
    {prompt:'Click the smallest heading tag.', lines:[['<h1>','Big Title','</h1>'],['<h4>','Section','</h4>'],['<h6>','Smallest Heading','</h6>']], answer:'<h6>'},
    {prompt:'Click the tag that means list item.', lines:[['<ol>'],['<li>','HTML','</li>'],['<li>','CSS','</li>'],['</ol>']], answer:'<li>'},
    {prompt:'Click the closing tag that matches <li>.', lines:[['<ul>'],['<li>','Northwoods','</li>'],['</ul>']], answer:'</li>'}
  ];
  let l2List=[], l2Index=0, l2Locked=false;
  function startLevel2(){ state.currentLevel=2; l2List=shuffled(detectiveChallenges); l2Index=0; l2Locked=false; show('level2Screen'); renderDetective(); }
  function renderDetective(){
    l2Locked=false; $('l2Feedback').textContent=''; $('l2Feedback').className='feedback'; const item=l2List[l2Index];
    $('detectivePrompt').textContent=item.prompt; $('l2Progress').textContent=`${l2Index+1} / ${l2List.length}`; $('l2Score').textContent=state.score.toLocaleString(); $('l2Streak').textContent=`${state.streak} 🔥`; $('l2ProgressBar').style.width=`${l2Index/l2List.length*100}%`;
    const board=$('codeBoard'); board.innerHTML='';
    item.lines.forEach((parts,lineIndex)=>{ const line=document.createElement('div'); line.className='code-line'; line.style.setProperty('--indent', parts.length===1 && (parts[0].includes('li')) ? 1 : ((lineIndex>0 && lineIndex<item.lines.length-1 && parts.some(p=>p.includes('li')))?1:0));
      parts.forEach(part=>{ if(part.startsWith('<')){ const b=document.createElement('button'); b.className='code-token'; b.textContent=part; b.addEventListener('click',()=>detectiveClick(b,part,item.answer)); line.appendChild(b); } else { const s=document.createElement('span'); s.className='code-text'; s.textContent=part; line.appendChild(s); } }); board.appendChild(line); });
  }
  function detectiveClick(btn,value,answer){
    if(l2Locked)return; l2Locked=true;
    if(value===answer){ addCorrect(140); btn.classList.add('correct'); $('l2Feedback').textContent='Correct! You found it in the code. 🔎'; $('l2Feedback').classList='feedback good'; }
    else { addWrong(); btn.classList.add('wrong'); [...$('codeBoard').querySelectorAll('.code-token')].forEach(b=>{if(b.textContent===answer)b.classList.add('correct')}); $('l2Feedback').textContent=`Not quite. Look for ${answer}.`; $('l2Feedback').classList='feedback bad'; }
    $('l2Score').textContent=state.score.toLocaleString(); $('l2Streak').textContent=`${state.streak} 🔥`;
    setTimeout(()=>{l2Index++; if(l2Index>=l2List.length)finishLevel2(); else renderDetective();},950);
  }
  function finishLevel2(){ $('l2ProgressBar').style.width='100%'; transition(2,'Code Detective Complete!','You can locate HTML tags inside real code. Next, build the code yourself.','NEXT LEVEL → LIST BUILDER'); }

  // LEVEL 3: LIST BUILDER
  const builderChallenges = [
    {prompt:'Build a numbered list with one item.', dir:'Put the opening list tag, list item, and closing list tag in the correct order.', sequence:['<ol>','<li>Pizza</li>','</ol>'], decoys:['<ul>','</ul>']},
    {prompt:'Build a bulleted list with one item.', dir:'Use the correct list container around the list item.', sequence:['<ul>','<li>Soccer</li>','</ul>'], decoys:['<ol>','</ol>']},
    {prompt:'Build a numbered list with two items.', dir:'Remember that each item belongs inside <ol> and </ol>.', sequence:['<ol>','<li>HTML</li>','<li>CSS</li>','</ol>'], decoys:['<ul>','</ul>']},
    {prompt:'Build a bulleted list with two items.', dir:'Build the complete list from beginning to end.', sequence:['<ul>','<li>Blue</li>','<li>Silver</li>','</ul>'], decoys:['<ol>','</ol>']},
    {prompt:'Repair this list: build the correct numbered structure.', dir:'Choose the correct tags to surround the two list items.', sequence:['<ol>','<li>First</li>','<li>Second</li>','</ol>'], decoys:['<ul>','</ul>','</li>']},
    {prompt:'Final Build: create a bulleted favorites list.', dir:'Complete the code with the correct opening, item, and closing tags.', sequence:['<ul>','<li>Music</li>','<li>Games</li>','<li>Sports</li>','</ul>'], decoys:['<ol>','</ol>','<h2>']}
  ];
  let l3List=[], l3Index=0, selectedTiles=[], currentTileEls=[], l3Locked=false;
  function startLevel3(){ state.currentLevel=3; l3List=[...builderChallenges]; l3Index=0; show('level3Screen'); renderBuilder(); }
  function renderBuilder(){
    l3Locked=false; selectedTiles=[]; currentTileEls=[]; $('l3Feedback').textContent=''; $('l3Feedback').className='feedback'; const item=l3List[l3Index];
    $('builderPrompt').textContent=item.prompt; $('builderDirections').textContent=item.dir; $('l3Progress').textContent=`${l3Index+1} / ${l3List.length}`; $('l3Score').textContent=state.score.toLocaleString(); $('l3Streak').textContent=`${state.streak} 🔥`; $('l3ProgressBar').style.width=`${l3Index/l3List.length*100}%`;
    const slots=$('buildSlots'); slots.innerHTML=''; item.sequence.forEach((_,i)=>{const s=document.createElement('div');s.className='build-slot';s.dataset.i=i;s.textContent=`Slot ${i+1}`;slots.appendChild(s)});
    const bank=$('tileBank'); bank.innerHTML=''; const tiles=shuffled([...item.sequence,...item.decoys]); tiles.forEach((txt,i)=>{const b=document.createElement('button');b.className='code-tile';b.textContent=txt;b.dataset.id=i;b.addEventListener('click',()=>chooseTile(b,txt));bank.appendChild(b);currentTileEls.push(b)});
  }
  function chooseTile(btn,text){
    if(l3Locked || btn.classList.contains('used'))return; const item=l3List[l3Index]; const idx=selectedTiles.length; selectedTiles.push({text,btn}); btn.classList.add('used');
    const slot=$('buildSlots').children[idx]; slot.textContent=text; slot.classList.add('filled');
    if(selectedTiles.length===item.sequence.length) checkBuild();
  }
  function checkBuild(){
    l3Locked=true; const item=l3List[l3Index]; const got=selectedTiles.map(x=>x.text); const ok=item.sequence.every((v,i)=>v===got[i]);
    if(ok){ addCorrect(220); $('l3Feedback').textContent=state.streak>=4?`Perfect build! 🔥 ${state.streak} challenge streak!`:'Perfect build! Your HTML structure is correct.'; $('l3Feedback').className='feedback good'; [...$('buildSlots').children].forEach(s=>s.style.borderColor='#5fe1a3'); setTimeout(()=>{l3Index++; if(l3Index>=l3List.length)finishQuest(); else renderBuilder();},1050); }
    else { addWrong(); $('l3Feedback').textContent='That structure is not correct yet. Reset and try the challenge again.'; $('l3Feedback').className='feedback bad'; [...$('buildSlots').children].forEach(s=>s.style.borderColor='#ec6666'); setTimeout(()=>{ l3Locked=false; resetCurrentBuild(); },1150); }
    $('l3Score').textContent=state.score.toLocaleString(); $('l3Streak').textContent=`${state.streak} 🔥`;
  }
  function resetCurrentBuild(){ selectedTiles=[]; currentTileEls.forEach(b=>b.classList.remove('used')); [...$('buildSlots').children].forEach((s,i)=>{s.textContent=`Slot ${i+1}`;s.classList.remove('filled');s.style.borderColor='';}); $('l3Feedback').textContent=''; $('l3Feedback').className='feedback'; }
  $('undoTileBtn').addEventListener('click',()=>{ if(l3Locked||!selectedTiles.length)return; const last=selectedTiles.pop(); last.btn.classList.remove('used'); const slot=$('buildSlots').children[selectedTiles.length]; slot.textContent=`Slot ${selectedTiles.length+1}`; slot.classList.remove('filled'); });
  $('resetBuildBtn').addEventListener('click',()=>{if(!l3Locked)resetCurrentBuild()});

  function transition(level,title,message,buttonText){
    state.currentLevel=level; $('transitionPill').textContent=`LEVEL ${level} COMPLETE`; $('transitionTitle').textContent=title; $('transitionMessage').textContent=message; $('transitionScore').textContent=state.score.toLocaleString(); $('transitionAccuracy').textContent=`${accuracy()}%`; $('transitionStreak').textContent=state.bestStreak; $('nextLevelBtn').textContent=buttonText; show('transitionScreen');
  }
  function finishQuest(){
    $('l3ProgressBar').style.width='100%'; const acc=accuracy(); let rank='Nighthawk HTML Rookie',msg='Good start. Replay the quest to strengthen your HTML structure skills.';
    if(acc>=95){rank='Nighthawk HTML Elite';msg='Outstanding! You recognized, located, and built HTML with elite accuracy.'}
    else if(acc>=88){rank='Nighthawk HTML Ace';msg='Excellent work! Your HTML fundamentals are very strong.'}
    else if(acc>=78){rank='Nighthawk HTML Pro';msg='Strong work! You understand headings, lists, and tag structure.'}
    else if(acc>=68){rank='Nighthawk HTML Flyer';msg='Good progress. Review the tags you missed and challenge yourself again.'}
    $('finalRank').textContent=rank; $('finalMessage').textContent=msg; $('finalScore').textContent=state.score.toLocaleString(); $('finalAccuracy').textContent=`${acc}%`; $('finalBestStreak').textContent=state.bestStreak; show('finalScreen');
  }
  function resetGame(){
    clearInterval(l1Timer); clearInterval(l1SpawnTimer); l1Running=false; state.score=0;state.attempts=0;state.correct=0;state.streak=0;state.bestStreak=0;state.currentLevel=1; show('startScreen');
  }

  $('startBtn').addEventListener('click',startLevel1);
  $('nextLevelBtn').addEventListener('click',()=>{ if(state.currentLevel===1)startLevel2(); else if(state.currentLevel===2)startLevel3(); });
  $('playAgainBtn').addEventListener('click',resetGame);
});
