/* ============================================================
   ops/board — single-file app (vanilla)
   estado + persistência localStorage + render + CRUD + DnD
   ============================================================ */

'use strict';

const STORE_KEY = 'opsboard.v1';
const THEME_KEY = 'opsboard.theme';

const STATUS = {
  todo:    { label: 'a fazer',      cls: 'status-todo' },
  doing:   { label: 'em andamento', cls: 'status-doing' },
  waiting: { label: 'aguardando',   cls: 'status-waiting' },
  done:    { label: 'concluída',    cls: 'status-done' },
};
const STATUS_ORDER = ['todo', 'doing', 'waiting', 'done'];
const PRIO_KEYS = { 1: 'P1', 2: 'P2', 3: 'P3' };

/* ---------------- utils ---------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function linkify(s) {
  return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}



function fmtDate(iso) {
  const [y, m, d] = (iso || '').split('-');
  return y ? `${d}/${m}` : '';
}

const countBy = (list, fn) => list.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});

/* ---------------- estado ---------------- */

function makeTask(text, status = 'todo', note = '', blocked = false, prio = 3, due = '') {
  return { id: uid(), text, status, note, blocked, prio, due, doneAt: null };
}
function makeSection(title, tasks = [], notes = '') {
  return { id: uid(), title, tasks, notes, collapsed: false };
}
function makeProject(title, sections, blocked = false) {
  return { id: uid(), title, blocked, sections };
}

let state = null;

function ensureSchema() {
  for (const p of state.projetos) {
    p.sections = p.sections || [];
    for (const s of p.sections) {
      s.tasks = s.tasks || [];
      for (const t of s.tasks) {
        if (t.prio === undefined) t.prio = 3;
        if (t.due === undefined) t.due = '';
        if (t.doneAt === undefined) t.doneAt = null;
      }
    }
  }
}

function load() {
  let loaded = null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projetos) && parsed.projetos.length) loaded = parsed;
    }
  } catch (e) { /* vazio */ }
  return loaded || { projetos: [] };
}

state = load();
ensureSchema();
save();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage cheio */ }
  const el = $('#save-state');
  if (el) { el.textContent = 'salvo'; el.classList.add('text-fired'); setTimeout(() => el.classList.remove('text-fired'), 900); }
}

/* status: aplica mudança gravando doneAt */
function applyStatus(t, status) {
  const wasDone = t.status === 'done';
  t.status = status;
  if (status === 'done' && !wasDone) t.doneAt = new Date().toISOString();
  if (status !== 'done' && wasDone) t.doneAt = null;
}

/* seletores de navegação no grafo */
function findProject(pid) { return state.projetos.find(p => p.id === pid); }
function findSection(pid, sid) { return findProject(pid)?.sections.find(s => s.id === sid); }
function findTask(pid, sid, tid) { return findSection(pid, sid)?.tasks.find(t => t.id === tid); }

/* ---------------- ui state ---------------- */

const ui = { query: '', status: null, prioSort: false, view: 'list' };

/* ---------------- render ---------------- */

function allTasks() {
  return state.projetos.flatMap(p => p.sections.flatMap(s => s.tasks));
}

function matchTask(t) {
  if (ui.status === 'blocked' && !t.blocked) return false;
  if (ui.status && t.status !== ui.status) return false;
  if (!ui.query) return true;
  const q = ui.query.toLowerCase();
  return (t.text + ' ' + (t.note || '')).toLowerCase().includes(q);
}

const filtering = () => !!ui.query || !!ui.status;

function render() {
  renderFilters();
  renderStats();
  renderBoard();
}

function renderFilters() {
  const wrap = $('#filters');
  const counts = countBy(allTasks(), t => t.status);
  const blockedCount = allTasks().filter(t => t.blocked).length;

  const chip = (key, label, count, cls, active) =>
    `<button class="chip ${cls} ${active ? 'chip-on' : ''}" data-f="status" data-k="${key}" title="filtra: ${label}">
      ${label}<span class="opacity-60">${count}</span>
    </button>`;

  wrap.innerHTML = chip('todo', 'todo', counts.todo || 0, 'text-[#64748b]', ui.status === 'todo')
    + chip('doing', 'doing', counts.doing || 0, 'text-[#22d3ee]', ui.status === 'doing')
    + chip('waiting', 'waiting', counts.waiting || 0, 'text-[#fbbf24]', ui.status === 'waiting')
    + chip('done', 'done', counts.done || 0, 'text-[#34d399]', ui.status === 'done')
    + chip('blocked', 'bloq', blockedCount, 'text-[#f87171]', ui.status === 'blocked')
    + (filtering()
        ? `<button class="chip chip-neutral font-bold" data-f="clear" title="limpar filtros (status + busca)">✕ limpar</button>`
        : '');
}

function renderStats() {
  const total = allTasks().length;
  const done = allTasks().filter(t => t.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const active = allTasks().filter(t => t.status !== 'done').length;
  const doneToday = allTasks().filter(t => t.doneAt && t.doneAt.slice(0, 10) === todayISO()).length;
  $('#stats').innerHTML =
    `<span><span class="text-faint">total</span> <span class="text-ink font-bold">${total}</span></span>` +
    `<span><span class="text-faint">pendentes</span> <span class="text-warn">${active}</span></span>` +
    `<span><span class="text-faint">concluídas</span> <span class="text-fired">${done}</span> <span class="text-faint">(${pct}%)</span></span>` +
    `<span><span class="text-faint">hoje</span> <span class="text-fired">+${doneToday}</span></span>` +
    `<button class="chip ${ui.prioSort ? 'chip-on text-warn' : 'chip-neutral'}" data-act="prio-sort" title="ordenar por prioridade (P1 no topo)">↕ prio</button>` +
    `<span class="ml-auto text-faint hidden sm:inline">${ui.view === 'kanban' ? 'kanban: arraste cartão pra coluna p/ mudar status' : 'status-dock: arraste tarefas p/ mudar status'}</span>`;
}

function projMatches(p) {
  if (!filtering()) return true;
  return p.sections.some(s =>
    s.tasks.some(matchTask) ||
    (ui.query && (s.title + ' ' + s.notes).toLowerCase().includes(ui.query.toLowerCase()))
  );
}

function renderBoard() {
  const board = $('#board');
  if (ui.view === 'kanban') return renderKanban();

  if (!state.projetos.length) {
    board.innerHTML = `<div class="empty fade-in">
      <span class="big">_</span>
      <p class="mb-3">nenhum projeto na fila.</p>
      <button class="btn btn-primary" data-action="new-project">+ criar primeiro projeto</button>
    </div>`;
    return;
  }

  const filtrado = filtering();
  const visibleProjs = state.projetos.filter(p => projMatches(p));

  if (!visibleProjs.length) {
    board.innerHTML = `<div class="empty fade-in"><span class="big">∅</span><p>nada casa com o filtro.</p></div>`;
    return;
  }

  board.innerHTML = visibleProjs.map(p => renderProject(p, filtrado)).join('');
}

function renderProject(p, filtrado) {
  const visibleSecs = p.sections.filter(s => !filtrado || s.tasks.some(matchTask) || (ui.query && (s.title + ' ' + s.notes).toLowerCase().includes(ui.query.toLowerCase())));
  const projBlocked = p.blocked;

  return `<section class="proj fade-in" data-pid="${p.id}">
    <div class="proj-header">
      <span class="hash">##</span>
      <h2>${esc(p.title)}</h2>
      ${projBlocked ? '<span class="tag tag-blocked">stuck</span>' : ''}
      <span class="ml-auto flex items-center gap-1">
        <button class="iconbtn" data-action="proj-add-sec" title="adicionar seção">+</button>
        <button class="iconbtn" data-action="proj-rename" title="renomear projeto">✎</button>
        <button class="iconbtn danger" data-action="proj-del" title="excluir projeto">×</button>
      </span>
    </div>
    ${visibleSecs.map(s => renderSection(p.id, s, filtrado)).join('')}
  </section>`;
}

function renderSection(pid, s, filtrado) {
  let visible = filtrado ? s.tasks.filter(matchTask) : s.tasks;
  if (ui.prioSort) visible = visible.slice().sort((a, b) => a.prio - b.prio);
  const open = filtrado ? true : !s.collapsed;
  const total = s.tasks.length;
  const doneCount = s.tasks.filter(t => t.status === 'done').length;

  return `<div class="sec ${open ? 'open' : ''}" data-pid="${pid}" data-sid="${s.id}">
    <div class="sec-header" data-action="sec-toggle" title="expandir/recolher (clique)">
      <span class="marker">▶</span>
      <h3>${esc(s.title)}</h3>
      <span class="count">${doneCount}/${total}</span>
      ${s.notes ? '<span class="count ml-auto hidden sm:inline">notas</span>' : ''}
      <span class="ml-auto flex items-center gap-0.5">
        <button class="iconbtn" data-action="sec-rename" title="renomear seção">✎</button>
        <button class="iconbtn danger" data-action="sec-del" title="excluir seção">×</button>
      </span>
    </div>

    <div class="sec-body">
      ${open ? (s.notes ? `<div class="sec-notes">${esc(s.notes)}</div>` : '') : ''}
      ${open ? `<div class="sec-tasks" data-dropzone="tasks">
        ${visible.map(t => renderTask(pid, s.id, t)).join('')}
      </div>` : ''}
      ${open ? `<div class="sec-add">
        <div class="flex items-center gap-2">
          <span class="prompt">&gt;</span>
          <input class="input-line flex-1" data-addinput="${s.id}" placeholder="nova tarefa…" autocomplete="off" spellcheck="false">
        </div>
      </div>` : ''}
      ${open ? `<div class="status-dock">
        ${STATUS_ORDER.map(k => `
          <div class="dock-cell" data-dock="${k}" title="arrastar p/ ${STATUS[k].label}">
            <span class="led ${STATUS[k].cls}"></span>${STATUS[k].label}
          </div>`).join('')}
      </div>` : ''}
    </div>
  </div>`;
}

function dueHtml(t) {
  if (!t.due) return '';
  const overdue = t.status !== 'done' && t.due < todayISO();
  const soon = t.status !== 'done' && !overdue && (new Date(t.due + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) <= 2 * 86400000;
  if (overdue) return `<span class="tag tag-overdue" title="vencimento ${esc(t.due)}">${fmtDate(t.due)} vencida</span>`;
  return `<span class="due-tag ${soon ? 'due-soon' : ''}" title="vencimento ${esc(t.due)}">${fmtDate(t.due)}</span>`;
}

function renderTask(pid, sid, t) {
  const s = STATUS[t.status] || STATUS.todo;
  const statusOpts = STATUS_ORDER.map(k =>
    `<option value="${k}" ${k === t.status ? 'selected' : ''}>${STATUS[k].label}</option>`).join('');
  const overdue = t.status !== 'done' && t.due && t.due < todayISO();

  return `<div class="task ${s.cls} ${t.status === 'done' ? 't-done' : ''} ${t.blocked ? 'task-blocked' : ''} ${overdue ? 'task-overdue' : ''}" draggable="true"
      data-pid="${pid}" data-sid="${sid}" data-tid="${t.id}" data-dnd-src>
    <span class="led" data-action="task-toggle" title="alternar concluída"></span>
    <span class="task-text">
      ${linkify(t.text)}
      ${t.note ? `<span class="task-note"> — ${linkify(t.note)}</span>` : ''}
    </span>
    ${t.blocked ? '<span class="tag tag-blocked">bloqueada</span>' : ''}
    <span class="prio-btn prio-${t.prio}" data-action="task-prio" title="prioridade: clique pra mudar">${PRIO_KEYS[t.prio] || 'P'}</span>
    ${dueHtml(t)}
    <label class="sr-only" for="st-${esc(t.id)}">status</label>
    <select class="stat-sel" id="st-${esc(t.id)}" data-action="task-status" title="mudar status">${statusOpts}</select>
    <span class="iconbtn" data-action="task-edit" title="editar">✎</span>
    <span class="iconbtn danger" data-action="task-del" title="excluir">×</span>
    <span class="grip" title="arrastar">⠿</span>
  </div>`;
}

/* ---------- kanban ---------- */

function renderKanban() {
  const board = $('#board');
  if (!state.projetos.length) {
    board.innerHTML = `<div class="empty fade-in"><span class="big">_</span><p>nenhum projeto.</p></div>`;
    return;
  }
  const cols = STATUS_ORDER.map(k => ({ key: k, items: [] }));
  for (const p of state.projetos) {
    for (const s of p.sections) {
      for (const t of s.tasks) {
        if (!matchTask(t)) continue;
        cols.find(c => c.key === t.status).items.push({ p, s, t });
      }
    }
  }
  for (const c of cols) if (ui.prioSort) c.items.sort((a, b) => a.t.prio - b.t.prio);

  board.innerHTML = `<div class="kanban fade-in">` + cols.map(c => {
    const st = STATUS[c.key];
    return `<div class="kan-col" data-kan-col="${c.key}">
      <div class="kan-col-head">
        <span class="led ${st.cls}"></span>
        <h3>${st.label}</h3>
        <span class="count">${c.items.length}</span>
      </div>
      <div class="kan-body">${c.items.length ? c.items.map(it => kanbanCard(it.p, it.s, it.t)).join('') : `<div class="kan-empty">vazio</div>`}</div>
    </div>`;
  }).join('') + `</div>`;
}

function kanbanCard(p, s, t) {
  const st = STATUS[t.status] || STATUS.todo;
  const overdue = t.status !== 'done' && t.due && t.due < todayISO();
  return `<div class="kan-card ${st.cls} ${t.status === 'done' ? 't-done' : ''}" draggable="true"
      data-pid="${p.id}" data-sid="${s.id}" data-tid="${t.id}" data-dnd-src>
    <span class="led" data-action="task-toggle" title="alternar concluída"></span>
    <div class="kan-text">
      ${linkify(t.text)}
      ${t.note ? `<span class="task-note"> — ${linkify(t.note)}</span>` : ''}
    </div>
    <div class="kan-meta">
      <span class="kan-proj" title="${esc(p.title)} › ${esc(s.title)}">${esc(p.title)} › ${esc(s.title)}</span>
      ${t.blocked ? '<span class="tag tag-blocked">bloqueada</span>' : ''}
      ${dueHtml(t)}
    </div>
    <div class="flex flex-col items-end gap-1">
      <span class="prio-btn prio-${t.prio}" data-action="task-prio" title="prioridade: clique pra mudar">${PRIO_KEYS[t.prio] || 'P'}</span>
      <span class="iconbtn" data-action="task-edit" title="editar">✎</span>
      <span class="iconbtn danger" data-action="task-del" title="excluir">×</span>
    </div>
  </div>`;
}

function handleKanColDragOver(e) {
  const col = e.target.closest('.kan-col');
  if (!col || !dndState.src) { clearDndFx(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  $$('.kan-col.drop-zone').forEach(n => n.classList.remove('drop-zone'));
  col.classList.add('drop-zone');
}

function handleKanbanDrop(e) {
  const col = e.target.closest('.kan-col');
  if (!col || !dndState.src) { clearDndFx(); return; }
  e.preventDefault();
  const status = col.dataset.kanCol;
  const src = dndState.src;
  const t = findTask(src.pid, src.sid, src.tid);
  if (t) {
    const wasDone = t.status === 'done';
    const card = document.querySelector(`.kan-card[data-tid="${src.tid}"]`);
    const rect = !wasDone && status === 'done' && card && card.querySelector('.led') ? card.querySelector('.led').getBoundingClientRect() : null;
    applyStatus(t, status);
    mutation();
    if (rect) burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  clearDndFx();
  dndState.src = null;
}

/* ---------------- acoes CRUD ---------------- */

function mutation() { save(); render(); }

function addProject(title) {
  state.projetos.push(makeProject(title, [makeSection('geral', [])]));
  mutation();
}

function renameProject(pid, title, blocked) {
  const p = findProject(pid);
  p.title = title;
  p.blocked = blocked;
  mutation();
}

function deleteProject(pid) {
  state.projetos = state.projetos.filter(p => p.id !== pid);
  mutation();
}

function addSection(pid, title) {
  findProject(pid).sections.push(makeSection(title, []));
  mutation();
}

function renameSection(pid, sid, title) {
  findSection(pid, sid).title = title;
  mutation();
}

function deleteSection(pid, sid) {
  findProject(pid).sections = findProject(pid).sections.filter(s => s.id !== sid);
  mutation();
}

function addTask(pid, sid, text) {
  findSection(pid, sid).tasks.push(makeTask(text.trim(), 'todo'));
  mutation();
  focusAddInput(sid);
}

function editTask(pid, sid, tid, text, note, blocked, prio, due) {
  const t = findTask(pid, sid, tid);
  t.text = text; t.note = note; t.blocked = blocked;
  if (prio !== undefined) t.prio = prio;
  if (due !== undefined) t.due = due;
  mutation();
}

function deleteTask(pid, sid, tid) {
  const sec = findSection(pid, sid);
  sec.tasks = sec.tasks.filter(t => t.id !== tid);
  mutation();
}

function setTaskStatus(pid, sid, tid, status) {
  applyStatus(findTask(pid, sid, tid), status);
  mutation();
}

function setTaskPrio(pid, sid, tid, prio) {
  findTask(pid, sid, tid).prio = prio;
  mutation();
}

function toggleTask(pid, sid, tid) {
  const t = findTask(pid, sid, tid);
  applyStatus(t, t.status === 'done' ? 'todo' : 'done');
  mutation();
}

function toggleSection(pid, sid) {
  const s = findSection(pid, sid);
  s.collapsed = !s.collapsed;
  mutation();
}

function focusAddInput(sid) {
  const el = $(`[data-addinput="${sid}"]`);
  if (el) { el.focus(); }
}

/* ---------------- modal ---------------- */

function modal({ title, fields, submitLabel = 'salvar', onOpen }) {
  return new Promise(resolve => {
    const body = $$('body')[0];
    const inputHtml = f => {
      if (f.type === 'textarea')
        return `<textarea class="input-line w-full" data-k="${f.key}" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`;
      if (f.type === 'checkbox')
        return `<label class="flex items-center gap-2 text-[12px] text-ink cursor-pointer select-none">
          <input type="checkbox" class="accent-[#34d399]" data-k="${f.key}" ${f.value ? 'checked' : ''}> ${esc(f.label || '')}</label>`;
      if (f.type === 'select')
        return `<select class="input-line w-full" data-k="${f.key}">${(f.options || []).map(o =>
          `<option value="${esc(o.value)}" ${String(o.value) === String(f.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      return `<input type="${esc(f.type || 'text')}" class="input-line w-full" data-k="${f.key}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" autocomplete="off" spellcheck="false">`;
    };

    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-backdrop" data-elm="backdrop">
      <div class="modal fade-in" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="iconbtn" data-elm="close">×</button>
        </div>
        <div class="modal-body">
          ${fields.map(f => `<div><label class="field-label">${esc(f.label)}</label>${inputHtml(f)}</div>`).join('')}
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-elm="cancel">cancelar</button>
          <button class="btn btn-primary" data-elm="ok">${esc(submitLabel)}</button>
        </div>
      </div>
    </div>`;

    const firstInput = $('.modal-body input, .modal-body select, .modal-body textarea', root);
    setTimeout(() => { if (firstInput) firstInput.focus(); }, 40);
    onOpen && onOpen(root);

    const close = val => { root.innerHTML = ''; resolve(val); };
    $('[data-elm=backdrop]', root).addEventListener('mousedown', e => { if (e.target === e.currentTarget) close(null); });
    $('[data-elm=close]', root).addEventListener('click', () => close(null));
    $('[data-elm=cancel]', root).addEventListener('click', () => close(null));
    $('[data-elm=ok]', root).addEventListener('click', () => {
      const values = {};
      fields.forEach(f => {
        const el = $(`[data-k="${f.key}"]`, root);
        values[f.key] = f.type === 'checkbox' ? el.checked : el.value;
      });
      close(values);
    });
    root.querySelectorAll('.modal-body input, .modal-body textarea').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('[data-elm=ok]', root).click(); }
        if (e.key === 'Escape') close(null);
      });
    });
  });
}

/* ---------------- confirm / toast ---------------- */

function confirmBox(msg) { return window.confirm(msg); }

/* ---------------- celebração: confete + chime ---------------- */

const CONFETTI_EMOJI = ['🎉', '🪇', '🥳', '✨', '🎊', '⭐'];

function burstConfetti(x, y) {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.style.left = '0px';
  layer.style.top = '0px';
  const W = window.innerWidth;
  const H = window.innerHeight;
  const spread = Math.min(260, W / 2);
  const cx = Math.min(Math.max(x, W / 2), W - W / 2);
  const bits = 18;
  for (let i = 0; i < bits; i++) {
    const s = document.createElement('span');
    s.className = 'confetti-bit';
    s.textContent = CONFETTI_EMOJI[i % CONFETTI_EMOJI.length];
    s.style.left = (cx + (Math.random() * 2 - 1) * spread).toFixed(1) + 'px';
    s.style.top = (-20 - Math.random() * 60).toFixed(1) + 'px';
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 150).toFixed(1) + 'px');
    s.style.setProperty('--dy', (H + 60 + Math.random() * 100).toFixed(1) + 'px');
    s.style.setProperty('--rot', (Math.random() * 200 - 100).toFixed(1) + 'deg');
    s.style.fontSize = (22 + Math.random() * 14).toFixed(1) + 'px';
    s.style.animationDelay = (Math.random() * 0.45).toFixed(2) + 's';
    layer.appendChild(s);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2800);
}

let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = now + i * 0.09;
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch (e) { /* sem áudio disponível */ }
}

let lastBurst = 0;
function burstAt(x, y) {
  const now = Date.now();
  if (now - lastBurst < 350) return;
  lastBurst = now;
  burstConfetti(x, y);
  chime();
}

function celebrateDone(row) {
  const led = (row && row.querySelector('.led')) || row;
  if (!led) return;
  const r = led.getBoundingClientRect();
  if (!r || (r.width === 0 && r.height === 0)) return;
  burstAt(r.left + r.width / 2, r.top + r.height / 2);
}

function toast(msg) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; $$('body')[0].appendChild(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1600);
}

/* ---------------- abrir editores ---------------- */

function openProjectModal(p) {
  modal({
    title: 'editar projeto',
    submitLabel: 'salvar',
    fields: [
      { key: 'title', label: 'título', value: p.title },
      { key: 'blocked', label: 'marcar como stuck / bloqueado', value: p.blocked, type: 'checkbox' },
    ],
  }).then(v => {
    if (!v) return;
    if (!v.title.trim()) return toast('projeto sem título');
    renameProject(p.id, v.title.trim(), v.blocked);
  });
}

function openSectionModal(pid, s) {
  modal({
    title: 'renomear seção',
    submitLabel: 'salvar',
    fields: [{ key: 'title', label: 'título', value: s.title }],
  }).then(v => { if (v && v.title.trim()) renameSection(pid, s.id, v.title.trim()); });
}

function openTaskModal(pid, sid, t) {
  modal({
    title: 'editar tarefa',
    submitLabel: 'salvar',
    fields: [
      { key: 'text', label: 'tarefa', value: t.text },
      { key: 'prio', label: 'prioridade', value: t.prio, type: 'select',
        options: [{ value: 1, label: 'P1 — urgente' }, { value: 2, label: 'P2 — em breve' }, { value: 3, label: 'P3 — normal' }] },
      { key: 'due', label: 'vencimento', value: t.due, type: 'date' },
      { key: 'note', label: 'nota', value: t.note, type: 'textarea', placeholder: 'detalhe opcional…' },
      { key: 'blocked', label: 'marcar como bloqueada / stuck', value: t.blocked, type: 'checkbox' },
    ],
  }).then(v => {
    if (!v) return;
    if (!v.text.trim()) return toast('tarefa sem texto');
    editTask(pid, sid, t.id, v.text.trim(), v.note.trim(), v.blocked, Number(v.prio) || 3, v.due || '');
  });
}

/* ---------------- DnD ---------------- */

const dndState = { src: null };

function dndSerialize(src) { return JSON.stringify({ pid: src.pid, sid: src.sid, tid: src.tid }); }

function handleDragStart(e) {
  const task = e.target.closest('.task, .kan-card');
  if (!task) return;
  dndState.src = { pid: task.dataset.pid, sid: task.dataset.sid, tid: task.dataset.tid };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dndSerialize(dndState.src));
  task.classList.add('dragging');
}

function clearDndFx() {
  $$('.task.dragging, .task.drop-top, .task.drop-bottom, .kan-card.dragging, .kan-col.drop-zone, .dock-cell.drag-over').forEach(n => n.classList.remove('dragging', 'drop-top', 'drop-bottom', 'drag-over', 'drop-zone'));
}

function handleTaskDragOver(e) {
  const zone = e.target.closest('[data-dropzone="tasks"]');
  if (!zone) { clearDndFx(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  zone.querySelectorAll('.drop-top, .drop-bottom').forEach(n => n.classList.remove('drop-top', 'drop-bottom'));
  const over = e.target.closest('.task');
  if (!over) { zone.lastElementChild && zone.lastElementChild.classList.add('drop-bottom'); return; }
  const r = over.getBoundingClientRect();
  over.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-top' : 'drop-bottom');
}

function handleDropOnTasks(e) {
  const zone = e.target.closest('[data-dropzone="tasks"]');
  if (!zone || !dndState.src) { clearDndFx(); return; }
  e.preventDefault();
  const targetPid = zone.closest('[data-pid]').dataset.pid;
  const targetSid = zone.closest('[data-sid]').dataset.sid;
  const src = dndState.src;

  // remove origem
  const srcSec = findSection(src.pid, src.sid);
  const task = srcSec.tasks.find(t => t.id === src.tid);
  srcSec.tasks = srcSec.tasks.filter(t => t.id !== src.tid);
  const destSec = findSection(targetPid, targetSid);
  const posEl = zone.querySelector('.task.drop-top, .task.drop-bottom');
  const insert = posEl ? destSec.tasks.findIndex(t => t.id === posEl.dataset.tid) : -1;
  const targetIdx = posEl && posEl.classList.contains('drop-top') ? insert : insert === -1 ? destSec.tasks.length : insert + 1;
  destSec.tasks.splice(Math.max(0, targetIdx), 0, task);
  clearDndFx();
  mutation();
  dndState.src = null;
}

function handleDockDragOver(e) {
  const cell = e.target.closest('.dock-cell');
  if (!cell) { clearDndFx(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  $$('.dock-cell.drag-over').forEach(n => n.classList.remove('drag-over'));
  cell.classList.add('drag-over');
}

function handleDropOnDock(e) {
  const cell = e.target.closest('.dock-cell');
  if (!cell || !dndState.src) { clearDndFx(); return; }
  e.preventDefault();
  const status = cell.dataset.dock;
  const src = dndState.src;
  const t = findTask(src.pid, src.sid, src.tid);
  if (t) {
    const wasDone = t.status === 'done';
    const row = document.querySelector(`[data-pid="${src.pid}"][data-sid="${src.sid}"][data-tid="${src.tid}"]`);
    const rect = !wasDone && status === 'done' && row ? row.querySelector('.led').getBoundingClientRect() : null;
    applyStatus(t, status);
    mutation();
    if (rect) burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  clearDndFx();
  dndState.src = null;
}

/* ---------------- delegacao de eventos ---------------- */

function handleBoardClick(e) {
  const el = e.target.closest('[data-action]');
  if (el) e.preventDefault();
  const act = el?.dataset.action;
  if (!act) return;

  const pid = () => el.closest('[data-pid]')?.dataset.pid;
  const sid = () => el.closest('[data-sid]')?.dataset.sid;
  const tid = () => el.closest('[data-tid]')?.dataset.tid;

  switch (act) {
    case 'proj-add-sec':
      modal({ title: 'nova seção', submitLabel: 'criar', fields: [{ key: 'title', label: 'título', value: '' }] })
        .then(v => { if (v && v.title.trim()) addSection(pid(), v.title.trim()); });
      break;
    case 'proj-rename': openProjectModal(findProject(pid())); break;
    case 'proj-del':
      const p = findProject(pid());
      if (confirmBox(`excluir projeto "${p.title}"?`)) deleteProject(pid());
      break;
    case 'sec-toggle': toggleSection(pid(), sid()); break;
    case 'sec-del':
      if (confirmBox('excluir seção e todas as tarefas dela?')) deleteSection(pid(), sid());
      break;
    case 'sec-rename': openSectionModal(pid(), findSection(pid(), sid())); break;
    case 'task-toggle': {
      const t = findTask(pid(), sid(), tid());
      const wasDone = t.status === 'done';
      const rect = t.status === 'done' ? null : el.closest('.task').getBoundingClientRect();
      toggleTask(pid(), sid(), tid());
      if (!wasDone && rect) burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
      break;
    }
    case 'task-prio':
      setTaskPrio(pid(), sid(), tid(), ({ 1: 2, 2: 3, 3: 1 }[findTask(pid(), sid(), tid()).prio] || 3));
      break;
    case 'task-edit': openTaskModal(pid(), sid(), findTask(pid(), sid(), tid())); break;
    case 'task-del':
      if (confirmBox('excluir tarefa?')) deleteTask(pid(), sid(), tid());
      break;
    case 'new-project': openNewProject(); break;
  }
}

function openNewProject() {
  modal({ title: 'novo projeto', submitLabel: 'criar', fields: [{ key: 'title', label: 'título', value: '' }] })
    .then(v => { if (v && v.title.trim()) addProject(v.title.trim()); });
}

function handleBoardChange(e) {
  const el = e.target;
  if (el.matches('[data-action="task-status"]')) {
    const row = el.closest('.task');
    const t = findTask(row.dataset.pid, row.dataset.sid, row.dataset.tid);
    const wasDone = t.status === 'done';
    const rect = el.value === 'done' && !wasDone ? row.getBoundingClientRect() : null;
    setTaskStatus(row.dataset.pid, row.dataset.sid, row.dataset.tid, el.value);
    if (rect) burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
}

function handleBoardKeydown(e) {
  const inp = e.target.closest('[data-addinput]');
  if (!inp) return;
  if (e.key === 'Enter' && inp.value.trim()) {
    e.preventDefault();
    const sec = inp.closest('[data-sid]');
    addTask(sec.dataset.pid, sec.dataset.sid, inp.value);
  }
}

function bindBoardDnD() {
  const board = $('#board');

  const dropableDragOver = e => {
    if (!dndState.src) return;
    if (e.target.closest('[data-dropzone="tasks"]')) return handleTaskDragOver(e);
    if (e.target.closest('.kan-col')) return handleKanColDragOver(e);
    if (e.target.closest('.dock-cell')) return handleDockDragOver(e);
    clearDndFx();
  };
  const dropableDrop = e => {
    if (e.target.closest('[data-dropzone="tasks"]')) return handleDropOnTasks(e);
    if (e.target.closest('.kan-col')) return handleKanbanDrop(e);
    if (e.target.closest('.dock-cell')) return handleDropOnDock(e);
  };

  board.addEventListener('dragstart', handleDragStart);
  board.addEventListener('dragover', dropableDragOver);
  board.addEventListener('drop', dropableDrop);
  board.addEventListener('dragend', () => { clearDndFx(); dndState.src = null; });
  board.addEventListener('keydown', handleBoardKeydown);
}

/* ---------------- topbar ---------------- */

function clearFilters() {
  ui.query = '';
  ui.status = null;
  const s = $('#search');
  if (s) s.value = '';
  $('#search-clear').classList.add('hidden');
  render();
}

function setStatusFilter(k) {
  ui.status = ui.status === k ? null : k;
  $('#search-clear').classList.toggle('hidden', !(ui.query || ui.status));
  render();
}

function setView(v) {
  ui.view = v === 'kanban' ? 'kanban' : 'list';
  const btn = $('#view-btn');
  if (btn) btn.textContent = ui.view === 'list' ? 'kanban' : 'lista';
  render();
}

function setTheme(t) {
  const dark = t === 'dark';
  document.documentElement.classList.toggle('light', !dark);
  document.documentElement.classList.toggle('dark', dark);
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) { /* privado */ }
  const btn = $('#theme-btn');
  if (btn) btn.textContent = dark ? 'light' : 'dark';
}

function bindTopbar() {
  $('#btn-new-project').addEventListener('click', openNewProject);
  $('#view-btn').addEventListener('click', () => setView(ui.view === 'list' ? 'kanban' : 'list'));
  $('#theme-btn').addEventListener('click', () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));

  $('#btn-export').addEventListener('click', exportData);
  $('#btn-import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });
  $('#btn-reset').addEventListener('click', () => { if (confirmBox('apagar todos os dados?')) { localStorage.removeItem(STORE_KEY); state = { projetos: [] }; save(); render(); } });

  const search = $('#search');
  const clear = $('#search-clear');
  search.addEventListener('input', () => {
    ui.query = search.value.trim();
    clear.classList.toggle('hidden', !ui.query);
    render();
  });
  clear.addEventListener('click', () => { search.value = ''; ui.query = ''; clear.classList.add('hidden'); render(); search.focus(); });

  $('#filters').addEventListener('click', e => {
    const chip = e.target.closest('[data-f="status"], [data-f="clear"]');
    if (!chip) return;
    if (chip.dataset.f === 'clear') { clearFilters(); return; }
    setStatusFilter(chip.dataset.k);
  });

  $('#stats').addEventListener('click', e => {
    const chip = e.target.closest('[data-act="prio-sort"]');
    if (!chip) return;
    ui.prioSort = !ui.prioSort;
    render();
  });
}

/* ---------------- export/import ---------------- */

function exportData() {
  const payload = { versao: 2, exportadoEm: new Date().toISOString(), projetos: state.projetos };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `opsboard-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.projetos) || !data.projetos.length) throw new Error('inválido');
      state = { ...data, projetos: data.projetos };
      ensureSchema();
      save();
      render();
      toast('importado');
    } catch (e) {
      window.alert('arquivo importado inválido.');
    }
  };
  reader.readAsText(file);
}

/* ---------------- atalhos ---------------- */

function shortcutHelp() {
  toast('p novo projeto · s nova seção · n nova tarefa · 1-5 filtros · k kanban · t tema · ? ajuda · esc limpa');
}

function handleGlobalKeydown(e) {
  const tag = document.activeElement?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable ||
    e.target.closest?.('textarea');
  if (typing) return;
  if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) { clearFilters(); return; }
  if (e.key === '?' && !e.ctrlKey && !e.metaKey) { shortcutHelp(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.querySelector('.modal-backdrop')) return;
  const k = e.key.toLowerCase();
  if (k === 'p') { e.preventDefault(); openNewProject(); }
  else if (k === 'k') { e.preventDefault(); setView(ui.view === 'list' ? 'kanban' : 'list'); }
  else if (k === 't') { setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'); }
  else if (k === 'n') {
    e.preventDefault();
    const first = document.querySelector('[data-addinput]');
    if (first) first.focus();
  } else if (['1', '2', '3', '4', '5'].includes(k)) {
    e.preventDefault();
    const idx = ['1', '2', '3', '4', '5'].indexOf(k);
    const keys = ['todo', 'doing', 'waiting', 'done', 'blocked'];
    setStatusFilter(ui.status === keys[idx] ? null : keys[idx]);
  }
}

/* ---------------- boot ---------------- */

window.addEventListener('keydown', handleGlobalKeydown);

function boot() {
  setTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark');
  const board = $('#board');
  board.addEventListener('click', handleBoardClick);
  board.addEventListener('change', handleBoardChange);
  bindBoardDnD();
  bindTopbar();
  render();
  $('#save-state').textContent = 'pronto';
}

document.addEventListener('DOMContentLoaded', boot);