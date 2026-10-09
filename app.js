const state = { data: null, phonemes: null, currentSet: null, currentIndex: 0, shuffledExercises: [], quizItem: null, quizFeature: null, quizSelected: null, quizAttempts: 0, stats: JSON.parse(localStorage.getItem('lydskriftStats') || '{"attempts":0,"correct":0}') };
const $ = s => document.querySelector(s);
const els = { setSelect:$('#setSelect'), checkLength:$('#checkLength'), checkStress:$('#checkStress'), checkTone:$('#checkTone'), showAnswer:$('#showAnswer'), progressText:$('#progressText'), sourceType:$('#sourceType'), promptLabel:$('#promptLabel'), word:$('#word'), answer:$('#answer'), inputLabel:$('#inputLabel'), leftSlash:$('#leftSlash'), rightSlash:$('#rightSlash'), playWord:$('#playWord'), audioStatus:$('#audioStatus'), vowelKeys:$('#vowelKeys'), consonantKeys:$('#consonantKeys'), markerKeys:$('#markerKeys'), keyboardArea:$('#keyboardArea'), checkAnswer:$('#checkAnswer'), clearAnswer:$('#clearAnswer'), nextExercise:$('#nextExercise'), feedback:$('#feedback'), correctCount:$('#correctCount'), attemptCount:$('#attemptCount'), accuracy:$('#accuracy'), resetProgress:$('#resetProgress'), referenceContent:$('#referenceContent'), phonemeDetail:$('#phonemeDetail'), quizSymbol:$('#quizSymbol'), quizQuestion:$('#quizQuestion'), quizOptions:$('#quizOptions'), quizFeedback:$('#quizFeedback'), quizProgress:$('#quizProgress') };
const keyboard = { vowels:['i','y','ʉ','u','e','ø','o','æ','a'], consonants:['p','b','t','d','ʈ','ɖ','k','g','f','v','s','ʃ','ç','j','h','m','n','ɳ','ŋ','l','ɭ','ɽ','r'], markers:[':', "'", '1', '2', '‿', ' '] };

async function init(){
 const response=await fetch('data/oppgaver.json'); if(!response.ok) throw new Error('Fant ikke data/oppgaver.json'); state.data=await response.json();
 const phonemeResponse=await fetch('data/phonemer.json'); if(!phonemeResponse.ok) throw new Error('Fant ikke data/phonemer.json'); state.phonemes=await phonemeResponse.json();
 buildKeyboard(); buildNavigation(); renderReference('consonants'); nextQuizQuestion();
 state.data.sets.forEach(set=>{const o=document.createElement('option');o.value=set.id;o.textContent=`${set.title} (${set.exercises.length})`;els.setSelect.append(o)});
 state.currentSet=state.data.sets[0]?.id;
 els.setSelect.addEventListener('change',()=>{state.currentSet=els.setSelect.value;startNewRound()});
 els.checkAnswer.addEventListener('click',checkAnswer);els.clearAnswer.addEventListener('click',()=>{els.answer.value='';els.answer.focus()});els.nextExercise.addEventListener('click',nextExercise);els.playWord.addEventListener('click',playCurrentWord);els.resetProgress.addEventListener('click',resetProgress);els.answer.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
 updateStats();restoreRound();
 if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function currentSet(){return state.data.sets.find(s=>s.id===state.currentSet)}
function shuffle(array){
 const copy=[...array];
 for(let i=copy.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [copy[i],copy[j]]=[copy[j],copy[i]];
 }
 return copy;
}
function roundStorageKey(setId){return `lydskriftRound:${setId}`}
function saveRound(){
 localStorage.setItem(roundStorageKey(state.currentSet),JSON.stringify({
   order:state.shuffledExercises.map(ex=>ex.id),
   index:state.currentIndex
 }));
}
function startNewRound(){
 const set=currentSet();
 if(!set || !set.exercises.length) return;
 const previous=JSON.parse(localStorage.getItem(roundStorageKey(state.currentSet)) || 'null');
 let exercises=shuffle(set.exercises);
 if(exercises.length>1 && previous?.order?.length){
   const previousFirst=previous.order[0];
   if(exercises[0].id===previousFirst){
     [exercises[0],exercises[1]]=[exercises[1],exercises[0]];
   }
 }
 state.shuffledExercises=exercises;
 state.currentIndex=0;
 saveRound();
 renderExercise();
}
function restoreRound(){
 const set=currentSet();
 if(!set || !set.exercises.length) return;
 const saved=JSON.parse(localStorage.getItem(roundStorageKey(state.currentSet)) || 'null');
 if(saved?.order?.length===set.exercises.length){
   const byId=new Map(set.exercises.map(ex=>[ex.id,ex]));
   const restored=saved.order.map(id=>byId.get(id)).filter(Boolean);
   if(restored.length===set.exercises.length && saved.index < restored.length){
     state.shuffledExercises=restored;
     state.currentIndex=Math.max(0,saved.index);
     renderExercise();
     return;
   }
 }
 startNewRound();
}
function currentExercise(){return state.shuffledExercises[state.currentIndex]}
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
function nextExercise(){
 if(!state.shuffledExercises.length) return;
 state.currentIndex++;
 if(state.currentIndex>=state.shuffledExercises.length){
   startNewRound();
   return;
 }
 saveRound();
 renderExercise();
}
function updateStats(){els.correctCount.textContent=state.stats.correct;els.attemptCount.textContent=state.stats.attempts;els.accuracy.textContent=state.stats.attempts?`${Math.round(state.stats.correct/state.stats.attempts*100)} %`:'0 %'}
function resetProgress(){if(!confirm('Nullstille all lokal progresjon?'))return;state.stats={attempts:0,correct:0};localStorage.setItem('lydskriftStats',JSON.stringify(state.stats));updateStats()}
function playCurrentWord(){const ex=currentExercise();if(ex.audio){const audio=new Audio(ex.audio);audio.play().catch(()=>els.audioStatus.textContent='Kunne ikke spille lydfilen.');return}if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(ex.prompt);u.lang='nb-NO';u.rate=.85;speechSynthesis.speak(u);els.audioStatus.textContent='Nettleserens norske stemme'}else els.audioStatus.textContent='Legg inn et lydopptak for denne oppgaven.'}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
init().catch(error=>{console.error(error);document.querySelector('.app').innerHTML='<h1>Kunne ikke laste oppgavene</h1><p>Sjekk at data/oppgaver.json finnes og at prosjektet kjøres fra en webserver.</p>'});


// App navigation: all learning modes live in the same app; the original trainer remains intact.
function buildNavigation(){
 document.querySelectorAll('[data-module]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-module]').forEach(b=>b.classList.toggle('active',b===button));
  document.querySelectorAll('.module-view').forEach(view=>view.classList.toggle('hidden',view.id!==`module-${button.dataset.module}`));
  if(button.dataset.module==='reference') renderReference(document.querySelector('[data-reference].active')?.dataset.reference||'consonants');
 }));
 document.querySelectorAll('[data-reference]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-reference]').forEach(b=>b.classList.toggle('active',b===button));
  renderReference(button.dataset.reference);
 }));
 $('#quizCheck').addEventListener('click',checkQuizAnswer);$('#quizNext').addEventListener('click',nextQuizQuestion);
}
function renderReference(kind){
 if(!state.phonemes || !els.referenceContent)return;
 const items=state.phonemes[kind]||[];
 if(kind==='consonants'){
  const manners=['Plosiv','Nasal','Frikativ','Lateral','R-lyd'];
  const places=['Bilabial','Labiodental','Alveolar','Postalveolar','Palatal','Velar','Glottal'];
  let html='<div class="table-scroll"><table class="phoneme-table"><thead><tr><th>Artikulasjonsmåte</th>'+places.map(p=>`<th>${p}</th>`).join('')+'</tr></thead><tbody>';
  manners.forEach(m=>{html+=`<tr><th>${m}</th>`+places.map(place=>{const group=items.filter(x=>x.manner===m&&x.place===place);return `<td>${group.map(x=>`<button class="phoneme-chip" data-phoneme="${x.symbol}" data-kind="consonants" aria-label="Vis beskrivelse av ${x.symbol}">${x.symbol}</button>`).join(' ')||'<span class="empty-cell">—</span>'}</td>`}).join('')+'</tr>'});
  html+='</tbody></table></div>';
  els.referenceContent.innerHTML=html;
 }else{
  els.referenceContent.innerHTML=`<div class="vowel-grid">${items.map(x=>`<button class="vowel-card" data-phoneme="${x.symbol}" data-kind="vowels"><span class="vowel-symbol">${x.symbol}</span><span>${x.place.toLowerCase()} · ${x.height.toLowerCase()}</span><small>${x.rounding}</small></button>`).join('')}</div>`;
 }
 els.referenceContent.querySelectorAll('[data-phoneme]').forEach(button=>button.addEventListener('click',()=>showPhoneme(button.dataset.kind,button.dataset.phoneme)));
 els.phonemeDetail.classList.add('hidden');
}
function showPhoneme(kind,symbol){
 const item=(state.phonemes[kind]||[]).find(x=>x.symbol===symbol);if(!item)return;
 const fields=kind==='consonants'?[['Artikulasjonsmåte',item.manner],['Artikulasjonssted',item.place],['Stemthet',item.voicing]]:[['Artikulasjonssted',item.place],['Åpningsgrad',item.height],['Runding',item.rounding]];
 els.phonemeDetail.innerHTML=`<div class="detail-top"><div class="detail-symbol">/${escapeHtml(item.symbol)}/</div><div><h3>Beskrivelse av /${escapeHtml(item.symbol)}/</h3><p>Eksempelord: <strong>${escapeHtml(item.example)}</strong></p></div></div><dl>${fields.map(([label,value])=>`<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
 els.phonemeDetail.classList.remove('hidden');
}
function nextQuizQuestion(){
 const kind=Math.random()<.72?'consonants':'vowels';const items=state.phonemes[kind];
 state.quizItem=items[Math.floor(Math.random()*items.length)];
 const features=kind==='consonants'?[['manner','Hva er artikulasjonsmåten?'],['place','Hva er artikulasjonsstedet?'],['voicing','Er lyden stemt eller ustemt?']]:[['place','Hvor artikuleres vokalen?'],['height','Hva er åpningsgraden?'],['rounding','Er vokalen rundet eller urundet?']];
 const chosen=features[Math.floor(Math.random()*features.length)];state.quizFeature=chosen[0];state.quizSelected=null;
 const property=state.quizFeature;const values=[...new Set(items.map(x=>x[property]))];
 const distractors=values.filter(v=>v!==state.quizItem[property]);const options=[state.quizItem[property]];
 while(options.length<Math.min(4,values.length)&&distractors.length){const i=Math.floor(Math.random()*distractors.length);options.push(distractors.splice(i,1)[0])}
 state.quizOptions=shuffle(options);
 els.quizSymbol.textContent=`/${state.quizItem.symbol}/`;els.quizQuestion.textContent=chosen[1];els.quizProgress.textContent=`Oppgave ${state.quizAttempts+1}`;els.quizFeedback.className='feedback hidden';els.quizFeedback.textContent='';
 els.quizOptions.innerHTML=state.quizOptions.map((v,i)=>`<button class="quiz-option" data-value="${escapeHtml(v)}"><span class="option-letter">${String.fromCharCode(65+i)}</span>${escapeHtml(v)}</button>`).join('');
 els.quizOptions.querySelectorAll('.quiz-option').forEach(button=>button.addEventListener('click',()=>{state.quizSelected=button.dataset.value;els.quizOptions.querySelectorAll('.quiz-option').forEach(b=>b.classList.toggle('selected',b===button));els.quizFeedback.className='feedback hidden'}));
}
function checkQuizAnswer(){
 if(!state.quizSelected){els.quizFeedback.className='feedback bad';els.quizFeedback.textContent='Velg et svar først.';return}
 const correct=state.quizSelected===state.quizItem[state.quizFeature];state.quizAttempts++;
 state.stats.attempts++;if(correct)state.stats.correct++;localStorage.setItem('lydskriftStats',JSON.stringify(state.stats));updateStats();
 els.quizFeedback.className=`feedback ${correct?'good':'bad'}`;
 const kind=state.phonemes.consonants.includes(state.quizItem)?'consonants':'vowels';
 const details=kind==='consonants'?`/ ${state.quizItem.symbol} / beskrives som ${state.quizItem.manner.toLowerCase()}, ${state.quizItem.place.toLowerCase()} og ${state.quizItem.voicing.toLowerCase()}.`:`/ ${state.quizItem.symbol} / er ${state.quizItem.place.toLowerCase}, ${state.quizItem.height.toLowerCase()} og ${state.quizItem.rounding.toLowerCase()}.`;
 els.quizFeedback.textContent=correct?`✓ Riktig! ${details}`:`Ikke helt. Riktig svar er «${state.quizItem[state.quizFeature]}». ${details}`;
 els.quizOptions.querySelectorAll('.quiz-option').forEach(b=>{if(b.dataset.value===state.quizItem[state.quizFeature])b.classList.add('correct-option')});
}
