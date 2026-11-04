// Копирует веб-часть программы в desktop/web и кладёт рядом three.js и JSZip,
// чтобы программа для компьютера работала без интернета. Запуск: node prepare.js (после npm install).
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'web');
const NM = path.join(__dirname, 'node_modules');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });
for (const f of ['index.html', 'app.js', 'sky.js', 'bible-import.js']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.cpSync(path.join(SRC, 'data'), path.join(OUT, 'data'), { recursive: true });
fs.copyFileSync(path.join(NM, 'three', 'build', 'three.module.js'), path.join(OUT, 'vendor', 'three.module.js'));
fs.copyFileSync(path.join(NM, 'jszip', 'dist', 'jszip.min.js'), path.join(OUT, 'vendor', 'jszip.min.js'));
fs.copyFileSync(path.join(SRC, 'vendor', 'anthropic-sdk.js'), path.join(OUT, 'vendor', 'anthropic-sdk.js'));
console.log('web ready:', fs.readdirSync(OUT).join(', '));
// Папка распознавания речи (Whisper) может быть пустой — тогда кнопка 🎤 на компьютере скажет, что распознавание недоступно.
fs.mkdirSync(path.join(__dirname, 'whisper'), { recursive: true });
