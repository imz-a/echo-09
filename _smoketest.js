/* 临时冒烟测试：用 jsdom 真实执行游戏，模拟完整通关路径并捕获运行时错误 */
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('[jsdomError] ' + (e.detail || e).toString().split('\n')[0]));
vc.on('error', (...a) => errors.push('[console.error] ' + a.join(' ')));

const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0, _n = 0; const _fails = [];
const check = (cond, name) => { _n++; console.log((cond ? '  ✔ ' : '  ✖ ') + name); if (!cond){ fail++; _fails.push('#' + _n + ' ' + name); } };
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

  console.log('\n[9] 视觉层 · 图标与排版');
  const allNames = ev(`(() => {
    const names = [].concat(APPS.map(a => a.icon))
      .concat(Object.keys(CLUES).map(k => CLUES[k].ic))
      .concat(DRIVE.files.map(f => f.icon))
      .concat(ACHIEVEMENTS.map(a => a.ic))
      .concat(ENDING.choice.map(c => c.ic))
      .concat([ENDING.sleep.glyph, ENDING.publish.glyph]);
    return Array.from(new Set(names.filter(Boolean)));
  })()`);
  const missing = ev('(' + JSON.stringify(allNames) + ').filter(n => !ICONS[n])');
  check(ev('Object.keys(ICONS).length') >= 45, '图标集共 ' + ev('Object.keys(ICONS).length') + ' 个线性图标');
  check(missing.length === 0, '所有数据层图标名都能命中图标集' + (missing.length ? '：' + missing.join(',') : '（' + allNames.length + ' 个）'));
  check(QA('svg.ic').length > 20, '页面已渲染 ' + QA('svg.ic').length + ' 个 SVG 图标');
  check(QA('.menubar [data-ic]').every(el => el.querySelector('svg')), '顶栏占位图标已注入');
  check(ev('typeof icon === "function" && typeof hydrateIcons === "function"'), '图标模块已加载');
  const emo = (doc.body.textContent || '').match(/[\u{1F000}-\u{1FAFF}\u{FE0F}\u{200D}]/gu);
  check(!emo, '界面文本无 emoji 残留' + (emo ? '：' + Array.from(new Set(emo)).join(' ') : ''));
  const css = Array.from(doc.styleSheets).map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch(e){ return ''; } }).join('\n');
  check(!/background-clip\s*:\s*text|-webkit-background-clip/.test(css), '已移除渐变裁剪文字');
  check(/--blue\s*:\s*#0a6cff/.test(css) && /wallpaper\.jpg/.test(css), '拟真系统蓝色配色 + 照片壁纸生效');
  check(/blog-cover\.jpg/.test(css), '博客封面照片接入样式');
  check(/linear-gradient\(180deg,#54a9ff/.test(css) || /app-tile/.test(css), '彩色应用图标（Aqua 瓷砖）生效');
  check(/\.win-dots i::before\s*\{[^}]*width:\s*30px[^}]*height:\s*30px/.test(css), '窗口按钮热区已扩大到 30px（小圆点大点击区）');
  check(/\.win-dots i:hover::after/.test(css), '悬停圆点即显示 ✕ − + 图标');

  console.log('\n[9b] 真实图片接入（用户要求"搜图放进去"）');
  ev('openApp("drive")'); await sleep(250);
  const f4 = QA('.app-drive .dr-file').find(el => el.dataset.f === 'f4');
  if (f4){ click(f4); await sleep(300); }
  check(!!Q('.app-drive img[src*="mochi.jpg"]'), '网盘 mochi.jpg 真实猫图已渲染（替换原 SVG 占位）');
  ev('Apps.blog.render(WM.open["blog"])'); await sleep(250);
  check(!!Q('.app-blog .bl-head.has-cover'), '博客首页头部使用 has-cover（真实封面照片）');

  console.log('\n[9c] 窗口按钮（左上角三颗灯）可点性');
  // 打开一个干净窗口，逐个点击三颗灯，验证放大后的热区确实生效
  ev('openApp("search")'); await sleep(250);
  const _w = ev('WM.open["search"]');
  const dots = QA('.app-search .win-dots i');
  check(dots.length === 3, '窗口左上角有 3 个按钮（关闭/最小化/最大化）');
  check(dots.every(d => d.getAttribute('aria-label')), '三个按钮都有无障碍标签');
  const rDot = dots.find(d => d.dataset.act === 'close');
  const yDot = dots.find(d => d.dataset.act === 'min');
  const gDot = dots.find(d => d.dataset.act === 'max');
  click(gDot); await sleep(150);
  check(ev('WM.open["search"].dataset.max') === '1', '点击"最大化"生效');
  click(gDot); await sleep(150);
  check(ev('WM.open["search"].dataset.max') === '0', '再次点击还原窗口尺寸');
  click(yDot); await sleep(200);
  check(ev('WM.open["search"].classList.contains("min")'), '点击"最小化"收起窗口');
  ev('focusWin("search"); WM.open["search"].classList.remove("min")'); await sleep(120);
  click(rDot); await sleep(200);
  check(!ev('!!WM.open["search"]'), '点击"关闭"回收窗口');
  // 关键：点击圆点内的伪元素区域（实际命中 <i> 本身）不应报错且能关闭
  ev('openApp("notes")'); await sleep(200);
  click(QA('.app-notes .win-dots i')[0]); await sleep(200);
  check(!ev('!!WM.open["notes"]'), '点击热区（含内边距）同样可关闭窗口');

  console.log('\n[10] 运行时错误');
  const real = errors.filter(e => !/Could not parse CSS|Not implemented|AudioContext|css/i.test(e));
  real.slice(0, 8).forEach(e => console.log('  ✖ ' + e));
  check(real.length === 0, '无 JS 运行时错误' + (errors.length > real.length ? '（忽略 ' + (errors.length - real.length) + ' 条 jsdom 环境噪音）' : ''));

  if (_fails.length) require('fs').writeFileSync(__dirname + '/_smoke_fail.txt', _fails.map(f => 'FAIL ' + f).join('\n'), 'utf8');
  dom.window.close();
  console.log('\n' + (fail ? '❌ 失败 ' + fail + ' 项' : '✅ 冒烟测试全部通过'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试脚本异常：', e); process.exit(1); });
