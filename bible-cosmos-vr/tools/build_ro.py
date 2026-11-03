"""Собирает data/bible-ro.json из ron-rccv.usfx.xml (Romanian Corrected Cornilescu, public domain).

Запуск:
  curl -L -o ron-rccv.usfx.xml https://raw.githubusercontent.com/seven1m/open-bibles/master/ron-rccv.usfx.xml
  python3 -I tools/build_ro.py ron-rccv.usfx.xml data/bible-ro.json
"""
import json
import sys
import xml.etree.ElementTree as ET

# (код USFX, сокращение, жанр)
BOOKS = [
    ("GEN", "Gen", "law"), ("EXO", "Exod", "law"), ("LEV", "Lev", "law"), ("NUM", "Num", "law"), ("DEU", "Deut", "law"),
    ("JOS", "Ios", "hist"), ("JDG", "Jud", "hist"), ("RUT", "Rut", "hist"), ("1SA", "1Sam", "hist"), ("2SA", "2Sam", "hist"),
    ("1KI", "1Împ", "hist"), ("2KI", "2Împ", "hist"), ("1CH", "1Cron", "hist"), ("2CH", "2Cron", "hist"),
    ("EZR", "Ezra", "hist"), ("NEH", "Neem", "hist"), ("EST", "Est", "hist"),
    ("JOB", "Iov", "wisdom"), ("PSA", "Ps", "wisdom"), ("PRO", "Prov", "wisdom"), ("ECC", "Ecl", "wisdom"), ("SNG", "Cânt", "wisdom"),
    ("ISA", "Is", "proph"), ("JER", "Ier", "proph"), ("LAM", "Plâng", "proph"), ("EZK", "Ezec", "proph"), ("DAN", "Dan", "proph"),
    ("HOS", "Osea", "proph"), ("JOL", "Ioel", "proph"), ("AMO", "Amos", "proph"), ("OBA", "Obad", "proph"), ("JON", "Iona", "proph"),
    ("MIC", "Mica", "proph"), ("NAM", "Naum", "proph"), ("HAB", "Hab", "proph"), ("ZEP", "Țef", "proph"), ("HAG", "Hag", "proph"),
    ("ZEC", "Zah", "proph"), ("MAL", "Mal", "proph"),
    ("MAT", "Mat", "gospel"), ("MRK", "Marc", "gospel"), ("LUK", "Luca", "gospel"), ("JHN", "Ioan", "gospel"),
    ("ACT", "Fapte", "acts"),
    ("ROM", "Rom", "paul"), ("1CO", "1Cor", "paul"), ("2CO", "2Cor", "paul"), ("GAL", "Gal", "paul"), ("EPH", "Ef", "paul"),
    ("PHP", "Filip", "paul"), ("COL", "Col", "paul"), ("1TH", "1Tes", "paul"), ("2TH", "2Tes", "paul"), ("1TI", "1Tim", "paul"),
    ("2TI", "2Tim", "paul"), ("TIT", "Tit", "paul"), ("PHM", "Filim", "paul"), ("HEB", "Evr", "paul"),
    ("JAS", "Iac", "cath"), ("1PE", "1Pet", "cath"), ("2PE", "2Pet", "cath"), ("1JN", "1Ioan", "cath"), ("2JN", "2Ioan", "cath"),
    ("3JN", "3Ioan", "cath"), ("JUD", "Iuda", "cath"),
    ("REV", "Apoc", "rev"),
]
SKIP = {"f", "x", "s", "h", "id", "ide", "toc", "rem", "fig", "d", "table"}
# Современная румынская орфография: ş/ţ с запятой.
FIX = str.maketrans({"ş": "ș", "Ş": "Ș", "ţ": "ț", "Ţ": "Ț"})


def parse_book(el):
    chapters = []
    cur = None  # [chapter_index, verse_index]
    name = ""

    def add(text):
        if text and cur is not None:
            chapters[cur[0]][cur[1]] += text

    def walk(node):
        nonlocal cur, name
        tag = node.tag
        if tag == "h":
            name = (node.text or "").strip()
        if tag == "c":
            chapters.append([])
            cur = None
        elif tag == "v":
            chapters[-1].append("")
            cur = [len(chapters) - 1, len(chapters[-1]) - 1]
        elif tag == "ve":
            cur = None
        elif tag in SKIP:
            add(node.tail)
            return
        else:
            add(node.text)
        for ch in node:
            walk(ch)
        if tag not in ("c", "v", "ve"):
            pass
        add(node.tail)

    walk(el)
    chapters = [[" ".join(v.split()).translate(FIX) for v in ch] for ch in chapters]
    return name.translate(FIX), chapters


def main(src, dst):
    root = ET.parse(src).getroot()
    found = {b.get("id"): b for b in root.iter("book")}
    out = []
    for code, short, genre in BOOKS:
        name, chapters = parse_book(found[code])
        out.append({"n": name, "s": short, "g": genre, "d": 0, "c": chapters})
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"t": "Cornilescu revizuită (1924/2013)", "b": out}, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
