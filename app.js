const state = {
  data: null,
  currentSet: null,
  currentIndex: 0,
  stats: JSON.parse(localStorage.getItem("lydskriftStats") || '{"attempts":0,"correct":0}')
};

const els = {
  setSelect: document.querySelector("#setSelect"),
  checkLength: document.querySelector("#checkLength"),
  checkStress: document.querySelector("#checkStress"),
  checkTone: document.querySelector("#checkTone"),
  showAnswer: document.querySelector("#showAnswer"),
  progressText: document.querySelector("#progressText"),
  sourceType: document.querySelector("#sourceType"),
  word: document.querySelector("#word"),
  answer: document.querySelector("#answer"),
  playWord: document.querySelector("#playWord"),
  audioStatus: document.querySelector("#audioStatus"),
  vowelKeys: document.querySelector("#vowelKeys"),
  consonantKeys: document.querySelector("#consonantKeys"),
  markerKeys: document.querySelector("#markerKeys"),
  checkAnswer: document.querySelector("#checkAnswer"),
  clearAnswer: document.querySelector("#clearAnswer"),
  nextExercise: document.querySelector("#nextExercise"),
  feedback: document.querySelector("#feedback"),
  correctCount: document.querySelector("#correctCount"),
  attemptCount: document.querySelector("#attemptCount"),
  accuracy: document.querySelector("#accuracy"),
  resetProgress: document.querySelector("#resetProgress")
};

const keyboard = {
  vowels: ["i", "y", "ʉ", "u", "e", "ø", "o", "æ", "a"],
  consonants: ["p", "b", "t", "d", "ʈ", "ɖ", "k", "g", "f", "v", "s", "ʃ", "ç", "j", "h", "m", "n", "ɳ", "ŋ", "l", "ɭ", "ɽ", "r"],
  markers: [":", "'", "1", "2", " ", "‿"]
};

async function init() {
  const response = await fetch("data/oppgaver.json");
  state.data = await response.json();

  buildKeyboard();
  buildSetSelect();

  els.setSelect.addEventListener("change", () => {
    state.currentSet = els.setSelect.value;
    state.currentIndex = 0;
    renderExercise();
  });

  els.checkAnswer.addEventListener("click", checkAnswer);
  els.clearAnswer.addEventListener("click", () => {
    els.answer.value = "";
    els.answer.focus();
  });
  els.nextExercise.addEventListener("click", nextExercise);
  els.playWord.addEventListener("click", playCurrentWord);
  els.resetProgress.addEventListener("click", resetProgress);

  els.answer.addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer();
  });

  updateStats();
  renderExercise();
}

function buildSetSelect() {
  state.data.sets.forEach(set => {
    const option = document.createElement("option");
    option.value = set.id;
    option.textContent = set.title;
    els.setSelect.appendChild(option);
  });
  state.currentSet = state.data.sets[0].id;
}

function getSet() {
  return state.data.sets.find(s => s.id === state.currentSet);
}

function getExercise() {
  return getSet().exercises[state.currentIndex];
}

function renderExercise() {
  const set = getSet();
  const ex = getExercise();

  els.progressText.textContent = `Oppgave ${state.currentIndex + 1} av ${set.exercises.length}`;
  els.sourceType.textContent = ex.type === "write-ipa" ? "Skriv lydskrift" : ex.type;
  els.word.textContent = ex.word;
  els.answer.value = "";
  els.feedback.className = "feedback hidden";
  els.feedback.innerHTML = "";

  els.answer.focus();
}

function buildKeyboard() {
  makeKeys(els.vowelKeys, keyboard.vowels);
  makeKeys(els.consonantKeys, keyboard.consonants);
  makeKeys(els.markerKeys, keyboard.markers);
}

function makeKeys(container, symbols) {
  symbols.forEach(symbol => {
    const button = document.createElement("button");
    button.className = "key";
    button.type = "button";
    button.textContent = symbol === " " ? "mellomrom" : symbol;
    button.addEventListener("click", () => insertAtCursor(symbol));
    container.appendChild(button);
  });
}

function insertAtCursor(text) {
  const input = els.answer;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;

  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}

function clean(value) {
  return value
    .normalize("NFC")
    .trim()
    .replace(/^\/|\/$/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\s+/g, "");
}

function removeLength(value) {
  return value.replace(/ː/g, ":");
}

function removeStress(value) {
  return value.replace(/'/g, "");
}

function removeTone(value) {
  return value.replace(/[12]/g, "");
}

/*
  Sjekkingen skjer i trinn:
  1. alltid grunnsegmentene
  2. eventuelt vokallengde
  3. eventuelt hovedtrykk
  4. eventuelt tonelag

  "accepted" kan inneholde flere korrekte fasiter.
*/
function compareAnswer(user, accepted) {
  let u = clean(user);
  let a = clean(accepted);

  // Hvis en komponent ikke skal vurderes, fjernes den fra begge svar.
  // Oppgavearkene bruker ":" for vokallengde, apostrof for trykk
  // og 1/2 for tonelag.
  if (!els.checkLength.checked) {
    u = removeLength(u);
    a = removeLength(a);
  }

  if (!els.checkStress.checked) {
    u = removeStress(u);
    a = removeStress(a);
  }

  if (!els.checkTone.checked) {
    u = removeTone(u);
    a = removeTone(a);
  }

  return {
    ok: u === a,
    reason: u === a ? "full" : "different"
  };
}

function checkAnswer() {
  const ex = getExercise();
  const accepted = ex.answers || [ex.answer];

  const result = accepted.some(answer => compareAnswer(els.answer.value, answer).ok);

  state.stats.attempts += 1;
  if (result) state.stats.correct += 1;
  localStorage.setItem("lydskriftStats", JSON.stringify(state.stats));
  updateStats();

  els.feedback.className = `feedback ${result ? "good" : "bad"}`;

  if (result) {
    els.feedback.innerHTML = "<strong>✓ Riktig!</strong>";
  } else {
    const answerText = accepted.join(" eller ");
    els.feedback.innerHTML = `<strong>Ikke helt.</strong><br>
      Fasit: <code>/${escapeHtml(answerText)}/</code>`;
  }

  if (!els.showAnswer.checked && !result) {
    els.feedback.innerHTML = "<strong>Ikke helt.</strong> Prøv igjen.";
  }
}

function nextExercise() {
  const set = getSet();
  state.currentIndex = (state.currentIndex + 1) % set.exercises.length;
  renderExercise();
}

function updateStats() {
  els.correctCount.textContent = state.stats.correct;
  els.attemptCount.textContent = state.stats.attempts;
  const pct = state.stats.attempts
    ? Math.round((state.stats.correct / state.stats.attempts) * 100)
    : 0;
  els.accuracy.textContent = `${pct} %`;
}

function resetProgress() {
  if (!confirm("Nullstille all lokal progresjon?")) return;
  state.stats = { attempts: 0, correct: 0 };
  localStorage.setItem("lydskriftStats", JSON.stringify(state.stats));
  updateStats();
}

function playCurrentWord() {
  const ex = getExercise();

  if (ex.audio) {
    const audio = new Audio(ex.audio);
    audio.play().catch(() => {
      els.audioStatus.textContent = "Kunne ikke spille lydfilen.";
    });
    return;
  }

  // Enkel fallback. For best kontroll over trykk/tonelag kan du legge inn
  // egne opptak i /audio og angi filnavnet i JSON.
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ex.word);
    utterance.lang = "nb-NO";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
    els.audioStatus.textContent = "Nettleserens norske stemme";
  } else {
    els.audioStatus.textContent = "Legg inn et lydopptak for denne oppgaven.";
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  }[char]));
}

init().catch(error => {
  console.error(error);
  document.querySelector(".app").innerHTML =
    "<h1>Kunne ikke laste oppgavene</h1><p>Sjekk at du kjører prosjektet fra en webserver, ikke ved å åpne index.html direkte.</p>";
});
