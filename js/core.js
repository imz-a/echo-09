/* ============================================================
   ECHO-09 · core.js
   服务层：状态管理 / 本地存档 / 窗口管理 / 音效 / 工具函数
   （视图层见 apps.js，数据层见 data.js）
   ============================================================ */

/* ---------------- 工具 ---------------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const pad2 = n => String(n).padStart(2, '0');
function fmtDur(ms){
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return (h ? h + ' 小时 ' : '') + m + ' 分 ' + pad2(s % 60) + ' 秒';
}

/* 键盘移位编解码（她的密码习惯） */
const KB_ROWS = ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
function kshift(str, dir){
  return str.split('').map(ch => {
    const low = ch.toLowerCase();
    for (const row of KB_ROWS){
      const i = row.indexOf(low);
      if (i === -1) continue;
      const j = i + dir;
      if (j < 0 || j >= row.length) return ch;
      const out = row[j];
      return ch === low ? out : out.toUpperCase();
    }
    return ch;
  }).join('');
}
const kdecode = s => kshift(s, -1);
const kencode = s => kshift(s, +1);

/* ---------------- 状态 ---------------- */
const SAVE_KEY = 'echo09_save_v1';

const defaultState = () => ({
  unlocked: ['brief', 'search', 'notes', 'term'],
  clues: [],
  solved: { drive:false, mail:false, db:false },
  flags:  {},
  hints:  0,
  ach:    [],
  start:  Date.now(),
  end:    null,
  sound:  true,
  seen:   false
});

let S = defaultState();

function save(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; }
  catch(e){ return false; }
}
function load(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    S = Object.assign(defaultState(), d);
    S.solved = Object.assign({ drive:false, mail:false, db:false }, d.solved || {});
    return true;
  } catch(e){ return false; }
}
function resetSave(){
  localStorage.removeItem(SAVE_KEY);
  S = defaultState();
}

/* ---------------- 领域动作 ---------------- */
function addClue(id){
  if (!CLUES[id] || S.clues.includes(id)) return false;
  S.clues.push(id);
  const c = CLUES[id];
  toast(c.ti, 'good', c.ic);
  beep(660, .07, 'sine'); setTimeout(() => beep(880, .09, 'sine'), 70);
  renderMenubar();
  if (S.clues.length >= TOTAL_CLUES) grantAch('all_clues');
  save();
  return true;
}

function unlockApp(id){
  if (S.unlocked.includes(id)) return false;
  S.unlocked.push(id);
  const a = APPS.find(x => x.id === id);
  toast((a ? a.name : id) + ' 已收录', 'good', 'cloud');
  buildDock(); buildIcons();
  save();
  return true;
}

function grantAch(id){
  if (S.ach.includes(id)) return;
  S.ach.push(id);
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) toast(a.ti, 'warn', a.ic);
  save();
}

function setFlag(k, v){ S.flags[k] = v === undefined ? true : v; save(); }
const hasFlag = k => !!S.flags[k];

/* ---------------- 音效（WebAudio 合成，无外部资源） ---------------- */
let AC = null;
function beep(freq, dur, type){
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq || 440;
    g.gain.setValueAtTime(.0001, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.07, AC.currentTime + .01);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + (dur || .1));
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + (dur || .1) + .02);
  } catch(e){/* 静默失败 */}
}
const sfx = {
  click: () => beep(520, .04, 'square'),
  ok:    () => { beep(660, .07); setTimeout(() => beep(990, .11), 80); },
  bad:   () => { beep(180, .16, 'sawtooth'); },
  open:  () => beep(380, .06, 'sine'),
  type:  () => beep(1200 + Math.random() * 300, .015, 'square')
};

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg, kind, ic){
  const t = $('#toast');
  t.innerHTML = (ic ? icon(ic, 15) : '') + '<span>' + esc(msg) + '</span>';
  t.className = 'toast show ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast ' + (kind || ''); }, 2600);
}

/* ---------------- 窗口管理 ---------------- */
const WM = { z: 100, open: {}, seq: 0 };

function appMeta(id){ return APPS.find(a => a.id === id); }

function openApp(id, params){
  const meta = appMeta(id);
  if (!meta) return;
  if (!S.unlocked.includes(id)){
    toast('这个站点还没被发现。去搜鸿搜索里找找线索。', 'warn');
    return;
  }
  // 已打开 → 聚焦并可选重渲染
  if (WM.open[id]){
    const w = WM.open[id];
    w.classList.remove('min');
    focusWin(id);
    if (params && Apps[id] && Apps[id].render) Apps[id].render(w, params);
    return;
  }
  const w = document.createElement('div');
  w.className = 'win ' + (meta.cls || '');
  w.dataset.app = id;

  const wide = window.innerWidth;
  const W = Math.min(meta.w || 720, wide - 40);
  const H = Math.min(meta.h || 520, window.innerHeight - 140);
  const off = (WM.seq++ % 6) * 26;
  w.style.width  = W + 'px';
  w.style.height = H + 'px';
  w.style.left   = Math.max(14, Math.min((meta.x || 80) + off, wide - W - 14)) + 'px';
  w.style.top    = Math.max(44, Math.min((meta.y || 60) + off, window.innerHeight - H - 96)) + 'px';

  w.innerHTML =
    '<div class="win-bar">' +
      '<div class="win-dots"><i class="r" data-act="close"></i><i class="y" data-act="min"></i><i class="g" data-act="max"></i></div>' +
      '<div class="win-title">' + appIcon(meta.icon, 16) + '<span>' + esc(meta.name) + '</span></div>' +
    '</div>' +
    '<div class="win-body"></div>';

  $('#windows').appendChild(w);
  WM.open[id] = w;

  // 事件
  $('.win-dots', w).addEventListener('click', e => {
    const a = e.target.dataset.act;
    if (a === 'close') closeWin(id);
    if (a === 'min'){ w.classList.add('min'); sfx.click(); buildDock(); }
    if (a === 'max'){
      sfx.click();
      if (w.dataset.max === '1'){
        w.dataset.max = '0';
        w.style.cssText = w.dataset.prev;
      } else {
        w.dataset.prev = w.style.cssText;
        w.dataset.max = '1';
        w.style.left = '12px'; w.style.top = '10px';
        w.style.width = (window.innerWidth - 24) + 'px';
        w.style.height = (window.innerHeight - 110) + 'px';
      }
    }
  });
  w.addEventListener('mousedown', () => focusWin(id));
  dragify(w, $('.win-bar', w));

  focusWin(id);
  if (Apps[id] && Apps[id].render) Apps[id].render(w, params);
  sfx.open();
  buildDock();
}

function closeWin(id){
  const w = WM.open[id];
  if (w) w.remove();
  delete WM.open[id];
  sfx.click();
  buildDock();
}
function focusWin(id){
  Object.keys(WM.open).forEach(k => WM.open[k].classList.remove('focus'));
  const w = WM.open[id];
  if (w){ w.classList.add('focus'); w.style.zIndex = ++WM.z; }
  buildDock();
}

function dragify(win, handle){
  let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
  handle.addEventListener('mousedown', e => {
    if (e.target.dataset.act) return;
    on = true; sx = e.clientX; sy = e.clientY;
    ox = win.offsetLeft; oy = win.offsetTop;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!on) return;
    win.style.left = Math.max(-win.offsetWidth + 80, ox + e.clientX - sx) + 'px';
    win.style.top  = Math.max(36, oy + e.clientY - sy) + 'px';
  });
  document.addEventListener('mouseup', () => { on = false; document.body.style.userSelect = ''; });
}

/* ---------------- Dock / 桌面图标 ---------------- */
function buildDock(){
  const d = $('#dock');
  const list = APPS.filter(a => S.unlocked.includes(a.id));
  d.innerHTML = list.map(a => {
    const isOpen = !!WM.open[a.id] && !WM.open[a.id].classList.contains('min');
    return '<div class="dock-btn ' + (isOpen ? 'active' : '') + '" data-app="' + a.id + '">' +
             appIcon(a.icon, 46) + '<span class="tip">' + esc(a.name) + '</span>' +
           '</div>';
  }).join('<div class="dock-sep"></div>');
  $$('.dock-btn', d).forEach(b => b.onclick = () => {
    const id = b.dataset.app, w = WM.open[id];
    if (w && !w.classList.contains('min')) { w.classList.add('min'); buildDock(); }
    else openApp(id);
  });
}

function buildIcons(){
  const box = $('#deskIcons');
  box.innerHTML = APPS.filter(a => S.unlocked.includes(a.id)).map(a =>
    '<div class="desk-icon" data-app="' + a.id + '">' +
      '<div class="ico">' + appIcon(a.icon, 42) + '</div>' +
      '<div class="lbl">' + esc(a.name) + '</div>' +
    '</div>').join('');
  $$('.desk-icon', box).forEach(el => el.onclick = () => openApp(el.dataset.app));
}

/* ---------------- 顶栏 ---------------- */
function renderMenubar(){
  const el = $('#mbClueTx') || $('#mbClue');
  if (el) el.textContent = '线索 ' + S.clues.length + '/' + TOTAL_CLUES;
}
function renderClock(){
  const n = new Date();
  $('#mbClock').textContent = pad2(n.getHours()) + ':' + pad2(n.getMinutes());
}

/* ---------------- 通用弹层 ---------------- */
function modal(html, onMount){
  const m = $('#modal'), c = $('#modalCard');
  c.innerHTML = html;
  m.classList.remove('hidden');
  if (onMount) onMount(c);
}
function closeModal(){ $('#modal').classList.add('hidden'); }

/* 打字机效果（用于结局与关键文本） */
function typeLines(container, lines, done){
  let i = 0;
  (function next(){
    if (i >= lines.length){ if (done) done(); return; }
    const l = lines[i++];
    const d = document.createElement('div');
    d.className = 'term-line ' + (l.cls || 'out');
    container.appendChild(d);
    let t = 0;
    const txt = l.t;
    const timer = setInterval(() => {
      d.textContent = txt.slice(0, ++t);
      if (t % 3 === 0) beep(1500 + Math.random() * 400, .01, 'square');
      container.scrollTop = container.scrollHeight;
      if (t >= txt.length){ clearInterval(timer); setTimeout(next, l.wait || 260); }
    }, 22);
  })();
}
