/* Pages 子路径模拟：把站点挂到 /echo-09/ 前缀下，检查所有资源是否 200 且无 404 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PREFIX = '/echo-09/';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };

const srv = http.createServer((req, res) => {
  let u = req.url.split('?')[0];
  if (!u.startsWith(PREFIX)){ res.writeHead(404); return res.end('NOT UNDER PREFIX'); }
  let rel = u.slice(PREFIX.length);
  if (rel === '' || rel === '/') rel = 'index.html';
  const fp = path.join(ROOT, rel);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()){ res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const base = 'http://127.0.0.1:' + port + PREFIX;
  const out = [];
  const get = p => new Promise(r => {
    http.get(base + p, res => { let n = 0; res.on('data', c => n += c.length); res.on('end', () => r({ p, code: res.statusCode, bytes: n, type: res.headers['content-type'] })); })
      .on('error', e => r({ p, code: 'ERR ' + e.message, bytes: 0 }));
  });

  // 从 index.html 静态解析出所有引用
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]).filter(s => !/^(https?:|data:|#|mailto:)/.test(s));
  out.push('HTML 引用: ' + refs.join(', '));

  for (const r of refs){ const res = await get(r); out.push(`  ${res.code === 200 ? 'OK ' : 'BAD'} ${res.code}  ${res.p}  (${res.bytes}B, ${res.type})`); }

  // CSS 内的 url() 引用（相对于 css/）。先剥离 data: URI，避免把内联 SVG 里的 url(#filter) 误判为文件。
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  const cssNoData = css.replace(/url\(\s*["']?data:[^)]*\)/gi, 'url(DATA)');
  const urls = [...cssNoData.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1])
    .filter(s => !/^(data:|#|%23|DATA$)/i.test(s));
  out.push('CSS url(): ' + urls.join(', '));
  for (const u of urls){
    const rel = u.startsWith('../') ? u.slice(3) : 'css/' + u;
    const res = await get(rel);
    out.push(`  ${res.code === 200 ? 'OK ' : 'BAD'} ${res.code}  ${rel}  (${res.bytes}B)`);
  }

  // apps.js 里的图片引用
  const apps = fs.readFileSync(path.join(ROOT, 'js/apps.js'), 'utf8');
  const imgs = [...apps.matchAll(/src="([^"]+\.(?:jpg|png|svg))"/g)].map(m => m[1]);
  out.push('apps.js img: ' + imgs.join(', '));
  for (const i of imgs){ const res = await get(i); out.push(`  ${res.code === 200 ? 'OK ' : 'BAD'} ${res.code}  ${i}  (${res.bytes}B)`); }

  const bad = out.filter(l => l.includes('BAD') || l.includes('404') || l.includes('ERR'));
  out.push('', bad.length ? ('❌ 有 ' + bad.length + ' 个资源在子路径下失败') : '✅ 子路径下全部资源可访问');
  fs.writeFileSync(path.join(__dirname, '_paths.txt'), out.join('\n'), 'utf8');
  srv.close();
});
