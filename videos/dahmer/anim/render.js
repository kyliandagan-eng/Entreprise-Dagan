// Rendu image par image : node render.js stills t1 t2 ...  |  node render.js video out.mp4 fps fromFrame toFrame
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const ROOT = __dirname; const mode = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.type(), m.text().slice(0, 300)); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.route('http://local/**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); const ct = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream'; try { r.fulfill({ body: fs.readFileSync(f), contentType: ct }); } catch (e) { r.fulfill({ status: 404 }); } });
  const t0 = Date.now();
  await p.goto('http://local/index.html'); await p.waitForFunction(() => window.ready === true, null, { timeout: 300000 });
  console.log('ready in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  const cdp = await p.context().newCDPSession(p);
  const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64');
  if (mode === 'stills') { fs.mkdirSync(ROOT + '/stills', { recursive: true }); for (const s of process.argv.slice(3)) { const a = Date.now(); await p.evaluate(t => renderAt(t), +s); fs.writeFileSync(`${ROOT}/stills/s_${s}.png`, await shot()); console.log('still', s, Date.now() - a, 'ms'); } await b.close(); return; }
  const out = process.argv[3], fps = +process.argv[4], from = +process.argv[5], to = +process.argv[6];
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const st = Date.now();
  for (let i = from; i < to; i++) { await p.evaluate(t => renderAt(t), i / fps); const buf = await shot(); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if ((i - from) % 50 === 0) console.log('frame', i, '/', to, ((Date.now() - st) / 1000).toFixed(0) + 's'); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out, ((Date.now() - st) / 1000).toFixed(0) + 's');
})();
