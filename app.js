const state = { data: null, currentSet: null, currentIndex: 0, stats: JSON.parse(localStorage.getItem('lydskriftStats') || '{"attempts":0,"correct":0}') };
const $ = s => document.querySelector(s);
const els = { setSelect:$('#setSelect'), checkLength:$('#checkLength'), checkStress:$('#checkStress'), checkTone:$('#checkTone'), showAnswer:$('#showAnswer'), progressText:$('#progressText'), sourceType:$('#sourceType'), promptLabel:$('#promptLabel'), word:$('#word'), answer:$('#answer'), inputLabel:$('#inputLabel'), leftSlash:$('#leftSlash'), rightSlash:$('#rightSlash'), playWord:$('#playWord'), audioStatus:$('#audioStatus'), vowelKeys:$('#vowelKeys'), consonantKeys:$('#consonantKeys'), markerKeys:$('#markerKeys'), keyboardArea:$('#keyboardArea'), checkAnswer:$('#checkAnswer'), clearAnswer:$('#clearAnswer'), nextExercise:$('#nextExercise'), feedback:$('#feedback'), correctCount:$('#correctCount'), attemptCount:$('#attemptCount'), accuracy:$('#accuracy'), resetProgress:$('#resetProgress') };
const keyboard = { vowels:['i','y','ʉ','u','e','ø','o','æ','a'], consonants:['p','b','t','d','ʈ','ɖ','k','g','f','v','s','ʃ','ç','j','h','m','n','ɳ','ŋ','l','ɭ','ɽ','r'], markers:[':', "'", '1', '2', '‿', ' '] };

async function init(){
 const response=await fetch('data/oppgaver.json'); if(!response.ok) throw new Error('Fant ikke data/oppgaver.json'); state.data=await response.json();
 buildKeyboard();
 state.data.sets.forEach(set=>{const o=document.createElement('option');o.value=set.id;o.textContent=`${set.title} (${set.exercises.length})`;els.setSelect.append(o)});
 state.currentSet=state.data.sets[0]?.id;
 els.setSelect.addEventListener('change',()=>{state.currentSet=els.setSelect.value;state.currentIndex=0;renderExercise()});
 els.checkAnswer.addEventListener('click',checkAnswer);els.clearAnswer.addEventListener('click',()=>{els.answer.value='';els.answer.focus()});els.nextExercise.addEventListener('click',nextExercise);els.playWord.addEventListener('click',playCurrentWord);els.resetProgress.addEventListener('click',resetProgress);els.answer.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
 updateStats();renderExercise();
}
function currentSet(){return state.data.sets.find(s=>s.id===state.currentSet)}
function currentExercise(){return currentSet().exercises[state.currentIndex]}
function renderExercise(){
 const set=currentSet(),ex=currentExercise(); if(!ex)return;
 els.progressText.textContent=`Oppgave ${state.currentIndex+1} av ${set.exercises.length}`;els.sourceType.textContent=set.title;
 els.promptLabel.textContent=ex.wordClass?`${ex.promptLabel||'Ord'} · ${ex.wordClass}`:(ex.promptLabel||'Ord');els.word.textContent=ex.prompt;els.inputLabel.textContent=ex.inputLabel||'Skriv lydskriften';
 const isReading=ex.type==='read-ipa';const needsIPAKeyboard=ex.type==='write-ipa';
 els.leftSlash.classList.toggle('hidden',!needsIPAKeyboard);els.rightSlash.classList.toggle('hidden',!needsIPAKeyboard);
 els.answer.placeholder=isReading?'skriv ordet med vanlig rettskrivning':'skriv lydskriften her';
 els.keyboardArea.classList.toggle('hidden',!needsIPAKeyboard);els.playWord.style.display=isReading?'none':'';els.audioStatus.textContent='';
 els.answer.value='';els.feedback.className='feedback hidden';els.feedback.textContent='';els.answer.focus();
}
function buildKeyboard(){makeKeys(els.vowelKeys,keyboard.vowels);makeKeys(els.consonantKeys,keyboard.consonants);makeKeys(els.markerKeys,keyboard.markers)}
function makeKeys(container,symbols){symbols.forEach(symbol=>{const b=document.createElement('button');b.className='key';b.type='button';b.textContent=symbol===' '?'mellomrom':symbol;b.addEventListener('click',()=>insertAtCursor(symbol));container.append(b)})}
function insertAtCursor(text){const input=els.answer;const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length;input.value=input.value.slice(0,start)+text+input.value.slice(end);input.focus();input.setSelectionRange(start+text.length,start+text.length)}
function normalizeAnswer(value){return value.normalize('NFC').trim().replace(/^\/+|\/+$/g,'').replace(/[\[\]]/g,'').replace(/\s+/g,'').replace(/ː/g,':').replace(/ˈ/g,"'")}
function removeLength(v){return v.replace(/:/g,'')}
function removeStress(v){return v.replace(/'/g,'').replace(/ˈ/g,'')}
function removeTone(v){return v.replace(/[12]/g,'')}
function compare(user,expected){let u=normalizeAnswer(user),a=normalizeAnswer(expected);if(!els.checkLength.checked){u=removeLength(u);a=removeLength(a)}if(!els.checkStress.checked){u=removeStress(u);a=removeStress(a)}if(!els.checkTone.checked){u=removeTone(u);a=removeTone(a)}return u===a}
function checkAnswer(){const ex=currentExercise();if(!els.answer.value.trim()){els.feedback.className='feedback bad';els.feedback.textContent='Skriv et svar før du sjekker.';return}
 const correct=ex.answers.some(a=>compare(els.answer.value,a));state.stats.attempts++;if(correct)state.stats.correct++;localStorage.setItem('lydskriftStats',JSON.stringify(state.stats));updateStats();
 els.feedback.className=`feedback ${correct?'good':'bad'}`;
 if(correct){els.feedback.innerHTML='<strong>✓ Riktig!</strong> Du kan gå videre til neste oppgave.'}
 else if(els.showAnswer.checked){els.feedback.innerHTML=`<strong>✗ Ikke helt.</strong><br>Fasit: <code>${escapeHtml(ex.answers.join(' / '))}</code>`}
 else{els.feedback.innerHTML='<strong>✗ Ikke helt.</strong> Prøv igjen, eller gå videre når du er klar.'}
 els.feedback.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function nextExercise(){const set=currentSet();state.currentIndex=(state.currentIndex+1)%set.exercises.length;renderExercise()}
function updateStats(){els.correctCount.textContent=state.stats.correct;els.attemptCount.textContent=state.stats.attempts;els.accuracy.textContent=state.stats.attempts?`${Math.round(state.stats.correct/state.stats.attempts*100)} %`:'0 %'}
function resetProgress(){if(!confirm('Nullstille all lokal progresjon?'))return;state.stats={attempts:0,correct:0};localStorage.setItem('lydskriftStats',JSON.stringify(state.stats));updateStats()}
function playCurrentWord(){const ex=currentExercise();if(ex.audio){const audio=new Audio(ex.audio);audio.play().catch(()=>els.audioStatus.textContent='Kunne ikke spille lydfilen.');return}if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(ex.prompt);u.lang='nb-NO';u.rate=.85;speechSynthesis.speak(u);els.audioStatus.textContent='Nettleserens norske stemme'}else els.audioStatus.textContent='Legg inn et lydopptak for denne oppgaven.'}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
init().catch(error=>{console.error(error);document.querySelector('.app').innerHTML='<h1>Kunne ikke laste oppgavene</h1><p>Sjekk at data/oppgaver.json finnes og at prosjektet kjøres fra en webserver.</p>'});
