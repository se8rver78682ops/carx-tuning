// three.js грузится с запасного адреса, если основной недоступен.
const THREE_URLS = [
  ...(location.hostname === 'appassets.androidplatform.net' ? ['./vendor/three.module.js'] : []),
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
import { buildSky } from './sky.js';

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
const FONT_CARD = '"Lora", "PT Serif", Georgia, serif';

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
    htmlLang: 'ru', speech: 'ru-RU',
    title: 'Библейский космос',
    quote: '«Он знает число звёзд и всех их называет по имени» (Псалом 147:4)',
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
    search: 'Найти', searchPh: 'Ин 3:16 или слово', searchLabel: 'Перейти к месту', random: '✦ Случайный стих',
    own: 'Открыть EPUB…', ownTitle: 'Открыть свой файл Библии в формате JSON. Файл не покидает ваш браузер.',
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
    loading: 'Открываем Библию…', lighting: 'Зажигаем звёзды…',
    loadFail: (m) => `Не удалось загрузить Библию: ${m}`, httpFail: (c) => `Файл данных не загрузился (HTTP ${c}).`,
    switching: 'Загружаем русский текст…',
    related: 'Связанные стихи', noRelated: 'Для этого стиха связей нет.', relatedLoading: 'Связи ещё загружаются…',
    aboutBook: (n) => `О книге «${n}»`, author: 'Кто написал', place: 'Где написана', written: 'Когда написана', covers: 'Какое время описано',
    circumstances: 'Обстоятельства', datesNote: 'Даты традиционные и приблизительные, у исследователей есть и другие мнения.',
    listenFrom: '▶ Слушать отсюда', close: 'Закрыть', linksHint: (n) => `Связей: ${n}, они показаны дугами`,
    xrefSource: 'Связи между стихами: OpenBible.info (CC BY).', writtenShort: 'написана',
    xrClose: '✕ Закрыть',
    home: '⌂ В начало', homeTitle: 'Вернуться к галактике книг', xrHome: '⌂ Начало',
    hintsOn: 'Подсказки: вкл', hintsOff: 'Подсказки: выкл', hintsTitle: 'Показывать или скрывать подсказки',
    hideHint: 'Скрыть подсказку',
    tapAgain: (w) => `Коснитесь ещё раз: ${w}`, cont: (r) => `▶ Продолжить: ${r}`,
    bookmarks: 'Закладки', addBm: '☆ В закладки', inBm: '★ В закладках', xrAddBm: '☆ Закладка', xrInBm: '★ Закладка',
    noBm: 'Закладок пока нет. Откройте стих и нажмите «☆ В закладки».',
    topics: 'Созвездия тем', topicsNote: 'Выберите тему: её стихи соединятся линиями в созвездие на небе.',
    votd: 'Стих дня', votdGo: 'Перейти', votdListen: '▶ Слушать',
    settings: 'Настройки', textSize: 'Размер текста', rate: 'Скорость чтения', voice: 'Голос', voiceAuto: 'Самый естественный (автоматически)',
    gyro: 'Обзор поворотом телефона', gyroNo: 'Датчик поворота здесь недоступен. Он работает в приложении для Android и при открытии ссылки в браузере телефона.',
    order: 'Порядок книг', orderCanon: 'Библейский', orderTime: 'По времени написания',
    resetProgress: 'Сбросить прогресс чтения', resetConfirm: 'Нажмите ещё раз, чтобы сбросить', progressDone: 'Прогресс сброшен.',
    progress: (r, t) => `Прочитано глав: ${r} из ${t}`, readMark: 'прочитана',
    found: (n) => `Найдено стихов: ${n}`, foundMore: (n) => `Показаны первые ${n}. Уточните запрос.`, nothingFound: (q) => `По запросу «${q}» ничего не найдено.`,
    searchTitle: (q) => `Поиск: «${q}»`, searchShort: 'Введите хотя бы 3 буквы.',
    bce: 'до н. э.', ce: 'н. э.', eraBce: 'ДО НАШЕЙ ЭРЫ', eraCe: 'НАША ЭРА', close2: 'Закрыть',
    whoWas: (n) => `Кто это был: ${n}`, narrate: '▶ Рассказать', narrateStop: '■ Остановить рассказ',
    quiz: 'Викторина', quizTitle: 'Угадай книгу', quizScore: (c, t) => `Верно: ${c} из ${t}`, quizQ: 'Из какой книги этот стих?',
    quizRight: 'Верно!', quizWrong: (b) => `Нет, это книга «${b}»`, quizRead: '▶ Прочитать', quizShow: 'Показать в космосе',
    quizNext: 'Следующий вопрос', menu: '☰ Ещё', xrQuiz: '? Викторина', xrNarrate: '▶ Рассказ', xrStopNarr: '■ Стоп',
    ownTitle2: 'Открыть свой файл Библии: EPUB, RTF, zip с ними или JSON. Файл не покидает ваше устройство.',
    reading: (p) => `Читаем файл… ${p}%`,
    unsupported: 'Подходят файлы EPUB, RTF, zip-архив с ними или JSON.',
    savedHere: 'Перевод сохранён на этом устройстве, открывать файл снова не нужно.',
    welcomeTitle: 'Откройте вашу Библию',
    welcomeText: 'Выберите файлы EPUB (можно сразу русский и румынский). Текст разбирается и хранится только на этом устройстве, открывать файлы нужно один раз.',
    welcomeBtn: 'Открыть файлы EPUB',
    needLang: 'Румынская Библия ещё не открыта. Выберите её файл EPUB.',
    needLangRu: 'Русская Библия ещё не открыта. Выберите её файл EPUB.',
    loadedMany: (list) => `Загружено: ${list}. Файлы остались только на этом устройстве.`,
    customNote: 'Свой перевод, хранится только на этом устройстве.',
  },
  ro: {
    htmlLang: 'ro', speech: 'ro-RO',
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
    search: 'Caută', searchPh: 'Ioan 3:16 sau cuvânt', searchLabel: 'Mergi la pasaj', random: '✦ Verset la întâmplare',
    own: 'Deschide EPUB…', ownTitle: 'Deschideți propriul fișier Biblie în format JSON. Fișierul nu părăsește browserul.',
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
    loading: 'Se deschide Biblia…', lighting: 'Aprindem stelele…',
    loadFail: (m) => `Biblia nu s-a putut încărca: ${m}`, httpFail: (c) => `Fișierul de date nu s-a încărcat (HTTP ${c}).`,
    switching: 'Se încarcă textul românesc…',
    related: 'Versete legate', noRelated: 'Acest verset nu are legături.', relatedLoading: 'Legăturile se încarcă încă…',
    aboutBook: (n) => `Despre cartea „${n}”`, author: 'Cine a scris', place: 'Unde a fost scrisă', written: 'Când a fost scrisă', covers: 'Perioada descrisă',
    circumstances: 'Împrejurări', datesNote: 'Datele sunt tradiționale și aproximative; cercetătorii au și alte păreri.',
    listenFrom: '▶ Ascultă de aici', close: 'Închide', linksHint: (n) => `Legături: ${n}, arătate prin arcuri`,
    xrefSource: 'Legăturile dintre versete: OpenBible.info (CC BY).', writtenShort: 'scrisă',
    xrClose: '✕ Închide',
    home: '⌂ Început', homeTitle: 'Înapoi la galaxia cărților', xrHome: '⌂ Început',
    hintsOn: 'Indicii: pornite', hintsOff: 'Indicii: oprite', hintsTitle: 'Arată sau ascunde indiciile',
    hideHint: 'Ascunde indiciul',
    tapAgain: (w) => `Atingeți din nou: ${w}`, cont: (r) => `▶ Continuă: ${r}`,
    bookmarks: 'Semne de carte', addBm: '☆ Adaugă semn', inBm: '★ Are semn', xrAddBm: '☆ Semn', xrInBm: '★ Semn',
    noBm: 'Încă nu aveți semne de carte. Deschideți un verset și apăsați „☆ Adaugă semn”.',
    topics: 'Constelații pe teme', topicsNote: 'Alegeți o temă: versetele ei se vor uni prin linii într-o constelație.',
    votd: 'Versetul zilei', votdGo: 'Mergi', votdListen: '▶ Ascultă',
    settings: 'Setări', textSize: 'Mărimea textului', rate: 'Viteza citirii', voice: 'Vocea', voiceAuto: 'Cea mai naturală (automat)',
    gyro: 'Privire prin rotirea telefonului', gyroNo: 'Senzorul de rotire nu este disponibil aici. Funcționează în aplicația Android și în browserul telefonului.',
    order: 'Ordinea cărților', orderCanon: 'Biblică', orderTime: 'După data scrierii',
    resetProgress: 'Resetează progresul citirii', resetConfirm: 'Apăsați din nou pentru a reseta', progressDone: 'Progresul a fost resetat.',
    progress: (r, t) => `Capitole citite: ${r} din ${t}`, readMark: 'citit',
    found: (n) => `Versete găsite: ${n}`, foundMore: (n) => `Sunt afișate primele ${n}. Precizați căutarea.`, nothingFound: (q) => `Nu s-a găsit nimic pentru „${q}”.`,
    searchTitle: (q) => `Căutare: „${q}”`, searchShort: 'Introduceți cel puțin 3 litere.',
    bce: 'î.e.n.', ce: 'e.n.', eraBce: 'ÎNAINTE DE ERA NOASTRĂ', eraCe: 'ERA NOASTRĂ', close2: 'Închide',
    whoWas: (n) => `Cine a fost: ${n}`, narrate: '▶ Povestește', narrateStop: '■ Oprește povestirea',
    quiz: 'Test', quizTitle: 'Ghicește cartea', quizScore: (c, t) => `Corect: ${c} din ${t}`, quizQ: 'Din ce carte este acest verset?',
    quizRight: 'Corect!', quizWrong: (b) => `Nu, este cartea „${b}”`, quizRead: '▶ Citește', quizShow: 'Arată în cosmos',
    quizNext: 'Întrebarea următoare', menu: '☰ Mai mult', xrQuiz: '? Test', xrNarrate: '▶ Poveste', xrStopNarr: '■ Stop',
    ownTitle2: 'Deschideți propriul fișier Biblie: EPUB, RTF, o arhivă zip cu ele sau JSON. Fișierul nu părăsește dispozitivul.',
    reading: (p) => `Se citește fișierul… ${p}%`,
    unsupported: 'Sunt acceptate fișiere EPUB, RTF, o arhivă zip cu ele sau JSON.',
    savedHere: 'Traducerea este salvată pe acest dispozitiv, nu trebuie deschisă din nou.',
    welcomeTitle: 'Deschideți Biblia voastră',
    welcomeText: 'Alegeți fișierele EPUB (puteți alege deodată rusă și română). Textul este citit și păstrat doar pe acest dispozitiv; fișierele se deschid o singură dată.',
    welcomeBtn: 'Deschide fișierele EPUB',
    needLang: 'Biblia în română nu este încă deschisă. Alegeți fișierul ei EPUB.',
    needLangRu: 'Biblia în rusă nu este încă deschisă. Alegeți fișierul ei EPUB.',
    loadedMany: (list) => `S-a încărcat: ${list}. Fișierele rămân doar pe acest dispozitiv.`,
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
  legendToggle: $('legendToggle'), home: $('home'), welcome: $('welcome'), welcomeBtn: $('welcomeBtn'), listPanel: $('listPanel'), votd: $('votd'), continueBtn: $('continueBtn'), settingsPanel: $('settingsPanel'), bmBtn: $('bmBtn'), topicsBtn: $('topicsBtn'), votdBtn: $('votdBtn'), settingsBtn: $('settingsBtn'), quiz: $('quiz'), quizBtn: $('quizBtn'), menuBtn: $('menuBtn'), menuList: $('menuList'), hintsBtn: $('hintsBtn'), toastText: $('toastText'), toastClose: $('toastClose'), legendClose: $('legendClose'), brand: $('brand'), detail: $('detail'), bookInfo: $('bookInfo'), file: $('file'), fileBtn: $('fileBtn'), listen: $('listen'), langRu: $('langRu'), langRo: $('langRo'),
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

async function loadBible(lang) {
  if (dataCache[lang]) return dataCache[lang];
  const custom = await idb.get(lang);
  if (custom && Array.isArray(custom.b)) { custom.custom = true; dataCache[lang] = custom; return custom; }
  const err = new Error('need-import');
  err.needImport = true;
  throw err;
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
  // Порядок книг: библейский или по времени написания.
  const timeline = settings.order === 'time' && BOOKS.every((b) => bookYear(b) != null);
  galaxy.timeline = timeline;
  const order = BOOKS.map((b) => b.i);
  if (timeline) order.sort((a, b) => bookYear(BOOKS[a]) - bookYear(BOOKS[b]) || a - b);
  const slots = [];
  let cum = 0;
  order.forEach((bi, j) => {
    const b = BOOKS[bi], prev = j > 0 ? BOOKS[order[j - 1]] : null;
    if (prev && timeline && bookYear(prev) < 0 && bookYear(b) > 0) cum += 18;
    if (prev && !timeline) {
      if (prev.g !== b.g) cum += 5;
      if (NT_GENRES.has(b.g) && !NT_GENRES.has(prev.g)) cum += 18;
    }
    const w = Math.pow(b.n, 0.35) + 4;
    slots[bi] = { start: cum, w };
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
    const label = makeLabel(timeline ? `${b.name} · ${fmtYear(bookYear(b))}` : b.name, { px: 72, weight: 500, color: '#' + base.clone().lerp(white, 0.35).getHexString(), height: lh });
    label.position.copy(center).addScaledVector(upFlat, -(r * 0.95 + lh * 0.7));
    g.add(label);

    return { bi: i, center, r, hitR: Math.max(r * 1.15, arc * 0.5), pts, label, pos, f, base: col.slice() };
  });

  // Подписи жанров, туманности и заветов.
  let runStart = 0;
  for (let i = 1; i <= BOOKS.length && !timeline; i++) {
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
  const testaments = timeline
    ? [[order[0], T().eraBce], [order.find((bi) => bookYear(BOOKS[bi]) > 0), T().eraCe]]
    : [[0, T().ot], [ntIndex, T().nt]];
  for (const [bi, text] of testaments) {
    if (bi == null || bi < 0) continue;
    const t = makeLabel(text, { font: FONT_TITLE, px: 96, weight: 600, color: '#f6e7c1', height: 4.4, letter: 14 });
    t.position.copy(place(slots[bi].start / total, R * 1.02, 0.25).pos);
    g.add(t);
  }
  scene.add(g);
  galaxy.group = g;
  g.visible = state.mode === 'galaxy';
  galaxy.bmPts = galaxy.searchPts = galaxy.topic = null;
  votdStar = null;
  BOOKS.forEach((b) => updateBookColors(b.i));
  refreshBmStars();
}

/* ---------- Уровни 2 и 3 ---------- */

let modeGroup = null;
let sky = null;
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      tmp.copy(base).lerp(white, v === 0 ? 0.7 : 0.3 + 0.2 * Math.random()).multiplyScalar(1.1 + Math.random() * 0.3);
      col.set([tmp.r, tmp.g, tmp.b], k * 3);
      size[k] = v === 0 ? 0.3 : 0.15 + Math.random() * 0.06;
      grp[k] = c;
      ph[k] = Math.random() * 6.28;
    }
    const read = isRead(bi, c);
    const lbl = makeLabel(read ? `✓ ${c + 1}` : String(c + 1), { font: FONT_TITLE, px: 96, weight: 600, color: read ? '#f3c35b' : '#' + base.clone().lerp(white, 0.5).getHexString(), height: 0.78 });
    lbl.position.copy(center).addScaledVector(up, -(rc + 0.52));
    g.add(lbl);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: read ? new THREE.Color('#f3c35b') : base, transparent: true, opacity: read ? 0.5 : 0.26, depthWrite: false, blending: THREE.AdditiveBlending }));
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

const CARD = { R: 3.2, W: 1.3, PX: 720, pad: 26, font: 36, lh: 52, maxLines: 22, numW: 76 };
function applyCardScale(k) { CARD.font = Math.round(36 * k); CARD.lh = Math.round(52 * k); CARD.numW = Math.round(76 * Math.sqrt(k)); }
CARD.ppm = CARD.PX / CARD.W;

function drawCard(b, ci, vi, focused) {
  const text = verseText(b.i, ci, vi);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${CARD.font}px ${FONT_CARD}`;
  const all = wrap(g, text, CARD.PX - CARD.pad * 2 - CARD.numW);
  const lines = clampLines(all, CARD.maxLines);
  c.width = CARD.PX;
  c.height = Math.max(CARD.pad * 2 + lines.length * CARD.lh + 6, 112);
  const accent = '#' + bookColor(b).clone().lerp(new THREE.Color('#ffffff'), 0.25).getHexString();
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, focused ? 'rgba(74, 56, 18, 0.93)' : 'rgba(18, 22, 44, 0.88)');
  bg.addColorStop(1, focused ? 'rgba(38, 28, 8, 0.93)' : 'rgba(6, 8, 20, 0.88)');
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(1, 1, c.width - 2, c.height - 2, 22);
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = focused ? '#f3c35b' : 'rgba(243, 195, 91, 0.3)';
  g.stroke();
  // Номер стиха — крупная золотая цифра, как в старинных изданиях.
  g.textBaseline = 'top';
  g.textAlign = 'center';
  g.fillStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 14;
  g.font = `600 ${CARD.font + 22}px ${FONT_TITLE}`;
  g.fillText(String(vi + 1), CARD.pad + CARD.numW / 2 - 8, CARD.pad - 10);
  g.shadowBlur = 0;
  g.textAlign = 'left';
  g.fillStyle = '#f2f4fb';
  g.font = `${CARD.font}px ${FONT_CARD}`;
  lines.forEach((ln, k) => g.fillText(ln, CARD.pad + CARD.numW, CARD.pad + k * CARD.lh + 4));
  if (isBookmarked(b.i, ci, vi)) {
    g.fillStyle = '#f3c35b';
    g.font = `40px ${FONT_UI}`;
    g.textAlign = 'right';
    g.fillText('★', c.width - 14, 8);
    g.textAlign = 'left';
  }
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
  const colStep = (CARD.W + 0.16) / CARD.R;
  const PER_PAGE = Math.max(3, Math.floor((Math.PI * 2 * 0.86) / colStep));
  const pages = Math.ceil(cols.length / PER_PAGE);
  if (focus >= 0) page = Math.floor(cols.findIndex((c) => c.includes(focus)) / PER_PAGE);
  page = THREE.MathUtils.clamp(page, 0, pages - 1);
  const pageCols = cols.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
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
      mesh.userData = { vi, truncated: card.truncated, home: mesh.position.clone(), order: items.length };
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
  const pts = makePoints(new Float32Array(starPos), new Float32Array(starCol), new Float32Array(n).fill(0.07), new Float32Array(n).map((_, i) => i), new Float32Array(n).map(() => Math.random() * 6.28));
  g.add(pts);
  const title = makeLabel(`✦  ${T().chapterOf(b.name, ci + 1)}  ✦`, { font: FONT_TITLE, px: 120, weight: 600, color: '#f6e7c1', height: 0.36 });
  const fd = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  title.position.copy(eye).addScaledVector(fd, CARD.R + 0.25);
  title.position.y = top + 0.33;
  g.add(title);
  if (pages > 1) {
    const pl = makeLabel(T().page(page + 1, pages), { px: 52, color: '#b6bdd6', height: 0.13 });
    pl.position.copy(title.position).add(new THREE.Vector3(0, -0.22, 0));
    g.add(pl);
  }
  const pageOf = [];
  cols.forEach((list, cIdx) => list.forEach((vi) => { pageOf[vi] = Math.floor(cIdx / PER_PAGE); }));
  return { group: g, items, pts, page, pages, bi, ci, pageOf, eye, title };
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

/* ---------- Видеоэффекты переходов ---------- */

const fx = (() => {
  // Прыжок: светящиеся следы звёзд летят навстречу (или от вас при возврате).
  const N = 320;
  const pos = new Float32Array(N * 2 * 3), col = new Float32Array(N * 2 * 3);
  const st = Array.from({ length: N }, () => ({ x: 0, y: 0, z: 0, sp: 0 }));
  const reset = (p, anywhere) => {
    const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 6;
    p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
    p.z = anywhere ? -2 - Math.random() * 60 : -60 - Math.random() * 10;
    p.sp = 40 + Math.random() * 70;
  };
  st.forEach((p) => reset(p, true));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  lines.renderOrder = 1000;
  lines.frustumCulled = false;
  lines.visible = false;
  camera.add(lines);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe7b0', transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  flash.position.set(0, 0, -2);
  flash.scale.setScalar(3.5);
  flash.renderOrder = 1001;
  camera.add(flash);
  const state = { power: 0, target: 0, dir: 1, timer: 0 };
  const anims = [];
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  return {
    warp(dir) { state.dir = dir; state.target = 1; state.timer = 0.75; lines.visible = true; st.forEach((p) => reset(p, true)); },
    // Появление нового уровня: стихи слетаются на свои места, скопления разлетаются из центра.
    enter(mode) {
      flash.material.opacity = 0.55;
      if (mode === 'chapter' && state && modeGroupRef()) {
        const ch = chapterRef();
        const eye = ch.eye;
        ch.items.forEach((m) => {
          const home = m.userData.home;
          const from = new THREE.Vector3().subVectors(home, eye).multiplyScalar(4.5).add(eye);
          from.y += (Math.random() - 0.5) * 3;
          const delay = Math.min(1.1, m.userData.order * 0.03);
          m.position.copy(from);
          m.scale.setScalar(0.25);
          m.material.opacity = 0;
          anims.push({ t: -delay, dur: 0.85, f: (k) => {
            m.position.lerpVectors(from, home, k);
            m.scale.setScalar(0.25 + 0.75 * k);
            m.material.opacity = 0.94 * k;
          } });
        });
        const u = ch.pts.material.uniforms.uBoost;
        u.value = 0;
        anims.push({ t: -0.4, dur: 1.2, f: (k) => { u.value = k; } });
        const tl = ch.title, base = tl.scale.clone();
        anims.push({ t: 0, dur: 0.9, f: (k) => { tl.scale.copy(base).multiplyScalar(0.6 + 0.4 * k); tl.material.opacity = k; } });
      } else if (mode === 'book' || mode === 'galaxy') {
        const g = mode === 'book' ? modeGroupRef() : galaxy.group;
        if (!g) return;
        const eye = new THREE.Vector3();
        camera.getWorldPosition(eye);
        const s0 = mode === 'book' ? 0.35 : 1.6;
        anims.push({ t: 0, dur: 1.0, f: (k) => {
          const sc = s0 + (1 - s0) * k;
          g.scale.setScalar(sc);
          g.position.copy(eye).multiplyScalar(1 - sc);
        } });
      }
    },
    update(dt) {
      // анимации появления
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i];
        a.t += dt;
        const k = Math.min(1, Math.max(0, a.t / a.dur));
        a.f(ease(k));
        if (a.t >= a.dur) anims.splice(i, 1);
      }
      flash.material.opacity = Math.max(0, flash.material.opacity - dt * 0.9);
      flash.visible = flash.material.opacity > 0.01;
      // прыжок
      state.timer -= dt;
      if (state.timer <= 0) state.target = 0;
      state.power += (state.target - state.power) * Math.min(1, dt * 5);
      if (state.power < 0.01 && state.target === 0) { lines.visible = false; return; }
      const sp = state.power * state.dir;
      for (let i = 0; i < N; i++) {
        const p = st[i];
        p.z += p.sp * sp * dt;
        if (p.z > -1.2) reset(p, false);
        if (p.z < -75) { reset(p, true); p.z = -2 - Math.random() * 8; }
        const len = 0.5 + p.sp * 0.06 * state.power;
        const k = i * 6;
        pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z;
        pos[k + 3] = p.x * 1.02; pos[k + 4] = p.y * 1.02; pos[k + 5] = p.z - len;
        const b = state.power * Math.min(1, (75 + p.z) / 30);
        col[k] = b; col[k + 1] = b * 0.95; col[k + 2] = b * 0.85;
        col[k + 3] = 0; col[k + 4] = 0; col[k + 5] = b * 0.25;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
})();
function modeGroupRef() { return modeGroup; }
function chapterRef() { return state.chapter; }

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
  if (mode !== 'book') stopNarration();
  closeDetail();
  hideArcs();
  const flashy = !reducedMotion && !opts.keepReading;
  if (flashy) fx.warp(mode === 'galaxy' ? -1 : 1);
  await waitFade(1);
  if (modeGroup) { scene.remove(modeGroup); disposeTree(modeGroup); modeGroup = null; }
  state.book = state.chapter = null;
  state.mode = mode;
  if (sky) sky.setMode(mode);
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
  clearTimeout(readTimer);
  if (mode === 'chapter') {
    const { bi, ci } = state;
    store.set('last', refKey(bi, ci));
    readTimer = setTimeout(() => { if (state.mode === 'chapter' && state.bi === bi && state.ci === ci) markRead(bi, ci); }, 12000);
  }
  if (flashy) fx.enter(mode);
  await waitFade(0);
  busy = false;
}

function goHome() {
  if (renderer.xr.isPresenting) rig.position.set(0, 0, 0);
  closeList();
  closeDetail();
  closeQuiz();
  stopNarration();
  look.yaw = 0; look.pitch = 0.12; look.target = null;
  camera.fov = 70; camera.updateProjectionMatrix();
  applyLook();
  ui.bookInfo.dataset.closed = '';
  if (state.mode !== 'galaxy') go('galaxy');
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
  if (settings.voice) {
    const v = tts.voices.find((x) => x.name === settings.voice && x.lang.toLowerCase().startsWith(code));
    if (v) return v;
  }
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
// В APK (Android WebView) нет speechSynthesis, там читает встроенный синтезатор Android через мост AndroidTTS.
const androidDone = {};
window.__ttsDone = (id) => { const f = androidDone[id]; delete androidDone[id]; if (f) f(); };
function speak(text, onDone) {
  if (window.AndroidTTS) {
    const token = ++tts.token;
    const id = 'u' + token;
    androidDone[id] = () => { if (token === tts.token) onDone(); };
    if (window.AndroidTTS.setRate) window.AndroidTTS.setRate(settings.rate);
    window.AndroidTTS.speak(text.replace(/\u0301/g, ''), T().speech, id);
    return true;
  }
  if (!hasTts) { toast(T().noTts, 5000); return false; }
  speechSynthesis.cancel();
  const token = ++tts.token;
  const u = new SpeechSynthesisUtterance(text.replace(/\u0301/g, '').replace(/\(([^)]*)\)\s*/, '$1. '));
  const v = pickVoice();
  if (v) u.voice = v;
  else if (!tts.warned[LANG]) { tts.warned[LANG] = true; toast(T().noVoice, 7000); }
  u.lang = T().speech;
  u.rate = settings.rate;
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
  const home = mesh.userData.home || mesh.position;
  const out = new THREE.Vector3().subVectors(home, ch.eye).setY(0).normalize();
  readFrame.position.copy(home).addScaledVector(out, 0.004);
  readFrame.visible = true;
  ch.pts.material.uniforms.uHover.value = ch.items.indexOf(mesh);
  if (!renderer.xr.isPresenting) {
    const d = new THREE.Vector3().subVectors(home, ch.eye);
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
    if (next >= BOOKS[bi].chapters[ci].length) { stopReading(); markRead(bi, ci); return; }
    readFrom(next);
  });
  if (!ok) stopReading();
}
function stopReading() {
  const was = !!tts.reading;
  tts.reading = null;
  tts.token++;
  if (hasTts) speechSynthesis.cancel();
  if (window.AndroidTTS) window.AndroidTTS.stop();
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
  ui.hintsBtn.textContent = hintsOn ? L.hintsOn : L.hintsOff;
  ui.hintsBtn.setAttribute('aria-pressed', hintsOn ? 'true' : 'false');
}
async function setLang(lang) {
  if (lang === LANG || busy) return;
  if (!dataCache[lang] && !(await idb.get(lang))) {
    toast(lang === 'ro' ? T().needLang : T().needLangRu, 9000);
    ui.file.click();
    return;
  }
  stopReading();
  LANG = lang;
  try { localStorage.setItem('lang', lang); } catch {}
  applyLangDom();
  if (!dataCache[lang]) toast(T().switching, 20000);
  await reloadLang();
}
async function reloadLang(message) {
  stopReading();
  closeQuiz();
  closeList();
  searchIndex2 = null;
  try {
    const data = await loadBible(LANG, () => {});
    prepare(data);
    buildGalaxy();
    buildLegend();
    await go('galaxy');
    if (message) toast(message, 8000); else toast(T().toastGalaxy, 8000, true);
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
let PEOPLE = null;
function personFor(bi) {
  const code = BOOKS[bi] && BOOKS[bi].code;
  const id = PEOPLE && code && PEOPLE.book[code];
  return id ? PEOPLE.p[id][LANG] || PEOPLE.p[id].ru : null;
}

async function loadExtras() {
  try { const r = await fetch('data/books-info.json'); if (r.ok) BOOKINFO = (await r.json()).b; } catch {}
  try { const r = await fetch('data/people.json'); if (r.ok) PEOPLE = await r.json(); } catch {}
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
  const bioText = about.person ? `${about.person.n} (${about.person.y}). ${about.person.b}` : '';
  const circ = (about.circ ? clampLines(wrap(g, about.circ, W - pad * 2), 4) : []).concat(bioText ? [''].concat(clampLines(wrap(g, bioText, W - pad * 2), 7)) : []);
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
    const home = mesh.userData.home || mesh.position;
    const out = new THREE.Vector3().subVectors(home, ch.eye).setY(0).normalize();
    selFrame.position.copy(home).addScaledVector(out, 0.006);
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
  const bm = el2('button', 'btn', isBookmarked(bi, ci, vi) ? L.inBm : L.addBm);
  bm.type = 'button';
  bm.addEventListener('click', () => { toggleBookmark(bi, ci, vi); bm.textContent = isBookmarked(bi, ci, vi) ? L.inBm : L.addBm; });
  box.append(el2('div', 'actions'));
  box.lastChild.append(listen, bm);
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
  const person = personFor(bi);
  if (person) {
    box.append(el2('h3', '', L.whoWas(person.n)), el2('p', 'bio', person.b));
    const nar = el2('button', 'btn', narration.on ? L.narrateStop : L.narrate);
    nar.type = 'button';
    nar.addEventListener('click', () => toggleNarration(bi));
    box.append(el2('div', 'actions'));
    box.lastChild.append(nar);
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
  const about = state.mode === 'book' && !renderer.xr.isPresenting && box.dataset.closed !== String(state.bi) ? (bookAbout(state.bi) || { rows: [], circ: '', fromEdition: true }) : null;
  if (!about) { box.hidden = true; return; }
  const L = T();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close);
  close.addEventListener('click', () => { box.dataset.closed = String(state.bi); box.hidden = true; });
  box.replaceChildren(close, el2('h3', '', L.aboutBook(BOOKS[state.bi].name)));
  const dl = el2('dl');
  for (const [k, v] of about.rows) dl.append(el2('dt', '', k), el2('dd', '', v));
  box.append(dl);
  if (about.circ) box.append(el2('p', 'circ', about.circ));
  const person = personFor(state.bi);
  if (person) {
    box.append(el2('h3', 'who', L.whoWas(person.n)), el2('p', 'muted small', person.y), el2('p', 'bio', person.b));
  }
  const nar = el2('button', 'btn primary narrate', narration.on ? L.narrateStop : L.narrate);
  nar.type = 'button';
  nar.addEventListener('click', () => toggleNarration(state.bi));
  box.append(el2('div', 'actions'));
  box.lastChild.append(nar);
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
  const bmb = makeButton(isBookmarked(bi, ci, vi) ? L.xrInBm : L.xrAddBm, () => { toggleBookmark(bi, ci, vi); buildVrDetail(vi, rel); }, 0.3);
  const close = makeButton(L.xrClose, closeDetail, 0.3);
  const bh = listen.geometry.parameters.height;
  listen.position.set(-0.34, by - bh / 2 - 0.01, 0);
  bmb.position.set(0, by - bh / 2 - 0.01, 0);
  close.position.set(0.34, by - bh / 2 - 0.01, 0);
  grp.add(listen, bmb, close); buttons.push(listen, bmb, close);
  const { pos, yaw } = headInfo();
  const a = yaw + 0.62;
  grp.position.set(Math.sin(a) * 1.35, -0.05, -Math.cos(a) * 1.35).add(pos);
  grp.lookAt(pos.x, grp.position.y, pos.z);
  scene.add(grp);
  detail.vrGroup = grp;
  detail.vrButtons = buttons;
}


/* ---------- Рассказчик: кто написал книгу ---------- */

const narration = { on: false };
function toggleNarration(bi) {
  if (narration.on) { stopNarration(); return; }
  const L = T(), b = BOOKS[bi];
  const about = bookAbout(bi);
  const person = personFor(bi);
  const parts = [L.aboutBook(b.name) + '.'];
  if (person) parts.push(`${L.whoWas(person.n)}. ${person.b}`);
  if (about && about.circ) parts.push(about.circ);
  const w = bookWritten(bi);
  if (w) parts.push(`${L.written}: ${w}.`);
  stopReading();
  narration.on = true;
  const ok = speak(parts.join(' '), () => { narration.on = false; if (state.mode === 'book') renderBookPanel(); if (renderer.xr.isPresenting) rebuildPanel(); });
  if (!ok) narration.on = false;
  if (state.mode === 'book') renderBookPanel();
  if (detail.open && !renderer.xr.isPresenting) selectVerse(detail.vi);
  if (renderer.xr.isPresenting) rebuildPanel();
}

/* ---------- Викторина «Угадай книгу» ---------- */

const quiz = { open: false, q: null, answer: -1, right: 0, total: 0, vrGroup: null, vrButtons: [], boosted: -1 };
function quizQuestion() {
  let bi = 0, ci = 0, vi = 0, text = '';
  for (let tries = 0; tries < 60; tries++) {
    let k = Math.floor(Math.random() * TOTAL);
    const b = BOOKS.find((x) => k >= x.offset && k < x.offset + x.n);
    k -= b.offset;
    bi = b.i; ci = b.ci[k]; vi = b.vi[k];
    text = verseText(bi, ci, vi);
    if (text.length >= 40 && text.length <= 240 && text !== '—' && !b.deutero) break;
  }
  const pool = BOOKS.filter((b) => b.i !== bi && !b.deutero).map((b) => b.i);
  const opts = [bi];
  while (opts.length < 4 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  opts.sort(() => Math.random() - 0.5);
  return { bi, ci, vi, text, opts };
}
function openQuiz() {
  stopReading();
  closeDetail();
  quiz.open = true;
  nextQuestion();
}
function closeQuiz() {
  quiz.open = false;
  ui.quiz.hidden = true;
  unboostQuiz();
  if (quiz.vrGroup) { scene.remove(quiz.vrGroup); disposeTree(quiz.vrGroup); quiz.vrGroup = null; }
  quiz.vrButtons = [];
}
function unboostQuiz() {
  if (quiz.boosted >= 0 && galaxy.items[quiz.boosted]) galaxy.items[quiz.boosted].pts.material.uniforms.uBoost.value = 1;
  quiz.boosted = -1;
}
function nextQuestion() {
  unboostQuiz();
  quiz.q = quizQuestion();
  quiz.answer = -1;
  renderQuiz();
}
function answerQuiz(bi) {
  if (quiz.answer >= 0) return;
  quiz.answer = bi;
  quiz.total++;
  if (bi === quiz.q.bi) quiz.right++;
  // Правильная книга вспыхивает в галактике.
  if (state.mode === 'galaxy' && galaxy.items[quiz.q.bi]) {
    quiz.boosted = quiz.q.bi;
    galaxy.items[quiz.q.bi].pts.material.uniforms.uBoost.value = 2.6;
  }
  renderQuiz();
}
function quizShow() {
  const { bi, ci, vi } = quiz.q;
  closeQuiz();
  go('chapter', { bi, ci, focus: vi, select: vi });
}
function quizRead() { stopReading(); speak(quiz.q.text, () => {}); }

function renderQuiz() {
  if (!quiz.open) return;
  if (renderer.xr.isPresenting) { buildVrQuiz(); return; }
  const L = T(), q = quiz.q, box = ui.quiz;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close);
  close.addEventListener('click', closeQuiz);
  box.append(close, el2('div', 'ref', `${L.quizTitle} · ${L.quizScore(quiz.right, quiz.total)}`), el2('p', 'muted', L.quizQ), el2('p', 'text', q.text));
  const grid = el2('div', 'opts');
  for (const bi of q.opts) {
    const btn = el2('button', 'btn opt', BOOKS[bi].name);
    btn.type = 'button';
    if (quiz.answer >= 0) {
      btn.disabled = true;
      if (bi === q.bi) btn.classList.add('right');
      else if (bi === quiz.answer) btn.classList.add('wrong');
    }
    btn.addEventListener('click', () => answerQuiz(bi));
    grid.append(btn);
  }
  box.append(grid);
  if (quiz.answer >= 0) {
    const ok = quiz.answer === q.bi;
    box.append(el2('p', ok ? 'fb right' : 'fb wrong', `${ok ? L.quizRight : L.quizWrong(BOOKS[q.bi].name)} ${refOf(q.bi, q.ci, q.vi)}`));
  }
  const act = el2('div', 'actions');
  const read = el2('button', 'btn', L.quizRead); read.type = 'button'; read.addEventListener('click', quizRead);
  act.append(read);
  if (quiz.answer >= 0) {
    const show = el2('button', 'btn', L.quizShow); show.type = 'button'; show.addEventListener('click', quizShow);
    const next = el2('button', 'btn primary', L.quizNext); next.type = 'button'; next.addEventListener('click', nextQuestion);
    act.append(show, next);
  }
  box.append(act);
  box.hidden = false;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}

function buildVrQuiz() {
  if (quiz.vrGroup) { scene.remove(quiz.vrGroup); disposeTree(quiz.vrGroup); }
  const L = T(), q = quiz.q;
  const grp = new THREE.Group();
  const W = 1.0, PX = 1100, pad = 40;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `40px ${FONT_CARD}`;
  const lines = clampLines(wrap(g, q.text, PX - pad * 2), 6);
  const fb = quiz.answer >= 0 ? `${quiz.answer === q.bi ? L.quizRight : L.quizWrong(BOOKS[q.bi].name)} ${refOf(q.bi, q.ci, q.vi)}` : L.quizQ;
  c.width = PX;
  c.height = pad * 2 + 52 + lines.length * 54 + 70;
  g.fillStyle = 'rgba(8, 11, 24, 0.94)';
  g.beginPath(); g.roundRect(2, 2, PX - 4, c.height - 4, 24); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.6)'; g.lineWidth = 3; g.stroke();
  g.textBaseline = 'top';
  let y = pad;
  g.font = `600 34px ${FONT_UI}`; g.fillStyle = '#f3c35b'; g.fillText(`${L.quizTitle.toUpperCase()} · ${L.quizScore(quiz.right, quiz.total)}`, pad, y); y += 52;
  g.font = `40px ${FONT_CARD}`; g.fillStyle = '#eef1fa';
  for (const ln of lines) { g.fillText(ln, pad, y); y += 54; }
  g.font = `600 34px ${FONT_UI}`; g.fillStyle = quiz.answer < 0 ? '#9aa2bf' : quiz.answer === q.bi ? '#7fe0a0' : '#ff8a80';
  g.fillText(fb, pad, y + 14);
  const ph = (W * c.height) / PX;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W, ph), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthTest: false }));
  panel.renderOrder = 34;
  panel.position.set(0, ph / 2, 0);
  grp.add(panel);
  const buttons = [];
  let by = -0.02;
  for (const bi of q.opts) {
    const mark = quiz.answer >= 0 ? (bi === q.bi ? '✓ ' : bi === quiz.answer ? '✗ ' : '') : '';
    const btn = makeRowButton(mark + BOOKS[bi].name, '', () => answerQuiz(bi), W);
    const bh = btn.geometry.parameters.height;
    btn.position.set(0, by - bh / 2, 0);
    by -= bh + 0.012;
    grp.add(btn); buttons.push(btn);
  }
  const acts = quiz.answer >= 0 ? [[L.quizRead, quizRead], [L.quizShow, quizShow], [L.quizNext, nextQuestion], [L.xrClose, closeQuiz]] : [[L.quizRead, quizRead], [L.xrClose, closeQuiz]];
  const bw = 0.24, gap = 0.012, total = acts.length * bw + (acts.length - 1) * gap;
  acts.forEach(([t, fn], i) => {
    const b = makeButton(t, fn, bw);
    b.position.set(-total / 2 + bw / 2 + i * (bw + gap), by - 0.05, 0);
    grp.add(b); buttons.push(b);
  });
  const { pos, yaw } = headInfo();
  const a = yaw - 0.55;
  grp.position.set(Math.sin(a) * 1.35, -0.05, -Math.cos(a) * 1.35).add(pos);
  grp.lookAt(pos.x, grp.position.y, pos.z);
  scene.add(grp);
  quiz.vrGroup = grp;
  quiz.vrButtons = buttons;
}


/* ---------- Личное: настройки, прогресс, закладки (хранятся только на этом устройстве) ---------- */

const store = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem('bc-user') || '{}') || {}; } catch { d = {}; }
  const save = () => { try { localStorage.setItem('bc-user', JSON.stringify(d)); } catch {} };
  return { get: (k, def) => (d[k] === undefined ? def : d[k]), set: (k, v) => { d[k] = v; save(); } };
})();
const settings = Object.assign({ ts: 1, rate: 0.92, voice: '', gyro: false, order: 'canon' }, store.get('settings', {}));
function saveSettings() { store.set('settings', settings); }
let readTimer = 0;

// Год завершения книги (традиционная датировка; отрицательный — до н. э.) для режима «по времени».
const BOOK_YEARS = {
  Gen: -1513, Exod: -1512, Lev: -1512, Num: -1473, Deut: -1473, Josh: -1450, Judg: -1100, Ruth: -1090, '1Sam': -1078, '2Sam': -1040,
  '1Kgs': -580, '2Kgs': -580, '1Chr': -460, '2Chr': -460, Ezra: -460, Neh: -443, Esth: -475, Job: -1473, Ps: -460, Prov: -717,
  Eccl: -1000, Song: -1020, Isa: -732, Jer: -580, Lam: -607, Ezek: -591, Dan: -536, Hos: -745, Joel: -820, Amos: -804, Obad: -607,
  Jonah: -844, Mic: -717, Nah: -632, Hab: -628, Zeph: -648, Hag: -520, Zech: -518, Mal: -443, Matt: 41, Mark: 62, Luke: 57, John: 98,
  Acts: 61, Rom: 56, '1Cor': 55, '2Cor': 55, Gal: 51, Eph: 60, Phil: 60, Col: 60, '1Thess': 50, '2Thess': 51, '1Tim': 62, '2Tim': 65,
  Titus: 62, Phlm: 60, Heb: 61, Jas: 61, '1Pet': 63, '2Pet': 64, '1John': 98, '2John': 98, '3John': 98, Jude: 65, Rev: 96,
  PrMan: -150, '1Esd': -150, Tob: -200, Jdt: -150, Wis: -50, Sir: -180, EpJer: -300, Bar: -150, '1Macc': -100, '2Macc': -120, '3Macc': -50, '2Esd': 90,
};
const bookYear = (b) => (b && b.code && BOOK_YEARS[b.code] != null ? BOOK_YEARS[b.code] : null);
const fmtYear = (y) => (y < 0 ? `${-y} ${T().bce}` : `${y} ${T().ce}`);

// Ключ места не зависит от перевода: «John.3.16». Поэтому закладки и прогресс общие для всех переводов.
function refKey(bi, ci, vi) {
  const b = BOOKS[bi];
  return `${b.code || '#' + bi}.${ci + 1}${vi != null ? '.' + (vi + 1) : ''}`;
}
function parseKey(k) {
  const [code, c, v] = String(k).split('.');
  const bi = code.startsWith('#') ? +code.slice(1) : CODE_TO_BI[code];
  if (bi == null || !BOOKS[bi]) return null;
  const b = BOOKS[bi];
  const ci = THREE.MathUtils.clamp(+c || 1, 1, b.chapters.length) - 1;
  const vi = v ? THREE.MathUtils.clamp(+v, 1, b.chapters[ci].length) - 1 : null;
  return { bi, ci, vi };
}
// Ссылка вида «John.3.16» в обычной нумерации 66 книг -> место в текущем переводе (с пересчётом псалмов).
function fromRef(ref) {
  const [code, c, v] = ref.split('.');
  if (!CODE_NUM[code]) return null;
  return fromId(CODE_NUM[code] * 1000000 + (+c) * 1000 + (+v));
}

/* Прогресс чтения: прочитанные главы светятся ярче. */
function isRead(bi, ci) { return !!store.get('read', {})[refKey(bi, ci)]; }
function readCount() {
  const r = store.get('read', {});
  let n = 0;
  BOOKS.forEach((b) => b.chapters.forEach((_, ci) => { if (r[refKey(b.i, ci)]) n++; }));
  return n;
}
function markRead(bi, ci) {
  if (isRead(bi, ci)) return;
  const r = store.get('read', {});
  r[refKey(bi, ci)] = 1;
  store.set('read', r);
  updateBookColors(bi);
  buildLegend();
}
function updateBookColors(bi) {
  const it = galaxy.items[bi];
  if (!it || !it.base) return;
  const b = BOOKS[bi];
  const attr = it.pts.geometry.attributes.aColor;
  const arr = attr.array;
  const readCh = b.chapters.map((_, ci) => isRead(bi, ci));
  for (let k = 0; k < b.n; k++) {
    const read = readCh[b.ci[k]];
    for (let j = 0; j < 3; j++) {
      const v = it.base[k * 3 + j];
      arr[k * 3 + j] = read ? (v + (1 - v) * 0.45) * 1.35 : v;
    }
  }
  attr.needsUpdate = true;
}
function resetProgress() {
  store.set('read', {});
  BOOKS.forEach((b) => updateBookColors(b.i));
  buildLegend();
  toast(T().progressDone, 4000);
}

/* Закладки: золотые звёзды в галактике и список. */
function bmList() { return store.get('bm', []); }
function isBookmarked(bi, ci, vi) { return bmList().includes(refKey(bi, ci, vi)); }
function toggleBookmark(bi, ci, vi) {
  const k = refKey(bi, ci, vi);
  const list = bmList();
  const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1); else list.unshift(k);
  store.set('bm', list);
  refreshBmStars();
  refreshCard(bi, ci, vi);
  if (!ui.listPanel.hidden && ui.listPanel.dataset.kind === 'bm') showBookmarks();
}
function refreshCard(bi, ci, vi) {
  const ch = state.chapter;
  if (!ch || ch.bi !== bi || ch.ci !== ci) return;
  const mesh = ch.items.find((m) => m.userData.vi === vi);
  if (!mesh) return;
  const card = drawCard(BOOKS[bi], ci, vi, vi === state.focus);
  mesh.material.map.dispose();
  mesh.material.map = makeTexture(card.canvas);
  mesh.material.needsUpdate = true;
}
function pointsAt(list, color, size) {
  const pos = [], col = [];
  const c = new THREE.Color(color);
  for (const r of list) {
    const it = galaxy.items[r.bi];
    if (!it) continue;
    const k = BOOKS[r.bi].chStart[r.ci] + r.vi;
    pos.push(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]);
    col.push(c.r, c.g, c.b);
  }
  const n = pos.length / 3;
  if (!n) return null;
  return makePoints(new Float32Array(pos), new Float32Array(col), new Float32Array(n).fill(size), new Float32Array(n).fill(-3), new Float32Array(n).map(() => Math.random() * 6.28));
}
function setGalaxyLayer(name, obj) {
  if (galaxy[name]) { galaxy.group.remove(galaxy[name]); disposeTree(galaxy[name]); }
  galaxy[name] = obj;
  if (obj) galaxy.group.add(obj);
}
function refreshBmStars() {
  if (!galaxy.group) return;
  const list = bmList().map(parseKey).filter((r) => r && r.vi != null);
  setGalaxyLayer('bmPts', pointsAt(list, '#ffd36b', 1.1));
}

/* Общая панель-список: закладки, результаты поиска, созвездия тем. */
function openList(kind, title, note, items, extra) {
  const box = ui.listPanel;
  box.dataset.kind = kind;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', T().close2);
  close.addEventListener('click', closeList);
  box.append(close, el2('h3', '', title));
  if (note) box.append(el2('p', 'muted small', note));
  if (extra) box.append(extra);
  if (items && items.length) {
    const ul = el2('ul', 'links');
    for (const r of items) {
      const li = el2('li');
      const btn = el2('button');
      btn.type = 'button';
      btn.append(el2('span', 'r', r.label || refOf(r.bi, r.ci, r.vi)), el2('span', 't', r.vi != null ? verseText(r.bi, r.ci, r.vi) : ''));
      btn.addEventListener('click', () => {
        if (innerWidth < 720) closeList();
        if (r.onClick) r.onClick(); else jumpTo(r);
      });
      li.append(btn);
      ul.append(li);
    }
    box.append(ul);
  }
  box.hidden = false;
  box.scrollTop = 0;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}
function closeList() {
  const kind = ui.listPanel.dataset.kind;
  ui.listPanel.hidden = true;
  ui.listPanel.dataset.kind = '';
  if (kind === 'search') setGalaxyLayer('searchPts', null);
  if (kind === 'topic') setGalaxyLayer('topic', null);
}
function showBookmarks() {
  const items = bmList().map(parseKey).filter((r) => r && r.vi != null);
  openList('bm', T().bookmarks, items.length ? '' : T().noBm, items);
}

/* Поиск по словам во всём тексте; найденные стихи подсвечиваются в галактике. */
let searchIndex2 = null;
const normText = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е');
function textSearch(q) {
  const nq = normText(q.trim());
  if (nq.replace(/\s/g, '').length < 3) { toast(T().searchShort, 4000); return; }
  if (!searchIndex2) {
    searchIndex2 = [];
    BOOKS.forEach((b) => b.chapters.forEach((c, ci) => c.forEach((v, vi) => searchIndex2.push([b.i, ci, vi, normText(v)]))));
  }
  const words = nq.split(/\s+/).filter(Boolean);
  const all = [];
  for (const [bi, ci, vi, t] of searchIndex2) {
    if (words.every((w) => t.includes(w))) all.push({ bi, ci, vi });
  }
  if (!all.length) { toast(T().nothingFound(q), 5000); return; }
  const shown = all.slice(0, 200);
  closeList();
  openList('search', T().searchTitle(q), all.length > shown.length ? `${T().found(all.length)}. ${T().foundMore(shown.length)}` : T().found(all.length), shown);
  setGalaxyLayer('searchPts', pointsAt(all.slice(0, 4000), '#7fe7ff', 0.75));
  if (state.mode !== 'galaxy') go('galaxy');
}

/* Созвездия тем: стихи одной темы соединяются линиями через всю галактику. */
const TOPICS = [
  { ru: 'Любовь', ro: 'Iubirea', refs: ['John.3.16', '1Cor.13.4', '1Cor.13.13', '1John.4.8', 'Rom.5.8', 'Rom.8.38', 'Matt.22.37', 'Deut.6.5', 'Song.8.6', 'John.15.13', '1Pet.4.8', 'Mic.6.8'] },
  { ru: 'Вера', ro: 'Credința', refs: ['Heb.11.1', 'Heb.11.6', 'Gen.15.6', 'Hab.2.4', 'Rom.10.17', 'Mark.11.22', 'Jas.2.17', 'Eph.2.8', 'Matt.17.20', '2Cor.5.7', 'Gal.2.20'] },
  { ru: 'Надежда', ro: 'Speranța', refs: ['Jer.29.11', 'Rom.15.13', 'Isa.40.31', 'Ps.42.11', 'Lam.3.22', 'Rom.8.28', 'Rev.21.4', 'Heb.6.19', '1Pet.1.3', 'Ps.37.29', 'Isa.65.17'] },
  { ru: 'Воскресение', ro: 'Învierea', refs: ['John.11.25', 'Acts.24.15', '1Cor.15.20', '1Cor.15.55', 'Job.14.14', 'Dan.12.2', 'John.5.28', 'Matt.28.6', 'Rev.20.13', 'Isa.26.19'] },
  { ru: 'Молитва', ro: 'Rugăciunea', refs: ['Matt.6.9', 'Phil.4.6', '1Thess.5.17', 'Jas.5.16', 'Ps.65.2', 'Matt.7.7', '1John.5.14', 'Luke.18.1', 'Ps.145.18', 'Jer.33.3'] },
  { ru: 'Мир', ro: 'Pacea', refs: ['Isa.2.4', 'John.14.27', 'Phil.4.7', 'Ps.46.9', 'Mic.4.3', 'Isa.9.6', 'Rom.12.18', 'Matt.5.9', 'Ps.37.11', 'Isa.11.6'] },
  { ru: 'Прощение', ro: 'Iertarea', refs: ['1John.1.9', 'Ps.103.12', 'Isa.1.18', 'Eph.4.32', 'Col.3.13', 'Matt.6.14', 'Luke.23.34', 'Mic.7.18', 'Acts.3.19', 'Ps.86.5'] },
  { ru: 'Мудрость', ro: 'Înțelepciunea', refs: ['Prov.1.7', 'Prov.3.5', 'Jas.1.5', 'Prov.4.7', 'Eccl.12.13', 'Ps.111.10', 'Prov.9.10', 'Col.2.3', 'Prov.2.6', 'Matt.7.24'] },
  { ru: 'Царство Бога', ro: 'Regatul lui Dumnezeu', refs: ['Matt.6.10', 'Dan.2.44', 'Matt.6.33', 'Matt.24.14', 'Isa.9.7', 'Rev.11.15', 'Ps.145.13', 'Dan.7.14', 'Matt.5.3', 'Luke.4.43'] },
  { ru: 'Творение', ro: 'Creația', refs: ['Gen.1.1', 'Ps.19.1', 'Rom.1.20', 'Isa.40.26', 'Ps.104.24', 'Rev.4.11', 'Heb.11.3', 'Job.38.4', 'Neh.9.6', 'Ps.139.14'] },
];
const topicName = (t) => t[LANG] || t.ru;
function showTopicsMenu() {
  const items = TOPICS.map((t) => ({ label: topicName(t), vi: null, onClick: () => showTopic(t) }));
  openList('topics', T().topics, T().topicsNote, items);
}
async function showTopic(t) {
  const verses = t.refs.map(fromRef).filter(Boolean);
  if (state.mode !== 'galaxy') await go('galaxy');
  const grp = new THREE.Group();
  const pts = [];
  for (const r of verses) {
    const it = galaxy.items[r.bi];
    if (!it) continue;
    const k = BOOKS[r.bi].chStart[r.ci] + r.vi;
    pts.push(new THREE.Vector3(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]));
  }
  if (pts.length) {
    const seg = [];
    for (let i = 1; i < pts.length; i++) seg.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    grp.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
    for (const p of pts) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#e8f2ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.copy(p);
      s.scale.setScalar(2.6);
      grp.add(s);
    }
    const lbl = makeLabel(topicName(t).toUpperCase(), { font: FONT_TITLE, px: 96, weight: 600, color: '#e8f2ff', height: 3.2, letter: 12 });
    lbl.position.copy(pts[0]).sub(EYE).multiplyScalar(0.92).add(EYE).add(new THREE.Vector3(0, 4, 0));
    grp.add(lbl);
    if (!renderer.xr.isPresenting) {
      const d = pts[0].clone().sub(EYE);
      look.target = Math.atan2(d.x, -d.z);
    }
  }
  setGalaxyLayer('topic', grp);
  openList('topic', topicName(t), T().topicsNote, verses);
}

/* Стих дня. */
const VOTD = ['John.3.16', 'Ps.23.1', 'Isa.41.10', 'Phil.4.13', 'Prov.3.5', 'Matt.5.9', 'Rom.8.28', 'Jer.29.11', 'Ps.46.1', 'Matt.6.33',
  '1Cor.13.4', 'Josh.1.9', 'Ps.119.105', 'Matt.11.28', 'Rev.21.4', 'Isa.40.31', '2Tim.3.16', 'Jas.1.5', 'Heb.11.1', '1John.4.8',
  'Ps.37.29', 'Matt.6.9', 'Gen.1.1', 'Mic.6.8', 'Ps.145.18', 'Phil.4.6', 'John.14.27', 'Rom.12.18', 'Ps.139.14', 'Eccl.12.13',
  'Isa.9.6', 'Dan.2.44', 'Acts.20.35', 'Gal.6.7', 'Prov.4.23', 'Col.3.13', 'Matt.5.3', 'Ps.65.2', 'Lam.3.22', 'Prov.17.17'];
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function votdPlace() {
  const d = new Date();
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  return fromRef(VOTD[day % VOTD.length]);
}
let votdStar = null;
function maybeShowVotd() { if (store.get('votdDay', '') !== todayKey()) renderVotd(); }
function renderVotd() {
  const r = votdPlace();
  if (!r) return;
  const L = T(), box = ui.votd;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', closeVotd);
  box.append(close, el2('div', 'ref', `${L.votd} · ${refOf(r.bi, r.ci, r.vi)}`), el2('p', 'text', verseText(r.bi, r.ci, r.vi)));
  const act = el2('div', 'actions');
  const listen = el2('button', 'btn', L.votdListen); listen.type = 'button';
  listen.addEventListener('click', () => { stopReading(); speak(`${refOf(r.bi, r.ci, r.vi)}. ${verseText(r.bi, r.ci, r.vi)}`, () => {}); });
  const goBtn = el2('button', 'btn primary', L.votdGo); goBtn.type = 'button';
  goBtn.addEventListener('click', () => { closeVotd(); jumpTo(r); });
  act.append(listen, goBtn);
  box.append(act);
  box.hidden = state.mode !== 'galaxy';
  // Звезда дня вспыхивает в галактике.
  const it = galaxy.items[r.bi];
  if (it && !votdStar) {
    const k = BOOKS[r.bi].chStart[r.ci] + r.vi;
    votdStar = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe7a3', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    votdStar.position.set(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]);
    votdStar.scale.setScalar(3.5);
    galaxy.group.add(votdStar);
    if (!renderer.xr.isPresenting) { const d = votdStar.position.clone().sub(EYE); look.target = Math.atan2(d.x, -d.z); }
  }
}
function closeVotd() {
  store.set('votdDay', todayKey());
  ui.votd.hidden = true;
  if (votdStar) { if (votdStar.parent) votdStar.parent.remove(votdStar); votdStar.material.dispose(); votdStar = null; }
}

/* «Продолжить с того же места». */
function renderContinue() {
  const r = parseKey(store.get('last', ''));
  const show = state.mode === 'galaxy' && r && BOOKS.length;
  ui.continueBtn.hidden = !show;
  if (show) {
    ui.continueBtn.textContent = T().cont(`${BOOKS[r.bi].short} ${r.ci + 1}`);
    ui.continueBtn.onclick = () => go('chapter', { bi: r.bi, ci: r.ci });
  }
}

/* Настройки. */
function applyTextScale() {
  document.documentElement.style.setProperty('--ts', String(settings.ts));
  applyCardScale(settings.ts);
}
let resetArmed = false;
function renderSettings() {
  const L = T(), box = ui.settingsPanel;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', () => { box.hidden = true; });
  box.append(close, el2('h3', '', L.settings));
  const row = (label, ...ctrls) => { const r = el2('div', 'set-row'); r.append(el2('span', 'set-label', label), ...ctrls); box.append(r); return r; };
  // Размер текста
  const minus = el2('button', 'btn', 'A−'); minus.type = 'button';
  const val = el2('span', 'set-val', `${Math.round(settings.ts * 100)}%`);
  const plus = el2('button', 'btn', 'A+'); plus.type = 'button';
  const setTs = (d) => {
    settings.ts = Math.round(THREE.MathUtils.clamp(settings.ts + d, 0.8, 1.5) * 100) / 100;
    saveSettings(); applyTextScale(); val.textContent = `${Math.round(settings.ts * 100)}%`;
    if (state.mode === 'chapter') go('chapter', { bi: state.bi, ci: state.ci, page: state.page });
  };
  minus.addEventListener('click', () => setTs(-0.1));
  plus.addEventListener('click', () => setTs(0.1));
  row(L.textSize, minus, val, plus);
  // Скорость чтения
  const rate = el2('input'); rate.type = 'range'; rate.min = '0.6'; rate.max = '1.4'; rate.step = '0.05'; rate.value = String(settings.rate); rate.id = 'setRate';
  const rv = el2('span', 'set-val', `${settings.rate.toFixed(2)}×`);
  rate.addEventListener('input', () => { settings.rate = +rate.value; rv.textContent = `${settings.rate.toFixed(2)}×`; saveSettings(); });
  row(L.rate, rate, rv);
  // Голос
  const voices = hasTts && !window.AndroidTTS ? tts.voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(LANG)) : [];
  if (voices.length) {
    const sel = el2('select'); sel.id = 'setVoice';
    sel.append(Object.assign(document.createElement('option'), { value: '', textContent: L.voiceAuto }));
    for (const v of voices) sel.append(Object.assign(document.createElement('option'), { value: v.name, textContent: v.name }));
    sel.value = settings.voice;
    sel.addEventListener('change', () => { settings.voice = sel.value; saveSettings(); });
    row(L.voice, sel);
  }
  // Гироскоп
  const gy = el2('input'); gy.type = 'checkbox'; gy.id = 'setGyro'; gy.checked = gyro.on;
  gy.addEventListener('change', () => setGyro(gy.checked));
  row(L.gyro, gy);
  // Порядок книг
  const ord = el2('select'); ord.id = 'setOrder';
  ord.append(Object.assign(document.createElement('option'), { value: 'canon', textContent: L.orderCanon }), Object.assign(document.createElement('option'), { value: 'time', textContent: L.orderTime }));
  ord.value = settings.order;
  ord.addEventListener('change', () => {
    settings.order = ord.value; saveSettings();
    closeList(); closeVotd();
    buildGalaxy();
    if (state.mode !== 'galaxy') go('galaxy');
  });
  row(L.order, ord);
  // Подсказки
  const hi = el2('input'); hi.type = 'checkbox'; hi.id = 'setHints'; hi.checked = hintsOn;
  hi.addEventListener('change', () => setHints(hi.checked));
  row(L.hintsTitle, hi);
  // Сброс прогресса (с подтверждением вторым нажатием)
  const reset = el2('button', 'btn danger', L.resetProgress); reset.type = 'button';
  reset.addEventListener('click', () => {
    if (!resetArmed) { resetArmed = true; reset.textContent = L.resetConfirm; setTimeout(() => { resetArmed = false; reset.textContent = L.resetProgress; }, 4000); return; }
    resetArmed = false; resetProgress(); reset.textContent = L.resetProgress;
  });
  box.append(el2('p', 'muted small', T().progress(readCount(), BOOKS.reduce((n, b) => n + b.chapters.length, 0))), reset);
  box.hidden = false;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}

/* Обзор поворотом телефона (гироскоп). */
function syncGyroBox() { const cb = document.getElementById('setGyro'); if (cb) cb.checked = gyro.on; }
const gyro = { on: false, data: null, got: false, drag: 0, dragStart: 0, base: null };
const _gq = new THREE.Quaternion(), _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _qz = new THREE.Quaternion(), _qo = new THREE.Quaternion(), _eu = new THREE.Euler();
const _Z = new THREE.Vector3(0, 0, 1), _Y = new THREE.Vector3(0, 1, 0), _f = new THREE.Vector3();
function onOrient(e) {
  if (e.alpha == null && e.beta == null) return;
  gyro.data = { a: e.alpha || 0, b: e.beta || 0, g: e.gamma || 0 };
  gyro.got = true;
}
function applyGyro() {
  const d = gyro.data, D = THREE.MathUtils.degToRad;
  const orient = D((screen.orientation && screen.orientation.angle) || window.orientation || 0);
  _eu.set(D(d.b), D(d.a), -D(d.g), 'YXZ');
  _gq.setFromEuler(_eu).multiply(_q1).multiply(_qz.setFromAxisAngle(_Z, -orient));
  if (gyro.base == null) {
    _f.set(0, 0, -1).applyQuaternion(_gq);
    gyro.base = Math.atan2(_f.x, -_f.z) - look.yaw;
  }
  _qo.setFromAxisAngle(_Y, gyro.base + gyro.drag);
  camera.quaternion.copy(_qo).multiply(_gq);
}
async function setGyro(on) {
  if (on && !gyro.on) {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Если браузер так и не ответит на запрос разрешения, не ждём вечно.
        const res = await Promise.race([DeviceOrientationEvent.requestPermission(), new Promise((r) => setTimeout(() => r('timeout'), 8000))]);
        if (res !== 'granted') throw new Error('denied');
      }
    } catch {
      toast(T().gyroNo, 7000);
      settings.gyro = false; saveSettings();
      syncGyroBox();
      return;
    }
    gyro.on = true; gyro.got = false; gyro.base = null; gyro.drag = 0;
    addEventListener('deviceorientation', onOrient);
    setTimeout(() => { if (gyro.on && !gyro.got) { toast(T().gyroNo, 7000); setGyro(false); } }, 1800);
  } else if (!on && gyro.on) {
    removeEventListener('deviceorientation', onOrient);
    gyro.on = false;
    gyro.data = null;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    look.yaw = Math.atan2(dir.x, -dir.z);
    look.pitch = THREE.MathUtils.clamp(Math.asin(dir.y), -1.45, 1.45);
    applyLook();
  }
  settings.gyro = gyro.on;
  saveSettings();
  syncGyroBox();
}

/* Пункты меню. */
ui.bmBtn.addEventListener('click', showBookmarks);
ui.topicsBtn.addEventListener('click', showTopicsMenu);
ui.votdBtn.addEventListener('click', () => { if (state.mode !== 'galaxy') go('galaxy').then(renderVotd); else renderVotd(); });
ui.settingsBtn.addEventListener('click', () => { if (ui.settingsPanel.hidden) renderSettings(); else ui.settingsPanel.hidden = true; });

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
  if (xrPanel.group.visible || detail.vrButtons.length || quiz.vrButtons.length) {
    const hit = raycaster.intersectObjects([...(xrPanel.group.visible ? xrPanel.buttons : []), ...detail.vrButtons, ...quiz.vrButtons], false)[0];
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
const xrHint = (what) => (renderer.xr.isPresenting ? `${T().trigger}: ${what}` : lastPointer === 'touch' ? T().tapAgain(what) : `${T().click}: ${what}`);

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
  ui.info.querySelector('.hint').hidden = !d.hint || !hintsOn;
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
  if (state.mode !== 'galaxy') defs.push([L.xrHome, goHome]);
  if (state.mode === 'book') defs.push([L.xrGalaxy, back]);
  if (state.mode === 'book') defs.push([narration.on ? L.xrStopNarr : L.xrNarrate, () => toggleNarration(state.bi)]);
  if (state.mode === 'chapter') {
    defs.push([L.xrChapters, back], [L.xrPrev, () => stepChapter(-1)], [L.xrNext, () => stepChapter(1)]);
    defs.push([tts.reading ? L.xrStop : L.xrListen, toggleListen]);
    if (state.pages > 1) defs.push([L.prevPage, () => stepPage(-1)], [L.nextPage, () => stepPage(1)]);
  }
  defs.push([L.xrRandom, randomVerse]);
  if (state.mode === 'galaxy') defs.push([L.xrQuiz, openQuiz]);
  const widths = defs.map(([t]) => (t.length > 10 ? 0.34 : t.length > 7 ? 0.26 : 0.22));
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
    about.person = personFor(state.bi);
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
  ctrl.addEventListener('connected', (e) => { entry.gamepad = e.data.gamepad || null; entry.hand = !!e.data.hand; entry.handedness = e.data.handedness || ''; line.visible = true; });
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

function pollGamepads(dt = 0.016) {
  const sided = controllers.some((c) => c.gamepad && c.handedness === 'left') && controllers.some((c) => c.gamepad && c.handedness === 'right');
  for (const c of controllers) {
    const gp = c.gamepad;
    if (!gp) continue;
    const x = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0] || 0;
    const y = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1] || 0;
    const turns = !sided || c.handedness === 'right';
    const flies = !sided || c.handedness === 'left';
    if (turns && Math.abs(x) > 0.7 && c.turnArmed) { snapTurn(x > 0 ? -Math.PI / 6 : Math.PI / 6); c.turnArmed = false; }
    if (Math.abs(x) < 0.3) c.turnArmed = true;
    // Полёт: левый стик вперёд/назад — по направлению взгляда (только в галактике).
    if (flies && state.mode === 'galaxy' && Math.abs(y) > 0.18 && (sided || Math.abs(x) < 0.5)) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      rig.position.addScaledVector(dir, -y * 9 * dt);
      if (rig.position.length() > 120) rig.position.setLength(120);
    }
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
let lastPointer = 'mouse';
let tapArmed = null;
el.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; look.target = null; if (gyro.on) gyro.dragStart = gyro.drag; look.down = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch }; look.moved = false; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => {
  look.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  look.has = true;
  if (!look.down) return;
  const dx = e.clientX - look.down.x, dy = e.clientY - look.down.y;
  if (Math.hypot(dx, dy) > 5) look.moved = true;
  if (!look.moved) return;
  const k = (camera.fov / 70) * 0.0042;
  if (gyro.on) { gyro.drag = gyro.dragStart + dx * k; return; }
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
  // На сенсорном экране нет наведения: первое касание показывает стих и книгу, второе открывает.
  if (e.pointerType !== 'mouse' && h && (h.type === 'book' || h.type === 'chapter')) {
    const key = h.type === 'book' ? `b${h.bi}` : `c${h.ci}`;
    if (tapArmed !== key) {
      tapArmed = key;
      look.has = true;
      hover = h; lastHoverKey = hoverKey(h); applyHover();
      return;
    }
  }
  tapArmed = null;
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
  if (e.key === 'Escape' && !ui.settingsPanel.hidden) ui.settingsPanel.hidden = true;
  else if (e.key === 'Escape' && !ui.listPanel.hidden) closeList();
  else if (e.key === 'Escape' && quiz.open) closeQuiz();
  else if (e.key === 'Escape' && detail.open) closeDetail();
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
  renderContinue();
  if (state.mode !== 'galaxy') ui.votd.hidden = true;
  renderBookPanel();
  if (state.mode === 'book') toast(T().toastBook, 6000, true);
  if (state.mode === 'chapter' && !tts.reading) toast(T().toastChapter, 6000, true);
  updateListenButton();
  rebuildPanel();
}

function buildLegend() {
  const L = ui.legend;
  L.replaceChildren(ui.legendClose);
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
  const prog = el2('div', 'note progress', T().progress(readCount(), BOOKS.reduce((n, b) => n + b.chapters.length, 0)));
  L.append(prog);

}

let toastTimer = 0;
let hintsOn = (() => { try { return localStorage.getItem('hints') !== '0'; } catch { return true; } })();
// hint: true — обучающая подсказка, её можно отключить; остальные сообщения (ошибки, загрузка) видны всегда.
function toast(text, ms = 7000, hint = false) {
  if (hint && !hintsOn) return;
  ui.toastText.textContent = text;
  ui.toast.classList.remove('gone');
  ui.toast.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms);
}
function stopNarration() {
  if (!narration.on) return;
  narration.on = false;
  tts.token++;
  if (hasTts) speechSynthesis.cancel();
  if (window.AndroidTTS) window.AndroidTTS.stop();
  if (state.mode === 'book') renderBookPanel();
  if (detail.open && !renderer.xr.isPresenting) selectVerse(detail.vi);
  if (renderer.xr.isPresenting) rebuildPanel();
}
function setHints(on) {
  hintsOn = on;
  try { localStorage.setItem('hints', on ? '1' : '0'); } catch {}
  ui.hintsBtn.textContent = on ? T().hintsOn : T().hintsOff;
  ui.hintsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (!on) { hideToast(); hideIntro(); }
}
function hideToast() { ui.toast.classList.add('gone'); }

ui.random.addEventListener('click', randomVerse);
ui.prevCh.addEventListener('click', () => stepChapter(-1));
ui.nextCh.addEventListener('click', () => stepChapter(1));
ui.prevPage.addEventListener('click', () => stepPage(-1));
ui.nextPage.addEventListener('click', () => stepPage(1));
ui.legendToggle.addEventListener('click', () => { document.body.classList.toggle('legend-open'); document.body.classList.remove('legend-closed'); });
ui.legendClose.addEventListener('click', () => { document.body.classList.add('legend-closed'); document.body.classList.remove('legend-open'); });
ui.home.addEventListener('click', goHome);
ui.quizBtn.addEventListener('click', () => (quiz.open ? closeQuiz() : openQuiz()));
// Список меню ставится под кнопкой и не выходит за края экрана (на телефоне кнопка стоит слева).
function placeMenu() {
  const r = ui.menuBtn.getBoundingClientRect();
  const w = ui.menuList.offsetWidth;
  const left = Math.max(12, Math.min(r.left, innerWidth - w - 12));
  ui.menuList.style.left = `${Math.round(left)}px`;
  ui.menuList.style.top = `${Math.round(r.bottom + 6)}px`;
}
ui.menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = ui.menuList.hidden;
  ui.menuList.hidden = !open;
  ui.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) placeMenu();
});
addEventListener('resize', () => { if (!ui.menuList.hidden) placeMenu(); });
ui.menuList.addEventListener('click', () => { ui.menuList.hidden = true; ui.menuBtn.setAttribute('aria-expanded', 'false'); });
document.addEventListener('click', (e) => {
  if (!ui.menuList.hidden && !e.target.closest('.menu')) { ui.menuList.hidden = true; ui.menuBtn.setAttribute('aria-expanded', 'false'); }
});
ui.brand.addEventListener('click', goHome);
ui.hintsBtn.addEventListener('click', () => setHints(!hintsOn));
ui.toastClose.addEventListener('click', hideToast);

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
  if (!p) { ui.q.blur(); textSearch(ui.q.value); return; }
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
  if (files.length > 1 && files.every((f) => ext(f) === 'epub')) {
    const list = [];
    for (let k = 0; k < files.length; k++) {
      list.push(await readBibleFiles([files[k]], (f) => progress((k + f) / files.length)));
    }
    return list;
  }
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
    const list = Array.isArray(data) ? data : [data];
    const names = [];
    let lang = LANG;
    for (const d of list) {
      const l = d.lang && I18N[d.lang] ? d.lang : LANG;
      delete d.lang;
      d.custom = true;
      await idb.set(l, { t: d.t, b: d.b });
      dataCache[l] = d;
      names.push(`${d.t} (${l.toUpperCase()})`);
      lang = l;
    }
    // Если открыт и текущий язык, остаёмся на нём; иначе переключаемся на загруженный.
    if (list.some((d) => dataCache[LANG] === d)) lang = LANG;
    LANG = lang;
    try { localStorage.setItem('lang', lang); } catch {}
    applyLangDom();
    if (welcome.resolve) { const r = welcome.resolve; welcome.resolve = null; welcome.message = T().loadedMany(names.join(', ')); r(dataCache[LANG]); }
    else await reloadLang(T().loadedMany(names.join(', ')));
  } catch (err) {
    const msg = T().fileError(err.message === 'no-books' ? T().noBooks : err.message);
    if (welcome.resolve) ui.status.textContent = msg;
    toast(msg, 9000);
  }
  ui.file.value = '';
});

/* ---------- Первый запуск: Библия пользователя ---------- */

const welcome = { resolve: null };
async function openFirstBible() {
  for (const l of [LANG, LANG === 'ru' ? 'ro' : 'ru']) {
    try {
      const d = await loadBible(l);
      if (l !== LANG) { LANG = l; try { localStorage.setItem('lang', l); } catch {} applyLangDom(); }
      return d;
    } catch (err) {
      if (!err.needImport) throw err;
    }
  }
  // Ничего не открыто: показываем приглашение открыть EPUB и ждём выбора файлов.
  ui.status.textContent = '';
  ui.welcome.hidden = false;
  return new Promise((resolve) => { welcome.resolve = (d) => { ui.welcome.hidden = true; ui.status.textContent = T().lighting; resolve(d); }; });
}
ui.welcomeBtn.addEventListener('click', () => ui.file.click());

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
      if (hintsOn) showIntro();
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
  fx.update(dt);
  updateScale();
  if (sky) sky.update(shared.uTime.value, dt, shared.uScale.value);
  // На экране камера чуть покачивается: близкая пыль и далёкие звёзды смещаются по-разному, и появляется глубина.
  if (!renderer.xr.isPresenting && gyro.on && gyro.data) applyGyro();
  if (!renderer.xr.isPresenting && !reducedMotion) {
    const t = shared.uTime.value;
    camera.position.set(0.09 * Math.sin(t * 0.11), 1.6 + 0.05 * Math.sin(t * 0.17), 0.07 * Math.sin(t * 0.13));
  }

  let h = null;
  if (renderer.xr.isPresenting) {
    pollGamepads(dt);
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
    applyTextScale();
    const sample = 'Ая ăâîșț';
    const fontsReady = Promise.all([
      document.fonts.load(`40px "PT Serif"`, sample),
      document.fonts.load(`600 40px "Cormorant Garamond"`, sample),
      document.fonts.load(`500 40px "IBM Plex Sans Condensed"`, sample),
      document.fonts.load(`40px "Lora"`, sample),
      document.fonts.load(`600 80px "Cormorant Garamond"`, '0123456789'),
    ]).catch(() => {});
    const data = await openFirstBible();
    ui.status.textContent = T().lighting;
    await Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]);
    prepare(data);
    const lowPower = /OculusBrowser|Quest|Pico|Android|iPhone|iPad/i.test(navigator.userAgent);
    try { sky = buildSky(THREE, { scene, renderer, eye: EYE, glowTex, quality: lowPower ? 0.6 : 1 }); }
    catch (err) { console.warn('sky', err); scene.add(buildDust()); }
    buildGalaxy();
    buildLegend();
    updateChrome();
    renderer.setAnimationLoop(tick);
    ui.loader.classList.add('done');
    window.__started = true;
    if (welcome.message) toast(welcome.message, 9000); else toast(T().toastGalaxy, 9000, true);
    setupVR();
    loadExtras();
    renderContinue();
    maybeShowVotd();
    if (settings.gyro) setGyro(true);
  } catch (err) {
    ui.status.textContent = T().loadFail(err.message);
  }
}
start();

// Кнопка «Назад» телефона в APK: сначала закрываем окна и поднимаемся на уровень выше.
window.__androidBack = () => {
  if (!ui.settingsPanel.hidden) { ui.settingsPanel.hidden = true; return true; }
  if (!ui.listPanel.hidden) { closeList(); return true; }
  if (quiz.open) { closeQuiz(); return true; }
  if (detail.open || state.mode !== 'galaxy') { back(); return true; }
  return false;
};

// Для проверки без шлема: построение VR-панелей можно вызвать из консоли.
window.__bibleCosmos = {
  buildVrDetail, buildVrQuiz, openQuiz, rebuildPanel, related, bookAbout, state, quiz, scene, galaxy, camera, markRead, settings, gyro,
  get sky() { return sky; },
  project(bi) { const v = galaxy.items[bi].center.clone().project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, front: v.z < 1 }; },
};
