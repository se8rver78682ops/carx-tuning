// three.js грузится с запасного адреса, если основной недоступен.
// В APK и в программе для компьютера библиотеки лежат рядом с программой и работают без интернета.
const LOCAL_APP = location.hostname === 'appassets.androidplatform.net' || location.protocol === 'app:';
const THREE_URLS = [
  ...(LOCAL_APP ? ['./vendor/three.module.js'] : []),
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
    title: 'Библия',
    quote: '«Он знает число звёзд и всех их называет по имени» (Псалом 147:4)',
    galaxy: 'Галактика книг', galaxyShort: 'Галактика',
    chapter: (n) => `Глава ${n}`, psalm: (n) => `Псалом ${n}`,
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
    introTitle: 'Библия',
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
    noVoiceAndroid: 'Для этого языка на телефоне нет голоса. Откройте «Настройки → Голос → Установить голоса».', stopReading: 'Остановить',
    autoNext: 'Читать главы подряд', pitch: 'Высота голоса', voiceTest: '▶ Проба голоса', installVoices: 'Установить голоса', voiceNet: 'нужен интернет', voiceBest: 'лучшее качество',
    bgNote: 'Чтение продолжается, если свернуть программу или выключить экран.',
    gfx: 'Графика', gfxAuto: 'Авто — подстраивается под устройство', gfxFast: 'Быстрая — плавнее, бережёт батарею', gfxBest: 'Красивая — все эффекты',
    allowBg: 'Разрешить работу в фоне', bgAllowed: 'Работа в фоне разрешена',
    bgHint: 'Чтобы чтение не прерывалось при блокировке экрана, разрешите программе работать в фоне: «Ещё → Настройки → Разрешить работу в фоне».',
    readerText: '📖 Текст', readerSpace: '✦ Космос', chapterEssence: 'Суть главы', textSmaller: 'Мельче', textBigger: 'Крупнее',
    lessons: 'Уроки для жизни', lessonsNote: 'Библия как инструкция для человека: девять ступеней от замысла до цели. Нажмите на ступень — её стихи загорятся на небе.',
    lessonsListenAll: '▶ Слушать все уроки', lessonListen: '▶ Слушать урок', lessonsAll: '☰ Все уроки',
    lessonsMain: 'Главная мысль: человек счастлив, когда живёт в согласии с тем, как его задумал Создатель. Заповеди описывают этот замысел, истории показывают, что бывает при отступлении от него, а пророчества — что замысел исполнится.',
    chaptersN: (n) => `Глав: ${n}`, readOf: (r, n) => (r ? `прочитано ${r} из ${n}` : 'ещё не читали'),
    prophecies: 'Пророчества', prophNote: (n) => `${n} пророчеств: что было предсказано, как и когда это исполнилось, и что Библия обещает на будущее. Нажмите на стих, чтобы открыть его.`,
    prophNone: 'Не удалось загрузить пророчества.', prophListenAll: '▶ Слушать раздел', prophSkyAll: '✦ Все на небе', prophListen: '▶ Слушать', prophSky: '✦ На небе',
    prophDone: 'Исполнилось', prophOngoing: 'Исполняется', prophSign: 'Признак', prophPromise: 'Обещание', prophForetold: 'Предсказано', prophFulfilled: 'Исполнение', prophSays: 'Что сказано',
    prophAlso: 'Смотрите также', prophHistory: 'подтверждено историей', prophBack: '◀ К пророчествам', prophSkyNote: 'Дуги на небе ведут от пророчества к его исполнению.',
    neuralFail: 'Нейросетевой голос не запустился — читаю голосом системы.',
    ttsSilent: (why, n) => (n ? `Голос системы не отвечает (${why}).` : 'На этом устройстве не найден ни один голос для чтения.') + (location.protocol === 'app:' ? ' В Windows: Параметры → Время и язык → Речь → «Добавить голоса» → Русский, затем перезапустите программу.' : ' Проверьте звук и голоса в настройках системы или откройте программу в браузере Microsoft Edge.'),
    audioTitle: 'Аудио-Библия', audioPickFolder: '📁 Выбрать папку с записями', audioPickFiles: 'Выбрать файлы',
    audioStatus: (h, t) => (h ? `Записей глав на этом устройстве: ${h} из ${t}. Кнопка «Слушать» включает живой голос чтеца, подсветка идёт за ним.` : 'Загрузите записи глав (файлы MP3 «Перевода нового мира», например nwt_01_Ge_U_01.mp3) — тогда «Слушать» будет включать живой голос чтеца.'),
    audioUse: 'Слушать записи, когда они есть', audioMissing: (n) => `Без записи: ${n} глав`, audioWhole: 'вся книга',
    audioDelete: 'Удалить записи с устройства', audioDeleteQ: 'Удалить все записи с этого устройства? Сами файлы в папке останутся.',
    audioNote: 'Записи хранятся только на этом устройстве. Где записи нет, читает голос устройства.',
    audioNone: 'Не найдено файлов записей. Нужны MP3 с именами вида nwt_01_Ge_U_01.mp3.',
    audioSaving: (d, n) => `Сохраняю записи: ${d} из ${n}…`,
    audioSaved: (n, l, sk) => `Готово: сохранено записей — ${n} (${l}).${sk ? ` Пропущено других файлов: ${sk}.` : ''}`,
    audioAligning: 'Ищу начало стиха в записи…', audioFull: 'Не хватает места на устройстве для всех записей.',
    welcomeBtn: 'Открыть файлы EPUB',
    mentions: (n) => `Упоминаний: ${n}.`, aboutChapter: (x) => `О главе: ${x}`, peopleHere: 'Люди в главе', chLinks: 'С чем связана глава',
    showOnSky: 'Показать на небе', didYouKnow: 'Знаете ли вы?', chLinksTitle: (r) => `Связи главы ${r}`, linksN: (n) => `связей: ${n}`,
    trail: 'Мой путь по связям', trailNote: 'Стихи, по которым вы шли, — последние сверху. На небе путь светится розовым.',
    trailEmpty: 'Путь пока пуст. В карточке стиха нажмите «→ Дальше по связи».', trailClear: 'Очистить путь', nextLink: '→ Дальше по связи',
    footnotes: 'Сноски издания', peopleInVerse: 'Люди в стихе', terms: 'Понятия', measures: 'Меры и деньги', parallels: 'Параллельные места',
    compare: 'Сравнить', quoteFrom: 'Цитата из', quoteTo: 'Цитируется в', fulfillment: 'исполнение пророчества', bloom: 'Свечение звёзд',
    notes: 'Заметки', noNotes: 'Заметок пока нет. Откройте стих и напишите мысль в поле «Моя заметка».', notePh: 'Моя заметка к этому стиху…', noteTitle: 'Моя заметка',
    places: 'Места в этом стихе', map: 'Карта', mapViews: { region: 'Весь регион', israel: 'Земля Израиля' }, mapNoRoute: 'Путешествие не выбрано',
    mapReadRoute: 'Читать:', mapAllRoutes: 'Все путешествия', mapApprox: 'Пути показаны приблизительно: точные дороги древности известны не везде.', mapHint: 'Двумя пальцами или колёсиком — увеличить, пальцем — двигать, двойное касание — крупнее. Нажмите на место, чтобы увидеть стихи о нём.', zoomIn: 'Увеличить', zoomOut: 'Уменьшить', zoomFit: 'Показать всё', mapVerses: (n) => `стихов: ${n}`,
    events: 'События', eventsNote: 'Годы по традиционной хронологии, приблизительные; у историков есть и другие датировки.', inBeginning: 'В начале',
    plan: 'План чтения', planNote: 'Выберите план: каждый день программа предложит главы и отметит прочитанное.',
    plans: { year: 'Библия за год', nt90: 'Новый Завет за 3 месяца', gospels30: 'Евангелия за месяц', psalms30: 'Псалмы за месяц', prov31: 'Притчи за месяц' },
    planDesc: (n, d) => `${chaptersWord(n)} · ${d} ${plural(d, ['день', 'дня', 'дней'])}`, planStart: 'Начать', planStop: 'Остановить план', planToday: 'Сегодня',
    planProgress: (day, days, pct) => `День ${day} из ${days} · прочитано ${pct}%`, planChip: (r) => `▶ План на сегодня: ${r}`,
    musicOn: 'Музыка: вкл', musicOff: 'Музыка: выкл', musicVol: 'Громкость музыки',
    share: 'Поделиться', shareBtn: '↗ Поделиться', shareHint: 'Нажмите на картинку и удерживайте, чтобы сохранить её, или скопируйте текст.',
    copyText: 'Скопировать текст', copied: 'Скопировано', copyFail: 'Не удалось скопировать: выделите текст вручную.',
    quiet: '☾ Тишина', quietExit: '✕ Выйти из тишины', xrQuiet: '☾ Тишина', xrMap: 'Карта',
    quizModes: { book: 'Книга', finish: 'Продолжи стих', ref: 'Глава и стих' }, quizFinishQ: 'Чем заканчивается этот стих?', quizRefQ: 'Где записан этот стих?',
    quizWrong2: 'Неверно. Правильно:', quizStreak: (n, b) => `серия ${n} · рекорд ${b}`,
    paraHint: 'Чтобы стихи шли абзацами и строками, как в книге, откройте EPUB заново: «Ещё → Открыть EPUB…».',
    needLang: 'Румынская Библия ещё не открыта. Выберите её файл EPUB.',
    needLangRu: 'Русская Библия ещё не открыта. Выберите её файл EPUB.',
    loadedMany: (list) => `Загружено: ${list}. Файлы остались только на этом устройстве.`,
    customNote: 'Свой перевод, хранится только на этом устройстве.',
  },
  ro: {
    htmlLang: 'ro', speech: 'ro-RO',
    title: 'Biblia',
    quote: '„El socotește numărul stelelor și le dă nume la toate.” (Psalmul 147:4)',
    galaxy: 'Galaxia cărților', galaxyShort: 'Galaxia',
    chapter: (n) => `Capitolul ${n}`, psalm: (n) => `Psalmul ${n}`,
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
    introTitle: 'Biblia',
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
    noVoiceAndroid: 'Pe telefon nu există o voce pentru această limbă. Deschideți „Setări → Vocea → Instalează voci”.', stopReading: 'Oprește',
    autoNext: 'Citește capitolele la rând', pitch: 'Tonul vocii', voiceTest: '▶ Ascultă vocea', installVoices: 'Instalează voci', voiceNet: 'necesită internet', voiceBest: 'cea mai bună calitate',
    bgNote: 'Citirea continuă dacă minimizați aplicația sau stingeți ecranul.',
    gfx: 'Grafica', gfxAuto: 'Automată — se adaptează dispozitivului', gfxFast: 'Rapidă — mai fluidă, cruță bateria', gfxBest: 'Frumoasă — toate efectele',
    allowBg: 'Permite funcționarea în fundal', bgAllowed: 'Funcționarea în fundal este permisă',
    bgHint: 'Ca citirea să nu se oprească la blocarea ecranului, permiteți aplicației să funcționeze în fundal: „Mai mult → Setări → Permite funcționarea în fundal”.',
    readerText: '📖 Text', readerSpace: '✦ Cosmos', chapterEssence: 'Esența capitolului', textSmaller: 'Mai mic', textBigger: 'Mai mare',
    lessons: 'Lecții pentru viață', lessonsNote: 'Biblia ca manual pentru om: nouă trepte, de la scop până la țintă. Apăsați pe o treaptă — versetele ei se vor aprinde pe cer.',
    lessonsListenAll: '▶ Ascultă toate lecțiile', lessonListen: '▶ Ascultă lecția', lessonsAll: '☰ Toate lecțiile',
    lessonsMain: 'Ideea principală: omul este fericit când trăiește în armonie cu felul în care l-a gândit Creatorul. Poruncile descriu acest plan, istoriile arată ce se întâmplă când ne abatem de la el, iar profețiile — că planul se va împlini.',
    chaptersN: (n) => `Capitole: ${n}`, readOf: (r, n) => (r ? `citite ${r} din ${n}` : 'încă necitite'),
    prophecies: 'Profeții', prophNote: (n) => `${n} profeții: ce s-a prezis, cum și când s-a împlinit și ce promite Biblia pentru viitor. Atingeți un verset ca să-l deschideți.`,
    prophNone: 'Profețiile nu au putut fi încărcate.', prophListenAll: '▶ Ascultă secțiunea', prophSkyAll: '✦ Toate pe cer', prophListen: '▶ Ascultă', prophSky: '✦ Pe cer',
    prophDone: 'Împlinită', prophOngoing: 'Se împlinește', prophSign: 'Semn', prophPromise: 'Promisiune', prophForetold: 'Prezis', prophFulfilled: 'Împlinire', prophSays: 'Ce se spune',
    prophAlso: 'Vedeți și', prophHistory: 'confirmată de istorie', prophBack: '◀ La profeții', prophSkyNote: 'Arcele de pe cer duc de la profeție la împlinirea ei.',
    neuralFail: 'Vocea neuronală nu a pornit — citesc cu vocea sistemului.',
    ttsSilent: (why, n) => (n ? `Vocea sistemului nu răspunde (${why}).` : 'Pe acest dispozitiv nu s-a găsit nicio voce pentru citire.') + (location.protocol === 'app:' ? ' În Windows: Setări → Oră și limbă → Vorbire → „Adăugați voci” → Română, apoi reporniți programul.' : ' Verificați sunetul și vocile în setările sistemului sau deschideți programul în Microsoft Edge.'),
    audioTitle: 'Biblia audio', audioPickFolder: '📁 Alegeți dosarul cu înregistrări', audioPickFiles: 'Alegeți fișiere',
    audioStatus: (h, t) => (h ? `Înregistrări de capitole pe acest dispozitiv: ${h} din ${t}. Butonul „Ascultă” pornește vocea cititorului, iar evidențierea o urmează.` : 'Încărcați înregistrările capitolelor (fișiere MP3 ale „Traducerii lumii noi”, de exemplu nwt_01_Ge_M_01.mp3) — atunci „Ascultă” va porni vocea cititorului.'),
    audioUse: 'Ascultă înregistrările, când există', audioMissing: (n) => `Fără înregistrare: ${n} capitole`, audioWhole: 'toată cartea',
    audioDelete: 'Șterge înregistrările de pe dispozitiv', audioDeleteQ: 'Ștergeți toate înregistrările de pe acest dispozitiv? Fișierele din dosar rămân.',
    audioNote: 'Înregistrările se păstrează doar pe acest dispozitiv. Unde nu există înregistrare, citește vocea dispozitivului.',
    audioNone: 'Nu s-au găsit înregistrări. Sunt necesare fișiere MP3 cu nume ca nwt_01_Ge_M_01.mp3.',
    audioSaving: (d, n) => `Salvez înregistrările: ${d} din ${n}…`,
    audioSaved: (n, l, sk) => `Gata: înregistrări salvate — ${n} (${l}).${sk ? ` Alte fișiere omise: ${sk}.` : ''}`,
    audioAligning: 'Caut începutul versetului în înregistrare…', audioFull: 'Nu este destul spațiu pe dispozitiv pentru toate înregistrările.',
    welcomeBtn: 'Deschide fișierele EPUB',
    mentions: (n) => `Mențiuni: ${n}.`, aboutChapter: (x) => `Despre capitol: ${x}`, peopleHere: 'Persoane în capitol', chLinks: 'Cu ce este legat capitolul',
    showOnSky: 'Arată pe cer', didYouKnow: 'Știați că?', chLinksTitle: (r) => `Legăturile capitolului ${r}`, linksN: (n) => `legături: ${n}`,
    trail: 'Drumul meu prin legături', trailNote: 'Versetele prin care ați trecut, cele recente sus. Pe cer drumul strălucește roz.',
    trailEmpty: 'Drumul este încă gol. În cardul versetului apăsați „→ Mai departe pe legătură”.', trailClear: 'Șterge drumul', nextLink: '→ Mai departe pe legătură',
    footnotes: 'Notele ediției', peopleInVerse: 'Persoane în verset', terms: 'Noțiuni', measures: 'Măsuri și bani', parallels: 'Pasaje paralele',
    compare: 'Compară', quoteFrom: 'Citat din', quoteTo: 'Citat în', fulfillment: 'împlinirea unei profeții', bloom: 'Strălucirea stelelor',
    notes: 'Note', noNotes: 'Încă nu aveți note. Deschideți un verset și scrieți un gând în câmpul „Nota mea”.', notePh: 'Nota mea la acest verset…', noteTitle: 'Nota mea',
    places: 'Locuri în acest verset', map: 'Hartă', mapViews: { region: 'Toată regiunea', israel: 'Țara lui Israel' }, mapNoRoute: 'Nicio călătorie',
    mapReadRoute: 'Citește:', mapAllRoutes: 'Toate călătoriile', mapApprox: 'Traseele sunt aproximative: drumurile exacte din antichitate nu se cunosc peste tot.', mapHint: 'Cu două degete sau rotița — mărire, cu un deget — mutare, dublă atingere — mai aproape. Atingeți un loc pentru a vedea versetele despre el.', zoomIn: 'Mărește', zoomOut: 'Micșorează', zoomFit: 'Arată tot', mapVerses: (n) => `versete: ${n}`,
    events: 'Evenimente', eventsNote: 'Anii sunt după cronologia tradițională, aproximativi; istoricii au și alte datări.', inBeginning: 'La început',
    plan: 'Plan de citire', planNote: 'Alegeți un plan: în fiecare zi programul propune capitole și marchează ce ați citit.',
    plans: { year: 'Biblia într-un an', nt90: 'Noul Testament în 3 luni', gospels30: 'Evangheliile într-o lună', psalms30: 'Psalmii într-o lună', prov31: 'Proverbele într-o lună' },
    planDesc: (n, d) => `${chaptersWord(n)} · ${d} ${roDe(d)}${d === 1 ? 'zi' : 'zile'}`, planStart: 'Începe', planStop: 'Oprește planul', planToday: 'Astăzi',
    planProgress: (day, days, pct) => `Ziua ${day} din ${days} · citit ${pct}%`, planChip: (r) => `▶ Planul de azi: ${r}`,
    musicOn: 'Muzică: pornită', musicOff: 'Muzică: oprită', musicVol: 'Volumul muzicii',
    share: 'Distribuie', shareBtn: '↗ Distribuie', shareHint: 'Țineți apăsat pe imagine pentru a o salva sau copiați textul.',
    copyText: 'Copiază textul', copied: 'Copiat', copyFail: 'Nu s-a putut copia: selectați textul manual.',
    quiet: '☾ Liniște', quietExit: '✕ Ieși din liniște', xrQuiet: '☾ Liniște', xrMap: 'Hartă',
    quizModes: { book: 'Cartea', finish: 'Continuă versetul', ref: 'Capitol și verset' }, quizFinishQ: 'Cum se termină acest verset?', quizRefQ: 'Unde este scris acest verset?',
    quizWrong2: 'Greșit. Corect:', quizStreak: (n, b) => `serie ${n} · record ${b}`,
    paraHint: 'Ca versetele să apară pe paragrafe și versuri, ca în carte, deschideți din nou EPUB: „Mai mult → Deschide EPUB…”.',
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
  q: $('q'), audioBtn: $('audioBtn'), audioDir: $('audioDir'), audioFiles: $('audioFiles'), prophPanel: $('prophPanel'), prophBtn: $('prophBtn'), reader: $('reader'), readerBtn: $('readerBtn'), lessonsBtn: $('lessonsBtn'), prevCh: $('prevCh'), nextCh: $('nextCh'), prevPage: $('prevPage'), nextPage: $('nextPage'),
  legendToggle: $('legendToggle'), home: $('home'), chapterInfo: $('chapterInfo'), parallelPanel: $('parallelPanel'), trailBtn: $('trailBtn'), notesBtn: $('notesBtn'), mapBtn: $('mapBtn'), eventsBtn: $('eventsBtn'), planBtn: $('planBtn'), musicBtn: $('musicBtn'), mapPanel: $('mapPanel'), quiet: $('quietBtn'), quietExit: $('quietExit'), welcome: $('welcome'), welcomeBtn: $('welcomeBtn'), listPanel: $('listPanel'), votd: $('votd'), continueBtn: $('continueBtn'), settingsPanel: $('settingsPanel'), bmBtn: $('bmBtn'), topicsBtn: $('topicsBtn'), votdBtn: $('votdBtn'), settingsBtn: $('settingsBtn'), quiz: $('quiz'), quizBtn: $('quizBtn'), menuBtn: $('menuBtn'), menuList: $('menuList'), hintsBtn: $('hintsBtn'), toastText: $('toastText'), toastClose: $('toastClose'), legendClose: $('legendClose'), brand: $('brand'), detail: $('detail'), bookInfo: $('bookInfo'), file: $('file'), fileBtn: $('fileBtn'), listen: $('listen'), langRu: $('langRu'), langRo: $('langRo'),
};

/* ---------- Three.js: сцена ---------- */

// Телефоны и шлемы: экран очень плотный, поэтому рисуем меньше пикселей и без тяжёлых эффектов.
const MOBILE = /Android|iPhone|iPad|iPod|OculusBrowser|Quest|Pico|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.5 : 2));
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
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
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
  const words = text.replace(/\n/g, ' ').split(' ');
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
let paraHintShown = false;

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
    const book = { i, name: b.n, short: b.s || b.n, g, deutero: !!b.d, chapters, n, ci, vi, chStart, offset: acc, code: codes ? codes[i] : null, info: b.info || null, paras: Array.isArray(b.p) ? b.p.map((a) => new Set(a)) : null, fn: b.f || null };
    acc += n;
    return book;
  });
  TOTAL = acc;
  CODE_TO_BI = {};
  BOOKS.forEach((b) => { if (b.code) CODE_TO_BI[b.code] = b.i; });
  SYN = raw.length === 78;
  translationName = data.t || T().ownName;
  customActive = !!data.custom;
  if (data.custom && !raw.some((b) => Array.isArray(b.p)) && !paraHintShown) { paraHintShown = true; setTimeout(() => toast(T().paraHint, 10000), 2500); }
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
      const [cx, cy, depth] = clusterPoint(b.g, k, N, r, T, phase0);
      const p = center.clone().addScaledVector(right, cx).addScaledVector(up, cy).addScaledVector(dir, depth);
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

    const lh = MOBILE ? THREE.MathUtils.clamp(arc * 0.24, 1.5, 3.2) : THREE.MathUtils.clamp(arc * 0.19, 1.2, 2.7);
    const label = makeLabel(timeline ? `${b.name} · ${fmtYear(bookYear(b))}` : b.name, { px: 96, weight: 600, color: '#' + base.clone().lerp(white, 0.55).getHexString(), height: lh });
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
    const sym = new THREE.Sprite(new THREE.SpriteMaterial({ map: genreSymbol(g0), color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    sym.position.copy(place(fm, R * 1.04, 0.2).pos);
    sym.scale.setScalar(5);
    g.add(sym);
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
  galaxy.bmPts = galaxy.searchPts = galaxy.topic = galaxy.notePts = galaxy.chapterLinks = galaxy.trail = null;
  votdStar = null;
  BOOKS.forEach((b) => updateBookColors(b.i));
  refreshBmStars();
  refreshNoteStars();
}

/* ---------- Уровни 2 и 3 ---------- */

let modeGroup = null;
let musicFrame = 0;
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

// Абзацы главы: из EPUB (разметка издания) или, если её нет, подобранные по длине текста.
function paragraphStarts(b, ci) {
  if (b.paras && b.paras[ci]) return b.paras[ci];
  const vs = b.chapters[ci];
  const set = new Set([0]);
  let acc = 0;
  vs.forEach((v, vi) => {
    if (vi > 0 && acc > 380 && /[.!?»"”)]$/.test(vs[vi - 1].trim())) { set.add(vi); acc = 0; }
    acc += v.length;
  });
  return set;
}

// Перенос строк с учётом стихотворных строк ('\n') и отступа первых строк под крупный номер главы.
const POETRY_INDENT = 34;
function layoutLines(g, text, fullW, indentW, indentLines) {
  const out = [];
  const parts = text.split('\n');
  const poetry = parts.length > 1;
  parts.forEach((part, pi) => {
    const words = part.split(' ').filter(Boolean);
    let line = '';
    let seg = 0;
    const shift = () => (out.length < indentLines ? indentW : 0) + (poetry && pi > 0 ? POETRY_INDENT : 0) + (poetry && seg > 0 ? POETRY_INDENT : 0);
    const push = () => { out.push({ t: line, x: shift() }); seg++; };
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (!line || g.measureText(t).width <= fullW - shift()) line = t;
      else { push(); line = w; }
    }
    if (line) push();
  });
  return out;
}

// Карточка стиха — кусок «страницы»: стихи одного абзаца стыкуются без зазора.
// pos: 'single' | 'first' | 'mid' | 'last' — место в абзаце (и в колонке).
function drawCard(b, ci, vi, focused, pos = 'single') {
  const text = verseText(b.i, ci, vi);
  const lead = vi === 0;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const numW = CARD.numW;
  const bigPx = Math.round(CARD.lh * 1.9);
  g.font = `600 ${bigPx}px ${FONT_TITLE}`;
  const bigW = lead ? g.measureText(String(ci + 1)).width + 18 : 0;
  g.font = `${CARD.font}px ${FONT_CARD}`;
  const fullW = CARD.PX - CARD.pad * 2 - numW;
  const indentW = lead ? Math.max(0, bigW - numW + 6) : 0;
  let lines = layoutLines(g, text, fullW, indentW, lead ? 2 : 0);
  const truncated = lines.length > CARD.maxLines;
  if (truncated) { lines = lines.slice(0, CARD.maxLines); lines[lines.length - 1].t += ' …'; }
  const topPad = pos === 'first' || pos === 'single' ? 26 : 6;
  const botPad = pos === 'last' || pos === 'single' ? 24 : 6;
  c.width = CARD.PX;
  c.height = Math.max(topPad + Math.max(lines.length, lead ? 2 : 1) * CARD.lh + botPad, 56);
  const W = c.width, H = c.height, r = 22;
  const roundTop = pos === 'first' || pos === 'single';
  const roundBot = pos === 'last' || pos === 'single';
  g.fillStyle = focused ? 'rgba(72, 55, 18, 0.93)' : 'rgba(12, 15, 33, 0.9)';
  g.beginPath();
  g.roundRect(1, 0, W - 2, H, [roundTop ? r : 0, roundTop ? r : 0, roundBot ? r : 0, roundBot ? r : 0]);
  g.fill();
  // Рамка только по внешнему контуру абзаца: внутренние стыки остаются невидимыми.
  g.lineWidth = 2;
  g.strokeStyle = focused ? '#f3c35b' : 'rgba(243, 195, 91, 0.26)';
  g.beginPath();
  g.roundRect(1, roundTop ? 1 : -30, W - 2, H - 2 + (roundTop ? 0 : 30) + (roundBot ? 0 : 30), [roundTop ? r : 0, roundTop ? r : 0, roundBot ? r : 0, roundBot ? r : 0]);
  g.stroke();
  const accent = '#' + bookColor(b).clone().lerp(new THREE.Color('#ffffff'), 0.3).getHexString();
  g.textBaseline = 'top';
  if (lead) {
    // Крупный номер главы в начале, как в печатных Библиях.
    g.fillStyle = '#f3c35b';
    g.shadowColor = 'rgba(243, 195, 91, 0.55)';
    g.shadowBlur = 18;
    g.font = `600 ${bigPx}px ${FONT_TITLE}`;
    g.fillText(String(ci + 1), CARD.pad, topPad - Math.round(bigPx * 0.12));
    g.shadowBlur = 0;
  } else {
    g.textAlign = 'right';
    g.fillStyle = accent;
    g.font = `600 ${Math.round(CARD.font * 0.82)}px ${FONT_TITLE}`;
    g.fillText(String(vi + 1), CARD.pad + numW - 14, topPad + 6);
    g.textAlign = 'left';
  }
  g.fillStyle = '#eef1fa';
  g.font = `${CARD.font}px ${FONT_CARD}`;
  lines.forEach((ln, k) => g.fillText(ln.t, CARD.pad + numW + ln.x, topPad + k * CARD.lh + 4));
  const marks = (isBookmarked(b.i, ci, vi) ? '★' : '') + (noteOf(b.i, ci, vi) ? ' ✎' : '');
  if (marks) {
    g.fillStyle = '#f3c35b';
    g.font = `34px ${FONT_UI}`;
    g.textAlign = 'right';
    g.fillText(marks.trim(), W - 14, Math.max(4, topPad - 20));
    g.textAlign = 'left';
  }
  return { canvas: c, truncated, h: H / CARD.ppm };
}

// Заголовок главы: книга, «Глава N» крупно, орнамент и число стихов.
function makeChapterHeader(b, ci, page, pages) {
  const c = document.createElement('canvas');
  const W = 1600, H = 420;
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const glow = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.45);
  glow.addColorStop(0, 'rgba(4, 5, 14, 0.75)');
  glow.addColorStop(1, 'rgba(4, 5, 14, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#' + bookColor(b).clone().lerp(new THREE.Color('#ffffff'), 0.45).getHexString();
  g.font = `600 44px ${FONT_UI}`;
  g.letterSpacing = '10px';
  g.fillText(b.name.toUpperCase(), W / 2, 58);
  g.letterSpacing = '0px';
  g.fillStyle = '#f6e7c1';
  g.shadowColor = 'rgba(243, 195, 91, 0.45)';
  g.shadowBlur = 26;
  g.font = `600 150px ${FONT_TITLE}`;
  g.fillText(b.code === 'Ps' ? T().psalm(ci + 1) : T().chapter(ci + 1), W / 2, 178);
  g.shadowBlur = 0;
  // Орнамент: тонкие золотые линии и звезда.
  g.strokeStyle = 'rgba(243, 195, 91, 0.75)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W / 2 - 330, 292); g.lineTo(W / 2 - 40, 292);
  g.moveTo(W / 2 + 40, 292); g.lineTo(W / 2 + 330, 292);
  g.stroke();
  g.fillStyle = '#f3c35b';
  g.font = `48px ${FONT_UI}`;
  g.fillText('✦', W / 2, 292);
  g.fillStyle = '#aeb6d2';
  g.font = `40px ${FONT_UI}`;
  g.fillText(versesWord(b.chapters[ci].length) + (pages > 1 ? ` · ${T().page(page + 1, pages)}` : ''), W / 2, 370);
  const w = 1.7, h = (w * H) / W;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthWrite: false }));
  m.userData.h = h;
  return m;
}

function buildChapter(bi, ci, focus, page) {
  const b = BOOKS[bi];
  const verses = b.chapters[ci];
  const n = verses.length;
  const { pos: eye, yaw } = headInfo();
  const top = eye.y + 0.95, maxH = 2.3, PG = 0.075;
  const starts = paragraphStarts(b, ci);
  const paraPos = (vi) => {
    const first = starts.has(vi), last = vi === n - 1 || starts.has(vi + 1);
    return first && last ? 'single' : first ? 'first' : last ? 'last' : 'mid';
  };
  // 1) Карточки с местом в абзаце.
  const pos = verses.map((_, vi) => paraPos(vi));
  let cards = verses.map((_, vi) => drawCard(b, ci, vi, vi === focus, pos[vi]));
  // 2) Колонки одинаковой высоты; новый абзац внутри колонки отделяется зазором.
  const gapBefore = (vi, inCol) => (inCol && starts.has(vi) ? PG : 0);
  let total = 0;
  cards.forEach((card, vi) => { total += card.h + gapBefore(vi, vi > 0); });
  const ncols = Math.max(1, Math.ceil(total / maxH));
  const target = total / ncols;
  const cols = [];
  let cur = [], used = 0;
  cards.forEach((card, vi) => {
    const add = card.h + gapBefore(vi, cur.length > 0);
    const over = used + add > maxH;
    const balanced = cols.length < ncols - 1 && used + add / 2 > target;
    if (cur.length && (over || balanced)) { cols.push(cur); cur = []; used = 0; }
    cur.push(vi);
    used += card.h + gapBefore(vi, cur.length > 1);
  });
  if (cur.length) cols.push(cur);
  // 3) На стыке колонок абзац получает скругления сверху/снизу.
  const colStartSet = new Set(cols.map((c) => c[0])), colEndSet = new Set(cols.map((c) => c[c.length - 1]));
  verses.forEach((_, vi) => {
    let p = pos[vi];
    if (colStartSet.has(vi)) p = p === 'mid' ? 'first' : p === 'last' ? 'single' : p;
    if (colEndSet.has(vi)) p = p === 'mid' ? 'last' : p === 'first' ? 'single' : p;
    if (p !== pos[vi]) { pos[vi] = p; cards[vi] = drawCard(b, ci, vi, vi === focus, p); }
  });

  const colStep = (CARD.W + 0.16) / CARD.R;
  const PER_PAGE = Math.max(3, Math.floor((Math.PI * 2 * 0.86) / colStep));
  const pages = Math.ceil(cols.length / PER_PAGE);
  if (focus >= 0) page = Math.floor(cols.findIndex((c) => c.includes(focus)) / PER_PAGE);
  page = THREE.MathUtils.clamp(page, 0, pages - 1);
  const pageCols = cols.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  let offset = (pageCols.length - 1) / 2;
  if (pageCols.length > 5) offset = 2;
  if (focus >= 0) offset = pageCols.findIndex((c) => c.includes(focus));

  const g = new THREE.Group();
  const items = [];
  const starPos = [], starCol = [], thread = [];
  const accent = bookColor(b);
  const onPage = new Set(pageCols.flat());
  cards.forEach((card, vi) => { if (!onPage.has(vi)) card.canvas.width = 0; });
  pageCols.forEach((list, cIdx) => {
    const az = yaw + (cIdx - offset) * colStep;
    const dir = new THREE.Vector3(Math.sin(az), 0, -Math.cos(az));
    const right = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    let y = top;
    let prevStar = null;
    list.forEach((vi, k) => {
      const card = cards[vi];
      if (k > 0) y -= gapBefore(vi, true);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CARD.W, card.h),
        new THREE.MeshBasicMaterial({ map: makeTexture(card.canvas), transparent: true, opacity: 0.95, depthWrite: false }),
      );
      const p = eye.clone().addScaledVector(dir, CARD.R);
      p.y = y - card.h / 2;
      mesh.position.copy(p);
      mesh.lookAt(eye.x, p.y, eye.z);
      mesh.userData = { vi, truncated: card.truncated, home: mesh.position.clone(), order: items.length, pos: pos[vi] };
      g.add(mesh);
      items.push(mesh);
      // Звезда стиха на полях, звёзды колонки соединены тонкой нитью.
      const topOff = (pos[vi] === 'first' || pos[vi] === 'single' ? 26 : 6) / CARD.ppm + CARD.lh / CARD.ppm / 2;
      const sp = p.clone().addScaledVector(right, -(CARD.W / 2 + 0.06)).add(new THREE.Vector3(0, card.h / 2 - topOff, 0)).addScaledVector(dir, -0.02);
      starPos.push(sp.x, sp.y, sp.z);
      const c = vi === focus ? new THREE.Color('#ffe7a3') : vi === 0 ? new THREE.Color('#f3c35b') : accent;
      starCol.push(c.r, c.g, c.b);
      if (prevStar) thread.push(prevStar.x, prevStar.y, prevStar.z, sp.x, sp.y, sp.z);
      prevStar = sp;
      y -= card.h;
    });
  });
  const ns = starPos.length / 3;
  const pts = makePoints(new Float32Array(starPos), new Float32Array(starCol), new Float32Array(ns).map((_, i) => (i === 0 && page === 0 ? 0.1 : 0.06)), new Float32Array(ns).map((_, i) => i), new Float32Array(ns).map(() => Math.random() * 6.28));
  g.add(pts);
  if (thread.length) {
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(thread), 3));
    g.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
  }
  const title = makeChapterHeader(b, ci, page, pages);
  const fd = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  title.position.copy(eye).addScaledVector(fd, CARD.R + 0.12);
  title.position.y = top + 0.06 + title.userData.h / 2;
  title.lookAt(eye.x, title.position.y, eye.z);
  g.add(title);
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
            m.material.opacity = 0.95 * k;
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
    const check = () => {
      if (isBg()) { fader.material.opacity = v; resolve(); return; }
      if (Math.abs(fader.material.opacity - v) < 0.02) resolve(); else setTimeout(check, 16);
    };
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
  if (quiet.on && mode !== 'chapter') exitQuiet();
  if (sky) sky.setMode(quiet.on ? 'quiet' : mode);
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
  if (quiet.on) { exitQuiet(); return; }
  if (!ui.parallelPanel.hidden) { ui.parallelPanel.hidden = true; return; }
  if (!ui.mapPanel.hidden || mapVr.group) { closeMap(); return; }
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
  const want = (settings.voices || {})[code] || settings.voice;
  if (want) {
    const v = tts.voices.find((x) => x.name === want && x.lang.toLowerCase().replace('_', '-').startsWith(code));
    if (v) return v;
  }
  const list = tts.voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(code));
  const score = (v) => {
    const n = v.name.toLowerCase();
    let sc = 0;
    if (/natural|neural/.test(n)) sc += 6;
    if (/premium|enhanced|wavenet|studio/.test(n)) sc += 5;
    if (n.includes('online')) sc += 3;
    if (n.includes('google')) sc += 3;
    if (n.includes('microsoft')) sc += 1;
    if (!v.localService) sc += 1;
    if (/svetlana|dariya|milena|katya|ioana|alina|emil/.test(n)) sc += 1;
    if (/espeak|compact|eloquence|robot|novelty/.test(n)) sc -= 6;
    return sc;
  };
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}
// В APK (Android WebView) нет speechSynthesis, там читает встроенный синтезатор Android через мост AndroidTTS.
// В программе для компьютера тот же интерфейс даёт нейросетевой голос (Piper) — мост DesktopTTS.
if (window.DesktopTTS && !window.AndroidTTS) window.AndroidTTS = window.DesktopTTS;
window.addEventListener('native-tts', (e) => {
  const [type, id] = String(e.detail).split('|');
  if (type === 'start') window.__ttsStart(id);
  else if (type === 'done') window.__ttsDone(id);
  else if (type === 'fail' && window.AndroidTTS === window.DesktopTTS) {
    // нейросетевой голос не запустился — дальше читают голоса системы
    window.AndroidTTS = undefined;
    const was = tts.reading;
    stopReading();
    toast(T().neuralFail, 8000);
    if (was) readFrom(was.vi, { bi: was.bi, ci: was.ci });
  }
});
const androidDone = {}, androidStart = {};
window.__ttsDone = (id) => { const f = androidDone[id]; delete androidDone[id]; if (f) f(); };
window.__ttsStart = (id) => { const f = androidStart[id]; delete androidStart[id]; if (f) f(); };
window.__ttsStopped = () => { if (tts.reading) stopReading(); };
window.__ttsNoVoice = () => { if (!tts.warned['a' + LANG]) { tts.warned['a' + LANG] = true; toast(T().noVoiceAndroid, 9000); } };
// Приложение свёрнуто или экран выключен: чтение идёт дальше, а картинка не обновляется.
let appBg = false;
const isBg = () => document.hidden || appBg;
window.__appBackground = (b) => { appBg = !!b; if (!b) setTimeout(syncReadingView, 300); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(syncReadingView, 300); });

// Текст для синтезатора: без ударений и служебных знаков, с раскрытыми сокращениями.
function speechText(text) {
  let t = String(text).replace(/́/g, '').replace(/[*+†‡]/g, '').replace(/\s+/g, ' ');
  if (LANG === 'ru') {
    t = t.replace(/до н\.\s?э\./g, 'до нашей эры').replace(/н\.\s?э\./g, 'нашей эры')
      .replace(/и т\.\s?д\./g, 'и так далее').replace(/и т\.\s?п\./g, 'и тому подобное').replace(/т\.\s?е\./g, 'то есть');
  } else {
    t = t.replace(/î\.\s?e\.\s?n\./g, 'înaintea erei noastre').replace(/\be\.\s?n\./g, 'era noastră').replace(/\bș\.a\.m\.d\./g, 'și așa mai departe');
  }
  return t.replace(/\(([^)]*)\)\s*/, '$1. ').trim();
}
// Длинный стих делится на фразы: так голос не обрывается (известная ошибка Chrome) и паузы естественнее.
function speechChunks(text, max = 180) {
  const parts = text.match(/[^.!?;:…]+[.!?;:…]+["»“”]*\s*|[^.!?;:…]+$/g) || [text];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (p.length > max) {
      const words = p.split(/(?<=,)\s+|\s+/);
      for (const w of words) { if ((cur + ' ' + w).length > max && cur) { out.push(cur.trim()); cur = ''; } cur += (cur ? ' ' : '') + w; }
    } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function androidVoices() {
  try { return JSON.parse(window.AndroidTTS.voices(T().speech) || '[]'); } catch { return []; }
}
function bgHint() {
  const a = window.AndroidTTS;
  if (!a || !a.backgroundAllowed || store.get('bgHint', false)) return;
  try { if (a.backgroundAllowed()) return; } catch { return; }
  store.set('bgHint', true);
  toast(T().bgHint, 12000);
}
function applyAndroidVoice() {
  const a = window.AndroidTTS;
  if (a.setStopLabel) a.setStopLabel(T().stopReading);
  if (a.setRate) a.setRate(settings.rate);
  if (a.setPitch) a.setPitch(settings.pitch || 1);
  if (a.setVoice) a.setVoice((settings.voices || {})[LANG] || '');
}
const nativeQueue = () => !!(window.AndroidTTS && window.AndroidTTS.speakList);

function speak(text, onDone) {
  if (window.AndroidTTS) {
    const token = ++tts.token;
    const id = 'u' + token;
    tts.talking = true;
    androidDone[id] = () => { tts.talking = false; if (token === tts.token) onDone(); };
    applyAndroidVoice();
    window.AndroidTTS.speak(speechText(text), T().speech, id);
    if (text.length > 150) bgHint();
    return true;
  }
  if (!hasTts) { toast(T().noTts, 5000); return false; }
  speechSynthesis.cancel();
  const token = ++tts.token;
  const v = pickVoice();
  if (!v && !tts.warned[LANG]) { tts.warned[LANG] = true; toast(T().noVoice, 7000); }
  const chunks = speechChunks(speechText(text));
  tts.talking = true;
  // Голос системы может молчать (нет голоса для языка или синтезатор не отвечает) — тогда об этом говорится прямо.
  let alive = false;
  const silent = (why) => {
    if (token !== tts.token) return;
    stopReading(); stopNarration();
    toast(T().ttsSilent(why, tts.voices.length), 14000);
  };
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    if (v) u.voice = v;
    u.lang = T().speech;
    u.rate = settings.rate;
    u.pitch = settings.pitch || 1;
    u.onstart = () => { alive = true; };
    u.onend = () => { alive = true; if (i === chunks.length - 1) { tts.talking = false; if (token === tts.token) onDone(); } };
    u.onerror = (e) => { if (token === tts.token && e.error !== 'interrupted' && e.error !== 'canceled') silent(e.error || 'error'); };
    tts.utter = u;
    speechSynthesis.speak(u);
  });
  setTimeout(() => { if (!alive && token === tts.token && !speechSynthesis.speaking) silent('timeout'); }, 5000);
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
  readFrame.scale.set(CARD.W + 0.035, h + 0.01, 1);
  readFrame.quaternion.copy(mesh.quaternion);
  const home = mesh.userData.home || mesh.position;
  const out = new THREE.Vector3().subVectors(home, ch.eye).setY(0).normalize();
  readFrame.position.copy(home).addScaledVector(out, 0.004);
  readFrame.visible = true;
  markReaderVerse();
  ch.pts.material.uniforms.uHover.value = ch.items.indexOf(mesh);
  if (!renderer.xr.isPresenting) {
    const d = new THREE.Vector3().subVectors(home, ch.eye);
    look.target = Math.atan2(d.x, -d.z);
  }
}

// Звуковая «сессия» в браузере: тихая дорожка не даёт телефону усыпить вкладку,
// а на экране блокировки появляются кнопки «пауза / дальше / назад».
const media = { audio: null };
function silentWav() {
  const n = 8000, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) buf[o + i] = t.charCodeAt(i); };
  s(0, 'RIFF'); dv.setUint32(4, 36 + n, true); s(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); s(36, 'data'); dv.setUint32(40, n, true);
  buf.fill(128, 44);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function startMediaSession() {
  if (window.AndroidTTS || renderer.xr.isPresenting) return;
  try {
    if (!media.audio) { media.audio = new Audio(silentWav()); media.audio.loop = true; }
    media.audio.play().catch(() => {});
  } catch { /* без тихой дорожки читаем как обычно */ }
  if (!('mediaSession' in navigator) || media.handlers) return;
  media.handlers = true;
  const ms = navigator.mediaSession;
  const set = (a, f) => { try { ms.setActionHandler(a, f); } catch { /* действие не поддерживается */ } };
  set('pause', () => stopReading());
  set('stop', () => stopReading());
  set('play', () => { const r = media.last; if (r && !tts.reading) readFrom(r.vi, { bi: r.bi, ci: r.ci }); });
  set('nexttrack', () => { const r = tts.reading || media.last; if (r) { const n = neighbourChapter(r.bi, r.ci, 1); if (n) readFrom(0, n); } });
  set('previoustrack', () => { const r = tts.reading || media.last; if (r) { const n = neighbourChapter(r.bi, r.ci, -1); if (n) readFrom(0, n); } });
}
function updateMediaSession() {
  const r = tts.reading;
  if (!r || window.AndroidTTS || !('mediaSession' in navigator)) return;
  media.last = { ...r };
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: `${BOOKS[r.bi].name} ${r.ci + 1}:${r.vi + 1}`, artist: (ui.brand && ui.brand.textContent.trim()) || 'Bible Cosmos', album: BOOKS[r.bi].name });
    navigator.mediaSession.playbackState = 'playing';
  } catch { /* старый браузер */ }
}
function endMediaSession() {
  if (media.audio) media.audio.pause();
  try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; } catch { /* нет */ }
}
function neighbourChapter(bi, ci, d) {
  let nb = bi, nc = ci + d;
  if (nc >= BOOKS[nb].chapters.length) { nb++; nc = 0; }
  if (nc < 0) { nb--; if (nb < 0) return null; nc = BOOKS[nb].chapters.length - 1; }
  return nb < BOOKS.length ? { bi: nb, ci: nc } : null;
}

// Показ читаемого стиха: только когда программа на экране и открыта эта глава.
async function showReadingVerse(vi) {
  const r = tts.reading;
  if (!r) return;
  r.vi = vi;
  updateMediaSession();
  if (isBg() || state.mode !== 'chapter' || state.bi !== r.bi || state.ci !== r.ci || !state.chapter) return;
  if (state.chapter.pageOf[vi] !== state.page) await go('chapter', { bi: r.bi, ci: r.ci, page: state.chapter.pageOf[vi], keepReading: true });
  if (tts.reading === r) markReading(vi);
  updateListenButton();
}
// Вернулись в программу: показать главу и стих, которые сейчас звучат.
function syncReadingView() {
  const r = tts.reading;
  if (!r || isBg() || renderer.xr.isPresenting || busy) return;
  if (state.mode === 'chapter' && state.bi === r.bi && state.ci === r.ci) { showReadingVerse(r.vi); return; }
  if (state.mode === 'chapter' || quiet.on) go('chapter', { bi: r.bi, ci: r.ci, focus: r.vi, keepReading: true }).then(() => { if (tts.reading) markReading(tts.reading.vi); updateListenButton(); });
}

function chapterHeading(bi, ci) { return (BOOKS[bi].code === 'Ps' ? T().psalm(ci + 1) : T().chapterComma(BOOKS[bi].name, ci + 1)) + '. '; }

// Чтение с указанного стиха. В APK вся глава сразу ставится в очередь синтезатора Android,
// поэтому чтение продолжается при выключенном экране и без пауз между стихами.
async function readFrom(vi, at) {
  const bi = at ? at.bi : state.bi, ci = at ? at.ci : state.ci;
  if (!at && state.mode !== 'chapter') return;
  const r = { bi, ci, vi };
  tts.reading = r;
  hideToast();
  // Есть запись этой главы — звучит живой голос чтеца, подсветка идёт по времени записи.
  if (hasAudio(bi, ci)) { stopAudio(true); audioReadFrom(vi, bi, ci); updateListenButton(); return; }
  startMediaSession();
  if (nativeQueue()) {
    const token = ++tts.token;
    const n = BOOKS[bi].chapters[ci].length;
    const items = [];
    for (let v = vi; v < n; v++) {
      const id = `v${token}_${v}`;
      androidStart[id] = () => { if (token === tts.token) showReadingVerse(v); };
      items.push([id, speechText(`${v === 0 ? chapterHeading(bi, ci) : ''}${verseText(bi, ci, v)}`)]);
    }
    const listId = `L${token}`;
    androidDone[listId] = () => { if (token === tts.token) chapterDone(bi, ci); };
    applyAndroidVoice();
    tts.talking = true;
    window.AndroidTTS.speakList(JSON.stringify(items), T().speech, listId, `${BOOKS[bi].name} ${ci + 1}`, T().stopReading);
    bgHint();
    showReadingVerse(vi);
    updateListenButton();
    return;
  }
  await showReadingVerse(vi);
  if (tts.reading !== r) return;
  updateListenButton();
  const ok = speak(`${vi === 0 ? chapterHeading(bi, ci) : ''}${verseText(bi, ci, vi)}`, () => {
    if (tts.reading !== r) return;
    if (vi + 1 >= BOOKS[bi].chapters[ci].length) chapterDone(bi, ci);
    else readFrom(vi + 1, { bi, ci });
  });
  if (!ok) stopReading();
}
// Глава дочитана: отметить её и, если включено, читать следующую.
function chapterDone(bi, ci) {
  markRead(bi, ci);
  const next = neighbourChapter(bi, ci, 1);
  if (!next || (settings.autoNext === false && !quiet.on)) { stopReading(); return; }
  if (isBg() || state.mode !== 'chapter' || state.bi !== bi || state.ci !== ci || renderer.xr.isPresenting) { readFrom(0, next); return; }
  tts.reading = { ...next, vi: 0 };
  go('chapter', { bi: next.bi, ci: next.ci, keepReading: true }).then(() => { if (tts.reading) readFrom(0, next); });
}
function stopReading() {
  const was = !!tts.reading;
  tts.talking = false;
  tts.reading = null;
  tts.token++;
  if (hasTts) speechSynthesis.cancel();
  if (window.AndroidTTS) window.AndroidTTS.stop();
  stopAudio();
  endMediaSession();
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
  navLabels();
  reader.built = '';
  updateReaderBtn();
  ui.hintsBtn.textContent = hintsOn ? L.hintsOn : L.hintsOff;
  if (typeof music !== 'undefined') updateMusicBtn();
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
  loadKnowledge();
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
  const MAXSEG = 16 * 24;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXSEG * 2 * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXSEG * 2 * 3), 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.frustumCulled = false;
  lines.visible = false;
  scene.add(lines);
  const dots = [];
  for (let i = 0; i < 16; i++) {
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
  const arr = arcs.geo.attributes.position.array, carr = arcs.geo.attributes.color.array;
  const SEG = 24;
  let n = 0;
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), ctrl = new THREE.Vector3(), b = new THREE.Vector3();
  arcs.curves = [];
  rel.slice(0, 16).forEach((r, i) => {
    const color = r.quote ? arcColor.cyan : arcColor.gold;
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
      carr.set([color.r, color.g, color.b, color.r, color.g, color.b], n * 6);
      n++;
    }
    arcs.curves.push({ a: a.clone(), ctrl: ctrl.clone(), b: b.clone(), color });
    arcs.dots[i].material.color.copy(color);
    arcs.dots[i].position.copy(b);
    arcs.dots[i].visible = true;
  });
  arcs.geo.setDrawRange(0, n * 2);
  arcs.geo.attributes.position.needsUpdate = true;
  arcs.geo.attributes.color.needsUpdate = true;
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
    selFrame.scale.set(CARD.W + 0.05, h + 0.012, 1);
    selFrame.quaternion.copy(mesh.quaternion);
    const home = mesh.userData.home || mesh.position;
    const out = new THREE.Vector3().subVectors(home, ch.eye).setY(0).normalize();
    selFrame.position.copy(home).addScaledVector(out, 0.006);
    selFrame.visible = true;
  }
  const rel = related(state.bi, state.ci, vi);
  if (renderer.xr.isPresenting) buildVrDetail(vi, rel, mesh);
  else renderDetail(vi, rel);
  markReaderVerse();
}
function closeDetail() {
  detail.open = false;
  detail.vi = -1;
  selFrame.visible = false;
  ui.detail.hidden = true;
  document.body.classList.remove('has-detail');
  if (detail.vrGroup) { scene.remove(detail.vrGroup); disposeTree(detail.vrGroup); detail.vrGroup = null; }
  detail.vrButtons = [];
  markReaderVerse();
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
  const sh = el2('button', 'btn', L.shareBtn);
  sh.type = 'button';
  sh.addEventListener('click', () => shareVerse(bi, ci, vi));
  box.append(el2('div', 'actions'));
  box.lastChild.append(listen, bm, sh);
  // Заметка к стиху
  const nl = el2('label', 'note-label', L.noteTitle);
  nl.htmlFor = 'noteInput';
  const ta = el2('textarea');
  ta.id = 'noteInput'; ta.rows = 2; ta.placeholder = L.notePh; ta.value = noteOf(bi, ci, vi);
  let noteTimer = 0;
  ta.addEventListener('input', () => { clearTimeout(noteTimer); noteTimer = setTimeout(() => setNote(bi, ci, vi, ta.value), 400); });
  ta.addEventListener('blur', () => { clearTimeout(noteTimer); setNote(bi, ci, vi, ta.value); });
  box.append(nl, ta);
  // Места, упомянутые в стихе
  const pl = placesIn(verseText(bi, ci, vi));
  if (pl.length) {
    box.append(el2('h3', '', L.places));
    const row = el2('div', 'actions wrap');
    for (const id of pl) {
      const b = el2('button', 'btn place', `⌖ ${placeName(id)}`);
      b.type = 'button';
      b.addEventListener('click', () => openMap({ place: id }));
      row.append(b);
    }
    box.append(row);
  }
  const chipRow = (title, items) => {
    if (!items.length) return;
    box.append(el2('h3', '', title));
    const row = el2('div', 'chips');
    for (const [label, fn] of items) { const c = el2('button', 'chip', label); c.type = 'button'; c.addEventListener('click', fn); row.append(c); }
    box.append(row);
  };
  const vtext = verseText(bi, ci, vi);
  chipRow(L.peopleInVerse, figuresIn(bi, vtext).map((f) => [LANG === 'ro' ? f.ro : f.ru, () => showFigure(f)]));
  const terms = termsIn(vtext);
  if (terms.length) {
    const defBox = el2('p', 'def');
    defBox.hidden = true;
    chipRow(L.terms, terms.map((t) => [LANG === 'ro' ? t.ro : t.ru, () => { defBox.hidden = false; defBox.textContent = `${LANG === 'ro' ? t.ro : t.ru}: ${LANG === 'ro' ? t.def_ro : t.def_ru}`; }]));
    box.append(defBox);
  }
  const meas = measuresIn(vtext);
  if (meas.length) { box.append(el2('h3', '', L.measures)); for (const m of meas) box.append(el2('p', 'muted small', m)); }
  const fns = b.fn && b.fn[ci] && b.fn[ci][vi];
  if (fns && fns.length) { box.append(el2('h3', '', L.footnotes)); for (const f of fns) box.append(el2('p', 'fn', f)); }
  const pars = PARALLELS ? parallelsFor(bi, ci, vi) : [];
  if (pars.length) {
    box.append(el2('h3', '', L.parallels));
    for (const ev of pars) {
      const row = el2('div', 'par-row');
      row.append(el2('span', 'muted small', `${pick2(ev)}: ${Object.entries(ev.refs).map(([c, r]) => `${BOOKS[CODE_TO_BI[c]] ? BOOKS[CODE_TO_BI[c]].short : c} ${r.replace('.', ':')}`).join(' · ')}`));
      const cb = el2('button', 'btn', L.compare); cb.type = 'button'; cb.addEventListener('click', () => showParallel(ev));
      row.append(cb);
      box.append(row);
    }
  }
  const quotes = quotesFor(bi, ci, vi);
  if (quotes.length) {
    const ul = el2('ul', 'links');
    for (const q of quotes) {
      const li = el2('li'), btn = el2('button');
      btn.type = 'button';
      btn.append(el2('span', 'r q', `${q.dir === 'from' ? L.quoteFrom : L.quoteTo} ${relRef(q.r)}${q.kind === 'fulfillment' ? ' · ' + L.fulfillment : ''}`), el2('span', 't', plain(verseText(q.r.bi, q.r.ci, q.r.vi))));
      btn.addEventListener('click', () => { addToTrail({ bi, ci, vi }); addToTrail(q.r); jumpTo(q.r); });
      li.append(btn); ul.append(li);
    }
    box.append(ul);
  }
  box.append(el2('h3', '', L.related));
  if (XREF && rel.length) {
    const nx = el2('button', 'btn primary', L.nextLink); nx.type = 'button';
    nx.addEventListener('click', () => nextAlongLinks(bi, ci, vi));
    box.append(el2('div', 'actions')); box.lastChild.append(nx);
  }
  if (!XREF) box.append(el2('p', 'muted', L.relatedLoading));
  else if (!rel.length) box.append(el2('p', 'muted', L.noRelated));
  else {
    const ul = el2('ul', 'links');
    for (const r of rel) {
      const li = el2('li');
      const btn = el2('button');
      btn.type = 'button';
      btn.append(el2('span', 'r', relRef(r)), el2('span', 't', verseText(r.bi, r.ci, r.vi)));
      btn.addEventListener('click', () => { addToTrail({ bi, ci, vi }); addToTrail(r); jumpTo(r); });
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
  // Карточка заканчивается над кнопками внизу, даже если они переносятся во вторую строку.
  ui.detail.style.bottom = innerWidth >= 720 && !ui.nav.hidden ? `${Math.round(innerHeight - ui.nav.getBoundingClientRect().top + 10)}px` : '';
}
addEventListener('resize', placeDetail);

function renderBookPanel() {
  const box = ui.bookInfo;
  if (readerWanted()) { box.hidden = true; return; }
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
  const txt = el2('button', 'btn', L.readerText); txt.type = 'button';
  txt.addEventListener('click', () => { settings.reader = 'text'; saveSettings(); renderReader(true); renderBookPanel(); });
  box.append(el2('div', 'actions'));
  box.lastChild.append(nar, txt);
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
  const note = noteOf(bi, ci, vi);
  const fn1 = BOOKS[bi].fn && BOOKS[bi].fn[ci] && BOOKS[bi].fn[ci][vi];
  const info = (note ? [`✎ ${note.slice(0, 80)}${note.length > 80 ? '…' : ''}`] : []).concat(fn1 ? [`* ${fn1[0].slice(0, 80)}`] : []).concat(about ? about.rows.slice(0, 4).map(([k, v]) => `${k}: ${v}`) : []);
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
/* Викторина: три уровня. «Книга» — из какой книги стих; «Продолжи стих» — выбрать окончание;
   «Глава и стих» — точное место в книге. Счёт, серия правильных ответов и рекорд по каждому уровню. */
const QUIZ_MODES = ['book', 'finish', 'ref'];
function randomVerse2(filter) {
  for (let tries = 0; tries < 200; tries++) {
    let k = Math.floor(Math.random() * TOTAL);
    const b = BOOKS.find((x) => k >= x.offset && k < x.offset + x.n);
    k -= b.offset;
    const r = { bi: b.i, ci: b.ci[k], vi: b.vi[k] };
    const text = verseText(r.bi, r.ci, r.vi);
    if (!b.deutero && text !== '—' && (!filter || filter(text, r))) return { ...r, text };
  }
  return null;
}
const plain = (s) => s.replace(/\n/g, ' ');
function quizQuestion() {
  const mode = settings.quizMode || 'book';
  const L = T();
  if (mode === 'finish') {
    const q = randomVerse2((t) => { const n = plain(t).split(' ').length; return n >= 10 && n <= 40; });
    const words = plain(q.text).split(' ');
    const cut = Math.max(4, Math.round(words.length * 0.45));
    const ending = (t) => { const w = plain(t).split(' '); return w.slice(Math.max(3, Math.round(w.length * 0.45))).join(' '); };
    const opts = [{ label: words.slice(cut).join(' '), ok: true }];
    while (opts.length < 4) {
      const o = randomVerse2((t) => { const n = plain(t).split(' ').length; return n >= 8 && n <= 40; });
      const e = ending(o.text);
      if (!opts.some((x) => x.label === e)) opts.push({ label: e, ok: false });
    }
    opts.sort(() => Math.random() - 0.5);
    return { ...q, mode, prompt: L.quizFinishQ, shown: `${words.slice(0, cut).join(' ')} …`, opts };
  }
  if (mode === 'ref') {
    const q = randomVerse2((t) => t.length >= 40 && t.length <= 260);
    const b = BOOKS[q.bi];
    const opts = [{ label: refOf(q.bi, q.ci, q.vi), ok: true }];
    for (let tries = 0; opts.length < 4 && tries < 100; tries++) {
      const ci = b.chapters.length > 1 ? Math.floor(Math.random() * b.chapters.length) : q.ci;
      const vi = Math.floor(Math.random() * b.chapters[ci].length);
      const label = refOf(q.bi, ci, vi);
      if (!opts.some((x) => x.label === label)) opts.push({ label, ok: false });
    }
    opts.sort(() => Math.random() - 0.5);
    return { ...q, mode, prompt: L.quizRefQ, shown: q.text, opts };
  }
  const q = randomVerse2((t) => t.length >= 40 && t.length <= 240);
  const pool = BOOKS.filter((b) => b.i !== q.bi && !b.deutero).map((b) => b.i);
  const opts = [{ label: BOOKS[q.bi].name, ok: true, bi: q.bi }];
  while (opts.length < 4 && pool.length) { const bi = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; opts.push({ label: BOOKS[bi].name, ok: false, bi }); }
  opts.sort(() => Math.random() - 0.5);
  return { ...q, mode, prompt: L.quizQ, shown: q.text, opts };
}
function openQuiz() {
  stopReading();
  closeDetail();
  quiz.open = true;
  quiz.streak = 0;
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
function setQuizMode(m) {
  settings.quizMode = m;
  saveSettings();
  quiz.streak = 0;
  nextQuestion();
}
function answerQuiz(i) {
  if (quiz.answer >= 0) return;
  quiz.answer = i;
  quiz.total++;
  const ok = quiz.q.opts[i].ok;
  if (ok) { quiz.right++; quiz.streak = (quiz.streak || 0) + 1; } else quiz.streak = 0;
  const best = store.get('quizBest', {});
  const m = quiz.q.mode;
  if ((quiz.streak || 0) > (best[m] || 0)) { best[m] = quiz.streak; store.set('quizBest', best); }
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
function quizRead() { stopReading(); speak(quiz.q.shown.replace(' …', ''), () => {}); }
function quizFeedback() {
  const L = T(), q = quiz.q;
  const ok = q.opts[quiz.answer].ok;
  const where = refOf(q.bi, q.ci, q.vi);
  if (ok) return `${L.quizRight} ${where}`;
  return q.mode === 'book' ? `${L.quizWrong(BOOKS[q.bi].name)} ${where}` : `${L.quizWrong2} ${where}`;
}

function renderQuiz() {
  if (!quiz.open) return;
  if (renderer.xr.isPresenting) { buildVrQuiz(); return; }
  const L = T(), q = quiz.q, box = ui.quiz;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button';
  close.setAttribute('aria-label', L.close);
  close.addEventListener('click', closeQuiz);
  const best = store.get('quizBest', {})[q.mode] || 0;
  box.append(close, el2('div', 'ref', `${L.quizTitle} · ${L.quizScore(quiz.right, quiz.total)}`));
  const modes = el2('div', 'modes');
  for (const m of QUIZ_MODES) {
    const b = el2('button', 'btn mode' + (m === q.mode ? ' on' : ''), L.quizModes[m]);
    b.type = 'button';
    b.setAttribute('aria-pressed', m === q.mode ? 'true' : 'false');
    b.addEventListener('click', () => setQuizMode(m));
    modes.append(b);
  }
  box.append(modes, el2('p', 'muted', `${q.prompt} · ${L.quizStreak(quiz.streak || 0, best)}`), el2('p', 'text', q.shown));
  const grid = el2('div', 'opts' + (q.mode === 'finish' ? ' wide' : ''));
  q.opts.forEach((o, i) => {
    const btn = el2('button', 'btn opt', o.label);
    btn.type = 'button';
    if (quiz.answer >= 0) {
      btn.disabled = true;
      if (o.ok) btn.classList.add('right');
      else if (i === quiz.answer) btn.classList.add('wrong');
    }
    btn.addEventListener('click', () => answerQuiz(i));
    grid.append(btn);
  });
  box.append(grid);
  if (quiz.answer >= 0) box.append(el2('p', q.opts[quiz.answer].ok ? 'fb right' : 'fb wrong', quizFeedback()));
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
  const lines = clampLines(wrap(g, q.shown, PX - pad * 2), 6);
  const fb = quiz.answer >= 0 ? quizFeedback() : q.prompt;
  c.width = PX;
  c.height = pad * 2 + 52 + lines.length * 54 + 70;
  g.fillStyle = 'rgba(8, 11, 24, 0.94)';
  g.beginPath(); g.roundRect(2, 2, PX - 4, c.height - 4, 24); g.fill();
  g.strokeStyle = 'rgba(243,195,91,0.6)'; g.lineWidth = 3; g.stroke();
  g.textBaseline = 'top';
  let y = pad;
  g.font = `600 34px ${FONT_UI}`; g.fillStyle = '#f3c35b';
  g.fillText(`${L.quizModes[q.mode].toUpperCase()} · ${L.quizScore(quiz.right, quiz.total)} · ${L.quizStreak(quiz.streak || 0, (store.get('quizBest', {})[q.mode] || 0))}`, pad, y); y += 52;
  g.font = `40px ${FONT_CARD}`; g.fillStyle = '#eef1fa';
  for (const ln of lines) { g.fillText(ln, pad, y); y += 54; }
  g.font = `600 34px ${FONT_UI}`; g.fillStyle = quiz.answer < 0 ? '#9aa2bf' : q.opts[quiz.answer].ok ? '#7fe0a0' : '#ff8a80';
  g.fillText(fb, pad, y + 14);
  const ph = (W * c.height) / PX;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W, ph), new THREE.MeshBasicMaterial({ map: makeTexture(c), transparent: true, depthTest: false }));
  panel.renderOrder = 34;
  panel.position.set(0, ph / 2, 0);
  grp.add(panel);
  const buttons = [];
  let by = -0.02;
  q.opts.forEach((o, i) => {
    const mark = quiz.answer >= 0 ? (o.ok ? '✓ ' : i === quiz.answer ? '✗ ' : '') : '';
    const btn = makeRowButton(mark + o.label, '', () => answerQuiz(i), W);
    const bh = btn.geometry.parameters.height;
    btn.position.set(0, by - bh / 2, 0);
    by -= bh + 0.012;
    grp.add(btn); buttons.push(btn);
  });
  const nextMode = QUIZ_MODES[(QUIZ_MODES.indexOf(q.mode) + 1) % QUIZ_MODES.length];
  const acts = quiz.answer >= 0
    ? [[L.quizRead, quizRead], [L.quizShow, quizShow], [L.quizNext, nextQuestion], [L.xrClose, closeQuiz]]
    : [[L.quizRead, quizRead], [`⇄ ${L.quizModes[nextMode]}`, () => setQuizMode(nextMode)], [L.xrClose, closeQuiz]];
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
  const card = drawCard(BOOKS[bi], ci, vi, vi === state.focus, mesh.userData.pos);
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
      btn.append(el2('span', 'r', r.label || refOf(r.bi, r.ci, r.vi)), el2('span', 't', r.sub != null ? r.sub : r.vi != null ? verseText(r.bi, r.ci, r.vi) : ''));
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
  if (kind === 'lesson') setGalaxyLayer('lesson', null);
  if (kind === 'proph') setGalaxyLayer('proph', null);
  if (kind === 'chlinks') setGalaxyLayer('chapterLinks', null);
}
function showBookmarks() {
  const items = bmList().map(parseKey).filter((r) => r && r.vi != null);
  openList('bm', T().bookmarks, items.length ? '' : T().noBm, items);
}

/* Поиск по словам во всём тексте; найденные стихи подсвечиваются в галактике. */
let searchIndex2 = null;
const normText = (s) => s.replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е');
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
  const pt = state.mode === 'galaxy' && BOOKS.length ? planToday() : null;
  const todo = pt && pt.today.find((c) => !isRead(c.bi, c.ci));
  if (todo) {
    ui.continueBtn.hidden = false;
    ui.continueBtn.textContent = T().planChip(`${BOOKS[todo.bi].short} ${todo.ci + 1}`);
    ui.continueBtn.onclick = () => go('chapter', { bi: todo.bi, ci: todo.ci });
    return;
  }
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
  // Голос: список голосов устройства, лучшие сверху
  const vkey = (settings.voices || {})[LANG] || '';
  const setV = (name) => { settings.voices = { ...(settings.voices || {}), [LANG]: name }; saveSettings(); };
  let vlist = [];
  if (window.AndroidTTS && window.AndroidTTS.voices) {
    vlist = androidVoices().map((v) => ({ value: v.name, label: `${v.label || v.name}${v.net ? ` · ${L.voiceNet}` : ''}${v.best ? ` · ${L.voiceBest}` : ''}` }));
  } else if (hasTts && !window.AndroidTTS) {
    vlist = tts.voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(LANG)).map((v) => ({ value: v.name, label: v.name }));
  }
  if (vlist.length) {
    const sel = el2('select'); sel.id = 'setVoice';
    sel.append(Object.assign(document.createElement('option'), { value: '', textContent: L.voiceAuto }));
    for (const v of vlist) sel.append(Object.assign(document.createElement('option'), { value: v.value, textContent: v.label }));
    sel.value = vlist.some((v) => v.value === vkey) ? vkey : (settings.voice && !window.AndroidTTS && vlist.some((v) => v.value === settings.voice) ? settings.voice : '');
    sel.addEventListener('change', () => setV(sel.value));
    row(L.voice, sel);
  }
  const test = el2('button', 'btn', L.voiceTest); test.type = 'button'; test.id = 'voiceTest';
  test.addEventListener('click', () => { stopReading(); const v0 = BOOKS[0] && BOOKS[0].chapters[0] && BOOKS[0].chapters[0][0]; speak(v0 || L.welcomeBtn, () => {}); });
  const extra = [test];
  if (window.AndroidTTS && window.AndroidTTS.installVoices) {
    const inst = el2('button', 'btn', L.installVoices); inst.type = 'button';
    inst.addEventListener('click', () => window.AndroidTTS.installVoices());
    extra.push(inst);
  }
  row('', ...extra);
  const pitch = el2('input'); pitch.type = 'range'; pitch.min = '0.8'; pitch.max = '1.2'; pitch.step = '0.05'; pitch.value = String(settings.pitch || 1); pitch.id = 'setPitch';
  const pv = el2('span', 'set-val', `${(settings.pitch || 1).toFixed(2)}`);
  pitch.addEventListener('input', () => { settings.pitch = +pitch.value; pv.textContent = settings.pitch.toFixed(2); saveSettings(); });
  row(L.pitch, pitch, pv);
  const an = el2('input'); an.type = 'checkbox'; an.id = 'setAutoNext'; an.checked = settings.autoNext !== false;
  an.addEventListener('change', () => { settings.autoNext = an.checked; saveSettings(); });
  row(L.autoNext, an);
  box.append(el2('p', 'muted small', L.bgNote));
  if (window.AndroidTTS && window.AndroidTTS.allowBackground) {
    const ok = window.AndroidTTS.backgroundAllowed ? window.AndroidTTS.backgroundAllowed() : false;
    const bg = el2('button', ok ? 'btn' : 'btn primary', ok ? `✓ ${L.bgAllowed}` : L.allowBg); bg.type = 'button'; bg.id = 'allowBg';
    bg.addEventListener('click', () => window.AndroidTTS.allowBackground());
    row('', bg);
  }
  // Музыка
  const mv = el2('input'); mv.type = 'range'; mv.min = '0'; mv.max = '1'; mv.step = '0.05'; mv.value = String(settings.musicVol ?? 0.5); mv.id = 'setMusic';
  mv.addEventListener('input', () => { settings.musicVol = +mv.value; saveSettings(); });
  row(L.musicVol, mv);
  // Свечение звёзд
  const gsel = el2('select'); gsel.id = 'setGfx';
  for (const [v, t] of [['auto', L.gfxAuto], ['fast', L.gfxFast], ['best', L.gfxBest]]) gsel.append(Object.assign(document.createElement('option'), { value: v, textContent: t }));
  gsel.value = gfxMode();
  row(L.gfx, gsel);
  const bl = el2('input'); bl.type = 'checkbox'; bl.id = 'setBloom'; bl.checked = bloomOn();
  bl.addEventListener('change', () => { settings.bloom = bl.checked; perf.noBloom = false; saveSettings(); });
  gsel.addEventListener('change', () => { settings.gfx = gsel.value; saveSettings(); applyGfx(); bl.checked = bloomOn(); });
  row(L.bloom, bl);
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


/* ---------- Заметки к стихам (только на этом устройстве) ---------- */

function notesAll() { return store.get('notes', {}); }
function noteOf(bi, ci, vi) { return notesAll()[refKey(bi, ci, vi)] || ''; }
function setNote(bi, ci, vi, text) {
  const all = notesAll();
  const k = refKey(bi, ci, vi);
  const t = text.trim();
  if (t) all[k] = t; else delete all[k];
  store.set('notes', all);
  refreshNoteStars();
  refreshCard(bi, ci, vi);
}
function refreshNoteStars() {
  if (!galaxy.group) return;
  const list = Object.keys(notesAll()).map(parseKey).filter((r) => r && r.vi != null);
  setGalaxyLayer('notePts', pointsAt(list, '#8ff0c4', 0.95));
}
function showNotes() {
  const all = notesAll();
  const items = Object.keys(all).map((k) => { const r = parseKey(k); return r && r.vi != null ? { ...r, sub: all[k] } : null; }).filter(Boolean);
  openList('notes', T().notes, items.length ? '' : T().noNotes, items);
}

/* ---------- Места и карта ---------- */

// [id, широта, долгота, русское название, румынское, русские основы для поиска в тексте, румынские основы]
const PLACES = [
  ['jerusalem', 31.778, 35.235, 'Иерусалим', 'Ierusalim', ['Иерусалим'], ['Ierusalim']],
  ['bethlehem', 31.705, 35.2, 'Вифлеем', 'Betleem', ['Вифлеем'], ['Betleem']],
  ['nazareth', 32.7, 35.3, 'Назарет', 'Nazaret', ['Назарет'], ['Nazaret']],
  ['capernaum', 32.88, 35.575, 'Капернаум', 'Capernaum', ['Капернаум'], ['Capernaum']],
  ['bethany', 31.771, 35.262, 'Вифания', 'Betania', ['Вифани'], ['Betania']],
  ['jericho', 31.871, 35.444, 'Иерихон', 'Ierihon', ['Иерихон'], ['Ierihon']],
  ['hebron', 31.532, 35.095, 'Хеврон', 'Hebron', ['Хеврон'], ['Hebron']],
  ['beersheba', 31.245, 34.791, 'Беэр-Шеба', 'Beer-Șeba', ['Беэр-Шеб', 'Беэр-Шев', 'Вирсави'], ['Beer-Șeba', 'Beer-Seba']],
  ['bethel', 31.93, 35.22, 'Вефиль', 'Betel', ['Вефил'], ['Betel']],
  ['shiloh', 32.055, 35.29, 'Шило', 'Șilo', ['Шило', 'Силом'], ['Șilo', 'Silo']],
  ['samaria', 32.276, 35.197, 'Самария', 'Samaria', ['Самари'], ['Samari']],
  ['galilee', 32.85, 35.42, 'Галилея', 'Galileea', ['Галиле'], ['Galileea', 'Galileii']],
  ['jordan', 32.2, 35.57, 'Иордан', 'Iordan', ['Иордан'], ['Iordan']],
  ['carmel', 32.73, 35.05, 'Кармил', 'Carmel', ['Кармил'], ['Carmel']],
  ['megiddo', 32.585, 35.185, 'Мегиддо', 'Meghido', ['Мегиддо', 'Армагеддон'], ['Meghido', 'Armaghedon']],
  ['caesarea', 32.5, 34.89, 'Кесария', 'Cezareea', ['Кесари'], ['Cezareea']],
  ['joppa', 32.05, 34.752, 'Иоппия', 'Iope', ['Иоппи', 'Яффо'], ['Iope']],
  ['gaza', 31.5, 34.466, 'Газа', 'Gaza', ['Газа', 'Газе', 'Газу', 'Газы'], ['Gaza']],
  ['tyre', 33.27, 35.2, 'Тир', 'Tir', ['Тир(?:а|е|у|ом)?(?![а-яё])'], ['Tir(?:ul)?(?![a-zăâîșț])']],
  ['sidon', 33.56, 35.37, 'Сидон', 'Sidon', ['Сидон'], ['Sidon']],
  ['damascus', 33.513, 36.292, 'Дамаск', 'Damasc', ['Дамаск'], ['Damasc']],
  ['moab', 31.4, 35.85, 'Моав', 'Moab', ['Моав'], ['Moab']],
  ['edom', 30.6, 35.5, 'Эдом', 'Edom', ['Эдом', 'Едом'], ['Edom']],
  ['nebo', 31.768, 35.725, 'гора Нево', 'muntele Nebo', ['Нево'], ['Nebo']],
  ['sinai', 28.54, 33.975, 'Синай', 'Sinai', ['Синай', 'Хорив'], ['Sinai', 'Horeb']],
  ['kadesh', 30.69, 34.49, 'Кадес', 'Cades', ['Кадес'], ['Cades']],
  ['egypt', 27.5, 30.8, 'Египет', 'Egipt', ['Египт', 'Египет'], ['Egipt']],
  ['rameses', 30.8, 31.83, 'Раамсес', 'Ramses', ['Раамсес', 'Рамсес'], ['Ramses', 'Rameses']],
  ['babylon', 32.536, 44.42, 'Вавилон', 'Babilon', ['Вавилон'], ['Babilon']],
  ['nineveh', 36.36, 43.15, 'Ниневия', 'Ninive', ['Ниневи'], ['Ninive']],
  ['ur', 30.962, 46.103, 'Ур', 'Ur', ['Ура? халде', 'Ура? Халде'], ['Ur din Caldeea', 'Urul caldeenilor']],
  ['haran', 36.865, 39.031, 'Харран', 'Haran', ['Харран'], ['Haran']],
  ['susa', 32.19, 48.258, 'Сузы', 'Susa', ['Суз(?:ы|ах|ам)', 'Шушан'], ['Susa', 'Șușan']],
  ['antioch', 36.202, 36.16, 'Антиохия', 'Antiohia', ['Антиохи'], ['Antiohia']],
  ['tarsus', 36.918, 34.892, 'Тарс', 'Tars', ['Тарс'], ['Tars']],
  ['cyprus', 35.0, 33.2, 'Кипр', 'Cipru', ['Кипр'], ['Cipru']],
  ['paphos', 34.757, 32.414, 'Паф', 'Pafos', ['Паф(?:а|е|ос)?(?![а-яё])'], ['Pafos']],
  ['iconium', 37.871, 32.485, 'Иконий', 'Iconia', ['Икони'], ['Iconi']],
  ['lystra', 37.578, 32.454, 'Листра', 'Listra', ['Листр'], ['Listra']],
  ['derbe', 37.35, 33.36, 'Дервия', 'Derbe', ['Дерви'], ['Derbe']],
  ['troas', 39.75, 26.16, 'Троада', 'Troa', ['Троад'], ['Troa']],
  ['philippi', 41.013, 24.286, 'Филиппы', 'Filipi', ['Филипп(?:ы|ах|ам)(?![а-яё])', 'Филиппийц'], ['Filipi(?![a-z])']],
  ['thessalonica', 40.64, 22.944, 'Фессалоника', 'Tesalonic', ['Фессалоник'], ['Tesalonic']],
  ['berea', 40.523, 22.203, 'Верия', 'Bereea', ['Вери(?:я|и|ю)'], ['Bereea']],
  ['athens', 37.984, 23.728, 'Афины', 'Atena', ['Афин'], ['Atena']],
  ['corinth', 37.906, 22.88, 'Коринф', 'Corint', ['Коринф'], ['Corint']],
  ['ephesus', 37.94, 27.341, 'Эфес', 'Efes', ['Эфес', 'Ефес'], ['Efes']],
  ['miletus', 37.53, 27.278, 'Милет', 'Milet', ['Милет'], ['Milet']],
  ['patmos', 37.31, 26.55, 'Патмос', 'Patmos', ['Патмос'], ['Patmos']],
  ['crete', 35.2, 24.9, 'Крит', 'Creta', ['Крит'], ['Creta']],
  ['malta', 35.9, 14.42, 'Мальта', 'Malta', ['Мальт', 'Мелит'], ['Malta']],
  ['shechem', 32.213, 35.282, 'Шехем', 'Sihem', ['Шехем', 'Сихем'], ['Sihem']],
  ['dothan', 32.42, 35.24, 'Дотан', 'Dotan', ['Дотан', 'Дофан'], ['Dotan']],
  ['ai', 31.917, 35.262, 'Гай', 'Ai', ['Гай(?:а|е|ем|ю)?(?![а-яё])'], ['Ai(?=[,.;:!?)]| și | din | de | a )']],
  ['gibeon', 31.847, 35.183, 'Гаваон', 'Gabaon', ['Гаваон'], ['Gabaon']],
  ['hazor', 33.017, 35.568, 'Хацор', 'Hațor', ['Хацор', 'Асор'], ['Hațor']],
  ['gath', 31.7, 34.848, 'Гат', 'Gat', ['Гат(?:а|е|у|ом)?(?![а-яё-])'], ['Gat(?![a-zăâîșț-])']],
  ['adullam', 31.65, 34.96, 'Адуллам', 'Adulam', ['Адуллам'], ['Adulam']],
  ['engedi', 31.461, 35.389, 'Эн-Гади', 'En-Ghedi', ['Эн-Гади', 'Эн-Геди'], ['En-Ghedi']],
  ['ziklag', 31.38, 34.78, 'Циклаг', 'Țiclag', ['Циклаг', 'Секелаг'], ['Țiclag']],
  ['jezreel', 32.557, 35.33, 'Изреел', 'Izreel', ['Изреел', 'Изрееле', 'Изреэл'], ['Izreel']],
  ['zarephath', 33.46, 35.3, 'Сарепта', 'Sarepta', ['Сарепт', 'Царефат'], ['Sarepta', 'Țarefat']],
  ['cana', 32.747, 35.339, 'Кана', 'Cana', ['Кан(?:а|е|у|ы)(?![а-яё])'], ['Cana(?![a-zăâîșț])']],
  ['bethsaida', 32.91, 35.63, 'Вифсаида', 'Betsaida', ['Вифсаид'], ['Betsaida']],
  ['caesarea_philippi', 33.248, 35.694, 'Кесария Филиппова', 'Cezareea lui Filip', ['Кесари[а-яё]* Филиппов'], ['Cezareea lui Filip']],
  ['azotus', 31.8, 34.65, 'Ашдод', 'Asdod', ['Ашдод', 'Азот'], ['Asdod', 'Așdod']],
  ['rome', 41.9, 12.5, 'Рим', 'Roma', ['Рим(?!лян)(?:а|е|у|ом)?(?![а-яё])'], ['Roma(?!ni)']],
];
const PLACE = Object.fromEntries(PLACES.map((p) => [p[0], { id: p[0], lat: p[1], lon: p[2], ru: p[3], ro: p[4], stems: { ru: p[5], ro: p[6] } }]));
const placeName = (id) => PLACE[id][LANG] || PLACE[id].ru;
const placeRe = {};
function placeRegex(id) {
  const k = id + LANG;
  if (!placeRe[k]) {
    const st = PLACE[id].stems[LANG] || PLACE[id].stems.ru;
    placeRe[k] = new RegExp(`(?:^|[^\\p{L}])(?:${st.join('|')})`, 'u');
  }
  return placeRe[k];
}
// В тексте «Нового мира» внутри имён стоят знаки ударения (Сихе́м) — при поиске они не учитываются.
const noAcc = (t) => String(t).replace(/\u0301/g, '');
function placesIn(text) { const t = noAcc(text); return Object.keys(PLACE).filter((id) => placeRegex(id).test(t)); }
const placeVersesCache = {};
function versesAbout(id) {
  const k = id + LANG + BOOKS.length;
  if (!placeVersesCache[k]) {
    const re = placeRegex(id);
    const res = [];
    BOOKS.forEach((b) => b.chapters.forEach((c, ci) => c.forEach((v, vi) => { if (re.test(noAcc(v))) res.push({ bi: b.i, ci, vi }); })));
    placeVersesCache[k] = res;
  }
  return placeVersesCache[k];
}

// Маршруты: точки — места или [широта, долгота] промежуточных остановок. Пути показаны приблизительно.
// era: группа в списке; d — коротко о пути (RU/RO).
const ROUTES = [
  { id: 'abraham', era: 'patriarchs', ru: 'Путь Авраама', ro: 'Drumul lui Avraam', pts: ['ur', 'haran', 'shechem', 'bethel', 'egypt', 'bethel', 'hebron'], ref: 'Gen.12.1',
    dru: 'Из Ура халдейского через Харран в Ханаан, в голод — в Египет и обратно; Авраам поселяется у Хеврона.', dro: 'Din Urul caldeenilor, prin Haran, în Canaan; în timpul foametei în Egipt și înapoi; Avraam se stabilește lângă Hebron.' },
  { id: 'jacob', era: 'patriarchs', ru: 'Иаков: в Харран и обратно', ro: 'Iacob: la Haran și înapoi', pts: ['beersheba', 'bethel', 'damascus', 'haran', 'damascus', [32.18, 35.7], 'shechem', 'bethel', 'bethlehem', 'hebron'], ref: 'Gen.28.10',
    dru: 'Иаков уходит от Исава в Харран, видит лестницу в Вефиле, 20 лет живёт у Лавана и возвращается с семьёй.', dro: 'Iacob fuge de Esau la Haran, vede scara la Betel, trăiește 20 de ani la Laban și se întoarce cu familia.' },
  { id: 'joseph', era: 'patriarchs', ru: 'Иосиф продан в Египет', ro: 'Iosif vândut în Egipt', pts: ['hebron', 'shechem', 'dothan', 'gaza', [31.05, 32.6], 'egypt'], ref: 'Gen.37.14',
    dru: 'Иосиф ищет братьев у Шехема, находит их в Дотане; они продают его купцам, идущим в Египет.', dro: 'Iosif își caută frații lângă Sihem, îi găsește la Dotan; ei îl vând unor negustori care merg în Egipt.' },
  { id: 'jacobEgypt', era: 'patriarchs', ru: 'Иаков переселяется в Египет', ro: 'Iacob se mută în Egipt', pts: ['hebron', 'beersheba', [30.9, 33.2], [30.75, 32.3], 'rameses'], ref: 'Gen.46.1',
    dru: 'Иаков с семьёй (70 душ) идёт к Иосифу и поселяется в земле Гошен.', dro: 'Iacob cu familia (70 de suflete) merge la Iosif și se stabilește în ținutul Gosen.' },
  { id: 'exodus', era: 'exodus', ru: 'Исход из Египта', ro: 'Exodul din Egipt', pts: ['rameses', [30.0, 32.55], [29.2, 33.0], 'sinai', 'kadesh', [30.4, 35.6], 'nebo', 'jericho'], ref: 'Exod.12.41',
    dru: 'Израиль выходит из Египта, переходит Красное море, получает Закон у Синая, 40 лет в пустыне и входит в Ханаан у Иерихона.', dro: 'Israel iese din Egipt, trece Marea Roșie, primește Legea la Sinai, 40 de ani în pustiu și intră în Canaan la Ierihon.' },
  { id: 'joshua', era: 'exodus', ru: 'Иисус Навин: завоевание Ханаана', ro: 'Iosua: cucerirea Canaanului', pts: [[31.86, 35.5], 'jericho', 'ai', 'gibeon', [31.56, 34.85], 'hebron', [31.86, 35.5], 'hazor'], ref: 'Josh.6.2',
    dru: 'От Гилгала — Иерихон, Гай и Гаваон, поход на юг до Хеврона, затем на север к Хацору.', dro: 'De la Ghilgal — Ierihon, Ai și Gabaon, campania spre sud până la Hebron, apoi spre nord la Hațor.' },
  { id: 'ruth', era: 'judges', ru: 'Руфь и Ноеминь', ro: 'Rut și Naomi', pts: ['bethlehem', [31.78, 35.55], 'moab', [31.78, 35.55], 'bethlehem'], ref: 'Ruth.1.1',
    dru: 'Семья Ноемини уходит в Моав от голода; овдовев, Ноеминь возвращается в Вифлеем вместе с верной Руфью.', dro: 'Familia Naomii pleacă în Moab din cauza foametei; rămasă văduvă, Naomi se întoarce la Betleem cu loiala Rut.' },
  { id: 'david', era: 'kings', ru: 'Давид скрывается от Саула', ro: 'David fuge de Saul', pts: [[31.82, 35.23], 'gath', 'adullam', [31.42, 35.13], 'engedi', [31.42, 35.13], 'gath', 'ziklag'], ref: '1Sam.21.10',
    dru: 'Давид бежит к Ахишу в Гат, прячется в пещере Адуллам, в пустыне Зиф и у Эн-Гади, затем живёт в Циклаге.', dro: 'David fuge la Achiș în Gat, se ascunde în peștera Adulam, în pustiul Zif și la En-Ghedi, apoi locuiește la Țiclag.' },
  { id: 'elijah', era: 'kings', ru: 'Пророк Илия', ro: 'Profetul Ilie', pts: ['zarephath', 'carmel', 'jezreel', 'beersheba', 'sinai'], ref: '1Kgs.17.9',
    dru: 'Илия у вдовы в Сарепте, испытание на Кармиле, бегство от Иезавели через Беэр-Шебу к горе Хорив.', dro: 'Ilie la văduva din Sarepta, încercarea de pe Carmel, fuga de Izabela prin Beer-Șeba la muntele Horeb.' },
  { id: 'jonah', era: 'kings', ru: 'Пророк Иона', ro: 'Profetul Iona', pts: ['joppa', [33.3, 31.6], [32.6, 34.6], 'damascus', [35.9, 39.6], 'nineveh'], ref: 'Jonah.1.3',
    dru: 'Иона садится на корабль в Иоппии, чтобы бежать в Таршиш; после бури и большой рыбы он идёт в Ниневию.', dro: 'Iona se îmbarcă la Iope ca să fugă la Tarsis; după furtună și peștele cel mare, merge la Ninive.' },
  { id: 'exile', era: 'exile', ru: 'Вавилонский плен', ro: 'Exilul în Babilon', pts: ['jerusalem', 'damascus', [34.45, 36.55], [36.2, 37.15], [36.83, 38.01], [35.0, 40.5], 'babylon'], ref: '2Kgs.25.11',
    dru: 'В 607 году до н. э. Иерусалим разрушен, жителей уводят через Ривлу и вдоль Евфрата в Вавилон.', dro: 'În 607 î.e.n. Ierusalimul este distrus, iar locuitorii sunt duși prin Ribla și de-a lungul Eufratului în Babilon.' },
  { id: 'return', era: 'exile', ru: 'Возвращение из плена', ro: 'Întoarcerea din exil', pts: ['babylon', [35.0, 40.5], [36.83, 38.01], [36.2, 37.15], 'damascus', 'jerusalem'], ref: 'Ezra.1.3',
    dru: 'По указу Кира иудеи возвращаются с Зоровавелем, позже — с Ездрой, чтобы восстановить храм.', dro: 'Prin decretul lui Cirus, iudeii se întorc cu Zorobabel, mai târziu cu Ezra, ca să reconstruiască templul.' },
  { id: 'nehemiah', era: 'exile', ru: 'Неемия: из Суз в Иерусалим', ro: 'Neemia: de la Susa la Ierusalim', pts: ['susa', 'babylon', [35.0, 40.5], [36.83, 38.01], [36.2, 37.15], 'damascus', 'jerusalem'], ref: 'Neh.2.11',
    dru: 'Виночерпий царя Артаксеркса приходит восстановить стены Иерусалима.', dro: 'Paharnicul regelui Artaxerxe vine să reconstruiască zidurile Ierusalimului.' },
  { id: 'nativity', era: 'jesus', ru: 'Рождение Иисуса и бегство в Египет', ro: 'Nașterea lui Isus și fuga în Egipt', pts: ['nazareth', 'samaria', 'jerusalem', 'bethlehem', 'gaza', [30.9, 32.3], [30.6, 31.5], [30.9, 32.3], 'gaza', 'nazareth'], ref: 'Matt.2.13',
    dru: 'Иосиф и Мария идут из Назарета в Вифлеем, бегут от Ирода в Египет и после его смерти возвращаются в Назарет.', dro: 'Iosif și Maria merg din Nazaret la Betleem, fug de Irod în Egipt și, după moartea lui, se întorc la Nazaret.' },
  { id: 'galilee', era: 'jesus', ru: 'Иисус в Галилее', ro: 'Isus în Galileea', pts: ['nazareth', 'cana', 'capernaum', 'bethsaida', 'caesarea_philippi', 'capernaum'], ref: 'Matt.4.13',
    dru: 'Из Назарета в Кану, затем Капернаум становится его городом; Вифсаида и Кесария Филиппова.', dro: 'Din Nazaret la Cana, apoi Capernaum devine orașul lui; Betsaida și Cezareea lui Filip.' },
  { id: 'samaritan', era: 'jesus', ru: 'Через Самарию в Галилею', ro: 'Prin Samaria în Galileea', pts: ['jerusalem', 'bethel', 'shechem', 'samaria', 'cana'], ref: 'John.4.3',
    dru: 'По пути в Галилею Иисус говорит с самаритянкой у колодца Иакова близ Сихаря.', dro: 'În drum spre Galileea, Isus vorbește cu samariteanca la fântâna lui Iacob, lângă Sihar.' },
  { id: 'lastJourney', era: 'jesus', ru: 'Последний путь в Иерусалим', ro: 'Ultimul drum spre Ierusalim', pts: ['capernaum', [32.6, 35.57], 'jordan', 'jericho', 'bethany', 'jerusalem'], ref: 'Luke.19.1',
    dru: 'Вдоль Иордана, через Иерихон (Закхей) и Вифанию (Лазарь) — в Иерусалим на последнюю Пасху.', dro: 'De-a lungul Iordanului, prin Ierihon (Zacheu) și Betania (Lazăr) — la Ierusalim pentru ultimul Paște.' },
  { id: 'philip', era: 'apostles', ru: 'Евангелист Филипп', ro: 'Evanghelizatorul Filip', pts: ['jerusalem', 'samaria', 'jerusalem', [31.6, 34.85], 'azotus', 'joppa', 'caesarea'], ref: 'Acts.8.5',
    dru: 'Филипп проповедует в Самарии, крестит эфиопского вельможу на дороге в Газу, из Ашдода доходит до Кесарии.', dro: 'Filip predică în Samaria, îl botează pe eunucul etiopian pe drumul spre Gaza, iar din Asdod ajunge la Cezareea.' },
  { id: 'saul', era: 'apostles', ru: 'Савл идёт в Дамаск', ro: 'Saul merge la Damasc', pts: ['jerusalem', 'samaria', [32.7, 35.62], 'damascus'], ref: 'Acts.9.3',
    dru: 'По дороге в Дамаск Савлу является Иисус, и гонитель становится апостолом.', dro: 'Pe drumul spre Damasc, lui Saul i se arată Isus, iar persecutorul devine apostol.' },
  { id: 'peter', era: 'apostles', ru: 'Пётр: Иоппия — Кесария', ro: 'Petru: Iope — Cezareea', pts: ['jerusalem', [31.95, 34.9], 'joppa', 'caesarea'], ref: 'Acts.10.23',
    dru: 'Через Лидду в Иоппию, где Пётр видит видение, затем в Кесарию к Корнилию — первому необрезанному христианину.', dro: 'Prin Lida la Iope, unde Petru are viziunea, apoi la Cezareea la Corneliu — primul creștin netăiat împrejur.' },
  { id: 'paul1', era: 'apostles', ru: 'Павел: 1-е путешествие', ro: 'Pavel: prima călătorie', pts: ['antioch', [36.12, 35.93], 'paphos', [36.96, 30.85], [38.3, 31.19], 'iconium', 'lystra', 'derbe', 'lystra', 'iconium', [36.96, 30.85], 'antioch'], ref: 'Acts.13.4',
    dru: 'С Варнавой: Кипр, Антиохия Писидийская, Иконий, Листра и Дервия.', dro: 'Cu Barnaba: Cipru, Antiohia Pisidiei, Iconia, Listra și Derbe.' },
  { id: 'paul2', era: 'apostles', ru: 'Павел: 2-е путешествие', ro: 'Pavel: a doua călătorie', pts: ['antioch', 'tarsus', 'derbe', 'lystra', 'iconium', 'troas', 'philippi', 'thessalonica', 'berea', 'athens', 'corinth', 'ephesus', 'caesarea', 'jerusalem', 'antioch'], ref: 'Acts.15.40',
    dru: 'С Силой: из Троады весть впервые приходит в Европу — Филиппы, Фессалоника, Верия, Афины, Коринф.', dro: 'Cu Sila: din Troa vestea ajunge pentru prima dată în Europa — Filipi, Tesalonic, Bereea, Atena, Corint.' },
  { id: 'paul3', era: 'apostles', ru: 'Павел: 3-е путешествие', ro: 'Pavel: a treia călătorie', pts: ['antioch', [39.0, 32.5], 'ephesus', 'troas', 'philippi', 'thessalonica', 'corinth', 'philippi', 'troas', 'miletus', [36.43, 28.22], 'tyre', 'caesarea', 'jerusalem'], ref: 'Acts.18.23',
    dru: 'Около трёх лет в Эфесе, снова Македония и Греция, прощание со старейшинами в Милете.', dro: 'Aproape trei ani la Efes, din nou Macedonia și Grecia, despărțirea de bătrâni la Milet.' },
  { id: 'rome', era: 'apostles', ru: 'Павел плывёт в Рим', ro: 'Pavel navighează spre Roma', pts: ['caesarea', 'sidon', [36.26, 29.98], [34.93, 24.8], 'malta', [37.07, 15.29], [40.82, 14.12], 'rome'], ref: 'Acts.27.1',
    dru: 'Узником — в Рим: буря у Крита, кораблекрушение у Мальты, затем Путеолы и Рим.', dro: 'Ca prizonier — la Roma: furtuna lângă Creta, naufragiul la Malta, apoi Puteoli și Roma.' },
];
const ROUTE_ERAS = {
  patriarchs: { ru: 'Патриархи', ro: 'Patriarhii' }, exodus: { ru: 'Исход и Ханаан', ro: 'Exodul și Canaanul' }, judges: { ru: 'Судьи', ro: 'Judecătorii' },
  kings: { ru: 'Цари и пророки', ro: 'Regi și profeți' }, exile: { ru: 'Плен и возвращение', ro: 'Exilul și întoarcerea' },
  jesus: { ru: 'Иисус', ro: 'Isus' }, apostles: { ru: 'Апостолы', ro: 'Apostolii' },
};
// Свой цвет каждому пути (для режима «Все путешествия»)
ROUTES.forEach((r, i) => { r.color = `hsl(${Math.round((i * 360) / ROUTES.length + 20) % 360}, 80%, 66%)`; });
const VIEWS = { region: [10, 26, 50, 42.5], israel: [33.9, 29.3, 36.7, 33.7] };
let MAPDATA = null;
async function loadMap() {
  if (!MAPDATA) { try { const r = await fetch('data/map.json'); if (r.ok) MAPDATA = await r.json(); } catch {} }
  return MAPDATA;
}
const mapState = { view: 'region', route: null, place: null, hits: [], cam: null };
// Камера карты: центр (долгота, широта) и увеличение z относительно всего региона.
const MAP_K = Math.cos(34.25 * Math.PI / 180);
const MAP_ZMAX = 40;
function mapBase(W, H) { const [lon0, lat0, lon1, lat1] = VIEWS.region; return Math.min(W / ((lon1 - lon0) * MAP_K), H / (lat1 - lat0)); }
function camForBox(box, W, H, pad = 1) {
  const [lon0, lat0, lon1, lat1] = box;
  const s = Math.min(W / ((lon1 - lon0) * MAP_K), H / (lat1 - lat0)) / pad;
  return { lon: (lon0 + lon1) / 2, lat: (lat0 + lat1) / 2, z: THREE.MathUtils.clamp(s / mapBase(W, H), 1, MAP_ZMAX) };
}
function camForView(view, W, H) {
  const c = camForBox(VIEWS[view], W, H);
  // На вертикальном экране телефона весь регион слишком мелкий: сразу немного крупнее, с центром на востоке моря.
  if (view === 'region' && H > W * 0.8) return { lon: 31.5, lat: 34.2, z: Math.min(1.7, H / W * 1.4) };
  return c;
}
function clampCam(c) {
  const [lon0, lat0, lon1, lat1] = VIEWS.region;
  c.z = THREE.MathUtils.clamp(c.z, 1, MAP_ZMAX);
  c.lon = THREE.MathUtils.clamp(c.lon, lon0 - 2, lon1 + 2);
  c.lat = THREE.MathUtils.clamp(c.lat, lat0 - 2, lat1 + 1);
  return c;
}
// Названия морей и рек появляются при увеличении.
const WATERS = [
  [34.2, 18.5, 1, 'Великое (Средиземное) море', 'Marea cea Mare (Mediterana)'],
  [42.2, 34.0, 1, 'Чёрное море', 'Marea Neagră'],
  [27.3, 34.9, 1.4, 'Красное море', 'Marea Roșie'],
  [38.6, 25.1, 1.8, 'Эгейское море', 'Marea Egee'],
  [28.6, 30.9, 1.6, 'р. Нил', 'Nilul'],
  [35.1, 39.8, 1.6, 'р. Евфрат', 'Eufratul'],
  [35.6, 43.4, 2, 'р. Тигр', 'Tigrul'],
  [29.4, 48.6, 1.6, 'Персидский залив', 'Golful Persic'],
  [35.05, 33.2, 2.2, 'Кипр', 'Cipru'],
  [31.3, 35.47, 4, 'Солёное море', 'Marea Sărată'],
  [32.83, 35.6, 4, 'Галилейское море', 'Marea Galileii'],
  [32.15, 35.57, 6, 'р. Иордан', 'Iordanul'],
  [29.3, 34.85, 4, 'залив Акаба', 'Golful Aqaba'],
  [29.6, 32.6, 4, 'Суэцкий залив', 'Golful Suez'],
];
const ptOf = (p) => (typeof p === 'string' ? [PLACE[p].lat, PLACE[p].lon] : p);

function drawMap(cv, st) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height, dpr = cv.dataset.dpr ? +cv.dataset.dpr : 1;
  if (!st.cam) st.cam = camForView(st.view, W, H);
  const cam = st.cam, k = MAP_K, s = mapBase(W, H) * cam.z;
  const P = (lat, lon) => [W / 2 + (lon - cam.lon) * k * s, H / 2 - (lat - cam.lat) * s];
  st.toWorld = (x, y) => [cam.lat - (y - H / 2) / s, cam.lon + (x - W / 2) / (k * s)];
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#0b1a33'); sea.addColorStop(1, '#071224');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  const poly = (ring, fill, stroke, lw) => {
    g.beginPath();
    ring.forEach(([lon, lat], i) => { const [x, y] = P(lat, lon); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  };
  if (MAPDATA) {
    g.shadowColor = 'rgba(243, 195, 91, 0.25)'; g.shadowBlur = 10 * dpr;
    const land = cam.z > 2.2 && MAPDATA.landHi ? MAPDATA.landHi : MAPDATA.land;
    for (const ring of land) poly(ring, '#2f2a1f', null);
    g.shadowBlur = 0;
    for (const ring of land) poly(ring, null, 'rgba(214, 180, 110, 0.55)', 1.2 * dpr);
    for (const ring of MAPDATA.lakes) poly(ring, '#173a63', 'rgba(120, 170, 230, 0.6)', 1 * dpr);
    g.strokeStyle = 'rgba(110, 160, 230, 0.75)'; g.lineWidth = 1.4 * dpr;
    for (const line of MAPDATA.rivers) {
      g.beginPath();
      line.forEach(([lon, lat], i) => { const [x, y] = P(lat, lon); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
    }
  }
  // Маршрут (или все маршруты, каждый своим цветом)
  const all = st.route === 'all';
  const route = !all && st.route && ROUTES.find((r) => r.id === st.route);
  const drawRoute = (rt, color, lw, arrow) => {
    const pts = rt.pts.map(ptOf).map(([la, lo]) => P(la, lo));
    g.strokeStyle = color; g.lineWidth = lw * dpr; g.setLineDash([8 * dpr, 6 * dpr]);
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.setLineDash([]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if (Math.hypot(x1 - x0, y1 - y0) < arrow * 3) continue;
      const a = Math.atan2(y1 - y0, x1 - x0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, L = arrow;
      g.fillStyle = color;
      g.beginPath(); g.moveTo(mx + Math.cos(a) * L, my + Math.sin(a) * L);
      g.lineTo(mx + Math.cos(a + 2.5) * L, my + Math.sin(a + 2.5) * L); g.lineTo(mx + Math.cos(a - 2.5) * L, my + Math.sin(a - 2.5) * L);
      g.fill();
    }
    // начало пути — кружок
    g.fillStyle = color; g.beginPath(); g.arc(pts[0][0], pts[0][1], lw * 1.8 * dpr, 0, Math.PI * 2); g.fill();
  };
  if (all) ROUTES.forEach((rt) => drawRoute(rt, rt.color, 1.8, 6 * dpr));
  else if (route) drawRoute(route, '#f3c35b', 2.6, 8 * dpr);
  // Места
  const inRoute = new Set((all ? ROUTES : route ? [route] : []).flatMap((rt) => rt.pts.filter((p) => typeof p === 'string')));
  const labels = [];
  st.hits = [];
  const fs = Math.round(13 * dpr * Math.min(1.35, 1 + Math.log2(cam.z) * 0.07));
  g.font = `500 ${fs}px ${FONT_UI}`;
  g.textBaseline = 'middle';
  const order = Object.values(PLACE).sort((a, b) => (b.id === st.place) - (a.id === st.place) || inRoute.has(b.id) - inRoute.has(a.id));
  for (const p of order) {
    const [x, y] = P(p.lat, p.lon);
    if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
    const sel = p.id === st.place, rt = inRoute.has(p.id);
    g.fillStyle = sel ? '#ffffff' : rt ? '#f3c35b' : '#d9c9a0';
    g.beginPath(); g.arc(x, y, (sel ? 5.5 : rt ? 4 : 3) * dpr, 0, Math.PI * 2); g.fill();
    if (sel) { g.strokeStyle = '#f3c35b'; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(x, y, 11 * dpr, 0, Math.PI * 2); g.stroke(); }
    st.hits.push({ id: p.id, x, y });
    const name = placeName(p.id);
    const w = g.measureText(name).width;
    // Название справа от точки; если там занято — слева, сверху или снизу.
    const free = (bx) => !labels.some((b) => bx[0] < b[0] + b[2] && bx[0] + bx[2] > b[0] && bx[1] < b[1] + b[3] && bx[1] + bx[3] > b[1]);
    const cands = [
      [x + 7 * dpr, y - fs / 2 - 2],
      [x - 7 * dpr - w - 4, y - fs / 2 - 2],
      [x - w / 2 - 2, y - fs - 9 * dpr],
      [x - w / 2 - 2, y + 7 * dpr],
    ].map(([bx, by]) => [bx, by, w + 4, fs + 4]);
    const box = sel ? cands[0] : cands.find(free);
    if (!box) continue;
    labels.push(box);
    g.fillStyle = 'rgba(4, 6, 14, 0.6)'; g.fillRect(box[0] - 2, box[1], box[2] + 2, box[3]);
    g.fillStyle = sel ? '#ffffff' : rt ? '#f6e7c1' : '#c8cde0';
    g.fillText(name, box[0] + 1 * dpr, box[1] + box[3] / 2);
  }
  // Моря и реки — после мест и только там, где не закрывают их названия
  g.textBaseline = 'middle'; g.textAlign = 'center';
  const wfs = Math.round(12 * dpr * Math.min(1.35, 1 + Math.log2(cam.z) * 0.08));
  g.font = `italic 500 ${wfs}px ${FONT_UI}`;
  g.fillStyle = 'rgba(140, 185, 245, 0.85)';
  for (const [la, lo, mz, ru, ro] of WATERS) {
    if (cam.z < mz) continue;
    const [x, y] = P(la, lo);
    if (x < -100 || y < -20 || x > W + 100 || y > H + 20) continue;
    const t = LANG === 'ro' ? ro : ru, w = g.measureText(t).width;
    const box = [x - w / 2, y - wfs / 2, w, wfs];
    const hitsBox = (b) => box[0] < b[0] + b[2] && box[0] + box[2] > b[0] && box[1] < b[1] + b[3] && box[1] + box[3] > b[1];
    if (labels.some(hitsBox) || st.hits.some((p) => p.x > box[0] - 6 * dpr && p.x < box[0] + box[2] + 6 * dpr && p.y > box[1] - 6 * dpr && p.y < box[1] + box[3] + 6 * dpr)) continue;
    labels.push(box);
    g.fillText(t, x, y);
  }
  g.textAlign = 'left';
  g.fillStyle = 'rgba(200, 205, 224, 0.5)'; g.font = `${Math.round(10 * dpr)}px ${FONT_UI}`; g.textBaseline = 'bottom';
  g.fillText('Natural Earth', 6 * dpr, H - 4 * dpr);
  // Масштабная линейка: 1° широты ≈ 111 км
  const kmPx = s / 111;
  const want = 110 * dpr / kmPx;
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((v) => v >= want * 0.6) || 1000;
  const len = nice * kmPx, x1 = W - 12 * dpr, x0 = x1 - len, y0 = H - 10 * dpr;
  g.strokeStyle = 'rgba(232, 235, 246, 0.8)'; g.lineWidth = 2 * dpr;
  g.beginPath(); g.moveTo(x0, y0 - 5 * dpr); g.lineTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, y0 - 5 * dpr); g.stroke();
  g.fillStyle = 'rgba(232, 235, 246, 0.9)'; g.textAlign = 'center'; g.font = `${Math.round(11 * dpr)}px ${FONT_UI}`;
  g.fillText(`${nice} ${LANG === 'ro' ? 'km' : 'км'}`, (x0 + x1) / 2, y0 - 6 * dpr);
  g.textAlign = 'left';
}

// Подвести камеру к месту или маршруту
function camToPlace(id, W, H) {
  const p = PLACE[id], v = VIEWS.israel;
  const inIsrael = p.lon > v[0] && p.lon < v[2] && p.lat > v[1] && p.lat < v[3];
  const base = camForBox(inIsrael ? v : VIEWS.region, W, H);
  return clampCam({ lon: p.lon, lat: p.lat, z: inIsrael ? base.z * 1.6 : Math.max(base.z, 4) });
}
function camToRoute(route, W, H) {
  if (!route) return clampCam(camForView('region', W, H));
  const pts = route.pts.map(ptOf);
  const la = pts.map((p) => p[0]), lo = pts.map((p) => p[1]);
  return clampCam(camForBox([Math.min(...lo) - 0.6, Math.min(...la) - 0.6, Math.max(...lo) + 0.6, Math.max(...la) + 0.6], W, H, 1.25));
}

async function openMap(opts = {}) {
  await loadMap();
  if (opts.place) { mapState.place = opts.place; const p = PLACE[opts.place]; const v = VIEWS.israel; mapState.view = p.lon > v[0] && p.lon < v[2] && p.lat > v[1] && p.lat < v[3] ? 'israel' : 'region'; mapState.cam = null; mapState.focus = opts.place; }
  if (opts.route !== undefined) { mapState.route = opts.route; mapState.cam = null; }
  if (renderer.xr.isPresenting) { buildVrMap(); return; }
  renderMapPanel();
}
function renderMapPanel() {
  const L = T(), box = ui.mapPanel;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button'; close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', closeMap);
  box.append(close, el2('h3', '', L.map));
  const bar = el2('div', 'map-bar');
  for (const v of ['region', 'israel']) {
    const b = el2('button', 'btn' + (mapState.view === v ? ' on' : ''), L.mapViews[v]);
    b.type = 'button'; b.addEventListener('click', () => { mapState.view = v; mapState.cam = null; renderMapPanel(); });
    bar.append(b);
  }
  const sel = el2('select'); sel.id = 'mapRoute';
  sel.append(Object.assign(document.createElement('option'), { value: '', textContent: L.mapNoRoute }));
  sel.append(Object.assign(document.createElement('option'), { value: 'all', textContent: `★ ${L.mapAllRoutes} (${ROUTES.length})` }));
  for (const [era, nm] of Object.entries(ROUTE_ERAS)) {
    const og = document.createElement('optgroup'); og.label = nm[LANG] || nm.ru;
    for (const r of ROUTES.filter((x) => x.era === era)) og.append(Object.assign(document.createElement('option'), { value: r.id, textContent: r[LANG] || r.ru }));
    sel.append(og);
  }
  sel.value = mapState.route || '';
  sel.addEventListener('change', () => { mapState.route = sel.value || null; mapState.place = null; if (mapState.route) { mapState.view = 'region'; mapState.routeFit = true; } renderMapPanel(); });
  bar.append(sel);
  box.append(bar);
  const wrap = el2('div', 'map-wrap');
  const cv = el2('canvas');
  cv.className = 'map-canvas';
  const zoom = el2('div', 'map-zoom');
  const zin = el2('button', 'btn', '+'), zout = el2('button', 'btn', '−'), zfit = el2('button', 'btn', '⤢');
  [zin, zout, zfit].forEach((b) => { b.type = 'button'; });
  zin.setAttribute('aria-label', L.zoomIn); zout.setAttribute('aria-label', L.zoomOut); zfit.setAttribute('aria-label', L.zoomFit);
  zoom.append(zin, zout, zfit);
  wrap.append(cv, zoom);
  box.append(wrap);
  const info = el2('div', 'map-info');
  box.append(info);
  box.hidden = false;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  cv.width = Math.round(rect.width * dpr); cv.height = Math.round(rect.height * dpr); cv.dataset.dpr = dpr;
  if (mapState.focus) { mapState.cam = camToPlace(mapState.focus, cv.width, cv.height); mapState.focus = null; }
  if (mapState.routeFit && mapState.route) { mapState.cam = camToRoute(ROUTES.find((r) => r.id === mapState.route), cv.width, cv.height); mapState.routeFit = false; }
  drawMap(cv, mapState);
  // Жесты: палец — двигать, два пальца или колёсико — увеличивать, двойное касание — крупнее.
  let raf = 0;
  const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawMap(cv, mapState); }); };
  const local = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
  const zoomAt = (x, y, z) => {
    const c = mapState.cam, s1 = mapBase(cv.width, cv.height) * c.z;
    const la = c.lat - (y - cv.height / 2) / s1, lo = c.lon + (x - cv.width / 2) / (MAP_K * s1);
    c.z = THREE.MathUtils.clamp(z, 1, MAP_ZMAX);
    const s2 = mapBase(cv.width, cv.height) * c.z;
    c.lon = lo - (x - cv.width / 2) / (MAP_K * s2);
    c.lat = la + (y - cv.height / 2) / s2;
    clampCam(c); redraw();
  };
  const ptrs = new Map();
  let moved = false, pinch = null, lastTap = 0;
  cv.addEventListener('pointerdown', (e) => {
    try { cv.setPointerCapture(e.pointerId); } catch { /* не у всех устройств */ }
    ptrs.set(e.pointerId, local(e));
    if (ptrs.size === 1) moved = false;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: mapState.cam.z, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
      moved = true;
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId), cur = local(e);
    ptrs.set(e.pointerId, cur);
    const c = mapState.cam;
    if (ptrs.size === 1) {
      const dx = cur[0] - prev[0], dy = cur[1] - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        const s2 = mapBase(cv.width, cv.height) * c.z;
        c.lon -= dx / (MAP_K * s2); c.lat += dy / s2;
        clampCam(c); redraw();
      }
      if (Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) > 2) moved = true;
    } else if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      // сдвиг середины между пальцами двигает карту, расстояние — увеличивает
      const s2 = mapBase(cv.width, cv.height) * c.z;
      c.lon -= (mid[0] - pinch.mid[0]) / (MAP_K * s2); c.lat += (mid[1] - pinch.mid[1]) / s2;
      pinch.mid = mid;
      zoomAt(mid[0], mid[1], pinch.z * (d / pinch.d));
    }
  });
  const up = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    const pt = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size || moved || e.type === 'pointercancel') return;
    const now = performance.now();
    if (now - lastTap < 320) { lastTap = 0; zoomAt(pt[0], pt[1], mapState.cam.z * 2); return; }
    lastTap = now;
    let best = null, bd = 22 * dpr;
    for (const hh of mapState.hits) { const d = Math.hypot(hh.x - pt[0], hh.y - pt[1]); if (d < bd) { bd = d; best = hh.id; } }
    if (best) { mapState.place = best; drawMap(cv, mapState); renderPlaceInfo(info); }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = local(e); zoomAt(x, y, mapState.cam.z * (e.deltaY < 0 ? 1.25 : 0.8)); }, { passive: false });
  zin.addEventListener('click', () => zoomAt(cv.width / 2, cv.height / 2, mapState.cam.z * 1.6));
  zout.addEventListener('click', () => zoomAt(cv.width / 2, cv.height / 2, mapState.cam.z / 1.6));
  zfit.addEventListener('click', () => { mapState.view = 'region'; mapState.cam = null; renderMapPanel(); });
  const route = mapState.route && ROUTES.find((r) => r.id === mapState.route);
  const routeBox = el2('div', 'map-route');
  if (route) {
    const r = fromRef(route.ref);
    const go2 = el2('button', 'btn primary', `${L.mapReadRoute} ${r ? refOf(r.bi, r.ci, r.vi) : ''}`);
    go2.type = 'button'; go2.addEventListener('click', () => { closeMap(); if (r) jumpTo(r); });
    bar.append(go2);
    // Описание пути и его остановки
    routeBox.append(el2('h3', '', route[LANG] || route.ru), el2('p', 'route-d', LANG === 'ro' ? route.dro : route.dru));
    const stops = el2('div', 'chips');
    const seen = new Set();
    route.pts.filter((p) => typeof p === 'string').forEach((id, i, arr) => {
      if (seen.has(id) && i !== arr.length - 1) return;
      seen.add(id);
      const c = el2('button', 'chip', `${stops.childNodes.length ? '→ ' : ''}${placeName(id)}`); c.type = 'button';
      c.addEventListener('click', () => { mapState.place = id; mapState.cam = camToPlace(id, cv.width, cv.height); drawMap(cv, mapState); renderPlaceInfo(info); });
      stops.append(c);
    });
    routeBox.append(stops, el2('p', 'muted small', L.mapApprox));
  } else if (mapState.route === 'all') {
    // Все пути: цветная легенда, нажатие выбирает путь
    routeBox.append(el2('h3', '', `${L.mapAllRoutes} · ${ROUTES.length}`));
    for (const [era, nm] of Object.entries(ROUTE_ERAS)) {
      routeBox.append(el2('div', 'route-era', nm[LANG] || nm.ru));
      const row = el2('div', 'route-legend');
      for (const rt of ROUTES.filter((x) => x.era === era)) {
        const b = el2('button', 'route-key'); b.type = 'button';
        const dot = el2('span', 'dot'); dot.style.background = rt.color;
        b.append(dot, document.createTextNode(rt[LANG] || rt.ru));
        b.addEventListener('click', () => { mapState.route = rt.id; mapState.routeFit = true; renderMapPanel(); });
        row.append(b);
      }
      routeBox.append(row);
    }
    routeBox.append(el2('p', 'muted small', L.mapApprox));
  }
  if (routeBox.childNodes.length) box.insertBefore(routeBox, info);
  if (mapState.place) renderPlaceInfo(info); else info.append(el2('p', 'muted small', L.mapHint));
}
function renderPlaceInfo(info) {
  const L = T(), id = mapState.place;
  info.replaceChildren();
  const vs = versesAbout(id);
  info.append(el2('h3', '', `${placeName(id)} · ${L.mapVerses(vs.length)}`));
  const ul = el2('ul', 'links');
  for (const r of vs.slice(0, 60)) {
    const li = el2('li'), btn = el2('button');
    btn.type = 'button';
    btn.append(el2('span', 'r', refOf(r.bi, r.ci, r.vi)), el2('span', 't', verseText(r.bi, r.ci, r.vi)));
    btn.addEventListener('click', () => { closeMap(); jumpTo(r); });
    li.append(btn); ul.append(li);
  }
  info.append(ul);
}
function closeMap() {
  ui.mapPanel.hidden = true;
  mapState.vrCam = false;
  if (mapVr.group) { scene.remove(mapVr.group); disposeTree(mapVr.group); mapVr.group = null; }
  mapVr.buttons = [];
}
const mapVr = { group: null, buttons: [] };
function buildVrMap() {
  if (mapVr.group) { scene.remove(mapVr.group); disposeTree(mapVr.group); }
  const L = T();
  const cv = document.createElement('canvas');
  cv.width = 1600; cv.height = 1000; cv.dataset.dpr = 2.2;
  // камера панели на экране рассчитана на другой размер холста — в VR вид подбирается заново
  if (mapState.focus) { mapState.cam = camToPlace(mapState.focus, cv.width, cv.height); mapState.focus = null; }
  if (!mapState.vrCam) { mapState.cam = null; mapState.vrCam = true; }
  drawMap(cv, mapState);
  const grp = new THREE.Group();
  const W = 1.5, H = W * cv.height / cv.width;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: makeTexture(cv), depthTest: false, transparent: true }));
  plane.renderOrder = 34;
  plane.position.set(0, H / 2, 0);
  grp.add(plane);
  const idx = mapState.route && mapState.route !== 'all' ? ROUTES.findIndex((r) => r.id === mapState.route) : -1;
  const nextRoute = ROUTES[(idx + 1) % ROUTES.length];
  const acts = [
    [`⇄ ${nextRoute[LANG] || nextRoute.ru}`, () => { mapState.route = nextRoute.id; mapState.view = 'region'; mapState.cam = camToRoute(nextRoute, 1600, 1000); buildVrMap(); }],
    [L.mapViews[mapState.view === 'region' ? 'israel' : 'region'], () => { mapState.view = mapState.view === 'region' ? 'israel' : 'region'; mapState.cam = null; buildVrMap(); }],
    ['+', () => { if (mapState.cam) { mapState.cam.z = Math.min(MAP_ZMAX, mapState.cam.z * 1.6); } buildVrMap(); }],
    ['−', () => { if (mapState.cam) { mapState.cam.z = Math.max(1, mapState.cam.z / 1.6); } buildVrMap(); }],
    [L.xrClose, closeMap],
  ];
  const bws = acts.map(([t]) => (t.length <= 1 ? 0.14 : 0.42)), gap = 0.015;
  const total = bws.reduce((a, b) => a + b, 0) + (acts.length - 1) * gap;
  let xAt = -total / 2;
  mapVr.buttons = acts.map(([t, fn], i) => {
    const bw = bws[i];
    const b = makeButton(t, fn, bw);
    b.position.set(xAt + bw / 2, -0.06, 0);
    xAt += bw + gap;
    grp.add(b);
    return b;
  });
  const { pos, yaw } = headInfo();
  grp.position.set(Math.sin(yaw) * 1.6, -0.35, -Math.cos(yaw) * 1.6).add(pos);
  grp.lookAt(pos.x, grp.position.y, pos.z);
  scene.add(grp);
  mapVr.group = grp;
}

/* ---------- Лента событий ---------- */

// [год (отрицательный — до н. э.; null — «в начале»), русское название, румынское, место в Библии]
const EVENTS = [
  [null, 'Сотворение', 'Creația', 'Gen.1.1'],
  [-2370, 'Потоп', 'Potopul', 'Gen.7.11'],
  [-1943, 'Бог призывает Авраама', 'Dumnezeu îl cheamă pe Avraam', 'Gen.12.1'],
  [-1750, 'Иосиф в Египте', 'Iosif în Egipt', 'Gen.37.28'],
  [-1513, 'Исход из Египта', 'Exodul din Egipt', 'Exod.12.41'],
  [-1513, 'Закон у горы Синай', 'Legea la muntele Sinai', 'Exod.20.1'],
  [-1473, 'Израиль входит в Ханаан', 'Israel intră în Canaan', 'Josh.3.17'],
  [-1117, 'Саул — первый царь', 'Saul, primul rege', '1Sam.10.24'],
  [-1077, 'Давид становится царём', 'David devine rege', '2Sam.5.3'],
  [-1027, 'Соломон строит храм', 'Solomon construiește templul', '1Kgs.6.1'],
  [-997, 'Царство разделяется', 'Regatul se împarte', '1Kgs.12.20'],
  [-740, 'Падение Самарии', 'Căderea Samariei', '2Kgs.17.6'],
  [-607, 'Разрушение Иерусалима', 'Distrugerea Ierusalimului', '2Kgs.25.9'],
  [-539, 'Падение Вавилона', 'Căderea Babilonului', 'Dan.5.30'],
  [-537, 'Возвращение из плена', 'Întoarcerea din exil', 'Ezra.1.3'],
  [-515, 'Храм восстановлен', 'Templul este refăcut', 'Ezra.6.15'],
  [-455, 'Стены Иерусалима восстановлены', 'Zidurile Ierusalimului refăcute', 'Neh.6.15'],
  [-2, 'Рождение Иисуса', 'Nașterea lui Isus', 'Luke.2.7'],
  [29, 'Крещение Иисуса', 'Botezul lui Isus', 'Matt.3.16'],
  [31, 'Нагорная проповедь', 'Predica de pe munte', 'Matt.5.1'],
  [33, 'Смерть Иисуса', 'Moartea lui Isus', 'John.19.30'],
  [33, 'Воскресение', 'Învierea', 'Matt.28.6'],
  [33, 'Пятидесятница', 'Penticosta', 'Acts.2.4'],
  [34, 'Савл становится учеником', 'Saul devine discipol', 'Acts.9.3'],
  [47, 'Первое путешествие Павла', 'Prima călătorie a lui Pavel', 'Acts.13.4'],
  [49, 'Совет в Иерусалиме', 'Consiliul din Ierusalim', 'Acts.15.6'],
  [59, 'Павел в Риме', 'Pavel la Roma', 'Acts.28.16'],
  [96, 'Откровение Иоанну', 'Revelația dată lui Ioan', 'Rev.1.9'],
];
function showEvents() {
  const L = T();
  const items = EVENTS.map(([y, ru, ro, ref]) => {
    const r = fromRef(ref);
    if (!r) return null;
    return { ...r, label: `${y == null ? L.inBeginning : fmtYear(y)} · ${LANG === 'ro' ? ro : ru}` };
  }).filter(Boolean);
  openList('events', L.events, L.eventsNote, items);
}

/* ---------- Планы чтения ---------- */

const PLANS = [
  { id: 'year', days: 365, codes: () => CODES66 },
  { id: 'nt90', days: 90, codes: () => CODES66.slice(39) },
  { id: 'gospels30', days: 30, codes: () => ['Matt', 'Mark', 'Luke', 'John'] },
  { id: 'psalms30', days: 30, codes: () => ['Ps'] },
  { id: 'prov31', days: 31, codes: () => ['Prov'] },
];
function planChapters(plan) {
  const out = [];
  for (const code of plan.codes()) {
    const bi = CODE_TO_BI[code];
    if (bi == null) continue;
    BOOKS[bi].chapters.forEach((_, ci) => out.push({ bi, ci }));
  }
  return out;
}
const dayNum = (d) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
function planToday() {
  const cur = store.get('plan', null);
  const plan = cur && PLANS.find((p) => p.id === cur.id);
  if (!plan) return null;
  const all = planChapters(plan);
  const day = THREE.MathUtils.clamp(dayNum(new Date()) - cur.start, 0, plan.days - 1);
  const a = Math.floor((day * all.length) / plan.days), b = Math.floor(((day + 1) * all.length) / plan.days);
  const today = all.slice(a, Math.max(b, a + 1));
  const done = all.filter((c) => isRead(c.bi, c.ci)).length;
  return { plan, all, day, today, done };
}
function showPlan() {
  const L = T();
  const extra = el2('div', 'plan');
  const pt = planToday();
  if (!pt) {
    for (const p of PLANS) {
      if (!planChapters(p).length) continue;
      const row = el2('div', 'plan-row');
      const b = el2('button', 'btn', L.planStart);
      b.type = 'button';
      b.addEventListener('click', () => { store.set('plan', { id: p.id, start: dayNum(new Date()) }); showPlan(); renderContinue(); });
      row.append(el2('div', 'plan-name', L.plans[p.id]), el2('div', 'muted small', L.planDesc(planChapters(p).length, p.days)), b);
      extra.append(row);
    }
    openList('plan', L.plan, L.planNote, [], extra);
    return;
  }
  const pct = Math.round((pt.done / pt.all.length) * 100);
  const bar = el2('div', 'plan-bar'); const fill = el2('div'); fill.style.width = `${pct}%`; bar.append(fill);
  extra.append(el2('div', 'plan-name', L.plans[pt.plan.id]), el2('div', 'muted small', L.planProgress(pt.day + 1, pt.plan.days, pct)), bar, el2('h3', '', L.planToday));
  const items = pt.today.map((c) => ({ bi: c.bi, ci: c.ci, vi: null, label: `${isRead(c.bi, c.ci) ? '✓ ' : '○ '}${BOOKS[c.bi].name} ${c.ci + 1}`, onClick: () => go('chapter', { bi: c.bi, ci: c.ci }) }));
  const stop = el2('button', 'btn danger', L.planStop);
  stop.type = 'button';
  let armed = false;
  stop.addEventListener('click', () => {
    if (!armed) { armed = true; stop.textContent = L.resetConfirm; setTimeout(() => { armed = false; stop.textContent = L.planStop; }, 4000); return; }
    store.set('plan', null); showPlan(); renderContinue();
  });
  const after = el2('div', 'plan-after'); after.append(stop);
  openList('plan', L.plan, '', items, extra);
  ui.listPanel.append(after);
}

/* ---------- Музыка космоса (генерируется на устройстве, без файлов) ---------- */

const music = { ctx: null, master: null, on: false, timer: 0, chord: 0, voices: [] };
const CHORDS = [[110, 164.81, 220, 277.18], [98, 146.83, 196, 246.94], [87.31, 130.81, 174.61, 220], [103.83, 155.56, 207.65, 261.63]];
function musicStart() {
  if (music.on) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!music.ctx) {
      const ctx = new AC();
      const master = ctx.createGain(); master.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      // Простая «реверберация»: импульс из затухающего шума.
      const conv = ctx.createConvolver();
      const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      conv.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.6;
      lp.connect(master); lp.connect(conv); conv.connect(wet); wet.connect(master); master.connect(ctx.destination);
      music.voices = CHORDS[0].map((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
        const lfoG = ctx.createGain(); lfoG.gain.value = 1.5; lfo.connect(lfoG); lfoG.connect(o.detune);
        const gn = ctx.createGain(); gn.gain.value = 0.12 / (1 + i * 0.3);
        o.connect(gn); gn.connect(lp); o.start(); lfo.start();
        return o;
      });
      Object.assign(music, { ctx, master, lp });
    }
    music.ctx.resume();
    music.on = true;
    music.timer = setInterval(musicTick, 9000);
    musicTick();
  } catch { music.on = false; }
  updateMusicBtn();
}
function musicTick() {
  if (!music.on) return;
  const ctx = music.ctx, t = ctx.currentTime;
  music.chord = (music.chord + 1) % CHORDS.length;
  music.voices.forEach((o, i) => o.frequency.setTargetAtTime(CHORDS[music.chord][i], t, 2.5));
  // Мерцающая высокая нота.
  const notes = [440, 523.25, 587.33, 659.25, 783.99, 880];
  for (let k = 0; k < 2; k++) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    const gn = ctx.createGain(); gn.gain.value = 0;
    const st = t + 1 + k * (2 + Math.random() * 3);
    gn.gain.setValueAtTime(0, st); gn.gain.linearRampToValueAtTime(0.035, st + 0.8); gn.gain.exponentialRampToValueAtTime(0.0001, st + 6);
    o.connect(gn); gn.connect(music.lp); o.start(st); o.stop(st + 6.5);
  }
}
function musicStop() {
  if (!music.on) return;
  music.on = false;
  clearInterval(music.timer);
  if (music.master) music.master.gain.setTargetAtTime(0, music.ctx.currentTime, 0.4);
  setTimeout(() => { if (!music.on && music.ctx) music.ctx.suspend(); }, 1500);
  updateMusicBtn();
}
function toggleMusic() { if (music.on) musicStop(); else musicStart(); settings.music = music.on; saveSettings(); }
function updateMusicBtn() { if (ui.musicBtn) ui.musicBtn.textContent = music.on ? T().musicOn : T().musicOff; if (renderer.xr.isPresenting) rebuildPanel(); }
// Громкость: тише, пока звучит голос.
function musicUpdate() {
  if (!music.on || !music.master) return;
  const target = (settings.musicVol ?? 0.5) * 0.5 * (speaking() ? 0.3 : 1);
  music.master.gain.setTargetAtTime(target, music.ctx.currentTime, 0.6);
}
const speaking = () => !!(tts.reading || narration.on || tts.talking);

/* ---------- Поделиться стихом: картинка со звёздами ---------- */

function verseImage(bi, ci, vi) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(540, 520, 50, 540, 600, 900);
  bg.addColorStop(0, '#1c1640'); bg.addColorStop(0.55, '#0a0c22'); bg.addColorStop(1, '#03040a');
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 1080, y = Math.random() * 1350, r = Math.random() < 0.06 ? 2.2 : 0.9 + Math.random();
    g.fillStyle = `rgba(255, ${230 + Math.random() * 25}, ${200 + Math.random() * 55}, ${0.3 + Math.random() * 0.7})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const glow = g.createRadialGradient(540, 230, 0, 540, 230, 160);
  glow.addColorStop(0, 'rgba(255, 231, 163, 0.9)'); glow.addColorStop(1, 'rgba(255, 231, 163, 0)');
  g.fillStyle = glow; g.fillRect(380, 70, 320, 320);
  g.fillStyle = '#fff6dc'; g.font = `80px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✦', 540, 230);
  const text = plain(verseText(bi, ci, vi));
  let size = 58;
  let lines;
  for (; size >= 34; size -= 4) { g.font = `${size}px ${FONT_CARD}`; lines = wrap(g, text, 900); if (lines.length * size * 1.45 < 720) break; }
  lines = clampLines(lines, 16);
  g.fillStyle = '#f2f4fb';
  const lh = size * 1.45, y0 = 700 - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((ln, i) => g.fillText(ln, 540, y0 + i * lh));
  g.fillStyle = '#f3c35b'; g.font = `600 52px ${FONT_TITLE}`;
  g.fillText(`${BOOKS[bi].name} ${ci + 1}:${vi + 1}`, 540, Math.min(1180, y0 + lines.length * lh + 50));
  g.fillStyle = 'rgba(200, 205, 224, 0.7)'; g.font = `30px ${FONT_UI}`;
  g.fillText(T().title, 540, 1290);
  return c;
}
async function shareVerse(bi, ci, vi) {
  const L = T();
  const cv = verseImage(bi, ci, vi);
  const text = `${refOf(bi, ci, vi)} — ${plain(verseText(bi, ci, vi))}`;
  const dataUrl = cv.toDataURL('image/png');
  if (window.AndroidShare) { window.AndroidShare.shareImage(dataUrl, text); return; }
  try {
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], 'verse.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
  } catch { /* окно «поделиться» недоступно — покажем картинку */ }
  const extra = el2('div', 'share');
  const img = el2('img'); img.src = dataUrl; img.alt = text;
  const copy = el2('button', 'btn', L.copyText); copy.type = 'button';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = L.copied; } catch { copy.textContent = L.copyFail; }
  });
  extra.append(img, copy);
  openList('share', L.share, L.shareHint, [], extra);
}

/* ---------- Режим «Тишина»: одна глава, мягкий голос, ничего лишнего ---------- */

const quiet = { on: false };
function enterQuiet() {
  if (state.mode !== 'chapter' || quiet.on) return;
  quiet.on = true;
  closeDetail(); closeList(); closeQuiz();
  document.body.classList.add('quiet');
  if (sky) sky.setMode('quiet');
  xrPanel.group.visible = false;
  renderReader();
  if (!tts.reading) readFrom(0);
}
function exitQuiet() {
  if (!quiet.on) return;
  quiet.on = false;
  document.body.classList.remove('quiet');
  if (sky) sky.setMode(state.mode);
  if (renderer.xr.isPresenting) { xrPanel.group.visible = true; rebuildPanel(); }
  stopReading();
  renderReader();
}


/* ---------- Режим чтения: глава крупным текстом, как страница книги ---------- */
// На телефоне он включён сразу (узкий экран), на компьютере — по кнопке «📖 Текст». Выбор запоминается.
const reader = { el: null, built: '' };
function readerWanted() {
  if (renderer.xr.isPresenting || quiet.on || (state.mode !== 'chapter' && state.mode !== 'book')) return false;
  if (settings.reader === 'text') return true;
  if (settings.reader === 'space') return false;
  return innerWidth < 760;
}
function readerSize() { return settings.readerPx || (innerWidth < 760 ? 21 : 22); }
function renderReader(force) {
  const box = ui.reader;
  const on = readerWanted();
  document.body.classList.toggle('reading', on);
  updateReaderBtn();
  if (!on) { box.hidden = true; reader.built = ''; return; }
  if (state.mode === 'book') { renderBookPage(force); return; }
  const bi = state.bi, ci = state.ci, b = BOOKS[bi], L = T();
  const key = `${LANG}:${bi}:${ci}:${BOOKS.length}`;
  box.hidden = false;
  box.style.setProperty('--rpx', `${readerSize()}px`);
  if (reader.built === key && !force) { markReaderVerse(); return; }
  reader.built = key;
  box.replaceChildren();
  const head = el2('header', 'r-head');
  head.append(el2('div', 'r-book', b.name), el2('h2', 'r-ch', b.code === 'Ps' ? L.psalm(ci + 1) : L.chapter(ci + 1)));
  const tools = el2('div', 'r-tools');
  const minus = el2('button', 'btn', 'A−'); minus.type = 'button'; minus.setAttribute('aria-label', L.textSmaller);
  const plus = el2('button', 'btn', 'A+'); plus.type = 'button'; plus.setAttribute('aria-label', L.textBigger);
  const setPx = (d) => { settings.readerPx = Math.max(16, Math.min(34, readerSize() + d)); saveSettings(); box.style.setProperty('--rpx', `${settings.readerPx}px`); };
  minus.addEventListener('click', () => setPx(-2));
  plus.addEventListener('click', () => setPx(2));
  tools.append(minus, plus);
  head.append(tools);
  box.append(head);
  // Суть главы — крупно, над текстом
  const sum = chapterSummary(bi, ci);
  if (sum) {
    const s = el2('div', 'r-sum');
    s.append(el2('div', 'r-sum-h', L.chapterEssence), el2('p', '', sum));
    box.append(s);
  }
  const body = el2('div', 'r-body');
  const starts = paragraphStarts(b, ci);
  const vs = b.chapters[ci];
  let p = null;
  vs.forEach((text, vi) => {
    const poetry = text.includes('\n');
    if (!p || starts.has(vi) || poetry) { p = el2('p', poetry ? 'r-p poem' : 'r-p'); body.append(p); }
    const span = el2('span', 'v');
    span.dataset.vi = vi;
    const sup = el2('sup', '', String(vi + 1));
    span.append(sup);
    const lines = text.split('\n');
    lines.forEach((ln, i) => { if (i) span.append(document.createElement('br')); span.append(document.createTextNode((i ? '' : ' ') + ln)); });
    if (noteOf(bi, ci, vi)) span.append(el2('span', 'r-note', ' ✎'));
    span.append(document.createTextNode(' '));
    span.addEventListener('click', () => { selectVerse(vi); markReaderVerse(); });
    p.append(span);
    if (poetry) p = null;
  });
  box.append(body);
  const info = el2('div', 'r-info');
  const figs = figuresInChapter(bi, ci);
  if (figs.length) {
    info.append(el2('h3', '', L.peopleHere));
    const row = el2('div', 'chips');
    for (const f of figs.slice(0, 12)) { const c = el2('button', 'chip', LANG === 'ro' ? f.ro : f.ru); c.type = 'button'; c.addEventListener('click', () => showFigure(f)); row.append(c); }
    info.append(row);
  }
  const facts = FACTS && b.code && FACTS[b.code] ? (FACTS[b.code][LANG] || FACTS[b.code].ru) : null;
  if (facts && facts.length) info.append(el2('h3', '', L.didYouKnow), el2('p', '', facts[ci % facts.length]));
  if (XREF && chapterLinks(bi, ci).length) {
    const sky2 = el2('button', 'btn', `${L.chLinks}: ${L.showOnSky}`); sky2.type = 'button';
    sky2.addEventListener('click', () => showChapterLinksOnSky(bi, ci));
    info.append(sky2);
  }
  if (info.childNodes.length) box.append(info);
  const foot = el2('div', 'r-foot');
  const nb = neighbourChapter(bi, ci, 1);
  if (nb) {
    const next = el2('button', 'btn primary', `${BOOKS[nb.bi].name} ${nb.ci + 1} ▶`); next.type = 'button';
    next.addEventListener('click', () => go('chapter', { bi: nb.bi, ci: nb.ci }));
    foot.append(next);
  }
  box.append(foot);
  box.scrollTop = 0;
  markReaderVerse();
}

// Книга в режиме чтения: крупное название, справка, рассказ о писателе и большие кнопки глав.
function renderBookPage(force) {
  const box = ui.reader, bi = state.bi, b = BOOKS[bi], L = T();
  const key = `book:${LANG}:${bi}:${BOOKS.length}`;
  box.hidden = false;
  box.style.setProperty('--rpx', `${readerSize()}px`);
  if (reader.built === key && !force) return;
  reader.built = key;
  box.replaceChildren();
  const head = el2('header', 'r-head');
  head.append(el2('div', 'r-book', gName(b.g).toUpperCase()), el2('h2', 'r-ch', b.name));
  const tools = el2('div', 'r-tools');
  const sp = el2('button', 'btn', L.readerSpace); sp.type = 'button';
  sp.addEventListener('click', () => { settings.reader = 'space'; saveSettings(); renderReader(true); renderBookPanel(); });
  tools.append(sp);
  head.append(tools);
  box.append(head);
  // Главы
  const n = b.chapters.length;
  const read = b.chapters.reduce((a, _, ci) => a + (isRead(bi, ci) ? 1 : 0), 0);
  box.append(el2('h3', 'r-sec', `${L.chaptersN ? L.chaptersN(n) : n} · ${L.readOf ? L.readOf(read, n) : `${read}/${n}`}`));
  const withSum = SUMMARIES && b.code && SUMMARIES[b.code];
  if (withSum) {
    const list = el2('div', 'r-chlist');
    b.chapters.forEach((_, ci) => {
      const btn = el2('button', `r-chrow${isRead(bi, ci) ? ' done' : ''}`); btn.type = 'button';
      const sum = chapterSummary(bi, ci);
      btn.append(el2('span', 'num', String(ci + 1)), el2('span', 'txt', sum ? sum.split(/(?<=[.!?])\s/)[0] : ''));
      btn.addEventListener('click', () => go('chapter', { bi, ci }));
      list.append(btn);
    });
    box.append(list);
  } else {
    const grid = el2('div', 'r-grid');
    b.chapters.forEach((_, ci) => {
      const btn = el2('button', `r-chbtn${isRead(bi, ci) ? ' done' : ''}`, String(ci + 1)); btn.type = 'button';
      btn.setAttribute('aria-label', b.code === 'Ps' ? L.psalm(ci + 1) : L.chapter(ci + 1));
      btn.addEventListener('click', () => go('chapter', { bi, ci }));
      grid.append(btn);
    });
    box.append(grid);
  }
  // О книге
  const about = bookAbout(bi);
  const info = el2('div', 'r-info');
  if (about) {
    info.append(el2('h3', '', L.aboutBook(b.name)));
    const dl = el2('dl', 'r-dl');
    for (const [k, v] of about.rows) dl.append(el2('dt', '', k), el2('dd', '', v));
    info.append(dl);
    if (about.circ) info.append(el2('p', '', about.circ));
  }
  const person = personFor(bi);
  if (person) {
    info.append(el2('h3', '', L.whoWas(person.n)), el2('p', '', person.b));
  }
  const nar = el2('button', 'btn primary', narration.on ? L.narrateStop : L.narrate); nar.type = 'button';
  nar.addEventListener('click', () => { toggleNarration(bi); nar.textContent = narration.on ? L.narrateStop : L.narrate; });
  const acts = el2('div', 'actions'); acts.append(nar);
  info.append(acts);
  box.append(info);
  box.scrollTop = 0;
}
// Подсветка выбранного и звучащего стиха; звучащий плавно прокручивается в центр.
function markReaderVerse() {
  if (ui.reader.hidden) return;
  const r = tts.reading && tts.reading.bi === state.bi && tts.reading.ci === state.ci ? tts.reading.vi : -1;
  ui.reader.querySelectorAll('.v').forEach((s) => {
    const vi = +s.dataset.vi;
    s.classList.toggle('sel', detail.open && detail.vi === vi);
    const was = s.classList.contains('now');
    s.classList.toggle('now', vi === r);
    if (vi === r && !was && !isBg()) s.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}
function updateReaderBtn() {
  const L = T();
  const on = readerWanted();
  ui.readerBtn.textContent = on ? L.readerSpace : L.readerText;
  ui.readerBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
ui.readerBtn.addEventListener('click', () => {
  settings.reader = readerWanted() ? 'space' : 'text';
  saveSettings();
  renderReader(true);
  renderChapterInfo();
});
addEventListener('resize', () => { if (state.mode === 'chapter' && !settings.reader) renderReader(); });

// Короткие подписи кнопок внизу на узком экране, чтобы они помещались в одну строку.
function navLabels() {
  const L = T(), narrow = innerWidth < 760;
  ui.prevCh.textContent = narrow ? '◀' : L.prevCh;
  ui.nextCh.textContent = narrow ? '▶' : L.nextCh;
  ui.quiet.textContent = narrow ? '☾' : L.quiet;
  ui.prevCh.setAttribute('aria-label', L.prevCh);
  ui.nextCh.setAttribute('aria-label', L.nextCh);
  ui.quiet.setAttribute('aria-label', L.quiet);
  // Верхняя панель на телефоне: значки вместо длинных подписей
  ui.home.textContent = narrow ? '⌂' : L.home;
  ui.random.textContent = narrow ? '✦' : L.random;
  ui.quizBtn.textContent = narrow ? '?' : L.quiz;
  ui.home.setAttribute('aria-label', L.home);
  ui.random.setAttribute('aria-label', L.random);
  ui.quizBtn.setAttribute('aria-label', L.quiz);
}
addEventListener('resize', navLabels);

/* ---------- Уроки для жизни: Библия как инструкция для человека ---------- */
// Девять ступеней: замысел → поломка → диагноз → ремонт → правила → примеры → обслуживание → неисправности → цель.
const LESSONS = [
  { id: 'design', color: '#ffd27a', ru: 'Замысел: для чего создан человек', ro: 'Scopul: de ce a fost creat omul',
    tru: 'Человек создан по образу Бога — способным любить, поступать справедливо, творить и выбирать. У него есть духовная потребность, которую не заполнить вещами, успехом или удовольствиями. Вывод книги Экклезиаст: бойся Бога и соблюдай его заповеди — в этом весь человек.',
    tro: 'Omul a fost creat după chipul lui Dumnezeu — capabil să iubească, să fie drept, să creeze și să aleagă. El are o nevoie spirituală pe care lucrurile, succesul sau plăcerile nu o pot umple. Concluzia cărții Eclesiastul: teme-te de Dumnezeu și păzește-i poruncile — aceasta este datoria întregă a omului.',
    refs: ['Gen.1.27', 'Gen.2.15', 'Ps.139.14', 'Isa.45.18', 'Matt.5.3', 'Jer.10.23', 'Acts.17.27', 'Eccl.12.13'] },
  { id: 'fall', color: '#ff9a6b', ru: 'Поломка: что пошло не так', ro: 'Defectul: ce a mers prost',
    tru: 'Бытие 3 — схема любой ошибки: сомнение в добрых намерениях Бога, желание самому решать, что хорошо и что плохо, затем стыд, оправдания и перекладывание вины. Почти каждая беда начинается с мысли «я лучше знаю, что мне хорошо».',
    tro: 'Geneza 3 arată tiparul oricărei greșeli: îndoiala față de intențiile bune ale lui Dumnezeu, dorința de a hotărî singur ce este bine și ce este rău, apoi rușinea, scuzele și aruncarea vinei pe alții. Aproape orice necaz începe cu gândul „eu știu mai bine ce e bine pentru mine”.',
    refs: ['Gen.3.1', 'Gen.3.5', 'Gen.3.6', 'Gen.3.12', 'Gen.3.13', 'Rom.5.12', 'Eccl.7.29'] },
  { id: 'heart', color: '#ff7aa8', ru: 'Диагноз: проблема глубже поступков', ro: 'Diagnosticul: problema e mai adâncă decât faptele',
    tru: 'Сердце обманчиво, и человек не всегда видит свои настоящие мотивы. Иисус показал, что зло начинается с мысли: гнев раньше убийства, желание раньше измены. Поэтому менять нужно не только поступки, но и образ мыслей — «обновлять ум» и «облекаться в новую личность».',
    tro: 'Inima este înșelătoare, iar omul nu își vede mereu motivele reale. Isus a arătat că răul începe cu un gând: mânia înaintea crimei, dorința înaintea infidelității. De aceea trebuie schimbate nu doar faptele, ci și felul de a gândi — „înnoirea minții” și „îmbrăcarea noii personalități”.',
    refs: ['Jer.17.9', 'Matt.15.19', 'Matt.5.22', 'Matt.5.28', 'Jas.1.14', 'Jas.1.15', 'Rom.7.19', 'Rom.12.2', 'Col.3.10'] },
  { id: 'repair', color: '#c99bff', ru: 'Ремонт: исправление возможно', ro: 'Repararea: schimbarea este posibilă',
    tru: 'Покаяние — это изменить образ мыслей и повернуться. Давид после тяжёлого греха просит чистого сердца, Пётр после отречения восстановлен. Выкуп показывает: прощение реально и стоит дорого. Библия не говорит «ты хороший» и не говорит «ты безнадёжен» — она говорит «ты можешь измениться».',
    tro: 'Căința înseamnă să-ți schimbi felul de a gândi și să te întorci. David, după un păcat grav, cere o inimă curată, iar Petru, după ce s-a lepădat, este restabilit. Răscumpărarea arată că iertarea este reală și are un preț mare. Biblia nu spune „ești bun” și nici „ești fără speranță”, ci „te poți schimba”.',
    refs: ['Ps.51.10', 'Ps.51.17', 'Isa.1.18', 'Acts.3.19', 'Matt.20.28', '1John.1.9', 'Ps.103.12', 'Luke.15.20', 'John.21.17'] },
  { id: 'rules', color: '#7fb8ff', ru: 'Правила: заповеди как законы жизни', ro: 'Regulile: poruncile ca legi ale vieții',
    tru: 'Закон Бога назван «совершенным законом свободы». Инструкция к самолёту не мешает пилоту, а помогает ему не разбиться — так и заповеди описывают, как устроен человек. Честность хранит доверие, верность хранит семью, прощение освобождает. Любовь в Библии — это поведение: терпение, доброта, отказ от зависти и от счёта обид.',
    tro: 'Legea lui Dumnezeu este numită „legea desăvârșită a libertății”. Manualul unui avion nu îl încurcă pe pilot, ci îl ajută să nu se prăbușească — la fel, poruncile descriu cum este făcut omul. Cinstea păstrează încrederea, fidelitatea păstrează familia, iertarea eliberează. Iubirea în Biblie este un comportament: răbdare, bunătate, fără invidie și fără a ține socoteala răului.',
    refs: ['Isa.48.17', 'Jas.1.25', 'Ps.19.7', 'Matt.22.37', 'Matt.22.39', 'Matt.7.12', '1Cor.13.4', '1Cor.13.5', '1Cor.13.7', 'Acts.20.35'] },
  { id: 'examples', color: '#6fe0d0', ru: 'Примеры: чужой опыт', ro: 'Exemplele: experiența altora',
    tru: 'Библия учит судьбами людей. Иосиф не озлобился, и зло обратилось в добро. Саул разрушил себя гордостью. Давид упал, но покаялся. Иов страдал не за грехи. Асаф завидовал нечестным, пока не увидел их конец. Чужой опыт учит дешевле собственного.',
    tro: 'Biblia ne învață prin viețile oamenilor. Iosif nu s-a amărât, iar răul s-a transformat în bine. Saul s-a distrus prin mândrie. David a căzut, dar s-a căit. Iov a suferit fără să fi păcătuit. Asaf i-a invidiat pe cei răi până când a văzut sfârșitul lor. Experiența altora ne învață mai ieftin decât a noastră.',
    refs: ['Gen.50.20', '1Sam.15.22', '2Sam.12.13', 'Job.1.21', 'Ps.73.3', 'Ps.73.17', 'Rom.15.4', '1Cor.10.11'] },
  { id: 'habits', color: '#8fe38a', ru: 'Обслуживание: ежедневные привычки', ro: 'Întreținerea: obiceiuri zilnice',
    tru: 'Слово Бога — светильник, который освещает следующий шаг. Молитва меняет тревогу на мир. С кем общаешься, таким и становишься. Жизнь коротка, поэтому важно ценить время. Характер строится из верности в малом, а рост идёт постепенно, как рассвет.',
    tro: 'Cuvântul lui Dumnezeu este o lampă care luminează pasul următor. Rugăciunea schimbă îngrijorarea în pace. Devii asemenea celor cu care te însoțești. Viața este scurtă, de aceea timpul trebuie prețuit. Caracterul se clădește din fidelitate în lucrurile mici, iar creșterea vine treptat, ca lumina dimineții.',
    refs: ['Ps.119.105', 'Ps.1.2', 'Josh.1.8', 'Phil.4.6', 'Phil.4.7', 'Prov.13.20', '1Cor.15.33', 'Ps.90.12', 'Luke.16.10', 'Prov.4.18'] },
  { id: 'trouble', color: '#ffc0e0', ru: 'Неисправности: когда трудно', ro: 'Problemele: când e greu',
    tru: 'Не все беды от Бога: время и непредвиденный случай постигают всех. Гнев не стоит держать до заката. Зависть лечится взглядом на конец пути. Заботы можно передать Богу. А тому, кто чувствует себя ничтожным: даже воробьи не забыты, а вы дороже многих воробьёв.',
    tro: 'Nu toate necazurile vin de la Dumnezeu: timpul și întâmplările neprevăzute îi ajung pe toți. Mânia nu trebuie ținută până la apusul soarelui. Invidia se vindecă privind la sfârșitul drumului. Grijile pot fi aruncate asupra lui Dumnezeu. Iar cine se simte neînsemnat să știe: nici vrăbiile nu sunt uitate, iar noi valorăm mai mult decât multe vrăbii.',
    refs: ['Jas.1.13', 'Eccl.9.11', 'Eph.4.26', 'Ps.55.22', '1Pet.5.7', 'Ps.34.18', 'Isa.41.10', 'Matt.10.29', 'Matt.10.31'] },
  { id: 'goal', color: '#ffe9a8', ru: 'Цель: чем всё закончится', ro: 'Ținta: cum se va sfârși totul',
    tru: 'Инструкция заканчивается обещанием: мир будет восстановлен таким, каким был задуман, — без слёз, боли и смерти, кроткие унаследуют землю. Надежда меняет поведение уже сейчас: кто знает, чем всё закончится, иначе переносит трудности и иначе принимает решения.',
    tro: 'Manualul se încheie cu o promisiune: lumea va fi readusă la ce a fost gândită să fie — fără lacrimi, durere și moarte, iar cei blânzi vor moșteni pământul. Speranța schimbă purtarea chiar de acum: cine știe cum se va sfârși totul trece altfel prin greutăți și ia altfel deciziile.',
    refs: ['Matt.6.10', 'Ps.37.11', 'Ps.37.29', 'Isa.11.9', 'Isa.65.21', 'Isa.25.8', 'Rev.21.3', 'Rev.21.4', 'John.17.3', 'Heb.6.19'] },
];
const lessonName = (l) => l[LANG] || l.ru;
const lessonText = (l) => (LANG === 'ro' ? l.tro : l.tru);

// Созвездие на небе: стихи соединяются линией, над ними подпись.
function drawConstellation(name, verses, color) {
  const grp = new THREE.Group();
  const pts = [];
  for (const r of verses) {
    const it = galaxy.items[r.bi];
    if (!it) continue;
    const k = BOOKS[r.bi].chStart[r.ci] + r.vi;
    pts.push(new THREE.Vector3(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]));
  }
  if (!pts.length) return null;
  const seg = [];
  for (let i = 1; i < pts.length; i++) seg.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
  grp.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));
  for (const p of pts) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p);
    s.scale.setScalar(2.8);
    grp.add(s);
  }
  const lbl = makeLabel(name.toUpperCase(), { font: FONT_TITLE, px: 96, weight: 600, color, height: 3.2, letter: 12 });
  lbl.position.copy(pts[0]).sub(EYE).multiplyScalar(0.92).add(EYE).add(new THREE.Vector3(0, 4, 0));
  grp.add(lbl);
  if (!renderer.xr.isPresenting) { const d = pts[0].clone().sub(EYE); look.target = Math.atan2(d.x, -d.z); }
  return grp;
}

function showLessons() {
  const L = T();
  const items = LESSONS.map((l, i) => ({ label: `${i + 1}. ${lessonName(l)}`, sub: lessonText(l).split(/(?<=[.!?])\s/)[0], vi: null, onClick: () => showLesson(i) }));
  const extra = el2('div', 'actions');
  const all = el2('button', 'btn primary', L.lessonsListenAll); all.type = 'button';
  all.addEventListener('click', () => listenLessons(0, true));
  extra.append(all);
  openList('lessons', L.lessons, L.lessonsNote, items, extra);
}

async function showLesson(i) {
  const l = LESSONS[i], L = T();
  const verses = l.refs.map(fromRef).filter(Boolean);
  if (state.mode !== 'galaxy') await go('galaxy');
  setGalaxyLayer('lesson', drawConstellation(lessonName(l), verses, l.color));
  const extra = el2('div', 'lesson');
  extra.append(el2('p', 'lesson-text', lessonText(l)));
  const acts = el2('div', 'actions wrap');
  const lis = el2('button', 'btn primary', L.lessonListen); lis.type = 'button';
  lis.addEventListener('click', () => listenLessons(i, false));
  acts.append(lis);
  if (i > 0) { const p = el2('button', 'btn', `◀ ${i}`); p.type = 'button'; p.addEventListener('click', () => showLesson(i - 1)); acts.append(p); }
  if (i < LESSONS.length - 1) { const n = el2('button', 'btn', `${i + 2} ▶`); n.type = 'button'; n.addEventListener('click', () => showLesson(i + 1)); acts.append(n); }
  const back = el2('button', 'btn', L.lessonsAll); back.type = 'button'; back.addEventListener('click', showLessons); acts.append(back);
  extra.append(acts);
  if (i === LESSONS.length - 1) extra.append(el2('p', 'lesson-main', L.lessonsMain));
  openList('lesson', `${i + 1} / ${LESSONS.length} · ${lessonName(l)}`, '', verses, extra);
}

// Урок вслух: объяснение и стихи. «Слушать все» идёт по ступеням подряд и показывает каждую на небе.
function lessonSpeech(l) {
  const verses = l.refs.map(fromRef).filter(Boolean);
  return `${lessonName(l)}. ${lessonText(l)} ${verses.map((r) => `${refSpeech(r)}. ${plain(verseText(r.bi, r.ci, r.vi))}`).join(' ')}`;
}
function refSpeech(r) { return `${BOOKS[r.bi].name}, ${T().chapter(r.ci + 1).toLowerCase()}, ${r.vi + 1}`; }
async function listenLessons(i, chain) {
  stopReading(); stopNarration();
  const l = LESSONS[i];
  if (chain) await showLesson(i);
  narration.on = true;
  const ok = speak(lessonSpeech(l), () => {
    narration.on = false;
    if (chain && i + 1 < LESSONS.length) listenLessons(i + 1, true);
  });
  if (!ok) narration.on = false;
}


/* ---------- Пророчества: предсказание → исполнение, с объяснением ---------- */
const PROPH_GROUPS = [
  { id: 'messiah', ru: 'О Мессии', ro: 'Despre Mesia', color: '#ffd27a', kind: 'done' },
  { id: 'nations', ru: 'Народы и города', ro: 'Popoare și orașe', color: '#ff9a6b', kind: 'done' },
  { id: 'israel', ru: 'Израиль и Иерусалим', ro: 'Israel și Ierusalim', color: '#7fb8ff', kind: 'done' },
  { id: 'lastdays', ru: 'Последние дни', ro: 'Zilele din urmă', color: '#ff7aa8', kind: 'sign' },
  { id: 'future', ru: 'Обещания о будущем', ro: 'Promisiuni pentru viitor', color: '#8fe38a', kind: 'promise' },
];
let PROPH = null;
const prophState = { group: 'messiah' };
async function loadProph() {
  if (!PROPH) { try { const r = await fetch('data/prophecies.json'); if (r.ok) PROPH = await r.json(); } catch { /* нет файла */ } }
  return PROPH;
}
const prophItems = (g) => (PROPH ? PROPH.items.filter((x) => x.group === g) : []);
const prophGroup = (g) => PROPH_GROUPS.find((x) => x.id === g) || PROPH_GROUPS[0];
const prophTitle = (it) => it[LANG] || it.ru;
const prophText = (it) => (LANG === 'ro' ? it.tro : it.tru) || it.tru;
const prophWhen = (it) => (LANG === 'ro' ? it.when_ro : it.when_ru) || '';
const refsOf = (list) => (list || []).map(fromRef).filter(Boolean);

async function openProphecies(group) {
  await loadProph();
  if (group) prophState.group = group;
  closeList(); closeDetail();
  renderProph();
}
function closeProph() { ui.prophPanel.hidden = true; }

function verseBtn(r) {
  const b = el2('button', 'pverse'); b.type = 'button';
  b.append(el2('span', 'r', refOf(r.bi, r.ci, r.vi)), el2('span', 't', plain(verseText(r.bi, r.ci, r.vi))));
  b.addEventListener('click', () => { closeProph(); jumpTo(r); });
  return b;
}
function renderProph() {
  const L = T(), box = ui.prophPanel;
  box.replaceChildren();
  const close = el2('button', 'close', '✕'); close.type = 'button'; close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', closeProph);
  box.append(close, el2('h2', 'p-title', L.prophecies));
  if (!PROPH) { box.append(el2('p', 'muted', L.prophNone)); box.hidden = false; placeProph(); return; }
  box.append(el2('p', 'p-note', L.prophNote(PROPH.items.length)));
  // Разделы
  const tabs = el2('div', 'p-tabs');
  for (const g of PROPH_GROUPS) {
    const n = prophItems(g.id).length;
    if (!n) continue;
    const b = el2('button', 'p-tab' + (g.id === prophState.group ? ' on' : '')); b.type = 'button';
    const dot = el2('span', 'dot'); dot.style.background = g.color;
    b.append(dot, document.createTextNode(`${g[LANG] || g.ru} · ${n}`));
    b.addEventListener('click', () => { prophState.group = g.id; renderProph(); box.scrollTop = 0; });
    tabs.append(b);
  }
  box.append(tabs);
  const grp = prophGroup(prophState.group), items = prophItems(grp.id);
  const acts = el2('div', 'actions wrap');
  const all = el2('button', 'btn primary', L.prophListenAll); all.type = 'button';
  all.addEventListener('click', () => listenProph(grp.id, 0, true));
  const sky2 = el2('button', 'btn', L.prophSkyAll); sky2.type = 'button';
  sky2.addEventListener('click', () => showProphOnSky(items, grp, `${L.prophecies}: ${grp[LANG] || grp.ru}`));
  acts.append(all, sky2);
  box.append(acts);
  // Карточки
  const badge = { done: L.prophDone, sign: L.prophSign, promise: L.prophPromise }[grp.kind];
  items.forEach((it, i) => {
    const card = el2('article', 'pcard'); card.id = `p-${it.id}`;
    card.style.setProperty('--pc', grp.color);
    const head = el2('div', 'p-head');
    head.append(el2('span', 'p-badge', it.status === 'ongoing' ? L.prophOngoing : badge), el2('h3', '', prophTitle(it)));
    card.append(head);
    const when = prophWhen(it);
    if (when) card.append(el2('div', 'p-when', when));
    const pr = refsOf(it.p), fr = refsOf(it.f);
    if (pr.length) { card.append(el2('div', 'p-lbl', grp.kind === 'done' ? L.prophForetold : L.prophSays)); pr.forEach((r) => card.append(verseBtn(r))); }
    if (fr.length) { card.append(el2('div', 'p-lbl', grp.kind === 'done' ? L.prophFulfilled : L.prophAlso)); fr.forEach((r) => card.append(verseBtn(r))); }
    else if (grp.kind === 'done') card.append(el2('div', 'p-lbl', `${L.prophFulfilled}: ${L.prophHistory}`));
    card.append(el2('p', 'p-text', prophText(it)));
    const a2 = el2('div', 'actions wrap');
    const lis = el2('button', 'btn', L.prophListen); lis.type = 'button';
    lis.addEventListener('click', () => listenProph(grp.id, i, false));
    const sk = el2('button', 'btn', L.prophSky); sk.type = 'button';
    sk.addEventListener('click', () => showProphOnSky([it], grp, prophTitle(it)));
    a2.append(lis, sk);
    card.append(a2);
    box.append(card);
  });
  box.hidden = false;
  placeProph();
}
function placeProph() {
  ui.prophPanel.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 8)}px`;
}
addEventListener('resize', () => { if (!ui.prophPanel.hidden) placeProph(); });

// Небо: дуга от звезды пророчества к звезде исполнения (для обещаний — звёзды связанных мест)
function starPos(r) {
  const it = galaxy.items[r.bi];
  if (!it) return null;
  const k = BOOKS[r.bi].chStart[r.ci] + r.vi;
  return new THREE.Vector3(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]);
}
async function showProphOnSky(items, grp, title) {
  closeProph();
  if (state.mode !== 'galaxy') await go('galaxy');
  const all = new THREE.Group();
  const curves = [];
  const verses = [];
  let first = null;
  for (const it of items) {
    const pr = refsOf(it.p), fr = refsOf(it.f);
    verses.push(...pr, ...fr);
    const a = pr.length && starPos(pr[0]);
    if (!a) continue;
    first = first || a;
    const targets = (fr.length ? fr : pr.slice(1)).map(starPos).filter(Boolean).map((p) => ({ p, w: 1 }));
    if (targets.length) { const arc = buildArcObject(a, targets, grp.color); curves.push(...arc.userData.curves); all.add(arc); }
    for (const p of [a, ...targets.map((t) => t.p)]) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: grp.color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.copy(p); s.scale.setScalar(2.4); all.add(s);
    }
  }
  all.userData.curves = curves;
  setGalaxyLayer('proph', all);
  if (first && !renderer.xr.isPresenting) { const d = first.clone().sub(EYE); look.target = Math.atan2(d.x, -d.z); }
  const back = el2('div', 'actions');
  const b = el2('button', 'btn primary', T().prophBack); b.type = 'button';
  b.addEventListener('click', () => { setGalaxyLayer('proph', null); openProphecies(); });
  back.append(b);
  openList('proph', title, items.length === 1 ? prophText(items[0]) : T().prophSkyNote, verses.slice(0, 80), back);
}

// Вслух: название, объяснение и стихи; «Слушать все» идёт по разделу подряд (и в фоне)
function prophSpeech(it) {
  const vs = [...refsOf(it.p), ...refsOf(it.f)];
  return `${prophTitle(it)}. ${prophText(it)} ${vs.map((r) => `${refSpeech(r)}. ${plain(verseText(r.bi, r.ci, r.vi))}`).join(' ')}`;
}
function listenProph(group, i, chain) {
  const items = prophItems(group);
  const it = items[i];
  if (!it) return;
  stopReading(); stopNarration();
  const card = document.getElementById(`p-${it.id}`);
  document.querySelectorAll('.pcard.now').forEach((c) => c.classList.remove('now'));
  if (card) { card.classList.add('now'); if (!isBg()) card.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  narration.on = true;
  const ok = speak(prophSpeech(it), () => {
    narration.on = false;
    if (card) card.classList.remove('now');
    if (chain && i + 1 < items.length) listenProph(group, i + 1, true);
  });
  if (!ok) narration.on = false;
}

/* ---------- Аудио-Библия: записи глав с устройства пользователя ---------- */
// Файлы вида nwt_01_Ge_U_01.mp3 (книга 01, язык U — русский, M — румынский, глава 01).
// Записи хранятся только на этом устройстве (отдельная база IndexedDB), в программу не встраиваются.
const AUDIO_LANGS = { U: 'ru', M: 'ro' };
const ALIGN_VERSION = 1;
const adb = {
  dbp: null,
  open() {
    this.dbp = this.dbp || new Promise((res, rej) => {
      const r = indexedDB.open('bible-audio', 1);
      r.onupgradeneeded = () => { const db = r.result; db.createObjectStore('files'); db.createObjectStore('times'); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return this.dbp;
  },
  async req(store, mode, fn) {
    try {
      const db = await this.open();
      return await new Promise((res) => {
        const tx = db.transaction(store, mode);
        const q = fn(tx.objectStore(store));
        q.onsuccess = () => res(q.result ?? null);
        q.onerror = () => res(null);
      });
    } catch { return null; }
  },
  get(store, k) { return this.req(store, 'readonly', (s) => s.get(k)); },
  set(store, k, v) { return this.req(store, 'readwrite', (s) => s.put(v, k)); },
  keys(store) { return this.req(store, 'readonly', (s) => s.getAllKeys()); },
  clear(store) { return this.req(store, 'readwrite', (s) => s.clear()); },
};
const audioIndex = { ru: new Set(), ro: new Set() };
const audioKey = (lang, bookNum, ch) => `${lang}:${bookNum}:${ch}`;
async function loadAudioIndex() {
  const keys = (await adb.keys('files')) || [];
  audioIndex.ru = new Set(); audioIndex.ro = new Set();
  for (const k of keys) { const [l, b, c] = String(k).split(':'); if (audioIndex[l]) audioIndex[l].add(`${b}:${c}`); }
}
// Номер книги 1–66 по коду книги (Gen → 1 … Rev → 66)
const bookNumOf = (bi) => (BOOKS[bi] && BOOKS[bi].code ? CODE_NUM[BOOKS[bi].code] : null);
function hasAudio(bi, ci) {
  const n = bookNumOf(bi);
  return !!n && settings.useAudio !== false && audioIndex[LANG] && audioIndex[LANG].has(`${n}:${ci + 1}`);
}
function parseAudioName(name) {
  const m = String(name).match(/nwt_(\d{1,2})_[^_\/\\]+_([A-Z]{1,3})(?:_(\d{1,3}))?\.mp3$/i);
  if (!m) return null;
  const lang = AUDIO_LANGS[m[2].toUpperCase()];
  const book = +m[1], ch = m[3] ? +m[3] : 1;
  if (!lang || book < 1 || book > 66 || ch < 1) return null;
  return { lang, book, ch };
}
async function importAudio(files) {
  const L = T();
  const list = [...files].map((f) => ({ f, p: parseAudioName(f.name) })).filter((x) => x.p);
  const skipped = files.length - list.length;
  if (!list.length) { toast(L.audioNone, 9000); return; }
  let done = 0, failed = 0;
  for (const { f, p } of list) {
    const ok = await adb.set('files', audioKey(p.lang, p.book, p.ch), f);
    if (ok === null && ++failed >= 3) { toast(L.audioFull, 12000); break; }
    done++;
    if (done % 20 === 0 || done === list.length) toast(L.audioSaving(done, list.length), 4000);
  }
  await loadAudioIndex();
  const langs = [...new Set(list.map((x) => x.p.lang))];
  toast(L.audioSaved(list.length, langs.map((l) => l.toUpperCase()).join(', '), skipped), 10000);
  if (ui.listPanel.dataset.kind === 'audio') showAudioPanel();
  if (state.mode === 'chapter') updateListenButton();
}

// Панель «Аудио-Библия»: сколько записей, какие главы без записи, загрузка и удаление
function missingChapters(lang) {
  const set = audioIndex[lang], out = [];
  BOOKS.forEach((b, bi) => {
    const n = bookNumOf(bi); if (!n) return;
    const miss = [];
    b.chapters.forEach((_, ci) => { if (!set.has(`${n}:${ci + 1}`)) miss.push(ci + 1); });
    if (miss.length) out.push({ bi, miss, all: miss.length === b.chapters.length });
  });
  return out;
}
function showAudioPanel() {
  const L = T();
  const total = BOOKS.reduce((a, b) => a + b.chapters.length, 0);
  const have = audioIndex[LANG].size;
  const box = el2('div', 'audio-box');
  box.append(el2('p', 'lesson-text', L.audioStatus(have, total)));
  const acts = el2('div', 'actions wrap');
  const dirBtn = el2('button', 'btn primary', L.audioPickFolder); dirBtn.type = 'button';
  dirBtn.addEventListener('click', () => { ui.audioDir.value = ''; ui.audioDir.click(); });
  const fBtn = el2('button', 'btn', L.audioPickFiles); fBtn.type = 'button';
  fBtn.addEventListener('click', () => { ui.audioFiles.value = ''; ui.audioFiles.click(); });
  acts.append(dirBtn, fBtn);
  box.append(acts);
  const useRow = el2('label', 'set-row');
  const use = el2('input'); use.type = 'checkbox'; use.checked = settings.useAudio !== false;
  use.addEventListener('change', () => { settings.useAudio = use.checked; saveSettings(); updateListenButton(); });
  useRow.append(use, el2('span', '', L.audioUse));
  box.append(useRow);
  if (have) {
    const miss = missingChapters(LANG);
    if (miss.length) {
      box.append(el2('h3', '', L.audioMissing(total - have)));
      const p = el2('p', 'muted small');
      p.textContent = miss.map((m) => `${BOOKS[m.bi].short} ${m.all ? L.audioWhole : m.miss.join(', ')}`).join('; ');
      box.append(p);
    }
    const del = el2('button', 'btn danger', L.audioDelete); del.type = 'button';
    del.addEventListener('click', async () => {
      if (!confirm(L.audioDeleteQ)) return;
      stopReading(); await adb.clear('files'); await adb.clear('times'); await loadAudioIndex(); showAudioPanel();
    });
    box.append(el2('div', 'actions'));
    box.lastChild.append(del);
  }
  box.append(el2('p', 'muted small', L.audioNote));
  openList('audio', L.audioTitle, '', [], box);
}

// Поиск начала каждого стиха в записи: паузы чтеца + длина стихов (стихи читаются примерно с одной скоростью).
async function decodeMono(blob) {
  const SR = 8000;
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new Ctx(1, SR, SR);
  const ab = await ctx.decodeAudioData(await blob.arrayBuffer());
  return { data: ab.getChannelData(0), sr: ab.sampleRate };
}
function alignVerses(data, sr, items) {
  const FR = Math.round(sr * 0.02), db = [];
  for (let i = 0; i + FR <= data.length; i += FR) {
    let s = 0;
    for (let j = i; j < i + FR; j++) s += data[j] * data[j];
    db.push(10 * Math.log10(s / FR + 1e-10));
  }
  const srt = [...db].sort((a, b) => a - b);
  const lo = srt[Math.floor(srt.length * 0.1)], hi = srt[Math.floor(srt.length * 0.9)];
  const th = lo + (hi - lo) * 0.3;
  const sil = [];
  let st = -1;
  for (let i = 0; i <= db.length; i++) {
    const quiet = i < db.length && db[i] < th;
    if (quiet && st < 0) st = i;
    if (!quiet && st >= 0) { const L = (i - st) * 0.02; if (L >= 0.2) sil.push([((st + i) / 2) * 0.02, L]); st = -1; }
  }
  let a0 = db.findIndex((d) => d >= th); if (a0 < 0) a0 = 0;
  let a1 = db.length - 1; while (a1 > 0 && db[a1] < th) a1--;
  const s0 = a0 * 0.02, s1 = (a1 + 1) * 0.02, span = Math.max(1, s1 - s0);
  const w = items.map((t) => t.length + 12), sumW = w.reduce((a, b) => a + b, 0), rate = sumW / span;
  const pts = [s0], plen = [0];
  for (const [t, L] of sil) if (t > s0 + 0.5 && t < s1 - 0.5) { pts.push(t); plen.push(L); }
  pts.push(s1); plen.push(0);
  const P = pts.length, M = items.length, INF = 1e18;
  let prev = new Float64Array(P).fill(INF); prev[0] = 0;
  const back = [];
  for (let k = 1; k <= M; k++) {
    const e = w[k - 1] / rate, cur = new Float64Array(P).fill(INF), bk = new Int32Array(P).fill(-1);
    for (let c = 1; c < P; c++) {
      for (let c2 = c - 1; c2 >= 0; c2--) {
        const dur = pts[c] - pts[c2];
        if (dur > e * 3 + 4) break;
        if (prev[c2] >= INF) continue;
        const v = prev[c2] + ((dur - e) / (0.22 * e + 0.8)) ** 2 - 1.2 * Math.min(plen[c], 1.6);
        if (v < cur[c]) { cur[c] = v; bk[c] = c2; }
      }
    }
    back.push(bk); prev = cur;
  }
  if (prev[P - 1] >= INF) {
    // запасной вариант: по длине стихов
    const out = []; let acc = 0;
    for (let k = 0; k < M; k++) { out.push(s0 + (span * acc) / sumW); acc += w[k]; }
    return out;
  }
  const path = [P - 1];
  let c = P - 1;
  for (let k = M - 1; k >= 0; k--) { c = back[k][c]; path.push(c); }
  path.reverse();
  return path.slice(0, M).map((i) => pts[i]); // начало каждого элемента (заголовок, стих 1, стих 2, …)
}
async function chapterTimes(bi, ci, blob) {
  const key = audioKey(LANG, bookNumOf(bi), ci + 1);
  const cached = await adb.get('times', key);
  const n = BOOKS[bi].chapters[ci].length;
  if (cached && cached.v === ALIGN_VERSION && cached.t.length === n + 1) return cached.t;
  let t;
  try {
    const { data, sr } = await decodeMono(blob);
    const items = [plain(chapterHeading(bi, ci)), ...BOOKS[bi].chapters[ci].map((v) => plain(v))];
    t = alignVerses(data, sr, items);
  } catch (err) {
    console.warn('align', err);
    t = null;
  }
  if (t) await adb.set('times', key, { v: ALIGN_VERSION, t });
  return t;
}

// Воспроизведение записи главы с нужного стиха; подсветка идёт за временем записи.
const aplayer = { el: null, url: '', token: 0, times: null, bi: -1, ci: -1, vi: -1 };
function audioEl() {
  if (!aplayer.el) {
    aplayer.el = new Audio();
    aplayer.el.preload = 'auto';
    aplayer.el.addEventListener('timeupdate', () => {
      const t = aplayer.times, a = aplayer.el;
      if (!t || !tts.reading || tts.reading.bi !== aplayer.bi || tts.reading.ci !== aplayer.ci) return;
      let v = 0;
      for (let i = 1; i < t.length; i++) if (a.currentTime + 0.15 >= t[i]) v = i - 1;
      if (v !== aplayer.vi) { aplayer.vi = v; showReadingVerse(v); }
    });
  }
  return aplayer.el;
}
async function audioReadFrom(vi, bi, ci) {
  const my = ++aplayer.token;
  const blob = await adb.get('files', audioKey(LANG, bookNumOf(bi), ci + 1));
  if (my !== aplayer.token || !tts.reading) return;
  if (!blob) { audioIndex[LANG].delete(`${bookNumOf(bi)}:${ci + 1}`); readFrom(vi, { bi, ci }); return; }
  const a = audioEl();
  if (aplayer.url) URL.revokeObjectURL(aplayer.url);
  aplayer.url = URL.createObjectURL(blob);
  a.src = aplayer.url;
  aplayer.bi = bi; aplayer.ci = ci; aplayer.vi = -1;
  aplayer.times = null;
  a.playbackRate = Math.max(0.6, Math.min(1.6, (settings.rate || 0.92) / 0.92));
  if (window.AndroidTTS && window.AndroidTTS.audioSession) window.AndroidTTS.audioSession(true, `${BOOKS[bi].name} ${ci + 1}`, T().stopReading);
  a.onended = () => { if (my === aplayer.token && tts.reading) chapterDone(bi, ci); };
  if (vi > 0) {
    if (!aplayer.timesNote) { aplayer.timesNote = true; toast(T().audioAligning, 4000); }
    aplayer.times = await chapterTimes(bi, ci, blob);
    if (my !== aplayer.token || !tts.reading) return;
    if (aplayer.times) a.currentTime = aplayer.times[vi + 1];
  }
  try { await a.play(); } catch (err) { console.warn('audio', err); }
  showReadingVerse(vi);
  if (!aplayer.times) chapterTimes(bi, ci, blob).then((t) => { if (my === aplayer.token) aplayer.times = t; });
}
// keepSession: при переходе к следующей главе служба «Чтение вслух» в APK не гасится (из фона её не запустить заново)
function stopAudio(keepSession) {
  aplayer.token++;
  if (aplayer.el) { aplayer.el.pause(); aplayer.el.onended = null; }
  if (!keepSession && window.AndroidTTS && window.AndroidTTS.audioSession) window.AndroidTTS.audioSession(false, '', '');
}
// Выбор папки или файлов
ui.audioDir.addEventListener('change', () => importAudio(ui.audioDir.files));
ui.audioFiles.addEventListener('change', () => importAudio(ui.audioFiles.files));
ui.audioBtn.addEventListener('click', () => { loadAudioIndex().then(showAudioPanel); });
loadAudioIndex();

/* Пункты меню */
ui.lessonsBtn.addEventListener('click', showLessons);
ui.prophBtn.addEventListener('click', () => openProphecies());
ui.notesBtn.addEventListener('click', showNotes);
ui.mapBtn.addEventListener('click', () => openMap());
ui.eventsBtn.addEventListener('click', showEvents);
ui.planBtn.addEventListener('click', showPlan);
ui.trailBtn.addEventListener('click', showTrail);
ui.musicBtn.addEventListener('click', toggleMusic);
ui.quiet.addEventListener('click', enterQuiet);
ui.quietExit.addEventListener('click', exitQuiet);


/* ---------- Объяснения и связи: краткие содержания, люди, понятия, меры, параллели, цитаты ---------- */

let SUMMARIES = null, FIGURES = null, FACTS = null, PARALLELS = null, OTQ = null, GLOSSARY = null;
async function loadKnowledge() {
  const get = async (f) => { try { const r = await fetch(`data/${f}`); return r.ok ? await r.json() : null; } catch { return null; } };
  [SUMMARIES, FIGURES, FACTS, PARALLELS, OTQ, GLOSSARY] = await Promise.all(['summaries.json', 'figures.json', 'facts.json', 'parallels.json', 'otquotes.json', 'glossary.json'].map(get));
  buildKnowledgeIndex();
  if (state.mode === 'chapter') renderChapterInfo();
  if (detail.open && !renderer.xr.isPresenting) selectVerse(detail.vi);
}
const pick2 = (o) => (o ? o[LANG] || o.ru : '');
function chapterSummary(bi, ci) {
  const b = BOOKS[bi];
  const s = SUMMARIES && b.code && SUMMARIES[b.code] && SUMMARIES[b.code][ci + 1];
  return s ? pick2(s) : '';
}

// Люди: поиск имён в тексте (с ограничением по книгам для одинаковых имён).
const figRe = {};
function figureRegex(f) {
  const k = f.id + LANG;
  if (!figRe[k]) {
    const st = (LANG === 'ro' ? f.re_ro : f.re_ru) || f.re_ru || [];
    try { figRe[k] = st.length ? new RegExp(`(?:^|[^\\p{L}])(?:${st.join('|')})`, 'u') : null; } catch { figRe[k] = null; }
  }
  return figRe[k];
}
function figuresIn(bi, text) {
  if (!FIGURES) return [];
  const code = BOOKS[bi].code;
  const t = noAcc(text);
  return FIGURES.figures.filter((f) => (!f.books || f.books.includes(code)) && figureRegex(f) && figureRegex(f).test(t));
}
const chapterFigCache = {};
function figuresInChapter(bi, ci) {
  const k = `${LANG}:${bi}:${ci}:${BOOKS.length}`;
  if (!chapterFigCache[k]) chapterFigCache[k] = figuresIn(bi, BOOKS[bi].chapters[ci].join(' '));
  return chapterFigCache[k];
}
function showFigure(f) {
  const L = T();
  const re = figureRegex(f);
  const res = [];
  if (re) BOOKS.forEach((b) => { if (f.books && !f.books.includes(b.code)) return; b.chapters.forEach((c, ci) => c.forEach((v, vi) => { if (res.length < 300 && re.test(noAcc(v))) res.push({ bi: b.i, ci, vi }); })); });
  const name = LANG === 'ro' ? f.ro : f.ru;
  openList('person', name, `${LANG === 'ro' ? f.bio_ro : f.bio_ru} ${L.mentions(res.length)}`, res.slice(0, 150));
}

// Понятия
const termRe = {};
function termsIn(text) {
  if (!GLOSSARY) return [];
  return GLOSSARY.terms.filter((t) => {
    const k = t.id + LANG;
    if (termRe[k] === undefined) {
      const st = (LANG === 'ro' ? t.re_ro : t.re_ru) || [];
      try { termRe[k] = st.length ? new RegExp(`(?:^|[^\\p{L}])(?:${st.join('|')})`, 'iu') : null; } catch { termRe[k] = null; }
    }
    return termRe[k] && termRe[k].test(noAcc(text));
  }).slice(0, 6);
}

// Меры, вес, деньги: перевод в привычные единицы.
const MEASURES = [
  { re_ru: 'локт|локот|локоть', re_ro: 'co[tț]i?(?![a-zăâîșț])|cubi', ru: 'Локоть ≈ 44,5 см (длина от локтя до кончиков пальцев)', ro: 'Cot ≈ 44,5 cm (de la cot până la vârful degetelor)' },
  { re_ru: 'пяд', re_ro: 'palm[ăe] de mân|lat de palm', ru: 'Пядь ≈ 22 см (половина локтя)', ro: 'Palmă ≈ 22 cm (jumătate de cot)' },
  { re_ru: 'стади(?:й|я|ев|ям|ях)', re_ro: 'stadi', ru: 'Стадий ≈ 185 м', ro: 'Stadiu ≈ 185 m' },
  { re_ru: 'мил(?:ю|и|ь)(?![а-яё])', re_ro: 'mil[ăe](?![a-zăâîșț])', ru: 'Римская миля ≈ 1,5 км', ro: 'Milă romană ≈ 1,5 km' },
  { re_ru: 'шекел|сикл', re_ro: 'siclu|sicli|șechel', ru: 'Шекель (сикль) ≈ 11,4 г серебра', ro: 'Siclu ≈ 11,4 g de argint' },
  { re_ru: 'талант', re_ro: 'talan[tț]', ru: 'Талант ≈ 34 кг (3 000 шекелей)', ro: 'Talant ≈ 34 kg (3.000 de sicli)' },
  { re_ru: 'мин(?:а|ы|ам|ах)(?![а-яё])', re_ro: 'mine(?![a-zăâîșț])|mina(?![a-zăâîșț])', ru: 'Мина ≈ 570 г (50 шекелей)', ro: 'Mina ≈ 570 g (50 de sicli)' },
  { re_ru: 'гер(?:а|ы|ам|ах)(?![а-яё])', re_ro: 'ghera|ghere', ru: 'Гера ≈ 0,57 г (1/20 шекеля)', ro: 'Ghera ≈ 0,57 g (1/20 dintr-un siclu)' },
  { re_ru: 'ефа|ефы|ефу|эфа|эфы|эфу', re_ro: 'ef[ăe](?![a-zăâîșț])', ru: 'Ефа ≈ 22 л (сыпучие продукты)', ro: 'Efă ≈ 22 l (pentru cereale)' },
  { re_ru: 'бат(?:а|ов|ам)?(?![а-яё])', re_ro: 'ba[tț]i?(?![a-zăâîșț])', ru: 'Бат ≈ 22 л (жидкости)', ro: 'Bat ≈ 22 l (pentru lichide)' },
  { re_ru: 'гомер|хомер', re_ro: 'homer', ru: 'Гомер ≈ 220 л', ro: 'Homer ≈ 220 l' },
  { re_ru: 'омер', re_ro: 'omer', ru: 'Омер ≈ 2,2 л', ro: 'Omer ≈ 2,2 l' },
  { re_ru: 'хин(?:а|ов)?(?![а-яё])', re_ro: 'hin(?![a-zăâîșț])', ru: 'Хин ≈ 3,7 л', ro: 'Hin ≈ 3,7 l' },
  { re_ru: 'денари', re_ro: 'dinar', ru: 'Денарий — дневная плата работника', ro: 'Dinar — plata unui lucrător pentru o zi' },
  { re_ru: 'драхм', re_ro: 'drahm', ru: 'Драхма ≈ денарий, дневная плата', ro: 'Drahmă ≈ un dinar, plata pentru o zi' },
  { re_ru: 'лепт', re_ro: 'lept', ru: 'Лепта — самая мелкая монета, 1/128 денария', ro: 'Lepta — cea mai mică monedă, 1/128 dintr-un dinar' },
  { re_ru: 'кодрант', re_ro: 'codrant', ru: 'Кодрант — 1/64 денария', ro: 'Codrant — 1/64 dintr-un dinar' },
  { re_ru: 'статир', re_ro: 'stater', ru: 'Статир ≈ 4 драхмы', ro: 'Stater ≈ 4 drahme' },
];
const measRe = {};
function measuresIn(text) {
  return MEASURES.filter((m, i) => {
    const k = i + LANG;
    if (!measRe[k]) measRe[k] = new RegExp(`(?:^|[^\\p{L}])(?:${LANG === 'ro' ? m.re_ro : m.re_ru})`, 'iu');
    return measRe[k].test(noAcc(text));
  }).map((m) => pick2(m));
}

// Индексы параллелей Евангелий и цитат Ветхого Завета.
let parallelIndex = {}, quoteIndex = {};
function rangeKeys(code, range) {
  const out = [];
  const m = range.match(/^(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?$/);
  if (!m) return out;
  const c1 = +m[1], v1 = +m[2], c2 = m[3] ? +m[3] : c1, v2 = m[4] ? +m[4] : v1;
  for (let c = c1; c <= c2; c++) {
    const bi = CODE_TO_BI[code];
    const len = bi != null && BOOKS[bi].chapters[c - 1] ? BOOKS[bi].chapters[c - 1].length : 200;
    for (let v = c === c1 ? v1 : 1; v <= (c === c2 ? v2 : len); v++) out.push(`${code}.${c}.${v}`);
  }
  return out;
}
function buildKnowledgeIndex() {
  parallelIndex = {}; quoteIndex = {};
  if (PARALLELS) PARALLELS.events.forEach((ev, i) => { for (const [code, r] of Object.entries(ev.refs)) for (const k of rangeKeys(code, r)) (parallelIndex[k] = parallelIndex[k] || []).push(i); });
  if (OTQ) OTQ.quotes.forEach((q) => {
    (quoteIndex[q.nt] = quoteIndex[q.nt] || []).push({ other: q.ot, kind: q.kind, dir: 'from' });
    (quoteIndex[q.ot] = quoteIndex[q.ot] || []).push({ other: q.nt, kind: q.kind, dir: 'to' });
  });
}
function quotesFor(bi, ci, vi) {
  return (quoteIndex[refKey(bi, ci, vi)] || []).map((q) => ({ ...q, r: fromRef(q.other) })).filter((q) => q.r);
}
function parallelsFor(bi, ci, vi) {
  return [...new Set(parallelIndex[refKey(bi, ci, vi)] || [])].map((i) => PARALLELS.events[i]);
}
function showParallel(ev) {
  const L = T(), box = ui.parallelPanel;
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button'; close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', () => { box.hidden = true; });
  box.append(close, el2('h3', '', pick2(ev)));
  const cols = el2('div', 'par-cols');
  for (const [code, range] of Object.entries(ev.refs)) {
    const bi = CODE_TO_BI[code];
    if (bi == null) continue;
    const keys = rangeKeys(code, range);
    const col = el2('div', 'par-col');
    const first = parseKey(keys[0]);
    const head = el2('button', 'par-head', `${BOOKS[bi].name} ${range.replace('.', ':')}`);
    head.type = 'button';
    head.addEventListener('click', () => { box.hidden = true; if (first) jumpTo(first); });
    col.append(head);
    for (const k of keys.slice(0, 60)) {
      const r = parseKey(k);
      if (!r || r.vi == null) continue;
      const p = el2('p');
      p.append(el2('sup', '', String(r.vi + 1)), document.createTextNode(' ' + plain(verseText(r.bi, r.ci, r.vi))));
      col.append(p);
    }
    cols.append(col);
  }
  box.append(cols);
  box.hidden = false;
  box.scrollTop = 0;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}

// Связи главы: с какими книгами глава связана сильнее всего.
function chapterLinks(bi, ci) {
  const counts = new Map();
  BOOKS[bi].chapters[ci].forEach((_, vi) => {
    for (const r of related(bi, ci, vi)) if (r.bi !== bi) counts.set(r.bi, (counts.get(r.bi) || 0) + 1);
    for (const q of quotesFor(bi, ci, vi)) if (q.r.bi !== bi) counts.set(q.r.bi, (counts.get(q.r.bi) || 0) + 2);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b, n]) => ({ bi: b, n }));
}
async function showChapterLinksOnSky(bi, ci) {
  const links = chapterLinks(bi, ci);
  await go('galaxy');
  const src = galaxy.items[bi];
  if (!src) return;
  const k0 = BOOKS[bi].chStart[ci];
  const a = new THREE.Vector3(src.pos[k0 * 3], src.pos[k0 * 3 + 1], src.pos[k0 * 3 + 2]);
  const targets = links.map((l) => ({ p: galaxy.items[l.bi].center.clone(), w: l.n }));
  setGalaxyLayer('chapterLinks', buildArcObject(a, targets, '#f3c35b'));
  if (!renderer.xr.isPresenting) { const d = a.clone().sub(EYE); look.target = Math.atan2(d.x, -d.z); }
  openList('chlinks', T().chLinksTitle(`${BOOKS[bi].short} ${ci + 1}`), '', links.map((l) => ({ bi: l.bi, ci: 0, vi: null, label: `${BOOKS[l.bi].name} · ${T().linksN(l.n)}`, onClick: () => go('book', { bi: l.bi }) })));
}

// Панель «О главе»: краткое содержание, люди, связи, «Знаете ли вы?».
function renderChapterInfo() {
  const box = ui.chapterInfo;
  if (readerWanted()) { box.hidden = true; return; }
  if (state.mode !== 'chapter' || renderer.xr.isPresenting || quiet.on || box.dataset.closed === `${state.bi}:${state.ci}`) { box.hidden = true; return; }
  const L = T(), bi = state.bi, ci = state.ci, b = BOOKS[bi];
  box.replaceChildren();
  const close = el2('button', 'close', '✕');
  close.type = 'button'; close.setAttribute('aria-label', L.close2);
  close.addEventListener('click', () => { box.dataset.closed = `${bi}:${ci}`; box.hidden = true; });
  box.append(close, el2('h3', '', L.aboutChapter(b.code === 'Ps' ? L.psalm(ci + 1) : `${b.name} ${ci + 1}`)));
  const sum = chapterSummary(bi, ci);
  if (sum) box.append(el2('p', 'circ', sum));
  const figs = figuresInChapter(bi, ci);
  if (figs.length) {
    box.append(el2('h3', '', L.peopleHere));
    const row = el2('div', 'chips');
    for (const f of figs.slice(0, 10)) {
      const c = el2('button', 'chip', LANG === 'ro' ? f.ro : f.ru);
      c.type = 'button'; c.addEventListener('click', () => showFigure(f));
      row.append(c);
    }
    box.append(row);
  }
  const links = XREF ? chapterLinks(bi, ci) : [];
  if (links.length) {
    box.append(el2('h3', '', L.chLinks));
    const max = links[0].n;
    for (const l of links) {
      const row = el2('button', 'linkbar');
      row.type = 'button';
      const bar = el2('span', 'bar'); bar.style.width = `${Math.round((l.n / max) * 100)}%`;
      row.append(el2('span', 'name', BOOKS[l.bi].name), bar);
      row.addEventListener('click', () => go('book', { bi: l.bi }));
      box.append(row);
    }
    const sky2 = el2('button', 'btn', L.showOnSky);
    sky2.type = 'button'; sky2.addEventListener('click', () => showChapterLinksOnSky(bi, ci));
    box.append(sky2);
  }
  const facts = FACTS && b.code && FACTS[b.code] ? (FACTS[b.code][LANG] || FACTS[b.code].ru) : null;
  if (facts && facts.length) box.append(el2('h3', '', L.didYouKnow), el2('p', 'fact', facts[ci % facts.length]));
  if (!sum && !figs.length && !links.length) { box.hidden = true; return; }
  box.hidden = false;
  box.style.top = `${Math.round(document.getElementById('top').getBoundingClientRect().bottom + 10)}px`;
}

// Путешествие по связям: след на небе.
function trail() { return store.get('trail', []); }
function addToTrail(r) {
  const t = trail();
  const k = refKey(r.bi, r.ci, r.vi);
  if (t[t.length - 1] !== k) { t.push(k); if (t.length > 60) t.shift(); store.set('trail', t); }
}
function nextAlongLinks(bi, ci, vi) {
  const seen = new Set(trail());
  const rel = related(bi, ci, vi).concat(quotesFor(bi, ci, vi).map((q) => q.r));
  const next = rel.find((r) => !seen.has(refKey(r.bi, r.ci, r.vi))) || rel[0];
  if (!next) return;
  addToTrail({ bi, ci, vi });
  addToTrail(next);
  jumpTo(next);
}
function showTrail() {
  const L = T();
  const list = trail().map(parseKey).filter((r) => r && r.vi != null);
  const extra = el2('div', 'actions');
  if (list.length) {
    const sky2 = el2('button', 'btn', L.showOnSky); sky2.type = 'button';
    sky2.addEventListener('click', async () => { await go('galaxy'); drawTrail(); });
    const clr = el2('button', 'btn danger', L.trailClear); clr.type = 'button';
    clr.addEventListener('click', () => { store.set('trail', []); setGalaxyLayer('trail', null); showTrail(); });
    extra.append(sky2, clr);
  }
  openList('trail', L.trail, list.length ? L.trailNote : L.trailEmpty, list.slice().reverse(), extra);
  drawTrail();
}
function drawTrail() {
  const list = trail().map(parseKey).filter((r) => r && r.vi != null && galaxy.items[r.bi]);
  if (list.length < 2) { setGalaxyLayer('trail', null); return; }
  const pts = list.map((r) => { const it = galaxy.items[r.bi]; const k = BOOKS[r.bi].chStart[r.ci] + r.vi; return new THREE.Vector3(it.pos[k * 3], it.pos[k * 3 + 1], it.pos[k * 3 + 2]); });
  const grp = new THREE.Group();
  const seg = [];
  for (let i = 1; i < pts.length; i++) seg.push(...pts[i - 1].toArray(), ...pts[i].toArray());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
  grp.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#ffb3e6', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));
  for (const p of pts) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc8ef', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p); s.scale.setScalar(2.2); grp.add(s);
  }
  setGalaxyLayer('trail', grp);
}

/* ---------- Графика: дуги-кривые с бегущими искрами ---------- */

// Набор дуг из одной точки к нескольким целям (для «связей главы»).
function buildArcObject(a, targets, color) {
  const grp = new THREE.Group();
  const seg = [];
  const SEG = 28, p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), ctrl = new THREE.Vector3();
  const curves = [];
  for (const t of targets) {
    const b = t.p;
    ctrl.addVectors(a, b).multiplyScalar(0.5).sub(EYE);
    if (ctrl.lengthSq() < 1e-6) ctrl.set(0, 1, 0);
    ctrl.normalize().multiplyScalar(64 + a.distanceTo(b) * 0.35).add(EYE);
    const c = { a: a.clone(), ctrl: ctrl.clone(), b: b.clone() };
    curves.push(c);
    for (let s = 0; s < SEG; s++) { bez(c, s / SEG, p0); bez(c, (s + 1) / SEG, p1); seg.push(...p0.toArray(), ...p1.toArray()); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
  grp.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
  grp.userData.curves = curves;
  return grp;
}
function bez(c, t, out) { return out.set(0, 0, 0).addScaledVector(c.a, (1 - t) * (1 - t)).addScaledVector(c.ctrl, 2 * (1 - t) * t).addScaledVector(c.b, t * t); }
const sparks = (() => {
  const MAX = 64;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 14, sizeAttenuation: false, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false;
  pts.visible = false;
  scene.add(pts);
  return { pts, geo, MAX, list: [] };
})();
// Искры бегут по дугам наведения и по «связям главы».
function updateSparks(time) {
  const curves = [];
  if (arcs.lines.visible && arcs.curves) curves.push(...arcs.curves);
  if (galaxy.group && galaxy.group.visible && galaxy.chapterLinks) curves.push(...galaxy.chapterLinks.userData.curves.map((c) => ({ ...c, color: arcColor.gold })));
  if (galaxy.group && galaxy.group.visible && galaxy.proph) curves.push(...galaxy.proph.userData.curves.slice(0, 20).map((c) => ({ ...c, color: arcColor.gold })));
  if (!curves.length || reducedMotion) { sparks.pts.visible = false; return; }
  const pos = sparks.geo.attributes.position.array, col = sparks.geo.attributes.color.array;
  let n = 0;
  const v = new THREE.Vector3();
  curves.forEach((c, i) => {
    for (let j = 0; j < 3 && n < sparks.MAX; j++) {
      const t = (time * 0.32 + i * 0.37 + j / 3) % 1;
      bez(c, t, v);
      pos.set([v.x, v.y, v.z], n * 3);
      const cc = c.color || arcColor.gold, f = Math.sin(t * Math.PI);
      col.set([cc.r * f, cc.g * f, cc.b * f], n * 3);
      n++;
    }
  });
  sparks.geo.setDrawRange(0, n);
  sparks.geo.attributes.position.needsUpdate = true;
  sparks.geo.attributes.color.needsUpdate = true;
  sparks.pts.visible = true;
}
const arcColor = { gold: new THREE.Color('#ffd27a'), cyan: new THREE.Color('#7fe7ff') };

/* ---------- Графика: свечение (bloom) на экране ---------- */

const post = (() => {
  const FULL = /* glsl */ 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const bright = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uTh: { value: 0.55 } },
    vertexShader: FULL,
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uTh; varying vec2 vUv; void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114)); gl_FragColor = vec4(c * smoothstep(uTh, uTh + 0.5, l), 1.0); }',
    depthTest: false, depthWrite: false,
  });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: FULL,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;
      void main() { vec3 s = texture2D(tDiffuse, vUv).rgb * 0.227;
        s += texture2D(tDiffuse, vUv + uDir * 1.385).rgb * 0.316; s += texture2D(tDiffuse, vUv - uDir * 1.385).rgb * 0.316;
        s += texture2D(tDiffuse, vUv + uDir * 3.231).rgb * 0.070; s += texture2D(tDiffuse, vUv - uDir * 3.231).rgb * 0.070;
        gl_FragColor = vec4(s, 1.0); }`,
    depthTest: false, depthWrite: false,
  });
  const comp = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: null }, tBloom: { value: null }, uStrength: { value: 0.9 } },
    vertexShader: FULL,
    fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uStrength; varying vec2 vUv;
      void main() { vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uStrength; gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bright);
  quad.frustumCulled = false;
  const pscene = new THREE.Scene();
  pscene.add(quad);
  const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let w = 0, h = 0, sceneRT = null, rA = null, rB = null;
  const size = new THREE.Vector2();
  function ensure() {
    renderer.getDrawingBufferSize(size);
    if (size.x === w && size.y === h && sceneRT) return;
    w = size.x; h = size.y;
    [sceneRT, rA, rB].forEach((t) => t && t.dispose());
    sceneRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 });
    const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
    rA = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
    rB = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
  }
  const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(pscene, pcam); };
  return {
    render() {
      ensure();
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      bright.uniforms.tDiffuse.value = sceneRT.texture;
      pass(bright, rA);
      for (let i = 0; i < 2; i++) {
        blur.uniforms.tDiffuse.value = rA.texture; blur.uniforms.uDir.value.set(1 / rA.width, 0); pass(blur, rB);
        blur.uniforms.tDiffuse.value = rB.texture; blur.uniforms.uDir.value.set(0, 1 / rA.height); pass(blur, rA);
      }
      comp.uniforms.tScene.value = sceneRT.texture;
      comp.uniforms.tBloom.value = rA.texture;
      pass(comp, null);
    },
  };
})();
let readerFrame = 0;
function renderFrame() {
  if ((state.mode === 'chapter' || state.mode === 'book') && ui.reader && !ui.reader.hidden && !renderer.xr.isPresenting) {
    if (!renderer.xr.isPresenting && perf.pr < prFloor()) { perf.pr = prFloor(); renderer.setPixelRatio(perf.pr); }
    perf.last = 0; perf.frames.length = 0;
    if ((readerFrame = (readerFrame + 1) % 4) !== 0) return;
    renderer.render(scene, camera);
    return;
  }
  perfSample();
  if (bloomOn() && !renderer.xr.isPresenting) {
    try { post.render(); return; } catch (err) { console.warn('bloom', err); perf.noBloom = true; }
  }
  renderer.render(scene, camera);
}

/* ---------- Скорость: качество графики подстраивается под устройство ---------- */
// «Авто»: если кадры идут медленно, сначала выключается свечение, затем уменьшается разрешение;
// когда запас скорости большой, разрешение возвращается (но не выше того, на котором уже тормозило).
const perf = { pr: renderer.getPixelRatio(), okPr: 9, noBloom: false, frames: [], last: 0, good: 0 };
const gfxMode = () => settings.gfx || 'auto';
function bloomOn() {
  const m = gfxMode();
  if (m === 'fast' || (m === 'auto' && perf.noBloom)) return false;
  return settings.bloom ?? (m === 'best' || !MOBILE);
}
function prCap() {
  const d = window.devicePixelRatio || 1, m = gfxMode();
  return m === 'fast' ? Math.min(d, 1) : m === 'best' ? Math.min(d, 2) : Math.min(d, MOBILE ? 1.5 : 2);
}
function applyGfx() {
  perf.noBloom = false; perf.okPr = 9; perf.frames = []; perf.good = 0;
  perf.pr = prCap();
  renderer.setPixelRatio(perf.pr);
}
function prFloor() { return state.mode === 'chapter' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1; }
function perfSample() {
  if (!renderer.xr.isPresenting && perf.pr < prFloor()) { perf.pr = prFloor(); renderer.setPixelRatio(perf.pr); }
  if (renderer.xr.isPresenting || gfxMode() !== 'auto' || document.hidden) { perf.last = 0; return; }
  const now = performance.now();
  if (perf.last) perf.frames.push(now - perf.last);
  perf.last = now;
  if (busy) { perf.frames.length = 0; return; } // переходы с построением главы не считаем
  // Окно: 60 кадров или 2 секунды (на очень медленном устройстве не ждём долго).
  const n = perf.frames.length;
  if (n < 60 && !(n >= 4 && perf.frames.reduce((x, y) => x + y, 0) > 2000)) return;
  const f = perf.frames.sort((a, b) => a - b), med = f[f.length >> 1];
  perf.frames = [];
  if (med > 26) {
    perf.good = 0;
    if (bloomOn()) { perf.noBloom = true; if (med < 60) return; }
    if (perf.pr > prFloor()) {
      perf.okPr = Math.max(prFloor(), perf.pr - 0.25);
      perf.pr = perf.okPr;
      renderer.setPixelRatio(perf.pr);
    }
  } else if (med < 17.5) {
    const top = Math.min(prCap(), perf.okPr);
    if (++perf.good >= 4 && perf.pr < top) { perf.pr = Math.min(top, perf.pr + 0.25); renderer.setPixelRatio(perf.pr); perf.good = 0; }
  } else perf.good = 0;
}

/* ---------- Графика: формы скоплений по жанрам и символы ---------- */

// Возвращает [x, y, глубина] звезды k из N в плоскости скопления радиуса r.
function clusterPoint(genre, k, N, r, T, phase0) {
  const t = (k + 0.5) / N, st = Math.sqrt(t), rnd = Math.random;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  switch (genre) {
    case 'proph': { // туманность: рыхлое облако с «завитками»
      const a = rnd() * Math.PI * 2, rr = r * Math.pow(rnd(), 0.6);
      const sw = Math.sin(a * 3 + phase0) * 0.25;
      return [Math.cos(a) * rr * (1 + sw), Math.sin(a) * rr * (0.75 + sw), gauss() * r * 0.35];
    }
    case 'gospel': { // яркое шаровое скопление
      const a = rnd() * Math.PI * 2, rr = r * Math.pow(t, 1.4) * 0.95;
      return [Math.cos(a) * rr, Math.sin(a) * rr, gauss() * rr * 0.6];
    }
    case 'wisdom': { // «роза»: лепестки
      const th = T * Math.PI * 2 * st + phase0, rr = r * (0.15 + 0.85 * st) * (0.6 + 0.4 * Math.abs(Math.sin(th * 2.5)));
      return [Math.cos(th) * rr, Math.sin(th) * rr, gauss() * r * 0.06];
    }
    case 'cath': { // двойные звёзды
      const side = k % 2 ? 1 : -1, a = rnd() * Math.PI * 2, rr = r * 0.48 * Math.pow(rnd(), 0.7);
      return [side * r * 0.45 + Math.cos(a) * rr, Math.sin(a) * rr, gauss() * r * 0.1];
    }
    case 'paul': { // голубая спираль с двумя рукавами
      const arm = k % 2, th = T * Math.PI * 1.4 * st + phase0 + arm * Math.PI;
      const rr = r * (0.08 + 0.92 * st) + gauss() * (r / T) * 0.35;
      return [Math.cos(th) * rr, Math.sin(th) * rr, gauss() * r * 0.05];
    }
    case 'rev': { // вихрь
      const th = T * Math.PI * 3 * st + phase0, rr = r * Math.pow(t, 0.8) + gauss() * r * 0.04;
      return [Math.cos(th) * rr, Math.sin(th) * rr, (1 - t) * r * 0.3 * gauss()];
    }
    case 'hist':
    case 'hist2': { // спираль с перемычкой
      if (k % 4 === 0) { const x = (rnd() - 0.5) * r * 0.9; return [x, gauss() * r * 0.08, gauss() * r * 0.05]; }
      const th = T * Math.PI * 2 * st + phase0, rr = r * (0.3 + 0.7 * st) + gauss() * (r / T) * 0.4;
      return [Math.cos(th) * rr, Math.sin(th) * rr, gauss() * r * 0.06];
    }
    default: { // Закон и остальные: золотая спираль
      const th = T * Math.PI * 2 * st + phase0;
      const rho = r * (0.06 + 0.94 * st) + (rnd() - 0.5) * (r / T) * 0.55;
      return [Math.cos(th) * rho, Math.sin(th) * rho, (rnd() - 0.5) * r * 0.12];
    }
  }
}
// Символы жанров: простые светящиеся знаки над группами книг.
const symbolTex = {};
function genreSymbol(genre) {
  if (symbolTex[genre]) return symbolTex[genre];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffe2a0'; g.fillStyle = '#ffe2a0'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = '#ffcf6b'; g.shadowBlur = 22;
  const P = () => g.stroke();
  g.beginPath();
  switch (genre) {
    case 'law': // скрижали
      for (const x of [62, 134]) { g.moveTo(x, 200); g.lineTo(x, 100); g.arc(x + 30, 100, 30, Math.PI, 0); g.lineTo(x + 60, 200); g.closePath(); for (let y = 110; y < 190; y += 22) { g.moveTo(x + 12, y); g.lineTo(x + 48, y); } }
      P(); break;
    case 'hist': case 'hist2': // корона
      g.moveTo(50, 190); g.lineTo(206, 190); g.lineTo(220, 90); g.lineTo(170, 140); g.lineTo(128, 70); g.lineTo(86, 140); g.lineTo(36, 90); g.closePath(); P(); break;
    case 'wisdom': // лира
      g.moveTo(70, 70); g.quadraticCurveTo(60, 200, 128, 210); g.quadraticCurveTo(196, 200, 186, 70); g.moveTo(80, 90); g.lineTo(176, 90);
      for (const x of [104, 128, 152]) { g.moveTo(x, 90); g.lineTo(x, 190); } P(); break;
    case 'proph': // свиток
      g.rect(70, 70, 116, 120); g.moveTo(58, 70); g.arc(70, 70, 12, Math.PI, 0); g.moveTo(58, 190); g.arc(70, 190, 12, Math.PI, 0);
      g.moveTo(198, 70); g.arc(186, 70, 12, 0, Math.PI, true); g.moveTo(198, 190); g.arc(186, 190, 12, 0, Math.PI, true);
      for (let y = 95; y < 175; y += 20) { g.moveTo(88, y); g.lineTo(168, y); } P(); break;
    case 'gospel': // четырёхлучевая звезда
      g.moveTo(128, 30); g.lineTo(146, 110); g.lineTo(226, 128); g.lineTo(146, 146); g.lineTo(128, 226); g.lineTo(110, 146); g.lineTo(30, 128); g.lineTo(110, 110); g.closePath(); g.fill(); break;
    case 'acts': // пламя
      g.moveTo(128, 220); g.bezierCurveTo(50, 200, 70, 120, 128, 40); g.bezierCurveTo(186, 120, 206, 200, 128, 220); g.moveTo(128, 200); g.bezierCurveTo(100, 180, 108, 150, 128, 120); g.bezierCurveTo(148, 150, 156, 180, 128, 200); P(); break;
    case 'cath': case 'paul': // письмо
      g.rect(48, 80, 160, 110); g.moveTo(48, 80); g.lineTo(128, 140); g.lineTo(208, 80); P();
      if (genre === 'paul') { g.beginPath(); g.arc(128, 150, 14, 0, Math.PI * 2); g.fill(); } break;
    case 'rev': // семь звёзд
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; g.moveTo(128 + Math.cos(a) * 80 + 9, 128 + Math.sin(a) * 80); g.arc(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80, 9, 0, Math.PI * 2); }
      g.fill(); break;
    default: g.arc(128, 128, 50, 0, Math.PI * 2); P();
  }
  const tex = makeTexture(c);
  tex.userData.keep = true;
  symbolTex[genre] = tex;
  return tex;
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
  if (xrPanel.group.visible || detail.vrButtons.length || quiz.vrButtons.length || mapVr.buttons.length) {
    const hit = raycaster.intersectObjects([...(xrPanel.group.visible ? xrPanel.buttons : []), ...detail.vrButtons, ...quiz.vrButtons, ...mapVr.buttons], false)[0];
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
  if (hoveredCard) { hoveredCard.material.color.set('#ffffff'); hoveredCard.material.opacity = 0.95; hoveredCard = null; }
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
      const rel = quotesFor(h.bi, b.ci[h.k], b.vi[h.k]).map((q) => ({ ...q.r, quote: true })).concat(related(h.bi, b.ci[h.k], b.vi[h.k]));
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
    hoveredCard.material.color.set('#fff0cc');
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
  if (state.mode === 'galaxy') defs.push([L.xrQuiz, openQuiz], [L.xrMap, () => openMap()]);
  if (state.mode === 'chapter') defs.push([L.xrQuiet, enterQuiet]);
  defs.push([music.on ? L.musicOn : L.musicOff, toggleMusic]);
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
  let about = state.mode === 'book' ? bookAbout(state.bi) : null;
  if (state.mode === 'chapter' && !quiet.on) {
    const sum = chapterSummary(state.bi, state.ci);
    const figs = figuresInChapter(state.bi, state.ci).slice(0, 6).map((f) => (LANG === 'ro' ? f.ro : f.ru));
    if (sum || figs.length) about = { rows: figs.length ? [[L.peopleHere, figs.join(', ')]] : [], circ: sum, fromEdition: true };
  }
  if (about) {
    if (state.mode === 'book') about.person = personFor(state.bi);
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
function applyLook() {
  look.dirty = true;
  camera.rotation.set(look.pitch, -look.yaw, 0);
}
look.target = null;
applyLook();
const el = renderer.domElement;
let lastPointer = 'mouse';
let tapArmed = null;
el.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; look.target = null; if (gyro.on) gyro.dragStart = gyro.drag; look.down = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch }; look.moved = false; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => {
  look.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  look.has = true;
  look.dirty = true;
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
  if (e.key === 'Escape' && quiet.on) exitQuiet();
  else if (e.key === 'Escape' && !ui.parallelPanel.hidden) ui.parallelPanel.hidden = true;
  else if (e.key === 'Escape' && !ui.mapPanel.hidden) closeMap();
  else if (e.key === 'Escape' && !ui.prophPanel.hidden) closeProph();
  else if (e.key === 'Escape' && !ui.settingsPanel.hidden) ui.settingsPanel.hidden = true;
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
function placeReader() {
  if (ui.reader.hidden) return;
  const top = document.getElementById('top').getBoundingClientRect().bottom;
  const nav = ui.nav.hidden ? innerHeight - 12 : ui.nav.getBoundingClientRect().top;
  ui.reader.style.top = `${Math.round(top + 8)}px`;
  ui.reader.style.bottom = `${Math.round(innerHeight - nav + 8)}px`;
}
addEventListener('resize', () => setTimeout(placeReader, 50));
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
  renderChapterInfo();
  renderReader();
  placeReader();
  if (state.mode === 'book' && !readerWanted()) toast(T().toastBook, 6000, true);
  if (state.mode === 'chapter' && !tts.reading && !readerWanted()) toast(T().toastChapter, 6000, true);
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
  ui.menuList.style.maxHeight = `${Math.round(innerHeight - r.bottom - 18)}px`;
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
  const load = (src) => new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = src;
    sc.onload = () => (window.JSZip ? res(window.JSZip) : rej(new Error('JSZip')));
    sc.onerror = () => { sc.remove(); rej(new Error('JSZip')); };
    document.head.appendChild(sc);
  });
  const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  jszipPromise = jszipPromise || (LOCAL_APP ? load('./vendor/jszip.min.js').catch(() => load(cdn)) : load(cdn));
  jszipPromise.catch(() => { jszipPromise = null; });
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

let pickFrame = 0;
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
  if (music.on && (musicFrame = (musicFrame + 1) % 20) === 0) musicUpdate();
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
    if (look.dirty || (pickFrame = (pickFrame + 1) % 12) === 0) {
      look.dirty = false;
      raycaster.setFromCamera(look.ndc, camera);
      h = pick(raycaster.ray.clone());
    } else h = hover;
  }
  const key = hoverKey(h);
  if (key !== lastHoverKey) { hover = h; lastHoverKey = key; applyHover(); }
  updateSparks(shared.uTime.value);
  renderFrame();
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
    applyGfx();
    navLabels();
    renderer.setAnimationLoop(tick);
    ui.loader.classList.add('done');
    window.__started = true;
    if (welcome.message) toast(welcome.message, 9000); else toast(T().toastGalaxy, 9000, true);
    setupVR();
    loadExtras();
    renderContinue();
    maybeShowVotd();
    if (settings.gyro) setGyro(true);
    updateMusicBtn();
    if (settings.music) addEventListener('pointerdown', () => { if (settings.music && !music.on) musicStart(); }, { once: true });
  } catch (err) {
    ui.status.textContent = T().loadFail(err.message);
  }
}
start();

// Кнопка «Назад» телефона в APK: сначала закрываем окна и поднимаемся на уровень выше.
window.__androidBack = () => {
  if (quiet.on) { exitQuiet(); return true; }
  if (!ui.parallelPanel.hidden) { ui.parallelPanel.hidden = true; return true; }
  if (!ui.mapPanel.hidden) { closeMap(); return true; }
  if (!ui.settingsPanel.hidden) { ui.settingsPanel.hidden = true; return true; }
  if (!ui.listPanel.hidden) { closeList(); return true; }
  if (quiz.open) { closeQuiz(); return true; }
  if (detail.open || state.mode !== 'galaxy') { back(); return true; }
  return false;
};

// Для проверки без шлема: построение VR-панелей можно вызвать из консоли.
window.__bibleCosmos = {
  get look() { return look; }, pickAt(x, y) { const v = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); raycaster.setFromCamera(v, camera); const h = pick(raycaster.ray.clone()); return h && { type: h.type, vi: h.vi, bi: h.bi, ci: h.ci }; }, get busy() { return busy; },
  get mapState() { return mapState; }, ROUTES, PLACE, fromRef, setLang, openProphecies, aplayer, chapterTimes, hasAudio, get audioIndex() { return audioIndex; }, showAudioPanel, get PROPH() { return PROPH; }, go, tts, perf, bloomOn, applyGfx, LESSONS, showLesson, showLessons, renderReader, jumpTo, renderChapterInfo, showChapterLinksOnSky, nextAlongLinks, get books() { return BOOKS; }, get post() { return post; },
  buildVrDetail, buildVrQuiz, openQuiz, rebuildPanel, related, bookAbout, state, quiz, scene, galaxy, camera, markRead, settings, gyro, music, quiet, placesIn, versesAbout, buildVrMap, openMap, verseImage, chapterLinks, figuresInChapter, chapterSummary, quotesFor, parallelsFor, showTrail, get knowledge() { return { SUMMARIES, FIGURES, FACTS, PARALLELS, OTQ, GLOSSARY }; },
  get sky() { return sky; },
  project(bi) { const v = galaxy.items[bi].center.clone().project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, front: v.z < 1 }; },
};
