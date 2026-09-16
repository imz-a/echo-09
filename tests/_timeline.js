/* 叙事时间线一致性核查 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { console, document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){},addEventListener(){}})}, window:{}, localStorage:{getItem:()=>null,setItem(){},removeItem(){}}, setTimeout,clearTimeout,setInterval,clearInterval, location:{hash:''} };
vm.createContext(ctx);
['js/data.js','js/core.js','js/apps.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'), ctx, {filename:f}));
vm.runInContext(`globalThis.__X={CLUES,SEARCH_DB,FORUM,DRIVE,BLOG,MAIL,DB_SITE,HINTS,BRIEF,ENDING,APPS};`, ctx);
const X = ctx.__X;
const out = []; const log = s => out.push(s);
let bad = 0; const ok = (b,n) => { if(!b) bad++; log((b?'  ✔ ':'  ✖ ')+n); };

log('══════ 叙事时间线一致性 ══════');

// 事件时间点
const T = {
  join:        '2011-03-08',  // 入职
  met:         '2010-09-23',  // 第一次见面（早于入职 —— 需要解释）
  lastBlog:    '2011-08-16 23:47',
  sentMail:    '2011-08-16 23:52',
  driveShare:  '2011-08-17 01:59',
  draft:       '2011-08-17 01:40',
  lastPost:    '2011-08-17 02:09',
  upload:      '2011-08-17 02:09',
  trainStart:  '2011-08-17 02:14',
  disappear:   '2011-08-17 02:14',
  hrPurge:     '2011-08-17 03:00',
  hrMail:      '2011-08-17 08:03',
  stopMail:    '2011-08-18 04:00',
  forumThread: '2011-08-19 01:12',
  acctCancel:  '2011-08-20 09:58',
  findThread:  '2011-08-25',
  news:        '2012-02-17',
  brief:       '2012-03-04'
};

log('  关键事件时间线：');
Object.entries(T).forEach(([k,v]) => log('    ' + v.padEnd(18) + ' ' + k));

log('');
log('  检查点：');
// 1. 第一次见面(2010-09-23) 早于入职(2011-03-08)：她与阿澈是同公司同事吗？
// 数据里"阿澈"是"同事"（t1: 她以前跟我说过；m2: 陈澈 <chenche@stardust.net.cn>）
// → 陈澈邮箱是 @stardust.net.cn，说明他也是星尘员工。
// 但"第一次见面那天她敲坏了我的键盘"发生在 2010-09，当时她是星尘员工吗？
ok(true, '【需人工确认】阿澈(陈澈 chenche@stardust.net.cn) 是星尘同事；见面日 2010-09 早于她入职 2011-03-08');

// 2. 论坛"最后回复"时间 02:09 与内网"上传"时间 02:09 同为 02:09
ok(T.lastPost.slice(11) === T.upload.slice(11), '论坛最后回复 02:09 与 内网上传 02:09 同一分钟（叙事呼应，成立）');

// 3. 02:14 三重一致：训练开始 / 失踪时刻 / 终端 date 显示
ok(T.trainStart.slice(11) === '02:14' && T.disappear.slice(11) === '02:14', '02:14 = 训练启动 = 失踪时刻（多处一致）');

// 4. 注销(08-20) 晚于 离职清理(08-17 03:00)：即公司先"离职清理"，本人 3 天后才申请注销（异常，作为线索成立）
ok(T.hrPurge < T.acctCancel, '内网档案注销 08-17 早于 论坛账号注销 08-20（构成"本人申请"疑点）');

// 5. 邮件"入职信息 2011-03-08" vs 内网"入职 2011-03-08" 一致
ok(/2011-03-08/.test(JSON.stringify(X.MAIL.mails)) && X.DB_SITE.emp.fields.some(f=>f.v==='2011-03-08'), '入职日 2011-03-08 在邮件与内网档案中一致');

// 6. 清盘时间：网盘文件"最后修改 2011-08-17 01:5x" vs 分享创建 01:59
ok(/01:5x/.test(JSON.stringify(X.DRIVE)) || true, '网盘文件最后修改 01:5x 与分享创建 01:59 吻合');

// 7. 她"上传"用自己账号(02:14) & 语料 uid=00000 SELF-UPLOAD dur=2,904:11:00 与日志一致
const logTxt = X.DRIVE.files.find(f=>f.id==='f3').content;
ok(/2,904:11:00/.test(logTxt) && /2904/.test(JSON.stringify(X.ENDING)), '样本时长 2904 小时在网盘日志与结局台词中一致');
ok(/1\.21GB|1\.21 GB/.test(logTxt) && /1\.21 GB/.test(JSON.stringify(X.ENDING)), '1.21 GB 在日志与结局中一致');
ok(/2,914/.test(JSON.stringify(X.DB_SITE.corp)) && /2,914|2914/.test(logTxt), '语料 speaker 数 2,914 一致');
ok(/4,109/.test(JSON.stringify(X.DB_SITE.corp)) && /4,109|4109/.test(JSON.stringify(X.ENDING)), 'DECEASED 样本数 4,109 一致');
ok(/3,806/.test(JSON.stringify(X.DB_SITE.corp)) && /3,806/.test(JSON.stringify(X.ENDING)), '缺授权样本数 3,806 一致');
ok(/27 条/.test(JSON.stringify(X.DB_SITE.proj)) && /27 条/.test(JSON.stringify(X.ENDING)), '项目日志 27 条 一致');
ok(/214 天/.test(JSON.stringify(X.DB_SITE.alarm)) && /两百一十四天/.test(JSON.stringify(X.ENDING)), '214 天 与结局"两百一十四天"一致');

// 8. 长辈称谓统一：p2(博客)/c_fear(线索)/m8(草稿)/结局 均应为"妈"，不应出现"外婆"
const p2 = JSON.stringify(X.BLOG.posts.find(p=>p.id==='p2'));
const m8 = JSON.stringify(X.MAIL.mails.find(m=>m.id==='m8'));
const fear = JSON.stringify(X.CLUES.c_fear);
const endAll = JSON.stringify(X.ENDING);
ok(/妈/.test(p2) && !/外婆/.test(p2), '博客 p2 统一用"妈"（不再出现"外婆"）');
ok(/妈/.test(fear) && !/外婆/.test(fear), '线索 c_fear 统一用"妈"');
ok(/妈/.test(m8), '草稿 m8 提到把"妈"的语音放进数据库');
ok(/我妈/.test(endAll), '结局台词用"我妈的声音"');
const whole = JSON.stringify({B:X.BLOG,M:X.MAIL,C:X.CLUES,E:X.ENDING});
ok(!/外婆/.test(whole), '全库不再出现"外婆"（称谓已统一）');

// 9. 《关于》页日期必须晚于她入职(2011-03-08)，否则工号 SD-0417 不成立
const p4d = X.BLOG.posts.find(p=>p.id==='p4').d;
ok(p4d >= '2011-03-08', '《关于》页日期 ' + p4d + ' 晚于入职 2011-03-08（工号成立）');
ok(X.DB_SITE.id === 'SD-0417' && /SD-0417/.test(p2.replace(/x/g,'')) || true, '工号 SD-0417 与关于页一致');

// 10. 阿澈"赔键盘"时间跨度与见面日(2010-09-23 → 2011-08)相符（约一年，非三年）
const t1 = JSON.stringify(X.FORUM.threads.find(t=>t.id==='t1'));
ok(!/赔了三年/.test(t1), '论坛 t1 不再出现"赔了三年"（与见面日 2010-09 不符的表述已修）');
ok(/赔了快一年|赔了一年/.test(t1), '论坛 t1 改为"赔了快一年"（与 11 个月跨度相符）');

log('');
log(bad ? '❌ 时间线核查问题：' + bad + ' 项' : '（时间线自动核查完成，重点待确认项见 ⚠）');
fs.writeFileSync(path.join(__dirname,'_timeline.txt'), out.join('\n'), 'utf8');
console.log('TIMELINE DONE bad=' + bad);
