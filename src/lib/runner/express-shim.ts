/**
 * An Express-compatible mini framework and a Supertest-style `request()`, so
 * lessons can build real Express 5 apps in the browser (which has no server)
 * and call them the way real projects test them. Only the commonly used API
 * is here: routing with :params, middleware, routers, express.json(),
 * error handlers, req/res helpers, and async handlers (Express 5 style).
 */

type Next = (error?: unknown) => void;
type Handler = (req: Req, res: Res, next: Next) => unknown;
type ErrorHandler = (error: unknown, req: Req, res: Res, next: Next) => unknown;
type AnyHandler = Handler | ErrorHandler | App | Router;

type Layer = {
  method: string | null; // null: middleware (app.use)
  path: string;
  prefix: boolean; // middleware and routers match path prefixes
  handler: AnyHandler;
};

export type Req = {
  method: string;
  url: string;
  originalUrl: string;
  path: string;
  baseUrl: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: unknown;
  rawBody?: string;
  app: App;
  res?: Res;
  get(name: string): string | undefined;
  header(name: string): string | undefined;
  is(type: string): boolean;
  [key: string]: unknown;
};

export type Res = {
  statusCode: number;
  headersSent: boolean;
  locals: Record<string, unknown>;
  status(code: number): Res;
  set(name: string | Record<string, string>, value?: string): Res;
  header(name: string, value: string): Res;
  get(name: string): string | undefined;
  type(type: string): Res;
  json(body?: unknown): Res;
  send(body?: unknown): Res;
  sendStatus(code: number): Res;
  end(body?: string): Res;
  redirect(statusOrUrl: number | string, url?: string): Res;
  cookie(name: string, value: unknown, options?: CookieOptions): Res;
  clearCookie(name: string, options?: CookieOptions): Res;
};

export type CookieOptions = {
  maxAge?: number; // milliseconds, like Express
  expires?: Date;
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "strict" | "lax" | "none" | "Strict" | "Lax" | "None";
};

/** "set-cookie" is a list, like in Node */
type ResponseHeaders = Record<string, string> & { "set-cookie"?: string[] };

type RawResponse = {
  status: number;
  headers: ResponseHeaders;
  text: string;
};

const MIME_TYPES: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  txt: "text/plain",
  text: "text/plain",
  css: "text/css",
  csv: "text/csv",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  xml: "application/xml",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/vnd.microsoft.icon",
  pdf: "application/pdf",
  wasm: "application/wasm",
  woff2: "font/woff2",
  form: "application/x-www-form-urlencoded",
  urlencoded: "application/x-www-form-urlencoded",
};

/** SHA-1 (for Express-style ETags, which must be computed synchronously) */
function sha1Base64(text: string) {
  const bytes = new TextEncoder().encode(text);
  const words: number[] = [];
  const length = bytes.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) * 64);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, length * 8);
  view.setUint32(padded.length - 8, Math.floor((length * 8) / 2 ** 32));
  let [h0, h1, h2, h3, h4] = [
    0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0,
  ];
  const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 80; i++)
      words[i] = rotl(
        words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16],
        1,
      );
    let [a, b, c, d, e] = [h0, h1, h2, h3, h4];
    for (let i = 0; i < 80; i++) {
      const [f, k] =
        i < 20
          ? [(b & c) | (~b & d), 0x5a827999]
          : i < 40
            ? [b ^ c ^ d, 0x6ed9eba1]
            : i < 60
              ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc]
              : [b ^ c ^ d, 0xca62c1d6];
      const temp = (rotl(a, 5) + f + e + k + words[i]) | 0;
      [e, d, c, b, a] = [d, c, rotl(b, 30), a, temp];
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }
  const digest = new Uint8Array(20);
  const out = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => out.setUint32(i * 4, h));
  return btoa(String.fromCharCode(...digest));
}

/** Express's default (weak) ETag: W/"<length in hex>-<sha1 base64, 27 chars>" */
export function weakEtag(body: string) {
  const length = new TextEncoder().encode(body).length;
  return `W/"${length.toString(16)}-${sha1Base64(body).slice(0, 27)}"`;
}

/** Like the `fresh` package: does the client's cached copy still match? */
function isFresh(
  requestHeaders: Record<string, string>,
  etag: string | undefined,
) {
  const noneMatch = requestHeaders["if-none-match"];
  if (!noneMatch) return false;
  if (
    /(?:^|,)\s*?no-cache\s*?(?:,|$)/.test(requestHeaders["cache-control"] ?? "")
  )
    return false;
  if (noneMatch.trim() === "*") return true;
  if (!etag) return false;
  const strip = (tag: string) => tag.trim().replace(/^W\//, "");
  return noneMatch.split(",").some((tag) => strip(tag) === strip(etag));
}

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

/** Turns "/notes/:id" into a matcher returning params, or null. */
function matchPath(pattern: string, path: string, prefix: boolean) {
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const patternParts = clean(pattern).split("/").filter(Boolean);
  const pathParts = clean(path).split("/").filter(Boolean);
  if (
    prefix
      ? pathParts.length < patternParts.length
      : pathParts.length !== patternParts.length
  ) {
    return null;
  }
  const params: Record<string, string> = {};
  for (const [i, part] of patternParts.entries()) {
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (part !== pathParts[i]) {
      return null;
    }
  }
  const matched = `/${pathParts.slice(0, patternParts.length).join("/")}`;
  return { params, matched: matched === "/" ? "" : matched };
}

function parseQuery(search: string) {
  const query: Record<string, string | string[]> = {};
  new URLSearchParams(search).forEach((value, key) => {
    const existing = query[key];
    query[key] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  });
  return query;
}

const isErrorHandler = (fn: AnyHandler): fn is ErrorHandler =>
  typeof fn === "function" && fn.length === 4 && !("handle" in fn);

/** Runs a list of layers for a request, like Express's router. */
async function runLayers(
  layers: Layer[],
  req: Req,
  res: Res,
  done: (error?: unknown) => void,
) {
  let index = 0;
  const basePath = req.path;
  const baseUrl = req.baseUrl;

  const next = async (error?: unknown): Promise<void> => {
    if (res.headersSent) return;
    // "route" and "router" skip the rest, as in Express.
    if (error === "route" || error === "router") error = undefined;
    const layer = layers[index++];
    if (!layer) {
      req.path = basePath;
      req.baseUrl = baseUrl;
      return done(error);
    }
    if (
      layer.method &&
      layer.method !== req.method &&
      !(layer.method === "GET" && req.method === "HEAD")
    ) {
      return next(error);
    }
    const match = matchPath(layer.path, basePath, layer.prefix);
    if (!match) return next(error);

    const handler = layer.handler;
    const sub = typeof handler === "function" && "handle" in handler;
    if (sub) {
      if (error) return next(error);
      req.baseUrl = baseUrl + match.matched;
      req.path = basePath.slice(match.matched.length) || "/";
      Object.assign(req.params, match.params);
      return (handler as App | Router).handle(req, res, (err?: unknown) => {
        req.baseUrl = baseUrl;
        req.path = basePath;
        void next(err);
      });
    }
    req.params = { ...req.params, ...match.params };
    const errorHandler = isErrorHandler(handler);
    if (Boolean(error) !== errorHandler) return next(error);
    let called = false;
    const step = (err?: unknown) => {
      if (called) return;
      called = true;
      void next(err);
    };
    try {
      const result = errorHandler
        ? (handler as ErrorHandler)(error, req, res, step)
        : (handler as Handler)(req, res, step);
      // Express 5 passes rejected promises from async handlers to next().
      if (result && typeof (result as Promise<unknown>).then === "function") {
        await (result as Promise<unknown>).catch((err: unknown) =>
          step(err ?? new Error("Rejected")),
        );
      }
    } catch (err) {
      step(err);
    }
  };
  await next();
}

type RouteMethods<T> = {
  get(path: string, ...handlers: Handler[]): T;
  post(path: string, ...handlers: Handler[]): T;
  put(path: string, ...handlers: Handler[]): T;
  patch(path: string, ...handlers: Handler[]): T;
  delete(path: string, ...handlers: Handler[]): T;
  options(path: string, ...handlers: Handler[]): T;
  all(path: string, ...handlers: Handler[]): T;
};

export interface Router extends RouteMethods<Router> {
  (req: Req, res: Res, next: Next): void;
  handle(req: Req, res: Res, done: (error?: unknown) => void): Promise<void>;
  use(...args: (string | AnyHandler)[]): Router;
  route(path: string): RouteMethods<unknown>;
  stack: Layer[];
}

function createRouter(): Router {
  const stack: Layer[] = [];
  const router = ((req: Req, res: Res, next: Next) => {
    void router.handle(req, res, next);
  }) as Router;
  router.stack = stack;
  router.handle = (req, res, done) => runLayers(stack, req, res, done);
  router.use = (...args) => {
    const path = typeof args[0] === "string" ? (args.shift() as string) : "/";
    for (const handler of args.flat() as AnyHandler[]) {
      stack.push({ method: null, path, prefix: true, handler });
    }
    return router;
  };
  const add =
    (method: string) =>
    (path: string, ...handlers: Handler[]) => {
      for (const handler of handlers.flat()) {
        stack.push({
          method: method === "ALL" ? null : method,
          path,
          prefix: false,
          handler,
        });
      }
      return router;
    };
  router.get = add("GET");
  router.post = add("POST");
  router.put = add("PUT");
  router.patch = add("PATCH");
  router.delete = add("DELETE");
  router.options = add("OPTIONS");
  router.all = add("ALL");
  router.route = (path: string) => {
    const route: RouteMethods<unknown> = {
      get: (_p, ...h) => (router.get(path, ...h), route),
      post: (_p, ...h) => (router.post(path, ...h), route),
      put: (_p, ...h) => (router.put(path, ...h), route),
      patch: (_p, ...h) => (router.patch(path, ...h), route),
      delete: (_p, ...h) => (router.delete(path, ...h), route),
      options: (_p, ...h) => (router.options(path, ...h), route),
      all: (_p, ...h) => (router.all(path, ...h), route),
    };
    // route(path).get(handler): the path is already known.
    for (const key of Object.keys(route) as (keyof RouteMethods<unknown>)[]) {
      const original = route[key];
      route[key] = ((...h: Handler[]) => original(path, ...h)) as never;
    }
    return route;
  };
  return router;
}

export interface App extends Router {
  locals: Record<string, unknown>;
  settings: Record<string, unknown>;
  listen(
    port?: number,
    callback?: () => void,
  ): { close(callback?: () => void): void };
  set(name: string, value: unknown): App;
  /** Answers a request without a network: used by request(app). */
  inject(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<RawResponse>;
}

/** Like Express's res.cookie(): name=value; Max-Age; Path; Expires; flags */
function serializeCookie(
  name: string,
  value: unknown,
  options: CookieOptions = {},
) {
  const raw =
    typeof value === "object" && value !== null
      ? "j:" + JSON.stringify(value)
      : String(value);
  const parts = [`${name}=${encodeURIComponent(raw)}`];
  let expires = options.expires;
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    expires = new Date(Date.now() + options.maxAge);
  }
  if (options.domain) parts.push(`Domain=${options.domain}`);
  parts.push(`Path=${options.path ?? "/"}`);
  if (expires) parts.push(`Expires=${expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const same =
      options.sameSite === true ? "strict" : options.sameSite.toLowerCase();
    parts.push(`SameSite=${same[0].toUpperCase()}${same.slice(1)}`);
  }
  return parts.join("; ");
}

/** "a=1; b=2" → { a: "1", b: "2" } (values starting "j:" are JSON) */
export function parseCookies(header = "") {
  const cookies: Record<string, unknown> = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const name = part.slice(0, index).trim();
    if (!name || name in cookies) continue;
    let value: unknown = part.slice(index + 1).trim();
    try {
      value = decodeURIComponent(value as string);
    } catch {
      // keep it as it is
    }
    if (typeof value === "string" && value.startsWith("j:")) {
      try {
        value = JSON.parse(value.slice(2));
      } catch {
        // keep the text
      }
    }
    cookies[name] = value;
  }
  return cookies;
}

function createResponse(
  finish: (raw: RawResponse) => void,
  request?: { method: string; headers: Record<string, string> },
): Res {
  const headers: Record<string, string> = {};
  const cookies: string[] = [];
  const res: Res = {
    statusCode: 200,
    headersSent: false,
    locals: {},
    status(code) {
      res.statusCode = code;
      return res;
    },
    set(name, value) {
      if (typeof name === "object") {
        for (const [k, v] of Object.entries(name))
          headers[k.toLowerCase()] = String(v);
      } else {
        headers[name.toLowerCase()] = String(value);
      }
      return res;
    },
    header(name, value) {
      return res.set(name, value);
    },
    get(name) {
      return headers[name.toLowerCase()];
    },
    type(type) {
      const name = type.replace(/^\./, "");
      const full = type.includes("/")
        ? type
        : (MIME_TYPES[name] ?? "application/octet-stream");
      // Like Express, text types get a charset.
      const text = /^text\/|json|javascript|xml/.test(full);
      return res.set(
        "content-type",
        text && !full.includes("charset") ? `${full}; charset=utf-8` : full,
      );
    },
    json(body) {
      if (!headers["content-type"]) res.type("json");
      return send(JSON.stringify(body) ?? "");
    },
    send(body) {
      if (body === undefined || body === null) return send("");
      if (typeof body === "object") return res.json(body);
      if (typeof body === "number") {
        throw new TypeError(
          "res.send(status) was removed in Express 5. Use res.sendStatus(status) instead.",
        );
      }
      if (!headers["content-type"]) res.type("html");
      return send(String(body));
    },
    sendStatus(code) {
      res.statusCode = code;
      if (!headers["content-type"]) res.type("txt");
      return send(STATUS_TEXT[code] ?? String(code));
    },
    redirect(statusOrUrl, url) {
      const status = typeof statusOrUrl === "number" ? statusOrUrl : 302;
      const location =
        typeof statusOrUrl === "string" ? statusOrUrl : (url ?? "/");
      res.statusCode = status;
      res.set("location", location);
      return res.end(`Redirecting to ${location}`);
    },
    cookie(name, value, options) {
      cookies.push(serializeCookie(name, value, options));
      return res;
    },
    clearCookie(name, options = {}) {
      const { maxAge: _maxAge, ...rest } = options;
      void _maxAge;
      return res.cookie(name, "", { ...rest, expires: new Date(0) });
    },
    end(body = "") {
      if (res.headersSent) {
        throw new Error("Cannot set headers after they are sent to the client");
      }
      res.headersSent = true;
      const empty = res.statusCode === 204 || res.statusCode === 304;
      if (empty) {
        delete headers["content-type"];
        delete headers["content-length"];
      }
      const text = empty ? "" : body;
      const all: ResponseHeaders = { ...headers };
      if (cookies.length) all["set-cookie"] = [...cookies];
      finish({ status: res.statusCode, headers: all, text });
      return res;
    },
  };
  // What res.send() adds in Express: Content-Length, an ETag, and a
  // 304 Not Modified answer when the client's cached copy is still fresh.
  function send(body: string) {
    if (!headers["etag"] && body !== "") headers["etag"] = weakEtag(body);
    headers["content-length"] = String(new TextEncoder().encode(body).length);
    const status = res.statusCode;
    if (
      request &&
      (request.method === "GET" || request.method === "HEAD") &&
      ((status >= 200 && status < 300) || status === 304) &&
      isFresh(request.headers, headers["etag"])
    ) {
      res.statusCode = 304;
    }
    return res.end(request?.method === "HEAD" ? "" : body);
  }
  return res;
}

type CreateServer = (app: App) => {
  listen(
    port?: number,
    callback?: () => void,
  ): {
    close(callback?: () => void): void;
  };
};

function createApp(createServer?: CreateServer): App {
  const app = createRouter() as App;
  app.locals = {};
  app.settings = {};
  app.set = (name, value) => {
    app.settings[name] = value;
    return app;
  };
  app.listen = (port, callback) => {
    // There's no network in the browser: pretend the server started.
    // (With a WebSocket network, the server can take WebSocket clients.)
    if (createServer) return createServer(app).listen(port, callback);
    callback?.();
    return { close: (cb?: () => void) => cb?.() };
  };
  app.inject = (request) =>
    new Promise<RawResponse>((resolve) => {
      const url = new URL(request.url, "http://localhost");
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(request.headers))
        headers[k.toLowerCase()] = v;
      const req: Req = {
        method: request.method.toUpperCase(),
        url: url.pathname + url.search,
        originalUrl: url.pathname + url.search,
        path: decodeURI(url.pathname),
        baseUrl: "",
        params: {},
        query: parseQuery(url.search),
        headers,
        body: undefined, // like Express 5: undefined until a body parser runs
        rawBody: request.body,
        app,
        get: (name) => headers[name.toLowerCase()],
        header: (name) => headers[name.toLowerCase()],
        is: (type) =>
          (headers["content-type"] ?? "").includes(
            type === "json" ? "application/json" : type,
          ),
      };
      const res = createResponse(resolve, req);
      req.res = res;
      Object.defineProperties(req, {
        fresh: {
          get: () =>
            (req.method === "GET" || req.method === "HEAD") &&
            ((res.statusCode >= 200 && res.statusCode < 300) ||
              res.statusCode === 304) &&
            isFresh(headers, res.get("etag")),
        },
        stale: { get: () => !req.fresh },
      });
      void app.handle(req, res, (error) => {
        if (res.headersSent) return;
        if (error) {
          const status =
            typeof (error as { status?: unknown }).status === "number"
              ? (error as { status: number }).status
              : typeof (error as { statusCode?: unknown }).statusCode ===
                  "number"
                ? (error as { statusCode: number }).statusCode
                : 500;
          res
            .status(status)
            .type("html")
            .end(STATUS_TEXT[status] ?? "Error");
        } else {
          res.status(404).type("html").end(`Cannot ${req.method} ${req.path}`);
        }
      });
    });
  return app;
}

function json(): Handler {
  return (req, _res, next) => {
    const type = req.headers["content-type"] ?? "";
    if (req.rawBody === undefined || !type.includes("json")) return next();
    if (req.rawBody === "") return next();
    try {
      req.body = JSON.parse(req.rawBody);
      next();
    } catch {
      next(
        Object.assign(new SyntaxError("Unexpected token in JSON"), {
          status: 400,
        }),
      );
    }
  };
}

function urlencoded(): Handler {
  return (req, _res, next) => {
    const type = req.headers["content-type"] ?? "";
    if (req.rawBody !== undefined && type.includes("x-www-form-urlencoded")) {
      req.body = Object.fromEntries(new URLSearchParams(req.rawBody));
    }
    next();
  };
}

/** cookie-parser: fills req.cookies from the Cookie header */
function cookieParser(): Handler {
  return (req, _res, next) => {
    req.cookies ??= parseCookies(req.headers.cookie);
    req.signedCookies ??= {};
    next();
  };
}

export function createCookieParserModule() {
  return Object.assign(cookieParser, {
    default: cookieParser,
    __esModule: true,
  });
}

export function createExpressModule(
  options: { createServer?: CreateServer } = {},
) {
  const express = Object.assign(() => createApp(options.createServer), {
    Router: createRouter,
    json,
    urlencoded,
  });
  return { ...express, default: express, __esModule: true };
}

// ---------------------------------------------------------------- supertest

export type TestResponse = {
  status: number;
  statusCode: number;
  ok: boolean;
  headers: ResponseHeaders;
  header: ResponseHeaders;
  type: string;
  text: string;
  body: unknown;
};

class TestRequest implements PromiseLike<TestResponse> {
  private headers: Record<string, string> = {};
  private body?: string;
  private expectations: ((res: TestResponse) => void)[] = [];
  private path: string;

  constructor(
    private app: App,
    private method: string,
    path: string,
    private jar?: Map<string, string>,
  ) {
    this.path = path;
  }

  set(name: string | Record<string, string>, value?: string) {
    if (typeof name === "object") Object.assign(this.headers, name);
    else this.headers[name] = String(value);
    return this;
  }

  query(params: Record<string, unknown>) {
    const url = new URL(this.path, "http://localhost");
    for (const [k, v] of Object.entries(params))
      url.searchParams.append(k, String(v));
    this.path = url.pathname + url.search;
    return this;
  }

  send(data: unknown) {
    if (typeof data === "string") {
      this.headers["Content-Type"] ??= "application/x-www-form-urlencoded";
      this.body = data;
    } else {
      this.headers["Content-Type"] ??= "application/json";
      this.body = JSON.stringify(data);
    }
    return this;
  }

  /** .expect(200), .expect("Content-Type", /json/) or .expect(200, body) */
  expect(statusOrHeader: number | string, value?: unknown) {
    this.expectations.push((res) => {
      if (typeof statusOrHeader === "number") {
        if (res.status !== statusOrHeader) {
          throw new Error(
            `expected ${statusOrHeader} "${STATUS_TEXT[statusOrHeader] ?? ""}", got ${res.status} "${STATUS_TEXT[res.status] ?? ""}"`,
          );
        }
        if (
          value !== undefined &&
          JSON.stringify(res.body) !== JSON.stringify(value)
        ) {
          throw new Error(
            `expected ${JSON.stringify(value)} response body, got ${JSON.stringify(res.body)}`,
          );
        }
      } else {
        const header = res.headers[statusOrHeader.toLowerCase()];
        const actual = Array.isArray(header) ? header.join(", ") : header;
        const pass =
          value instanceof RegExp ? value.test(actual ?? "") : actual === value;
        if (!pass) {
          throw new Error(
            `expected "${statusOrHeader}" matching ${String(value)}, got "${actual}"`,
          );
        }
      }
    });
    return this;
  }

  private async execute(): Promise<TestResponse> {
    const headers = { ...this.headers };
    if (
      this.jar?.size &&
      !Object.keys(headers).some((h) => /^cookie$/i.test(h))
    ) {
      headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    }
    const raw = await this.app.inject({
      method: this.method,
      url: this.path,
      headers,
      body: this.body,
    });
    // request.agent(app) remembers cookies, like a browser.
    for (const cookie of this.jar ? (raw.headers["set-cookie"] ?? []) : []) {
      const [pair, ...attributes] = cookie.split("; ");
      const [name, value] = [
        pair.slice(0, pair.indexOf("=")),
        pair.slice(pair.indexOf("=") + 1),
      ];
      const expired = attributes.some(
        (a) => /^max-age=0$/i.test(a) || /^expires=thu, 01 jan 1970/i.test(a),
      );
      if (expired || value === "") this.jar!.delete(name);
      else this.jar!.set(name, value);
    }
    const type = (raw.headers["content-type"] ?? "").split(";")[0];
    let body: unknown = {};
    if (type === "application/json" && raw.text) {
      try {
        body = JSON.parse(raw.text);
      } catch {
        body = {};
      }
    }
    const res: TestResponse = {
      status: raw.status,
      statusCode: raw.status,
      ok: raw.status >= 200 && raw.status < 300,
      headers: raw.headers,
      header: raw.headers,
      type,
      text: raw.text,
      body,
    };
    for (const check of this.expectations) check(res);
    return res;
  }

  then<A = TestResponse, B = never>(
    onFulfilled?: ((value: TestResponse) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return this.execute().then(onFulfilled, onRejected);
  }
}

function request(app: App, jar?: Map<string, string>) {
  if (typeof app?.inject !== "function") {
    throw new TypeError("request() needs an Express app, e.g. request(app)");
  }
  const make = (method: string) => (path: string) =>
    new TestRequest(app, method, path, jar);
  return {
    get: make("GET"),
    post: make("POST"),
    put: make("PUT"),
    patch: make("PATCH"),
    delete: make("DELETE"),
    head: make("HEAD"),
    options: make("OPTIONS"),
  };
}

export function createSupertestModule() {
  const supertest = Object.assign((app: App) => request(app), {
    /** Keeps cookies between requests, like a browser session */
    agent: (app: App) => request(app, new Map()),
  });
  return Object.assign(supertest, { default: supertest, __esModule: true });
}
