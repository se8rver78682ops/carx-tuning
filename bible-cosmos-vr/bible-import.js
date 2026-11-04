// Импорт Библии из своих файлов: RTF (например, архив nwt_*.rtf.zip с jw.org) и EPUB.
// Работает целиком в браузере: файл никуда не отправляется.
// Разметка определяется по структуре, а не по цвету: заголовок главы — жирный крупный текст с числом,
// номер стиха — отдельное число в своём стиле, идущее по порядку.

const TOKEN = /\\([a-zA-Z]+)(-?\d+)? ?|\\'([0-9a-fA-F]{2})|\\([^a-zA-Z])|([{}])|([^\\{}\r\n]+)|[\r\n]+/g;
const SKIP_GROUPS = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer', 'footnote', 'listtable', 'listoverridetable', 'generator']);

// RTF -> список фрагментов { t, b, fs, cf } в порядке документа.
export function rtfRuns(src) {
  const cp1251 = new TextDecoder('windows-1251');
  const runs = [];
  const stack = [];
  let st = { cf: 0, b: 0, fs: 24, skip: 0 };
  let uc = 1, skipChars = 0;
  const emit = (t) => {
    if (st.skip || !t) return;
    const last = runs[runs.length - 1];
    if (last && last.cf === st.cf && last.b === st.b && last.fs === st.fs) last.t += t;
    else runs.push({ t, cf: st.cf, b: st.b, fs: st.fs });
  };
  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(src))) {
    const [, word, arg, hex, sym, brace, text] = m;
    if (brace === '{') { stack.push({ ...st }); continue; }
    if (brace === '}') { if (stack.length) st = stack.pop(); continue; }
    if (text !== undefined) {
      let t = text;
      if (skipChars) { const k = Math.min(skipChars, t.length); t = t.slice(k); skipChars -= k; }
      emit(t);
      continue;
    }
    if (hex) {
      if (skipChars) { skipChars--; continue; }
      emit(cp1251.decode(new Uint8Array([parseInt(hex, 16)])));
      continue;
    }
    if (sym) {
      if (sym === '*') st.skip = 1;
      else if (sym === '~') emit(' ');
      else if (sym === '_') emit('‑');
      else if (sym === '\\' || sym === '{' || sym === '}') emit(sym);
      continue;
    }
    if (word) {
      const a = arg === undefined ? null : parseInt(arg, 10);
      if (word === 'u') { emit(String.fromCharCode(a < 0 ? a + 65536 : a)); skipChars = uc; }
      else if (word === 'uc') uc = a;
      else if (word === 'par' || word === 'line') emit('\n');
      else if (word === 'tab') emit('\t');
      else if (word === 'cf') st.cf = a || 0;
      else if (word === 'b') st.b = a === 0 ? 0 : 1;
      else if (word === 'fs') st.fs = a;
      else if (word === 'plain') { st.cf = 0; st.b = 0; st.fs = 24; }
      else if (word === 'emdash') emit('—');
      else if (word === 'endash') emit('–');
      else if (word === 'lquote') emit('‘');
      else if (word === 'rquote') emit('’');
      else if (word === 'ldblquote') emit('“');
      else if (word === 'rdblquote') emit('”');
      else if (SKIP_GROUPS.has(word)) st.skip = 1;
    }
  }
  return runs;
}

const clean = (s) => s.replace(/­/g, '').replace(/[\s ]+/g, ' ').trim();
const isHeading = (r) => r.b && r.fs >= 30;
const DIGITS = /^\s*(\d{1,3})\s*$/;
const STARTS_TEXT = /^[\s \p{L}«„“"'(—–\-…]/u;

// Одна книга: { name, chapters: [[стих, ...], ...] }
export function parseBook(src) {
  const runs = rtfRuns(src);
  let name = '';
  let i = 0;
  // Название книги — первый крупный жирный заголовок.
  for (; i < runs.length; i++) {
    if (isHeading(runs[i])) {
      let t = '';
      while (i < runs.length && isHeading(runs[i])) t += runs[i++].t;
      name = clean(t);
      break;
    }
  }
  const chapters = [];
  let ch = null, verse = 0, pending = '';
  const startChapter = () => { ch = []; chapters.push(ch); verse = 0; pending = ''; };
  for (; i < runs.length; i++) {
    const r = runs[i];
    if (isHeading(r)) {
      let t = '';
      while (i < runs.length && isHeading(runs[i])) t += runs[i++].t;
      i--;
      if (/\d/.test(t)) startChapter();
      continue;
    }
    const dm = r.t.match(DIGITS);
    const next = runs[i + 1];
    if (dm && next && next.cf !== r.cf && STARTS_TEXT.test(next.t)) {
      const n = parseInt(dm[1], 10);
      const ok = n === 1 ? verse === 0 || !ch : n > verse && n <= verse + 4;
      if (ok) {
        if (!ch) startChapter(); // книга из одной главы: заголовков «Глава» нет
        while (verse < n - 1) { ch.push(''); verse++; } // пропущенные в переводе стихи
        ch.push(verse === 0 && clean(pending) ? `(${clean(pending)}) ` : '');
        verse = n;
        pending = '';
        continue;
      }
    }
    if (!ch) continue; // краткое содержание перед текстом книги
    if (verse === 0) pending += r.t; // надписание псалма до первого стиха
    else ch[ch.length - 1] += r.t;
  }
  return { name, chapters: chapters.map((c) => c.map(clean)) };
}

const SHORT_RU = ['Быт', 'Исх', 'Лев', 'Чис', 'Втор', 'Нав', 'Суд', 'Руф', '1Сам', '2Сам', '1Цар', '2Цар', '1Лет', '2Лет', 'Езд', 'Неем', 'Есф', 'Иов', 'Пс', 'Прит', 'Еккл', 'Песн', 'Ис', 'Иер', 'Плач', 'Иез', 'Дан', 'Ос', 'Иоил', 'Ам', 'Авд', 'Ион', 'Мих', 'Наум', 'Авв', 'Соф', 'Агг', 'Зах', 'Мал', 'Мф', 'Мк', 'Лк', 'Ин', 'Деян', 'Рим', '1Кор', '2Кор', 'Гал', 'Еф', 'Флп', 'Кол', '1Фес', '2Фес', '1Тим', '2Тим', 'Тит', 'Флм', 'Евр', 'Иак', '1Пет', '2Пет', '1Ин', '2Ин', '3Ин', 'Иуд', 'Откр'];
const SHORT_RO = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Ios', 'Jud', 'Rut', '1Sam', '2Sam', '1Reg', '2Reg', '1Cron', '2Cron', 'Ezra', 'Neem', 'Est', 'Iov', 'Ps', 'Prov', 'Ecl', 'Cânt', 'Is', 'Ier', 'Plâng', 'Ezec', 'Dan', 'Osea', 'Ioel', 'Amos', 'Obad', 'Iona', 'Mica', 'Naum', 'Hab', 'Țef', 'Hag', 'Zah', 'Mal', 'Mat', 'Marc', 'Luca', 'Ioan', 'Fapte', 'Rom', '1Cor', '2Cor', 'Gal', 'Ef', 'Filip', 'Col', '1Tes', '2Tes', '1Tim', '2Tim', 'Tit', 'Filim', 'Evr', 'Iac', '1Pet', '2Pet', '1Ioan', '2Ioan', '3Ioan', 'Iuda', 'Apoc'];
const GENRES_66 = [
  ...Array(5).fill('law'), ...Array(12).fill('hist'), ...Array(5).fill('wisdom'), ...Array(17).fill('proph'),
  ...Array(4).fill('gospel'), 'acts', ...Array(14).fill('paul'), ...Array(7).fill('cath'), 'rev',
];

// files: [{ name, text }] -> { t, lang, b: [...] } в формате приложения.
// Номер книги берётся из имени файла: nwt_01_Ge_U.rtf -> 1. Файлы без номера книги (введение, приложения) пропускаются.
export function parseRtfBible(files, onProgress = () => {}) {
  const books = [];
  const list = files
    .map((f) => ({ ...f, num: +(f.name.match(/_(\d{2})_[A-Za-z0-9]+_[A-Z]+\.rtf$/i) || [])[1] || 0 }))
    .filter((f) => f.num >= 1 && f.num <= 66)
    .sort((a, b) => a.num - b.num);
  if (!list.length) throw new Error('no-books');
  list.forEach((f, k) => {
    const { name, chapters } = parseBook(f.text);
    if (chapters.length) books.push({ num: f.num, name, chapters });
    onProgress((k + 1) / list.length);
  });
  const sample = books.slice(0, 3).map((b) => b.chapters[0]?.[0] || '').join(' ');
  const lang = /[а-яё]/i.test(sample) ? 'ru' : 'ro';
  const shorts = lang === 'ru' ? SHORT_RU : SHORT_RO;
  const b = books.map((bk) => ({
    n: bk.name, s: shorts[bk.num - 1] || bk.name, g: GENRES_66[bk.num - 1], d: 0,
    c: bk.chapters.map((c) => c.map((v) => v || '—')),
  }));
  const t = lang === 'ru' ? 'Перевод «Новый мир»' : 'Traducerea lumii noi';
  return { t, lang, b };
}

/* ---------- EPUB (например, nwt_M.epub с jw.org) ---------- */

// Файлы книг: 10010611NN.xhtml и 10010611NN-splitK.xhtml, где NN = 05..70 -> книги 1..66.
const EPUB_BOOK = /(?:^|\/)10010611(\d\d)(?:-split\d+)?\.xhtml$/;
const VERSE_ID = /^chapter(\d+)_verse(\d+)$/;

// zip: объект с методом text(путь) -> Promise<string>; parseXml(text) -> Document.
export async function parseEpubBible(zip, parseXml, onProgress = () => {}) {
  const container = parseXml(await zip.text('META-INF/container.xml'));
  const opfPath = container.getElementsByTagName('rootfile')[0].getAttribute('full-path');
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const opf = parseXml(await zip.text(opfPath));
  const items = {};
  for (const it of Array.from(opf.getElementsByTagName('item'))) items[it.getAttribute('id')] = base + it.getAttribute('href');
  const spine = Array.from(opf.getElementsByTagName('itemref')).map((r) => items[r.getAttribute('idref')]).filter(Boolean);
  const files = spine.filter((p) => { const m = p.match(EPUB_BOOK); return m && +m[1] >= 5 && +m[1] <= 70; });
  if (!files.length) throw new Error('no-books');

  const books = new Map(); // num -> { name, chapters: [] }
  let lang = '';
  for (let k = 0; k < files.length; k++) {
    const num = +files[k].match(EPUB_BOOK)[1] - 4;
    const doc = parseXml(await zip.text(files[k]));
    const body = doc.getElementsByTagName('body')[0];
    if (!body) continue;
    lang = lang || body.getAttribute('xml:lang') || '';
    let book = books.get(num);
    if (!book) {
      const nav = Array.from(body.getElementsByTagName('p')).find((p) => /\bw_biblebookname\b/.test(p.getAttribute('class') || ''));
      const a = nav && nav.getElementsByTagName('a')[0];
      book = { name: a ? clean(a.textContent) : `#${num}`, chapters: [], paras: [], notes: {}, cur: null, superscription: '' };
      books.set(num, book);
    }
    const fnRef = {}; // id сноски -> { ci, vi, word }
    for (const p of Array.from(body.getElementsByTagName('p'))) {
      const cls = ' ' + (p.getAttribute('class') || '') + ' ';
      if (/ sw /.test(cls)) { book.superscription += ' ' + p.textContent; continue; }
      if (!/ s[blz] /.test(cls)) continue; // заголовки, буквы еврейского алфавита, сноски и т. п.
      const prose = / sb /.test(cls);
      // Абзац начинается, если стих стоит в самом начале абзаца прозы или стихотворной строфы.
      let atStart = true;
      // Стихотворная строка (sl/sz) с новой строки внутри стиха.
      let lineBreak = !prose;
      const walk = (node) => {
        for (const ch of Array.from(node.childNodes)) {
          if (ch.nodeType === 3) {
            if (book.cur && ch.nodeValue.trim()) {
              const cur = book.cur.ch;
              if (lineBreak && cur[book.cur.v].trim()) cur[book.cur.v] += '\n';
              lineBreak = false;
              atStart = false;
            }
            if (book.cur) book.cur.ch[book.cur.v] += ch.nodeValue;
            continue;
          }
          if (ch.nodeType !== 1) continue;
          const name = ch.localName;
          const id = ch.getAttribute('id') || '';
          const c = ch.getAttribute('class') || '';
          const vm = id.match(VERSE_ID);
          if (vm) {
            const ci = +vm[1] - 1, vi = +vm[2] - 1;
            while (book.chapters.length <= ci) book.chapters.push([]);
            const arr = book.chapters[ci];
            while (arr.length <= vi) arr.push('');
            if (vi === 0 && book.superscription.trim()) { arr[0] = `(${clean(book.superscription)}) `; book.superscription = ''; }
            book.cur = { ch: arr, v: vi };
            if (!book.paras[ci]) book.paras[ci] = new Set([0]);
            if (atStart) book.paras[ci].add(vi);
            lineBreak = false;
            continue;
          }
          if (name === 'sup' || /\b(w_ch|pageNum)\b/.test(c)) continue;
          if (name === 'a' && /^#footnote/.test(ch.getAttribute('href') || '')) {
            if (book.cur) {
              const ci = book.chapters.indexOf(book.cur.ch);
              const word = (book.cur.ch[book.cur.v].match(/([\p{L}\u0301-]+)[^\p{L}]*$/u) || [])[1] || '';
              fnRef[ch.getAttribute('href').slice(1)] = { ci, vi: book.cur.v, word: word.replace(/\u0301/g, '') };
            }
            continue;
          }
          walk(ch);
        }
      };
      walk(p);
      if (book.cur && prose) book.cur.ch[book.cur.v] += ' ';
    }
    // Сноски издания: «Или „сила“», «Букв. …» — прикрепляем к стихам.
    for (const div of Array.from(body.getElementsByTagName('div'))) {
      const id = div.getAttribute('id') || '';
      const ref = fnRef[id];
      if (!ref || ref.ci < 0) continue;
      const link = div.getElementsByTagName('a')[0];
      let text = div.textContent;
      if (link) text = text.replace(link.textContent, '');
      text = clean(text);
      if (!text) continue;
      const byCh = (book.notes[ref.ci] = book.notes[ref.ci] || {});
      (byCh[ref.vi] = byCh[ref.vi] || []).push(ref.word ? `«${ref.word}» — ${text}` : text);
    }
    onProgress((k + 1) / files.length);
  }
  const ordered = [...books.entries()].sort((a, b) => a[0] - b[0]);
  // Таблица книг из приложения издания (кто написал, где, когда, охваченное время).
  const tablePath = Object.values(items).find((p) => /(?:^|\/)1001061171\.xhtml$/.test(p));
  if (tablePath) {
    try {
      const rows = readBooksTable(parseXml(await zip.text(tablePath)));
      if (rows.length === 66) ordered.forEach(([num, bk]) => { bk.info = rows[num - 1]; });
    } catch { /* таблицы может не быть */ }
  }
  const sample = ordered.slice(0, 2).map(([, b]) => b.chapters[0]?.[0] || '').join(' ');
  const isRu = /[а-яё]/i.test(sample) || lang.startsWith('ru');
  const shorts = isRu ? SHORT_RU : SHORT_RO;
  return {
    t: isRu ? 'Перевод «Новый мир»' : 'Traducerea lumii noi',
    lang: isRu ? 'ru' : 'ro',
    b: ordered.map(([num, bk]) => ({
      n: bk.name, s: shorts[num - 1] || bk.name, g: GENRES_66[num - 1], d: 0,
      c: bk.chapters.map((c) => c.map((v) => v.split('\n').map(clean).filter(Boolean).join('\n') || '—')),
      p: bk.chapters.map((c, ci) => [...(bk.paras[ci] || new Set([0]))].filter((v) => v < c.length).sort((x, y) => x - y)),
      ...(Object.keys(bk.notes).length ? { f: bk.notes } : {}),
      ...(bk.info ? { info: bk.info } : {}),
    })),
  };
}

const sentenceCase = (h) => { const l = h.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); };
// Строки таблицы: [[заголовок, значение], ...] для каждой книги по порядку; первый столбец (название) пропускается.
function readBooksTable(doc) {
  const out = [];
  let head = [];
  for (const tr of Array.from(doc.getElementsByTagName('tr'))) {
    const cells = Array.from(tr.childNodes).filter((n) => n.nodeType === 1 && /^t[dh]$/i.test(n.localName));
    const texts = cells.map((c) => clean(c.textContent));
    if (cells.some((c) => /^th$/i.test(c.localName))) { head = texts.map(sentenceCase); continue; }
    if (texts.length < 3 || !head.length) continue;
    out.push(texts.slice(1).map((v, i) => [head[i + 1] || '', v]).filter(([h, v]) => h && v));
  }
  return out;
}
