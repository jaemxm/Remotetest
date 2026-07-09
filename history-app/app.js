// American History — 5 Mini Games
// Vanilla JS, no build step. Loads data.json and drives all five game views.

(() => {
  const state = {
    cards: [],
    eras: [],
    ready: false,
  };

  const $ = (id) => document.getElementById(id);

  // -------- Utilities --------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sampleN = (arr, n) => shuffle(arr).slice(0, n);

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // -------- Data loading --------
  async function loadData() {
    try {
      const res = await fetch('data.json');
      const json = await res.json();
      state.cards = json.cards;
      state.eras = json.eras;
      state.ready = true;
      $('loadStatus').textContent = `Ready · ${state.cards.length} cards`;
      initAll();
    } catch (err) {
      $('loadStatus').textContent = 'Failed to load data.json';
      console.error(err);
    }
  }

  // -------- Navigation --------
  function setView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const el = $(`view-${name}`);
    if (el) el.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    if (name === 'timeline' && timeline.round === 0) timeline.newRound();
    if (name === 'era' && era.qIndex === 0) era.nextQuestion();
    if (name === 'quiz' && quiz.qIndex === 0) quiz.nextQuestion();
    if (name === 'fill' && fill.qIndex === 0) fill.nextQuestion();
    if (name === 'memory' && memory.matches === 0 && !memory.started) memory.newBoard();
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view]');
    if (t) setView(t.dataset.view);
  });

  // ============================================================
  // Game 1: Timeline Sort
  // Pick 5 random cards with usable years, shuffle, user sorts.
  // ============================================================
  const timeline = {
    round: 0,
    score: 0,
    items: [],
    solved: false,

    newRound() {
      this.solved = false;
      // Use cards with numeric years (yearSort > 0) and unique yearSort values.
      const pool = state.cards.filter((c) => c.yearSort >= 1000 && c.yearSort <= 2030);
      const seen = new Set();
      const uniq = [];
      for (const c of shuffle(pool)) {
        if (seen.has(c.yearSort)) continue;
        seen.add(c.yearSort);
        uniq.push(c);
        if (uniq.length >= 5) break;
      }
      this.items = uniq.map((c, i) => ({ card: c, id: `t${Date.now()}-${i}` }));
      // Ensure not already sorted
      if (this.items.every((it, i, arr) => i === 0 || arr[i-1].card.yearSort <= it.card.yearSort)) {
        this.items.reverse();
      }
      this.round += 1;
      $('timelineRound').textContent = this.round;
      $('timelineResult').textContent = '';
      $('timelineResult').className = 'result-panel';
      this.render();
    },

    render() {
      const board = $('timelineBoard');
      board.innerHTML = '';
      this.items.forEach((it, idx) => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.draggable = true;
        el.dataset.id = it.id;
        el.innerHTML = `
          <span class="timeline-year ${this.solved ? '' : 'hidden'}">${escapeHTML(it.card.year)}</span>
          <div>
            <div class="timeline-title">${escapeHTML(it.card.title)}</div>
            <div class="timeline-desc">${escapeHTML(it.card.description)}</div>
          </div>
          <div class="timeline-arrows">
            <button class="arrow-btn" data-dir="up" aria-label="Move up" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="arrow-btn" data-dir="down" aria-label="Move down" ${idx === this.items.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        `;
        board.appendChild(el);

        el.addEventListener('dragstart', (e) => {
          if (this.solved) return;
          el.classList.add('dragging');
          e.dataTransfer.setData('text/plain', it.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('dragover', (e) => {
          if (this.solved) return;
          e.preventDefault();
          el.classList.add('drag-over');
        });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          el.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          if (!draggedId || draggedId === it.id) return;
          const from = this.items.findIndex((x) => x.id === draggedId);
          const to = this.items.findIndex((x) => x.id === it.id);
          if (from < 0 || to < 0) return;
          const [moved] = this.items.splice(from, 1);
          this.items.splice(to, 0, moved);
          this.render();
        });

        el.querySelectorAll('.arrow-btn').forEach((b) => {
          b.addEventListener('click', () => {
            if (this.solved) return;
            const dir = b.dataset.dir === 'up' ? -1 : 1;
            const from = this.items.findIndex((x) => x.id === it.id);
            const to = from + dir;
            if (to < 0 || to >= this.items.length) return;
            [this.items[from], this.items[to]] = [this.items[to], this.items[from]];
            this.render();
          });
        });
      });
    },

    check() {
      if (this.solved) return;
      const board = $('timelineBoard');
      let correct = 0;
      const sortedYears = this.items.map((x) => x.card.yearSort).slice().sort((a, b) => a - b);
      this.items.forEach((it, i) => {
        const row = board.children[i];
        const yearEl = row.querySelector('.timeline-year');
        yearEl.classList.remove('hidden');
        if (it.card.yearSort === sortedYears[i]) {
          row.classList.add('right');
          correct += 1;
        } else {
          row.classList.add('wrong');
        }
      });
      this.solved = true;
      this.score += correct;
      $('timelineScore').textContent = this.score;
      const perfect = correct === this.items.length;
      const r = $('timelineResult');
      r.className = `result-panel ${perfect ? 'good' : 'neutral'}`;
      r.textContent = perfect
        ? `Perfect! All ${correct} in the right order.`
        : `${correct} of ${this.items.length} in the right spot. Correct order shown above.`;
    },
  };

  // ============================================================
  // Game 2: Era Match
  // Show a card, user picks which era it belongs to (all 10 eras as choices, but show 4).
  // ============================================================
  const era = {
    qIndex: 0,
    score: 0,
    total: 10,
    current: null,

    nextQuestion() {
      if (this.qIndex >= this.total) return this.reset();
      this.qIndex += 1;
      $('eraQ').textContent = this.qIndex;
      const card = pick(state.cards);
      this.current = card;

      const distractors = shuffle(state.eras.filter((e) => e !== card.era)).slice(0, 3);
      const choices = shuffle([card.era, ...distractors]);

      $('eraPrompt').innerHTML = `
        <div class="p-year">${escapeHTML(card.year)}${card.hasQuiz ? ' <span class="p-star">★</span>' : ''}</div>
        <div class="p-title">${escapeHTML(card.title)}</div>
        <div class="p-desc">${escapeHTML(card.description)}</div>
      `;
      const wrap = $('eraChoices');
      wrap.innerHTML = '';
      choices.forEach((c) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = c;
        b.addEventListener('click', () => this.answer(b, c));
        wrap.appendChild(b);
      });
      $('eraResult').textContent = '';
      $('eraResult').className = 'result-panel';
      $('eraNext').disabled = true;
    },

    answer(btn, choice) {
      const correct = choice === this.current.era;
      document.querySelectorAll('#eraChoices .choice').forEach((b) => {
        b.disabled = true;
        if (b.textContent === this.current.era) b.classList.add('correct');
        else if (b === btn) b.classList.add('incorrect');
      });
      if (correct) {
        this.score += 1;
        $('eraScore').textContent = this.score;
        $('eraResult').className = 'result-panel good';
        $('eraResult').textContent = 'Correct!';
      } else {
        $('eraResult').className = 'result-panel bad';
        $('eraResult').textContent = `Not quite — that was the ${this.current.era} era.`;
      }
      $('eraNext').disabled = false;
    },

    reset() {
      const wasFinal = this.qIndex >= this.total;
      $('eraResult').className = 'result-panel neutral';
      $('eraResult').innerHTML = wasFinal
        ? `Final score: <b>${this.score} / ${this.total}</b>. <button class="btn primary" id="eraRestart">Play again</button>`
        : '';
      const r = document.getElementById('eraRestart');
      if (r) r.addEventListener('click', () => {
        this.qIndex = 0; this.score = 0;
        $('eraScore').textContent = 0;
        this.nextQuestion();
      });
      $('eraNext').disabled = true;
    },
  };

  // ============================================================
  // Game 3: Trivia Quiz
  // Multiple choice — user picks which YEAR matches a given event
  // Draws mostly from ★ cards.
  // ============================================================
  const quiz = {
    qIndex: 0,
    score: 0,
    total: 10,
    current: null,

    nextQuestion() {
      if (this.qIndex >= this.total) return this.reset();
      this.qIndex += 1;
      $('quizQ').textContent = this.qIndex;

      // Prefer star cards with numeric years for cleaner year choices.
      const starPool = state.cards.filter((c) => c.hasQuiz && c.yearSort >= 1000);
      const card = pick(starPool.length ? starPool : state.cards.filter((c) => c.yearSort >= 1000));
      this.current = card;

      // Build 3 distractor years — plausible neighbors (±10 to ±80 years) drawn from the deck.
      const candidateYears = new Set(
        state.cards
          .filter((c) => c.yearSort >= 1000 && Math.abs(c.yearSort - card.yearSort) >= 3)
          .map((c) => c.yearSort)
      );
      const distractors = sampleN([...candidateYears], 3);
      const choices = shuffle([card.yearSort, ...distractors]);

      $('quizPrompt').innerHTML = `
        <div class="p-year">Which year? ${card.hasQuiz ? '<span class="p-star">★</span>' : ''}</div>
        <div class="p-title">${escapeHTML(card.title)}</div>
        <div class="p-desc">${escapeHTML(card.description)}</div>
      `;
      const wrap = $('quizChoices');
      wrap.innerHTML = '';
      choices.forEach((y) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = String(y);
        b.addEventListener('click', () => this.answer(b, y));
        wrap.appendChild(b);
      });
      $('quizResult').textContent = '';
      $('quizResult').className = 'result-panel';
      $('quizNext').disabled = true;
    },

    answer(btn, year) {
      const correct = year === this.current.yearSort;
      document.querySelectorAll('#quizChoices .choice').forEach((b) => {
        b.disabled = true;
        if (parseInt(b.textContent, 10) === this.current.yearSort) b.classList.add('correct');
        else if (b === btn) b.classList.add('incorrect');
      });
      if (correct) {
        this.score += 1;
        $('quizScore').textContent = this.score;
        $('quizResult').className = 'result-panel good';
        $('quizResult').textContent = `Correct — ${this.current.year}.`;
      } else {
        $('quizResult').className = 'result-panel bad';
        $('quizResult').textContent = `The right year was ${this.current.year}.`;
      }
      $('quizNext').disabled = false;
    },

    reset() {
      $('quizResult').className = 'result-panel neutral';
      $('quizResult').innerHTML = `Final score: <b>${this.score} / ${this.total}</b>. <button class="btn primary" id="quizRestart">Play again</button>`;
      const r = document.getElementById('quizRestart');
      if (r) r.addEventListener('click', () => {
        this.qIndex = 0; this.score = 0;
        $('quizScore').textContent = 0;
        this.nextQuestion();
      });
      $('quizNext').disabled = true;
    },
  };

  // ============================================================
  // Game 4: Fill the Blank
  // Curated famous quotes/nicknames drawn from the deck.
  // ============================================================
  const fillBank = [
    { year: '1765', clue: 'Colonists\' protest slogan against British taxes.', text: 'No taxation without ___.', answer: 'representation' },
    { year: '1608', clue: 'Captain John Smith\'s rule for Jamestown settlers.', text: 'He who will not work shall not ___.', answer: 'eat' },
    { year: '1779', clue: 'John Paul Jones\' defiant naval cry.', text: 'I have not yet begun to ___!', answer: 'fight' },
    { year: '1775', clue: 'Emerson\'s phrase for the opening shot at Lexington.', text: 'The shot heard \'round the ___.', answer: 'world' },
    { year: '1863', clue: 'The opening line of Lincoln\'s Gettysburg Address.', text: 'Four score and seven ___ ago…', answer: 'years' },
    { year: '1941', clue: 'FDR\'s label for the Pearl Harbor attack date.', text: 'A date which will live in ___.', answer: 'infamy' },
    { year: '1963', clue: 'The refrain of Dr. King\'s most famous speech.', text: 'I have a ___.', answer: 'dream' },
    { year: 'today', clue: 'Motto on American coins — means "Out of many, one."', text: 'E Pluribus ___.', answer: 'unum' },
    { year: '1776', clue: 'The three unalienable rights from the Declaration.', text: 'Life, Liberty and the pursuit of ___.', answer: 'happiness' },
    { year: '1836', clue: 'Rallying cry for Texan independence.', text: 'Remember the ___!', answer: 'alamo' },
    { year: '1682', clue: 'Nickname of Philadelphia.', text: 'The City of Brotherly ___.', answer: 'love' },
    { year: '1850s', clue: 'Harriet Tubman\'s freedom-fighter nickname.', text: 'They called Harriet Tubman "___" for leading her people to freedom.', answer: 'moses' },
    { year: '1861', clue: 'Confederate General Thomas Jackson\'s battle nickname.', text: 'General Thomas Jackson earned the nickname "___."', answer: 'stonewall' },
    { year: '1880s', clue: 'Edison\'s inventor nickname.', text: 'Thomas Edison was called "The Wizard of ___."', answer: 'menlo park' },
    { year: '1950s', clue: 'Elvis Presley\'s crown title.', text: 'Elvis Presley was known as the King of ___.', answer: 'rock and roll' },
    { year: '1940s', clue: 'Symbol of women in wartime factories.', text: '"___ the Riveter" symbolized women\'s war work.', answer: 'rosie' },
    { year: '1620', clue: 'Ship that carried the Pilgrims to America.', text: 'The Pilgrims sailed to America on the ___.', answer: 'mayflower' },
    { year: '1954', clue: 'Supreme Court ruling that desegregated schools.', text: '___ v. Board of Education (1954).', answer: 'brown' },
    { year: '1969', clue: 'Program that first landed humans on the Moon.', text: '___ 11 landed the first humans on the Moon.', answer: 'apollo' },
    { year: '1979', clue: 'Length in days of the Iran hostage crisis.', text: 'American diplomats were held captive in Iran for ___ days.', answer: '444' },
  ];

  const fill = {
    qIndex: 0,
    score: 0,
    total: 10,
    remaining: [],
    current: null,

    nextQuestion() {
      if (this.qIndex >= this.total || this.remaining.length === 0) {
        if (this.qIndex >= this.total) return this.finish();
      }
      if (this.remaining.length === 0) this.remaining = shuffle(fillBank);
      this.qIndex += 1;
      $('fillQ').textContent = this.qIndex;
      this.current = this.remaining.shift();
      const withBlank = this.current.text.replace('___', '<span class="blank-underline">&nbsp;</span>');
      $('fillPrompt').innerHTML = `
        <div class="p-year">${escapeHTML(this.current.year)}</div>
        <div class="p-title">${withBlank}</div>
        <div class="p-desc">${escapeHTML(this.current.clue)}</div>
      `;
      $('fillInput').value = '';
      $('fillInput').disabled = false;
      $('fillSubmit').disabled = false;
      $('fillReveal').disabled = false;
      $('fillNext').disabled = true;
      $('fillResult').textContent = '';
      $('fillResult').className = 'result-panel';
      setTimeout(() => $('fillInput').focus(), 30);
    },

    submit() {
      if (!this.current) return;
      const guess = ($('fillInput').value || '').trim().toLowerCase();
      if (!guess) return;
      const correct = guess === this.current.answer.toLowerCase()
        || guess.replace(/[^a-z0-9]/g, '') === this.current.answer.toLowerCase().replace(/[^a-z0-9]/g, '');
      const r = $('fillResult');
      if (correct) {
        this.score += 1;
        $('fillScore').textContent = this.score;
        r.className = 'result-panel good';
        r.innerHTML = `Correct — <b>${escapeHTML(this.current.answer)}</b>.`;
      } else {
        r.className = 'result-panel bad';
        r.innerHTML = `Not quite. Answer: <b>${escapeHTML(this.current.answer)}</b>.`;
      }
      $('fillInput').disabled = true;
      $('fillSubmit').disabled = true;
      $('fillReveal').disabled = true;
      $('fillNext').disabled = false;
    },

    reveal() {
      if (!this.current) return;
      $('fillResult').className = 'result-panel neutral';
      $('fillResult').innerHTML = `Answer: <b>${escapeHTML(this.current.answer)}</b>.`;
      $('fillInput').disabled = true;
      $('fillSubmit').disabled = true;
      $('fillReveal').disabled = true;
      $('fillNext').disabled = false;
    },

    finish() {
      $('fillResult').className = 'result-panel neutral';
      $('fillResult').innerHTML = `Final score: <b>${this.score} / ${this.total}</b>. <button class="btn primary" id="fillRestart">Play again</button>`;
      $('fillInput').disabled = true;
      $('fillSubmit').disabled = true;
      $('fillReveal').disabled = true;
      $('fillNext').disabled = true;
      const r = document.getElementById('fillRestart');
      if (r) r.addEventListener('click', () => {
        this.qIndex = 0; this.score = 0;
        this.remaining = [];
        $('fillScore').textContent = 0;
        this.nextQuestion();
      });
    },
  };

  // ============================================================
  // Game 5: Memory Match
  // 8 pairs. Each pair is (year card) + (event title card) drawn from same card.
  // Grid of 16 tiles.
  // ============================================================
  const memory = {
    matches: 0,
    moves: 0,
    started: false,
    flipped: [],
    lock: false,

    newBoard() {
      this.matches = 0;
      this.moves = 0;
      this.flipped = [];
      this.lock = false;
      this.started = true;
      $('memoryMatches').textContent = 0;
      $('memoryMoves').textContent = 0;
      $('memoryResult').textContent = '';
      $('memoryResult').className = 'result-panel';

      // Pick 8 cards with numeric distinct years for easy pairing.
      const pool = state.cards.filter((c) => c.yearSort >= 1000 && c.yearSort <= 2030);
      const seenY = new Set();
      const uniq = [];
      for (const c of shuffle(pool)) {
        if (seenY.has(c.yearSort)) continue;
        seenY.add(c.yearSort);
        uniq.push(c);
        if (uniq.length >= 8) break;
      }
      const tiles = [];
      uniq.forEach((c, i) => {
        tiles.push({ pairId: i, kind: 'year', card: c });
        tiles.push({ pairId: i, kind: 'title', card: c });
      });
      const board = $('memoryBoard');
      board.innerHTML = '';
      shuffle(tiles).forEach((t) => {
        const card = document.createElement('div');
        card.className = 'mem-card';
        card.dataset.pair = t.pairId;
        card.dataset.kind = t.kind;
        card.innerHTML = `
          <div class="mem-inner">
            <div class="mem-face mem-front">?</div>
            <div class="mem-face mem-back">${
              t.kind === 'year'
                ? `<span class="mem-year">${escapeHTML(t.card.year)}</span>`
                : `<span>${escapeHTML(t.card.title)}</span>`
            }</div>
          </div>
        `;
        card.addEventListener('click', () => this.flip(card));
        board.appendChild(card);
      });
    },

    flip(card) {
      if (this.lock) return;
      if (card.classList.contains('matched')) return;
      if (card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      this.flipped.push(card);
      if (this.flipped.length === 2) {
        this.moves += 1;
        $('memoryMoves').textContent = this.moves;
        const [a, b] = this.flipped;
        if (a.dataset.pair === b.dataset.pair && a.dataset.kind !== b.dataset.kind) {
          a.classList.add('matched');
          b.classList.add('matched');
          this.flipped = [];
          this.matches += 1;
          $('memoryMatches').textContent = this.matches;
          if (this.matches === 8) {
            $('memoryResult').className = 'result-panel good';
            $('memoryResult').textContent = `You cleared the board in ${this.moves} moves!`;
          }
        } else {
          this.lock = true;
          setTimeout(() => {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            this.flipped = [];
            this.lock = false;
          }, 900);
        }
      }
    },
  };

  // -------- Boot / wiring --------
  function initAll() {
    // Timeline
    $('timelineCheck').addEventListener('click', () => timeline.check());
    $('timelineNext').addEventListener('click', () => timeline.newRound());

    // Era
    $('eraNext').addEventListener('click', () => era.nextQuestion());

    // Quiz
    $('quizNext').addEventListener('click', () => quiz.nextQuestion());

    // Fill
    $('fillSubmit').addEventListener('click', () => fill.submit());
    $('fillReveal').addEventListener('click', () => fill.reveal());
    $('fillNext').addEventListener('click', () => fill.nextQuestion());
    $('fillInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!$('fillSubmit').disabled) fill.submit();
        else if (!$('fillNext').disabled) fill.nextQuestion();
      }
    });

    // Memory
    $('memoryReset').addEventListener('click', () => memory.newBoard());
  }

  loadData();
})();
