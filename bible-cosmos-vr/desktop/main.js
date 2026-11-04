// «Библия» для компьютера: окно Electron с той же программой, что в браузере и в APK.
// Файлы отдаются по собственному адресу app://bible/, чтобы работали модули, fetch и IndexedDB
// (с file:// браузер их блокирует). Тексты Библии, как и везде, открываются из ваших EPUB и хранятся только на компьютере.
const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const WEB = path.join(__dirname, 'web');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// Одна копия программы: повторный запуск выводит окно вперёд.
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 560,
    backgroundColor: '#04050c', title: 'Библия', icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true, show: false,
    webPreferences: {
      contextIsolation: true, sandbox: true, spellcheck: false,
      // чтение вслух продолжается, когда окно свёрнуто
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://bible/index.html');
  // Ссылки на сайты открываются в обычном браузере
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('app://bible/')) return;
    e.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });
  // F11 — во весь экран, Ctrl + / Ctrl − / Ctrl 0 — масштаб
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    const wc = win.webContents;
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+') { wc.setZoomLevel(wc.getZoomLevel() + 0.5); e.preventDefault(); }
      if (input.key === '-') { wc.setZoomLevel(wc.getZoomLevel() - 0.5); e.preventDefault(); }
      if (input.key === '0') { wc.setZoomLevel(0); e.preventDefault(); }
    }
  });
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(WEB, p));
    if (!file.startsWith(WEB + path.sep)) return new Response('Not found', { status: 404 });
    try {
      const body = await fs.promises.readFile(file);
      return new Response(body, { headers: { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { for (const e of engines.values()) e.kill(); });

/* ---------- Нейросетевой голос: Piper (работает на компьютере, без интернета) ---------- */
// Синтезатор и голоса кладутся в ресурсы программы при сборке (Windows и Linux).
// Если их нет или Piper не запустится, программа читает голосами системы.
const RES = app.isPackaged ? process.resourcesPath : __dirname;
const PIPER_DIR = path.join(RES, 'piper');
const PIPER = path.join(PIPER_DIR, process.platform === 'win32' ? 'piper.exe' : 'piper');
const VOICE_DIR = path.join(RES, 'voices');
const VOICES = [
  { id: 'ru-irina', lang: 'ru', file: 'ru_RU-irina-medium.onnx', label_ru: 'Ирина — нейросетевой голос', label_ro: 'Irina — voce neuronală' },
  { id: 'ro-mihai', lang: 'ro', file: 'ro_RO-mihai-medium.onnx', label_ru: 'Михай — нейросетевой голос', label_ro: 'Mihai — voce neuronală' },
];
const availableVoices = () => (fs.existsSync(PIPER)
  ? VOICES.filter((v) => fs.existsSync(path.join(VOICE_DIR, v.file)) && fs.existsSync(path.join(VOICE_DIR, v.file + '.json')))
  : []);

// Один процесс Piper на голос и скорость: модель загружается один раз, каждая строка — отдельный WAV-файл.
class PiperEngine {
  constructor(voice, scale) {
    this.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bible-voice-'));
    this.jobs = [];
    this.dead = false;
    this.proc = spawn(PIPER, ['--model', path.join(VOICE_DIR, voice.file), '--output_dir', this.dir,
      '--length_scale', scale.toFixed(3), '--sentence_silence', '0.3'], {
      cwd: PIPER_DIR, windowsHide: true,
      env: { ...process.env, LD_LIBRARY_PATH: [PIPER_DIR, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
    });
    let buf = '';
    this.proc.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line && /\.wav$/i.test(line)) { const job = this.jobs.shift(); if (job) job.resolve(line); }
      }
    });
    this.proc.stderr.on('data', () => {});
    const fail = (err) => { this.dead = true; for (const j of this.jobs.splice(0)) j.reject(err || new Error('piper')); };
    this.proc.on('error', fail);
    this.proc.on('exit', () => fail(new Error('piper exited')));
    this.proc.stdin.on('error', () => {});
  }
  synth(text) {
    if (this.dead) return Promise.reject(new Error('piper'));
    return new Promise((resolve, reject) => {
      const job = { resolve, reject };
      const timer = setTimeout(() => { const k = this.jobs.indexOf(job); if (k >= 0) this.jobs.splice(k, 1); reject(new Error('timeout')); }, 60000);
      job.resolve = (v) => { clearTimeout(timer); resolve(v); };
      job.reject = (e) => { clearTimeout(timer); reject(e); };
      this.jobs.push(job);
      this.proc.stdin.write(String(text).replace(/[\r\n]+/g, ' ').trim() + '\n', 'utf8');
    }).then(async (file) => {
      const data = await readWhole(file);
      fs.promises.unlink(file).catch(() => {});
      return data;
    });
  }
  kill() {
    this.dead = true;
    try { this.proc.kill(); } catch { /* уже закрыт */ }
    fs.promises.rm(this.dir, { recursive: true, force: true }).catch(() => {});
  }
}
// Piper печатает имя файла чуть раньше, чем допишет его: ждём, пока размер совпадёт с заголовком WAV.
async function readWhole(file) {
  for (let i = 0; i < 60; i++) {
    try {
      const data = await fs.promises.readFile(file);
      if (data.length >= 44 && data.toString('ascii', 0, 4) === 'RIFF') {
        const want = data.readUInt32LE(4) + 8;
        if (data.length >= want) return data;
      }
    } catch { /* файл ещё создаётся */ }
    await new Promise((r) => setTimeout(r, 40));
  }
  return fs.promises.readFile(file);
}
const engines = new Map();
function engineFor(voice, rate) {
  const scale = Math.max(0.6, Math.min(1.6, 1 / (Number(rate) || 1)));
  const key = `${voice.id}:${scale.toFixed(2)}`;
  let e = engines.get(key);
  if (!e || e.dead) {
    for (const [k, old] of engines) if (k.startsWith(voice.id + ':')) { old.kill(); engines.delete(k); }
    e = new PiperEngine(voice, scale);
    engines.set(key, e);
  }
  return e;
}
ipcMain.on('tts:info', (event) => { event.returnValue = { voices: availableVoices() }; });
ipcMain.handle('tts:synth', async (event, { text, voice, rate }) => {
  const v = availableVoices().find((x) => x.id === voice);
  if (!v) throw new Error('no voice');
  return engineFor(v, rate).synth(text);
});
