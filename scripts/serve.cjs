const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const allowed = new Set(['index.html', 'styles.css', 'questions.js', 'engine.js', 'app.js', 'favicon.svg']);
http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/brain-trials(?=\/|$)/, '').replace(/^\//, '') || 'index.html'; }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (!allowed.has(name)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(root, name), (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    const type = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[path.extname(name)];
    res.writeHead(200, {'Content-Type': `${type}; charset=utf-8`, 'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
