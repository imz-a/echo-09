/* ============================================================
   ECHO-09 · icons.js
   统一线性图标集（24 网格，1.6 描边），替代 emoji
   用法：icon('search', 20)  /  hydrateIcons(root) 扫描 [data-ic]
   ============================================================ */

const ICONS = {
  /* 系统 / 应用 */
  search:    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.8 15.8 20.5 20.5"/>',
  forum:     '<path d="M20.5 11.6a7.6 7.6 0 0 1-7.6 7.6H8.6L4.2 22.2a.4.4 0 0 1-.7-.4v-10.2a7.6 7.6 0 0 1 7.6-7.6h1.8a7.6 7.6 0 0 1 7.6 7.6z"/><path d="M9 11.6h.01M12.5 11.6h.01M16 11.6h.01"/>',
  cloud:     '<path d="M7.2 18.6h9.4a3.8 3.8 0 0 0 .4-7.57A5.5 5.5 0 0 0 6.6 9.62 3.6 3.6 0 0 0 7.2 18.6z"/>',
  mail:      '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3.9 7.2 12 13.2l8.1-6"/>',
  mailOpen:  '<path d="M4 9.4 12 4.3l8 5.1v8.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 9.4 12 14.6 20 9.4"/>',
  database:  '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6"/><path d="M4.5 12v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-6"/>',
  terminal:  '<rect x="3" y="4.5" width="18" height="15" rx="2.2"/><path d="M7.6 10.6 10.6 13.6 7.6 16.6"/><path d="M13.4 16.6h3.6"/>',
  pin:       '<path d="M12 21.4S5 16 5 11a7 7 0 1 1 14 0c0 5-7 10.4-7 10.4z"/><circle cx="12" cy="11" r="2.4"/>',
  ripple:    '<circle cx="12" cy="12" r="8.6" opacity=".4"/><circle cx="12" cy="12" r="5" opacity=".8"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>',

  /* 文件类型 */
  file:      '<path d="M14 3.6H7.6a2 2 0 0 0-2 2v12.8a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V8.2z"/><path d="M14 3.6v4.6h4.4"/><path d="M9.2 12.8h5.6M9.2 16h3.8"/>',
  book:      '<path d="M4.6 19.4A2.4 2.4 0 0 1 7 17h12.4"/><path d="M7 3.6h12.4v17H7a2.4 2.4 0 0 1-2.4-2.4V6a2.4 2.4 0 0 1 2.4-2.4z"/>',
  chart:     '<path d="M4.6 20.4h14.8"/><path d="M8.2 20.4V11.2M12 20.4V5.4M15.8 20.4v-6.2"/>',
  image:     '<rect x="3" y="4.6" width="18" height="14.8" rx="2.2"/><circle cx="8.6" cy="9.6" r="1.6"/><path d="M4.2 17.4l4.4-4.8 3.6 3.9 2.9-3.4 5.2 5.9"/>',

  /* 状态 / 线索 */
  moon:      '<path d="M20.2 14.3A8.5 8.5 0 0 1 9.7 3.8 8.6 8.6 0 1 0 20.2 14.3z"/>',
  news:      '<rect x="3.4" y="5.4" width="11.6" height="13.2" rx="1.8"/><path d="M6.4 9.4h5.8M6.4 13h5.8M6.4 16.4h3.4"/><path d="M17.2 8.2h3.4v10.4h-3.4z"/>',
  ban:       '<circle cx="12" cy="12" r="8.5"/><path d="M6.2 17.8 17.8 6.2"/>',
  megaphone: '<path d="M4.2 10.4v3.2a1 1 0 0 0 1 1h1.9l4.7 3.7V5.7L7.1 9.4H5.2a1 1 0 0 0-1 1z"/><path d="M16.4 9.1a4.2 4.2 0 0 1 0 5.8"/><path d="M12.2 5.7V4.2"/>',
  coin:      '<circle cx="12" cy="12" r="8.5"/><path d="M9 9.8h6M9 14.2h6"/>',
  mic:       '<rect x="9" y="3.2" width="6" height="10.8" rx="3"/><path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0"/><path d="M12 18v2.8"/>',
  key:       '<circle cx="8.4" cy="12" r="3.5"/><path d="M11.9 12h8.4"/><path d="M17 12v3.2M19.6 12v2.4"/>',
  ghost:     '<path d="M5 20.4v-9a7 7 0 1 1 14 0v9l-3.4-2.4-3.6 2.4-3.6-2.4z"/><path d="M9.6 11.4h.01M14.4 11.4h.01"/>',
  scale:     '<path d="M12 4.4v15.2"/><path d="M6.2 20.4h11.6"/><path d="M4 8.6h16"/><path d="M6.6 8.6 4.2 14.6h4.8z"/><path d="M17.4 8.6 15 14.6h4.8z"/>',
  user:      '<circle cx="12" cy="8.4" r="3.6"/><path d="M5 20.2c0-3.4 3.1-5.7 7-5.7s7 2.3 7 5.7"/>',
  cat:       '<path d="M6.3 10.6 4.7 5.6l4.5 2.2"/><path d="M17.7 10.6 19.3 5.6 14.8 7.8"/><ellipse cx="12" cy="14" rx="6.2" ry="5.2"/><path d="M9.7 13.2h.01M14.3 13.2h.01"/><path d="M10.7 16.2c.9.7 1.9.7 2.8 0"/>',
  heart:     '<path d="M12 20.2S4.6 15.6 4.6 11a4.2 4.2 0 0 1 7.4-2.7A4.2 4.2 0 0 1 19.4 11c0 4.6-7.4 9.2-7.4 9.2z"/>',
  paw:       '<ellipse cx="7.9" cy="10.2" rx="1.7" ry="2.2"/><ellipse cx="12" cy="8.8" rx="1.7" ry="2.2"/><ellipse cx="16.1" cy="10.2" rx="1.7" ry="2.2"/><path d="M12 20.8c-2.9 0-5.4-1.9-5.4-4.1 0-2.2 2.2-3.6 5.4-3.6s5.4 1.4 5.4 3.6c0 2.2-2.5 4.1-5.4 4.1z"/>',
  mask:      '<path d="M12 4.6c4.4 0 7.9 3.2 7.9 7 0 4.6-3.5 8-7.9 8s-7.9-3.4-7.9-8c0-3.8 3.5-7 7.9-7z"/><path d="M8.6 11h.01M15.4 11h.01"/><path d="M9.1 15.4c1.8 1.4 4 1.4 5.8 0"/>',
  hash:      '<path d="M9.2 4.4 7.6 19.6M16.4 4.4 14.8 19.6"/><path d="M4.4 9.2h15.2M3.9 15h15.2"/>',
  info:      '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v5.2"/><path d="M12 7.8h.01"/>',
  idCard:    '<rect x="3" y="5.4" width="18" height="13.2" rx="2.2"/><circle cx="8.6" cy="11" r="1.9"/><path d="M13.2 10.2h4.6M13.2 14h4.6M6 16.4h3.6"/>',
  lock:      '<rect x="5" y="10.8" width="14" height="9.2" rx="2.2"/><path d="M8.5 10.8V8.2a3.5 3.5 0 0 1 7 0v2.6"/>',
  alert:     '<path d="M12 4.2 21 19.8H3z"/><path d="M12 10v4.2"/><path d="M12 17h.01"/>',
  upload:    '<path d="M12 16.4V5.2"/><path d="M8 9.2l4-4 4 4"/><path d="M4.6 17v2.4a1.6 1.6 0 0 0 1.6 1.6h11.6a1.6 1.6 0 0 0 1.6-1.6V17"/>',
  send:      '<path d="M21 4 3 11.2l6.5 2.4L12 20z"/><path d="M9.6 13.6 21 4"/>',
  pen:       '<path d="M4.6 19.4l4.2-1.1L19.2 7.9a2 2 0 0 0 0-2.8l-1.3-1.3a2 2 0 0 0-2.8 0L4.6 14.2z"/><path d="M14.6 6.6l2.9 2.9"/>',
  link:      '<path d="M9.8 14.2 14.2 9.8"/><path d="M11.6 6.9 13.1 5.4a3.6 3.6 0 0 1 5.1 5.1l-1.5 1.5"/><path d="M12.4 17.1 10.9 18.6a3.6 3.6 0 0 1-5.1-5.1l1.5-1.5"/>',
  folder:    '<path d="M3.6 7.6a2 2 0 0 1 2-2h3.2l2 2.5h7.6a2 2 0 0 1 2 2v6.9a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2z"/>',
  siren:     '<path d="M5 19.6h14"/><path d="M6.8 19.6v-3.2a5.2 5.2 0 0 1 10.4 0v3.2"/><path d="M12 4.4v2.2M9.6 16.4v-1.2a2.4 2.4 0 0 1 4.8 0v1.2"/>',
  bulb:      '<path d="M9.6 18.4h4.8"/><path d="M10.6 21h2.8"/><path d="M12 3.2a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.2 1 1.9h4.8c.1-.7.4-1.4 1-1.9A5.8 5.8 0 0 0 12 3.2z"/>',
  eye:       '<path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.6"/>',
  bolt:      '<path d="M13.6 3 5.6 13.8h5.6L10 21l8.4-11.2h-6z"/>',
  star:      '<path d="M12 3.8l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 10.2l6-.9z"/>',
  check:     '<path d="M4.8 12.6 9.5 17.2 19.2 6.9"/>',
  back:      '<path d="M14.5 6 8.5 12l6 6"/>',
  save:      '<path d="M4.6 15.6v2.6a1.7 1.7 0 0 0 1.7 1.7h11.4a1.7 1.7 0 0 0 1.7-1.7v-2.6"/><path d="M8 11.6 12 15.6l4-4"/><path d="M12 4.2v11.4"/>',
  volume:    '<path d="M5 9.8v4.4h3.2L12 17.6V6.4L8.2 9.8z"/><path d="M15.6 9.6a3.6 3.6 0 0 1 0 4.8"/><path d="M18.4 7.2a7.2 7.2 0 0 1 0 9.6"/>',
  mute:      '<path d="M5 9.8v4.4h3.2L12 17.6V6.4L8.2 9.8z"/><path d="M16.2 9.8l4.8 4.8M21 9.8l-4.8 4.8"/>',
  reset:     '<path d="M4.2 12a7.8 7.8 0 1 0 2.6-5.8"/><path d="M4.2 4.4v4.8H9"/>',
  help:      '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3.4 2.1c-.8.5-1.2 1-1.2 2"/><path d="M12 17.2h.01"/>',
  dot:       '<circle cx="12" cy="12" r="3"/>'
};

function icon(name, size, cls){
  const body = ICONS[name] || ICONS.dot;
  const s = size || 20;
  return '<svg class="ic ' + (cls || '') + '" width="' + s + '" height="' + s +
         '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}

/* 扫描容器内所有 [data-ic="名称"] 占位符，注入对应图标 */
function hydrateIcons(root){
  (root || document).querySelectorAll('[data-ic]').forEach(el => {
    if (el.dataset.done === '1') return;
    const size = +(el.dataset.size || 0) || 16;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.ic, size));
    el.dataset.done = '1';
  });
}

/* ============================================================
   应用图标（拟真）：圆角方块底 + 白色符号 + 顶部高光，
   让 Dock / 桌面看起来像一台真电脑上的应用，而不是抽象线条。
   ============================================================ */
const TILES = {
  search:   { bg:'linear-gradient(180deg,#54a9ff,#1668e0)', fg:'#fff' },
  forum:    { bg:'linear-gradient(180deg,#8b95ff,#4c58e6)', fg:'#fff' },
  cloud:    { bg:'linear-gradient(180deg,#5ec6ff,#1d8fe6)', fg:'#fff' },
  mail:     { bg:'linear-gradient(180deg,#57d2c4,#129fae)', fg:'#fff' },
  mailOpen: { bg:'linear-gradient(180deg,#57d2c4,#129fae)', fg:'#fff' },
  database: { bg:'linear-gradient(180deg,#66788c,#2e3b49)', fg:'#cfe4ff' },
  terminal: { bg:'linear-gradient(180deg,#4d4d55,#1f1f26)', fg:'#7ef0b0' },
  pin:      { bg:'linear-gradient(180deg,#ffd75e,#efa21e)', fg:'#6b3d00' },
  moon:     { bg:'linear-gradient(180deg,#b394ff,#7549de)', fg:'#fff' },
  ripple:   { bg:'linear-gradient(180deg,#41546a,#1a2531)', fg:'#8fd8ff' }
};

function appIcon(name, size){
  const t = TILES[name] || { bg:'linear-gradient(180deg,#9aa2ad,#6a7280)', fg:'#fff' };
  const s = size || 44;
  const r = Math.round(s * .235);
  return '<span class="app-tile" style="width:' + s + 'px;height:' + s + 'px;border-radius:' + r + 'px;' +
         'background:' + t.bg + ';color:' + t.fg + '">' + icon(name, Math.round(s * .54)) + '</span>';
}
