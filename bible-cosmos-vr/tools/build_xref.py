"""Собирает data/xref.json из cross_references.txt (OpenBible.info, CC BY).

Запуск:
  curl -L -o cross_references.txt https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras/cross_references.txt
  python3 -I tools/build_xref.py cross_references.txt data/xref.json

Формат: {"<id>": [id, id, -id_конца_диапазона, ...]}, id = книга*1000000 + глава*1000 + стих,
книга — номер в порядке 66 книг (1 = Бытие ... 66 = Откровение). Отрицательное число — конец диапазона
для предыдущей ссылки. На каждый стих — до 10 ссылок с наибольшим числом голосов.
"""
import json
import sys
from collections import defaultdict

CODES = ["Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1Sam", "2Sam", "1Kgs", "2Kgs", "1Chr", "2Chr",
         "Ezra", "Neh", "Esth", "Job", "Ps", "Prov", "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel",
         "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal", "Matt", "Mark", "Luke", "John",
         "Acts", "Rom", "1Cor", "2Cor", "Gal", "Eph", "Phil", "Col", "1Thess", "2Thess", "1Tim", "2Tim", "Titus", "Phlm",
         "Heb", "Jas", "1Pet", "2Pet", "1John", "2John", "3John", "Jude", "Rev"]
NUM = {c: i + 1 for i, c in enumerate(CODES)}
PER_VERSE = 10
MIN_VOTES = 2


def vid(ref):
    b, c, v = ref.split(".")
    return NUM[b] * 1000000 + int(c) * 1000 + int(v)


def main(src, dst):
    refs = defaultdict(list)
    with open(src, encoding="utf-8") as f:
        next(f)
        for line in f:
            a, b, votes = line.rstrip("\n").split("\t")
            votes = int(votes)
            if votes < MIN_VOTES:
                continue
            start, _, end = b.partition("-")
            refs[vid(a)].append((votes, vid(start), vid(end) if end else None))
    out = {}
    for k, lst in refs.items():
        lst.sort(key=lambda x: -x[0])
        arr = []
        for _, s, e in lst[:PER_VERSE]:
            arr.append(s)
            if e and e != s:
                arr.append(-e)
        out[str(k)] = arr
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"src": "OpenBible.info cross references, CC BY", "x": out}, f, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
