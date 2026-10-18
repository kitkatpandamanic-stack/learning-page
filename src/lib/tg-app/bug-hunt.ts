/**
 * Bug Hunt's cards: short snippets that either work or hide one bug, with
 * a short explanation in English and Russian shown after each swipe.
 *
 * How a player tells: in Python, JavaScript and TypeScript the comment on a
 * line says what that line should print. A snippet works when it really
 * prints exactly that (and, for TypeScript, the compiler accepts it). SQL
 * runs on the course's sample database (customers, orders, products,
 * employees, movies) and works when it returns what its names promise.
 * bug-hunt.test.ts runs every snippet to check `works` is right.
 */

export type BugHuntSnippet = {
  code: string;
  works: boolean;
  en: string;
  ru: string;
};

const ok = (code: string, en: string, ru: string): BugHuntSnippet => ({
  code: code.trim(),
  works: true,
  en,
  ru,
});

const bug = (code: string, en: string, ru: string): BugHuntSnippet => ({
  code: code.trim(),
  works: false,
  en,
  ru,
});

export const bugHuntSnippets: Record<string, BugHuntSnippet[]> = {
  python: [
    bug(
      `
def add(item, items=[]):
    items.append(item)
    return items

add("tea")
print(add("cake"))  # ['cake']
`,
      "The default list is made once and shared by every call, so the second call returns ['tea', 'cake']. Use items=None and make a new list inside.",
      "Список по умолчанию создаётся один раз и общий для всех вызовов, поэтому второй вызов вернёт ['tea', 'cake']. Пишите items=None и создавайте новый список внутри.",
    ),
    ok(
      `
word = "level"
is_pal = word == word[::-1]
print(is_pal)  # True
`,
      "word[::-1] is the word reversed, and 'level' reads the same both ways.",
      "word[::-1] — это слово задом наперёд, а 'level' читается одинаково в обе стороны.",
    ),
    bug(
      `
total = 0
for n in range(1, 10):
    total += n
print(total)  # 55
`,
      "range(1, 10) stops before 10, so the loop adds 1 to 9 and prints 45. Use range(1, 11).",
      "range(1, 10) останавливается перед 10: цикл складывает числа от 1 до 9 и выводит 45. Нужен range(1, 11).",
    ),
    ok(
      `
minutes = 135
hours, mins = divmod(minutes, 60)
print(f"{hours}h {mins}m")  # 2h 15m
`,
      "divmod(135, 60) returns the whole part and the remainder at once: (2, 15).",
      "divmod(135, 60) сразу возвращает целую часть и остаток: (2, 15).",
    ),
    bug(
      `
nums = [1, 2, 2, 3]
for n in nums:
    if n == 2:
        nums.remove(n)
print(nums)  # [1, 3]
`,
      "Removing items from a list while looping over it makes the loop skip the next item, so one 2 stays: [1, 2, 3]. Build a new list instead.",
      "Если удалять элементы из списка прямо в цикле по нему, цикл пропускает следующий элемент, и одна двойка остаётся: [1, 2, 3]. Лучше собрать новый список.",
    ),
    ok(
      `
stock = {"tea": 3}
count = stock.get("cake", 0)
print(count)  # 0
`,
      "get() returns the default 0 when the key is missing, instead of raising KeyError.",
      "get() возвращает значение по умолчанию 0, если ключа нет, вместо ошибки KeyError.",
    ),
    bug(
      `
minutes = 135
hours = minutes / 60
mins = minutes % 60
print(f"{hours}h {mins}m")  # 2h 15m
`,
      "/ always gives a float, so it prints 2.25h 15m. Whole hours need floor division: minutes // 60.",
      "/ всегда даёт дробное число, поэтому выводится 2.25h 15m. Для целых часов нужно целочисленное деление: minutes // 60.",
    ),
    ok(
      `
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

add("tea")
print(add("cake"))  # ['cake']
`,
      "items=None gives every call its own new list, so the earlier 'tea' doesn't leak into this call.",
      "items=None даёт каждому вызову свой новый список, поэтому прежний 'tea' сюда не попадает.",
    ),
    bug(
      `
a = 0.1
b = 0.2
print(a + b == 0.3)  # True
`,
      "Floats are stored in binary, so 0.1 + 0.2 is 0.30000000000000004 and the comparison is False. Compare with math.isclose().",
      "Дробные числа хранятся в двоичном виде, поэтому 0.1 + 0.2 равно 0.30000000000000004 и сравнение даёт False. Сравнивайте через math.isclose().",
    ),
    ok(
      `
nums = [1, 2, 2, 3]
nums = [n for n in nums if n != 2]
print(nums)  # [1, 3]
`,
      "The comprehension builds a new list of every item that isn't 2, without changing the list it reads.",
      "Генератор списка создаёт новый список из всех элементов, кроме 2, и не меняет тот, который читает.",
    ),
    bug(
      `
name = "  panda  "
name.strip()
print(f"[{name}]")  # [panda]
`,
      "Strings can't be changed: strip() returns a new string, and here it's thrown away. Write name = name.strip().",
      "Строки неизменяемы: strip() возвращает новую строку, а здесь она теряется. Нужно name = name.strip().",
    ),
    ok(
      `
counts = {}
for ch in "banana":
    counts[ch] = counts.get(ch, 0) + 1
print(counts["a"])  # 3
`,
      "counts.get(ch, 0) starts each new letter at 0, so 'a' in 'banana' ends up at 3.",
      "counts.get(ch, 0) начинает счёт новой буквы с 0, поэтому у 'a' в 'banana' получается 3.",
    ),
    bug(
      `
def double(n):
    n * 2

result = double(4)
print(result)  # 8
`,
      "The function works out n * 2 but never returns it, so it returns None. Add return.",
      "Функция считает n * 2, но не возвращает результат, поэтому возвращает None. Нужен return.",
    ),
    ok(
      `
laugh = "Ha" * 3
print(laugh)  # HaHaHa
print(len(laugh))  # 6
`,
      "Multiplying a string by a number repeats it, so you get 'HaHaHa', 6 characters long.",
      "Умножение строки на число повторяет её: получается 'HaHaHa' длиной 6 символов.",
    ),
    bug(
      `
nums = [3, 1, 2]
nums = nums.sort()
print(nums)  # [1, 2, 3]
`,
      "sort() sorts the list in place and returns None, so nums becomes None. Call nums.sort() on its own, or use sorted(nums).",
      "sort() сортирует список на месте и возвращает None, поэтому nums становится None. Вызовите просто nums.sort() или используйте sorted(nums).",
    ),
    ok(
      `
nums = [3, 1, 2]
ordered = sorted(nums)
print(ordered)  # [1, 2, 3]
print(nums)  # [3, 1, 2]
`,
      "sorted() returns a new sorted list and leaves the original as it was.",
      "sorted() возвращает новый отсортированный список, а исходный остаётся как был.",
    ),
    bug(
      `
day = "Mon"
if day == "Sat" or "Sun":
    print("weekend")
else:
    print("workday")  # workday
`,
      "This reads as (day == 'Sat') or 'Sun', and a non-empty string is always true, so it prints weekend. Write day in ('Sat', 'Sun').",
      "Python читает это как (day == 'Sat') or 'Sun', а непустая строка всегда истинна, поэтому выводится weekend. Пишите day in ('Sat', 'Sun').",
    ),
    ok(
      `
fruits = ["fig", "kiwi", "plum"]
print(fruits[-1])  # plum
print(fruits[1:])  # ['kiwi', 'plum']
`,
      "Negative indexes count from the end, and the slice [1:] takes everything after the first item.",
      "Отрицательные индексы считаются с конца, а срез [1:] берёт всё после первого элемента.",
    ),
    bug(
      `
try:
    int("abc")
except Exception:
    print("error")
except ValueError:
    print("bad number")  # bad number
`,
      "ValueError is a kind of Exception, so the first except catches it and prints error. Put the more specific except first.",
      "ValueError — разновидность Exception, поэтому её ловит первый except и выводит error. Более конкретный except ставьте первым.",
    ),
    ok(
      `
day = "Sun"
if day in ("Sat", "Sun"):
    print("weekend")  # weekend
else:
    print("workday")
`,
      "in checks whether day equals any item of the tuple, so 'Sun' counts as the weekend.",
      "in проверяет, совпадает ли day с одним из элементов кортежа, поэтому 'Sun' — выходной.",
    ),
    bug(
      `
class Cart:
    items = []

a, b = Cart(), Cart()
a.items.append("tea")
print(b.items)  # []
`,
      "items = [] in the class body is one list shared by every Cart, so b sees 'tea' too. Make the list in __init__ with self.items = [].",
      "items = [] в теле класса — один список на все объекты Cart, поэтому b тоже видит 'tea'. Создавайте список в __init__: self.items = [].",
    ),
    ok(
      `
a, b = 1, 2
a, b = b, a
print(a, b)  # 2 1
`,
      "The right side builds the pair (2, 1) first and then unpacks it, so the swap needs no extra variable.",
      "Сначала справа собирается пара (2, 1), потом она распаковывается, поэтому обмен работает без лишней переменной.",
    ),
    bug(
      `
async def get_name():
    return "Panda"

name = get_name()
print(name.upper())  # PANDA
`,
      "Calling an async function without await gives a coroutine object, not the string, so .upper() fails with AttributeError. Await it inside async code.",
      "Вызов async-функции без await даёт объект корутины, а не строку, поэтому .upper() падает с AttributeError. Нужен await внутри асинхронного кода.",
    ),
    ok(
      `
try:
    n = int("42")
except ValueError:
    print("bad number")
else:
    print(n + 1)  # 43
`,
      "int('42') succeeds, so the except block is skipped and else runs with n = 42.",
      "int('42') срабатывает без ошибки, поэтому except пропускается и выполняется else с n = 42.",
    ),
    ok(
      `
class Cart:
    def __init__(self):
        self.items = []

a, b = Cart(), Cart()
a.items.append("tea")
print(b.items)  # []
`,
      "__init__ runs for each new object, so every cart gets its own empty list.",
      "__init__ выполняется для каждого нового объекта, поэтому у каждой корзины свой пустой список.",
    ),
    ok(
      `
ages = [21, 17, 30]
adults = all(a >= 18 for a in ages)
print(adults)  # False
`,
      "all() is True only if every age is at least 18, and 17 makes it False.",
      "all() даёт True, только если все возрасты не меньше 18, а из-за 17 получается False.",
    ),
  ],

  javascript: [
    bug(
      `
const input = "5";
if (input === 5) {
  console.log("five"); // five
}
`,
      "input is the string '5' and === never converts types, so '5' === 5 is false. Convert first: Number(input) === 5.",
      "input — строка '5', а === не приводит типы, поэтому '5' === 5 даёт false. Сначала преобразуйте: Number(input) === 5.",
    ),
    ok(
      `
const a = [1, 2, 3];
const b = [1, 2, 3];
console.log(a === b); // false
`,
      "=== compares objects by reference, and these are two different arrays, so false is right even with the same items.",
      "=== сравнивает объекты по ссылке, а это два разных массива, поэтому false — верно, хоть элементы и одинаковые.",
    ),
    bug(
      `
async function getUser() {
  return { name: "Ann" };
}
const user = getUser();
console.log(user.name); // Ann
`,
      "An async function always returns a Promise, and a Promise has no name, so it prints undefined. Write await getUser().",
      "async-функция всегда возвращает Promise, а у Promise нет поля name, поэтому выводится undefined. Нужно await getUser().",
    ),
    ok(
      `
const nums = [10, 9, 1];
nums.sort((a, b) => a - b);
console.log(nums); // [ 1, 9, 10 ]
`,
      "a - b is negative when a is smaller, so the numbers are sorted by value: 1, 9, 10.",
      "a - b отрицательно, когда a меньше, поэтому числа сортируются по значению: 1, 9, 10.",
    ),
    bug(
      `
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns[0]()); // 0
`,
      "var makes one i for the whole loop, and by the time fns[0] runs it's 3. let gives each turn its own i.",
      "var создаёт одну переменную i на весь цикл, и когда вызывается fns[0], она уже равна 3. С let у каждого шага своя i.",
    ),
    ok(
      `
const user = { name: "Ann" };
user.name = "Bo";
console.log(user.name); // Bo
`,
      "const stops you giving user a new value, but the object itself can still change, so this prints Bo.",
      "const запрещает присвоить user новое значение, но сам объект менять можно, поэтому выводится Bo.",
    ),
    bug(
      `
const nums = [10, 9, 1];
nums.sort();
console.log(nums); // [ 1, 9, 10 ]
`,
      "Without a compare function sort() compares items as strings, and '10' comes before '9': [ 1, 10, 9 ]. Pass (a, b) => a - b.",
      "Без функции сравнения sort() сравнивает элементы как строки, и '10' идёт раньше '9': [ 1, 10, 9 ]. Передайте (a, b) => a - b.",
    ),
    ok(
      `
async function getUser() {
  return { name: "Ann" };
}
const user = await getUser();
console.log(user.name); // Ann
`,
      "await waits for the Promise and gives back the object inside it, so user.name is 'Ann'.",
      "await ждёт Promise и возвращает объект из него, поэтому user.name — 'Ann'.",
    ),
    bug(
      `
const qty = "2";
const total = qty + 3;
console.log(total); // 5
`,
      "+ with a string joins text, so '2' + 3 is '23'. Convert first: Number(qty) + 3.",
      "+ со строкой склеивает текст, поэтому '2' + 3 даёт '23'. Сначала преобразуйте: Number(qty) + 3.",
    ),
    ok(
      `
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns[0]()); // 0
`,
      "With let, each turn of the loop gets its own i, so the first function remembers 0.",
      "С let у каждого шага цикла своя i, поэтому первая функция запоминает 0.",
    ),
    bug(
      `
const nums = [1, 2, 3];
const doubled = nums.map((n) => {
  n * 2;
});
console.log(doubled); // [ 2, 4, 6 ]
`,
      "With curly braces an arrow function needs return; without it every item becomes undefined. Drop the braces or add return.",
      "Стрелочной функции с фигурными скобками нужен return, иначе каждый элемент станет undefined. Уберите скобки или добавьте return.",
    ),
    ok(
      `
const prices = [5, 10, 15];
const add = (a, b) => a + b;
const sum = prices.reduce(add, 0);
console.log(sum); // 30
`,
      "reduce starts from 0 and adds each price in turn: 0 + 5 + 10 + 15 = 30.",
      "reduce начинает с 0 и по очереди прибавляет каждую цену: 0 + 5 + 10 + 15 = 30.",
    ),
    bug(
      `
const costs = [5, 10, 15];
let sum = 0;
for (let i = 1; i < costs.length; i++) {
  sum += costs[i];
}
console.log(sum); // 30
`,
      "The loop starts at index 1 and skips the first cost, so the sum is 25. Start with let i = 0.",
      "Цикл начинается с индекса 1 и пропускает первую цену, поэтому сумма 25. Начинайте с let i = 0.",
    ),
    ok(
      `
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2);
console.log(doubled); // [ 2, 4, 6 ]
`,
      "Without braces the arrow function returns n * 2 by itself, so map makes [ 2, 4, 6 ].",
      "Без фигурных скобок стрелочная функция сама возвращает n * 2, поэтому map даёт [ 2, 4, 6 ].",
    ),
    bug(
      `
const cart = [];
const add = (a, b) => a + b;
const total = cart.reduce(add);
console.log(total); // 0
`,
      "reduce() on an empty array with no starting value throws a TypeError. Pass 0 as the second argument.",
      "reduce() на пустом массиве без начального значения выбрасывает TypeError. Передайте 0 вторым аргументом.",
    ),
    ok(
      `
const u = { profile: null };
const city = u.profile?.city ?? "none";
console.log(city); // none
`,
      "?. stops at null and gives undefined instead of crashing, then ?? swaps undefined for 'none'.",
      "?. останавливается на null и даёт undefined вместо ошибки, а ?? заменяет undefined на 'none'.",
    ),
    bug(
      `
const settings = { volume: 0 };
const volume = settings.volume || 50;
console.log(volume); // 0
`,
      "|| replaces any falsy value, and 0 is falsy, so volume becomes 50. Use ??, which only replaces null and undefined.",
      "|| заменяет любое ложное значение, а 0 — ложное, поэтому volume становится 50. Используйте ??: он заменяет только null и undefined.",
    ),
    ok(
      `
const list = [{ id: 1 }];
const ok = list.some((p) => p.id === 1);
console.log(ok); // true
`,
      "some() runs the check on each item and returns true as soon as one has id 1.",
      "some() проверяет каждый элемент и возвращает true, как только находит объект с id 1.",
    ),
    bug(
      `
const cat = {
  name: "Tom",
  hi: () => \`I am \${this.name}\`,
};
console.log(cat.hi()); // I am Tom
`,
      "Arrow functions don't get their own this, so this isn't the cat object here. Write a normal method: hi() { … }.",
      "У стрелочной функции нет своего this, поэтому здесь this — не объект cat. Напишите обычный метод: hi() { … }.",
    ),
    ok(
      `
function hi({ name = "friend" } = {}) {
  return \`Hi, \${name}!\`;
}
console.log(hi()); // Hi, friend!
`,
      "Called with nothing, the parameter falls back to {}, and name falls back to 'friend'.",
      "При вызове без аргументов параметр становится {}, а name — 'friend'.",
    ),
    bug(
      `
const a = { tags: ["new"] };
const b = { ...a };
b.tags.push("sale");
console.log(a.tags); // [ 'new' ]
`,
      "Spread makes a shallow copy: b.tags is the same array as a.tags, so a.tags gets 'sale' too. Copy the array as well: tags: [...a.tags].",
      "Spread делает поверхностную копию: b.tags — тот же массив, что и a.tags, поэтому в a.tags тоже появляется 'sale'. Копируйте и массив: tags: [...a.tags].",
    ),
    ok(
      `
const a = [1, 2];
const b = [...a, 3];
console.log(a); // [ 1, 2 ]
console.log(b); // [ 1, 2, 3 ]
`,
      "[...a, 3] builds a new array, so a stays [ 1, 2 ].",
      "[...a, 3] создаёт новый массив, поэтому a остаётся [ 1, 2 ].",
    ),
    bug(
      `
async function load() {
  throw new Error("offline");
}
try {
  load();
} catch {
  console.log("caught"); // caught
}
`,
      "Without await, load() just returns a rejected Promise after try/catch is done, so the error isn't caught. Write await load().",
      "Без await load() просто возвращает отклонённый Promise, когда try/catch уже закончился, поэтому ошибка не поймана. Нужно await load().",
    ),
    ok(
      `
const tags = ["a", "b", "a"];
const unique = [...new Set(tags)];
console.log(unique.length); // 2
`,
      "A Set keeps each value once, so the second 'a' is dropped and two tags remain.",
      "Set хранит каждое значение один раз, поэтому второе 'a' отбрасывается и остаётся два тега.",
    ),
    bug(
      `
const n = Number("abc");
if (n === NaN) {
  console.log("bad"); // bad
}
`,
      "NaN isn't equal to anything, not even itself, so n === NaN is always false. Use Number.isNaN(n).",
      "NaN не равен ничему, даже самому себе, поэтому n === NaN всегда false. Используйте Number.isNaN(n).",
    ),
    ok(
      `
function counter() {
  let n = 0;
  return () => ++n;
}
const next = counter();
next();
console.log(next()); // 2
`,
      "The inner function remembers n between calls, so the second call returns 2.",
      "Внутренняя функция помнит n между вызовами, поэтому второй вызов возвращает 2.",
    ),
  ],

  typescript: [
    bug(
      `
function shout(s: string | undefined) {
  return s.toUpperCase();
}
console.log(shout("hi")); // HI
`,
      "TypeScript stops this: s might be undefined, and undefined has no toUpperCase(). Check s first.",
      "TypeScript не пропустит это: s может быть undefined, а у undefined нет toUpperCase(). Сначала проверьте s.",
    ),
    ok(
      `
type Res =
  | { ok: true; value: number }
  | { ok: false; error: string };
const r: Res = { ok: true, value: 7 };
if (r.ok) console.log(r.value); // 7
`,
      "Checking r.ok narrows the union to the ok: true shape, which has value.",
      "Проверка r.ok сужает объединение до варианта ok: true, у которого есть value.",
    ),
    bug(
      `
type Shape = "circle" | "square";
function sides(s: Shape): number {
  switch (s) {
    case "square": return 4;
  }
}
console.log(sides("square")); // 4
`,
      "There's no case for 'circle', so the function can end without returning a number, and TypeScript reports an error. Handle every case.",
      "Для 'circle' нет case, функция может закончиться без return, и TypeScript сообщает об ошибке. Обработайте все варианты.",
    ),
    ok(
      `
function shout(s?: string) {
  if (!s) return "";
  return s.toUpperCase();
}
console.log(shout("hi")); // HI
`,
      "After if (!s) return, TypeScript knows s is a string on the next line, so toUpperCase() is allowed.",
      "После if (!s) return TypeScript знает, что дальше s — строка, поэтому toUpperCase() разрешён.",
    ),
    bug(
      `
type User = { name: string };
const data = JSON.parse("{}") as User;
console.log(data.name.length); // 0
`,
      "as User only tells TypeScript to trust you: the object is empty, so data.name is undefined and .length crashes. Check data at runtime.",
      "as User просто велит TypeScript поверить на слово: объект пустой, data.name — undefined, и .length падает. Проверяйте данные во время выполнения.",
    ),
    ok(
      `
function len(x: unknown) {
  if (typeof x === "string") {
    return x.length;
  }
  return 0;
}
console.log(len("panda")); // 5
`,
      "typeof x === 'string' narrows unknown to string inside the if, so x.length is allowed.",
      "typeof x === 'string' сужает unknown до string внутри if, поэтому x.length разрешён.",
    ),
    bug(
      `
type Res =
  | { ok: true; value: number }
  | { ok: false; error: string };
const show = (r: Res) => r.value;
const r: Res = { ok: true, value: 7 };
console.log(show(r)); // 7
`,
      "value only exists when ok is true, and show() doesn't check, so TypeScript reports an error. Check r.ok first.",
      "value есть только при ok: true, а show() это не проверяет, поэтому TypeScript сообщает об ошибке. Сначала проверьте r.ok.",
    ),
    ok(
      `
const point: [number, number] = [3, 4];
const [x, y] = point;
console.log(Math.hypot(x, y)); // 5
`,
      "The tuple holds exactly two numbers, destructuring names them, and Math.hypot(3, 4) is 5.",
      "В кортеже ровно два числа, деструктуризация даёт им имена, а Math.hypot(3, 4) равно 5.",
    ),
    bug(
      `
async function load(): Promise<number> {
  return 3;
}
const n = load();
console.log(n + 1); // 4
`,
      "load() returns a Promise<number>, not a number, so TypeScript won't let you add 1. Write await load().",
      "load() возвращает Promise<number>, а не число, поэтому TypeScript не даст прибавить 1. Нужно await load().",
    ),
    ok(
      `
const sizes = ["S", "M", "L"] as const;
type Size = (typeof sizes)[number];
const pick: Size = "M";
console.log(sizes.indexOf(pick)); // 1
`,
      "as const keeps the exact strings, so Size is 'S' | 'M' | 'L', and 'M' sits at index 1.",
      "as const сохраняет точные строки, поэтому Size — 'S' | 'M' | 'L', а 'M' стоит под индексом 1.",
    ),
    bug(
      `
const days: readonly string[] = ["Mon"];
days.push("Tue");
console.log(days.length); // 2
`,
      "A readonly array has no push(), so TypeScript reports an error. Make a new array instead: [...days, 'Tue'].",
      "У readonly-массива нет push(), поэтому TypeScript сообщает об ошибке. Создайте новый массив: [...days, 'Tue'].",
    ),
    ok(
      `
const scores = [10, 20];
let total = 0;
for (const s of scores) {
  total += s;
}
console.log(total); // 30
`,
      "for...of gives the values themselves, so total is 10 + 20 = 30.",
      "for...of перебирает сами значения, поэтому total = 10 + 20 = 30.",
    ),
    bug(
      `
type Opts = { verbose?: boolean };
function run(o: Opts) {
  return o.verbose ? "loud" : "quiet";
}
const mode = run({ verbos: true });
console.log(mode); // loud
`,
      "verbos is a typo, and TypeScript rejects unknown properties in an object literal. Without that check it would print quiet.",
      "verbos — опечатка, а TypeScript не принимает неизвестные свойства в объектном литерале. Без этой проверки вывелось бы quiet.",
    ),
    ok(
      `
function first<T>(xs: T[]): T {
  return xs[0];
}
const word = first(["a", "b"]);
console.log(word.toUpperCase()); // A
`,
      "T is inferred as string from the array, so word is a string and toUpperCase() type-checks.",
      "T выводится как string из массива, поэтому word — строка, и toUpperCase() проходит проверку.",
    ),
    bug(
      `
const scores = [10, 20];
let total = 0;
for (const i in scores) {
  total += i;
}
console.log(total); // 30
`,
      "for...in gives the indexes as strings ('0', '1'), not the values, and TypeScript won't add a string to a number. Use for...of.",
      "for...in перебирает индексы в виде строк ('0', '1'), а не значения, и TypeScript не даст прибавить строку к числу. Используйте for...of.",
    ),
    ok(
      `
class Point {
  constructor(public x: number) {}
  move(by: number) {
    return new Point(this.x + by);
  }
}
const p = new Point(1).move(2);
console.log(p.x); // 3
`,
      "public x in the constructor declares and sets the property in one go, and move() returns a new Point at 1 + 2.",
      "public x в конструкторе сразу объявляет и заполняет свойство, а move() возвращает новый Point в точке 1 + 2.",
    ),
    bug(
      `
class Account {
  private balance = 0;
}
const acc = new Account();
acc.balance = 100;
console.log(acc.balance); // 100
`,
      "balance is private, so code outside the class can't read or change it, and TypeScript reports an error. Add a method like deposit().",
      "balance — private, поэтому код вне класса не может его читать и менять, и TypeScript сообщает об ошибке. Добавьте метод, например deposit().",
    ),
    ok(
      `
const id: number = 42;
const input: string = "42";
if (id === Number(input)) {
  console.log("match"); // match
}
`,
      "Number('42') turns the text into the number 42, so the types match and the comparison is true.",
      "Number('42') превращает текст в число 42, типы совпадают, и сравнение истинно.",
    ),
    bug(
      `
const id: number = 42;
const input: string = "42";
if (id === input) {
  console.log("match"); // match
}
`,
      "A number never equals a string with ===, so TypeScript reports that this comparison can't be true. Convert with Number(input).",
      "Число никогда не равно строке по ===, поэтому TypeScript сообщает, что это сравнение не может быть истинным. Преобразуйте: Number(input).",
    ),
    ok(
      `
class Animal {
  constructor(public name: string) {}
}
class Dog extends Animal {
  bark = () => \`\${this.name}: woof\`;
}
const d = new Dog("Rex");
console.log(d.bark()); // Rex: woof
`,
      "Dog inherits name from Animal's constructor, and the arrow field reads it after that constructor has run.",
      "Dog наследует name из конструктора Animal, а стрелочное поле читает его уже после того, как этот конструктор отработал.",
    ),
    bug(
      `
function longest<T>(a: T, b: T) {
  return a.length >= b.length ? a : b;
}
console.log(longest("ab", "c")); // ab
`,
      "T could be any type, such as a number with no length, so TypeScript reports an error. Constrain it: T extends { length: number }.",
      "T может быть любым типом, например числом без length, поэтому TypeScript сообщает об ошибке. Добавьте ограничение: T extends { length: number }.",
    ),
    ok(
      `
function hi(name: string, end = "!") {
  return \`Hi, \${name}\${end}\`;
}
console.log(hi("Ann")); // Hi, Ann!
console.log(hi("Bo", "?")); // Hi, Bo?
`,
      "end falls back to '!' when it's left out, and a second argument replaces it.",
      "Если end не передан, он равен '!', а второй аргумент его заменяет.",
    ),
    bug(
      `
const r: number[] = [3, 1, 2];
const up = r.sort((a, b) => a - b);
console.log(up); // [ 1, 2, 3 ]
console.log(r); // [ 3, 1, 2 ]
`,
      "sort() changes the array itself and returns that same array, so r is sorted too: [ 1, 2, 3 ]. Copy first: [...r].sort(…).",
      "sort() меняет сам массив и возвращает его же, поэтому r тоже отсортирован: [ 1, 2, 3 ]. Сначала скопируйте: [...r].sort(…).",
    ),
    ok(
      `
function text(x: unknown): x is string {
  return typeof x === "string";
}
const v: unknown = "panda";
if (text(v)) console.log(v.length); // 5
`,
      "The return type x is string tells TypeScript that v is a string inside the if.",
      "Тип возврата x is string говорит TypeScript, что внутри if v — строка.",
    ),
    bug(
      `
function num(x: unknown): x is number {
  return x !== undefined;
}
const xs: unknown[] = [1, "2"];
const nums = xs.filter(num);
console.log(nums); // [ 1 ]
`,
      "The guard promises number but only rules out undefined, so '2' passes too: [ 1, '2' ]. Check typeof x === 'number'.",
      "Проверка обещает number, но отсеивает только undefined, поэтому '2' тоже проходит: [ 1, '2' ]. Проверяйте typeof x === 'number'.",
    ),
    ok(
      `
type Light = "red" | "green";
function go(l: Light): boolean {
  switch (l) {
    case "red": return false;
    case "green": return true;
  }
}
console.log(go("green")); // true
`,
      "Both cases return, so TypeScript sees that the switch covers every Light and the function always returns a boolean.",
      "Оба case возвращают значение, поэтому TypeScript видит, что switch охватывает все варианты Light и функция всегда возвращает boolean.",
    ),
  ],

  sql: [
    bug(
      `
SELECT name
FROM customers
WHERE city = NULL;
`,
      "Nothing equals NULL, not even NULL, so city = NULL is never true and no rows come back. Use city IS NULL.",
      "Ничто не равно NULL, даже сам NULL, поэтому city = NULL никогда не истинно и строк нет. Нужно city IS NULL.",
    ),
    ok(
      `
SELECT name,
  COALESCE(city, 'unknown') AS city
FROM customers
WHERE country = 'UK';
`,
      "COALESCE returns its first argument that isn't NULL, so a customer with no city shows 'unknown'.",
      "COALESCE возвращает первый аргумент, который не NULL, поэтому у клиента без города будет 'unknown'.",
    ),
    bug(
      `
SELECT name FROM employees
WHERE id NOT IN (
  SELECT manager_id FROM employees
);
`,
      "The CEO's manager_id is NULL, and NOT IN with a NULL in the list is never true, so no rows come back. Use NOT EXISTS, or skip the NULLs.",
      "У CEO manager_id равен NULL, а NOT IN со списком, где есть NULL, никогда не истинно, поэтому строк нет. Используйте NOT EXISTS или отбросьте NULL.",
    ),
    ok(
      `
SELECT e.name FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM employees r
  WHERE r.manager_id = e.id
);
`,
      "NOT EXISTS only asks whether a matching row exists, so the NULL manager_id doesn't get in the way: these are the people who manage no one.",
      "NOT EXISTS только проверяет, есть ли подходящая строка, поэтому NULL в manager_id не мешает: это сотрудники без подчинённых.",
    ),
    bug(
      `
SELECT c.name, COUNT(*) AS orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
GROUP BY c.id, c.name;
`,
      "COUNT(*) counts rows, and a customer with no orders still gets one row full of NULLs, so they show 1. Use COUNT(o.id).",
      "COUNT(*) считает строки, а у клиента без заказов всё равно есть одна строка с NULL, поэтому выходит 1. Нужно COUNT(o.id).",
    ),
    ok(
      `
SELECT c.name, COUNT(o.id) AS paid
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
  AND o.status = 'paid'
GROUP BY c.id, c.name;
`,
      "With the status check inside ON, customers without paid orders keep their row, and COUNT(o.id) gives them 0.",
      "Когда проверка статуса стоит в ON, клиенты без оплаченных заказов сохраняют свою строку, и COUNT(o.id) даёт им 0.",
    ),
    bug(
      `
SELECT c.name, COUNT(o.id) AS paid
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
WHERE o.status = 'paid'
GROUP BY c.id, c.name;
`,
      "WHERE runs after the join and drops the NULL rows, so customers with no paid orders vanish instead of showing 0. Move the check into ON.",
      "WHERE работает после соединения и отбрасывает строки с NULL, поэтому клиенты без оплаченных заказов пропадают, а не показывают 0. Перенесите условие в ON.",
    ),
    ok(
      `
SELECT category, AVG(price) AS avg
FROM products
GROUP BY category
HAVING AVG(price) > 10;
`,
      "HAVING runs after GROUP BY, so it can keep only the categories whose average price is over 10.",
      "HAVING выполняется после GROUP BY, поэтому может оставить только категории со средней ценой больше 10.",
    ),
    bug(
      `
SELECT category, AVG(price)
FROM products
WHERE AVG(price) > 10
GROUP BY category;
`,
      "WHERE filters single rows before grouping, so it can't use AVG(), and PostgreSQL reports an error. Filter groups with HAVING.",
      "WHERE фильтрует отдельные строки до группировки и не может использовать AVG(), поэтому PostgreSQL выдаёт ошибку. Группы фильтрует HAVING.",
    ),
    ok(
      `
SELECT DISTINCT ON (category)
  category, name, price
FROM products
ORDER BY category, price DESC;
`,
      "DISTINCT ON keeps the first row of each category, and ORDER BY puts the most expensive product first.",
      "DISTINCT ON оставляет первую строку каждой категории, а ORDER BY ставит самый дорогой товар первым.",
    ),
    bug(
      `
SELECT category, name, MAX(price)
FROM products
GROUP BY category;
`,
      "Each category has several names and PostgreSQL won't pick one: name must be in GROUP BY or inside an aggregate, so this is an error.",
      "В каждой категории несколько названий, и PostgreSQL не станет выбирать одно: name должен быть в GROUP BY или внутри агрегатной функции, иначе ошибка.",
    ),
    ok(
      `
SELECT ROUND(
  100.0 * COUNT(city) / COUNT(*)
) AS pct_with_city
FROM customers;
`,
      "100.0 makes the maths decimal, so 1800.0 / 20 is 90, and ROUND gives a whole percentage.",
      "100.0 делает вычисление дробным, поэтому 1800.0 / 20 = 90, а ROUND даёт целый процент.",
    ),
    bug(
      `
SELECT
  COUNT(city) / COUNT(*) AS share
FROM customers;
`,
      "Both counts are integers, so 18 / 20 is integer division and gives 0. Multiply by 1.0 first to get 0.9.",
      "Оба COUNT — целые числа, поэтому 18 / 20 делится нацело и даёт 0. Сначала умножьте на 1.0, чтобы получить 0.9.",
    ),
    ok(
      `
SELECT COUNT(*) AS march
FROM orders
WHERE ordered_at >= '2025-03-01'
  AND ordered_at < '2025-04-01';
`,
      "From midnight on 1 March up to, but not including, 1 April covers every moment of March.",
      "От полуночи 1 марта до 1 апреля, не включая его, — это весь март до последней секунды.",
    ),
    bug(
      `
SELECT name, city
FROM customers
ORDER BY city DESC
LIMIT 3;
`,
      "PostgreSQL sorts NULL as larger than any value, so with DESC the two customers without a city come first. Add NULLS LAST.",
      "PostgreSQL считает NULL больше любого значения, поэтому при DESC первыми идут два клиента без города. Добавьте NULLS LAST.",
    ),
    ok(
      `
SELECT e.name, m.name AS boss
FROM employees e
LEFT JOIN employees m
  ON m.id = e.manager_id;
`,
      "The table is joined to itself, and LEFT JOIN keeps the CEO, who has no manager, with boss NULL.",
      "Таблица соединяется сама с собой, а LEFT JOIN сохраняет CEO, у которого нет начальника, с boss = NULL.",
    ),
    bug(
      `
SELECT COUNT(*) AS march
FROM orders
WHERE ordered_at BETWEEN
  '2025-03-01' AND '2025-03-31';
`,
      "'2025-03-31' means midnight at the start of 31 March, so an order later that day is missed. Use ordered_at < '2025-04-01'.",
      "'2025-03-31' — это полночь в начале 31 марта, поэтому заказ, сделанный позже в тот день, не попадает. Пишите ordered_at < '2025-04-01'.",
    ),
    ok(
      `
SELECT
  COUNT(DISTINCT customer_id)
  AS customers
FROM orders;
`,
      "DISTINCT counts each customer once, however many orders they placed.",
      "DISTINCT считает каждого клиента один раз, сколько бы заказов он ни сделал.",
    ),
    bug(
      `
SELECT COUNT(customer_id)
  AS customers
FROM orders;
`,
      "This counts orders, all 40 of them, so a customer with several orders is counted each time. Use COUNT(DISTINCT customer_id).",
      "Здесь считаются заказы, все 40, поэтому клиент с несколькими заказами учитывается каждый раз. Нужно COUNT(DISTINCT customer_id).",
    ),
    ok(
      `
SELECT title
FROM movies
WHERE LOWER(title) LIKE '%bamboo%';
`,
      "LOWER() turns the title into lower case first, so 'Bamboo' matches '%bamboo%'.",
      "LOWER() сначала переводит название в нижний регистр, поэтому 'Bamboo' совпадает с '%bamboo%'.",
    ),
    bug(
      `
SELECT title
FROM movies
WHERE title LIKE '%bamboo%';
`,
      "LIKE is case-sensitive, so '%bamboo%' doesn't match 'The Bamboo Heist'. Use ILIKE.",
      "LIKE учитывает регистр, поэтому '%bamboo%' не находит 'The Bamboo Heist'. Используйте ILIKE.",
    ),
    ok(
      `
WITH ranked AS (
  SELECT name, RANK() OVER (
    ORDER BY salary DESC) AS pos
  FROM employees
)
SELECT name FROM ranked
WHERE pos <= 3;
`,
      "The CTE works out pos first, so the outer query can filter on it and get the three best-paid people.",
      "CTE сначала вычисляет pos, поэтому внешний запрос может по нему фильтровать и получить троих с самой высокой зарплатой.",
    ),
    bug(
      `
SELECT name, RANK() OVER (
  ORDER BY salary DESC) AS pos
FROM employees
WHERE pos <= 3;
`,
      "WHERE runs before SELECT, so the pos column doesn't exist there yet and PostgreSQL reports an error. Rank in a CTE or subquery, then filter.",
      "WHERE выполняется раньше SELECT, поэтому столбца pos там ещё нет, и PostgreSQL выдаёт ошибку. Посчитайте ранг в CTE или подзапросе, а потом фильтруйте.",
    ),
    ok(
      `
SELECT name FROM products
WHERE category IN ('tea', 'snacks')
  AND stock > 0;
`,
      "IN lists both categories in one condition, so AND stock > 0 applies to both.",
      "IN перечисляет обе категории в одном условии, поэтому AND stock > 0 применяется к обеим.",
    ),
    bug(
      `
SELECT name FROM products
WHERE category = 'tea'
  OR category = 'snacks'
  AND stock > 0;
`,
      "AND binds tighter than OR, so this means tea OR (snacks in stock), and Earl Grey with stock 0 sneaks in. Use parentheses or IN.",
      "AND связывает сильнее, чем OR, поэтому выходит tea OR (snacks в наличии), и Earl Grey с остатком 0 попадает в список. Нужны скобки или IN.",
    ),
    ok(
      `
SELECT name, price * 1.2 AS gross
FROM products
ORDER BY gross DESC
LIMIT 3;
`,
      "ORDER BY runs after SELECT, so it can use the alias gross.",
      "ORDER BY выполняется после SELECT, поэтому может использовать псевдоним gross.",
    ),
    bug(
      `
SELECT name, price * 1.2 AS gross
FROM products
WHERE gross > 20;
`,
      "WHERE runs before SELECT, so the alias gross doesn't exist there yet: an error. Repeat the expression: WHERE price * 1.2 > 20.",
      "WHERE выполняется раньше SELECT, поэтому псевдонима gross там ещё нет: ошибка. Повторите выражение: WHERE price * 1.2 > 20.",
    ),
  ],
};
