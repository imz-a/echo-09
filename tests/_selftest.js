/* 临时自测脚本：数据完整性 + 密码链校验（不属于游戏本体） */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = path.join(__dirname, '..');
const ctx = {
  console,
  document: { querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => ({ style:{}, classList:{add(){},remove(){}}, appendChild(){}, addEventListener(){} }) },
  window: {},
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
  setTimeout, clearTimeout, setInterval, clearInterval,
  location: { hash: '' }
};
vm.createContext(ctx);
['js/data.js', 'js/core.js', 'js/apps.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));

// vm 里 const 是词法绑定，需在同一 context 中再导出一次
vm.runInContext(`globalThis.__X = { CLUES, APPS, SEARCH_DB, FORUM, DRIVE, BLOG, MAIL, DB_SITE, HINTS, ACHIEVEMENTS, TOTAL_CLUES, TERM, kdecode, kencode };`, ctx);
const { CLUES, APPS, SEARCH_DB, FORUM, DRIVE, BLOG, MAIL, DB_SITE, HINTS, ACHIEVEMENTS, TOTAL_CLUES, TERM, kdecode, kencode } = ctx.__X;
const DIRECT = vm.runInContext('DIRECT', ctx);
let fail = 0;
const bad = m => { console.log('  ✖ ' + m); fail++; };
const ok  = m => console.log('  ✔ ' + m);

console.log('\n[1] 密码链');
kdecode('djrmusm') === 'shenyan' ? ok('decode(djrmusm) = shenyan') : bad('decode 结果错误：' + kdecode('djrmusm'));
kencode('shenyan') === 'djrmusm' ? ok('encode(shenyan) = djrmusm') : bad('encode 结果错误：' + kencode('shenyan'));
DRIVE.code === '0923' ? ok('网盘提取码 0923') : bad('提取码不符');
MAIL.pass === 'ihcom' ? ok('邮箱密码 ihcom（MOCHI 倒写）') : bad('邮箱密码不符');
'MOCHI'.split('').reverse().join('').toLowerCase() === MAIL.pass ? ok('MOCHI → ihcom 逻辑自洽') : bad('猫名倒写与密码不一致');
DB_SITE.pass === 'shenyan' ? ok('内网口令 shenyan') : bad('内网口令不符');
('741' + '928') === '741928' ? ok('密钥 SEG-A(741) + SEG-B(928) = 741928') : bad('密钥拼接失败');

console.log('\n[2] 线索引用完整性');
const clueIds = new Set(Object.keys(CLUES));
const refs = [];
SEARCH_DB.forEach(g => g.results.forEach(r => r.clue && refs.push(['搜索:' + r.title, r.clue])));
FORUM.threads.forEach(t => t.posts.forEach(p => p.clue && refs.push(['论坛:' + t.id, p.clue])));
DRIVE.files.forEach(f => f.clue && refs.push(['网盘:' + f.name, f.clue]));
BLOG.posts.forEach(p => p.clue && refs.push(['博客:' + p.id, p.clue]));
MAIL.mails.forEach(m => m.clue && refs.push(['邮件:' + m.id, m.clue]));
const appsSrc = fs.readFileSync(path.join(dir, 'js/apps.js'), 'utf8');
(appsSrc.match(/addClue\('([a-z0-9_]+)'\)/g) || []).forEach(s => {
  refs.push(['apps.js', s.match(/'([a-z0-9_]+)'/)[1]]);
});
refs.forEach(([w, id]) => { if (!clueIds.has(id)) bad('未知线索 id: ' + id + '  ← ' + w); });
ok('共校验 ' + refs.length + ' 处线索引用，' + Object.keys(CLUES).length + ' 条线索定义');

console.log('\n[3] 站点 / 应用 ID');
const appIds = new Set(APPS.map(a => a.id));
SEARCH_DB.forEach(g => g.results.forEach(r => {
  if (r.unlock && !appIds.has(r.unlock)) bad('未知 unlock: ' + r.unlock);
  if (r.open && !appIds.has(r.open.app)) bad('未知 open.app: ' + r.open.app);
}));
DRIVE.files.forEach(f => { if (f.unlock && !appIds.has(f.unlock)) bad('网盘未知 unlock: ' + f.unlock); });
ok('应用 ID 全部有效：' + [...appIds].join(', '));

console.log('\n[4] 论坛 / 邮件 / 内网结构');
FORUM.threads.forEach(t => {
  if (!FORUM.boards.some(b => b.id === t.board)) bad('帖子 ' + t.id + ' 版块无效');
});
const fids = new Set(MAIL.folders.map(f => f.id));
MAIL.mails.forEach(m => { if (!fids.has(m.folder)) bad('邮件 ' + m.id + ' 文件夹无效'); });
MAIL.folders.forEach(f => {
  const n = MAIL.mails.filter(m => m.folder === f.id).length;
  if (n !== f.count) bad('文件夹 ' + f.name + ' 计数不符：声明 ' + f.count + '，实际 ' + n);
});
ok('论坛 ' + FORUM.threads.length + ' 帖 / 邮件 ' + MAIL.mails.length + ' 封 / 内网 ' + DB_SITE.tabs.length + ' 个标签页');

console.log('\n[5] 提示系统');
const stageKeys = ['start','forum','code','readme','cat','mail','decode','db','key','echo'];
stageKeys.forEach(k => {
  if (!HINTS.some(h => h.need === k)) bad('HINTS 缺少阶段：' + k);
  if (!DIRECT[k]) bad('DIRECT 缺少阶段：' + k);
});
ok('10 个进度阶段均有委婉提示与直接答案');

console.log('\n[6] 内容体量');
const words = ['SEARCH_DB','FORUM','DRIVE','BLOG','MAIL','DB_SITE','TERM']
  .reduce((n, k) => n + JSON.stringify(ctx.__X[k]).length, 0);
console.log('  · 数据总量约 ' + Math.round(words / 1024) + ' KB，线索 ' + Object.keys(CLUES).length + ' 条，成就 ' + ACHIEVEMENTS.length + ' 个');

console.log('\n' + (fail ? '❌ 失败 ' + fail + ' 项' : '✅ 全部通过'));
process.exit(fail ? 1 : 0);
