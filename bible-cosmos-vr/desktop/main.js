// «Библия» для компьютера: окно Electron с той же программой, что в браузере и в APK.
// Файлы отдаются по собственному адресу app://bible/, чтобы работали модули, fetch и IndexedDB
// (с file:// браузер их блокирует). Тексты Библии, как и везде, открываются из ваших EPUB и хранятся только на компьютере.
const { app, BrowserWindow, protocol, shell, ipcMain, dialog } = require('electron');
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
  // Боковые кнопки мыши в Windows приходят как команды «вперёд/назад» — это микрофон советника
  win.on('app-command', (e, cmd) => {
    if (cmd === 'browser-forward' || cmd === 'browser-backward') { e.preventDefault(); win.webContents.send('ears:toggle'); }
  });
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

app.whenReady().then(async () => {
  protocol.handle('app', async (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p.startsWith('/__audio/')) return serveAudio(p.slice('/__audio/'.length), req);
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
  scanAudio();
  warmVoices();
  await osVoices.ready();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------- Голос на компьютере ---------- */
// Встроенный в Electron синтезатор речи браузера на Windows не работает («synthesis-failed»),
// поэтому программа сама обращается к голосам системы: Windows — голоса из «Параметры → Речь»
// (и классические SAPI), macOS — команда say, Linux — espeak-ng, если установлен.
// Если в ресурсах программы есть нейросетевой голос Piper, он тоже предлагается.
const RES = app.isPackaged ? process.resourcesPath : __dirname;
const PIPER_DIR = path.join(RES, 'piper');
const PIPER = path.join(PIPER_DIR, process.platform === 'win32' ? 'piper.exe' : 'piper');
const VOICE_DIR = path.join(RES, 'voices');
const PIPER_VOICES = [
  { id: 'piper:ru-irina', lang: 'ru', file: 'ru_RU-irina-medium.onnx', label_ru: 'Ирина — нейросетевой голос (женский)', label_ro: 'Irina — voce neuronală' },
  { id: 'piper:ru-ruslan', lang: 'ru', file: 'ru_RU-ruslan-medium.onnx', label_ru: 'Руслан — нейросетевой голос (мужской, чётче)', label_ro: 'Ruslan — voce neuronală (bărbat)' },
  { id: 'piper:ru-dmitri', lang: 'ru', file: 'ru_RU-dmitri-medium.onnx', label_ru: 'Дмитрий — нейросетевой голос (мужской, спокойный)', label_ro: 'Dmitri — voce neuronală (bărbat, calmă)' },
  { id: 'piper:ru-denis', lang: 'ru', file: 'ru_RU-denis-medium.onnx', label_ru: 'Денис — нейросетевой голос (мужской, мягкий)', label_ro: 'Denis — voce neuronală (bărbat)' },
  { id: 'piper:ro-mihai', lang: 'ro', file: 'ro_RO-mihai-medium.onnx', label_ru: 'Михай — нейросетевой голос', label_ro: 'Mihai — voce neuronală' },
];
const piperVoices = () => (fs.existsSync(PIPER)
  ? PIPER_VOICES.filter((v) => fs.existsSync(path.join(VOICE_DIR, v.file)) && fs.existsSync(path.join(VOICE_DIR, v.file + '.json')))
  : []);

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

// Процесс, который читает строки со stdin и отвечает строками (Piper и помощник голосов Windows).
class LineProc {
  constructor(cmd, args, opts, parse) {
    this.jobs = [];
    this.dead = false;
    this.proc = spawn(cmd, args, { windowsHide: true, ...opts });
    let buf = '';
    this.proc.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, '');
        buf = buf.slice(i + 1);
        const r = parse(line);
        if (r === undefined) continue;
        const job = this.jobs.shift();
        if (job) (r instanceof Error ? job.reject(r) : job.resolve(r));
      }
    });
    this.proc.stderr.on('data', () => {});
    const fail = (err) => { this.dead = true; for (const j of this.jobs.splice(0)) j.reject(err || new Error('voice process')); };
    this.proc.on('error', fail);
    this.proc.on('exit', () => fail(new Error('voice process exited')));
    this.proc.stdin.on('error', () => {});
  }
  ask(line, timeoutMs = 60000) {
    if (this.dead) return Promise.reject(new Error('voice process'));
    return new Promise((resolve, reject) => {
      const job = {};
      const timer = setTimeout(() => { const k = this.jobs.indexOf(job); if (k >= 0) this.jobs.splice(k, 1); reject(new Error('timeout')); }, timeoutMs);
      job.resolve = (v) => { clearTimeout(timer); resolve(v); };
      job.reject = (e) => { clearTimeout(timer); reject(e); };
      this.jobs.push(job);
      this.proc.stdin.write(line + '\n', 'utf8');
    });
  }
  kill() { this.dead = true; try { this.proc.kill(); } catch { /* уже закрыт */ } }
}

const tmpVoiceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bible-voice-'));
const pipers = new Map();
// Один процесс на голос: модель загружается один раз (заранее, при запуске программы);
// скорость меняется при воспроизведении, поэтому голос не перезагружается.
function piperFor(voice) {
  const key = voice.id;
  let e = pipers.get(key);
  if (!e || e.dead) {
    e = new LineProc(PIPER, ['--model', path.join(VOICE_DIR, voice.file), '--output_dir', tmpVoiceDir,
      '--sentence_silence', '0.25'], {
      cwd: PIPER_DIR, env: { ...process.env, LD_LIBRARY_PATH: [PIPER_DIR, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
    }, (line) => (/\.wav$/i.test(line.trim()) ? line.trim() : undefined));
    pipers.set(key, e);
  }
  return e;
}

// Голоса системы
const osVoices = {
  list: [],
  win: null,
  readyP: null,
  ready() {
    this.readyP = this.readyP || Promise.race([this.load(), new Promise((r) => setTimeout(r, 8000))]).catch(() => {});
    return this.readyP;
  },
  async load() {
    if (process.platform === 'win32') {
      const script = path.join(tmpVoiceDir, 'voice.ps1');
      fs.writeFileSync(script, fs.readFileSync(path.join(__dirname, 'voice.ps1')));
      this.win = new LineProc('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-Dir', tmpVoiceDir], {},
        (line) => (line[0] === 'V' ? JSON.parse(line.slice(1)) : line[0] === 'F' ? line.slice(1) : line[0] === 'E' ? new Error(line.slice(1)) : undefined));
      const vs = await this.win.ask(JSON.stringify({ cmd: 'voices' }), 20000);
      this.list = (Array.isArray(vs) ? vs : [vs]).filter(Boolean).map((v) => ({
        id: v.id, lang: String(v.lang || '').slice(0, 2).toLowerCase(), label_ru: v.name, label_ro: v.name,
        // современные голоса Windows звучат лучше классических
        rank: (String(v.id).startsWith('rt:') ? 2 : 1) + (/natural|online/i.test(v.name) ? 2 : 0),
      }));
    } else if (process.platform === 'darwin') {
      const out = await new Promise((res) => {
        const p = spawn('say', ['-v', '?']); let s = '';
        p.stdout.on('data', (d) => { s += d; }); p.on('close', () => res(s)); p.on('error', () => res(''));
      });
      this.list = out.split('\n').map((l) => l.match(/^(.+?)\s{2,}([a-z]{2})[_-][A-Z]{2}/)).filter(Boolean)
        .map((m) => ({ id: 'say:' + m[1].trim(), lang: m[2], label_ru: m[1].trim(), label_ro: m[1].trim(), rank: /premium|enhanced/i.test(m[1]) ? 2 : 1 }));
    } else {
      const ok = await new Promise((res) => { const p = spawn('espeak-ng', ['--version']); p.on('error', () => res(false)); p.on('close', (c) => res(c === 0)); });
      if (ok) this.list = [{ id: 'espeak:ru', lang: 'ru', label_ru: 'eSpeak', label_ro: 'eSpeak', rank: 0 }, { id: 'espeak:ro', lang: 'ro', label_ru: 'eSpeak', label_ro: 'eSpeak', rank: 0 }];
    }
    this.list.sort((a, b) => b.rank - a.rank);
  },
  async synth(voice, text, rate) {
    if (voice.id.startsWith('rt:') || voice.id.startsWith('sapi:')) {
      const file = await this.win.ask(JSON.stringify({ t: text, v: voice.id, r: Number(rate) || 1 }));
      const data = await fs.promises.readFile(file);
      fs.promises.unlink(file).catch(() => {});
      return data;
    }
    const file = path.join(tmpVoiceDir, `s${Date.now()}${Math.random().toString(36).slice(2, 6)}.${voice.id.startsWith('say:') ? 'wav' : 'wav'}`);
    const args = voice.id.startsWith('say:')
      ? ['-v', voice.id.slice(4), '-r', String(Math.round(180 * (Number(rate) || 1))), '--file-format=WAVE', '--data-format=LEI16@22050', '-o', file, text]
      : ['-v', voice.id.slice(7), '-s', String(Math.round(165 * (Number(rate) || 1))), '-w', file, text];
    await new Promise((res, rej) => {
      const p = spawn(voice.id.startsWith('say:') ? 'say' : 'espeak-ng', args);
      p.on('error', rej); p.on('close', (c) => (c === 0 ? res() : rej(new Error('voice ' + c))));
    });
    const data = await fs.promises.readFile(file);
    fs.promises.unlink(file).catch(() => {});
    return data;
  },
};

const allVoices = () => [...piperVoices(), ...osVoices.list];
// Голоса Piper загружаются заранее: первая фраза звучит без долгой паузы.
function warmVoices() {
  for (const v of piperVoices()) {
    piperFor(v).ask('.').then((f) => fs.promises.unlink(f).catch(() => {})).catch(() => {});
  }
}
ipcMain.on('tts:info', (event) => { event.returnValue = { voices: allVoices() }; });
ipcMain.handle('tts:synth', async (event, { text, voice, rate }) => {
  const v = allVoices().find((x) => x.id === voice);
  if (!v) throw new Error('no voice');
  if (v.id.startsWith('piper:')) {
    const file = await piperFor(v).ask(String(text).replace(/[\r\n]+/g, ' ').trim());
    const data = await readWhole(file);
    fs.promises.unlink(file).catch(() => {});
    return data;
  }
  return osVoices.synth(v, String(text).replace(/[\r\n]+/g, ' ').trim(), rate);
});
app.on('will-quit', () => {
  for (const e of pipers.values()) e.kill();
  if (osVoices.win) osVoices.win.kill();
  try { fs.rmSync(tmpVoiceDir, { recursive: true, force: true }); } catch { /* ничего */ }
});

/* ---------- Аудио-Библия: записи с диска ---------- */
// Записи вида nwt_01_Ge_U_01.mp3 программа находит сама: в своей папке (рядом с .exe) и во вложенных папках,
// а также в папках, выбранных через «Выбрать папку с записями» (они запоминаются). Файлы читаются прямо с диска.
const AUDIO_LANGS = { U: 'ru', M: 'ro' };
const audioFiles = new Map();
const audioDirsFile = () => path.join(app.getPath('userData'), 'audio-dirs.json');
function savedAudioDirs() { try { return JSON.parse(fs.readFileSync(audioDirsFile(), 'utf8')); } catch { return []; } }
function homeDir() { return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath); }
function scanDir(dir, depth) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (depth < 3 && !e.name.startsWith('.') && e.name !== 'node_modules') scanDir(full, depth + 1); continue; }
    const m = e.name.match(/nwt_(\d{1,2})_[^_]+_([A-Z]{1,3})(?:_(\d{1,3}))?\.mp3$/i);
    if (!m) continue;
    const lang = AUDIO_LANGS[m[2].toUpperCase()];
    if (!lang) continue;
    audioFiles.set(`${lang}:${+m[1]}:${m[3] ? +m[3] : 1}`, full);
  }
}
function scanAudio() {
  audioFiles.clear();
  for (const d of [homeDir(), ...savedAudioDirs()]) scanDir(d, 0);
}
// «Уши» советника: распознавание речи Whisper (whisper.cpp) на этом компьютере, без интернета.
const WHISPER_DIR = path.join(RES, 'whisper');
const WHISPER = path.join(WHISPER_DIR, process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli');
function whisperModel() {
  try {
    const m = fs.readdirSync(WHISPER_DIR).filter((f) => /^ggml-.*\.bin$/i.test(f)).sort();
    return m.length ? path.join(WHISPER_DIR, m[0]) : null;
  } catch { return null; }
}
ipcMain.on('ears:info', (event) => { event.returnValue = { ok: fs.existsSync(WHISPER) && !!whisperModel() }; });
ipcMain.handle('ears:hear', async (event, { wav, lang }) => {
  const model = whisperModel();
  if (!fs.existsSync(WHISPER) || !model) throw new Error('no whisper');
  const file = path.join(tmpVoiceDir, `heard-${Date.now()}.wav`);
  await fs.promises.writeFile(file, Buffer.from(wav));
  const ro = lang === 'ro';
  const args = ['-m', model, '-f', file, '-l', ro ? 'ro' : 'ru', '-nt', '-np',
    '-t', String(Math.max(2, Math.min(8, os.cpus().length - 1))),
    '--prompt', ro ? 'Biblia, Iehova, Isus, Moise, Avraam, profeție.' : 'Библия, Иегова, Иисус, Моисей, Авраам, пророчество. Тарс, объясни стих.'];
  try {
    const out = await new Promise((resolve, reject) => {
      const p = spawn(WHISPER, args, { cwd: WHISPER_DIR, windowsHide: true });
      const chunks = [];
      const timer = setTimeout(() => { try { p.kill(); } catch { /* уже завершён */ } reject(new Error('timeout')); }, 90000);
      p.stdout.on('data', (d) => chunks.push(d));
      p.stderr.on('data', () => {});
      p.on('error', (e) => { clearTimeout(timer); reject(e); });
      p.on('close', (code) => { clearTimeout(timer); if (code === 0) resolve(Buffer.concat(chunks).toString('utf8')); else reject(new Error('whisper exit ' + code)); });
    });
    return out.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
  } finally {
    fs.promises.unlink(file).catch(() => {});
  }
});

// «Глаза» советника: снимок окна программы (то, что видит пользователь), JPEG не больше 1280 точек.
ipcMain.handle('eyes:capture', async (event) => {
  const w = BrowserWindow.fromWebContents(event.sender);
  if (!w) return null;
  let img = await w.webContents.capturePage();
  const { width, height } = img.getSize();
  const k = Math.min(1, 1280 / Math.max(width, height, 1));
  if (k < 1) img = img.resize({ width: Math.round(width * k), height: Math.round(height * k), quality: 'good' });
  return 'data:image/jpeg;base64,' + img.toJPEG(75).toString('base64');
});

ipcMain.on('audio:list', (event) => { event.returnValue = { keys: [...audioFiles.keys()], dirs: [homeDir(), ...savedAudioDirs()] }; });
ipcMain.handle('audio:addFolder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths.length) return null;
  const dirs = [...new Set([...savedAudioDirs(), r.filePaths[0]])];
  try { fs.mkdirSync(path.dirname(audioDirsFile()), { recursive: true }); fs.writeFileSync(audioDirsFile(), JSON.stringify(dirs)); } catch { /* не сохранилось */ }
  scanAudio();
  return { keys: [...audioFiles.keys()] };
});
// Отдача записи с поддержкой перемотки (Range)
async function serveAudio(key, req) {
  const file = audioFiles.get(decodeURIComponent(key));
  if (!file) return new Response('Not found', { status: 404 });
  let size;
  try { size = (await fs.promises.stat(file)).size; } catch { return new Response('Not found', { status: 404 }); }
  const range = req.headers.get('range');
  const m = range && range.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? +m[1] : 0;
    const end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
    const fh = await fs.promises.open(file, 'r');
    const buf = Buffer.alloc(end - start + 1);
    await fh.read(buf, 0, buf.length, start);
    await fh.close();
    return new Response(buf, { status: 206, headers: { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': String(buf.length), 'content-range': `bytes ${start}-${end}/${size}` } });
  }
  const data = await fs.promises.readFile(file);
  return new Response(data, { headers: { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': String(size) } });
}
