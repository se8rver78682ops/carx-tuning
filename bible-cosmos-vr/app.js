// three.js грузится с запасного адреса, если основной недоступен.
const THREE_URLS = [
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
];
let THREE = null;
for (const url of THREE_URLS) {
  try { THREE = await import(url); break; } catch (err) { console.warn('three.js:', url, err); }
}
if (!THREE) throw new Error('three.js');
window.__appRan = true;
import { parseRtfBible, parseEpubBible } from './bible-import.js';

/* ---------- Справочники ---------- */

const GENRES = {
  law:    { color: '#f3c35b' },
  hist:   { color: '#ee9a5c' },
  wisdom: { color: '#ef86b0' },
  proph:  { color: '#b298ff' },
  hist2:  { color: '#d98b6a' },
  gospel: { color: '#e6f2ff' },
  acts:   { color: '#72e0c8' },
  cath:   { color: '#a3e07e' },
  paul:   { color: '#79b4ff' },
  rev:    { color: '#ff7a6e' },
};
const NT_GENRES = new Set(['gospel', 'acts', 'cath', 'paul', 'rev']);
// Жанры для 66 книг в протестантском порядке (если пользователь загрузит такой перевод).
const GENRES_66 = [
  ...Array(5).fill('law'), ...Array(12).fill('hist'), ...Array(5).fill('wisdom'), ...Array(17).fill('proph'),
  ...Array(4).fill('gospel'), 'acts', ...Array(14).fill('paul'), ...Array(7).fill('cath'), 'rev',
];
const FONT_UI = '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
const FONT_TEXT = '"PT Serif", Georgia, serif';
const FONT_TITLE = '"Cormorant Garamond", "PT Serif", Georgia, serif';

const plural = (n, f) => {
  const a = n % 100, b = n % 10;
  if (a > 10 && a < 20) return f[2];
  if (b === 1) return f[0];
  if (b >= 2 && b <= 4) return f[1];
  return f[2];
};
const roDe = (n) => (n >= 20 && (n % 100 === 0 || n % 100 >= 20) ? 'de ' : '');

/* ---------- Языки: русский и румынский ---------- */

const I18N = {
  ru: {
    htmlLang: 'ru', speech: 'ru-RU', file: 'data/bible-ru.json',
    title: 'Библейский космос',
    quote: '«Он исчисляет звёзды, всех их называет по имени» (Пс 146:4)',
    galaxy: 'Галактика книг', galaxyShort: 'Галактика',
    chapter: (n) => `Глава ${n}`,
    chapterOf: (b, n) => `${b} · глава ${n}`,
    chapterComma: (b, n) => `${b}, глава ${n}`,
    chapters: (n) => `${n} ${plural(n, ['глава', 'главы', 'глав'])}`,
    verses: (n) => `${n.toLocaleString('ru-RU')} ${plural(n, ['стих', 'стиха', 'стихов'])}`,
    page: (p, n) => `страница ${p} из ${n}`,
    ot: 'ВЕТХИЙ ЗАВЕТ', nt: 'НОВЫЙ ЗАВЕТ', otHead: 'Ветхий Завет', ntHead: 'Новый Завет',
    deutero: 'неканоническая',
    genres: {
      law: 'Пятикнижие (Закон)', hist: 'Исторические книги', wisdom: 'Учительные книги', proph: 'Пророческие книги',
      hist2: 'Маккавейские книги', gospel: 'Евангелия', acts: 'Деяния апостолов', cath: 'Соборные послания',
      paul: 'Послания апостола Павла', rev: 'Откровение',
    },
    legendNote: (t, d) => `${t}. ${d ? 'Неканонические книги светятся приглушённо. ' : ''}Спираль идёт по порядку книг снизу вверх, по часовой стрелке.`,
    click: 'Щелчок', trigger: 'Курок', openBook: 'открыть книгу', openChapter: 'открыть главу',
    verseHint: 'Щелчок: связи и история книги',
    toastGalaxy: 'Перетаскивайте, чтобы осмотреться. Наведите на звезду, чтобы прочитать стих. Щелчок по скоплению открывает книгу.',
    toastBook: 'Каждое скопление — глава. Наведите на звезду, чтобы прочитать стих. Щелчок открывает главу.',
    toastChapter: 'Стихи стоят вокруг вас колонками. Щелчок по стиху показывает связанные стихи и историю книги. «Слушать главу» читает главу вслух.',
    notFound: (q) => `Не нашли «${q}». Попробуйте так: «Ин 3:16», «Бытие 1», «Пс 22».`,
    loaded: (t, nb, nv) => `Загружено: ${t}. Книг: ${nb}, ${nv}.`,
    fileError: (m) => `Не получилось прочитать файл: ${m} Формат описан в README.`,
    noBooks: 'В файле нет списка книг.', noChapters: (n) => `У книги «${n}» нет глав.`, bookN: (i) => `Книга ${i}`,
    ownName: 'Свой перевод',
    search: 'Найти', searchPh: 'Ин 3:16', searchLabel: 'Перейти к месту', random: '✦ Случайный стих',
    own: 'Свой перевод…', ownTitle: 'Открыть свой файл Библии в формате JSON. Файл не покидает ваш браузер.',
    genresBtn: 'Жанры', crumbs: 'Где вы сейчас', legendLabel: 'Цвета жанров',
    vrCheck: 'Проверяем VR…', vrEnter: 'Войти в VR', vrExit: 'Выйти из VR', vrNo: 'VR недоступен',
    vrNoTitle: 'Откройте страницу в браузере VR-шлема, например Meta Quest Browser.',
    vrFail: 'Браузер не открыл VR. Откройте страницу по прямой ссылке в браузере шлема.',
    prevCh: '◀ Предыдущая глава', nextCh: 'Следующая глава ▶', prevPage: '◀ Стр.', nextPage: 'Стр. ▶',
    listen: '▶ Слушать главу', stop: '■ Остановить',
    noTts: 'Этот браузер не умеет читать вслух.',
    noVoice: 'На устройстве нет русского голоса. Его можно добавить в настройках системы, раздел «Речь».',
    xrGalaxy: '← Галактика', xrChapters: '← Главы', xrPrev: '◀ Глава', xrNext: 'Глава ▶', xrListen: '▶ Слушать', xrStop: '■ Стоп', xrRandom: '✦ Случайный стих',
    introTitle: 'Библейский космос',
    intro: ['Каждая звезда — стих. Каждое скопление — книга.', 'Наведите луч на звезду, чтобы прочитать стих.', 'Курок: войти в книгу, затем в главу.', 'В главе курок по стиху открывает его связи.', 'B или Y: назад. Стик: поворот. Кнопки — внизу.'],
    loading: 'Загружаем текст Синодального перевода…', lighting: 'Зажигаем звёзды…',
    loadFail: (m) => `Не удалось загрузить Библию: ${m}`, httpFail: (c) => `Файл данных не загрузился (HTTP ${c}).`,
    switching: 'Загружаем русский текст…',
    related: 'Связанные стихи', noRelated: 'Для этого стиха связей нет.', relatedLoading: 'Связи ещё загружаются…',
    aboutBook: (n) => `О книге «${n}»`, author: 'Кто написал', place: 'Где написана', written: 'Когда написана', covers: 'Какое время описано',
    circumstances: 'Обстоятельства', datesNote: 'Даты традиционные и приблизительные, у исследователей есть и другие мнения.',
    listenFrom: '▶ Слушать отсюда', close: 'Закрыть', linksHint: (n) => `Связей: ${n}, они показаны дугами`,
    xrefSource: 'Связи между стихами: OpenBible.info (CC BY).', writtenShort: 'написана',
    xrClose: '✕ Закрыть',
    ownTitle2: 'Открыть свой файл Библии: EPUB, RTF, zip с ними или JSON. Файл не покидает ваше устройство.',
    reading: (p) => `Читаем файл… ${p}%`,
    unsupported: 'Подходят файлы EPUB, RTF, zip-архив с ними или JSON.',
    savedHere: 'Перевод сохранён на этом устройстве, открывать файл снова не нужно.',
    resetCustom: 'Вернуть Синодальный перевод',
    customNote: 'Свой перевод, хранится только на этом устройстве.',
  },
  ro: {
    htmlLang: 'ro', speech: 'ro-RO', file: 'data/bible-ro.json',
    title: 'Cosmosul biblic',
    quote: '„El socotește numărul stelelor și le dă nume la toate.” (Psalmul 147:4)',
    galaxy: 'Galaxia cărților', galaxyShort: 'Galaxia',
    chapter: (n) => `Capitolul ${n}`,
    chapterOf: (b, n) => `${b} · capitolul ${n}`,
    chapterComma: (b, n) => `${b}, capitolul ${n}`,
    chapters: (n) => `${n} ${roDe(n)}${n === 1 ? 'capitol' : 'capitole'}`,
    verses: (n) => `${n.toLocaleString('ro-RO')} ${roDe(n)}${n === 1 ? 'verset' : 'versete'}`,
    page: (p, n) => `pagina ${p} din ${n}`,
    ot: 'VECHIUL TESTAMENT', nt: 'NOUL TESTAMENT', otHead: 'Vechiul Testament', ntHead: 'Noul Testament',
    deutero: 'necanonică',
    genres: {
      law: 'Pentateuhul (Legea)', hist: 'Cărțile istorice', wisdom: 'Cărțile poetice', proph: 'Cărțile profetice',
      hist2: 'Cărțile Macabeilor', gospel: 'Evangheliile', acts: 'Faptele apostolilor', cath: 'Epistolele generale',
      paul: 'Epistolele lui Pavel', rev: 'Apocalipsa',
    },
    legendNote: (t, d) => `${t}. ${d ? 'Cărțile necanonice au o lumină mai slabă. ' : ''}Spirala urmează ordinea cărților, de jos în sus, în sensul acelor de ceasornic.`,
    click: 'Clic', trigger: 'Trăgaci', openBook: 'deschide cartea', openChapter: 'deschide capitolul',
    verseHint: 'Clic: legături și istoria cărții',
    toastGalaxy: 'Trageți ca să priviți în jur. Duceți cursorul pe o stea ca să citiți versetul. Clic pe un roi de stele deschide cartea.',
    toastBook: 'Fiecare roi este un capitol. Duceți cursorul pe o stea ca să citiți versetul. Clic deschide capitolul.',
    toastChapter: 'Versetele stau în coloane în jurul vostru. Clic pe un verset arată versetele legate și istoria cărții. „Ascultă capitolul” citește capitolul.',
    notFound: (q) => `Nu am găsit „${q}”. Încercați: „Ioan 3:16”, „Geneza 1”, „Ps 23”.`,
    loaded: (t, nb, nv) => `S-a încărcat: ${t}. Cărți: ${nb}, ${nv}.`,
    fileError: (m) => `Fișierul nu a putut fi citit: ${m} Formatul este descris în README.`,
    noBooks: 'Fișierul nu conține o listă de cărți.', noChapters: (n) => `Cartea „${n}” nu are capitole.`, bookN: (i) => `Cartea ${i}`,
    ownName: 'Traducerea voastră',
    search: 'Caută', searchPh: 'Ioan 3:16', searchLabel: 'Mergi la pasaj', random: '✦ Verset la întâmplare',
    own: 'Traducerea voastră…', ownTitle: 'Deschideți propriul fișier Biblie în format JSON. Fișierul nu părăsește browserul.',
    genresBtn: 'Genuri', crumbs: 'Unde vă aflați', legendLabel: 'Culorile genurilor',
    vrCheck: 'Verificăm VR…', vrEnter: 'Intră în VR', vrExit: 'Ieși din VR', vrNo: 'VR indisponibil',
    vrNoTitle: 'Deschideți pagina în browserul căștii VR, de exemplu Meta Quest Browser.',
    vrFail: 'Browserul nu a pornit VR. Deschideți pagina direct în browserul căștii.',
    prevCh: '◀ Capitolul anterior', nextCh: 'Capitolul următor ▶', prevPage: '◀ Pag.', nextPage: 'Pag. ▶',
    listen: '▶ Ascultă capitolul', stop: '■ Oprește',
    noTts: 'Acest browser nu poate citi cu voce tare.',
    noVoice: 'Pe dispozitiv nu există o voce românească. O puteți adăuga în setările sistemului, la „Vorbire”.',
    xrGalaxy: '← Galaxia', xrChapters: '← Capitole', xrPrev: '◀ Cap.', xrNext: 'Cap. ▶', xrListen: '▶ Ascultă', xrStop: '■ Stop', xrRandom: '✦ Verset aleatoriu',
    introTitle: 'Cosmosul biblic',
    intro: ['Fiecare stea este un verset. Fiecare roi este o carte.', 'Îndreptați raza spre o stea ca să citiți versetul.', 'Trăgaciul: intrați în carte, apoi în capitol.', 'În capitol, trăgaciul pe un verset arată legăturile.', 'B sau Y: înapoi. Stick: rotire. Butoanele sunt jos.'],
    loading: 'Se încarcă textul Bibliei (Cornilescu)…', lighting: 'Aprindem stelele…',
    loadFail: (m) => `Biblia nu s-a putut încărca: ${m}`, httpFail: (c) => `Fișierul de date nu s-a încărcat (HTTP ${c}).`,
    switching: 'Se încarcă textul românesc…',
    related: 'Versete legate', noRelated: 'Acest verset nu are legături.', relatedLoading: 'Legăturile se încarcă încă…',
    aboutBook: (n) => `Despre cartea „${n}”`, author: 'Cine a scris', place: 'Unde a fost scrisă', written: 'Când a fost scrisă', covers: 'Perioada descrisă',
    circumstances: 'Împrejurări', datesNote: 'Datele sunt tradiționale și aproximative; cercetătorii au și alte păreri.',
    listenFrom: '▶ Ascultă de aici', close: 'Închide', linksHint: (n) => `Legături: ${n}, arătate prin arcuri`,
    xrefSource: 'Legăturile dintre versete: OpenBible.info (CC BY).', writtenShort: 'scrisă',
    xrClose: '✕ Închide',
    ownTitle2: 'Deschideți propriul fișier Biblie: EPUB, RTF, o arhivă zip cu ele sau JSON. Fișierul nu părăsește dispozitivul.',
    reading: (p) => `Se citește fișierul… ${p}%`,
    unsupported: 'Sunt acceptate fișiere EPUB, RTF, o arhivă zip cu ele sau JSON.',
    savedHere: 'Traducerea este salvată pe acest dispozitiv, nu trebuie deschisă din nou.',
    resetCustom: 'Revino la traducerea Cornilescu',
    customNote: 'Traducerea voastră, păstrată doar pe acest dispozitiv.',
  },
};
const readLang = () => {
  try { const v = localStorage.getItem('lang'); if (v && I18N[v]) return v; } catch {}
  return (navigator.language || '').toLowerCase().startsWith('ro') ? 'ro' : 'ru';
};
let LANG = readLang();
const T = () => I18N[LANG];
const gName = (g) => T().genres[g];
const chaptersWord = (n) => T().chapters(n);
const versesWord = (n) => T().verses(n);

/* ---------- DOM ---------- */

const $ = (id) => document.getElementById(id);
const ui = {
  stage: $('stage'), crumbs: $('crumbs'), info: $('info'), nav: $('nav'), legend: $('legend'), toast: $('toast'),
  loader: $('loader'), bar: $('bar'), status: $('status'), vr: $('vr'), random: $('random'), search: $('search'),
  q: $('q'), prevCh: $('prevCh'), nextCh: $('nextCh'), prevPage: $('prevPage'), nextPage: $('nextPage'),
  legendToggle: $('legendToggle'), detail: $('detail'), bookInfo: $('bookInfo'), file: $('file'), fileBtn: $('fileBtn'), listen: $('listen'), langRu: $('langRu'), langRo: $('langRo'),
};

/* ---------- Three.js: сцена ---------- */

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
ui.stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#03040a');
const rig = new THREE.Group();
scene.add(rig);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 3000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.6, 0);
rig.add(camera);

const EYE = new THREE.Vector3(0, 1.6, 0);
const shared = { uScale: { value: 700 }, uTime: { value: 0 }, uMinPx: { value: 1.4 } };

const texCache = new Set();
function makeTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.map && !m.map.userData.keep) m.map.dispose();
        m.dispose();
      }
    }
  });
}

const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = makeTexture(c);
  t.userData.keep = true;
  return t;
})();

function starMaterial(extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uHover: { value: -1 }, uBoost: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute vec3 aColor; attribute float aGroup; attribute float aPhase;
      uniform float uScale; uniform float uTime; uniform float uHover; uniform float uBoost; uniform float uMinPx;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float hov = abs(aGroup - uHover) < 0.5 ? 1.0 : 0.0;
        float tw = 0.82 + 0.18 * sin(uTime * 1.6 + aPhase);
        float s = aSize * (1.0 + 0.5 * hov) * uScale / max(-mv.z, 0.01);
        gl_PointSize = clamp(s, uMinPx, 64.0);
        vAlpha = clamp(s / uMinPx, 0.3, 1.0);
        vColor = aColor * tw * (1.0 + 0.9 * hov) * uBoost;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float core = 1.0 - d * 2.0;
        float a = core * core;
        gl_FragColor = vec4(vColor * (a + pow(core, 6.0)), a * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    ...extra,
  });
}

function makePoints(pos, col, size, group, phase) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aGroup', new THREE.BufferAttribute(group, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const p = new THREE.Points(geo, starMaterial());
  p.frustumCulled = false;
  return p;
}

/* ---------- Текст на холсте ---------- */

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (!line || ctx.measureText(t).width <= maxW) line = t;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}
function clampLines(lines, max) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  out[max - 1] = out[max - 1].replace(/[\s,.;:]*\S*$/, '') + ' …';
  return out;
}

function makeLabel(text, { font = FONT_UI, weight = 500, px = 64, color = '#fff', height = 1, letter = 0 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const setFont = () => { g.font = `${weight} ${px}px ${font}`; if (letter) g.letterSpacing = `${letter}px`; };
  setFont();
  const w = Math.ceil(g.measureText(text).width + px * 0.9);
  c.width = w;
  c.height = Math.ceil(px * 1.6);
  setFont();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.9)';
  g.shadowBlur = px * 0.3;
  g.fillStyle = color;
  g.fillText(text, w / 2, c.height / 2);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeTexture(c), transparent: true, depthWrite: false }));
  s.scale.set((height * w) / c.height, height, 1);
  s.userData.base = s.scale.clone();
  return s;
}

/* ---------- Данные ---------- */

let BOOKS = [];
let TOTAL = 0;
let translationName = '';
let customActive = false;

function prepare(data) {
  const raw = data.b;
  const use66 = raw.length === 66 && raw.some((b) => !GENRES[b.g]);
  let acc = 0;
  BOOKS = raw.map((b, i) => {
    const chapters = b.c.map((c) => (Array.isArray(c) ? c : c.v));
    const n = chapters.reduce((s, c) => s + c.length, 0);
    const g = GENRES[b.g] ? b.g : use66 ? GENRES_66[i] : (i >= raw.length - 27 ? 'paul' : 'hist');
    const ci = new Uint16Array(n), vi = new Uint16Array(n), chStart = [];
    let k = 0;
    chapters.forEach((c, cIdx) => { chStart.push(k); c.forEach((_, vIdx) => { ci[k] = cIdx; vi[k] = vIdx; k++; }); });
    const codes = raw.length === 66 ? CODES66 : raw.length === 78 ? CODES78 : null;
    const book = { i, name: b.n, short: b.s || b.n, g, deutero: !!b.d, chapters, n, ci, vi, chStart, offset: acc, code: codes ? codes[i] : null, info: b.info || null };
    acc += n;
    return book;
  });
  TOTAL = acc;
  CODE_TO_BI = {};
  BOOKS.forEach((b) => { if (b.code) CODE_TO_BI[b.code] = b.i; });
  SYN = raw.length === 78;
  translationName = data.t || T().ownName;
  customActive = !!data.custom;
  buildSearchIndex();
}
const verseText = (bi, ci, vi) => BOOKS[bi].chapters[ci][vi];
const refOf = (bi, ci, vi) => `${BOOKS[bi].short} ${ci + 1}${vi != null ? ':' + (vi + 1) : ''}`;

function bookColor(b) {
  const c = new THREE.Color(GENRES[b.g].color);
  if (b.deutero) c.lerp(new THREE.Color('#8a8f9e'), 0.45);
  return c;
}

const dataCache = {};
const idb = {
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('bible-cosmos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('tr');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  async run(mode, fn) {
    // В некоторых встроенных браузерах хранилище не отвечает вовсе, поэтому ждём не больше 2,5 с.
    const timeout = new Promise((res) => setTimeout(() => res(null), 2500));
    return Promise.race([idb.exec(mode, fn), timeout]);
  },
  async exec(mode, fn) {
    try {
      const db = await idb.open();
      return await new Promise((res) => {
        const q = fn(db.transaction('tr', mode).objectStore('tr'));
        q.onsuccess = () => res(q.result ?? null);
        q.onerror = () => res(null);
      });
    } catch { return null; }
  },
  get: (k) => idb.run('readonly', (st) => st.get(k)),
  set: (k, v) => idb.run('readwrite', (st) => st.put(v, k)),
  del: (k) => idb.run('readwrite', (st) => st.delete(k)),
};

async function loadBible(lang, onProgress) {
  if (dataCache[lang]) return dataCache[lang];
  const custom = await idb.get(lang);
  if (custom && Array.isArray(custom.b)) { custom.custom = true; dataCache[lang] = custom; return custom; }
  const res = await fetch(I18N[lang].file);
  if (!res.ok) throw new Error(T().httpFail(res.status));
  const total = +res.headers.get('content-length') || 7400000;
  if (!res.body || !res.body.getReader) return (dataCache[lang] = await res.json());
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  dataCache[lang] = JSON.parse(await new Blob(chunks).text());
  return dataCache[lang];
}

/* ---------- Фон: звёздная пыль ---------- */

function buildDust() {
  const N = 7000;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), grp = new Float32Array(N), ph = new Float32Array(N);
  const tint = [new THREE.Color('#aab8ff'), new THREE.Color('#ffffff'), new THREE.Color('#ffd9b0')];
  const band = new THREE.Vector3(0.3, 1, 0.2).normalize();
  const v = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    v.randomDirection();
    if (i < N * 0.55) { // полоса «Млечного пути»
      v.addScaledVector(band, -v.dot(band) * (0.85 + Math.random() * 0.15)).normalize();
    }
    v.multiplyScalar(500 + Math.random() * 600).add(EYE);
    pos.set([v.x, v.y, v.z], i * 3);
    const c = tint[i % 3].clone().multiplyScalar(0.25 + Math.random() * 0.5);
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 0.8 + Math.random() * 2.2;
    grp[i] = -5;
    ph[i] = Math.random() * 6.28;
  }
  return makePoints(pos, col, size, grp, ph);
}

/* ---------- Уровень 1: галактика книг ---------- */

const galaxy = { group: null, items: [] };

function buildGalaxy() {
  if (galaxy.group) { scene.remove(galaxy.group); disposeTree(galaxy.group); }
  const g = new THREE.Group();
  const R = 64, TURNS = 1.5, EL_A = -0.32, EL_B = 0.64, START = -0.45;
  const slots = [];
  let cum = 0;
  BOOKS.forEach((b, i) => {
    if (i > 0 && BOOKS[i - 1].g !== b.g) cum += 5;
    if (i > 0 && NT_GENRES.has(b.g) && !NT_GENRES.has(BOOKS[i - 1].g)) cum += 18;
    const w = Math.pow(b.n, 0.35) + 4;
    slots.push({ start: cum, w });
    cum += w;
  });
  const total = cum, totalAng = TURNS * Math.PI * 2;
  const place = (f, dist = R, dEl = 0) => {
    const az = START + f * totalAng, el = EL_A + f * (EL_B - EL_A) + dEl;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    return { az, el, dir, pos: dir.clone().multiplyScalar(dist).add(EYE) };
  };

  galaxy.items = BOOKS.map((b, i) => {
    const s = slots[i];
    const f = (s.start + s.w / 2) / total;
    const { az, el, dir, pos: center } = place(f);
    const arc = (s.w / total) * totalAng * R * Math.cos(el);
    const r = arc * 0.44;
    const right = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const upFlat = new THREE.Vector3().crossVectors(right, dir).normalize();
    const tilt = 0.45;
    const up = upFlat.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(dir, Math.sin(tilt));
    const N = b.n;
    const T = Math.max(1.3, Math.sqrt(N / Math.PI) * 0.5);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), grp = new Float32Array(N), ph = new Float32Array(N);
    const base = bookColor(b), white = new THREE.Color('#ffffff'), tmp = new THREE.Color();
    const phase0 = Math.random() * Math.PI * 2;
    for (let k = 0; k < N; k++) {
      const t = (k + 0.5) / N;
      const st = Math.sqrt(t);
      const th = T * Math.PI * 2 * st + phase0;
      const rho = r * (0.06 + 0.94 * st) + (Math.random() - 0.5) * (r / T) * 0.55;
      const depth = (Math.random() - 0.5) * r * 0.12;
      const p = center.clone().addScaledVector(right, rho * Math.cos(th)).addScaledVector(up, rho * Math.sin(th)).addScaledVector(dir, depth);
      pos.set([p.x, p.y, p.z], k * 3);
      const isFirst = b.vi[k] === 0;
      tmp.copy(base).lerp(white, (b.ci[k] % 2 ? 0.0 : 0.3) + (isFirst ? 0.3 : 0)).multiplyScalar(0.75 + Math.random() * 0.35);
      col.set([tmp.r, tmp.g, tmp.b], k * 3);
      size[k] = (0.16 + Math.random() * 0.1) * (isFirst ? 1.8 : 1);
      grp[k] = 0;
      ph[k] = Math.random() * 6.28;
    }
    const pts = makePoints(pos, col, size, grp, ph);
    g.add(pts);

    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: base, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    core.position.copy(center);
    core.scale.setScalar(r * 1.3);
    g.add(core);

    const lh = THREE.MathUtils.clamp(arc * 0.15, 1.0, 2.2);
    const label = makeLabel(b.name, { px: 72, weight: 500, color: '#' + base.clone().lerp(white, 0.35).getHexString(), height: lh });
    label.position.copy(center).addScaledVector(upFlat, -(r * 0.95 + lh * 0.7));
    g.add(label);

    return { bi: i, center, r, hitR: Math.max(r * 1.15, arc * 0.5), pts, label, pos, f };
  });

  // Подписи жанров, туманности и заветов.
  let runStart = 0;
  for (let i = 1; i <= BOOKS.length; i++) {
    if (i < BOOKS.length && BOOKS[i].g === BOOKS[runStart].g) continue;
    const g0 = BOOKS[runStart].g;
    const fA = slots[runStart].start / total, fB = (slots[i - 1].start + slots[i - 1].w) / total;
    const fm = (fA + fB) / 2;
    const color = new THREE.Color(GENRES[g0].color);
    const lbl = makeLabel(gName(g0).toUpperCase(), { px: 64, weight: 600, color: GENRES[g0].color, height: 2.2, letter: 10 });
    lbl.position.copy(place(fm, R * 1.04, 0.13).pos);
    g.add(lbl);
    const span = (fB - fA) * totalAng * R;
    const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
    neb.position.copy(place(fm, R * 1.35).pos);
    neb.scale.setScalar(Math.max(18, span * 1.4));
    g.add(neb);
    runStart = i;
  }
  const ntIndex = BOOKS.findIndex((b) => NT_GENRES.has(b.g));
  const testaments = [[0, T().ot], [ntIndex, T().nt]];
  for (const [bi, text] of testaments) {
    if (bi < 0) continue;
    const t = makeLabel(text, { font: FONT_TITLE, px: 96, weight: 600, color: '#f6e7c1', height: 4.4, letter: 14 });
    t.position.copy(place(slots[bi].start / total, R * 1.02, 0.25).pos);
    g.add(t);
  }
  scene.add(g);
  galaxy.group = g;
}

/* ---------- Уровни 2 и 3 ---------- */

let modeGroup = null;
const state = { mode: 'galaxy', bi: -1, ci: -1, page: 0, pages: 1, focus: -1, book: null, chapter: null };

function headInfo() {
  const pos = new THREE.Vector3(), dir = new THREE.Vector3();
  camera.getWorldPosition(pos);
  camera.getWorldDirection(dir);
  return { pos, yaw: Math.atan2(dir.x, -dir.z) };
}

function buildBook(bi) {
  const b = BOOKS[bi];
  const { pos: eye, yaw } = headInfo();
  const g = new THREE.Group();
  const R = 14, C = b.chapters.length;
  const perRow = Math.min(C, 24);
  const rows = Math.ceil(C / perRow);
  const step = perRow >= 24 ? (Math.PI * 2) / 24 : Math.min(0.52, (Math.PI * 2) / perRow);
  const sp = 0.24;
  const base = bookColor(b), white = new THREE.Color('#fff'), tmp = new THREE.Color();
  const pos = new Float32Array(b.n * 3), col = new Float32Array(b.n * 3), size = new Float32Array(b.n), grp = new Float32Array(b.n), ph = new Float32Array(b.n);
  const items = [];
  let topEl = 0;
  for (let c = 0; c < C; c++) {
    const row = Math.floor(c / perRow), colIdx = c % perRow;
    const inRow = Math.min(perRow, C - row * perRow);
    const az = yaw + (colIdx - (perRow >= 24 ? 0 : (inRow - 1) / 2)) * step;
    const el = ((rows - 1) / 2) * sp - row * sp + 0.06;
    topEl = Math.max(topEl, el);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const center = dir.clone().multiplyScalar(R).add(eye);
    const right = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    const nv = b.chapters[c].length;
    const rc = Math.min(0.3 + 0.09 * Math.sqrt(nv), step * R * 0.4, sp * R * 0.36);
    const k0 = b.chStart[c];
    for (let v = 0; v < nv; v++) {
      const k = k0 + v;
      const rho = rc * Math.sqrt((v + 0.5) / nv);
      const th = v * 2.39996;
      const p = center.clone().addScaledVector(right, rho * Math.cos(th)).addScaledVector(up, rho * Math.sin(th));
      pos.set([p.x, p.y, p.z], k * 3);
      tmp.copy(base).lerp(white, v === 0 ? 0.6 : 0.15 * Math.random()).multiplyScalar(0.8 + Math.random() * 0.3);
      col.set([tmp.r, tmp.g, tmp.b], k * 3);
      size[k] = v === 0 ? 0.16 : 0.09 + Math.random() * 0.04;
      grp[k] = c;
      ph[k] = Math.random() * 6.28;
    }
    const lbl = makeLabel(String(c + 1), { px: 64, weight: 500, color: '#' + base.clone().lerp(white, 0.4).getHexString(), height: 0.5 });
    lbl.position.copy(center).addScaledVector(up, -(rc + 0.38));
    g.add(lbl);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: base, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.copy(center);
    halo.scale.setScalar(rc * 3);
    g.add(halo);
    items.push({ ci: c, center, hitR: Math.max(rc * 1.3, Math.min(step, sp) * R * 0.45), k0, nv, label: lbl, halo });
  }
  const pts = makePoints(pos, col, size, grp, ph);
  g.add(pts);

  const titleDir = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const tEl = topEl + sp * 0.75;
  const title = makeLabel(b.name, { font: FONT_TITLE, px: 110, weight: 600, color: '#f6e7c1', height: 1.6 });
  title.position.copy(eye).addScaledVector(titleDir, R * Math.cos(tEl)).add(new THREE.Vector3(0, R * Math.sin(tEl), 0));
  g.add(title);
  const sub = makeLabel(`${gName(b.g)} · ${chaptersWord(C)} · ${versesWord(b.n)}`, { px: 56, color: GENRES[b.g].color, height: 0.55 });
  sub.position.copy(title.position).add(new THREE.Vector3(0, -1.15, 0));
  g.add(sub);

  return { group: g, items, pts, pos, bi };
}

const CARD = { R: 3.0, W: 1.15, PX: 640, pad: 22, font: 30, lh: 42, maxLines: 26 };
CARD.ppm = CARD.PX / CARD.W;

function drawCard(b, ci, vi, focused) {
  const text = verseText(b.i, ci, vi);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const numW = 58;
  g.font = `${CARD.font}px ${FONT_TEXT}`;
  const all = wrap(g, text, CARD.PX - CARD.pad * 2 - numW);
  const lines = clampLines(all, CARD.maxLines);
  c.width = CARD.PX;
  c.height = CARD.pad * 2 + lines.length * CARD.lh;
  const accent = '#' + bookColor(b).getHexString();
  g.fillStyle = focused ? 'rgba(60, 48, 18, 0.88)' : 'rgba(9, 12, 26, 0.78)';
  g.beginPath();
  g.roundRect(1, 1, c.width - 2, c.height - 2, 16);
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = focused ? '#f3c35b' : 'rgba(150,165,215,0.25)';
  g.stroke();
  g.fillStyle = accent;
  g.font = `600 ${CARD.font - 4}px ${FONT_UI}`;
  g.textBaseline = 'top';
  g.fillText(String(vi + 1), CARD.pad, CARD.pad + 4);
  g.fillStyle = '#eef1fa';
  g.font = `${CARD.font}px ${FONT_TEXT}`;
  lines.forEach((ln, i) => g.fillText(ln, CARD.pad + numW, CARD.pad + i * CARD.lh + 2));
  return { canvas: c, truncated: all.length > lines.length, h: c.height / CARD.ppm };
}

function buildChapter(bi, ci, focus, page) {
  const b = BOOKS[bi];
  const verses = b.chapters[ci];
  const { pos: eye, yaw } = headInfo();
  const top = eye.y + 0.95, maxH = 2.3, gap = 0.06;
  const cards = verses.map((_, vi) => drawCard(b, ci, vi, vi === focus));
  // Раскладка по колонкам сверху вниз.
  const cols = [];
  let cur = [], used = 0;
  cards.forEach((card, vi) => {
    if (cur.length && used + card.h > maxH) { cols.push(cur); cur = []; used = 0; }
    cur.push(vi);
    used += card.h + gap;
  });
  if (cur.length) cols.push(cur);
  const PER_PAGE = 13;
  const pages = Math.ceil(cols.length / PER_PAGE);
  if (focus >= 0) page = Math.floor(cols.findIndex((c) => c.includes(focus)) / PER_PAGE);
  page = THREE.MathUtils.clamp(page, 0, pages - 1);
  const pageCols = cols.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const colStep = (CARD.W + 0.14) / CARD.R;
  let offset = pageCols.length <= 3 ? (pageCols.length - 1) / 2 : 1;
  if (focus >= 0) offset = pageCols.findIndex((c) => c.includes(focus));

  const g = new THREE.Group();
  const items = [];
  const starPos = [], starCol = [];
  const accent = bookColor(b);
  const onPage = new Set(pageCols.flat());
  cards.forEach((card, vi) => { if (!onPage.has(vi)) card.canvas.width = 0; });
  pageCols.forEach((list, cIdx) => {
    const az = yaw + (cIdx - offset) * colStep;
    const dir = new THREE.Vector3(Math.sin(az), 0, -Math.cos(az));
    const right = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    let y = top;
    for (const vi of list) {
      const card = cards[vi];
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CARD.W, card.h),
        new THREE.MeshBasicMaterial({ map: makeTexture(card.canvas), transparent: true, opacity: 0.94, depthWrite: false }),
      );
      const p = eye.clone().addScaledVector(dir, CARD.R);
      p.y = y - card.h / 2;
      mesh.position.copy(p);
      mesh.lookAt(eye.x, p.y, eye.z);
      mesh.userData = { vi, truncated: card.truncated };
      g.add(mesh);
      items.push(mesh);
      const sp = p.clone().addScaledVector(right, -(CARD.W / 2 + 0.07)).add(new THREE.Vector3(0, card.h / 2 - 0.05, 0)).addScaledVector(dir, -0.02);
      starPos.push(sp.x, sp.y, sp.z);
      const c = vi === focus ? new THREE.Color('#ffe7a3') : accent;
      starCol.push(c.r, c.g, c.b);
      y -= card.h + gap;
    }
  });
  const n = starPos.length / 3;
  const pts = makePoints(new Float32Array(starPos), new Float32Array(starCol), new Float32Array(n).fill(0.06), new Float32Array(n).map((_, i) => i), new Float32Array(n).map(() => Math.random() * 6.28));
  g.add(pts);
  const title = makeLabel(T().chapterOf(b.name, ci + 1), { font: FONT_TITLE, px: 96, weight: 600, color: '#f6e7c1', height: 0.26 });
  const fd = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  title.position.copy(eye).addScaledVector(fd, CARD.R + 0.2);
  title.position.y = top + 0.25;
  g.add(title);
  if (pages > 1) {
    const pl = makeLabel(T().page(page + 1, pages), { px: 48, color: '#9aa2bf', height: 0.12 });
    pl.position.copy(title.position).add(new THREE.Vector3(0, -0.17, 0));
    g.add(pl);
  }
  const pageOf = [];
  cols.forEach((list, cIdx) => list.forEach((vi) => { pageOf[vi] = Math.floor(cIdx / PER_PAGE); }));
  return { group: g, items, pts, page, pages, bi, ci, pageOf, eye };
}

/* ---------- Переходы ---------- */

const fader = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
);
fader.renderOrder = 999;
camera.add(fader);
let fadeTarget = 0;
let busy = false;
function waitFade(v) {
  fadeTarget = v;
  return new Promise((resolve) => {
    const check = () => (Math.abs(fader.material.opacity - v) < 0.02 ? resolve() : setTimeout(check, 16));
    check();
  });
}

async function go(mode, opts = {}) {
  if (busy) return;
  busy = true;
  if (!opts.keepReading) stopReading();
  closeDetail();
  hideArcs();
  await waitFade(1);
  if (modeGroup) { scene.remove(modeGroup); disposeTree(modeGroup); modeGroup = null; }
  state.book = state.chapter = null;
  state.mode = mode;
  if (mode === 'galaxy') {
    galaxy.group.visible = true;
  } else if (mode === 'book') {
    galaxy.group.visible = false;
    state.bi = opts.bi;
    state.book = buildBook(opts.bi);
    modeGroup = state.book.group;
  } else {
    galaxy.group.visible = false;
    state.bi = opts.bi;
    state.ci = opts.ci;
    state.focus = opts.focus ?? -1;
    state.chapter = buildChapter(opts.bi, opts.ci, state.focus, opts.page || 0);
    state.page = state.chapter.page;
    state.pages = state.chapter.pages;
    modeGroup = state.chapter.group;
  }
  if (modeGroup) scene.add(modeGroup);
  clearHover();
  updateChrome();
  if (tts.reading) markReading(tts.reading.vi);
  if (mode === 'chapter' && opts.select != null && opts.select >= 0) selectVerse(opts.select);
  await waitFade(0);
  busy = false;
}

function back() {
  if (detail.open) { closeDetail(); return; }
  if (state.mode === 'chapter') go('book', { bi: state.bi });
  else if (state.mode === 'book') go('galaxy');
}
function stepChapter(d) {
  let bi = state.bi, ci = state.ci + d;
  if (ci < 0) { bi--; if (bi < 0) return; ci = BOOKS[bi].chapters.length - 1; }
  if (ci >= BOOKS[bi].chapters.length) { bi++; if (bi >= BOOKS.length) return; ci = 0; }
  go('chapter', { bi, ci });
}
function stepPage(d) {
  const p = state.page + d;
  if (p < 0 || p >= state.pages) return;
  go('chapter', { bi: state.bi, ci: state.ci, page: p });
}
function randomVerse() {
  let k = Math.floor(Math.random() * TOTAL);
  const b = BOOKS.find((x) => k >= x.offset && k < x.offset + x.n);
  k -= b.offset;
  go('chapter', { bi: b.i, ci: b.ci[k], focus: b.vi[k] });
}


/* ---------- Озвучка ---------- */

const tts = { voices: [], reading: null, token: 0, utter: null, warned: {} };
const hasTts = 'speechSynthesis' in window;
function loadVoices() { tts.voices = speechSynthesis.getVoices(); }
if (hasTts) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
// Самый приятный доступный голос: сначала «естественные» нейронные голоса, затем Google и Microsoft.
function pickVoice() {
  const code = LANG;
  const list = tts.voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(code));
  const score = (v) => {
    const n = v.name.toLowerCase();
    let sc = 0;
    if (/natural|neural|online|premium|enhanced/.test(n)) sc += 4;
    if (n.includes('google')) sc += 3;
    if (n.includes('microsoft')) sc += 2;
    if (/svetlana|dariya|milena|alina|irina|ioana|alina/.test(n)) sc += 1;
    return sc;
  };
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}
function speak(text, onDone) {
  if (!hasTts) { toast(T().noTts, 5000); return false; }
  speechSynthesis.cancel();
  const token = ++tts.token;
  const u = new SpeechSynthesisUtterance(text.replace(/\u0301/g, '').replace(/\(([^)]*)\)\s*/, '$1. '));
  const v = pickVoice();
  if (v) u.voice = v;
  else if (!tts.warned[LANG]) { tts.warned[LANG] = true; toast(T().noVoice, 7000); }
  u.lang = T().speech;
  u.rate = 0.92;
  u.pitch = 1;
  u.onend = () => { if (token === tts.token) onDone(); };
  u.onerror = (e) => { if (token === tts.token && e.error !== 'interrupted' && e.error !== 'canceled') stopReading(); };
  tts.utter = u;
  speechSynthesis.speak(u);
  return true;
}

const readFrame = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: '#f3c35b', transparent: true, opacity: 0.55, depthWrite: false }),
);
readFrame.visible = false;
scene.add(readFrame);

function markReading(vi) {
  readFrame.visible = false;
  const ch = state.chapter;
  if (!ch || !tts.reading || ch.bi !== tts.reading.bi || ch.ci !== tts.reading.ci) return;
  const mesh = ch.items.find((m) => m.userData.vi === vi);
  if (!mesh) return;
  const h = mesh.geometry.parameters.height;
  readFrame.scale.set(CARD.W + 0.035, h + 0.035, 1);
  readFrame.quaternion.copy(mesh.quaternion);
  const out = new THREE.Vector3().subVectors(mesh.position, ch.eye).setY(0).normalize();
  readFrame.position.copy(mesh.position).addScaledVector(out, 0.004);
  readFrame.visible = true;
  ch.pts.material.uniforms.uHover.value = ch.items.indexOf(mesh);
  if (!renderer.xr.isPresenting) {
    const d = new THREE.Vector3().subVectors(mesh.position, ch.eye);
    look.target = Math.atan2(d.x, -d.z);
  }
}

async function readFrom(vi) {
  const { bi, ci } = state;
  if (state.mode !== 'chapter') return;
  tts.reading = { bi, ci, vi };
  hideToast();
  if (state.chapter.pageOf[vi] !== state.page) {
    await go('chapter', { bi, ci, page: state.chapter.pageOf[vi], keepReading: true });
  }
  if (!tts.reading || tts.reading.bi !== bi || tts.reading.ci !== ci) return;
  markReading(vi);
  updateListenButton();
  const ok = speak(`${vi === 0 ? T().chapterComma(BOOKS[bi].name, ci + 1) + '. ' : ''}${verseText(bi, ci, vi)}`, () => {
    if (!tts.reading) return;
    const next = vi + 1;
    if (next >= BOOKS[bi].chapters[ci].length) { stopReading(); return; }
    readFrom(next);
  });
  if (!ok) stopReading();
}
function stopReading() {
  const was = !!tts.reading;
  tts.reading = null;
  tts.token++;
  if (hasTts) speechSynthesis.cancel();
  readFrame.visible = false;
  if (was) updateListenButton();
}
function toggleListen() {
  if (tts.reading) stopReading();
  else readFrom(0);
}
function updateListenButton() {
  ui.listen.textContent = tts.reading ? T().stop : T().listen;
  ui.listen.setAttribute('aria-pressed', tts.reading ? 'true' : 'false');
  if (renderer.xr.isPresenting) rebuildPanel();
}

/* ---------- Смена языка ---------- */

function applyLangDom() {
  const L = T();
  document.documentElement.lang = L.htmlLang;
  document.title = L.title;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = typeof L[el.dataset.i18n] === 'string' ? L[el.dataset.i18n] : el.textContent; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = L[el.dataset.i18nPh]; });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = L[el.dataset.i18nTitle]; });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', L[el.dataset.i18nLabel]); });
  ui.langRu.setAttribute('aria-pressed', LANG === 'ru' ? 'true' : 'false');
  ui.langRo.setAttribute('aria-pressed', LANG === 'ro' ? 'true' : 'false');
  updateVrButton();
  updateListenButton();
}
async function setLang(lang) {
  if (lang === LANG || busy) return;
  stopReading();
  LANG = lang;
  try { localStorage.setItem('lang', lang); } catch {}
  applyLangDom();
  if (!dataCache[lang]) toast(T().switching, 20000);
  await reloadLang();
}
async function reloadLang(message) {
  stopReading();
  try {
    const data = await loadBible(LANG, () => {});
    prepare(data);
    buildGalaxy();
    buildLegend();
    await go('galaxy');
    toast(message || T().toastGalaxy, 8000);
  } catch (err) {
    toast(T().loadFail(err.message), 8000);
  }
}
ui.langRu.addEventListener('click', () => setLang('ru'));
ui.langRo.addEventListener('click', () => setLang('ro'));
ui.listen.addEventListener('click', toggleListen);


/* ---------- Связи между стихами и справка о книгах ---------- */

const CODES66 = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr',
  'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal', 'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom',
  '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet',
  '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'];
// Порядок книг Синодального перевода (78 книг).
const CODES78 = [...CODES66.slice(0, 14), 'PrMan', 'Ezra', 'Neh', '1Esd', 'Tob', 'Jdt', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl',
  'Song', 'Wis', 'Sir', 'Isa', 'Jer', 'Lam', 'EpJer', 'Bar', 'Ezek', 'Dan', ...CODES66.slice(27, 39), '1Macc', '2Macc', '3Macc',
  '2Esd', 'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', ...CODES66.slice(44, 58), 'Rev'];
const CODE_NUM = Object.fromEntries(CODES66.map((c, i) => [c, i + 1]));
let CODE_TO_BI = {};
let SYN = false;
let XREF = null;
let BOOKINFO = null;

async function loadExtras() {
  try { const r = await fetch('data/books-info.json'); if (r.ok) BOOKINFO = (await r.json()).b; } catch {}
  if (state.mode === 'book') { renderBookPanel(); if (renderer.xr.isPresenting) rebuildPanel(); }
  try { const r = await fetch('data/xref.json'); if (r.ok) XREF = (await r.json()).x; } catch {}
  if (detail.open) selectVerse(detail.vi);
}

// Псалмы: нумерация Синодального перевода (по Септуагинте) <-> еврейская, в которой записаны связи.
function synToHeb(c, v) {
  if (c <= 8 || c >= 148) return [c, v];
  if (c === 9) return v <= 20 ? [9, v] : [10, v - 20];
  if (c <= 112) return [c + 1, v];
  if (c === 113) return v <= 8 ? [114, v] : [115, v - 8];
  if (c === 114) return [116, v];
  if (c === 115) return [116, v + 9];
  if (c <= 145) return [c + 1, v];
  if (c === 146) return [147, v];
  if (c === 147) return [147, v + 11];
  return null;
}
function hebToSyn(c, v) {
  if (c <= 8 || c >= 148) return [c, v];
  if (c === 9) return [9, v];
  if (c === 10) return [9, v + 20];
  if (c <= 113) return [c - 1, v];
  if (c === 114) return [113, v];
  if (c === 115) return [113, v + 8];
  if (c === 116) return v <= 9 ? [114, v] : [115, v - 9];
  if (c <= 146) return [c - 1, v];
  return v <= 11 ? [146, v] : [147, v - 11];
}
function toId(bi, ci, vi) {
  const b = BOOKS[bi];
  const n = b && CODE_NUM[b.code];
  if (!n) return null;
  let c = ci + 1, v = vi + 1;
  if (SYN && b.code === 'Ps') { const m = synToHeb(c, v); if (!m) return null; [c, v] = m; }
  return n * 1000000 + c * 1000 + v;
}
function fromId(id) {
  const code = CODES66[Math.floor(id / 1000000) - 1];
  const bi = CODE_TO_BI[code];
  if (bi == null) return null;
  let c = Math.floor(id / 1000) % 1000, v = id % 1000;
  if (SYN && code === 'Ps') [c, v] = hebToSyn(c, v);
  const b = BOOKS[bi];
  const ci = THREE.MathUtils.clamp(c, 1, b.chapters.length) - 1;
  const vi = THREE.MathUtils.clamp(v, 1, b.chapters[ci].length) - 1;
  return { bi, ci, vi };
}
function related(bi, ci, vi) {
  if (!XREF) return [];
  const id = toId(bi, ci, vi);
  const arr = id && XREF[id];
  if (!arr) return [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < 0) continue;
    const t = fromId(arr[i]);
    if (!t) continue;
    let end = null;
    if (arr[i + 1] < 0) {
      const e = fromId(-arr[i + 1]);
      if (e && e.bi === t.bi && e.ci === t.ci && e.vi > t.vi) end = e.vi;
    }
    if (!out.some((o) => o.bi === t.bi && o.ci === t.ci && o.vi === t.vi)) out.push({ ...t, end });
  }
  return out;
}
const relRef = (r) => `${BOOKS[r.bi].short} ${r.ci + 1}:${r.vi + 1}${r.end != null ? '–' + (r.end + 1) : ''}`;

// Справка о книге: из таблицы загруженного издания, иначе из data/books-info.json.
function bookAbout(bi) {
  const b = BOOKS[bi];
  const own = BOOKINFO && b.code && BOOKINFO[b.code];
  const loc = own && (own[LANG] || null);
  let rows = [];
  let fromEdition = false;
  if (b.info && b.info.length) { rows = b.info; fromEdition = true; }
  else if (loc) {
    const L = T();
    rows = [[L.author, loc.a], [L.place, loc.p], [L.written, loc.w], [L.covers, loc.t]].filter(([, v]) => v && v !== '—');
  }
  const circ = loc ? loc.c : '';
  if (!rows.length && !circ) return null;
  return { rows, circ, fromEdition };
}
function bookWritten(bi) {
  const b = BOOKS[bi];
  if (b.info && b.info.length) {
    const r = b.info.find(([k]) => /завершено|încheierea|completed/i.test(k));
    if (!r) return '';
    const era = ((r[0].match(/\(([^)]*)\)/) || [])[1] || '').replace(/^гг?\.\s*/, '');
    return era ? `${r[1]} ${era}` : r[1];
  }
  const loc = BOOKINFO && b.code && BOOKINFO[b.code] && BOOKINFO[b.code][LANG];
  return loc && loc.w && loc.w !== '—' ? loc.w : '';
}

function makeAboutPlane(about, width) {
  const c = document.createElement('canvas');
  const W = 1400, pad = 46, g = c.getContext('2d');
  const lines = [];
  g.font = `40px ${FONT_TEXT}`;
  for (const [k, v] of about.rows) lines.push({ k, v });
  const circ = about.circ ? clampLines(wrap(g, about.circ, W - pad * 2), 4) : [];
  c.width = W;
  c.height = pad * 2 + lines.length * 56 + (circ.length ? 20 + circ.length * 54 : 0);
  g.fillStyle = 'rgba(8, 11, 24, 0.82)';
  g.beginPath(); g.roundRect(2, 2, W - 4, c.height - 4, 26); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.35)'; g.lineWidth = 3; g.stroke();
  g.textBaseline = 'top';
  let y = pad;
  for (const { k, v } of lines) {
    g.font = `500 34px ${FONT_UI}`; g.fillStyle = '#9aa2bf'; g.fillText(k, pad, y + 6);
    g.font = `40px ${FONT_TEXT}`; g.fillStyle = '#eef1fa'; g.fillText(v, pad + 560, y);
    y += 56;
  }
  if (circ.length) {
    y += 20;
    g.font = `italic 38px ${FONT_TEXT}`; g.fillStyle = '#f6e7c1';
    for (const ln of circ) { g.fillText(ln, pad, y); y += 54; }
  }
  const h = (width * c.height) / W;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthWrite: false }));
  m.userData.h = h;
  return m;
}

// Дуги к связанным стихам в галактике.
const arcs = (() => {
  const MAXSEG = 12 * 24;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXSEG * 2 * 3), 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#f3c35b', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.frustumCulled = false;
  lines.visible = false;
  scene.add(lines);
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe7a3', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    d.visible = false;
    d.scale.setScalar(1.6);
    scene.add(d);
    dots.push(d);
  }
  return { lines, dots, geo };
})();
function hideArcs() {
  arcs.lines.visible = false;
  for (const d of arcs.dots) d.visible = false;
}
function showArcs(pos, k, rel) {
  const a = new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const arr = arcs.geo.attributes.position.array;
  const SEG = 24;
  let n = 0;
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), ctrl = new THREE.Vector3(), b = new THREE.Vector3();
  rel.slice(0, 12).forEach((r, i) => {
    const it = galaxy.items[r.bi];
    if (!it) return;
    const kk = BOOKS[r.bi].chStart[r.ci] + r.vi;
    b.set(it.pos[kk * 3], it.pos[kk * 3 + 1], it.pos[kk * 3 + 2]);
    ctrl.addVectors(a, b).multiplyScalar(0.5).sub(EYE);
    const dist = a.distanceTo(b);
    if (ctrl.lengthSq() < 1e-6) ctrl.set(0, 1, 0);
    ctrl.normalize().multiplyScalar(64 + dist * 0.35).add(EYE);
    const at = (t, out) => out.set(0, 0, 0).addScaledVector(a, (1 - t) * (1 - t)).addScaledVector(ctrl, 2 * (1 - t) * t).addScaledVector(b, t * t);
    for (let s = 0; s < SEG; s++) {
      at(s / SEG, p0); at((s + 1) / SEG, p1);
      arr.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], n * 6);
      n++;
    }
    arcs.dots[i].position.copy(b);
    arcs.dots[i].visible = true;
  });
  arcs.geo.setDrawRange(0, n * 2);
  arcs.geo.attributes.position.needsUpdate = true;
  arcs.lines.visible = n > 0;
}

// Выбранный стих: карточка со связями и справкой о книге.
const detail = { open: false, vi: -1, vrGroup: null, vrButtons: [] };
const selFrame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#8fc4ff', transparent: true, opacity: 0.6, depthWrite: false }));
selFrame.visible = false;
scene.add(selFrame);

function selectVerse(vi) {
  const ch = state.chapter;
  if (!ch) return;
  const mesh = ch.items.find((m) => m.userData.vi === vi);
  detail.open = true;
  detail.vi = vi;
  if (mesh) {
    const h = mesh.geometry.parameters.height;
    selFrame.scale.set(CARD.W + 0.05, h + 0.05, 1);
    selFrame.quaternion.copy(mesh.quaternion);
    const out = new THREE.Vector3().subVectors(mesh.position, ch.eye).setY(0).normalize();
    selFrame.position.copy(mesh.position).addScaledVector(out, 0.006);
    selFrame.visible = true;
  }
  const rel = related(state.bi, state.ci, vi);
  if (renderer.xr.isPresenting) buildVrDetail(vi, rel, mesh);
  else renderDetail(vi, rel);
}
function closeDetail() {
  detail.open = false;
  detail.vi = -1;
  selFrame.visible = false;
  ui.detail.hidden = true;
  document.body.classList.remove('has-detail');
  if (detail.vrGroup) { scene.remove(detail.vrGroup); disposeTree(detail.vrGroup); detail.vrGroup = null; }
  detail.vrButtons = [];
}
function jumpTo(r) {
  go('chapter', { bi: r.bi, ci: r.ci, focus: r.vi, select: r.vi });
}

const el2 = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function renderDetail(vi, rel) {
  const L = T(), bi = state.bi, ci = state.ci, b = BOOKS[bi];
  const box = ui.detail;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close);
  close.addEventListener('click', closeDetail);
  box.append(close, el2('div', 'ref', refOf(bi, ci, vi)), el2('p', 'text', verseText(bi, ci, vi)));
  const listen = el2('button', 'btn primary', L.listenFrom);
  listen.type = 'button';
  listen.addEventListener('click', () => readFrom(vi));
  box.append(el2('div', 'actions'));
  box.lastChild.append(listen);
  box.append(el2('h3', '', L.related));
  if (!XREF) box.append(el2('p', 'muted', L.relatedLoading));
  else if (!rel.length) box.append(el2('p', 'muted', L.noRelated));
  else {
    const ul = el2('ul', 'links');
    for (const r of rel) {
      const li = el2('li');
      const btn = el2('button');
      btn.type = 'button';
      btn.append(el2('span', 'r', relRef(r)), el2('span', 't', verseText(r.bi, r.ci, r.vi)));
      btn.addEventListener('click', () => jumpTo(r));
      li.append(btn);
      ul.append(li);
    }
    box.append(ul);
  }
  const about = bookAbout(bi);
  if (about) {
    box.append(el2('h3', '', L.aboutBook(b.name)));
    const dl = el2('dl');
    for (const [k, v] of about.rows) dl.append(el2('dt', '', k), el2('dd', '', v));
    box.append(dl);
    if (about.circ) box.append(el2('p', 'circ', about.circ));
    if (!about.fromEdition) box.append(el2('p', 'muted small', L.datesNote));
  }
  box.append(el2('p', 'muted small', L.xrefSource));
  box.hidden = false;
  box.scrollTop = 0;
  document.body.classList.add('has-detail');
  placeDetail();
}
function placeDetail() {
  ui.detail.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}
addEventListener('resize', placeDetail);

function renderBookPanel() {
  const box = ui.bookInfo;
  const about = state.mode === 'book' && !renderer.xr.isPresenting ? bookAbout(state.bi) : null;
  if (!about) { box.hidden = true; return; }
  const L = T();
  box.replaceChildren(el2('h3', '', L.aboutBook(BOOKS[state.bi].name)));
  const dl = el2('dl');
  for (const [k, v] of about.rows) dl.append(el2('dt', '', k), el2('dd', '', v));
  box.append(dl);
  if (about.circ) box.append(el2('p', 'circ', about.circ));
  if (!about.fromEdition) box.append(el2('p', 'muted small', L.datesNote));
  box.hidden = false;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}

function makeRowButton(text, sub, action, w) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * 1000); c.height = 92;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(14, 18, 36, 0.94)';
  g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, 18); g.fill();
  g.strokeStyle = 'rgba(143,196,255,0.5)'; g.lineWidth = 3; g.stroke();
  g.textBaseline = 'middle';
  g.font = `600 36px ${FONT_UI}`; g.fillStyle = '#f3c35b';
  g.fillText(text, 24, c.height / 2);
  const tw = g.measureText(text).width;
  if (sub) {
    g.font = `34px ${FONT_TEXT}`; g.fillStyle = '#e8ecf7';
    let s2 = sub;
    const maxW = c.width - tw - 70;
    while (s2.length > 4 && g.measureText(s2 + '…').width > maxW) s2 = s2.slice(0, -4);
    g.fillText(s2 === sub ? sub : s2 + '…', 24 + tw + 22, c.height / 2 + 2);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * c.height) / c.width), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, color: '#c9d0e6', depthTest: false }));
  m.renderOrder = 35;
  m.userData.action = action;
  return m;
}

function buildVrDetail(vi, rel) {
  if (detail.vrGroup) { scene.remove(detail.vrGroup); disposeTree(detail.vrGroup); }
  const L = T(), bi = state.bi, ci = state.ci;
  const grp = new THREE.Group();
  const W = 1.05;
  // Текст стиха и справка
  const c = document.createElement('canvas');
  const PX = 1100, pad = 40, g = c.getContext('2d');
  g.font = `38px ${FONT_TEXT}`;
  const text = clampLines(wrap(g, verseText(bi, ci, vi), PX - pad * 2), 7);
  const about = bookAbout(bi);
  const info = about ? about.rows.slice(0, 4).map(([k, v]) => `${k}: ${v}`) : [];
  g.font = `italic 32px ${FONT_TEXT}`;
  const circ = about && about.circ ? clampLines(wrap(g, about.circ, PX - pad * 2), 3) : [];
  c.width = PX;
  c.height = pad * 2 + 50 + text.length * 50 + 24 + info.length * 42 + (circ.length ? 12 + circ.length * 42 : 0) + 56;
  g.fillStyle = 'rgba(8, 11, 24, 0.93)';
  g.beginPath(); g.roundRect(2, 2, PX - 4, c.height - 4, 24); g.fill();
  g.strokeStyle = 'rgba(143,196,255,0.55)'; g.lineWidth = 3; g.stroke();
  g.textBaseline = 'top';
  let y = pad;
  g.font = `600 34px ${FONT_UI}`; g.fillStyle = '#f3c35b'; g.fillText(refOf(bi, ci, vi).toUpperCase(), pad, y); y += 50;
  g.font = `38px ${FONT_TEXT}`; g.fillStyle = '#eef1fa';
  for (const ln of text) { g.fillText(ln, pad, y); y += 50; }
  y += 24;
  g.font = `30px ${FONT_UI}`; g.fillStyle = '#9aa2bf';
  for (const ln of info) { g.fillText(ln, pad, y); y += 42; }
  if (circ.length) { y += 12; g.font = `italic 32px ${FONT_TEXT}`; g.fillStyle = '#f6e7c1'; for (const ln of circ) { g.fillText(ln, pad, y); y += 42; } }
  y += 14;
  g.font = `600 32px ${FONT_UI}`; g.fillStyle = '#8fc4ff';
  g.fillText(XREF ? (rel.length ? L.related : L.noRelated) : L.relatedLoading, pad, y);
  const ph = (W * c.height) / PX;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W, ph), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthTest: false }));
  panel.renderOrder = 34;
  panel.position.set(0, ph / 2, 0);
  grp.add(panel);
  // Связанные стихи и действия
  const buttons = [];
  let by = -0.02;
  for (const r of rel.slice(0, 6)) {
    const btn = makeRowButton(relRef(r), verseText(r.bi, r.ci, r.vi), () => jumpTo(r), W);
    const bh = btn.geometry.parameters.height;
    btn.position.set(0, by - bh / 2, 0);
    by -= bh + 0.012;
    grp.add(btn); buttons.push(btn);
  }
  const listen = makeButton(L.xrListen, () => readFrom(vi), 0.3);
  const close = makeButton(L.xrClose, closeDetail, 0.3);
  const bh = listen.geometry.parameters.height;
  listen.position.set(-0.17, by - bh / 2 - 0.01, 0);
  close.position.set(0.17, by - bh / 2 - 0.01, 0);
  grp.add(listen, close); buttons.push(listen, close);
  const { pos, yaw } = headInfo();
  const a = yaw + 0.62;
  grp.position.set(Math.sin(a) * 1.35, -0.05, -Math.cos(a) * 1.35).add(pos);
  grp.lookAt(pos.x, grp.position.y, pos.z);
  scene.add(grp);
  detail.vrGroup = grp;
  detail.vrButtons = buttons;
}

/* ---------- Наведение ---------- */

const raycaster = new THREE.Raycaster();
const tmpV = new THREE.Vector3();

function nearestStar(ray, pos, k0, k1, maxAng) {
  let best = -1, bestA = maxAng;
  const o = ray.origin, d = ray.direction;
  for (let k = k0; k < k1; k++) {
    const x = pos[k * 3] - o.x, y = pos[k * 3 + 1] - o.y, z = pos[k * 3 + 2] - o.z;
    const t = x * d.x + y * d.y + z * d.z;
    if (t <= 0) continue;
    const perp2 = x * x + y * y + z * z - t * t;
    const a = Math.sqrt(Math.max(perp2, 0)) / t;
    if (a < bestA) { bestA = a; best = k; }
  }
  return best;
}
function sphereHit(ray, items) {
  let best = null, score = 1;
  for (const it of items) {
    tmpV.subVectors(it.center, ray.origin);
    const t = tmpV.dot(ray.direction);
    if (t <= 0) continue;
    const perp = Math.sqrt(Math.max(tmpV.lengthSq() - t * t, 0));
    const s = perp / it.hitR;
    if (s < score) { score = s; best = it; }
  }
  return best;
}

function pick(ray) {
  raycaster.ray.copy(ray);
  if (xrPanel.group.visible || detail.vrButtons.length) {
    const hit = raycaster.intersectObjects([...(xrPanel.group.visible ? xrPanel.buttons : []), ...detail.vrButtons], false)[0];
    if (hit) return { type: 'ui', obj: hit.object, dist: hit.distance };
  }
  if (state.mode === 'galaxy') {
    const it = sphereHit(ray, galaxy.items);
    if (!it) return null;
    const b = BOOKS[it.bi];
    const k = nearestStar(ray, it.pos, 0, b.n, 0.012);
    return { type: 'book', bi: it.bi, k, dist: it.center.distanceTo(ray.origin) };
  }
  if (state.mode === 'book' && state.book) {
    const it = sphereHit(ray, state.book.items);
    if (!it) return null;
    const k = nearestStar(ray, state.book.pos, it.k0, it.k0 + it.nv, 0.02);
    return { type: 'chapter', ci: it.ci, k, dist: it.center.distanceTo(ray.origin) };
  }
  if (state.mode === 'chapter' && state.chapter) {
    const hit = raycaster.intersectObjects(state.chapter.items, false)[0];
    if (hit) return { type: 'card', obj: hit.object, vi: hit.object.userData.vi, dist: hit.distance };
  }
  return null;
}

const hoverKey = (h) => (h ? `${h.type}:${h.bi ?? ''}:${h.ci ?? ''}:${h.k ?? ''}:${h.vi ?? ''}:${h.obj?.id ?? ''}` : '');
let hover = null, lastHoverKey = '';
let hoveredLabel = null, hoveredCard = null, hoveredBtn = null;

function clearHover() { hover = null; lastHoverKey = '__'; applyHover(); }

function applyHover() {
  if (hoveredLabel) { hoveredLabel.scale.copy(hoveredLabel.userData.base); hoveredLabel = null; }
  if (hoveredCard) { hoveredCard.scale.setScalar(1); hoveredCard.material.opacity = 0.94; hoveredCard = null; }
  if (hoveredBtn) { hoveredBtn.material.color.set('#c9d0e6'); hoveredBtn.scale.setScalar(1); hoveredBtn = null; }
  for (const it of galaxy.items) it.pts.material.uniforms.uBoost.value = 1;
  if (state.book) state.book.pts.material.uniforms.uHover.value = -1;
  if (state.chapter) state.chapter.pts.material.uniforms.uHover.value = -1;
  marker.visible = false;
  hideArcs();
  const h = hover;
  renderer.domElement.classList.toggle('pointing', !!h && h.type !== 'card');
  if (!h) { showInfo(null); return; }
  if (h.type === 'ui') {
    hoveredBtn = h.obj;
    hoveredBtn.material.color.set('#ffffff');
    hoveredBtn.scale.setScalar(1.06);
    showInfo(null);
    return;
  }
  if (h.type === 'book') {
    const it = galaxy.items[h.bi];
    const b = BOOKS[h.bi];
    it.pts.material.uniforms.uBoost.value = 1.7;
    hoveredLabel = it.label;
    it.label.scale.copy(it.label.userData.base).multiplyScalar(1.25);
    let ref = gName(b.g) + (b.deutero ? ' · ' + T().deutero : ''), text = '';
    let hint = xrHint(T().openBook);
    if (h.k >= 0) {
      ref = refOf(h.bi, b.ci[h.k], b.vi[h.k]);
      text = verseText(h.bi, b.ci[h.k], b.vi[h.k]);
      showMarker(it.pos, h.k, 1.4);
      const rel = related(h.bi, b.ci[h.k], b.vi[h.k]);
      if (rel.length) { showArcs(it.pos, h.k, rel); hint = `${T().linksHint(rel.length)} · ${hint}`; }
    }
    const when = bookWritten(h.bi);
    showInfo({ ref, title: b.name, meta: `${chaptersWord(b.chapters.length)} · ${versesWord(b.n)}${when ? ` · ${T().writtenShort} ${when}` : ''}`, text, hint });
    return;
  }
  if (h.type === 'chapter') {
    const b = BOOKS[state.bi];
    const it = state.book.items[h.ci];
    state.book.pts.material.uniforms.uHover.value = h.ci;
    hoveredLabel = it.label;
    it.label.scale.copy(it.label.userData.base).multiplyScalar(1.3);
    const k = h.k >= 0 ? h.k : it.k0;
    const vi = b.vi[k];
    if (h.k >= 0) showMarker(state.book.pos, h.k, 0.5);
    showInfo({ ref: refOf(state.bi, h.ci, vi), title: T().chapter(h.ci + 1), meta: versesWord(b.chapters[h.ci].length), text: verseText(state.bi, h.ci, vi), hint: xrHint(T().openChapter) });
    return;
  }
  if (h.type === 'card') {
    hoveredCard = h.obj;
    hoveredCard.scale.setScalar(1.035);
    hoveredCard.material.opacity = 1;
    state.chapter.pts.material.uniforms.uHover.value = state.chapter.items.indexOf(h.obj);
    if (h.obj.userData.truncated || !renderer.xr.isPresenting) {
      showInfo({ ref: refOf(state.bi, state.ci, h.vi), title: '', meta: '', text: verseText(state.bi, state.ci, h.vi), hint: renderer.xr.isPresenting ? '' : T().verseHint }, !h.obj.userData.truncated);
    } else showInfo(null);
  }
}
const xrHint = (what) => `${renderer.xr.isPresenting ? T().trigger : T().click}: ${what}`;

const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff6d8', transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
marker.visible = false;
marker.renderOrder = 10;
scene.add(marker);
function showMarker(pos, k, s) {
  marker.position.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  marker.scale.setScalar(s);
  marker.visible = true;
}

/* ---------- Подсказка: HTML на экране, панель в VR ---------- */

const tip = (() => {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 520;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.76), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 20;
  mesh.visible = false;
  scene.add(mesh);
  return { c, g: c.getContext('2d'), mesh };
})();

function drawTip(d) {
  const { c, g } = tip;
  g.clearRect(0, 0, c.width, c.height);
  g.font = `40px ${FONT_TEXT}`;
  const lines = clampLines(d.text ? wrap(g, d.text, c.width - 80) : [], 7);
  const h = 40 + 46 + (d.title ? 56 : 0) + lines.length * 50 + (d.hint ? 52 : 0) + 20;
  g.fillStyle = 'rgba(8, 11, 24, 0.9)';
  g.beginPath(); g.roundRect(2, 2, c.width - 4, h, 22); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.5)'; g.lineWidth = 3; g.stroke();
  let y = 40;
  g.textBaseline = 'top';
  g.fillStyle = '#f3c35b'; g.font = `600 32px ${FONT_UI}`; g.fillText(d.ref.toUpperCase(), 40, y); y += 46;
  if (d.title) { g.fillStyle = '#f6e7c1'; g.font = `600 52px ${FONT_TITLE}`; g.fillText(d.title + (d.meta ? '  ·  ' : ''), 40, y); if (d.meta) { const w = g.measureText(d.title + '  ·  ').width; g.font = `32px ${FONT_UI}`; g.fillStyle = '#9aa2bf'; g.fillText(d.meta, 40 + w, y + 14); } y += 56; }
  g.fillStyle = '#eef1fa'; g.font = `40px ${FONT_TEXT}`;
  for (const ln of lines) { g.fillText(ln, 40, y); y += 50; }
  if (d.hint) { g.fillStyle = '#9aa2bf'; g.font = `30px ${FONT_UI}`; g.fillText(d.hint, 40, y + 12); }
  tip.mesh.material.map.needsUpdate = true;
}

function showInfo(d, desktopOnly = false) {
  if (!d) { ui.info.hidden = true; document.body.classList.remove('has-info'); tip.mesh.visible = false; return; }
  if (renderer.xr.isPresenting) {
    if (desktopOnly) { tip.mesh.visible = false; return; }
    drawTip(d);
    tip.mesh.visible = true;
    return;
  }
  ui.info.hidden = false;
  document.body.classList.add('has-info');
  ui.info.querySelector('.ref').textContent = d.ref;
  ui.info.querySelector('.title').textContent = d.title;
  ui.info.querySelector('.title').hidden = !d.title;
  ui.info.querySelector('.meta').textContent = d.meta;
  ui.info.querySelector('.meta').hidden = !d.meta;
  ui.info.querySelector('.text').textContent = d.text;
  ui.info.querySelector('.text').hidden = !d.text;
  ui.info.querySelector('.hint').textContent = d.hint;
  ui.info.querySelector('.hint').hidden = !d.hint;
}

/* ---------- Панель управления в VR ---------- */

const xrPanel = { group: new THREE.Group(), buttons: [], yaw: 0 };
xrPanel.group.visible = false;
scene.add(xrPanel.group);

function makeButton(text, action, w = 0.3) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * 1400); c.height = 110;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(14, 18, 36, 0.92)';
  g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, 22); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.6)'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#f3f5fb'; g.font = `500 46px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * c.height) / c.width), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, color: '#c9d0e6', depthTest: false }));
  m.renderOrder = 30;
  m.userData.action = action;
  return m;
}

function rebuildPanel() {
  const grp = xrPanel.group;
  for (const ch of [...grp.children]) { grp.remove(ch); disposeTree(ch); }
  const defs = [];
  const L = T();
  if (state.mode === 'book') defs.push([L.xrGalaxy, back]);
  if (state.mode === 'chapter') {
    defs.push([L.xrChapters, back], [L.xrPrev, () => stepChapter(-1)], [L.xrNext, () => stepChapter(1)]);
    defs.push([tts.reading ? L.xrStop : L.xrListen, toggleListen]);
    if (state.pages > 1) defs.push([L.prevPage, () => stepPage(-1)], [L.nextPage, () => stepPage(1)]);
  }
  defs.push([L.xrRandom, randomVerse]);
  const widths = defs.map(([t]) => (t.length > 10 ? 0.34 : 0.22));
  const gap = 0.02;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (defs.length - 1);
  let x = -total / 2;
  xrPanel.buttons = defs.map(([t, fn], i) => {
    const m = makeButton(t, fn, widths[i]);
    m.position.set(x + widths[i] / 2, 0, 0);
    x += widths[i] + gap;
    grp.add(m);
    return m;
  });
  const crumb = state.mode === 'galaxy' ? T().galaxy : state.mode === 'book' ? BOOKS[state.bi].name : T().chapterComma(BOOKS[state.bi].name, state.ci + 1);
  const lbl = makeLabel(crumb, { font: FONT_TITLE, px: 64, weight: 600, color: '#f6e7c1', height: 0.06 });
  lbl.material.depthTest = false;
  lbl.renderOrder = 30;
  lbl.position.set(0, 0.08, 0);
  grp.add(lbl);
  // В VR справка о книге висит слева от панели кнопок.
  const about = state.mode === 'book' ? bookAbout(state.bi) : null;
  if (about) {
    const plane = makeAboutPlane(about, 0.62);
    plane.material.depthTest = false;
    plane.renderOrder = 30;
    plane.position.set(-total / 2 - 0.36, 0.06, 0.12);
    plane.rotation.y = 0.55;
    grp.add(plane);
  }
}

function updatePanel(dt) {
  if (!xrPanel.group.visible) return;
  const { pos, yaw } = headInfo();
  let d = yaw - xrPanel.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(d) > 0.5 || xrPanel.snap) { xrPanel.yaw += xrPanel.snap ? d : d * Math.min(1, dt * 3); xrPanel.snap = false; }
  const p = new THREE.Vector3(Math.sin(xrPanel.yaw) * 0.7, -0.55, -Math.cos(xrPanel.yaw) * 0.7).add(pos);
  xrPanel.group.position.copy(p);
  xrPanel.group.lookAt(pos);
}

/* ---------- Интро в VR ---------- */

let intro = null;
function showIntro() {
  if (intro) return;
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 520;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(8,11,24,0.88)'; g.beginPath(); g.roundRect(2, 2, 1196, 516, 26); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.6)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#f6e7c1'; g.font = `600 72px ${FONT_TITLE}`; g.textBaseline = 'top'; g.fillText(T().introTitle, 50, 40);
  g.fillStyle = '#eef1fa'; g.font = `38px ${FONT_TEXT}`;
  T().intro
    .forEach((t, i) => g.fillText(t, 50, 150 + i * 66));
  intro = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.69), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthTest: false }));
  intro.renderOrder = 40;
  const { pos, yaw } = headInfo();
  intro.position.set(Math.sin(yaw) * 2.2, 0.15, -Math.cos(yaw) * 2.2).add(pos);
  intro.lookAt(pos);
  scene.add(intro);
  setTimeout(hideIntro, 20000);
}
function hideIntro() { if (intro) { scene.remove(intro); disposeTree(intro); intro = null; } }

/* ---------- VR: контроллеры ---------- */

const controllers = [];
let primary = null;
for (let i = 0; i < 2; i++) {
  const ctrl = renderer.xr.getController(i);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f3c35b', transparent: true, opacity: 0.7 }));
  line.scale.z = 30;
  ctrl.add(line);
  const entry = { ctrl, line, gamepad: null, hover: null, turnArmed: true, bWas: false };
  ctrl.addEventListener('connected', (e) => { entry.gamepad = e.data.gamepad || null; entry.hand = !!e.data.hand; line.visible = true; });
  ctrl.addEventListener('disconnected', () => { entry.gamepad = null; line.visible = false; });
  ctrl.addEventListener('selectstart', () => { primary = entry; hideIntro(); activate(entry.hover); });
  rig.add(ctrl);
  controllers.push(entry);
}

function activate(h) {
  if (!h || busy) return;
  if (h.type === 'ui') h.obj.userData.action();
  else if (h.type === 'book') go('book', { bi: h.bi });
  else if (h.type === 'chapter') go('chapter', { bi: state.bi, ci: h.ci });
  else if (h.type === 'card') {
    if (detail.open && detail.vi === h.vi) closeDetail();
    else selectVerse(h.vi);
  }
}

function snapTurn(angle) {
  const head = new THREE.Vector3();
  camera.getWorldPosition(head);
  const local = rig.worldToLocal(head.clone());
  rig.rotation.y += angle;
  rig.updateMatrixWorld(true);
  const after = rig.localToWorld(local);
  rig.position.add(head.sub(after));
  xrPanel.snap = true;
}

function pollGamepads() {
  for (const c of controllers) {
    const gp = c.gamepad;
    if (!gp) continue;
    const x = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0] || 0;
    if (Math.abs(x) > 0.7 && c.turnArmed) { snapTurn(x > 0 ? -Math.PI / 6 : Math.PI / 6); c.turnArmed = false; }
    if (Math.abs(x) < 0.3) c.turnArmed = true;
    const b = gp.buttons[5]?.pressed || false;
    if (b && !c.bWas) back();
    c.bWas = b;
  }
}

/* ---------- Мышь и сенсор ---------- */

const look = { yaw: 0, pitch: 0.12, down: null, moved: false, ndc: new THREE.Vector2(), has: false };
function applyLook() { camera.rotation.set(look.pitch, -look.yaw, 0); }
look.target = null;
applyLook();
const el = renderer.domElement;
el.addEventListener('pointerdown', (e) => { look.target = null; look.down = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch }; look.moved = false; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => {
  look.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  look.has = true;
  if (!look.down) return;
  const dx = e.clientX - look.down.x, dy = e.clientY - look.down.y;
  if (Math.hypot(dx, dy) > 5) look.moved = true;
  if (!look.moved) return;
  const k = (camera.fov / 70) * 0.0042;
  look.yaw = look.down.yaw - dx * k;
  look.pitch = THREE.MathUtils.clamp(look.down.pitch + dy * k, -1.45, 1.45);
  applyLook();
});
el.addEventListener('pointerup', (e) => {
  const wasClick = look.down && !look.moved;
  look.down = null;
  if (!wasClick) return;
  look.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(look.ndc, camera);
  const h = pick(raycaster.ray.clone());
  hideToast();
  activate(h);
});
el.addEventListener('pointerleave', () => { look.has = false; });
el.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, 22, 90);
  camera.updateProjectionMatrix();
}, { passive: false });
addEventListener('keydown', (e) => {
  if (e.target === ui.q) return;
  if (e.key === 'Escape' && detail.open) closeDetail();
  else if (e.key === 'Escape' && tts.reading) stopReading();
  else if (e.key === 'Escape' || e.key === 'Backspace') back();
  else if (e.key === ' ' && state.mode === 'chapter') { e.preventDefault(); toggleListen(); }
  else if (e.key === 'ArrowLeft') { look.yaw -= 0.15; applyLook(); }
  else if (e.key === 'ArrowRight') { look.yaw += 0.15; applyLook(); }
  else if (e.key === 'ArrowUp') { look.pitch = Math.min(1.45, look.pitch + 0.1); applyLook(); }
  else if (e.key === 'ArrowDown') { look.pitch = Math.max(-1.45, look.pitch - 0.1); applyLook(); }
  else if (state.mode === 'chapter' && (e.key === ']' || e.key === 'PageDown')) stepChapter(1);
  else if (state.mode === 'chapter' && (e.key === '[' || e.key === 'PageUp')) stepChapter(-1);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- HTML-интерфейс ---------- */

function crumbButton(text, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.addEventListener('click', fn);
  return b;
}
function updateChrome() {
  const c = ui.crumbs;
  c.replaceChildren();
  const sep = () => Object.assign(document.createElement('span'), { className: 'sep', textContent: '›' });
  const here = (t) => Object.assign(document.createElement('span'), { className: 'here', textContent: t });
  if (state.mode === 'galaxy') c.append(here(T().galaxy));
  else {
    c.append(crumbButton(T().galaxyShort, () => go('galaxy')), sep());
    if (state.mode === 'book') c.append(here(BOOKS[state.bi].name));
    else c.append(crumbButton(BOOKS[state.bi].name, () => go('book', { bi: state.bi })), sep(), here(T().chapter(state.ci + 1)));
  }
  ui.nav.hidden = state.mode !== 'chapter';
  ui.prevPage.hidden = ui.nextPage.hidden = !(state.mode === 'chapter' && state.pages > 1);
  ui.prevPage.disabled = state.page <= 0;
  ui.nextPage.disabled = state.page >= state.pages - 1;
  ui.legend.hidden = state.mode !== 'galaxy';
  renderBookPanel();
  if (state.mode === 'book') toast(T().toastBook, 6000);
  if (state.mode === 'chapter' && !tts.reading) toast(T().toastChapter, 6000);
  updateListenButton();
  rebuildPanel();
}

function buildLegend() {
  const L = ui.legend;
  L.replaceChildren();
  const head = (t) => Object.assign(document.createElement('div'), { className: 'head', textContent: t });
  const row = (g) => {
    const r = document.createElement('div');
    r.className = 'row';
    const i = document.createElement('i');
    i.style.color = GENRES[g].color;
    r.append(i, document.createTextNode(gName(g)));
    return r;
  };
  const used = [...new Set(BOOKS.map((b) => b.g))];
  L.append(head(T().otHead), ...used.filter((g) => !NT_GENRES.has(g)).map(row), head(T().ntHead), ...used.filter((g) => NT_GENRES.has(g)).map(row));
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = T().legendNote(translationName, BOOKS.some((b) => b.deutero));
  L.append(note);
  if (customActive) {
    const n2 = document.createElement('div');
    n2.className = 'note';
    n2.textContent = T().customNote;
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn';
    reset.textContent = T().resetCustom;
    reset.addEventListener('click', async () => {
      await idb.del(LANG);
      delete dataCache[LANG];
      await reloadLang();
    });
    L.append(n2, reset);
  }
}

let toastTimer = 0;
function toast(text, ms = 7000) {
  ui.toast.textContent = text;
  ui.toast.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
  ui.toast.classList.remove('gone');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms);
}
function hideToast() { ui.toast.classList.add('gone'); }

ui.random.addEventListener('click', randomVerse);
ui.prevCh.addEventListener('click', () => stepChapter(-1));
ui.nextCh.addEventListener('click', () => stepChapter(1));
ui.prevPage.addEventListener('click', () => stepPage(-1));
ui.nextPage.addEventListener('click', () => stepPage(1));
ui.legendToggle.addEventListener('click', () => document.body.classList.toggle('legend-open'));

/* ---------- Поиск места: «Ин 3:16», «Бытие 1», «1 Кор 13:4» ---------- */

let searchIndex = [];
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s.]/g, '');
function buildSearchIndex() {
  searchIndex = BOOKS.map((b) => {
    const keys = new Set([norm(b.short), norm(b.name)]);
    keys.add(norm(b.name.replace(/^(от|к)\s+/i, '')));
    if (b.short === 'Пс') ['псалом', 'псалмы', 'псалтырь'].forEach((k) => keys.add(k));
    if (b.short === 'Ps') ['psalm', 'psalmul'].forEach((k) => keys.add(k));
    return { bi: b.i, keys: [...keys] };
  });
}
function findPlace(q) {
  const m = q.trim().match(/^(\d?\s*[^\d]+?)\s*(\d+)?(?:\s*[:.,\s]\s*(\d+))?\s*$/);
  if (!m) return null;
  const key = norm(m[1]);
  if (!key) return null;
  const tests = [(k) => k === key, (k) => key.length >= 2 && k.startsWith(key), (k) => key.length >= 3 && k.includes(key)];
  for (const test of tests) {
    const hit = searchIndex.find((s) => s.keys.some(test));
    if (hit) {
      const b = BOOKS[hit.bi];
      const ci = m[2] ? THREE.MathUtils.clamp(+m[2] - 1, 0, b.chapters.length - 1) : -1;
      const vi = ci >= 0 && m[3] ? THREE.MathUtils.clamp(+m[3] - 1, 0, b.chapters[ci].length - 1) : -1;
      return { bi: hit.bi, ci, vi };
    }
  }
  return null;
}
ui.search.addEventListener('submit', (e) => {
  e.preventDefault();
  const p = findPlace(ui.q.value);
  if (!p) { toast(T().notFound(ui.q.value), 5000); return; }
  ui.q.blur();
  if (p.ci < 0) go('book', { bi: p.bi });
  else go('chapter', { bi: p.bi, ci: p.ci, focus: p.vi });
});

/* ---------- Свой перевод из файла ---------- */

function parseUserFile(text) {
  const data = JSON.parse(text);
  const books = Array.isArray(data) ? data : data.b || data.books;
  if (!Array.isArray(books) || !books.length) throw new Error(T().noBooks);
  const b = books.map((bk, i) => {
    const name = bk.n || bk.name || bk.title || T().bookN(i + 1);
    const chapters = (bk.c || bk.chapters || []).map((ch) => {
      if (Array.isArray(ch)) return ch.map((v) => (typeof v === 'string' ? v : v.text || ''));
      const vs = ch.v || ch.verses || [];
      return vs.map((v) => (typeof v === 'string' ? v : v.text || ''));
    });
    if (!chapters.length) throw new Error(T().noChapters(name));
    return { n: name, s: bk.s || bk.short || bk.abbr || name, g: bk.g || bk.genre, d: bk.d ? 1 : 0, c: chapters };
  });
  return { t: data.t || data.translation || T().ownName, b };
}
let jszipPromise = null;
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  jszipPromise = jszipPromise || new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.onload = () => res(window.JSZip);
    sc.onerror = () => rej(new Error('JSZip'));
    document.head.appendChild(sc);
  });
  return jszipPromise;
}
const latin1 = (buf) => new TextDecoder('iso-8859-1').decode(buf);
function parseXml(text) {
  let doc = new DOMParser().parseFromString(text, 'application/xhtml+xml');
  if (doc.getElementsByTagName('parsererror').length) doc = new DOMParser().parseFromString(text, 'text/html');
  return doc;
}
async function readBibleFiles(fileList, progress) {
  const files = Array.from(fileList);
  const ext = (f) => f.name.toLowerCase().split('.').pop();
  if (files.length === 1 && ext(files[0]) === 'json') return parseUserFile(await files[0].text());
  if (files.every((f) => ext(f) === 'rtf')) {
    const list = [];
    for (const f of files) list.push({ name: f.name, text: latin1(await f.arrayBuffer()) });
    return parseRtfBible(list, progress);
  }
  if (files.length === 1 && (ext(files[0]) === 'epub' || ext(files[0]) === 'zip')) {
    const JSZip = await loadJSZip();
    const z = await JSZip.loadAsync(await files[0].arrayBuffer());
    if (z.file('META-INF/container.xml')) {
      return parseEpubBible({ text: (p) => z.file(p).async('string') }, parseXml, progress);
    }
    const rtfs = z.file(/\.rtf$/i);
    if (rtfs.length) {
      const list = [];
      for (const f of rtfs) list.push({ name: f.name.split('/').pop(), text: latin1(await f.async('uint8array')) });
      return parseRtfBible(list, progress);
    }
  }
  throw new Error(T().unsupported);
}
ui.fileBtn.addEventListener('click', () => ui.file.click());
ui.file.addEventListener('change', async () => {
  if (!ui.file.files.length) return;
  const files = ui.file.files;
  stopReading();
  toast(T().reading(0), 60000);
  try {
    let shown = 0;
    const data = await readBibleFiles(files, (f) => {
      const p = Math.round(f * 100);
      if (p >= shown + 5) { shown = p; toast(T().reading(p), 60000); }
    });
    const lang = data.lang && I18N[data.lang] ? data.lang : LANG;
    delete data.lang;
    data.custom = true;
    await idb.set(lang, { t: data.t, b: data.b });
    dataCache[lang] = data;
    LANG = lang;
    try { localStorage.setItem('lang', lang); } catch {}
    applyLangDom();
    prepare(data);
    await reloadLang(`${T().loaded(data.t, BOOKS.length, versesWord(TOTAL))} ${T().savedHere}`);
  } catch (err) {
    toast(T().fileError(err.message === 'no-books' ? T().noBooks : err.message), 9000);
  }
  ui.file.value = '';
});

/* ---------- Кнопка VR ---------- */

let vrState = 'check';
function updateVrButton() {
  const L = T(), btn = ui.vr;
  btn.disabled = vrState === 'check' || vrState === 'no';
  btn.textContent = { check: L.vrCheck, no: L.vrNo, ready: L.vrEnter, in: L.vrExit }[vrState];
  btn.title = vrState === 'no' ? L.vrNoTitle : '';
}
async function setupVR() {
  const btn = ui.vr;
  vrState = 'no';
  if (!('xr' in navigator)) { updateVrButton(); return; }
  let ok = false;
  try { ok = await navigator.xr.isSessionSupported('immersive-vr'); } catch { ok = false; }
  if (!ok) { updateVrButton(); return; }
  vrState = 'ready';
  updateVrButton();
  let session = null;
  btn.addEventListener('click', async () => {
    if (session) { session.end(); return; }
    try {
      session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
      session.addEventListener('end', () => {
        session = null;
        vrState = 'ready';
        updateVrButton();
        xrPanel.group.visible = false;
        tip.mesh.visible = false;
        hideIntro();
        rig.position.set(0, 0, 0);
        rig.rotation.set(0, 0, 0);
        camera.position.set(0, 1.6, 0);
        applyLook();
        clearHover();
      });
      await renderer.xr.setSession(session);
      vrState = 'in';
      updateVrButton();
      rebuildPanel();
      xrPanel.group.visible = true;
      xrPanel.snap = true;
      showInfo(null);
      showIntro();
    } catch (err) {
      session = null;
      toast(T().vrFail, 7000);
    }
  });
}

/* ---------- Цикл ---------- */

const clock = new THREE.Clock();
function updateScale() {
  let e5 = camera.projectionMatrix.elements[5], h = renderer.domElement.height;
  if (renderer.xr.isPresenting) {
    const xc = renderer.xr.getCamera();
    if (xc.cameras && xc.cameras[0]) e5 = xc.cameras[0].projectionMatrix.elements[5];
    const layer = renderer.xr.getBaseLayer && renderer.xr.getBaseLayer();
    h = (layer && layer.framebufferHeight) || 1832;
  }
  shared.uScale.value = (e5 * h) / 2;
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  shared.uTime.value += dt;
  const o = fader.material.opacity;
  fader.material.opacity = o + (fadeTarget - o) * Math.min(1, dt * 12);
  if (Math.abs(fader.material.opacity - fadeTarget) < 0.02) fader.material.opacity = fadeTarget;
  fader.visible = fader.material.opacity > 0.001;
  updateScale();

  let h = null;
  if (renderer.xr.isPresenting) {
    pollGamepads();
    updatePanel(dt);
    const ray = new THREE.Ray();
    for (const c of controllers) {
      c.ctrl.updateMatrixWorld(true);
      ray.origin.setFromMatrixPosition(c.ctrl.matrixWorld);
      ray.direction.set(0, 0, -1).transformDirection(c.ctrl.matrixWorld);
      c.hover = busy ? null : pick(ray.clone());
      c.line.scale.z = c.hover ? Math.max(0.05, Math.min(c.hover.dist, 30)) : 30;
    }
    const pref = primary && primary.gamepad !== undefined ? primary : controllers[1];
    h = (pref && pref.hover) || controllers.find((c) => c.hover)?.hover || null;
    if (h && tip.mesh.visible) {
      const src = (pref && pref.hover ? pref : controllers.find((c) => c.hover)).ctrl;
      const { pos } = headInfo();
      const dir = new THREE.Vector3(0, 0, -1).transformDirection(src.matrixWorld);
      tip.mesh.position.copy(pos).addScaledVector(dir, 2.6).add(new THREE.Vector3(0, -0.5, 0));
      tip.mesh.lookAt(pos);
    }
  } else if (look.target != null && !look.down) {
    let d = look.target - look.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    look.yaw += d * Math.min(1, dt * 3);
    look.pitch += (0 - look.pitch) * Math.min(1, dt * 2);
    applyLook();
    if (Math.abs(d) < 0.003) look.target = null;
  }
  if (!renderer.xr.isPresenting && look.has && !look.down && !busy) {
    raycaster.setFromCamera(look.ndc, camera);
    h = pick(raycaster.ray.clone());
  }
  const key = hoverKey(h);
  if (key !== lastHoverKey) { hover = h; lastHoverKey = key; applyHover(); }
  renderer.render(scene, camera);
}

/* ---------- Старт ---------- */

async function start() {
  try {
    applyLangDom();
    const sample = 'Ая ăâîșț';
    const fontsReady = Promise.all([
      document.fonts.load(`40px "PT Serif"`, sample),
      document.fonts.load(`600 40px "Cormorant Garamond"`, sample),
      document.fonts.load(`500 40px "IBM Plex Sans Condensed"`, sample),
    ]).catch(() => {});
    const data = await loadBible(LANG, (f) => {
      ui.bar.style.width = `${Math.round(f * 100)}%`;
      ui.status.textContent = `${T().loading} ${Math.round(f * 100)}%`;
    });
    ui.status.textContent = T().lighting;
    await Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]);
    prepare(data);
    scene.add(buildDust());
    buildGalaxy();
    buildLegend();
    updateChrome();
    renderer.setAnimationLoop(tick);
    ui.loader.classList.add('done');
    window.__started = true;
    toast(T().toastGalaxy, 9000);
    setupVR();
    loadExtras();
  } catch (err) {
    ui.status.textContent = T().loadFail(err.message);
  }
}
start();

// Для проверки без шлема: построение VR-панелей можно вызвать из консоли.
window.__bibleCosmos = { buildVrDetail, rebuildPanel, related, bookAbout, state };
