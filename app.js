(() => {
  'use strict';
  const screen = document.getElementById('screen');
  const modal = document.getElementById('modal');
  const KEY = 'hamdoku-regions-progress-v1';
  const STATE_KEY = 'hamdoku-level-state-v1';
  const UNLOCK_KEY = 'hamdoku-extra-unlocks-v1';
  const puzzles = window.HAMDOKU_LEVELS.map(p => ({...p, n: p.size}));
  const colours = ['rosa', 'azul', 'verde', 'amarilla', 'lila', 'naranja', 'turquesa', 'melocotón'];
  let completed = [];
  try { const stored = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(stored)) completed = [...new Set(stored.filter(n => Number.isInteger(n) && n >= 0 && n < puzzles.length))]; } catch (_) {}
  let states = {}, extraUnlocks = [];
  try { states = JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; } catch (_) {}
  try { const value = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '[]'); if (Array.isArray(value)) extraUnlocks = value.filter(Number.isInteger); } catch (_) {}
  let level = 0, board = [], marks = [], hintsLeft = 3, levelPage = 0, lockedTaps = {}, pendingTap = null;
  const pageSize = 30;
  function persistState() {
    states[level] = {board, marks, hintsLeft};
    try { localStorage.setItem(STATE_KEY, JSON.stringify(states)); } catch (_) {}
  }
  function solve(puzzle) {
    const {n, regions, initial} = puzzle, cols = [], used = new Set();
    function visit(row) {
      if (row === n) return [...cols];
      for (let col = 0; col < n; col++) {
        const index = row * n + col, region = regions[index];
        if (initial.some(i => Math.floor(i / n) === row && i !== index) || cols.includes(col) || used.has(region) || (row && Math.abs(cols[row - 1] - col) <= 1)) continue;
        cols.push(col); used.add(region);
        const result = visit(row + 1);
        if (result) return result;
        cols.pop(); used.delete(region);
      }
      return null;
    }
    return visit(0);
  }
  const ham = n => `<span class="ham ham-${n}" aria-hidden="true"><span class="face"></span><span class="eyes"></span><span class="cheeks"></span><span class="nose"></span></span>`;
  const back = target => `<button class="back" data-go="${target}">← Volver</button>`;
  function show(view) {
    modal.classList.add('hidden');
    document.body.classList.toggle('playing', view === 'game');
    document.body.classList.toggle('choosing', view === 'levels');
    if (view === 'home') screen.innerHTML = `<section class="home"><div class="home-copy"><div class="eyebrow">UN JUEGO PEQUEÑO PARA DESCONECTAR</div><h1>Piensa.<br>Juega.<br><span>Mejillas.</span></h1><p class="intro">Un pequeño juego de lógica, con amigos peluditos y mucha calma. ¿Te echas una partida?</p><div class="actions"><button class="btn btn-primary" data-go="levels">¡Vamos a jugar! &nbsp; ✿</button><button class="btn btn-secondary" data-go="how">Cómo jugar</button></div><div class="home-links"><span class="line"></span><button data-go="about">Sobre Hamdoku</button><span class="line"></span></div></div><div class="hero-art" aria-hidden="true"><div class="art-orbit"></div><div class="art-blob"></div><span class="art-star star-one">✦</span><span class="art-star star-two">✳</span><div class="hero-hamster">${ham(1)}</div><div class="art-tag">hecho para sonreír <span>♥</span></div></div></section>`;
    if (view === 'levels') {
      let unlocked = 0; while (unlocked < puzzles.length - 1 && completed.includes(unlocked)) unlocked++;
      const startIndex = levelPage * pageSize, page = puzzles.slice(startIndex, startIndex + pageSize);
      screen.innerHTML = `<section class="page">${back('home')}<div class="page-head"><div class="section-kicker">TU AVENTURA PELUDA</div><h1>Elige un nivel</h1><p>Un pasito y una semillita a la vez.</p></div><div class="level-pagination"><button data-page="${levelPage - 1}" ${levelPage === 0 ? 'disabled' : ''} aria-label="Página anterior">‹</button><span>NIVELES ${startIndex + 1}–${Math.min(startIndex + pageSize, puzzles.length)}</span><button data-page="${levelPage + 1}" ${startIndex + pageSize >= puzzles.length ? 'disabled' : ''} aria-label="Página siguiente">›</button></div><div class="levels">${page.map((p, offset) => { const i = startIndex + offset, done = completed.includes(i), locked = i > unlocked && !extraUnlocks.includes(i) && !completed.includes(i) && !completed.includes(i - 1); return `<button class="level ${locked ? 'locked' : ''}" data-level="${i}" aria-disabled="${locked}" aria-label="Nivel ${i+1}, ${locked ? 'bloqueado' : done ? 'completado' : 'disponible'}"><span class="level-icon">${locked ? '⌑' : done ? '★' : '✿'}</span><span class="level-number">${String(i+1).padStart(2,'0')}</span><span class="level-label">${locked ? 'Bloqueado' : done ? '¡Completado!' : `${p.n} × ${p.n} · A jugar`}</span></button>`; }).join('')}</div><div class="progress">${completed.length} de ${puzzles.length} niveles completados<div class="progress-track"><div class="progress-fill" style="width:${completed.length / puzzles.length * 100}%"></div></div></div></section>`;
    }
    if (view === 'how') screen.innerHTML = `<section class="page">${back('home')}<div class="page-head"><div class="section-kicker">MUY FÁCIL DE APRENDER</div><h1>Cómo jugar</h1><p>Unos amigos peludos y un pequeño reto.</p></div><div class="info-card"><h2>Las reglas del Hamdoku</h2><div class="rule"><span class="rule-number">1</span><p>Coloca exactamente un hámster en cada <strong>fila</strong> y en cada <strong>columna</strong>.</p></div><div class="rule"><span class="rule-number">2</span><p>Coloca exactamente un hámster en cada <strong>región de color</strong>, tenga la forma que tenga.</p></div><div class="rule"><span class="rule-number">3</span><p>Los hámsteres <strong>no pueden tocarse</strong>, tampoco en diagonal.</p></div><p>Toca una casilla para poner o quitar un hámster. Tócala dos veces para marcar o desmarcar una casilla donde no va ninguno. Cada nivel tiene tres pistas. Algunos hámsteres ya están colocados y no se pueden mover. Completa un nivel para desbloquear el siguiente; tu progreso se guarda en este navegador. ✿</p></div></section>`;
    if (view === 'about') screen.innerHTML = `<section class="page">${back('home')}<div class="page-head"><div class="section-kicker">HOLA, SOMOS HAMDOKU</div><h1>Un juego con corazón</h1><p>Y con unas mejillas bastante grandes.</p></div><div class="info-card"><h2>Un ratito para ti ✿</h2><p>Hamdoku convierte un pequeño reto de lógica en un momento de calma. Sin prisas, sin puntuaciones: solo tú y unos amigos peludos.</p><p>Prepara tu bebida favorita, ponte cómodo y disfruta de cada partida.</p></div></section>`;
    if (view === 'game') renderGame();
    window.scrollTo(0, 0);
  }
  function conflicts(index) {
    if (!board[index]) return false;
    const {n, regions} = puzzles[level], row = Math.floor(index / n), col = index % n;
    return board.some((placed, i) => {
      if (!placed || i === index) return false;
      const r = Math.floor(i / n), c = i % n;
      return r === row || c === col || regions[i] === regions[index] || (Math.abs(r-row) <= 1 && Math.abs(c-col) <= 1);
    });
  }
  function renderGame(focusIndex = -1) {
    const {n, regions, initial} = puzzles[level], count = board.filter(Boolean).length;
    const hasConflict = board.some((_, i) => conflicts(i));
    screen.innerHTML = `<section class="game"><div class="game-top">${back('levels')}<span class="section-kicker">HORA DE JUGAR ✿</span></div><div class="game-title"><div class="section-kicker">UN RETO A LA VEZ</div><h1>Nivel ${String(level + 1).padStart(2,'0')}</h1><p>Un hámster por fila, columna y color</p></div><div class="game-toolbar"><span>${count} DE ${n} HÁMSTERES</span><div class="game-controls"><button data-action="hint" ${hintsLeft === 0 ? 'disabled' : ''}>✦ Pista (${hintsLeft})</button><button data-action="reset">Reiniciar ↺</button></div></div><div class="board region-board" role="grid" aria-label="Tablero de Hamdoku" style="--size:${n}">${board.map((placed,i) => `<button class="region-cell region-${regions[i]} ${conflicts(i) ? 'conflict' : ''} ${initial.includes(i) ? 'given' : ''}" role="gridcell" data-cell="${i}" aria-label="Fila ${Math.floor(i/n)+1}, columna ${i%n+1}, región ${colours[regions[i]]}: ${placed ? 'hámster colocado' : marks[i] ? 'marcada con equis' : 'vacía'}${initial.includes(i) ? ', fijo' : ''}" aria-pressed="${placed}">${placed ? '<span class="board-hamster" aria-hidden="true">🐹</span>' : marks[i] ? '<span class="board-mark" aria-hidden="true">×</span>' : ''}</button>`).join('')}</div><p class="hint">Un toque: hámster · Doble toque: marcar con ×</p><p class="message" aria-live="polite">${hasConflict ? '¡Uy! Los hámsteres marcados no pueden estar ahí juntos.' : 'Recuerda: no pueden tocarse, ni siquiera en diagonal.'}</p></section>`;
    if (focusIndex >= 0) screen.querySelector(`[data-cell="${focusIndex}"]`).focus({preventScroll:true});
  }
  function start(i) {
    level = i; levelPage = Math.floor(i / pageSize);
    const saved = states[i], puzzle = puzzles[i];
    board = Array.isArray(saved?.board) && saved.board.length === puzzle.n ** 2 ? saved.board.map(Boolean) : Array(puzzle.n ** 2).fill(false);
    marks = Array.isArray(saved?.marks) && saved.marks.length === board.length ? saved.marks.map(Boolean) : Array(board.length).fill(false);
    puzzle.initial.forEach(index => { board[index] = true; marks[index] = false; });
    hintsLeft = Number.isInteger(saved?.hintsLeft) ? Math.max(0, Math.min(3, saved.hintsLeft)) : 3;
    show('game');
  }
  function win() {
    if (!completed.includes(level)) completed.push(level);
    try { localStorage.setItem(KEY, JSON.stringify(completed)); } catch (_) {}
    const last = level === puzzles.length - 1;
    modal.innerHTML = `<div class="modal-card"><div class="modal-icon">🌻</div><div class="section-kicker">¡LO HAS CONSEGUIDO!</div><h2>¡Qué bien!</h2><p>${last ? 'Has completado todos los niveles. ¡Tus amigos peludos están orgullosos de ti!' : 'Has completado el nivel y desbloqueado una nueva aventura.'}</p><button class="btn btn-primary" data-action="${last ? 'levels' : 'next'}">${last ? 'Ver niveles' : 'Siguiente nivel'} ✿</button><p><button class="text-button" data-go="levels">Volver a los niveles</button></p></div>`;
    modal.classList.remove('hidden'); modal.querySelector('button').focus();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.cell === undefined && pendingTap) { clearTimeout(pendingTap.timer); pendingTap = null; }
    if (button.dataset.go) return show(button.dataset.go);
    if (button.dataset.page !== undefined) { levelPage = Number(button.dataset.page); return show('levels'); }
    if (button.dataset.level !== undefined) {
      const i = Number(button.dataset.level);
      if (button.getAttribute('aria-disabled') === 'true') {
        lockedTaps[i] = (lockedTaps[i] || 0) + 1;
        if (lockedTaps[i] >= 10) { extraUnlocks.push(i); try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(extraUnlocks)); } catch (_) {} return start(i); }
        return;
      }
      return start(i);
    }
    if (button.dataset.cell !== undefined) {
      const i = Number(button.dataset.cell);
      if (puzzles[level].initial.includes(i)) return;
      if (pendingTap && pendingTap.index === i) {
        clearTimeout(pendingTap.timer); pendingTap = null;
        board[i] = false; marks[i] = !marks[i]; persistState(); renderGame(i);
      } else {
        if (pendingTap) { clearTimeout(pendingTap.timer); pendingTap.apply(); }
        const currentLevel = level;
        const apply = () => {
          pendingTap = null;
          if (level !== currentLevel || !document.body.classList.contains('playing')) return;
          board[i] = !board[i]; marks[i] = false; persistState(); renderGame(i);
          if (board.filter(Boolean).length === puzzles[level].n && board.every((_, j) => !conflicts(j))) win();
        };
        pendingTap = {index: i, apply, timer: setTimeout(apply, 300)};
      }
      return;
    }
    if (button.dataset.action === 'reset') { board.fill(false); marks.fill(false); puzzles[level].initial.forEach(i => { board[i] = true; }); persistState(); renderGame(); }
    if (button.dataset.action === 'hint' && hintsLeft > 0) {
      const puzzle = puzzles[level], solution = solve(puzzle);
      const correct = new Set(solution.map((col, row) => row * puzzle.n + col));
      const wrong = board.findIndex((placed, i) => placed && !correct.has(i));
      if (wrong !== -1) board[wrong] = false;
      else { const missing = [...correct].find(i => !board[i]); if (missing === undefined) return; board[missing] = true; marks[missing] = false; }
      hintsLeft--; persistState(); renderGame();
      if (board.filter(Boolean).length === puzzle.n && board.every((_, j) => !conflicts(j))) win();
    }
    if (button.dataset.action === 'next') start(level + 1);
    if (button.dataset.action === 'levels') show('levels');
  });
  show('home');
})();
