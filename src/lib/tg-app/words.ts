/**
 * Code Wordle's words: one a day per language, from the lessons (a test
 * checks each appears in its course), with a clue in English and Russian
 * that doesn't give the word away. Letters only, 3–10 of them.
 */

export type WordleWord = { word: string; en: string; ru: string };

const w = (word: string, en: string, ru: string): WordleWord => ({
  word,
  en,
  ru,
});

export const wordleWords: Record<string, WordleWord[]> = {
  python: [
    w(
      "print",
      "Shows text or values in the output.",
      "Выводит текст или значения на экран.",
    ),
    w(
      "input",
      "Reads a line the user types.",
      "Читает строку, которую вводит пользователь.",
    ),
    w(
      "range",
      "Makes a sequence of numbers, often for loops.",
      "Создаёт последовательность чисел, часто для циклов.",
    ),
    w(
      "split",
      "Breaks a string into a list of parts.",
      "Разбивает строку на список частей.",
    ),
    w(
      "strip",
      "Removes spaces from both ends of a string.",
      "Убирает пробелы с обоих концов строки.",
    ),
    w(
      "join",
      "Glues a list of strings into one string.",
      "Склеивает список строк в одну строку.",
    ),
    w(
      "append",
      "Adds one item to the end of a list.",
      "Добавляет элемент в конец списка.",
    ),
    w(
      "while",
      "A loop that runs as long as a condition is true.",
      "Цикл, который работает, пока условие истинно.",
    ),
    w(
      "yield",
      "Hands out a value from a generator and pauses it.",
      "Отдаёт значение из генератора и ставит его на паузу.",
    ),
    w(
      "lambda",
      "Makes a small nameless function in one line.",
      "Создаёт маленькую безымянную функцию в одну строку.",
    ),
    w(
      "return",
      "Sends a value back from a function.",
      "Отдаёт значение из функции обратно.",
    ),
    w(
      "import",
      "Brings in code from another module.",
      "Подключает код из другого модуля.",
    ),
    w(
      "class",
      "A blueprint for making objects.",
      "Шаблон для создания объектов.",
    ),
    w(
      "self",
      "A method's first parameter: the object itself.",
      "Первый параметр метода: сам объект.",
    ),
    w("break", "Stops a loop right away.", "Сразу останавливает цикл."),
    w(
      "continue",
      "Skips to the next turn of a loop.",
      "Переходит к следующему шагу цикла.",
    ),
    w(
      "pass",
      "A statement that does nothing: a placeholder.",
      "Инструкция, которая ничего не делает: заглушка.",
    ),
    w(
      "assert",
      "Checks a condition and fails loudly if it's false.",
      "Проверяет условие и падает с ошибкой, если оно ложно.",
    ),
    w(
      "except",
      "Catches an error after try.",
      "Перехватывает ошибку после try.",
    ),
    w("raise", "Throws an error on purpose.", "Намеренно вызывает ошибку."),
    w(
      "finally",
      "A block that runs whether there was an error or not.",
      "Блок, который выполняется всегда, была ошибка или нет.",
    ),
    w(
      "with",
      "Opens a resource and closes it for you afterwards.",
      "Открывает ресурс и сам закрывает его потом.",
    ),
    w(
      "async",
      "Marks a function you can wait for with await.",
      "Помечает функцию, которую можно ждать через await.",
    ),
    w(
      "await",
      "Waits for a coroutine to finish.",
      "Ждёт, пока корутина завершится.",
    ),
    w("dict", "Stores values under keys.", "Хранит значения по ключам."),
    w(
      "list",
      "An ordered, changeable collection in square brackets.",
      "Упорядоченная изменяемая коллекция в квадратных скобках.",
    ),
    w(
      "tuple",
      "An ordered collection that can't be changed.",
      "Упорядоченная коллекция, которую нельзя изменить.",
    ),
    w(
      "float",
      "The type of numbers with a decimal point.",
      "Тип чисел с дробной частью.",
    ),
    w(
      "sorted",
      "Returns a new list in order.",
      "Возвращает новый упорядоченный список.",
    ),
    w(
      "filter",
      "Keeps only the items a function says yes to.",
      "Оставляет только элементы, для которых функция ответила «да».",
    ),
    w(
      "format",
      "Fills values into a string template.",
      "Подставляет значения в шаблон строки.",
    ),
    w(
      "lower",
      "Turns a string into small letters.",
      "Переводит строку в строчные буквы.",
    ),
    w(
      "upper",
      "Turns a string into capital letters.",
      "Переводит строку в заглавные буквы.",
    ),
    w(
      "replace",
      "Swaps one piece of a string for another.",
      "Заменяет часть строки на другую.",
    ),
    w(
      "items",
      "Gives a dictionary's key–value pairs.",
      "Даёт пары «ключ–значение» словаря.",
    ),
    w(
      "keys",
      "Gives all the names a dictionary stores values under.",
      "Даёт все имена, под которыми словарь хранит значения.",
    ),
    w(
      "values",
      "Gives everything a dictionary stores, without the keys.",
      "Даёт всё, что хранит словарь, без ключей.",
    ),
    w(
      "open",
      "Gets a file ready for reading or writing.",
      "Готовит файл к чтению или записи.",
    ),
    w(
      "super",
      "Calls a method from the parent class.",
      "Вызывает метод родительского класса.",
    ),
    w(
      "zip",
      "Pairs up items from several lists.",
      "Объединяет в пары элементы нескольких списков.",
    ),
    w(
      "round",
      "Cuts a number to a given number of digits.",
      "Округляет число до нужного количества знаков.",
    ),
    w(
      "bool",
      "The type with only True and False.",
      "Тип, у которого только True и False.",
    ),
    w(
      "none",
      "Python's value for 'nothing here'.",
      "Значение Python для «здесь ничего нет».",
    ),
    w(
      "insert",
      "Puts an item into a list at a given position.",
      "Вставляет элемент в список на нужное место.",
    ),
    w(
      "remove",
      "Deletes the first matching item from a list.",
      "Удаляет из списка первый подходящий элемент.",
    ),
    w(
      "count",
      "How many times a value appears.",
      "Сколько раз встречается значение.",
    ),
    w(
      "index",
      "The position of an item, starting from 0.",
      "Позиция элемента, считая с 0.",
    ),
    w(
      "elif",
      "Checks another condition after if.",
      "Проверяет ещё одно условие после if.",
    ),
    w(
      "extend",
      "Adds all items of another list to the end.",
      "Добавляет в конец все элементы другого списка.",
    ),
    w(
      "reverse",
      "Flips the order of a list in place.",
      "Переворачивает порядок списка на месте.",
    ),
    w(
      "update",
      "Merges another dictionary into this one.",
      "Добавляет в словарь данные из другого словаря.",
    ),
    w(
      "property",
      "Makes a method look like an attribute.",
      "Делает метод похожим на атрибут.",
    ),
    w(
      "match",
      "Compares a value against patterns, case by case.",
      "Сравнивает значение с шаблонами, вариант за вариантом.",
    ),
    w(
      "global",
      "Lets a function change a module-level variable.",
      "Позволяет функции менять переменную уровня модуля.",
    ),
    w(
      "enumerate",
      "Loops with both the position and the item.",
      "Перебирает элементы вместе с их номерами.",
    ),
    w(
      "type",
      "Tells you what kind of value something is.",
      "Показывает, какого вида значение.",
    ),
    w(
      "len",
      "How many items or characters there are.",
      "Сколько элементов или символов.",
    ),
  ],
  javascript: [
    w(
      "const",
      "Declares a variable that can't be reassigned.",
      "Объявляет переменную, которую нельзя переназначить.",
    ),
    w(
      "let",
      "Declares a variable you can change later.",
      "Объявляет переменную, которую можно менять.",
    ),
    w(
      "function",
      "Declares a reusable block of code.",
      "Объявляет блок кода, который можно вызывать снова.",
    ),
    w(
      "return",
      "Sends a value back from a function.",
      "Отдаёт значение из функции обратно.",
    ),
    w(
      "while",
      "A loop that runs as long as a condition is true.",
      "Цикл, который работает, пока условие истинно.",
    ),
    w(
      "break",
      "Stops a loop or a switch right away.",
      "Сразу останавливает цикл или switch.",
    ),
    w(
      "continue",
      "Skips to the next turn of a loop.",
      "Переходит к следующему шагу цикла.",
    ),
    w(
      "class",
      "A blueprint for making objects.",
      "Шаблон для создания объектов.",
    ),
    w(
      "extends",
      "Makes a class inherit from another.",
      "Делает класс наследником другого.",
    ),
    w(
      "super",
      "Calls the parent class's constructor or method.",
      "Вызывает конструктор или метод родительского класса.",
    ),
    w(
      "this",
      "The object a method was called on.",
      "Объект, на котором вызван метод.",
    ),
    w("new", "Creates an object from a class.", "Создаёт объект из класса."),
    w(
      "typeof",
      "Tells you a value's type as a string.",
      "Возвращает тип значения строкой.",
    ),
    w(
      "async",
      "Marks a function that returns a promise.",
      "Помечает функцию, которая возвращает промис.",
    ),
    w(
      "await",
      "Waits for a promise to settle.",
      "Ждёт, пока промис завершится.",
    ),
    w(
      "promise",
      "An object for a value that arrives later.",
      "Объект для значения, которое придёт позже.",
    ),
    w(
      "then",
      "Runs code after a promise succeeds.",
      "Выполняет код после успешного промиса.",
    ),
    w(
      "catch",
      "Handles an error from try or a promise.",
      "Обрабатывает ошибку из try или промиса.",
    ),
    w(
      "finally",
      "A block that runs whether there was an error or not.",
      "Блок, который выполняется всегда, была ошибка или нет.",
    ),
    w("throw", "Raises an error on purpose.", "Намеренно выбрасывает ошибку."),
    w(
      "try",
      "Starts a block whose errors catch will handle.",
      "Начинает блок, ошибки которого обработает catch.",
    ),
    w(
      "switch",
      "Picks a branch by comparing one value to cases.",
      "Выбирает ветку, сравнивая значение с вариантами.",
    ),
    w("case", "One branch in a switch.", "Одна ветка в switch."),
    w(
      "default",
      "The fallback branch of a switch.",
      "Запасная ветка в switch.",
    ),
    w(
      "import",
      "Brings in code from another module.",
      "Подключает код из другого модуля.",
    ),
    w(
      "export",
      "Makes code available to other modules.",
      "Делает код доступным для других модулей.",
    ),
    w(
      "map",
      "Makes a new array by transforming each item.",
      "Создаёт новый массив, преобразуя каждый элемент.",
    ),
    w(
      "filter",
      "Makes a new array with only the items that pass a test.",
      "Создаёт новый массив только из элементов, прошедших проверку.",
    ),
    w(
      "reduce",
      "Boils an array down to a single value.",
      "Сворачивает массив в одно значение.",
    ),
    w(
      "push",
      "Adds items to the end of an array.",
      "Добавляет элементы в конец массива.",
    ),
    w(
      "pop",
      "Removes the last item of an array.",
      "Удаляет последний элемент массива.",
    ),
    w(
      "shift",
      "Removes the first item of an array.",
      "Удаляет первый элемент массива.",
    ),
    w(
      "slice",
      "Copies part of an array or string.",
      "Копирует часть массива или строки.",
    ),
    w(
      "splice",
      "Removes or inserts items in the middle of an array.",
      "Удаляет или вставляет элементы в середину массива.",
    ),
    w(
      "join",
      "Glues array items into one string.",
      "Склеивает элементы массива в одну строку.",
    ),
    w("split", "Breaks a string into an array.", "Разбивает строку на массив."),
    w(
      "includes",
      "Checks whether an array or string contains a value.",
      "Проверяет, есть ли значение в массиве или строке.",
    ),
    w(
      "length",
      "How many items or characters there are.",
      "Сколько элементов или символов.",
    ),
    w(
      "console",
      "Where log() and error() print their messages.",
      "Объект с log() и error() для вывода сообщений.",
    ),
    w(
      "object",
      "A collection of key–value pairs in curly braces.",
      "Набор пар «ключ–значение» в фигурных скобках.",
    ),
    w(
      "array",
      "An ordered list of values in square brackets.",
      "Упорядоченный список значений в квадратных скобках.",
    ),
    w("string", "Text in quotes.", "Текст в кавычках."),
    w(
      "number",
      "The one type for both whole and decimal values.",
      "Единый тип и для целых, и для дробных значений.",
    ),
    w(
      "boolean",
      "The type with only true and false.",
      "Тип, у которого только true и false.",
    ),
    w(
      "null",
      "A value meaning 'deliberately empty'.",
      "Значение «намеренно пусто».",
    ),
    w(
      "undefined",
      "What a variable holds before it's given a value.",
      "Что хранит переменная, пока ей не дали значение.",
    ),
    w(
      "json",
      "A text format for data: objects, arrays, strings, numbers.",
      "Текстовый формат данных: объекты, массивы, строки, числа.",
    ),
    w(
      "parse",
      "Turns JSON text back into a value.",
      "Превращает текст JSON обратно в значение.",
    ),
    w(
      "fetch",
      "Makes an HTTP request and returns a promise.",
      "Делает HTTP-запрос и возвращает промис.",
    ),
    w(
      "event",
      "Something that happens: a click, a key press.",
      "То, что происходит: клик, нажатие клавиши.",
    ),
    w(
      "listener",
      "A function that runs when something happens on the page.",
      "Функция, которая срабатывает, когда что-то происходит на странице.",
    ),
    w(
      "closure",
      "A function that remembers variables from where it was made.",
      "Функция, которая помнит переменные места, где её создали.",
    ),
    w(
      "spread",
      "The ... syntax that expands an array or object.",
      "Синтаксис ..., который раскрывает массив или объект.",
    ),
    w(
      "every",
      "Checks that all items pass a test.",
      "Проверяет, что все элементы проходят проверку.",
    ),
    w(
      "some",
      "Checks that at least one item passes a test.",
      "Проверяет, что хотя бы один элемент проходит проверку.",
    ),
    w(
      "find",
      "Returns the first item that passes a test.",
      "Возвращает первый элемент, прошедший проверку.",
    ),
    w(
      "sort",
      "Puts an array in order, in place.",
      "Упорядочивает массив на месте.",
    ),
    w(
      "entries",
      "Lists an object's [key, value] pairs.",
      "Перечисляет пары [ключ, значение] объекта.",
    ),
    w(
      "trim",
      "Removes spaces from both ends of a string.",
      "Убирает пробелы с обоих концов строки.",
    ),
    w(
      "prototype",
      "The object other objects inherit methods from.",
      "Объект, от которого другие объекты наследуют методы.",
    ),
  ],
  typescript: [
    w(
      "type",
      "Creates an alias name for any shape of data.",
      "Задаёт псевдоним для любой формы данных.",
    ),
    w(
      "interface",
      "Describes the shape of an object; can be extended.",
      "Описывает форму объекта; её можно расширять.",
    ),
    w("enum", "A set of named constants.", "Набор именованных констант."),
    w(
      "readonly",
      "Marks a property that can't change after creation.",
      "Помечает свойство, которое нельзя менять после создания.",
    ),
    w(
      "private",
      "Usable only inside its own class.",
      "Доступно только внутри своего класса.",
    ),
    w(
      "public",
      "Usable from anywhere: the default for class members.",
      "Доступно отовсюду: так по умолчанию у членов класса.",
    ),
    w(
      "protected",
      "Usable in the class and its subclasses.",
      "Доступно в классе и его наследниках.",
    ),
    w(
      "generic",
      "A type with a parameter, like Box<T>.",
      "Тип с параметром, например Box<T>.",
    ),
    w(
      "extends",
      "Inherits from a class, or limits a type parameter.",
      "Наследует от класса или ограничивает параметр типа.",
    ),
    w(
      "keyof",
      "Gives the union of an object type's property names.",
      "Даёт объединение имён свойств объектного типа.",
    ),
    w(
      "typeof",
      "Gets the type of a value for use in types.",
      "Берёт тип значения, чтобы использовать его в типах.",
    ),
    w(
      "infer",
      "Captures a type inside a conditional type.",
      "Захватывает тип внутри условного типа.",
    ),
    w(
      "never",
      "The type of values that can't happen.",
      "Тип значений, которых не может быть.",
    ),
    w(
      "unknown",
      "Like any, but you must check before using it.",
      "Как any, но перед использованием нужно проверить.",
    ),
    w(
      "any",
      "Turns off type checking for a value.",
      "Отключает проверку типов для значения.",
    ),
    w(
      "void",
      "The return type of a function that gives nothing back.",
      "Тип результата функции, которая ничего не возвращает.",
    ),
    w("string", "The type of text.", "Тип текста."),
    w(
      "number",
      "The type for both whole and decimal values.",
      "Тип и для целых, и для дробных значений.",
    ),
    w(
      "boolean",
      "The type with only true and false.",
      "Тип, у которого только true и false.",
    ),
    w(
      "tuple",
      "An array with a fixed length and a type per position.",
      "Массив фиксированной длины с типом для каждой позиции.",
    ),
    w(
      "union",
      "A type that can be one of several: A | B.",
      "Тип, который может быть одним из нескольких: A | B.",
    ),
    w(
      "partial",
      "A utility type that makes every property optional.",
      "Служебный тип, который делает все свойства необязательными.",
    ),
    w(
      "record",
      "A utility type for an object with given keys and value type.",
      "Служебный тип для объекта с заданными ключами и типом значений.",
    ),
    w(
      "pick",
      "A utility type that keeps only some properties.",
      "Служебный тип, который оставляет только часть свойств.",
    ),
    w(
      "omit",
      "A utility type that drops some properties.",
      "Служебный тип, который убирает часть свойств.",
    ),
    w(
      "abstract",
      "A class that can't be created directly, only extended.",
      "Класс, который нельзя создать напрямую, только унаследовать.",
    ),
    w(
      "declare",
      "Says something exists without defining it.",
      "Сообщает, что что-то существует, не определяя его.",
    ),
    w(
      "literal",
      "A type of one exact value, like 'red' or 42.",
      "Тип ровно одного значения, например 'red' или 42.",
    ),
    w(
      "optional",
      "A property marked with ? that may be missing.",
      "Свойство с ?, которого может не быть.",
    ),
    w(
      "satisfies",
      "Checks a value against a type without widening it.",
      "Проверяет значение по типу, не расширяя его.",
    ),
    w(
      "narrowing",
      "Making a union more specific with checks.",
      "Уточнение объединения типов с помощью проверок.",
    ),
    w(
      "implements",
      "Promises that a class follows an interface.",
      "Обещает, что класс следует интерфейсу.",
    ),
    w(
      "namespace",
      "An older way to group code under one name.",
      "Старый способ собрать код под одним именем.",
    ),
    w(
      "guard",
      "A check like `x is string` that narrows a type.",
      "Проверка вроде `x is string`, которая сужает тип.",
    ),
    w(
      "strict",
      "The tsconfig flag that turns on the toughest checks.",
      "Флаг tsconfig, который включает самые строгие проверки.",
    ),
    w(
      "mapped",
      "A type built by looping over keys: { [K in …]: … }.",
      "Тип, построенный перебором ключей: { [K in …]: … }.",
    ),
    w(
      "module",
      "A file with its own imports and exports.",
      "Файл со своими импортами и экспортами.",
    ),
    w("alias", "Another name for a type.", "Другое имя для типа."),
    w(
      "required",
      "A utility type that makes every property mandatory.",
      "Служебный тип, который делает все свойства обязательными.",
    ),
    w(
      "awaited",
      "A utility type that unwraps a promise's value.",
      "Служебный тип, который достаёт значение из промиса.",
    ),
    w(
      "exclude",
      "A utility type that removes members from a union.",
      "Служебный тип, который убирает члены из объединения.",
    ),
    w(
      "extract",
      "A utility type that keeps the matching members of a union.",
      "Служебный тип, который оставляет подходящие члены объединения.",
    ),
    w(
      "tsconfig",
      "The project's compiler settings file.",
      "Файл с настройками компилятора проекта.",
    ),
    w(
      "compile",
      "Turn TypeScript into JavaScript.",
      "Превратить TypeScript в JavaScript.",
    ),
    w(
      "signature",
      "A function's parameters and return type.",
      "Параметры и тип результата функции.",
    ),
    w(
      "overload",
      "Several signatures for one function.",
      "Несколько сигнатур для одной функции.",
    ),
    w(
      "constraint",
      "A limit on a type parameter: T extends ….",
      "Ограничение параметра типа: T extends ….",
    ),
    w(
      "static",
      "A member of the class itself, not of its instances.",
      "Член самого класса, а не его экземпляров.",
    ),
    w(
      "promise",
      "The type of a value that arrives later.",
      "Тип значения, которое придёт позже.",
    ),
    w(
      "class",
      "A blueprint for making objects.",
      "Шаблон для создания объектов.",
    ),
  ],
  sql: [
    w(
      "select",
      "Picks which columns a query gives back.",
      "Выбирает, какие столбцы вернёт запрос.",
    ),
    w(
      "from",
      "Names the table a query reads.",
      "Называет таблицу, которую читает запрос.",
    ),
    w("where", "Filters rows by a condition.", "Отбирает строки по условию."),
    w(
      "join",
      "Combines rows from two tables.",
      "Объединяет строки двух таблиц.",
    ),
    w(
      "inner",
      "The kind of join that keeps only matching rows.",
      "Вид соединения, который оставляет только совпадающие строки.",
    ),
    w(
      "outer",
      "A join that also keeps rows without a match.",
      "Соединение, которое оставляет и строки без пары.",
    ),
    w(
      "left",
      "The join kind that keeps every row of the first table.",
      "Вид соединения, который оставляет все строки первой таблицы.",
    ),
    w(
      "right",
      "The join kind that keeps every row of the second table.",
      "Вид соединения, который оставляет все строки второй таблицы.",
    ),
    w(
      "group",
      "With BY: puts rows into buckets for aggregates.",
      "С BY: раскладывает строки по группам для агрегатов.",
    ),
    w("order", "With BY: sorts the result.", "С BY: сортирует результат."),
    w(
      "having",
      "Filters groups after aggregation.",
      "Отбирает группы после агрегации.",
    ),
    w(
      "limit",
      "Gives back only the first N rows.",
      "Возвращает только первые N строк.",
    ),
    w("offset", "Skips the first N rows.", "Пропускает первые N строк."),
    w(
      "insert",
      "Adds new rows (with INTO).",
      "Добавляет новые строки (с INTO).",
    ),
    w(
      "update",
      "Changes values in existing rows.",
      "Меняет значения в существующих строках.",
    ),
    w("delete", "Removes rows from a table.", "Удаляет строки из таблицы."),
    w(
      "create",
      "Makes a new table, index or view.",
      "Делает новую таблицу, индекс или представление.",
    ),
    w(
      "table",
      "Rows and columns that store data.",
      "Строки и столбцы, в которых хранятся данные.",
    ),
    w("index", "Speeds up lookups on a column.", "Ускоряет поиск по столбцу."),
    w(
      "view",
      "A saved query you can read from like a table.",
      "Сохранённый запрос, из которого можно читать как из таблицы.",
    ),
    w(
      "distinct",
      "Removes duplicate rows from the result.",
      "Убирает повторяющиеся строки из результата.",
    ),
    w("count", "Gives the number of rows.", "Возвращает количество строк."),
    w("sum", "Adds up a column's values.", "Складывает значения столбца."),
    w("avg", "The mean of a column's values.", "Среднее значений столбца."),
    w(
      "min",
      "The smallest value in a column.",
      "Наименьшее значение в столбце.",
    ),
    w(
      "max",
      "The largest value in a column.",
      "Наибольшее значение в столбце.",
    ),
    w(
      "between",
      "Checks that a value is in a range, ends included.",
      "Проверяет, что значение в диапазоне, включая края.",
    ),
    w(
      "like",
      "Matches text against a pattern with % and _.",
      "Сравнивает текст с шаблоном с % и _.",
    ),
    w(
      "null",
      "A missing or unknown value.",
      "Отсутствующее или неизвестное значение.",
    ),
    w(
      "union",
      "Stacks the results of two queries.",
      "Складывает результаты двух запросов друг под другом.",
    ),
    w(
      "values",
      "Lists the data for new rows after INSERT.",
      "Перечисляет данные новых строк после INSERT.",
    ),
    w(
      "primary",
      "With KEY: the column that identifies each row.",
      "С KEY: столбец, который однозначно определяет строку.",
    ),
    w(
      "foreign",
      "With KEY: a column pointing at another table's row.",
      "С KEY: столбец, который указывает на строку другой таблицы.",
    ),
    w(
      "default",
      "The value a column gets when none is given.",
      "Значение столбца, если другое не указано.",
    ),
    w(
      "check",
      "A constraint whose condition must hold.",
      "Ограничение, условие которого должно выполняться.",
    ),
    w(
      "unique",
      "A constraint: no two rows may share the value.",
      "Ограничение: у двух строк не может быть одинакового значения.",
    ),
    w("alter", "Changes a table's structure.", "Меняет структуру таблицы."),
    w(
      "drop",
      "Deletes a whole table or other object.",
      "Удаляет таблицу или другой объект целиком.",
    ),
    w(
      "cascade",
      "Passes a delete on to the rows that depend on it.",
      "Передаёт удаление строкам, которые от неё зависят.",
    ),
    w(
      "coalesce",
      "Gives the first argument that isn't NULL.",
      "Возвращает первый аргумент, который не NULL.",
    ),
    w(
      "case",
      "SQL's if/else: WHEN … THEN … END.",
      "if/else в SQL: WHEN … THEN … END.",
    ),
    w(
      "exists",
      "True if a subquery gives back any rows.",
      "Истина, если подзапрос возвращает хоть одну строку.",
    ),
    w(
      "with",
      "Starts a CTE: a named subquery for one query.",
      "Начинает CTE: именованный подзапрос для одного запроса.",
    ),
    w(
      "window",
      "The frame of rows a function looks at with OVER.",
      "Набор строк, на который смотрит функция с OVER.",
    ),
    w(
      "over",
      "Turns an aggregate into a window function.",
      "Превращает агрегат в оконную функцию.",
    ),
    w(
      "rank",
      "Numbers rows by order, with gaps after ties.",
      "Нумерует строки по порядку, с пропусками после равных.",
    ),
    w(
      "commit",
      "Saves a transaction's changes for good.",
      "Окончательно сохраняет изменения транзакции.",
    ),
    w(
      "rollback",
      "Undoes a transaction's changes.",
      "Отменяет изменения транзакции.",
    ),
    w("begin", "Starts a transaction.", "Начинает транзакцию."),
    w(
      "returning",
      "Gives back the rows an INSERT, UPDATE or DELETE touched.",
      "Возвращает строки, которые затронул INSERT, UPDATE или DELETE.",
    ),
    w(
      "partition",
      "With BY: splits rows into groups for a window function.",
      "С BY: делит строки на группы для оконной функции.",
    ),
  ],
};
