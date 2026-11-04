// Мост «нейросетевой голос» для программы на компьютере.
// Повторяет интерфейс синтезатора Android (speak / speakList / stop / voices), поэтому вся логика чтения
// в app.js остаётся той же: подсветка стиха, главы подряд, чтение при свёрнутом окне.
// Синтез делает Piper в главном процессе, а звук проигрывается здесь.
const { contextBridge, ipcRenderer } = require('electron');

let info = null;
try { info = ipcRenderer.sendSync('tts:info'); } catch { info = null; }

if (info && info.voices && info.voices.length) {
  let rate = 0.92, voiceName = '', token = 0, audio = null;
  const emit = (type, id) => window.dispatchEvent(new CustomEvent('native-tts', { detail: `${type}|${id || ''}` }));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pickVoice = (lang) => {
    const l = String(lang || 'ru').slice(0, 2);
    const vs = info.voices.filter((v) => v.lang === l);
    return vs.find((v) => v.id === voiceName) || vs[0] || null;
  };
  // Длинный текст — по предложениям: первые слова звучат быстрее, а паузы естественнее.
  const split = (text) => {
    const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?…;:]+[.!?…;:]+["»”)]*\s*|[^.!?…;:]+$/g) || [String(text)];
    const out = [];
    let cur = '';
    for (const p of parts) {
      if ((cur + p).length > 260 && cur) { out.push(cur.trim()); cur = ''; }
      cur += p;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const stop = () => {
    token++;
    if (audio) { try { audio.pause(); } catch { /* уже остановлен */ } audio = null; }
  };
  let playRate = 1;
  const play = (buf, my) => new Promise((resolve) => {
    if (my !== token) { resolve(); return; }
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    const a = new Audio(url);
    // у нейросетевого голоса скорость задаётся при воспроизведении (тон сохраняется)
    if (playRate !== 1) { a.preservesPitch = true; a.playbackRate = playRate; }
    audio = a;
    const end = () => { URL.revokeObjectURL(url); resolve(); };
    a.onended = end; a.onerror = end; a.onpause = () => { if (my !== token) end(); };
    a.play().catch(end);
  });
  // items: [[id, текст], ...]; каждый id получает «начало» и «конец», в конце — listId.
  async function run(items, lang, listId) {
    const my = ++token;
    const v = pickVoice(lang);
    if (!v) { emit('nolang'); return; }
    const segs = [];
    items.forEach(([id, text], i) => {
      const parts = split(text);
      // первая фраза короче — звук начинается быстрее
      if (i === 0 && parts[0] && parts[0].length > 90) {
        const cut = parts[0].indexOf(', ', 25);
        if (cut > 0 && cut < parts[0].length - 15) parts.splice(0, 1, parts[0].slice(0, cut + 1), parts[0].slice(cut + 2));
      }
      parts.forEach((t, j) => segs.push({ id, t, first: j === 0, last: j === parts.length - 1, gap: j === parts.length - 1 && i < items.length - 1 }));
    });
    playRate = v.id.startsWith('piper:') ? Math.max(0.6, Math.min(1.8, rate / 0.92)) : 1;
    const synth = (t) => ipcRenderer.invoke('tts:synth', { text: t, voice: v.id, rate });
    // пока звучит одна фраза, следующая уже готовится
    let next = segs.length ? synth(segs[0].t) : null;
    for (let i = 0; i < segs.length; i++) {
      let buf;
      try { buf = await next; } catch { if (my === token) emit('fail'); return; }
      if (my !== token) return;
      next = i + 1 < segs.length ? synth(segs[i + 1].t) : null;
      if (next) next.catch(() => {});
      const s = segs[i];
      if (s.first) emit('start', s.id);
      await play(buf, my);
      if (my !== token) return;
      if (s.last) emit('done', s.id);
      if (s.gap) await sleep(260);
    }
    if (listId && my === token) emit('done', listId);
  }
  contextBridge.exposeInMainWorld('DesktopTTS', {
    setRate: (r) => { rate = Math.max(0.5, Math.min(2, Number(r) || 1)); },
    setPitch: () => {},
    setVoice: (n) => { voiceName = String(n || ''); },
    setStopLabel: () => {},
    voices: (lang) => {
      const l = String(lang || 'ru').slice(0, 2);
      return JSON.stringify(info.voices.filter((v) => v.lang === l).map((v) => ({ name: v.id, label: l === 'ro' ? v.label_ro : v.label_ru, best: true })));
    },
    speak: (text, lang, id) => { stop(); run([[id, text]], lang, null); },
    speakList: (json, lang, listId) => { stop(); let items = []; try { items = JSON.parse(json); } catch { /* пусто */ } run(items, lang, listId); },
    stop: () => stop(),
  });
}

// Аудио-Библия: записи с диска (папка программы и выбранные папки), без копирования.
let audioInfo = null;
try { audioInfo = ipcRenderer.sendSync('audio:list'); } catch { audioInfo = null; }
contextBridge.exposeInMainWorld('DesktopAudio', {
  keys: () => (audioInfo ? audioInfo.keys.slice() : []),
  dirs: () => (audioInfo ? audioInfo.dirs.slice() : []),
  url: (key) => 'app://bible/__audio/' + encodeURIComponent(String(key)),
  addFolder: async () => {
    const r = await ipcRenderer.invoke('audio:addFolder');
    if (!r) return -1;
    audioInfo = { ...(audioInfo || { dirs: [] }), keys: r.keys };
    try { audioInfo = ipcRenderer.sendSync('audio:list'); } catch { /* оставляем как есть */ }
    return r.keys.length;
  },
});
