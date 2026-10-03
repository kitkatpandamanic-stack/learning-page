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
};

type RawResponse = {
  status: number;
  headers: Record<string, string>;
  text: string;
};

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
  router.all = add("ALL");
  router.route = (path: string) => {
    const route: RouteMethods<unknown> = {
      get: (_p, ...h) => (router.get(path, ...h), route),
      post: (_p, ...h) => (router.post(path, ...h), route),
      put: (_p, ...h) => (router.put(path, ...h), route),
      patch: (_p, ...h) => (router.patch(path, ...h), route),
      delete: (_p, ...h) => (router.delete(path, ...h), route),
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

function createResponse(finish: (raw: RawResponse) => void): Res {
  const headers: Record<string, string> = {};
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
      const full = type.includes("/")
        ? type
        : type === "json"
          ? "application/json"
          : type === "html"
            ? "text/html"
            : `text/${type}`;
      return res.set("content-type", `${full}; charset=utf-8`);
    },
    json(body) {
      if (!headers["content-type"]) res.type("json");
      return res.end(JSON.stringify(body) ?? "");
    },
    send(body) {
      if (body === undefined || body === null) return res.end("");
      if (typeof body === "object") return res.json(body);
      if (typeof body === "number") {
        throw new TypeError(
          "res.send(status) was removed in Express 5. Use res.sendStatus(status) instead.",
        );
      }
      if (!headers["content-type"]) res.type("html");
      return res.end(String(body));
    },
    sendStatus(code) {
      res.statusCode = code;
      if (!headers["content-type"]) res.type("text/plain");
      return res.end(STATUS_TEXT[code] ?? String(code));
    },
    redirect(statusOrUrl, url) {
      const status = typeof statusOrUrl === "number" ? statusOrUrl : 302;
      const location =
        typeof statusOrUrl === "string" ? statusOrUrl : (url ?? "/");
      res.statusCode = status;
      res.set("location", location);
      return res.end(`Redirecting to ${location}`);
    },
    end(body = "") {
      if (res.headersSent) {
        throw new Error("Cannot set headers after they are sent to the client");
      }
      res.headersSent = true;
      const text = res.statusCode === 204 || res.statusCode === 304 ? "" : body;
      finish({ status: res.statusCode, headers: { ...headers }, text });
      return res;
    },
  };
  return res;
}

function createApp(): App {
  const app = createRouter() as App;
  app.locals = {};
  app.settings = {};
  app.set = (name, value) => {
    app.settings[name] = value;
    return app;
  };
  app.listen = (port, callback) => {
    // There's no network in the browser: pretend the server started.
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
      const res = createResponse(resolve);
      req.res = res;
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

export function createExpressModule() {
  const express = Object.assign(createApp, {
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
  headers: Record<string, string>;
  header: Record<string, string>;
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
        const actual = res.headers[statusOrHeader.toLowerCase()];
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
    const raw = await this.app.inject({
      method: this.method,
      url: this.path,
      headers: this.headers,
      body: this.body,
    });
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

function request(app: App) {
  if (typeof app?.inject !== "function") {
    throw new TypeError("request() needs an Express app, e.g. request(app)");
  }
  const make = (method: string) => (path: string) =>
    new TestRequest(app, method, path);
  return {
    get: make("GET"),
    post: make("POST"),
    put: make("PUT"),
    patch: make("PATCH"),
    delete: make("DELETE"),
    head: make("HEAD"),
  };
}

export function createSupertestModule() {
  return Object.assign(request, { default: request, __esModule: true });
}
