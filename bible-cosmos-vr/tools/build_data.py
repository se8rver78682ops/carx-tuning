"""Собирает компактный data/bible.json из RusSynodal.json (scrollmapper/bible_databases).

Запуск:
  curl -L -o RusSynodal.json https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/RusSynodal.json
  python3 -I tools/build_data.py RusSynodal.json data/bible.json
"""
import json
import sys

# Русские названия, сокращения, жанр, неканоническая ли книга.
# Порядок совпадает с порядком книг в исходном файле (порядок Синодальной Библии).
BOOKS = [
    ("Бытие", "Быт", "law", 0), ("Исход", "Исх", "law", 0), ("Левит", "Лев", "law", 0),
    ("Числа", "Чис", "law", 0), ("Второзаконие", "Втор", "law", 0),
    ("Иисус Навин", "Нав", "hist", 0), ("Судьи", "Суд", "hist", 0), ("Руфь", "Руф", "hist", 0),
    ("1 Царств", "1Цар", "hist", 0), ("2 Царств", "2Цар", "hist", 0),
    ("3 Царств", "3Цар", "hist", 0), ("4 Царств", "4Цар", "hist", 0),
    ("1 Паралипоменон", "1Пар", "hist", 0), ("2 Паралипоменон", "2Пар", "hist", 0),
    ("Молитва Манассии", "Мол.Ман", "hist", 1),
    ("1 Ездры", "1Езд", "hist", 0), ("Неемия", "Неем", "hist", 0), ("2 Ездры", "2Езд", "hist", 1),
    ("Товит", "Тов", "hist", 1), ("Иудифь", "Иудиф", "hist", 1), ("Есфирь", "Есф", "hist", 0),
    ("Иов", "Иов", "wisdom", 0), ("Псалтирь", "Пс", "wisdom", 0), ("Притчи", "Прит", "wisdom", 0),
    ("Екклесиаст", "Еккл", "wisdom", 0), ("Песнь песней", "Песн", "wisdom", 0),
    ("Премудрость Соломона", "Прем", "wisdom", 1), ("Сирах", "Сир", "wisdom", 1),
    ("Исаия", "Ис", "proph", 0), ("Иеремия", "Иер", "proph", 0), ("Плач Иеремии", "Плач", "proph", 0),
    ("Послание Иеремии", "Посл.Иер", "proph", 1), ("Варух", "Вар", "proph", 1),
    ("Иезекииль", "Иез", "proph", 0), ("Даниил", "Дан", "proph", 0), ("Осия", "Ос", "proph", 0),
    ("Иоиль", "Иоил", "proph", 0), ("Амос", "Ам", "proph", 0), ("Авдий", "Авд", "proph", 0),
    ("Иона", "Ион", "proph", 0), ("Михей", "Мих", "proph", 0), ("Наум", "Наум", "proph", 0),
    ("Аввакум", "Авв", "proph", 0), ("Софония", "Соф", "proph", 0), ("Аггей", "Агг", "proph", 0),
    ("Захария", "Зах", "proph", 0), ("Малахия", "Мал", "proph", 0),
    ("1 Маккавейская", "1Мак", "hist2", 1), ("2 Маккавейская", "2Мак", "hist2", 1),
    ("3 Маккавейская", "3Мак", "hist2", 1), ("3 Ездры", "3Езд", "hist2", 1),
    ("От Матфея", "Мф", "gospel", 0), ("От Марка", "Мк", "gospel", 0),
    ("От Луки", "Лк", "gospel", 0), ("От Иоанна", "Ин", "gospel", 0),
    ("Деяния апостолов", "Деян", "acts", 0),
    ("Иакова", "Иак", "cath", 0), ("1 Петра", "1Пет", "cath", 0), ("2 Петра", "2Пет", "cath", 0),
    ("1 Иоанна", "1Ин", "cath", 0), ("2 Иоанна", "2Ин", "cath", 0), ("3 Иоанна", "3Ин", "cath", 0),
    ("Иуды", "Иуд", "cath", 0),
    ("К Римлянам", "Рим", "paul", 0), ("1 Коринфянам", "1Кор", "paul", 0),
    ("2 Коринфянам", "2Кор", "paul", 0), ("К Галатам", "Гал", "paul", 0),
    ("К Ефесянам", "Еф", "paul", 0), ("К Филиппийцам", "Флп", "paul", 0),
    ("К Колоссянам", "Кол", "paul", 0), ("1 Фессалоникийцам", "1Фес", "paul", 0),
    ("2 Фессалоникийцам", "2Фес", "paul", 0), ("1 Тимофею", "1Тим", "paul", 0),
    ("2 Тимофею", "2Тим", "paul", 0), ("К Титу", "Тит", "paul", 0), ("К Филимону", "Флм", "paul", 0),
    ("К Евреям", "Евр", "paul", 0), ("Откровение", "Откр", "rev", 0),
]


def main(src, dst):
    with open(src, encoding="utf-8") as f:
        raw = json.load(f)
    books = raw["books"]
    if len(books) != len(BOOKS):
        raise SystemExit(f"ожидалось {len(BOOKS)} книг, найдено {len(books)}")
    out = []
    for (name, short, genre, deutero), book in zip(BOOKS, books):
        chapters = []
        for ch in book["chapters"]:
            verses = [" ".join(v["text"].split()) for v in ch["verses"]]
            nums = [v["verse"] for v in ch["verses"]]
            entry = verses
            # Если нумерация стихов не 1..N, сохраняем номера явно.
            if nums != list(range(1, len(nums) + 1)):
                entry = {"n": nums, "v": verses}
            chapters.append(entry)
        out.append({"n": name, "s": short, "g": genre, "d": deutero, "c": chapters})
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"t": "Синодальный перевод", "b": out}, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
