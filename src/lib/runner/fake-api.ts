/**
 * PandaDev's practice API at https://api.pandadev.test. Lessons call it with
 * the real `fetch`, but requests never leave the browser: the runner answers
 * them from here, with a short, fixed delay so loading states are visible and
 * results are the same every time. Each run gets fresh data.
 */

export const FAKE_API_ORIGIN = "https://api.pandadev.test";

export type FakeRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type FakeResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string | null;
  delayMs: number;
  /** /offline: fail like a dropped connection instead of answering */
  networkError?: boolean;
};

type Movie = {
  id: number;
  title: string;
  year: number;
  director: string;
  genres: string[];
  rating: number;
  minutes: number;
};

type Weather = {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windKph: number;
};

type Recipe = {
  id: number;
  name: string;
  minutes: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
};

type Book = {
  id: number;
  title: string;
  author: string;
  price: number;
  category: "fiction" | "science" | "programming" | "kids";
  rating: number;
  inStock: boolean;
  year: number;
  pages: number;
  blurb: string;
  reviews: [name: string, rating: number, comment: string][];
};

type Todo = { id: number; title: string; done: boolean };

/**
 * A fresh copy of the API for one run: todos and counters start over.
 *
 * Self-contained (it uses nothing from outside its own body), because the
 * Python worker is built from source text and includes `createFakeApi.toString()`.
 */
export function createFakeApi() {
  /** Every request takes this long unless the endpoint says otherwise. */
  const DELAY_MS = 100;

  const STATUS_TEXT: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    418: "I'm a teapot",
    429: "Too Many Requests",
    500: "Internal Server Error",
    503: "Service Unavailable",
  };

  // Made-up films, so the numbers can't be "wrong".
  const MOVIES: Movie[] = [
    {
      id: 1,
      title: "The Bamboo Heist",
      year: 2019,
      director: "Mei Lin",
      genres: ["comedy", "crime"],
      rating: 7.8,
      minutes: 104,
    },
    {
      id: 2,
      title: "Panda Express to Mars",
      year: 2023,
      director: "Sam Ortiz",
      genres: ["sci-fi", "adventure"],
      rating: 6.9,
      minutes: 121,
    },
    {
      id: 3,
      title: "Midnight in the Forest",
      year: 2015,
      director: "Ada Brooks",
      genres: ["drama", "mystery"],
      rating: 8.1,
      minutes: 112,
    },
    {
      id: 4,
      title: "The Last Dumpling",
      year: 2021,
      director: "Mei Lin",
      genres: ["comedy", "family"],
      rating: 7.2,
      minutes: 95,
    },
    {
      id: 5,
      title: "Code Red",
      year: 2018,
      director: "Ravi Patel",
      genres: ["thriller", "action"],
      rating: 6.4,
      minutes: 109,
    },
    {
      id: 6,
      title: "Snow Leopard Summer",
      year: 2020,
      director: "Ada Brooks",
      genres: ["drama", "family"],
      rating: 7.6,
      minutes: 98,
    },
    {
      id: 7,
      title: "Ninja Pandas II",
      year: 2022,
      director: "Kenji Mori",
      genres: ["action", "comedy"],
      rating: 5.9,
      minutes: 102,
    },
    {
      id: 8,
      title: "The Quiet Algorithm",
      year: 2024,
      director: "Ravi Patel",
      genres: ["sci-fi", "drama"],
      rating: 8.4,
      minutes: 131,
    },
    {
      id: 9,
      title: "Tea for Two Thousand",
      year: 2017,
      director: "Sam Ortiz",
      genres: ["comedy", "romance"],
      rating: 6.7,
      minutes: 93,
    },
    {
      id: 10,
      title: "Mountain of Echoes",
      year: 2016,
      director: "Kenji Mori",
      genres: ["adventure", "drama"],
      rating: 7.9,
      minutes: 118,
    },
    {
      id: 11,
      title: "Bug in the Machine",
      year: 2025,
      director: "Ada Brooks",
      genres: ["thriller", "sci-fi"],
      rating: 7.1,
      minutes: 107,
    },
    {
      id: 12,
      title: "The Great Bamboo Race",
      year: 2014,
      director: "Mei Lin",
      genres: ["family", "adventure"],
      rating: 6.5,
      minutes: 88,
    },
  ];

  const WEATHER: Weather[] = [
    {
      city: "London",
      country: "GB",
      temperature: 14,
      feelsLike: 12,
      condition: "Cloudy",
      humidity: 78,
      windKph: 18,
    },
    {
      city: "Paris",
      country: "FR",
      temperature: 17,
      feelsLike: 16,
      condition: "Sunny",
      humidity: 60,
      windKph: 10,
    },
    {
      city: "Tokyo",
      country: "JP",
      temperature: 22,
      feelsLike: 23,
      condition: "Rain",
      humidity: 85,
      windKph: 14,
    },
    {
      city: "New York",
      country: "US",
      temperature: 19,
      feelsLike: 18,
      condition: "Partly cloudy",
      humidity: 55,
      windKph: 21,
    },
    {
      city: "Sydney",
      country: "AU",
      temperature: 25,
      feelsLike: 26,
      condition: "Sunny",
      humidity: 48,
      windKph: 16,
    },
    {
      city: "Moscow",
      country: "RU",
      temperature: 6,
      feelsLike: 2,
      condition: "Snow",
      humidity: 82,
      windKph: 24,
    },
    {
      city: "Cairo",
      country: "EG",
      temperature: 31,
      feelsLike: 33,
      condition: "Sunny",
      humidity: 25,
      windKph: 12,
    },
    {
      city: "Chengdu",
      country: "CN",
      temperature: 20,
      feelsLike: 20,
      condition: "Fog",
      humidity: 90,
      windKph: 6,
    },
    {
      city: "Reykjavik",
      country: "IS",
      temperature: 3,
      feelsLike: -2,
      condition: "Windy",
      humidity: 70,
      windKph: 45,
    },
    {
      city: "Rio de Janeiro",
      country: "BR",
      temperature: 28,
      feelsLike: 30,
      condition: "Thunderstorm",
      humidity: 80,
      windKph: 19,
    },
  ];

  const CONDITIONS = [
    "Sunny",
    "Partly cloudy",
    "Cloudy",
    "Rain",
    "Thunderstorm",
    "Snow",
    "Fog",
    "Windy",
  ];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /** A made-up but steady forecast: the same city always gets the same days. */
  function forecast(weather: Weather, days: number) {
    const seed = [...weather.city].reduce(
      (sum, ch) => sum + ch.charCodeAt(0),
      0,
    );
    return Array.from({ length: days }, (_, i) => {
      const swing = ((seed * (i + 3)) % 9) - 4;
      return {
        day: DAYS[(seed + i) % 7],
        high: weather.temperature + swing + 2,
        low: weather.temperature + swing - 5,
        condition: CONDITIONS[(seed + i * 5) % CONDITIONS.length],
        chanceOfRain: ((seed + i * 17) % 10) * 10,
      };
    });
  }

  const RECIPES: Recipe[] = [
    {
      id: 1,
      name: "Bamboo Shoot Stir-fry",
      minutes: 20,
      servings: 2,
      tags: ["vegan", "quick", "asian"],
      ingredients: ["bamboo shoots", "garlic", "soy sauce", "spring onions"],
      steps: [
        "Slice the bamboo shoots.",
        "Fry the garlic for a minute.",
        "Add the shoots and soy sauce and stir-fry for 5 minutes.",
        "Top with spring onions.",
      ],
    },
    {
      id: 2,
      name: "Pancakes",
      minutes: 25,
      servings: 4,
      tags: ["vegetarian", "breakfast", "sweet"],
      ingredients: ["flour", "eggs", "milk", "butter"],
      steps: [
        "Whisk flour, eggs and milk.",
        "Rest the batter for 10 minutes.",
        "Fry thin pancakes in butter.",
      ],
    },
    {
      id: 3,
      name: "Tomato Soup",
      minutes: 35,
      servings: 4,
      tags: ["vegan", "soup"],
      ingredients: ["tomatoes", "onion", "vegetable stock", "basil"],
      steps: [
        "Soften the onion.",
        "Add tomatoes and stock and simmer for 20 minutes.",
        "Blend with basil.",
      ],
    },
    {
      id: 4,
      name: "Veggie Dumplings",
      minutes: 50,
      servings: 4,
      tags: ["vegetarian", "asian"],
      ingredients: ["dumpling wrappers", "cabbage", "mushrooms", "ginger"],
      steps: [
        "Chop the filling finely.",
        "Fill and fold the wrappers.",
        "Steam for 10 minutes.",
      ],
    },
    {
      id: 5,
      name: "Guacamole",
      minutes: 10,
      servings: 2,
      tags: ["vegan", "quick", "snack"],
      ingredients: ["avocados", "lime", "red onion", "coriander"],
      steps: ["Mash the avocados.", "Mix in lime juice, onion and coriander."],
    },
    {
      id: 6,
      name: "Mushroom Risotto",
      minutes: 45,
      servings: 3,
      tags: ["vegetarian", "italian"],
      ingredients: ["risotto rice", "mushrooms", "vegetable stock", "parmesan"],
      steps: [
        "Fry the mushrooms.",
        "Toast the rice, then add stock a ladle at a time.",
        "Stir in parmesan.",
      ],
    },
    {
      id: 7,
      name: "Banana Smoothie",
      minutes: 5,
      servings: 1,
      tags: ["vegetarian", "quick", "breakfast", "sweet"],
      ingredients: ["banana", "yoghurt", "honey"],
      steps: ["Blend everything until smooth."],
    },
    {
      id: 8,
      name: "Chickpea Curry",
      minutes: 30,
      servings: 4,
      tags: ["vegan", "indian"],
      ingredients: ["chickpeas", "coconut milk", "curry paste", "spinach"],
      steps: [
        "Fry the curry paste.",
        "Add chickpeas and coconut milk and simmer for 15 minutes.",
        "Stir in spinach.",
      ],
    },
  ];

  const USERS = [
    { id: 1, name: "Mei Lin", username: "mei", email: "mei@pandadev.test" },
    { id: 2, name: "Sam Ortiz", username: "sam", email: "sam@pandadev.test" },
    { id: 3, name: "Ada Brooks", username: "ada", email: "ada@pandadev.test" },
  ];

  const POSTS = [
    { id: 1, userId: 1, title: "Why pandas love bamboo", likes: 42 },
    { id: 2, userId: 1, title: "My first JavaScript app", likes: 17 },
    { id: 3, userId: 2, title: "Ten tips for async code", likes: 58 },
    { id: 4, userId: 3, title: "Debugging like a detective", likes: 33 },
    { id: 5, userId: 3, title: "CSS is hard, and that's fine", likes: 21 },
  ];

  // Panda Books: a small second-hand bookshop with HTML pages, for practising
  // web scraping (/shop, /shop?page=2, /shop?category=kids, /shop/3).
  const BOOKS: Book[] = [
    {
      id: 1,
      title: "The Bamboo Code",
      author: "Mei Lin",
      price: 12.5,
      category: "programming",
      rating: 5,
      inStock: true,
      year: 2021,
      pages: 312,
      blurb:
        "A gentle introduction to programming, told through a panda who automates her bamboo farm.",
      reviews: [
        ["Ada", 5, "Finally made loops click for me."],
        ["Kenji", 4, "Great examples, a little long."],
      ],
    },
    {
      id: 2,
      title: "Midnight Library Cats",
      author: "Ada Brooks",
      price: 8.99,
      category: "fiction",
      rating: 4,
      inStock: true,
      year: 2018,
      pages: 244,
      blurb:
        "Three cats run a library at night and solve the mystery of the missing atlas.",
      reviews: [["Sam", 4, "Cosy and clever."]],
    },
    {
      id: 3,
      title: "Stars for Beginners",
      author: "Ravi Patel",
      price: 15.0,
      category: "science",
      rating: 4,
      inStock: false,
      year: 2016,
      pages: 198,
      blurb:
        "Find planets, constellations and the Milky Way with nothing but your eyes and a free evening.",
      reviews: [],
    },
    {
      id: 4,
      title: "Panda Goes to School",
      author: "Kenji Mori",
      price: 6.5,
      category: "kids",
      rating: 5,
      inStock: true,
      year: 2022,
      pages: 32,
      blurb:
        "A picture book about a nervous panda's first day, and the friend who helps.",
      reviews: [
        ["Mei", 5, "My daughter asks for it every night."],
        ["Ravi", 5, "Lovely drawings."],
        ["Ada", 4, "Sweet story."],
      ],
    },
    {
      id: 5,
      title: "Clean Python",
      author: "Sam Ortiz",
      price: 24.99,
      category: "programming",
      rating: 4,
      inStock: true,
      year: 2023,
      pages: 410,
      blurb:
        "Write Python that your future self will thank you for: naming, functions, tests and structure.",
      reviews: [["Kenji", 4, "Practical advice."]],
    },
    {
      id: 6,
      title: "The Last Lighthouse",
      author: "Mei Lin",
      price: 9.5,
      category: "fiction",
      rating: 3,
      inStock: true,
      year: 2015,
      pages: 288,
      blurb:
        "A lighthouse keeper on a remote island receives a letter that was posted fifty years ago.",
      reviews: [["Sam", 3, "Slow start, great ending."]],
    },
    {
      id: 7,
      title: "Why the Sky Is Blue",
      author: "Ada Brooks",
      price: 11.0,
      category: "science",
      rating: 5,
      inStock: true,
      year: 2020,
      pages: 176,
      blurb:
        "Everyday questions answered with simple experiments you can do in the kitchen.",
      reviews: [],
    },
    {
      id: 8,
      title: "Dragons Can't Dance",
      author: "Ravi Patel",
      price: 7.25,
      category: "kids",
      rating: 4,
      inStock: false,
      year: 2019,
      pages: 40,
      blurb:
        "A clumsy dragon practises for the forest ball, with a little help from a patient frog.",
      reviews: [["Mei", 4, "Funny and kind."]],
    },
    {
      id: 9,
      title: "Algorithms in Pictures",
      author: "Kenji Mori",
      price: 29.0,
      category: "programming",
      rating: 5,
      inStock: true,
      year: 2024,
      pages: 356,
      blurb:
        "Sorting, searching and graphs explained with hand-drawn diagrams instead of formulas.",
      reviews: [
        ["Ada", 5, "The best explanation of binary search I've read."],
        ["Sam", 5, "Beautiful."],
      ],
    },
    {
      id: 10,
      title: "A Winter in Kyoto",
      author: "Sam Ortiz",
      price: 13.75,
      category: "fiction",
      rating: 4,
      inStock: true,
      year: 2017,
      pages: 302,
      blurb:
        "A chef loses her sense of taste and spends a winter learning to cook all over again.",
      reviews: [],
    },
    {
      id: 11,
      title: "The Secret Life of Bees",
      author: "Mei Lin",
      price: 10.5,
      category: "science",
      rating: 3,
      inStock: true,
      year: 2014,
      pages: 220,
      blurb:
        "How a hive makes decisions, finds flowers and keeps warm through the winter.",
      reviews: [["Kenji", 3, "Interesting but dry in places."]],
    },
    {
      id: 12,
      title: "Counting with Coco",
      author: "Ada Brooks",
      price: 5.99,
      category: "kids",
      rating: 4,
      inStock: true,
      year: 2023,
      pages: 24,
      blurb:
        "Count from one to ten with Coco the coconut crab on a busy beach day.",
      reviews: [],
    },
    {
      id: 13,
      title: "Debugging Like a Detective",
      author: "Ravi Patel",
      price: 19.5,
      category: "programming",
      rating: 3,
      inStock: false,
      year: 2020,
      pages: 268,
      blurb:
        "Read error messages, form hypotheses and track down bugs with a calm, repeatable method.",
      reviews: [["Mei", 3, "Good method, too few examples."]],
    },
    {
      id: 14,
      title: "The Clockmaker's Daughter",
      author: "Kenji Mori",
      price: 12.0,
      category: "fiction",
      rating: 5,
      inStock: true,
      year: 2021,
      pages: 336,
      blurb:
        "In a city where time is sold by the hour, a girl builds a clock that runs backwards.",
      reviews: [
        ["Ada", 5, "Couldn't put it down."],
        ["Ravi", 4, "Wonderful world-building."],
      ],
    },
    {
      id: 15,
      title: "Volcanoes Up Close",
      author: "Sam Ortiz",
      price: 16.5,
      category: "science",
      rating: 4,
      inStock: true,
      year: 2022,
      pages: 190,
      blurb:
        "Photographs and stories from scientists who study volcanoes from just a few metres away.",
      reviews: [],
    },
    {
      id: 16,
      title: "Night-Night, Little Owl",
      author: "Mei Lin",
      price: 6.99,
      category: "kids",
      rating: 5,
      inStock: true,
      year: 2016,
      pages: 28,
      blurb:
        "A bedtime story about an owl who is wide awake when everyone else is going to sleep.",
      reviews: [["Sam", 5, "Perfect bedtime book."]],
    },
    {
      id: 17,
      title: "Data Science from Zero",
      author: "Ada Brooks",
      price: 27.5,
      category: "programming",
      rating: 4,
      inStock: true,
      year: 2025,
      pages: 384,
      blurb:
        "From spreadsheets to pandas and charts: answer real questions with real data.",
      reviews: [],
    },
    {
      id: 18,
      title: "The Map of Lost Things",
      author: "Ravi Patel",
      price: 8.5,
      category: "fiction",
      rating: 2,
      inStock: true,
      year: 2013,
      pages: 260,
      blurb:
        "A cartographer maps everything people have lost, until she finds her own name on the map.",
      reviews: [["Kenji", 2, "Great idea, confusing plot."]],
    },
  ];
  const BOOKS_PER_PAGE = 6;

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
  const capitalise = (word: string) => word[0].toUpperCase() + word.slice(1);

  function text(
    status: number,
    body: string,
    contentType = "text/plain; charset=utf-8",
  ): FakeResponse {
    return {
      status,
      statusText: STATUS_TEXT[status] ?? "",
      headers: { "content-type": contentType },
      body,
      delayMs: DELAY_MS,
    };
  }

  function htmlPage(status: number, title: string, main: string) {
    const categories = ["fiction", "science", "programming", "kids"]
      .map((c) => `      <a href="/shop?category=${c}">${capitalise(c)}</a>`)
      .join("\n");
    return text(
      status,
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} · Panda Books</title>
</head>
<body>
  <header>
    <h1><a href="/shop">Panda Books</a></h1>
    <p class="tagline">Second-hand books for curious pandas</p>
    <nav class="categories">
${categories}
    </nav>
  </header>
  <main>
${main}
  </main>
  <footer>
    <p>Panda Books is a pretend shop for practising web scraping. Prices in US dollars.</p>
  </footer>
</body>
</html>
`,
      "text/html; charset=utf-8",
    );
  }

  const stockLabel = (book: Book) =>
    `<p class="stock ${book.inStock ? "in-stock" : "sold-out"}">${book.inStock ? "In stock" : "Sold out"}</p>`;

  function shopList(params: URLSearchParams) {
    const category = (params.get("category") ?? "").trim().toLowerCase();
    const found = category
      ? BOOKS.filter((b) => b.category === category)
      : BOOKS;
    const totalPages = Math.max(1, Math.ceil(found.length / BOOKS_PER_PAGE));
    const pageNumber = Number(params.get("page") ?? "1");
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > totalPages
    ) {
      return htmlPage(
        404,
        "Page not found",
        `    <h2>Page not found</h2>
    <p>There is no such page. <a href="/shop">Back to all books</a></p>`,
      );
    }
    const start = (pageNumber - 1) * BOOKS_PER_PAGE;
    const shown = found.slice(start, start + BOOKS_PER_PAGE);
    const pageLink = (n: number) =>
      `/shop?${category ? `category=${category}&amp;` : ""}page=${n}`;
    const items = shown
      .map(
        (b) => `      <li class="book" data-id="${b.id}">
        <h3 class="title"><a href="/shop/${b.id}">${escapeHtml(b.title)}</a></h3>
        <p class="author">by ${escapeHtml(b.author)}</p>
        <p class="price">$${b.price.toFixed(2)}</p>
        <p class="rating" data-stars="${b.rating}">${stars(b.rating)}</p>
        ${stockLabel(b)}
      </li>`,
      )
      .join("\n");
    const links = [
      pageNumber > 1
        ? `      <a rel="prev" href="${pageLink(pageNumber - 1)}">← Previous</a>`
        : "",
      `      <span class="current">Page ${pageNumber} of ${totalPages}</span>`,
      pageNumber < totalPages
        ? `      <a rel="next" href="${pageLink(pageNumber + 1)}">Next →</a>`
        : "",
    ].filter(Boolean);
    const heading = category ? `${capitalise(category)} books` : "All books";
    const summary = found.length
      ? `Showing ${start + 1}–${start + shown.length} of ${found.length} books`
      : "No books found";
    return htmlPage(
      200,
      pageNumber > 1 ? `${heading}, page ${pageNumber}` : heading,
      `    <h2>${escapeHtml(heading)}</h2>
    <p class="results">${summary}</p>
    <ul class="books">
${items}
    </ul>
    <nav class="pagination">
${links.join("\n")}
    </nav>`,
    );
  }

  function shopBook(id: number) {
    const book = BOOKS.find((b) => b.id === id);
    if (!book) {
      return htmlPage(
        404,
        "Book not found",
        `    <h2>Book not found</h2>
    <p><a href="/shop">Back to all books</a></p>`,
      );
    }
    const reviews = book.reviews.length
      ? `        <ul>
${book.reviews
  .map(
    ([name, rating, comment]) => `          <li class="review">
            <span class="reviewer">${escapeHtml(name)}</span>
            <span class="stars" data-stars="${rating}">${stars(rating)}</span>
            <p>${escapeHtml(comment)}</p>
          </li>`,
  )
  .join("\n")}
        </ul>`
      : `        <p class="empty">No reviews yet.</p>`;
    return htmlPage(
      200,
      book.title,
      `    <article class="book-detail" data-id="${book.id}">
      <h2>${escapeHtml(book.title)}</h2>
      <p class="author">by ${escapeHtml(book.author)}</p>
      <p class="price">$${book.price.toFixed(2)}</p>
      <p class="rating" data-stars="${book.rating}">${stars(book.rating)}</p>
      ${stockLabel(book)}
      <table class="details">
        <tr><th>Category</th><td>${capitalise(book.category)}</td></tr>
        <tr><th>Published</th><td>${book.year}</td></tr>
        <tr><th>Pages</th><td>${book.pages}</td></tr>
      </table>
      <p class="blurb">${escapeHtml(book.blurb)}</p>
      <section class="reviews">
        <h3>Reviews (${book.reviews.length})</h3>
${reviews}
      </section>
      <p><a href="/shop">← Back to all books</a></p>
    </article>`,
    );
  }

  const ROBOTS = `# Rules for robots (scrapers and crawlers) on this site
User-agent: *
Allow: /shop
Disallow: /todos
Crawl-delay: 1
`;

  function json(
    status: number,
    data: unknown,
    delayMs = DELAY_MS,
  ): FakeResponse {
    return {
      status,
      statusText: STATUS_TEXT[status] ?? "",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: status === 204 ? null : JSON.stringify(data),
      delayMs,
    };
  }

  const notFound = (what = "Not found") => json(404, { error: what });

  function parseBody(request: FakeRequest): Record<string, unknown> | null {
    if (!request.body) return null;
    try {
      const value = JSON.parse(request.body);
      return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
    } catch {
      return null;
    }
  }

  function paginate<T>(items: T[], params: URLSearchParams) {
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.get("limit")) || 5));
    const start = (page - 1) * limit;
    return {
      page,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
      total: items.length,
      results: items.slice(start, start + limit),
    };
  }

  let todos: Todo[] = [
    { id: 1, title: "Learn fetch", done: true },
    { id: 2, title: "Build the movie app", done: false },
    { id: 3, title: "Eat some bamboo", done: false },
  ];
  let nextTodoId = 4;
  let flakyCalls = 0;

  function todoRoutes(method: string, id: number | null, request: FakeRequest) {
    if (id === null) {
      if (method === "GET") return json(200, todos);
      if (method === "POST") {
        const body = parseBody(request);
        const title = typeof body?.title === "string" ? body.title.trim() : "";
        if (!title) return json(400, { error: "title is required" });
        const todo = { id: nextTodoId++, title, done: body?.done === true };
        todos.push(todo);
        return json(201, todo);
      }
      return json(405, { error: `Method ${method} not allowed` });
    }
    const todo = todos.find((t) => t.id === id);
    if (!todo) return notFound("Todo not found");
    if (method === "GET") return json(200, todo);
    if (method === "PATCH" || method === "PUT") {
      const body = parseBody(request);
      if (!body) return json(400, { error: "send a JSON body" });
      if ("title" in body) {
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) return json(400, { error: "title is required" });
        todo.title = title;
      }
      if ("done" in body) todo.done = body.done === true;
      return json(200, todo);
    }
    if (method === "DELETE") {
      todos = todos.filter((t) => t.id !== id);
      return json(204, null);
    }
    return json(405, { error: `Method ${method} not allowed` });
  }

  function handle(request: FakeRequest): FakeResponse {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const params = url.searchParams;
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[1] !== undefined ? Number(parts[1]) : null;
    if (parts.length > 2 || (id !== null && !Number.isInteger(id))) {
      return notFound();
    }
    if (method !== "GET" && parts[0] !== "todos") {
      return json(405, { error: `Method ${method} not allowed` });
    }

    switch (parts[0]) {
      case undefined:
        return json(200, {
          message: "Welcome to the PandaDev practice API 🐼",
          endpoints: [
            "/movies",
            "/weather",
            "/recipes",
            "/users",
            "/posts",
            "/todos",
            "/shop",
          ],
        });
      case "movies": {
        if (id !== null) {
          const movie = MOVIES.find((m) => m.id === id);
          return movie ? json(200, movie) : notFound("Movie not found");
        }
        const search = (params.get("search") ?? "").trim().toLowerCase();
        const genre = (params.get("genre") ?? "").trim().toLowerCase();
        const found = MOVIES.filter(
          (m) =>
            m.title.toLowerCase().includes(search) &&
            (!genre || m.genres.includes(genre)),
        );
        return json(200, paginate(found, params));
      }
      case "weather": {
        const city = (params.get("city") ?? "").trim().toLowerCase();
        if (!city) return json(400, { error: "city is required" });
        const weather = WEATHER.find((w) => w.city.toLowerCase() === city);
        if (!weather) return notFound("City not found");
        const days = Math.min(7, Math.max(0, Number(params.get("days")) || 0));
        return json(
          200,
          days ? { ...weather, forecast: forecast(weather, days) } : weather,
        );
      }
      case "recipes": {
        if (id !== null) {
          const recipe = RECIPES.find((r) => r.id === id);
          return recipe ? json(200, recipe) : notFound("Recipe not found");
        }
        const search = (params.get("search") ?? "").trim().toLowerCase();
        const tag = (params.get("tag") ?? "").trim().toLowerCase();
        return json(
          200,
          RECIPES.filter(
            (r) =>
              (r.name.toLowerCase().includes(search) ||
                r.ingredients.some((i) => i.includes(search))) &&
              (!tag || r.tags.includes(tag)),
          ),
        );
      }
      case "users": {
        if (id !== null) {
          const user = USERS.find((u) => u.id === id);
          return user ? json(200, user) : notFound("User not found");
        }
        return json(200, USERS);
      }
      case "posts": {
        if (id !== null) {
          const post = POSTS.find((p) => p.id === id);
          return post ? json(200, post) : notFound("Post not found");
        }
        const userId = Number(params.get("userId"));
        return json(
          200,
          userId ? POSTS.filter((p) => p.userId === userId) : POSTS,
        );
      }
      case "todos":
        return todoRoutes(method, id, request);
      case "shop":
        return id === null ? shopList(params) : shopBook(id);
      case "robots.txt":
        return id === null ? text(200, ROBOTS) : notFound();
      case "status": {
        // /status/404 answers with that status, for practising error handling.
        const code = Number(parts[1]);
        if (!Number.isInteger(code) || code < 200 || code > 599) {
          return json(400, { error: "use a status code from 200 to 599" });
        }
        return json(
          code,
          code < 400
            ? { status: code }
            : { error: STATUS_TEXT[code] ?? "Error" },
        );
      }
      case "delay": {
        // /delay/1500 answers after that many milliseconds (at most 5000).
        const ms = Math.min(5000, Math.max(0, Number(parts[1]) || 0));
        return json(200, { waited: ms }, ms);
      }
      case "offline":
        // Fails like a lost connection: fetch rejects with a TypeError.
        return { ...json(200, null), networkError: true };
      case "flaky": {
        // Fails twice with 503, then works: for practising retries.
        flakyCalls++;
        return flakyCalls <= 2
          ? json(503, { error: "Service Unavailable", attempt: flakyCalls })
          : json(200, { ok: true, attempt: flakyCalls });
      }
      default:
        return notFound();
    }
  }

  return { handle };
}

export type FakeApi = ReturnType<typeof createFakeApi>;

/** Turns fetch's arguments into a plain request the fake API understands. */
export async function toFakeRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<FakeRequest | null> {
  const request = new Request(input, init);
  if (new URL(request.url).origin !== FAKE_API_ORIGIN) return null;
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const text =
    request.method === "GET" || request.method === "HEAD"
      ? ""
      : await request.text();
  return {
    method: request.method,
    url: request.url,
    headers,
    body: text === "" ? undefined : text,
  };
}

/** A real Response for a fake one (204 and friends have no body). */
export function toResponse(fake: FakeResponse, url: string): Response {
  const response = new Response(fake.body, {
    status: fake.status,
    statusText: fake.statusText,
    headers: fake.headers,
  });
  // A real fetch fills in response.url; the constructor can't.
  Object.defineProperty(response, "url", { value: url });
  return response;
}

/** What a run remembers about each request, so checks can look at them. */
export type RequestLogEntry = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

/**
 * A `fetch` that answers https://api.pandadev.test from the fake API after
 * its delay (scheduled with `wait`, so the runner knows a request is pending)
 * and passes every other URL to the real fetch.
 */
export function createFetch(
  api: FakeApi,
  wait: (ms: number, signal?: AbortSignal | null) => Promise<void>,
  log: RequestLogEntry[] = [],
) {
  const realFetch = globalThis.fetch?.bind(globalThis);
  return async function fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const request = await toFakeRequest(input, init);
    if (!request) {
      if (!realFetch) throw new TypeError("Failed to fetch");
      return realFetch(input, init);
    }
    let body: unknown = request.body;
    try {
      body = request.body === undefined ? undefined : JSON.parse(request.body);
    } catch {
      // keep it as text
    }
    log.push({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body,
    });
    const signal =
      init?.signal ?? (input instanceof Request ? input.signal : null);
    if (signal?.aborted) throw signal.reason;
    const fake = api.handle(request);
    await wait(fake.delayMs, signal);
    if (fake.networkError) throw new TypeError("Failed to fetch");
    return toResponse(fake, request.url);
  };
}
