/* ==========================================================
   OCCUPATIONS & VERBS — Unit 2
   App Logic, Drag & Drop, Auto-scroll, PDF Generation
   ========================================================== */

/* ------------------ STATE ------------------ */
const STORAGE_KEY = "coeduca_occupations_v1";
const state = {
  student: { name: "", nie: "" },
  ex1: { found: [] },                 // array of word strings found
  ex2: { links: {} },                 // {leftKey: rightKey}
  ex3: { placements: {} },            // {tokenId: 'occupation'|'verb'}
  ex4: { blanks: {} },                // {blankId: 'word'}
  ex5: { answers: {} },               // {id: chosenValue}
  ex6: { answers: {} },               // {id: 'typedText'}
  ex7: { answers: {} },               // {id: 'typedText'}
  ex8: { answers: {} },               // {id: 'T'|'F'}
  checked: false
};

/* ------------------ DATA ------------------ */
// Ex 1: Word search
const WS_WORDS = ["SCIENTIST","ENGINEER","ATHLETE","ARTIST","MUSICIAN","DOCTOR","WRITER","TEACHER"];
const WS_SIZE = 12;

// Ex 3: Classify tokens
const CLASSIFY_ITEMS = [
  { id: "c1", text: "Philosopher", cat: "occupation" },
  { id: "c2", text: "Astronaut", cat: "occupation" },
  { id: "c3", text: "Sculptor", cat: "occupation" },
  { id: "c4", text: "Politician", cat: "occupation" },
  { id: "c5", text: "Musician", cat: "occupation" },
  { id: "c6", text: "invented", cat: "verb" },
  { id: "c7", text: "composed", cat: "verb" },
  { id: "c8", text: "sculpted", cat: "verb" },
  { id: "c9", text: "governed", cat: "verb" },
  { id: "c10", text: "explored", cat: "verb" },
];

// Ex 4: Listening word bank (correct answers: played, drove, sang, painted, healed)
const LISTENING_BANK = ["played", "drove", "sang", "painted", "healed"];

// Ex 5: Dropdown conjugation
const DROP_SENTENCES = [
  { id:"d1", text: "Albert Einstein _ the theory of relativity.", opts:["discover","discovered","discovering"], ans:"discovered", famous:"Einstein" },
  { id:"d2", text: "Frida Kahlo _ many self-portraits during her life.", opts:["paint","painted","paints"], ans:"painted", famous:"Frida Kahlo" },
  { id:"d3", text: "William Shakespeare _ Romeo and Juliet.", opts:["wrote","writes","written"], ans:"wrote", famous:"Shakespeare" },
  { id:"d4", text: "Alexander Graham Bell _ the telephone in 1876.", opts:["invent","invents","invented"], ans:"invented", famous:"Bell" },
  { id:"d5", text: "Michael Jordan _ basketball for the Chicago Bulls.", opts:["play","played","playing"], ans:"played", famous:"Jordan" },
  { id:"d6", text: "Marie Curie _ radium with her husband Pierre.", opts:["discovered","discover","discovers"], ans:"discovered", famous:"Marie Curie" },
];

// Ex 6: Unscramble
const UNSCRAMBLE = [
  { id:"u1", scrambled: "T-S-I-N-E-I-S-C", answer: "scientist", hint: "Discovers things" },
  { id:"u2", scrambled: "G-E-R-E-N-I-E-N", answer: "engineer", hint: "Designs machines & bridges" },
  { id:"u3", scrambled: "S-A-U-N-A-T-R-O-T", answer: "astronaut", hint: "Travels to space" },
  { id:"u4", scrambled: "T-R-A-I-S-T", answer: "artist", hint: "Paints & sculpts" },
  { id:"u5", scrambled: "N-P-O-H-I-L-P-R-O-E-S-H", answer: "philosopher", hint: "Thinks about big questions" },
  { id:"u6", scrambled: "I-A-U-N-C-M-I-S", answer: "musician", hint: "Plays instruments" },
];

// Ex 7: Emoji stories (not auto-graded strictly)
const EMOJI_ROWS = [
  { id:"e1", emoji:"🧑‍🔬 🔬", hint:"scientist + discovery" },
  { id:"e2", emoji:"🎨 🖼️", hint:"painter + artwork" },
  { id:"e3", emoji:"⚽ 🏆", hint:"athlete + trophy" },
  { id:"e4", emoji:"🎤 🎶", hint:"singer + music" },
  { id:"e5", emoji:"👩‍🏫 📚", hint:"teacher + lesson" },
];

// Ex 8: True/False
const TF_ITEMS = [
  { id:"t1", text:"Frida Kahlo was a Mexican painter who painted self-portraits.", ans:"T" },
  { id:"t2", text:"Albert Einstein was a famous soccer player who played for Argentina.", ans:"F" },
  { id:"t3", text:"William Shakespeare wrote plays and poems in English.", ans:"T" },
  { id:"t4", text:"Marie Curie was an astronaut who traveled to the moon.", ans:"F" },
  { id:"t5", text:"Alexander Graham Bell invented the telephone.", ans:"T" },
  { id:"t6", text:"Michael Jordan was a scientist who discovered gravity.", ans:"F" },
];

/* ------------------ LOCAL STORAGE ------------------ */
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
  } catch(e){}
}

/* ------------------ TOAST ------------------ */
function toast(msg, type="") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ------------------ DATE ------------------ */
(function initDate(){
  const d = new Date();
  const fmt = d.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const el = document.getElementById("todayDate");
  if (el) el.textContent = fmt;
})();

/* ==========================================================
   AUTO-SCROLL during drag (mobile + desktop)
   ========================================================== */
let autoScrollRAF = null;
function autoScrollTick() {
  if (!dragContext.active) { autoScrollRAF = null; return; }
  const y = dragContext.lastY;
  const h = window.innerHeight;
  const zone = 70;
  let dy = 0;
  if (y < zone) dy = -Math.max(6, (zone - y) / 4);
  else if (y > h - zone) dy = Math.max(6, (y - (h - zone)) / 4);
  if (dy !== 0) window.scrollBy(0, dy);
  autoScrollRAF = requestAnimationFrame(autoScrollTick);
}
function startAutoScroll() {
  if (autoScrollRAF) return;
  autoScrollRAF = requestAnimationFrame(autoScrollTick);
}
function stopAutoScroll() {
  if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
  autoScrollRAF = null;
}

/* ==========================================================
   UNIFIED DRAG SYSTEM (works for mouse + touch)
   used by: Ex 3 (classify), Ex 4 (listening blanks)
   ========================================================== */
const dragContext = {
  active: false,
  token: null,
  ghost: null,
  lastX: 0,
  lastY: 0,
  origin: null,
  onDrop: null,
  dropTargets: []
};

function makeDraggable(el, opts) {
  // opts: { getId, getSource, dropTargets: () => NodeList, onDrop(dropEl, id, sourceEl), onClone }
  el.addEventListener("mousedown", (e) => startDrag(e, el, opts, false));
  el.addEventListener("touchstart", (e) => startDrag(e, el, opts, true), { passive:false });
}

function startDrag(e, el, opts, isTouch) {
  if (isTouch) e.preventDefault();
  const point = getPoint(e);
  dragContext.active = true;
  dragContext.token = el;
  dragContext.opts = opts;
  dragContext.lastX = point.x;
  dragContext.lastY = point.y;
  dragContext.dropTargets = Array.from(opts.dropTargets());

  // ghost clone
  const rect = el.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.classList.add("ghost");
  ghost.style.width = rect.width + "px";
  ghost.style.height = rect.height + "px";
  ghost.style.left = (point.x - rect.width/2) + "px";
  ghost.style.top = (point.y - rect.height/2) + "px";
  document.body.appendChild(ghost);
  dragContext.ghost = ghost;
  el.classList.add("dragging");

  startAutoScroll();

  const moveHandler = (ev) => moveDrag(ev, isTouch);
  const endHandler = (ev) => endDrag(ev, isTouch, moveHandler, endHandler);

  if (isTouch) {
    document.addEventListener("touchmove", moveHandler, { passive:false });
    document.addEventListener("touchend", endHandler);
    document.addEventListener("touchcancel", endHandler);
  } else {
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", endHandler);
  }
}

function moveDrag(e, isTouch) {
  if (isTouch) e.preventDefault();
  const p = getPoint(e);
  dragContext.lastX = p.x;
  dragContext.lastY = p.y;
  const g = dragContext.ghost;
  if (g) {
    const rect = g.getBoundingClientRect();
    g.style.left = (p.x - rect.width/2) + "px";
    g.style.top = (p.y - rect.height/2) + "px";
  }
  // highlight drop target
  dragContext.dropTargets.forEach(t => t.classList.remove("drag-over"));
  const underEl = document.elementFromPoint(p.x, p.y);
  const target = underEl ? dragContext.dropTargets.find(t => t === underEl || t.contains(underEl)) : null;
  if (target) target.classList.add("drag-over");
}

function endDrag(e, isTouch, moveHandler, endHandler) {
  stopAutoScroll();
  const p = { x: dragContext.lastX, y: dragContext.lastY };
  const underEl = document.elementFromPoint(p.x, p.y);
  const target = underEl ? dragContext.dropTargets.find(t => t === underEl || t.contains(underEl)) : null;
  dragContext.dropTargets.forEach(t => t.classList.remove("drag-over"));

  if (target && dragContext.opts.onDrop) {
    dragContext.opts.onDrop(target, dragContext.token);
  }

  if (dragContext.ghost) dragContext.ghost.remove();
  if (dragContext.token) dragContext.token.classList.remove("dragging");
  dragContext.active = false;
  dragContext.token = null;
  dragContext.ghost = null;

  if (isTouch) {
    document.removeEventListener("touchmove", moveHandler);
    document.removeEventListener("touchend", endHandler);
    document.removeEventListener("touchcancel", endHandler);
  } else {
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", endHandler);
  }
}

function getPoint(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

/* ==========================================================
   EXERCISE 1 — WORD SEARCH
   ========================================================== */
let wsGrid = [];          // 2D array of letters
let wsPlacements = [];    // { word, cells: [[r,c],...] }
let wsStartCell = null;

function buildWordSearch() {
  // Place words in grid; fill rest with random letters
  const size = WS_SIZE;
  wsGrid = Array.from({length:size}, () => Array(size).fill(""));
  wsPlacements = [];
  const dirs = [
    [0,1],[1,0],[1,1],[-1,1]
  ];
  for (const w of WS_WORDS) {
    let placed = false;
    for (let attempt=0; attempt<200 && !placed; attempt++) {
      const dir = dirs[Math.floor(Math.random()*dirs.length)];
      const len = w.length;
      const maxR = dir[0] > 0 ? size-len : (dir[0] < 0 ? len-1 : size-1);
      const minR = dir[0] < 0 ? len-1 : 0;
      const maxC = dir[1] > 0 ? size-len : size-1;
      const r0 = minR + Math.floor(Math.random()*(maxR-minR+1));
      const c0 = Math.floor(Math.random()*(maxC+1));
      // check fit
      let ok = true;
      const cells = [];
      for (let i=0;i<len;i++){
        const r = r0 + dir[0]*i, c = c0 + dir[1]*i;
        if (r<0||r>=size||c<0||c>=size){ ok=false; break; }
        if (wsGrid[r][c] !== "" && wsGrid[r][c] !== w[i]) { ok=false; break; }
        cells.push([r,c]);
      }
      if (!ok) continue;
      cells.forEach(([r,c],i) => wsGrid[r][c] = w[i]);
      wsPlacements.push({ word: w, cells });
      placed = true;
    }
  }
  // fill blanks
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      if (!wsGrid[r][c]) wsGrid[r][c] = A[Math.floor(Math.random()*A.length)];
    }
  }
}

function renderWordSearch() {
  const gridEl = document.getElementById("wordSearchGrid");
  const listEl = document.getElementById("wordSearchList");
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${WS_SIZE}, 1fr)`;
  for (let r=0;r<WS_SIZE;r++){
    for (let c=0;c<WS_SIZE;c++){
      const d = document.createElement("div");
      d.className = "ws-cell";
      d.textContent = wsGrid[r][c];
      d.dataset.r = r;
      d.dataset.c = c;
      d.addEventListener("click", () => onWSCellClick(d));
      d.addEventListener("touchend", (e) => { e.preventDefault(); onWSCellClick(d); }, { passive:false });
      gridEl.appendChild(d);
    }
  }
  // Mark previously-found cells
  listEl.innerHTML = "";
  WS_WORDS.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;
    li.dataset.word = w;
    if (state.ex1.found.includes(w)) li.classList.add("found");
    listEl.appendChild(li);
  });
  // Re-highlight found cells
  state.ex1.found.forEach(w => {
    const p = wsPlacements.find(x => x.word === w);
    if (!p) return;
    p.cells.forEach(([r,c]) => {
      const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cell) cell.classList.add("found");
    });
  });
}

function onWSCellClick(cell) {
  if (cell.classList.contains("found")) return;
  // start or end selection
  if (!wsStartCell) {
    clearWSSelection();
    wsStartCell = cell;
    cell.classList.add("start");
  } else {
    // build line from start to this
    const r0 = +wsStartCell.dataset.r, c0 = +wsStartCell.dataset.c;
    const r1 = +cell.dataset.r, c1 = +cell.dataset.c;
    const dr = Math.sign(r1-r0), dc = Math.sign(c1-c0);
    const len = Math.max(Math.abs(r1-r0), Math.abs(c1-c0)) + 1;
    // must be straight
    const straight = (r0===r1) || (c0===c1) || (Math.abs(r1-r0)===Math.abs(c1-c0));
    if (!straight) { clearWSSelection(); wsStartCell = cell; cell.classList.add("start"); return; }
    let word = "";
    const cells = [];
    for (let i=0;i<len;i++){
      const r = r0 + dr*i, c = c0 + dc*i;
      const cc = document.querySelector(`#wordSearchGrid [data-r="${r}"][data-c="${c}"]`);
      if (!cc) break;
      word += cc.textContent;
      cells.push([r,c]);
    }
    const rev = word.split("").reverse().join("");
    let found = null;
    if (WS_WORDS.includes(word)) found = word;
    else if (WS_WORDS.includes(rev)) found = rev;
    if (found && !state.ex1.found.includes(found)) {
      state.ex1.found.push(found);
      cells.forEach(([r,c]) => {
        const cc = document.querySelector(`#wordSearchGrid [data-r="${r}"][data-c="${c}"]`);
        if (cc) { cc.classList.remove("selecting","start"); cc.classList.add("found"); }
      });
      const li = document.querySelector(`#wordSearchList li[data-word="${found}"]`);
      if (li) li.classList.add("found");
      toast(`Found: ${found}!`, "success");
      updateScore(1, state.ex1.found.length, WS_WORDS.length);
      saveState();
    } else {
      toast("Not a valid word here. Try again.", "error");
    }
    clearWSSelection();
    wsStartCell = null;
  }
}
function clearWSSelection() {
  document.querySelectorAll("#wordSearchGrid .selecting, #wordSearchGrid .start").forEach(c => {
    c.classList.remove("selecting","start");
  });
}
document.getElementById("wsReset").addEventListener("click", () => {
  clearWSSelection();
  wsStartCell = null;
});

/* ==========================================================
   EXERCISE 2 — MATCH LINES
   ========================================================== */
let matchSelectedLeft = null;

function initMatch() {
  const left = document.querySelectorAll("#matchLeft .dot");
  const right = document.querySelectorAll("#matchRight .dot");
  left.forEach(d => d.addEventListener("click", () => {
    matchSelectedLeft = d.dataset.key;
    document.querySelectorAll("#matchLeft .dot").forEach(x => x.classList.remove("active"));
    d.classList.add("active");
  }));
  right.forEach(d => d.addEventListener("click", () => {
    if (!matchSelectedLeft) { toast("Pick a left dot first.", ""); return; }
    state.ex2.links[matchSelectedLeft] = d.dataset.key;
    document.querySelectorAll("#matchLeft .dot").forEach(x => x.classList.remove("active"));
    matchSelectedLeft = null;
    drawMatchLines();
    updateMatchScore();
    saveState();
  }));
  drawMatchLines();
  window.addEventListener("resize", drawMatchLines);
}

function drawMatchLines() {
  const svg = document.getElementById("matchCanvas");
  const wrap = svg.parentElement;
  const wrect = wrap.getBoundingClientRect();
  svg.setAttribute("width", wrect.width);
  svg.setAttribute("height", wrect.height);
  svg.innerHTML = "";

  for (const [lk, rk] of Object.entries(state.ex2.links)) {
    const lDot = document.querySelector(`#matchLeft .dot[data-key="${lk}"]`);
    const rDot = document.querySelector(`#matchRight .dot[data-key="${rk}"]`);
    if (!lDot || !rDot) continue;
    const lr = lDot.getBoundingClientRect();
    const rr = rDot.getBoundingClientRect();
    const x1 = lr.left - wrect.left + lr.width/2;
    const y1 = lr.top - wrect.top + lr.height/2;
    const x2 = rr.left - wrect.left + rr.width/2;
    const y2 = rr.top - wrect.top + rr.height/2;
    const mid = (x1+x2)/2;
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d", `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    let col = "#2f6b6a";
    if (state.checked) col = (lk === rk) ? "#3d7a4d" : "#b5322b";
    path.setAttribute("stroke", col);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);

    lDot.classList.add("linked");
    rDot.classList.add("linked");
    if (state.checked) {
      lDot.classList.toggle("correct", lk === rk);
      lDot.classList.toggle("wrong", lk !== rk);
      rDot.classList.toggle("correct", lk === rk);
      rDot.classList.toggle("wrong", lk !== rk);
    }
  }
}

function updateMatchScore() {
  const total = 6;
  const correct = Object.entries(state.ex2.links).filter(([l,r]) => l===r).length;
  updateScore(2, correct, total);
}

document.getElementById("matchReset").addEventListener("click", () => {
  state.ex2.links = {};
  matchSelectedLeft = null;
  document.querySelectorAll("#matchLeft .dot, #matchRight .dot").forEach(d => {
    d.classList.remove("linked","correct","wrong","active");
  });
  drawMatchLines();
  updateMatchScore();
  saveState();
});

/* ==========================================================
   EXERCISE 3 — CLASSIFY (Drag & Drop)
   ========================================================== */
function renderClassify() {
  const bank = document.getElementById("classifyBank");
  const buckets = {
    occupation: document.querySelector('#bucket-occupation .bucket-drop'),
    verb: document.querySelector('#bucket-verb .bucket-drop'),
  };
  bank.innerHTML = "";
  buckets.occupation.innerHTML = "";
  buckets.verb.innerHTML = "";

  CLASSIFY_ITEMS.forEach(item => {
    const t = document.createElement("div");
    t.className = "token";
    t.textContent = item.text;
    t.dataset.id = item.id;
    t.dataset.cat = item.cat;

    const placed = state.ex3.placements[item.id];
    if (placed) {
      buckets[placed].appendChild(t);
      if (state.checked) {
        t.classList.add("placed");
        t.classList.toggle("correct", placed === item.cat);
        t.classList.toggle("wrong", placed !== item.cat);
      }
    } else {
      bank.appendChild(t);
    }

    makeDraggable(t, {
      dropTargets: () => document.querySelectorAll(".bucket-drop, #classifyBank"),
      onDrop: (target, tokenEl) => {
        if (target.id === "classifyBank") {
          document.getElementById("classifyBank").appendChild(tokenEl);
          delete state.ex3.placements[item.id];
        } else {
          const cat = target.dataset.cat;
          target.appendChild(tokenEl);
          state.ex3.placements[item.id] = cat;
        }
        tokenEl.classList.remove("placed","correct","wrong");
        updateClassifyScore();
        saveState();
      }
    });
  });
  updateClassifyScore();
}

function updateClassifyScore() {
  const total = CLASSIFY_ITEMS.length;
  let correct = 0;
  for (const item of CLASSIFY_ITEMS) {
    if (state.ex3.placements[item.id] === item.cat) correct++;
  }
  updateScore(3, correct, total);
}

/* ==========================================================
   EXERCISE 4 — LISTENING (Drag word to blank)
   ========================================================== */
function renderListening() {
  const bank = document.getElementById("listeningBank");
  bank.innerHTML = "";

  // Determine which words are still unplaced
  const usedWords = Object.values(state.ex4.blanks);
  LISTENING_BANK.forEach(word => {
    // If used in a blank, show inside blank; otherwise show in bank
    const usedBlank = Object.entries(state.ex4.blanks).find(([bid, w]) => w === word);
    if (usedBlank) {
      const blankEl = document.querySelector(`.blank[data-id="${usedBlank[0]}"]`);
      if (blankEl) {
        const t = buildListeningToken(word);
        blankEl.innerHTML = "";
        blankEl.appendChild(t);
        blankEl.classList.add("filled");
      }
    } else {
      const t = buildListeningToken(word);
      bank.appendChild(t);
    }
  });

  // also ensure empty blanks are shown as such
  document.querySelectorAll("#listeningSentences .blank").forEach(b => {
    const id = b.dataset.id;
    if (!state.ex4.blanks[id]) {
      b.innerHTML = "";
      b.classList.remove("filled","correct","wrong");
    }
    if (state.checked) {
      const word = state.ex4.blanks[id];
      if (word) {
        const correct = word === b.dataset.answer;
        b.classList.toggle("correct", correct);
        b.classList.toggle("wrong", !correct);
      }
    }
  });

  updateListeningScore();
}

function buildListeningToken(word) {
  const t = document.createElement("div");
  t.className = "token";
  t.textContent = word;
  t.dataset.word = word;
  makeDraggable(t, {
    dropTargets: () => document.querySelectorAll("#listeningSentences .blank, #listeningBank"),
    onDrop: (target, tokenEl) => {
      const word = tokenEl.dataset.word;
      if (target.id === "listeningBank") {
        // remove from any blank
        for (const [bid, w] of Object.entries(state.ex4.blanks)) {
          if (w === word) delete state.ex4.blanks[bid];
        }
        const b = getBlankContainingToken(tokenEl);
        if (b) { b.innerHTML = ""; b.classList.remove("filled","correct","wrong"); }
        document.getElementById("listeningBank").appendChild(tokenEl);
      } else if (target.classList.contains("blank")) {
        const bid = target.dataset.id;
        // If target has a token already, swap: send that one back
        if (target.firstChild) {
          const existing = target.firstChild;
          document.getElementById("listeningBank").appendChild(existing);
          const existingWord = existing.dataset.word;
          // remove existing mapping
          for (const [b2, w2] of Object.entries(state.ex4.blanks)) {
            if (b2 === bid) delete state.ex4.blanks[b2];
          }
        }
        // Remove this word from any other blank
        for (const [b2, w2] of Object.entries(state.ex4.blanks)) {
          if (w2 === word) delete state.ex4.blanks[b2];
        }
        target.innerHTML = "";
        target.appendChild(tokenEl);
        target.classList.add("filled");
        state.ex4.blanks[bid] = word;
      }
      updateListeningScore();
      saveState();
    }
  });
  return t;
}
function getBlankContainingToken(tokenEl) {
  let p = tokenEl.parentElement;
  while (p) {
    if (p.classList && p.classList.contains("blank")) return p;
    p = p.parentElement;
  }
  return null;
}

function updateListeningScore() {
  const total = 5;
  let correct = 0;
  document.querySelectorAll("#listeningSentences .blank").forEach(b => {
    if (state.ex4.blanks[b.dataset.id] === b.dataset.answer) correct++;
  });
  updateScore(4, correct, total);
}

/* ==========================================================
   EXERCISE 5 — DROPDOWN CONJUGATION
   ========================================================== */
function renderDropdowns() {
  const wrap = document.getElementById("dropSentences");
  wrap.innerHTML = "";
  DROP_SENTENCES.forEach(s => {
    const p = document.createElement("div");
    p.className = "drop-sentence";
    const parts = s.text.split("_");
    const sel = document.createElement("select");
    sel.className = "drop-select";
    sel.dataset.id = s.id;
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "— choose —";
    sel.appendChild(ph);
    s.opts.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o;
      if (state.ex5.answers[s.id] === o) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      state.ex5.answers[s.id] = sel.value;
      updateDropdownScore();
      saveState();
    });
    if (state.checked && state.ex5.answers[s.id]) {
      const ok = state.ex5.answers[s.id] === s.ans;
      sel.classList.toggle("correct", ok);
      sel.classList.toggle("wrong", !ok);
    }
    p.appendChild(document.createTextNode(parts[0]));
    p.appendChild(sel);
    p.appendChild(document.createTextNode(parts[1] || ""));
    wrap.appendChild(p);
  });
  updateDropdownScore();
}

function updateDropdownScore() {
  let correct = 0;
  for (const s of DROP_SENTENCES) if (state.ex5.answers[s.id] === s.ans) correct++;
  updateScore(5, correct, DROP_SENTENCES.length);
}

/* ==========================================================
   EXERCISE 6 — UNSCRAMBLE
   ========================================================== */
function renderUnscramble() {
  const wrap = document.getElementById("unscrambleGrid");
  wrap.innerHTML = "";
  UNSCRAMBLE.forEach(u => {
    const card = document.createElement("div");
    card.className = "unscramble-card";
    card.innerHTML = `
      <div class="unscramble-scram">${u.scrambled}</div>
      <div class="unscramble-hint">Hint: ${u.hint}</div>
      <input type="text" class="unscramble-input" data-id="${u.id}" placeholder="Type the word…" autocomplete="off" spellcheck="false" />
    `;
    const inp = card.querySelector("input");
    inp.value = state.ex6.answers[u.id] || "";
    inp.addEventListener("input", () => {
      state.ex6.answers[u.id] = inp.value;
      updateUnscrambleScore();
      saveState();
    });
    if (state.checked && state.ex6.answers[u.id]) {
      const ok = normalize(state.ex6.answers[u.id]) === normalize(u.answer);
      inp.classList.toggle("correct", ok);
      inp.classList.toggle("wrong", !ok);
    }
    wrap.appendChild(card);
  });
  updateUnscrambleScore();
}
function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, "").replace(/-/g, "").trim();
}
function updateUnscrambleScore() {
  let correct = 0;
  for (const u of UNSCRAMBLE) {
    if (normalize(state.ex6.answers[u.id]) === normalize(u.answer)) correct++;
  }
  updateScore(6, correct, UNSCRAMBLE.length);
}

/* ==========================================================
   EXERCISE 7 — EMOJI STORIES
   ========================================================== */
function renderEmoji() {
  const wrap = document.getElementById("emojiGrid");
  wrap.innerHTML = "";
  EMOJI_ROWS.forEach(r => {
    const row = document.createElement("div");
    row.className = "emoji-row";
    row.innerHTML = `
      <div class="emoji-visual">${r.emoji}</div>
      <input type="text" class="emoji-input" data-id="${r.id}" placeholder="Write a full past-tense sentence…" />
    `;
    const inp = row.querySelector("input");
    inp.value = state.ex7.answers[r.id] || "";
    inp.addEventListener("input", () => {
      state.ex7.answers[r.id] = inp.value;
      updateEmojiScore();
      saveState();
    });
    wrap.appendChild(row);
  });
  updateEmojiScore();
}
function updateEmojiScore() {
  const filled = EMOJI_ROWS.filter(r => (state.ex7.answers[r.id]||"").trim().split(/\s+/).length >= 4).length;
  const el = document.getElementById("score-7");
  el.textContent = `${filled} / ${EMOJI_ROWS.length} attempted`;
}

/* ==========================================================
   EXERCISE 8 — TRUE / FALSE
   ========================================================== */
function renderTF() {
  const wrap = document.getElementById("tfList");
  wrap.innerHTML = "";
  TF_ITEMS.forEach(t => {
    const row = document.createElement("div");
    row.className = "tf-item";
    row.innerHTML = `
      <div class="tf-statement">${t.text}</div>
      <div class="tf-buttons">
        <button type="button" class="tf-btn" data-val="T" data-id="${t.id}">True</button>
        <button type="button" class="tf-btn" data-val="F" data-id="${t.id}">False</button>
      </div>
    `;
    row.querySelectorAll(".tf-btn").forEach(btn => {
      const chosen = state.ex8.answers[t.id];
      if (chosen && btn.dataset.val === chosen) btn.classList.add("active");
      if (state.checked && chosen) {
        const ok = chosen === t.ans;
        if (btn.dataset.val === chosen) {
          btn.classList.remove("active");
          btn.classList.add(ok ? "correct" : "wrong");
        }
      }
      btn.addEventListener("click", () => {
        state.ex8.answers[t.id] = btn.dataset.val;
        row.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active","correct","wrong"));
        btn.classList.add("active");
        updateTFScore();
        saveState();
      });
    });
    wrap.appendChild(row);
  });
  updateTFScore();
}
function updateTFScore() {
  let correct = 0;
  for (const t of TF_ITEMS) if (state.ex8.answers[t.id] === t.ans) correct++;
  updateScore(8, correct, TF_ITEMS.length);
}

/* ==========================================================
   SCORE / PROGRESS
   ========================================================== */
function updateScore(ex, correct, total) {
  const el = document.getElementById(`score-${ex}`);
  if (el) el.textContent = `${correct} / ${total}`;
  updateProgress();
}

function computeGrade() {
  // Each auto-graded exercise weighted equally; Ex7 scored by attempts as bonus factor
  const results = [
    { title:"Word Search", correct: state.ex1.found.length, total: WS_WORDS.length },
    { title:"Match Lines", correct: Object.entries(state.ex2.links).filter(([l,r])=>l===r).length, total: 6 },
    { title:"Classify", correct: CLASSIFY_ITEMS.filter(i => state.ex3.placements[i.id]===i.cat).length, total: CLASSIFY_ITEMS.length },
    { title:"Listening", correct: Object.entries(state.ex4.blanks).filter(([b,w]) => {
        const el = document.querySelector(`.blank[data-id="${b}"]`);
        return el && el.dataset.answer === w;
      }).length, total: 5 },
    { title:"Conjugation", correct: DROP_SENTENCES.filter(s => state.ex5.answers[s.id]===s.ans).length, total: DROP_SENTENCES.length },
    { title:"Unscramble", correct: UNSCRAMBLE.filter(u => normalize(state.ex6.answers[u.id])===normalize(u.answer)).length, total: UNSCRAMBLE.length },
    { title:"Emoji Stories", correct: EMOJI_ROWS.filter(r => (state.ex7.answers[r.id]||"").trim().split(/\s+/).length >= 4).length, total: EMOJI_ROWS.length },
    { title:"True / False", correct: TF_ITEMS.filter(t => state.ex8.answers[t.id]===t.ans).length, total: TF_ITEMS.length },
  ];
  const totalPoints = results.reduce((a,r)=>a+r.total, 0);
  const gotPoints = results.reduce((a,r)=>a+r.correct, 0);
  const grade = totalPoints ? Math.round((gotPoints / totalPoints) * 100) / 10 : 0;
  return { results, grade, totalPoints, gotPoints };
}

function updateProgress() {
  const { grade, gotPoints, totalPoints } = computeGrade();
  const pct = totalPoints ? Math.round((gotPoints/totalPoints)*100) : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressText").textContent = pct;
}

function renderResults() {
  const { results, grade } = computeGrade();
  document.getElementById("bigGrade").textContent = grade.toFixed(1);
  const wrap = document.getElementById("resultsBreakdown");
  wrap.innerHTML = "";
  results.forEach(r => {
    const d = document.createElement("div");
    d.className = "breakdown-item";
    d.innerHTML = `<div class="bd-title">${r.title}</div><div class="bd-score">${r.correct} / ${r.total}</div>`;
    wrap.appendChild(d);
  });
}

/* ==========================================================
   STUDENT INFO BINDING
   ========================================================== */
function bindStudentInfo() {
  const n = document.getElementById("studentName");
  const i = document.getElementById("studentNIE");
  n.value = state.student.name || "";
  i.value = state.student.nie || "";
  n.addEventListener("input", () => { state.student.name = n.value; saveState(); });
  i.addEventListener("input", () => { state.student.nie = i.value; saveState(); });
}

/* ==========================================================
   CHECK / RESET / PDF BUTTONS
   ========================================================== */
document.getElementById("btnCheck").addEventListener("click", () => {
  state.checked = true;
  saveState();
  renderAll();
  renderResults();
  document.querySelector(".results").scrollIntoView({ behavior:"smooth", block:"start" });
  const { grade } = computeGrade();
  toast(`Your grade: ${grade.toFixed(1)} / 10`, grade >= 6 ? "success" : "error");
});

document.getElementById("btnReset").addEventListener("click", () => {
  if (!confirm("This will erase all your answers. Are you sure?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

document.getElementById("btnPDF").addEventListener("click", generatePDF);

/* ==========================================================
   PDF SANITIZER — strips HTML, normalizes unicode to ASCII-safe
   ========================================================== */
function sanitize(str) {
  if (str === undefined || str === null) return "";
  let s = String(str);
  // Remove HTML tags but keep inner text
  s = s.replace(/<[^>]*>/g, "");
  // Replace common special chars
  const map = {
    "→":"->", "←":"<-", "↑":"^", "↓":"v",
    "—":"-", "–":"-", "−":"-",
    "“":"\"", "”":"\"", "„":"\"", "‟":"\"",
    "‘":"'", "’":"'", "‚":"'", "‛":"'",
    "…":"...",
    "•":"*", "·":"-", "◦":"o",
    "©":"(c)", "®":"(r)", "™":"(tm)",
    "×":"x", "÷":"/",
    "≤":"<=", "≥":">=", "≠":"!=", "≈":"~",
    "°":"deg",
    " ":" ", " ":" ",
    "\u00A0":" ",
  };
  for (const [k,v] of Object.entries(map)) s = s.split(k).join(v);
  // Remove emojis and any char outside Latin-1 (0-255)
  let out = "";
  for (let i=0;i<s.length;i++){
    const code = s.charCodeAt(i);
    // surrogate pairs = emoji most likely
    if (code >= 0xD800 && code <= 0xDFFF) { i++; continue; }
    if (code <= 255) out += s[i];
    else {
      // try basic transliteration for some latin extended
      const ch = s[i];
      const dec = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (dec.charCodeAt(0) <= 255) out += dec;
      // otherwise skip
    }
  }
  // Collapse multiple spaces
  out = out.replace(/[ \t]+/g, " ").trim();
  return out;
}

/* ==========================================================
   PDF GENERATION
   ========================================================== */
function generatePDF() {
  if (!state.student.name || !state.student.nie) {
    toast("Please fill in your name and NIE first.", "error");
    document.getElementById("studentName").focus();
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const LINE_H = 14;

  function addPageIfNeeded(h=LINE_H) {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function text(t, opts = {}) {
    const size = opts.size || 10;
    const style = opts.style || "normal";
    const color = opts.color || [27,36,50];
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const wrapped = doc.splitTextToSize(sanitize(t), pageW - margin*2 - (opts.indent||0));
    wrapped.forEach(line => {
      addPageIfNeeded(size + 4);
      doc.text(line, margin + (opts.indent||0), y);
      y += size + 4;
    });
  }

  function hr() {
    addPageIfNeeded(10);
    doc.setDrawColor(200,191,168);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  }

  function sectionHeader(num, title) {
    addPageIfNeeded(40);
    y += 4;
    doc.setFillColor(27,36,50);
    doc.rect(margin, y - 2, pageW - margin*2, 22, "F");
    doc.setTextColor(245,239,227);
    doc.setFont("helvetica","bold");
    doc.setFontSize(11);
    doc.text(sanitize(`${num}  |  ${title}`), margin + 10, y + 13);
    y += 32;
    doc.setTextColor(27,36,50);
  }

  // HEADER
  doc.setFillColor(27,36,50);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(232,169,85);
  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.text(sanitize("COEDUCA  |  ENGLISH A1+  |  UNIT 2"), margin, 26);
  doc.setTextColor(245,239,227);
  doc.setFontSize(18);
  doc.text(sanitize("Occupations and Related Verbs"), margin, 48);
  doc.setFontSize(9);
  doc.setFont("helvetica","normal");
  doc.text(sanitize("People and Life Stories  -  Week 7  -  April 6-10, 2026"), margin, 62);

  y = 90;
  doc.setTextColor(27,36,50);

  // STUDENT INFO BLOCK
  doc.setFillColor(237,228,209);
  doc.rect(margin, y, pageW - margin*2, 74, "F");
  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.setTextColor(90,102,120);
  doc.text(sanitize("STUDENT"), margin + 10, y + 16);
  doc.text(sanitize("NIE"), margin + 230, y + 16);
  doc.text(sanitize("TEACHER"), margin + 380, y + 16);
  doc.text(sanitize("GRADE / SECTION"), margin + 10, y + 46);
  doc.text(sanitize("SCHOOL"), margin + 230, y + 46);
  doc.text(sanitize("DATE"), margin + 380, y + 46);

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.setTextColor(27,36,50);
  doc.text(sanitize(state.student.name || "-"), margin + 10, y + 30);
  doc.text(sanitize(state.student.nie || "-"), margin + 230, y + 30);
  doc.text(sanitize("Jose Eliseo Martinez"), margin + 380, y + 30);
  doc.text(sanitize("11th - A"), margin + 10, y + 60);
  doc.text(sanitize("COEDUCA"), margin + 230, y + 60);
  doc.text(sanitize(new Date().toLocaleDateString("en-US")), margin + 380, y + 60);
  y += 86;

  // GRADE SUMMARY
  const { results, grade } = computeGrade();
  doc.setFillColor(200,90,43);
  doc.rect(margin, y, pageW - margin*2, 44, "F");
  doc.setTextColor(245,239,227);
  doc.setFont("helvetica","bold");
  doc.setFontSize(10);
  doc.text(sanitize("FINAL GRADE"), margin + 14, y + 18);
  doc.setFontSize(24);
  doc.text(sanitize(`${grade.toFixed(1)} / 10`), margin + 14, y + 38);
  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  let bx = margin + 180;
  const totalCorrect = results.reduce((a,r)=>a+r.correct,0);
  const totalPts = results.reduce((a,r)=>a+r.total,0);
  doc.text(sanitize(`Total correct: ${totalCorrect} / ${totalPts}`), bx, y + 22);
  doc.text(sanitize(`Topic: Occupations and Related Verbs`), bx, y + 36);
  y += 60;
  doc.setTextColor(27,36,50);

  // Breakdown table
  doc.setFont("helvetica","bold");
  doc.setFontSize(10);
  doc.text(sanitize("SCORE BREAKDOWN"), margin, y);
  y += 12;
  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  results.forEach((r,i) => {
    addPageIfNeeded(14);
    doc.setDrawColor(217,206,181);
    doc.line(margin, y + 4, pageW - margin, y + 4);
    doc.text(sanitize(`${i+1}. ${r.title}`), margin, y);
    doc.text(sanitize(`${r.correct} / ${r.total}`), pageW - margin - 40, y, { align: "left" });
    y += 14;
  });
  y += 6;
  hr();

  // ---------- Exercise 1 ----------
  sectionHeader("01", "Word Search - Occupations Found");
  const foundStr = state.ex1.found.length ? state.ex1.found.join(", ") : "(none)";
  const missingWords = WS_WORDS.filter(w => !state.ex1.found.includes(w));
  text("Words found:", { style:"bold" });
  text(foundStr);
  if (missingWords.length) {
    text("Not found:", { style:"bold" });
    text(missingWords.join(", "));
  }
  y += 4;

  // ---------- Exercise 2 ----------
  sectionHeader("02", "Match Occupation to Past-Tense Action");
  const leftLabels = { scientist:"Scientist", writer:"Writer", painter:"Painter", inventor:"Inventor", athlete:"Athlete", teacher:"Teacher" };
  const rightLabels = { scientist:"discovered gravity", writer:"wrote novels", painter:"painted portraits", inventor:"invented the telephone", athlete:"played in the World Cup", teacher:"taught the class" };
  Object.keys(leftLabels).forEach(lk => {
    const rk = state.ex2.links[lk];
    const correct = lk === rk;
    const mark = rk ? (correct ? "[CORRECT]" : "[WRONG]") : "[NOT ANSWERED]";
    const answerText = rk ? `${leftLabels[lk]} -> ${rightLabels[rk]}` : `${leftLabels[lk]} -> ???`;
    text(`${mark}  ${answerText}`, { style: correct ? "bold" : "normal" });
  });

  // ---------- Exercise 3 ----------
  sectionHeader("03", "Classify - Occupation vs. Verb");
  CLASSIFY_ITEMS.forEach(i => {
    const placed = state.ex3.placements[i.id];
    const mark = !placed ? "[NOT ANSWERED]" : (placed === i.cat ? "[CORRECT]" : "[WRONG]");
    const placedTxt = placed ? placed : "-";
    text(`${mark}  ${i.text}  ->  placed as: ${placedTxt}  (correct: ${i.cat})`);
  });

  // ---------- Exercise 4 ----------
  sectionHeader("04", "Listening - Fill the Blanks");
  const sentences = [
    { id:"L1", text:"Cristiano Ronaldo ___ in the FIFA World Cup.", ans:"played" },
    { id:"L2", text:"The bus driver ___ to the school.", ans:"drove" },
    { id:"L3", text:"Madonna ___ pop music in the concert.", ans:"sang" },
    { id:"L4", text:"Frida Kahlo ___ many masterpieces.", ans:"painted" },
    { id:"L5", text:"The nurse ___ my wound.", ans:"healed" },
  ];
  sentences.forEach((s,i) => {
    const picked = state.ex4.blanks[s.id] || "-";
    const ok = picked === s.ans;
    const mark = state.ex4.blanks[s.id] ? (ok ? "[CORRECT]" : "[WRONG]") : "[NOT ANSWERED]";
    text(`${mark}  ${i+1}. ${s.text.replace("___", `[${picked}]`)}  (correct: ${s.ans})`);
  });

  // ---------- Exercise 5 ----------
  sectionHeader("05", "Conjugation Dropdowns");
  DROP_SENTENCES.forEach((s,i) => {
    const picked = state.ex5.answers[s.id] || "-";
    const ok = picked === s.ans;
    const mark = state.ex5.answers[s.id] ? (ok ? "[CORRECT]" : "[WRONG]") : "[NOT ANSWERED]";
    text(`${mark}  ${i+1}. ${s.text.replace("_", `[${picked}]`)}  (correct: ${s.ans})`);
  });

  // ---------- Exercise 6 ----------
  sectionHeader("06", "Unscramble the Occupations");
  UNSCRAMBLE.forEach((u,i) => {
    const ans = state.ex6.answers[u.id] || "-";
    const ok = normalize(ans) === normalize(u.answer);
    const mark = state.ex6.answers[u.id] ? (ok ? "[CORRECT]" : "[WRONG]") : "[NOT ANSWERED]";
    text(`${mark}  ${i+1}. ${u.scrambled}  ->  ${ans}   (correct: ${u.answer})`);
  });

  // ---------- Exercise 7 ----------
  sectionHeader("07", "Emoji Stories (teacher-scored)");
  EMOJI_ROWS.forEach((r,i) => {
    const ans = state.ex7.answers[r.id] || "(no sentence written)";
    text(`${i+1}. Visual hint: ${r.hint}`, { style:"bold" });
    text(`   Student sentence: ${ans}`);
    y += 2;
  });

  // ---------- Exercise 8 ----------
  sectionHeader("08", "True or False");
  TF_ITEMS.forEach((t,i) => {
    const picked = state.ex8.answers[t.id] || "-";
    const ok = picked === t.ans;
    const mark = state.ex8.answers[t.id] ? (ok ? "[CORRECT]" : "[WRONG]") : "[NOT ANSWERED]";
    text(`${mark}  ${i+1}. ${t.text}`);
    text(`      Your answer: ${picked === "T" ? "True" : picked === "F" ? "False" : "-"}    Correct: ${t.ans === "T" ? "True" : "False"}`, { indent: 10 });
  });

  // Footer on last page
  addPageIfNeeded(40);
  y = pageH - margin - 20;
  doc.setDrawColor(200,191,168);
  doc.line(margin, y, pageW - margin, y);
  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(90,102,120);
  doc.text(sanitize(`COEDUCA 2026  |  English A1+  |  Prof. Jose Eliseo Martinez  |  Submitted ${new Date().toLocaleString("en-US")}`), margin, y);

  // Page numbers
  const pages = doc.internal.getNumberOfPages();
  for (let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(90,102,120);
    doc.text(sanitize(`Page ${i} of ${pages}`), pageW - margin, pageH - 20, { align: "right" });
  }

  const nameSafe = sanitize(state.student.name).replace(/\s+/g, "_") || "Student";
  doc.save(`Occupations_Verbs_${nameSafe}.pdf`);
  toast("PDF generated!", "success");
}

/* ==========================================================
   RENDER ALL
   ========================================================== */
function renderAll() {
  renderWordSearch();
  // match is initialized once
  drawMatchLines();
  updateMatchScore();
  renderClassify();
  renderListening();
  renderDropdowns();
  renderUnscramble();
  renderEmoji();
  renderTF();
  updateProgress();
}

/* ==========================================================
   INIT
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  bindStudentInfo();
  buildWordSearch();
  renderAll();
  initMatch();

  // Re-draw match lines on scroll (position shifts slightly on mobile)
  window.addEventListener("scroll", () => { drawMatchLines(); }, { passive: true });
});
