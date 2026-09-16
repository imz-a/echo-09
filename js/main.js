/* ============================================================
   ECHO-09 · main.js
   引导层：开机序列 / 存档载入 / 顶栏交互
   ============================================================ */

const BOOT_LINES = [
  { t:'ARCHIVIST OS 0.9.4 · 正在启动', cls:'dim', w:9 },
  { t:'挂载本地缓存 …………………… [ OK ]', cls:'ok', w:7 },
  { t:'连接 搜鸿搜索 快照服务（2011-09）… [ OK ]', cls:'ok', w:7 },
  { t:'校验委托信签名 ………………… [ OK ]', cls:'ok', w:7 },
  { t:'警告：系统时间已被锁定在 2011-08-17 02:14', cls:'warn', w:11 },
  { t:'匿名委托载入完成：1 封 / 1 个名字', cls:'dim', w:9 },
  { t:'准备就绪。', cls:'ok', w:6 }
];

function boot(){
  const box = $('#bootLines'), bar = $('#bootBar'), cta = $('#bootCta');
  let i = 0, p = 0;

  (function step(){
    if (i >= BOOT_LINES.length){
      cta.classList.add('show');
      const enter = () => {
        document.removeEventListener('keydown', enter);
        $('#boot').style.transition = 'opacity .5s';
        $('#boot').style.opacity = '0';
        setTimeout(() => {
          $('#boot').classList.add('hidden');
          $('#desktop').classList.remove('hidden');
          afterBoot();
        }, 500);
      };
      document.addEventListener('keydown', enter);
      $('#boot').addEventListener('click', enter);
      return;
    }
    const l = BOOT_LINES[i++];
    const d = document.createElement('div');
    d.className = l.cls;
    box.appendChild(d);
    let t = 0;
    const timer = setInterval(() => {
      d.textContent = l.t.slice(0, ++t);
      p = Math.min(100, p + 100 / (BOOT_LINES.join('').length / 2.2));
      bar.style.width = p + '%';
      if (t % 4 === 0) beep(1400 + Math.random() * 500, .008, 'square');
      if (t >= l.t.length){ clearInterval(timer); setTimeout(step, l.w * 22); }
    }, 12);
  })();
}

function afterBoot(){
  const had = load();
  hydrateIcons(document);
  buildDock(); buildIcons(); renderMenubar(); renderClock();
  setInterval(renderClock, 15000);

  if (had && (S.clues.length || S.end)){
    toast('已载入上次进度：线索 ' + S.clues.length + '/' + TOTAL_CLUES, 'good');
    if (!S.seen){ S.seen = true; save(); openApp('brief'); }
  } else {
    S.start = Date.now(); save();
    setTimeout(() => openApp('brief'), 400);
  }
  if (S.end) setTimeout(() => Ending.finish(S.end), 700);

  // 顶栏
  const soundBtn = () => {
    $('#mbSoundIc').innerHTML = icon(S.sound ? 'volume' : 'mute', 15);
    $('#mbSoundTx').textContent = S.sound ? '音效' : '静音';
  };
  $('#mbSound').onclick = () => {
    S.sound = !S.sound; save(); sfx.click(); soundBtn();
    toast(S.sound ? '音效已开启' : '音效已关闭', '', S.sound ? 'volume' : 'mute');
  };
  soundBtn();

  $('#mbSave').onclick = () => { save(); sfx.ok(); toast('进度已保存到本机', 'good'); };

  $('#mbReset').onclick = () => {
    modal('<h2>重新开始？</h2><div class="sub">这会清空全部线索、解锁与结局记录</div>' +
      '<p>你确定要抹掉这次调查的全部进度吗？此操作不可撤销。</p>' +
      '<div class="acts"><button class="btn ghost" id="mNo">取消</button>' +
      '<button class="btn primary" id="mYes">清空并重新开始</button></div>');
    $('#mNo').onclick = closeModal;
    $('#mYes').onclick = () => { resetSave(); location.reload(); };
  };

  $('#mbHelp').onclick = () => {
    modal('<h2>怎么玩</h2><div class="sub">ECHO-09 · 回声档案 · 网页解密游戏（WIG）</div>' +
      '<p><b>你是谁：</b>一名档案调查员。一封匿名委托给了你一个名字——沈砚，网名"白鲸"。她在 2011 年 8 月 17 日 02:14 之后，从互联网上消失了。</p>' +
      '<p><b>你要做什么：</b>在这台拟真的旧电脑里，使用搜索引擎、论坛、网盘、邮箱、企业内网和终端，把散落的信息拼成真相。密码不在别处，就在已经写下的文字里。</p>' +
      '<p><b>怎么推进：</b>搜索 → 发现新站点 → 找到密码 → 解锁下一层。共 5 道密码锁、' + TOTAL_CLUES + ' 条线索、2 个结局。</p>' +
      '<div class="hint-box">卡住超过十分钟，就打开「线索板」要一条提示。这游戏不考你运气，考你有没有注意到那句话。</div>' +
      '<p style="color:var(--txt-3);font-size:12.5px">建议：准备纸笔（或用线索板）、戴耳机、把灯关小一点。</p>' +
      '<div class="acts"><button class="btn primary" id="mOk">开始</button></div>');
    $('#mOk').onclick = closeModal;
  };

  // 快捷键
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ closeModal(); Object.keys(WM.open).forEach(k => { if (k !== 'brief') closeWin(k); }); }
  });
  // 窗口尺寸变化时不越界
  window.addEventListener('resize', () => {
    Object.values(WM.open).forEach(w => {
      w.style.left = Math.min(parseFloat(w.style.left) || 40, Math.max(10, window.innerWidth - 120)) + 'px';
    });
  });
}

/* 首次进入：如果 URL 带 #reset 直接清档（方便重玩） */
if (location.hash === '#reset'){ localStorage.removeItem(SAVE_KEY); }

document.addEventListener('DOMContentLoaded', () => {
  const clue = $('#mbClueTx') || $('#mbClue');
  if (clue) clue.textContent = '线索 0/' + TOTAL_CLUES;
  boot();
});
