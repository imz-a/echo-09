/* ============================================================
   ECHO-09 · apps.js
   视图层：各拟真站点的渲染器（数据来自 data.js）
   ============================================================ */

const Apps = {};

/* 关键词高亮 + 可点击（把文字变成可检索的入口） */
const KW_LIST = ['MOBY','白鲸','0923','MOCHI','麻薯','云雀网盘','SD-0417','ECHO','星尘科技','沈砚','djrmusm','DECEASED','741928','928','741'];
// 单次正则替换（按长度降序），避免多轮替换把已生成的标签再次匹配导致 HTML 破损
const KW_RE = new RegExp(
  '(' + KW_LIST.slice().sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
function mark(txt){
  return esc(txt).replace(KW_RE, '<span class="kw" data-kw="$1">$1</span>');
}
function bindKw(root){
  $$('.kw', root).forEach(el => el.onclick = e => {
    e.stopPropagation();
    openApp('search', { q: el.dataset.kw });
  });
}
/* 头像配色：低饱和暖色，避免高亮荧光破坏整体调性 */
const AV_COLORS = ['#d8a34a','#7fa894','#c58a8a','#8a94ad','#a89a6f','#6f8f9c','#b07a5f'];
function avColor(name){
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

/* ============================================================
   委托信
   ============================================================ */
Apps.brief = {
  render(w){
    $('.win-body', w).className = 'win-body pad';
    $('.win-body', w).innerHTML =
      '<div class="bl-head" style="padding:22px 0 16px;background:none;border:none;text-align:left">' +
        '<div class="bl-title" style="font-size:20px">' + esc(BRIEF.title) + '</div>' +
        '<div class="bl-sub" style="letter-spacing:1px">' + esc(BRIEF.meta) + '</div>' +
      '</div>' +
      '<div class="bl-full"><div class="e" style="font-family:var(--mono);font-size:13px;line-height:2.05">' + esc(BRIEF.body) + '</div></div>' +
      '<div style="display:flex;gap:9px;margin-top:18px;flex-wrap:wrap">' +
        '<button class="btn primary" id="bStart">开始调查（打开搜鸿搜索）</button>' +
        '<button class="btn ghost" id="bNotes">打开线索板</button>' +
      '</div>';
    $('#bStart', w).onclick = () => openApp('search');
    $('#bNotes', w).onclick = () => openApp('notes');
  }
};

/* ============================================================
   搜鸿搜索
   ============================================================ */
Apps.search = {
  render(w, params){
    const body = $('.win-body', w);
    body.className = 'win-body';
    body.innerHTML =
      '<div class="se-head">' +
        '<div class="se-logo">搜 鸿</div>' +
        '<div class="se-sub">HONGSO · 收录中文网页 1,204,882,017 条 · 快照截至 2011-09</div>' +
        '<div class="se-form">' +
          '<input type="text" id="seInput" placeholder="输入关键词，回车检索" autocomplete="off">' +
          '<button class="btn primary" id="seGo">检索</button>' +
        '</div>' +
        '<div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap;align-items:center">' +
          '<span style="font-size:11.5px;color:var(--txt-3);margin-right:2px">试试：</span>' +
          ['白鲸','沈砚','星尘科技','回声','麻薯','阿澈'].map(k =>
            '<span class="tag acc" style="cursor:pointer" data-chip="' + k + '">' + k + '</span>').join('') +
        '</div>' +
      '</div>' +
      '<div id="seOut"></div>';

    const input = $('#seInput', w), out = $('#seOut', w);

    const doSearch = q => {
      q = (q || '').trim();
      if (!q) return;
      sfx.click();
      grantAch('first_search');
      const ql = q.toLowerCase();
      let hits = [];
      SEARCH_DB.forEach(g => {
        if (g.keys.some(k => ql.includes(k.toLowerCase()) || k.toLowerCase().includes(ql))){
          g.results.forEach(r => { if (!hits.includes(r)) hits.push(r); });
        }
      });
      if (!hits.length){
        out.innerHTML =
          '<div class="se-empty">没有找到与「' + esc(q) + '」相关的结果。<br>' +
          '换一个名字试试。她用过的名字不止一个。<br><br>' +
          '<span style="color:var(--txt-3)">可用的检索词：' +
          ['白鲸','沈砚','星尘科技','回声','麻薯','阿澈','SD-0417','help'].map(k => '<code>' + k + '</code>').join(' ') +
          '</span></div>';
        return;
      }
      out.innerHTML =
        '<div class="se-count">找到约 ' + hits.length + ' 条结果（用时 0.0' + (10 + Math.floor(Math.random() * 80)) + ' 秒）</div>' +
        '<div class="se-res">' + hits.map((r, i) => {
          let lock = '';
          const lk = icon('lock', 13);
          if (r.open && r.open.app === 'drive' && !S.solved.drive) lock = '<div class="se-lock">' + lk + ' 该分享需要 4 位提取码</div>';
          if (r.open && r.open.app === 'mail' && !S.solved.mail) lock = '<div class="se-lock">' + lk + ' 需要账号与密码</div>';
          if (r.open && r.open.app === 'db' && !S.solved.db)   lock = '<div class="se-lock">' + lk + ' 需要工号与内网口令</div>';
          return '<div class="se-item" data-i="' + i + '">' +
            '<div class="se-url"><span class="av"></span>' + esc(r.url) + '</div>' +
            '<div class="se-t">' + esc(r.title) + '</div>' +
            '<div class="se-d">' + esc(r.desc) + '</div>' + lock +
          '</div>';
        }).join('') + '</div>';

      $$('.se-item', out).forEach(el => {
        el.onclick = () => {
          const r = hits[+el.dataset.i];
          sfx.click();
          if (r.clue) addClue(r.clue);
          if (r.unlock) unlockApp(r.unlock);
          if (r.open) openApp(r.open.app, r.open);
        };
      });
    };

    $('#seGo', w).onclick = () => doSearch(input.value);
    input.onkeydown = e => { if (e.key === 'Enter') doSearch(input.value); sfx.type(); };
    $$('[data-chip]', body).forEach(c => c.onclick = () => { input.value = c.dataset.chip; doSearch(c.dataset.chip); });

    if (params && params.q){ input.value = params.q; doSearch(params.q); }
    else {
      out.innerHTML = '<div class="se-empty">在上方输入一个名字，开始这次检索。<br>' +
        '<span style="color:var(--txt-3)">提示：委托信里给了你两个——一个真名，一个网名。</span></div>';
    }
    setTimeout(() => input.focus(), 60);
  }
};

/* ============================================================
   深蓝 BBS
   ============================================================ */
Apps.forum = {
  render(w, params){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (params && params.thread) return this.thread(w, params.thread);
    this.list(w);
  },
  list(w){
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="fm-head">' +
        '<div class="fm-name">深蓝 <span>BBS</span></div>' +
        '<div class="fm-meta">' + esc(FORUM.sub) + '</div>' +
      '</div>' +
      '<div class="fm-tabs">' + FORUM.boards.map((b, i) =>
        '<div class="fm-tab ' + (i === 0 ? 'on' : '') + '" data-b="' + b.id + '">' + esc(b.name) + '</div>').join('') +
      '</div>' +
      '<div class="fm-list" id="fmList"></div>';

    const draw = bid => {
      const rows = FORUM.threads.filter(t => t.board === bid);
      $('#fmList', body).innerHTML = rows.length ? rows.map(t =>
        '<div class="fm-row ' + (t.pin ? 'pin' : '') + '" data-t="' + t.id + '">' +
          '<span class="num">' + (t.pin ? '★' : '·') + '</span>' +
          '<span class="ttl">' + esc(t.title) + '</span>' +
          '<span class="au">' + esc(t.author) + '</span>' +
          '<span class="rp">' + t.replies + '</span>' +
          '<span class="dt">' + t.date.slice(5) + '</span>' +
        '</div>').join('') : '<div style="padding:32px;text-align:center;color:var(--txt-3);font-size:13px">本版暂无主题</div>';
      $$('#fmList .fm-row', body).forEach(r => r.onclick = () => { sfx.click(); this.thread(w, r.dataset.t); });
    };
    $$('.fm-tab', body).forEach(t => t.onclick = () => {
      $$('.fm-tab', body).forEach(x => x.classList.remove('on'));
      t.classList.add('on'); draw(t.dataset.b);
    });
    draw(FORUM.boards[0].id);
  },
  thread(w, id){
    const t = FORUM.threads.find(x => x.id === id);
    if (!t) return;
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="fm-head">' +
        '<div class="fm-name" style="font-size:14px">深蓝 <span>BBS</span> › 主题</div>' +
        '<div class="fm-meta"><span id="fmBack" class="back-link">' + icon('back', 13) + '返回版块</span></div>' +
      '</div>' +
      '<div class="fm-post">' +
        '<div class="fm-ptitle">' + esc(t.title) + '</div>' +
        '<div class="fm-pmeta"><span>楼主：' + esc(t.author) + '</span><span>发布于 ' + t.date + '</span><span>' + t.replies + ' 回复</span>' +
          (t.pin ? '<span class="tag warn">置顶</span>' : '') + '</div>' +
        t.posts.map(p => {
          if (p.deleted) return '<div class="post deleted"><div class="post-main">' + esc(p.tx) + '</div></div>';
          const col = avColor(p.au);
          return '<div class="post">' +
            '<div class="avatar" style="background:' + col + '">' + esc(p.au.slice(0, 1)) + '</div>' +
            '<div class="post-main">' +
              '<div class="post-hd">' +
                '<span class="post-au">' + esc(p.au) + '</span>' +
                '<span class="post-lv">' + esc(p.lv) + '</span>' +
                (p.flag === 'lastpost' ? '<span class="post-fl">最后在线</span>' : '') +
                '<span class="post-dt">' + esc(p.dt) + '</span>' +
              '</div>' +
              '<div class="post-tx">' + mark(p.tx) + '</div>' +
              (p.img ? '<div class="quote">' + icon('image', 14) + '<span>' + esc(p.img.cap) + '</span></div>' : '') +
              (p.sig ? '<div class="post-sig">' + esc(p.sig) + '</div>' : '') +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    $('#fmBack', body).onclick = () => { sfx.click(); this.list(w); };
    bindKw(body);
    // 读完帖子给线索
    t.posts.forEach(p => { if (p.clue) addClue(p.clue); });
    body.scrollTop = 0;
  }
};

/* ============================================================
   云雀网盘
   ============================================================ */
Apps.drive = {
  render(w, params){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (!S.solved.drive) return this.lock(w);
    this.files(w);
  },
  lock(w){
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="dr-head">' +
        '<div class="dr-logo">' + icon('cloud', 22) + '</div>' +
        '<div><div class="dr-name">云雀网盘</div><div class="dr-sub">YUNQ PAN · 分享者 MOBY · 4 个文件</div></div>' +
      '</div>' +
      '<div class="dr-body"><div class="dr-lock">' +
        '<div class="big">' + icon('lock', 34) + '</div>' +
        '<p>该分享设置了提取码。<br>分享说明写着：<b>「' + esc(DRIVE.shareNote) + '」</b><br>' +
        '<span style="color:var(--txt-3);font-size:12px">（4 位数字）</span></p>' +
        '<div class="dr-code"><input type="text" id="drCode" maxlength="4" placeholder="····" autocomplete="off"></div>' +
        '<div id="drMsg"></div>' +
        '<button class="btn primary" id="drGo" style="margin-top:6px">提取文件</button>' +
      '</div></div>';
    const inp = $('#drCode', w);
    $('#drGo', w).onclick = () => {
      const v = (inp.value || '').trim();
      if (v === DRIVE.code){
        S.solved.drive = true; save(); refreshLive(); sfx.ok();
        toast('提取码正确，文件已解锁', 'good', 'check');
        addClue('c_code');
        this.render(w);
      } else {
        sfx.bad();
        $('#drMsg', w).innerHTML = '<div class="err-box" style="text-align:left">提取码错误。她说过，这个数字是一个"日子"。</div>';
      }
    };
    inp.onkeydown = e => { if (e.key === 'Enter') $('#drGo', w).click(); };
    setTimeout(() => inp.focus(), 60);
  },
  files(w){
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="dr-head">' +
        '<div class="dr-logo">' + icon('cloud', 22) + '</div>' +
        '<div><div class="dr-name">云雀网盘 · moby_last</div><div class="dr-sub">提取码 0923 · 有效期：直到有人找到为止</div></div>' +
      '</div>' +
      '<div class="dr-body">' +
        '<div class="ok-box">' + icon('check', 14) + '<span>提取成功。共 4 个文件，最后修改时间均为 2011-08-17 01:5x。</span></div>' +
        '<div class="sec-title">文件列表</div>' +
        '<div class="dr-files">' + DRIVE.files.map(f =>
          '<div class="dr-file" data-f="' + f.id + '">' +
            '<div class="fi">' + icon(f.icon, 18) + '</div>' +
            '<div class="fn">' + esc(f.name) + '</div>' +
            '<div class="fs">' + f.size + '</div>' +
          '</div>').join('') + '</div>' +
        '<div id="drView" style="margin-top:16px"></div>' +
      '</div>';
    $$('.dr-file', body).forEach(el => el.onclick = () => {
      sfx.click();
      const f = DRIVE.files.find(x => x.id === el.dataset.f);
      $$('.dr-file', body).forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      const v = $('#drView', body);
      if (f.type === 'img'){
        v.innerHTML =
          '<div class="sec-title">' + esc(f.name) + '</div>' +
          '<div style="border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)">' +
            '<img src="assets/img/mochi.jpg" alt="MOCHI" style="display:block;width:100%;height:248px;object-fit:cover">' +
            '<div style="padding:11px 15px;font-size:12px;color:var(--txt-3);font-family:var(--mono)">' + esc(f.cap) + '</div>' +
          '</div>';
      } else {
        const html = f.content.split('\n').map(l => {
          let cls = '';
          if (/^\[/.test(l)) cls = 'c';
          else if (/^#|^>/.test(l)) cls = 'h';
          else if (/WARNING|PURGE|DECEASED|未提交|关闭|注销/.test(l)) cls = 'r';
          return '<div class="' + cls + '">' + esc(l || ' ') + '</div>';
        }).join('');
        v.innerHTML = '<div class="sec-title">' + esc(f.name) + '</div><div class="file-view">' + html + '</div>';
      }
      if (f.clue) addClue(f.clue);
      if (f.id === 'f1'){ S.flags.readme = true; save(); }
      if (f.id === 'f3'){ S.flags.segB = true; save(); }
      if (f.unlock) unlockApp(f.unlock);
      if (v.scrollIntoView) v.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  }
};

/* ============================================================
   回声小站（博客）
   ============================================================ */
Apps.blog = {
  render(w, params){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (params && params.post) return this.post(w, params.post);
      body.innerHTML =
      '<div class="bl-head has-cover">' +
        '<div class="bl-title">' + esc(BLOG.title) + '</div>' +
        '<div class="bl-sub">' + esc(BLOG.sub) + '</div>' +
      '</div>' +
      '<div class="bl-body">' +
        BLOG.posts.map(p =>
          '<div class="bl-post" data-p="' + p.id + '">' +
            '<div class="t">' + esc(p.t) + '</div>' +
            '<div class="m">' + esc(p.d) + '</div>' +
            '<div class="e">' + esc(p.e.slice(0, 62).replace(/\n/g, ' ')) + '……</div>' +
          '</div>').join('') +
        '<div style="text-align:center;color:var(--txt-3);font-size:11.5px;margin-top:26px">— 留言板已关闭 —</div>' +
      '</div>';
    $$('.bl-post', body).forEach(el => el.onclick = () => { sfx.click(); this.post(w, el.dataset.p); });
  },
  post(w, id){
    const p = BLOG.posts.find(x => x.id === id);
    if (!p) return;
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="bl-head" style="padding:22px 20px">' +
        '<div class="bl-title" style="font-size:17px">' + esc(BLOG.title) + '</div>' +
        '<div class="bl-sub" style="letter-spacing:1px"><span id="blBack" class="back-link">' + icon('back', 13) + '返回文章列表</span></div>' +
      '</div>' +
      '<div class="bl-body"><div class="bl-full">' +
        '<div class="t">' + esc(p.t) + '</div>' +
        '<div class="m">' + esc(p.d) + '</div>' +
        '<div class="e">' + mark(p.e) + '</div>' +
      '</div></div>';
    $('#blBack', body).onclick = () => this.render(w);
    bindKw(body);
    if (p.clue) addClue(p.clue);
    body.scrollTop = 0;
  }
};

/* ============================================================
   星尘邮箱
   ============================================================ */
Apps.mail = {
  render(w){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (!S.solved.mail) return this.login(w);
    this.inbox(w);
  },
  login(w){
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="ml-login">' +
        '<h3>星尘邮箱 WebMail</h3>' +
        '<p>企业邮箱登录入口。<br><span style="color:var(--txt-3)">需要账号与密码。她把它们写在了一个只有熟人看得懂的地方。</span></p>' +
        '<div class="ml-field"><label>邮箱账号</label><input type="text" id="mlU" placeholder="name@stardust.net" autocomplete="off"></div>' +
        '<div class="ml-field"><label>密码</label><input type="password" id="mlP" placeholder="•••••"></div>' +
        '<div id="mlMsg"></div>' +
        '<button class="btn primary" id="mlGo" style="width:100%;margin-top:8px">登 录</button>' +
      '</div>';
    const go = () => {
      const u = ($('#mlU', w).value || '').trim().toLowerCase();
      const p = ($('#mlP', w).value || '').trim().toLowerCase();
      if ((u === 'moby@stardust.net' || u === 'moby' || u === 'sd-0417') && p === MAIL.pass){
        S.solved.mail = true; save(); refreshLive(); sfx.ok();
        toast('登录成功：' + MAIL.user, 'good', 'check');
        this.render(w);
      } else {
        sfx.bad();
        $('#mlMsg', w).innerHTML = '<div class="err-box">账号或密码错误。<br>提示：密码不是"密码"，是她的生活。</div>';
      }
    };
    $('#mlGo', w).onclick = go;
    $('#mlP', w).onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => $('#mlU', w).focus(), 60);
  },
  inbox(w, folder){
    const body = $('.win-body', w);
    folder = folder || 'inbox';
    const mails = MAIL.mails.filter(m => m.folder === folder);
    body.innerHTML =
      '<div class="ml-wrap">' +
        '<div class="ml-side">' +
          '<div style="padding:6px 20px 12px;font-size:12px;color:var(--acc)">' + esc(MAIL.user) + '</div>' +
          MAIL.folders.map(f =>
            '<div class="ml-folder ' + (f.id === folder ? 'on' : '') + '" data-f="' + f.id + '">' +
              '<span>' + esc(f.name) + '</span><span class="c">' + MAIL.mails.filter(m => m.folder === f.id).length + '</span>' +
            '</div>').join('') +
        '</div>' +
        '<div class="ml-list" id="mlList">' +
          (mails.length ? mails.map((m, i) =>
            '<div class="ml-item ' + (S.flags['read_' + m.id] ? '' : 'unread') + '" data-m="' + m.id + '">' +
              '<div class="row1"><span class="fr">' + esc(m.from.split('<')[0].trim()) + '</span>' +
              '<span class="dt">' + m.dt.slice(5, 16) + '</span></div>' +
              '<div class="sb">' + esc(m.subj) + '</div>' +
            '</div>').join('') : '<div class="ml-empty">此文件夹为空</div>') +
        '</div>' +
        '<div class="ml-read" id="mlRead"><div class="ml-empty">' + icon('mailOpen', 15) + '选择一封邮件</div></div>' +
      '</div>';

    $$('.ml-folder', body).forEach(f => f.onclick = () => { sfx.click(); this.inbox(w, f.dataset.f); });
    $$('.ml-item', body).forEach(el => el.onclick = () => {
      sfx.click();
      $$('.ml-item', body).forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      const m = MAIL.mails.find(x => x.id === el.dataset.m);
      S.flags['read_' + m.id] = true; save();
      el.classList.remove('unread');
      $('#mlRead', body).innerHTML =
        '<div class="ml-subj">' + esc(m.subj) + '</div>' +
        '<div class="ml-from">发件人：<b>' + esc(m.from) + '</b><br>收件人：<b>' + esc(m.to) + '</b><br>时间：<b>' + esc(m.dt) + '</b></div>' +
        '<div class="ml-tx">' + mark(m.body) + '</div>';
      bindKw($('#mlRead', body));
      if (m.clue) addClue(m.clue);
      $('#mlRead', body).scrollTop = 0;
    });
  }
};

/* ============================================================
   星尘内网
   ============================================================ */
Apps.db = {
  render(w, params){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (!S.solved.db) return this.login(w);
    this.tab(w, (params && params.tab) || 'emp');
  },
  login(w){
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="db-login">' +
        '<div class="lg">STARDUST INTRANET</div>' +
        '<h3 style="font-size:19px;color:var(--txt);margin-bottom:8px">员工通道</h3>' +
        '<p style="font-size:12.5px;color:var(--txt-3);margin-bottom:24px;line-height:1.85">' +
          '仅限在职员工访问。所有操作将被记录。<br>口令为本人姓名全拼（小写）。</p>' +
        '<div class="ml-field"><label>工号</label><input type="text" id="dbU" placeholder="SD-0000" autocomplete="off"></div>' +
        '<div class="ml-field"><label>口令</label><input type="password" id="dbP" placeholder="••••••"></div>' +
        '<div id="dbMsg"></div>' +
        '<button class="btn primary" id="dbGo" style="width:100%;margin-top:8px">进入内网</button>' +
      '</div>';
    const go = () => {
      const u = ($('#dbU', w).value || '').trim().toLowerCase();
      const p = ($('#dbP', w).value || '').trim().toLowerCase();
      if ((u === 'sd-0417' || u === '0417' || u === 'sd0417') && p === DB_SITE.pass){
        S.solved.db = true; save(); refreshLive(); sfx.ok();
        toast('内网身份验证通过 · SD-0417', 'good', 'check');
        this.render(w);
      } else {
        sfx.bad();
        $('#dbMsg', w).innerHTML = '<div class="err-box">工号或口令错误。<br>提示：口令是她名字的全拼。</div>';
      }
    };
    $('#dbGo', w).onclick = go;
    $('#dbP', w).onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => $('#dbU', w).focus(), 60);
  },
  tab(w, id){
    if (!DB_SITE.tabs.some(t => t.id === id)) id = 'emp'; // 已登录时忽略 login 等无效标签
    const body = $('.win-body', w);
    body.innerHTML =
      '<div class="db-head"><div class="t">STARDUST INTRANET · v4.2</div>' +
      '<div class="s">当前身份：SD-0417（只读）｜ 会话已记录</div></div>' +
      '<div class="db-tabs">' + DB_SITE.tabs.map(t =>
        '<div class="db-tab ' + (t.id === id ? 'on' : '') + '" data-t="' + t.id + '">' + esc(t.name) + '</div>').join('') + '</div>' +
      '<div class="db-body" id="dbBody"></div>';
    $$('.db-tab', body).forEach(t => t.onclick = () => { sfx.click(); this.tab(w, t.dataset.t); });

    const b = $('#dbBody', body);
    if (id === 'emp'){
      b.innerHTML =
        '<div class="db-card" style="margin-bottom:16px">' +
          '<div class="k">EMPLOYEE RECORD</div>' +
          '<div style="font-size:16px;color:#daeae2;margin:6px 0 14px;letter-spacing:1px">SD-0417</div>' +
          '<div class="db-grid">' + DB_SITE.emp.fields.map(f =>
            '<div class="db-card"><div class="k">' + esc(f.k) + '</div>' +
            '<div class="v' + (f.red ? ' red' : '') + '">' + esc(f.v) + '</div></div>').join('') +
          '</div>' +
        '</div>' +
        '<div class="db-warn">※ ' + esc(DB_SITE.emp.note) + '</div>';
      addClue('c_emprec');
    }
    if (id === 'proj'){
      b.innerHTML = '<div class="db-sec">' +
        esc(DB_SITE.proj.head) + ' ｜ ' + esc(DB_SITE.proj.sub) + '</div>' +
        DB_SITE.proj.logs.map(l =>
          '<div class="db-log ' + (l.red ? 'red' : '') + '">' +
            '<div class="t">' + esc(l.t) + '</div>' +
            '<div class="c' + (l.hi ? ' hi' : '') + '">' + esc(l.c) + '</div>' +
          '</div>').join('');
      addClue('c_sega'); S.flags.segA = true; save();
    }
    if (id === 'corp'){
      b.innerHTML = '<div class="db-sec">' +
        esc(DB_SITE.corp.head) + ' ｜ ' + esc(DB_SITE.corp.sub) + '</div>' +
        '<div class="db-warn" style="margin-bottom:16px">' + esc(DB_SITE.corp.warn) + '</div>' +
        '<div class="db-table">' +
          '<div class="db-tr head"><span>UID</span><span>标记</span><span>时长</span><span>授权</span></div>' +
          DB_SITE.corp.rows.map(r =>
            '<div class="db-tr' + (r.red ? ' red' : '') + '">' +
              '<span>' + esc(r.uid) + '</span><span>' + esc(r.tag) + '</span>' +
              '<span>' + esc(r.dur) + '</span><span>' + esc(r.auth) + '</span>' +
            '</div>').join('') +
        '</div>';
      addClue('c_corpus');
    }
    if (id === 'alarm'){
      b.innerHTML = '<div class="db-sec">' +
        esc(DB_SITE.alarm.head) + ' ｜ ' + esc(DB_SITE.alarm.sub) + '</div>' +
        '<div class="db-warn" style="white-space:pre-wrap;font-family:var(--mono);font-size:12px">' + esc(DB_SITE.alarm.alert) + '</div>';
      addClue('c_alarm');
    }
    body.scrollTop = 0;
  }
};

/* ============================================================
   终端
   ============================================================ */
Apps.term = {
  render(w){
    const body = $('.win-body', w);
    body.className = 'win-body';
    if (w.dataset.termInit) { this.focusInput(w); return; }
    w.dataset.termInit = '1';
    body.innerHTML = '<div id="termOut"></div>' +
      '<div class="term-input"><span>archivist@echo:~$</span><input type="text" id="termIn" autocomplete="off" spellcheck="false"></div>';
    const out = $('#termOut', w);
    this.print(w, [
      { t:'ECHO ARCHIVIST TERMINAL v0.9.4', cls:'sys' },
      { t:'本地缓存已挂载 · 共 ' + TERM.files.length + ' 个文件', cls:'sys' },
      { t:'输入 help 查看可用命令。', cls:'sys' }
    ]);
    const inp = $('#termIn', w);
    inp.onkeydown = e => {
      if (e.key !== 'Enter') return;
      const v = inp.value.trim();
      inp.value = '';
      if (!v) return;
      this.exec(w, v);
    };
    body.onclick = () => inp.focus();
    setTimeout(() => inp.focus(), 60);
  },
  focusInput(w){ const i = $('#termIn', w); if (i) i.focus(); },
  print(w, lines){
    const out = $('#termOut', w);
    lines.forEach(l => {
      const d = document.createElement('div');
      d.className = 'term-line ' + (l.cls || 'out');
      d.textContent = l.t;
      out.appendChild(d);
    });
    const body = $('.win-body', w);
    body.scrollTop = body.scrollHeight;
  },
  exec(w, raw){
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    this.print(w, [{ t:raw, cls:'cmd' }]);
    beep(900, .02, 'square');

    switch (cmd){
      case 'help':
        this.print(w, TERM.help.split('\n').map(l => ({ t:l, cls:'sys' })));
        break;
      case 'ls':
        this.print(w, [{ t:TERM.files.join('   '), cls:'out' }]);
        break;
      case 'cat': {
        const f = DRIVE.files.find(x => x.name === arg);
        if (arg === '.secret'){
          this.print(w, TERM.secret.split('\n').map(l => ({ t:l, cls:'hi' })));
          grantAch('secret');
        } else if (f && f.content){
          this.print(w, [{ t:'（本地缓存副本 · 来源：云雀网盘）', cls:'sys' }]
            .concat(f.content.split('\n').map(l => ({ t:l, cls:'out' }))));
        } else if (arg === 'mochi.jpg'){
          this.print(w, [{ t:'[二进制图片] 326 KB · 一只灰白色的猫 · 属性里写着：MOCHI', cls:'out' }]);
        } else {
          this.print(w, [{ t:'cat: ' + arg + ': 没有该文件（或尚未下载）', cls:'err' }]);
        }
        break;
      }
      case 'decode': {
        if (!arg){ this.print(w, [{ t:'用法：decode <字符串>', cls:'err' }]); break; }
        const r = kdecode(arg.toLowerCase());
        this.print(w, [
          { t:'按"键盘右移"规则还原：', cls:'sys' },
          { t:'  ' + arg + '  →  ' + r, cls:'big' }
        ]);
        if (r === DB_SITE.pass){
          S.flags.decodeTried = true; save();
          this.print(w, [{ t:'✔ 校验通过：该结果可作为内网口令使用。', cls:'hi' }]);
          toast('已还原内网口令', 'good', 'check');
        }
        break;
      }
      case 'echo': {
        const key = arg.replace(/\s/g, '');
        if (key === '741928'){ this.runEnding(w); return; }
        if (!key){ this.print(w, [{ t:'用法：echo <6 位回收密钥>', cls:'err' }]); break; }
        this.print(w, [
          { t:'正在向 ECHO-MAIN 提交回收密钥…', cls:'sys' },
          { t:'✖ 校验失败：密钥不匹配（' + key.length + ' 位）。', cls:'err' },
          { t:'  提示：密钥由两段拼成，先项目、后样本。', cls:'sys' }
        ]);
        sfx.bad();
        break;
      }
      case 'whoami':
        this.print(w, [
          { t:'archivist', cls:'out' },
          { t:'—— 档案调查员。你没有名字，只有一个编号：A-' + String(Math.floor(Math.random() * 9000) + 1000) + '。', cls:'sys' },
          { t:'—— 你和她的区别是：你还关得掉这台机器。', cls:'sys' }
        ]);
        break;
      case 'date':
        this.print(w, [{ t:'系统时间：2011-08-17 02:14（已停止）', cls:'sys' }]);
        break;
      case 'connect':
        this.print(w, [
          { t:'尝试连接 ECHO-MAIN …', cls:'sys' },
          { t:'连接已建立。但需要回收密钥才能进行下一步操作。', cls:'hi' },
          { t:'用法：echo <密钥>', cls:'sys' }
        ]);
        break;
      case 'clear':
        $('#termOut', w).innerHTML = '';
        break;
      default:
        this.print(w, [{ t:'command not found: ' + cmd + ' （输入 help 查看命令）', cls:'err' }]);
    }
  },
  runEnding(w){
    S.flags.connected = true; save();
    this.print(w, [
      { t:'正在向 ECHO-MAIN 提交回收密钥 741928 …', cls:'sys' },
      { t:'✔ 密钥校验通过。', cls:'hi' },
      { t:'正在挂载人格实例 SHEN.YAN …', cls:'sys' }
    ]);
    setTimeout(() => Ending.start(), 900);
  }
};

/* ============================================================
   线索板
   ============================================================ */
const DIRECT = {
  start:  '打开「搜鸿搜索」，输入：白鲸',
  forum:  '打开「深蓝BBS」→《有人最近见过 MOBY 吗》，看阿澈 8/21 的回帖',
  code:   '网盘提取码 = 0923',
  readme: '网盘提取码 0923，进去后打开 README.txt',
  cat:    '邮箱密码 = ihcom（MOCHI 倒过来写）',
  mail:   '收件箱里有一封《内网访问口令重置通知》，口令是 djrmusm',
  decode: '在终端执行：decode djrmusm  →  shenyan',
  db:     '内网账号：工号 SD-0417，口令 shenyan',
  key:    '密钥 = 741 + 928 = 741928',
  keyA:   '云雀网盘 → voice_sample_0817.log → SEG-B = 928；密钥 = 741928',
  keyB:   '内网 → ECHO 项目日志 → SEG-A = 741；密钥 = 741928',
  echo:   '在终端执行：echo 741928',
  done:   '顶栏「重置」重开一局，在最后一步选另一个结局'
};

function currentStage(){
  // 按「当前真正卡在哪一步」推算阶段；每个分支都会跳过玩家已经完成的事，
  // 这样线索板上的提示永远不会停留在已经拿到的信息上。
  if (!S.unlocked.includes('forum') && !S.unlocked.includes('blog')) return 'start';

  if (!S.solved.drive)
    return (S.clues.includes('c_drive') || S.clues.includes('c_code')) ? 'code' : 'forum';

  if (!S.flags.readme) return 'readme';

  if (!S.solved.mail){
    const knowsCat = S.clues.includes('c_mochi') || S.clues.includes('c_mochi2') || S.clues.includes('c_cat');
    return knowsCat ? 'cat' : 'readme';
  }

  if (!S.solved.db){
    // 已经 decode 出 shenyan 了，就不该再提示去 decode
    if (S.flags.decodeTried) return 'db';
    return S.clues.includes('c_pass') ? 'decode' : 'mail';
  }

  if (S.end) return 'done';

  // 已进内网：看密钥两半各拿到了没
  if (S.flags.segA && S.flags.segB) return 'echo';
  if (S.flags.segA) return 'keyB';   // 有前半段，缺样本那一半
  if (S.flags.segB) return 'keyA';   // 有后半段，缺项目那一半
  return 'key';
}

/* 上次渲染时的阶段：用来判断提示是不是「换了新的一条」 */
let _lastNoteStage = null;

function hintText(stage, level){
  const h = HINTS.find(x => x.need === stage) || HINTS[HINTS.length - 1];
  return level === 2 ? (DIRECT[stage] || h.t) : h.t;
}

Apps.notes = {
  render(w){
    const body = $('.win-body', w);
    body.className = 'win-body';
    // 重渲染时保住阅读位置
    const prevPane = $('.nt-body', body);
    const keepScroll = prevPane ? prevPane.scrollTop : 0;
    const pct = Math.round(S.clues.length / TOTAL_CLUES * 100);
    const stage = currentStage();
    const hint = HINTS.find(h => h.need === stage) || HINTS[HINTS.length - 1];
    // 玩家之前点过提示，这次阶段又往前走了 → 自动换成新阶段的提示
    const autoShow = (S.hintLevel || 0) > 0 && stage !== 'done';
    const changed  = autoShow && _lastNoteStage !== null && _lastNoteStage !== stage;

    body.innerHTML =
      '<div class="nt-head">' +
        '<div style="font-size:16px;font-weight:700;color:#e9f0ff">线索板</div>' +
        '<div style="font-size:11.5px;color:var(--txt-3);margin-top:4px">所有已发现的碎片会自动归档在这里</div>' +
        '<div class="nt-prog"><div class="nt-bar"><i style="width:' + pct + '%"></i></div>' +
        '<span class="nt-pct">' + S.clues.length + '/' + TOTAL_CLUES + '</span></div>' +
      '</div>' +
      '<div class="nt-body">' +
        (S.clues.length ? S.clues.slice().reverse().map(id => {
          const c = CLUES[id];
          return '<div class="nt-clue"><div class="h">' +
            '<span class="ic">' + icon(c.ic, 16) + '</span><span class="ti">' + esc(c.ti) + '</span>' +
            '<span class="tm">已归档</span></div>' +
            '<div class="tx">' + esc(c.tx) + '</div></div>';
        }).join('') :
        '<div class="nt-empty">还没有任何线索。<br>去搜索一个名字，故事就开始了。</div>') +
        '<div class="nt-hints">' +
          '<h4>卡住了？</h4>' +
          '<div class="nt-hint-lv">' +
            '<button class="btn sm' + (S.hintLevel === 1 ? ' primary' : '') + '" id="h1">给点提示（委婉）</button>' +
            '<button class="btn sm' + (S.hintLevel === 2 ? ' primary' : '') + '" id="h2">直接告诉我答案</button>' +
            (S.hintLevel ? '<button class="btn sm ghost" id="h0">不用提示了</button>' : '') +
          '</div>' +
          '<div id="hintOut">' + (autoShow ? this._box(stage, S.hintLevel, changed) : '') + '</div>' +
          (autoShow ? '<div class="nt-hint-auto">' + (changed ? '进度有更新，提示已自动换成下一条' : '提示会随进度自动更新') + '</div>' : '') +
        '</div>' +
      '</div>';

    // 滚回原位（重渲染不该把人弹回顶部）
    const pane = $('.nt-body', body);
    if (pane) pane.scrollTop = keepScroll;

    _lastNoteStage = stage;

    const show = (level) => {
      S.hintLevel = level;
      S.hints++; save();
      $('#hintOut', body).innerHTML = this._box(stage, level, false);
      $('.nt-hint-auto', body) && ($('.nt-hint-auto', body).innerHTML = '提示会随进度自动更新');
      sfx.click();
      this.render(w);   // 重画一次，让按钮高亮跟着变
    };
    $('#h1', body).onclick = () => show(1);
    $('#h2', body).onclick = () => show(2);
    const h0 = $('#h0', body);
    if (h0) h0.onclick = () => { S.hintLevel = 0; save(); $('#hintOut', body).innerHTML = ''; this.render(w); sfx.click(); };
  },

  _box(stage, level, flash){
    const txt = hintText(stage, level);
    return '<div class="nt-hint-box' + (flash ? ' flash' : '') + '">' +
      (level === 2 ? icon('key',14) : icon('bulb',14)) + '<span>' + esc(txt) + '</span></div>';
  }
};

/* ============================================================
   结局流程
   ============================================================ */
const Ending = {
  start(){
    const m = $('#modal'), c = $('#modalCard');
    m.classList.remove('hidden');
    c.innerHTML = '<div class="ending"><div class="glyph">' + icon('ripple', 40) + '</div><h2>E C H O</h2>' +
      '<div class="sub">信号已接通 · 实例 SHEN.YAN · 来源 ECHO-MAIN</div>' +
      '<div id="endOut" style="text-align:left;min-height:120px"></div>' +
      '<div id="endOpts" style="display:flex;gap:9px;flex-wrap:wrap;margin-top:18px"></div></div>';
    const out = $('#endOut'), opts = $('#endOpts');

    typeLines(out, ENDING.intro.map(l => ({ t:'[' + l.who + '] ' + l.tx, cls:'big' })), () => {
      opts.innerHTML = ENDING.options.map(o => '<button class="btn" data-o="' + o.id + '">' + esc(o.tx) + '</button>').join('');
      $$('#endOpts .btn').forEach(b => b.onclick = () => {
        const id = b.dataset.o;
        opts.innerHTML = '';
        sfx.click();
        typeLines(out, ENDING.reply[id].map(l => ({ t:'[' + l.who + '] ' + l.tx, cls:'big' })), () => {
          setTimeout(() => {
            typeLines(out, ENDING.main.map(l => ({ t:'[' + l.who + '] ' + l.tx })), () => {
              opts.innerHTML = '<div class="choices">' +
                ENDING.choice.map(ch =>
                  '<button class="choice" data-c="' + ch.id + '">' +
                    '<span class="ci">' + icon(ch.ic, 20) + '</span>' +
                    '<span class="ct"><b>' + esc(ch.tx) + '</b><i>' + esc(ch.hint) + '</i></span>' +
                  '</button>').join('') + '</div>';
              $$('#endOpts [data-c]').forEach(x => x.onclick = () => this.finish(x.dataset.c));
            });
          }, 400);
        });
      });
    });
  },
  finish(id){
    const e = ENDING[id];
    S.end = id; save(); refreshLive();
    if (S.hints === 0) grantAch('no_hint');
    if (Date.now() - S.start < 2 * 3600 * 1000) grantAch('speed');

    const dur = fmtDur(Date.now() - S.start);
    const c = $('#modalCard');
    c.innerHTML = '<div class="ending">' +
      '<div class="glyph">' + icon(e.glyph, 40) + '</div>' +
      '<h2>' + esc(e.title) + '</h2>' +
      '<div class="sub">' + (id === 'sleep' ? '数据已抹除 · 1.21 GB' : '日志已提交 · 27 条记录 / 4,109 条样本') + '</div>' +
      e.lines.map(l => '<p class="line">' + esc(l) + '</p>').join('') +
      '<div class="quote">' + esc(e.quote) + '<span class="who">' + esc(e.who) + '</span></div>' +
      '<p class="line" style="color:var(--txt-2);white-space:pre-wrap">' + esc(e.after) + '</p>' +
      '<div class="stats">' +
        '<div class="stat"><div class="v">' + dur + '</div><div class="l">调查耗时</div></div>' +
        '<div class="stat"><div class="v">' + S.clues.length + '/' + TOTAL_CLUES + '</div><div class="l">线索收集</div></div>' +
        '<div class="stat"><div class="v">' + S.hints + '</div><div class="l">使用提示</div></div>' +
      '</div>' +
      '<div class="sec-title" style="text-align:left">成就</div>' +
      ACHIEVEMENTS.map(a => {
        const got = S.ach.includes(a.id);
        return '<div class="ach ' + (got ? 'got' : '') + '">' +
          '<span class="i">' + icon(got ? a.ic : 'lock', 18) + '</span>' +
          '<span><b>' + esc(a.ti) + '</b> · ' + esc(a.tx) + '</span></div>';
      }).join('') +
      '<div class="acts">' +
        '<button class="btn ghost" id="eClose">留在这里</button>' +
        '<button class="btn primary" id="eAgain">重新开始一次</button>' +
      '</div></div>';
    $('#eClose').onclick = closeModal;
    $('#eAgain').onclick = () => { resetSave(); location.reload(); };
    beep(520, .12, 'sine'); setTimeout(() => beep(780, .2, 'sine'), 140);
  }
};
