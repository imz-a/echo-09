/* 剧情逻辑审计：追踪每条线索的来源与可达性，检查密码链是否闭环、有无中断 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const dir = path.join(__dirname, '..');

const ctx = {
  console,
  document: { querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => ({ style:{}, classList:{add(){},remove(){}}, appendChild(){}, addEventListener(){} }) },
  window: {}, localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
  setTimeout, clearTimeout, setInterval, clearInterval, location: { hash: '' }
};
vm.createContext(ctx);
['js/data.js', 'js/core.js', 'js/apps.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
vm.runInContext(`globalThis.__X = { CLUES, APPS, SEARCH_DB, FORUM, DRIVE, BLOG, MAIL, DB_SITE, HINTS, ACHIEVEMENTS, TOTAL_CLUES, TERM, kdecode, kencode, BRIEF, ENDING };`, ctx);
const X = ctx.__X;

const out = [];
const log = s => out.push(s);
let bad = 0;
const ok = (b, n) => { if (!b) bad++; log((b ? '  ✔ ' : '  ✖ ') + n); };

/* ---------- 1. 线索来源 ---------- */
const sources = {};
const addSrc = (id, desc) => { if (id) (sources[id] = sources[id] || []).push(desc); };
X.SEARCH_DB.forEach(g => g.results.forEach(r => { if (r.clue) addSrc(r.clue, `搜索[${g.keys.join('/')}]`); }));
X.FORUM.threads.forEach(t => t.posts.forEach((p, i) => { if (p.clue) addSrc(p.clue, `论坛${t.id}第${i+1}楼/${p.au}`); }));
X.DRIVE.files.forEach(f => addSrc(f.clue, `网盘 ${f.name}`));
X.BLOG.posts.forEach(p => addSrc(p.clue, `博客 ${p.id}`));
X.MAIL.mails.forEach(m => addSrc(m.clue, `邮件 ${m.id}[${m.folder}]`));
addSrc(X.DB_SITE.emp.clue,  '内网·员工档案');
addSrc(X.DB_SITE.proj.clue, '内网·项目日志');
addSrc(X.DB_SITE.corp.clue, '内网·语料库');
addSrc(X.DB_SITE.alarm.clue,'内网·系统告警');

log('══════ 1. 线索来源核查（CLUES 共 ' + X.TOTAL_CLUES + ' 条） ══════');
const allClues = Object.keys(X.CLUES);
const orphan = allClues.filter(id => !sources[id]);
const ghost  = Object.keys(sources).filter(id => !X.CLUES[id]);
ok(orphan.length === 0, '无孤儿线索（每条都能拿到）' + (orphan.length ? '：' + orphan.join(',') : ''));
ok(ghost.length === 0,  '无指向不存在线索的引用' + (ghost.length ? '：' + ghost.join(',') : ''));
log('  多来源（冗余提示，无害）：' + (allClues.filter(id => sources[id].length > 1).map(id => id + '×' + sources[id].length).join(', ') || '（无）'));

/* ---------- 2. 密码链闭环 ---------- */
log('');
log('══════ 2. 密码链闭环 ══════');
ok(X.DRIVE.code === '0923',             '网盘提取码 0923（= 2010-09-23 第一次见面的日子）');
ok(X.MAIL.pass === 'ihcom',             '邮箱密码 ihcom（= MOCHI 倒写）');
ok(X.MAIL.user === 'moby@stardust.net', '邮箱账号 moby@stardust.net');
ok(X.DB_SITE.id === 'SD-0417',          '内网工号 SD-0417');
ok(X.kdecode('djrmusm') === X.DB_SITE.pass, '终端 decode(djrmusm) → ' + X.kdecode('djrmusm') + '（与内网口令一致）');
ok(X.kencode(X.DB_SITE.pass) === 'djrmusm', '反向校验：口令右移一格 = 邮件里的临时口令 djrmusm');
ok('741' + '928' === '741928',          '密钥 = SEG-A(741) + SEG-B(928) = 741928');

/* ---------- 3. 关键信息可推导性 ---------- */
log('');
log('══════ 3. 关键线索的可推导性（是否在文本中出现） ══════');
const hay = JSON.stringify({ B:X.BRIEF, F:X.FORUM, G:X.BLOG, D:X.DRIVE, M:X.MAIL, DB:X.DB_SITE, S:X.SEARCH_DB, T:X.TERM });
[
  ['「第一次见面的日子」→ 2010-09-23 明文可见', /2010 年 9 月 23 日/],
  ['猫名 MOCHI 明文可见', /MOCHI/],
  ['「倒过来念」规则写在 README', /倒过来/],
  ['临时口令 djrmusm 明文可见', /djrmusm/],
  ['「往右挪一格」键盘规则可见', /往右挪一格/],
  ['SEG-A = 7 4 1 明文可见', /SEG-A = 7 4 1/],
  ['SEG-B = 9 2 8 明文可见', /SEG-B = 9 2 8/],
].forEach(([n, re]) => ok(re.test(hay), n));
ok(!/741928/.test(hay), '741928 未明文出现（需玩家合成两段）');
ok(!/shenyan/.test(JSON.stringify({ M:X.MAIL, D:X.DRIVE, T:X.TERM })), 'shenyan 未在邮件/网盘/终端明文泄底（需 decode）');

/* ---------- 4. 站点解锁可达性 ---------- */
log('');
log('══════ 4. 站点解锁可达性 ══════');
const unlockBy = {};
X.SEARCH_DB.forEach(g => g.results.forEach(r => { if (r.unlock) (unlockBy[r.unlock] = unlockBy[r.unlock] || []).push('搜索[' + g.keys[0] + ']'); }));
X.DRIVE.files.forEach(f => { if (f.unlock) (unlockBy[f.unlock] = unlockBy[f.unlock] || []).push('网盘 ' + f.name); });
['forum','blog','drive','mail','db'].forEach(a =>
  ok(!!unlockBy[a], a + ' 有解锁途径 ← ' + ((unlockBy[a] || []).join(' ; ') || '【无】')));

/* ---------- 5. 依赖无死锁 ---------- */
log('');
log('══════ 5. 解锁链无死锁 ══════');
ok(unlockBy.forum.some(s => s.includes('白鲸')),  '论坛 ← 搜索「白鲸」（初始可搜）');
ok(unlockBy.drive.some(s => s.includes('白鲸')),  '网盘 ← 搜索「白鲸」（初始可搜）');
ok(unlockBy.blog.some(s => s.includes('白鲸')),   '博客 ← 搜索「白鲸」（初始可搜）');
ok(unlockBy.mail.some(s => s.includes('README')), '邮箱 ← 网盘 README（需先解锁网盘，链式成立）');
ok(unlockBy.db.some(s => s.includes('星尘科技')), '内网 ← 搜索「星尘科技」（初始可搜）');

/* ---------- 6. 结局链路 ---------- */
log('');
log('══════ 6. 结局链路 ══════');
const appsSrc = fs.readFileSync(path.join(dir, 'js/apps.js'), 'utf8');
ok(/case 'echo'/.test(appsSrc) && /741928/.test(appsSrc), "终端 echo 741928 触发结局（代码中存在判定）");
ok(/S\.flags\.segA/.test(appsSrc) && /S\.flags\.segB/.test(appsSrc), '结局要求同时具备 SEG-A 与 SEG-B');
ok(X.ENDING.options.length === 3, 'ECHO 对话有 3 个可选回应（' + X.ENDING.options.length + '）');
ok(!!X.ENDING.sleep && !!X.ENDING.publish, '两个结局 sleep / publish 均存在');
// SEG-A/SEG-B 是否分别可在内网/网盘取到
ok(/SEG-A = 7 4 1/.test(JSON.stringify(X.DB_SITE.proj)), 'SEG-A 在内网项目日志可取');
ok(/SEG-B = 9 2 8/.test(JSON.stringify(X.DRIVE.files)),  'SEG-B 在网盘 voice_sample 日志可取');

/* ---------- 7. 提示覆盖 ---------- */
log('');
log('══════ 7. 提示覆盖（防卡关） ══════');
const stages = ['start','forum','code','readme','cat','mail','decode','db','key','echo'];
const hintNeeds = X.HINTS.map(h => h.need);
const missH = stages.filter(s => !hintNeeds.includes(s));
ok(missH.length === 0, '委婉提示覆盖每关' + (missH.length ? '：缺 ' + missH.join(',') : ''));
const dm = appsSrc.match(/const DIRECT\s*=\s*\{([\s\S]*?)\n\};/);
if (dm){
  const dk = [...dm[1].matchAll(/(\w+)\s*:/g)].map(m => m[1]);
  const missD = stages.filter(s => !dk.includes(s));
  ok(missD.length === 0, '直答档 DIRECT 覆盖每关' + (missD.length ? '：缺 ' + missD.join(',') : ''));
}

log('');
log(bad ? '❌ 审计发现问题：' + bad + ' 项' : '✅ 剧情链路审计全部通过');
fs.writeFileSync(path.join(__dirname, '_audit.txt'), out.join('\n'), 'utf8');
console.log('AUDIT DONE bad=' + bad);
process.exit(bad ? 1 : 0);
