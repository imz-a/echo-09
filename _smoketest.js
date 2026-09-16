/* 临时冒烟测试：用 jsdom 真实执行游戏，模拟完整通关路径并捕获运行时错误 */
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('[jsdomError] ' + (e.detail || e).toString().split('\n')[0]));
vc.on('error', (...a) => errors.push('[console.error] ' + a.join(' ')));

const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0;
const check = (cond, name) => { console.log((cond ? '  ✔ ' : '  ✖ ') + name); if (!cond) fail++; };
const waitFor = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 8000)){ if (fn()) return true; await sleep(120); } return false; };

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const win = dom.window, doc = win.document;
  const ev = s => win.eval(s);
  const key = (el, k) => el.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true }));
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const Q  = s => doc.querySelector(s);
  const QA = s => Array.from(doc.querySelectorAll(s));

  console.log('\n[1] 开机序列 → 桌面');
  check(!!Q('#boot'), '引导层存在');
  check(await waitFor(() => Q('#bootCta').classList.contains('show'), 20000), '开机序列播放完毕（出现"按任意键进入"）');
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
  await sleep(1200);
  check(!Q('#desktop').classList.contains('hidden'), '进入桌面');
  check(QA('.dock-btn').length === 4, '初始 Dock 有 4 个应用（委托信/搜索/线索板/终端）');
  check(!!Q('.win[data-app="brief"]'), '委托信自动打开');

  console.log('\n[2] 搜索 → 点击结果解锁站点');
  ev('openApp("search")'); await sleep(200);
  const inp = Q('#seInput');
  check(!!inp, '搜索框渲染');
  inp.value = '白鲸'; key(inp, 'Enter'); await sleep(300);
  check(QA('.se-item').length >= 4, '搜索"白鲸"返回 ' + QA('.se-item').length + ' 条结果');
  QA('.se-item').forEach(el => click(el));          // 依次点击：解锁论坛/博客/网盘并归档线索
  await sleep(400);
  check(QA('.dock-btn').length === 7, '点击结果后 Dock 增至 7 个（解锁论坛/博客/网盘）');

  console.log('\n[3] 论坛');
  ev('openApp("forum"); Apps.forum.list(WM.open["forum"])'); await sleep(250);
  check(QA('.app-forum .fm-row').length > 0, '论坛主题列表渲染（' + QA('.app-forum .fm-row').length + ' 条）');
  ev('Apps.forum.thread(WM.open["forum"], "t1")'); await sleep(250);
  check(QA('.app-forum .post').length >= 5, '主题 t1 渲染 ' + QA('.app-forum .post').length + ' 楼');
  check(ev('S.clues.length') >= 3, '阅读后自动归档线索（当前 ' + ev('S.clues.length') + ' 条）');
  check(QA('.app-forum .post-fl').length === 1, 'MOBY 被折叠的最后回复已标记');

  console.log('\n[4] 网盘 · 提取码 0923');
  ev('openApp("drive")'); await sleep(250);
  check(!!Q('#drCode'), '网盘显示提取码输入');
  const dc = Q('#drCode'); dc.value = '0000'; click(Q('#drGo')); await sleep(200);
  check(!!Q('#drMsg .err-box'), '错误提取码被拒绝');
  dc.value = '0923'; click(Q('#drGo')); await sleep(350);
  check(QA('.app-drive .dr-file').length === 4, '提取码正确 → 4 个文件解锁');
  click(QA('.app-drive .dr-file')[0]); await sleep(300);
  check(QA('.dock-btn').length === 8, 'README.txt 解锁邮箱（Dock 8 个）');
  check(ev('!!S.flags.readme'), 'README 已读标记写入');
  click(QA('.app-drive .dr-file')[2]); await sleep(250);
  check(ev('!!S.flags.segB'), '语音样本日志给出 SEG-B');

  console.log('\n[5] 博客 / 邮箱');
  ev('openApp("blog")'); await sleep(250);
  check(QA('.app-blog .bl-post').length === 4, '博客 4 篇文章');
  ev('Apps.blog.post(WM.open["blog"], "p1")'); await sleep(250);
  check(ev('S.clues.includes("c_mochi2")'), '《麻薯走丢那天》给出猫名线索 MOCHI');
  ev('openApp("mail")'); await sleep(250);
  Q('#mlU').value = 'moby@stardust.net'; Q('#mlP').value = 'wrong'; click(Q('#mlGo')); await sleep(200);
  check(!!Q('#mlMsg .err-box'), '错误密码被拒绝');
  Q('#mlP').value = 'ihcom'; click(Q('#mlGo')); await sleep(350);
  check(QA('.app-mail .ml-item').length === 5, '登录成功 → 收件箱 5 封');
  click(QA('.app-mail .ml-item')[2]); await sleep(250);
  check(!!Q('.app-mail .ml-subj'), '邮件正文渲染');
  check(ev('S.clues.includes("c_pass")'), '读到口令重置邮件（djrmusm）');

  console.log('\n[6] 终端 · 键盘移位解码');
  ev('openApp("term")'); await sleep(250);
  const ti = Q('#termIn');
  ti.value = 'decode djrmusm'; key(ti, 'Enter'); await sleep(300);
  check(Q('#termOut').textContent.includes('shenyan'), 'decode djrmusm → shenyan');
  check(Q('#termOut').textContent.includes('校验通过'), '解码结果被标记为可用口令');
  ti.value = 'cat .secret'; key(ti, 'Enter'); await sleep(300);
  check(ev('S.ach.includes("secret")'), 'cat .secret 触发隐藏成就');
  ti.value = 'echo 000000'; key(ti, 'Enter'); await sleep(250);
  check(Q('#termOut').textContent.includes('校验失败'), '错误密钥被拒绝');

  console.log('\n[7] 内网 · SD-0417 / shenyan');
  // 内网需先搜索「星尘科技」并点击官网结果才会解锁
  ev('openApp("search")'); await sleep(200);
  const inp2 = Q('#seInput'); inp2.value = '星尘科技'; key(inp2, 'Enter'); await sleep(300);
  click(QA('.se-item')[0]); await sleep(300);
  check(QA('.dock-btn').length === 9, '搜索"星尘科技"解锁内网（Dock 9 个）');
  ev('openApp("db")'); await sleep(250);
  Q('#dbU').value = 'SD-0417'; Q('#dbP').value = 'shenyan'; click(Q('#dbGo')); await sleep(350);
  check(QA('.app-db .db-tab').length === 4, '内网登录成功，4 个标签页');
  ev('Apps.db.tab(WM.open["db"], "proj")'); await sleep(250);
  check(Q('.app-db').textContent.includes('SEG-A'), '项目日志含 SEG-A');
  check(ev('!!S.flags.segA && !!S.flags.segB'), '两段密钥齐了（741 + 928 = 741928）');
  ev('Apps.db.tab(WM.open["db"], "corp")'); await sleep(250);
  check(Q('.app-db').textContent.includes('DECEASED'), '语料库页面渲染');

  console.log('\n[8] 线索板与结局');
  ev('openApp("notes")'); await sleep(250);
  check(QA('.app-notes .nt-clue').length === ev('S.clues.length'), '线索板归档 ' + ev('S.clues.length') + ' 条');
  click(Q('#h1')); await sleep(200);
  check(!!Q('#hintOut .nt-hint-box'), '提示系统可用');
  ti.value = 'echo 741928'; key(ti, 'Enter'); await sleep(1500);
  check(!Q('#modal').classList.contains('hidden'), 'ECHO 连接弹层出现');
  check(await waitFor(() => !!Q('#endOpts .btn'), 20000), '出现对话选项');
  click(Q('#endOpts .btn'));                                  // 选择第一个回应
  check(await waitFor(() => !!Q('#endOpts [data-c]'), 30000), '出现结局二选一');
  click(QA('#endOpts [data-c]')[1]);                          // 选择「公之于众」
  await sleep(800);
  const card = Q('#modalCard').textContent;
  check(/结 局/.test(card), '结局卡片渲染');
  check(card.includes('公 之 于 众'), '结局为「公之于众」');
  check(ev('S.end') === 'publish', '结局写入存档');
  check(card.includes('调查耗时') && card.includes('成就'), '结算面板含耗时与成就');

  console.log('\n[9] 运行时错误');
  const real = errors.filter(e => !/Could not parse CSS|Not implemented|AudioContext|css/i.test(e));
  real.slice(0, 8).forEach(e => console.log('  ✖ ' + e));
  check(real.length === 0, '无 JS 运行时错误' + (errors.length > real.length ? '（忽略 ' + (errors.length - real.length) + ' 条 jsdom 环境噪音）' : ''));

  dom.window.close();
  console.log('\n' + (fail ? '❌ 失败 ' + fail + ' 项' : '✅ 冒烟测试全部通过'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试脚本异常：', e); process.exit(1); });
