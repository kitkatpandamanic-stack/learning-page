/**
 * An in-memory WebSocket network, so lessons can build a real-time server
 * with the `ws` package API and connect browser-style `WebSocket` clients to
 * it in the same run, without a network. Each run gets its own network:
 * `new WebSocketServer({ port: 8080 })` listens on "port 8080", and
 * `new WebSocket("ws://localhost:8080")` connects to it. Messages are
 * delivered asynchronously (one task each), like on a real connection.
 *
 * Sockets support both styles: the browser's `onmessage` /
 * `addEventListener` (event objects) and the `ws` package's
 * `socket.on("message", (data) => …)`. Messages arrive as strings (the real
 * `ws` gives a Buffer; `JSON.parse(data)` and `data.toString()` work on both).
 */

type Listener = (...args: unknown[]) => void;
/** Runs a callback in a later task (and lets the runner wait for it). */
export type Schedule = (fn: () => void) => void;

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

class Emitter {
  private listeners = new Map<string, { fn: Listener; once: boolean }[]>();

  on(event: string, fn: Listener) {
    const list = this.listeners.get(event) ?? [];
    list.push({ fn, once: false });
    this.listeners.set(event, list);
    return this;
  }
  addListener(event: string, fn: Listener) {
    return this.on(event, fn);
  }
  once(event: string, fn: Listener) {
    this.on(event, fn);
    this.listeners.get(event)!.at(-1)!.once = true;
    return this;
  }
  off(event: string, fn: Listener) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      list.filter((l) => l.fn !== fn),
    );
    return this;
  }
  removeListener(event: string, fn: Listener) {
    return this.off(event, fn);
  }
  removeAllListeners(event?: string) {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
    return this;
  }
  listenerCount(event: string) {
    return this.listeners.get(event)?.length ?? 0;
  }
  emit(event: string, ...args: unknown[]) {
    const list = this.listeners.get(event) ?? [];
    for (const l of list) {
      if (l.once) this.off(event, l.fn);
      l.fn.apply(this, args);
    }
    return list.length > 0;
  }
}

/** A minimal `http.Server` that WebSocketServer({ server }) can attach to. */
export interface FakeHttpServer {
  listening: boolean;
  listen(port?: number, ...rest: unknown[]): FakeHttpServer;
  close(callback?: (error?: Error) => void): FakeHttpServer;
  address(): { port: number; address: string; family: string } | null;
  on(event: string, fn: Listener): FakeHttpServer;
  once(event: string, fn: Listener): FakeHttpServer;
  emit(event: string, ...args: unknown[]): boolean;
}

type UpgradeRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  socket: { remoteAddress: string };
};

export function createWsNetwork(schedule: Schedule) {
  /** Who answers WebSocket connections on each port. */
  const ports = new Map<number, { servers: WebSocketServer[] }>();

  const later = (fn: () => void) => schedule(fn);

  class WebSocket extends Emitter {
    static readonly CONNECTING = CONNECTING;
    static readonly OPEN = OPEN;
    static readonly CLOSING = CLOSING;
    static readonly CLOSED = CLOSED;
    readonly CONNECTING = CONNECTING;
    readonly OPEN = OPEN;
    readonly CLOSING = CLOSING;
    readonly CLOSED = CLOSED;

    readyState = CONNECTING;
    readonly url: string;
    protocol = "";
    extensions = "";
    bufferedAmount = 0;
    binaryType = "blob";
    onopen: Listener | null = null;
    onmessage: Listener | null = null;
    onclose: Listener | null = null;
    onerror: Listener | null = null;
    /** @internal the socket at the other end */
    peer: WebSocket | null = null;
    private eventListeners = new Map<
      string,
      { fn: Listener; once: boolean }[]
    >();
    private ended = false;

    constructor(url: string | URL, protocols?: string | string[]) {
      super();
      // Server-side sockets are made by connect() below.
      if (url === INTERNAL) {
        this.url = "";
        return;
      }
      let parsed: URL;
      try {
        parsed = new URL(String(url));
      } catch {
        throw syntaxError(
          `Failed to construct 'WebSocket': The URL '${String(url)}' is invalid.`,
        );
      }
      if (parsed.protocol === "http:") parsed.protocol = "ws:";
      if (parsed.protocol === "https:") parsed.protocol = "wss:";
      if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        throw syntaxError(
          `Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '${parsed.protocol}' is not allowed.`,
        );
      }
      this.url = parsed.href;
      const wanted = typeof protocols === "string" ? [protocols] : protocols;
      later(() => connect(this, parsed, wanted ?? []));
    }

    addEventListener(
      type: string,
      fn: Listener,
      options?: boolean | { once?: boolean },
    ) {
      const list = this.eventListeners.get(type) ?? [];
      if (list.some((l) => l.fn === fn)) return;
      const once = typeof options === "object" && Boolean(options.once);
      list.push({ fn, once });
      this.eventListeners.set(type, list);
    }
    removeEventListener(type: string, fn: Listener) {
      const list = this.eventListeners.get(type) ?? [];
      this.eventListeners.set(
        type,
        list.filter((l) => l.fn !== fn),
      );
    }
    dispatchEvent(event: { type: string }) {
      const handler = this[`on${event.type}` as "onopen"];
      if (typeof handler === "function") handler.call(this, event);
      for (const l of [...(this.eventListeners.get(event.type) ?? [])]) {
        if (l.once) this.removeEventListener(event.type, l.fn);
        l.fn.call(this, event);
      }
      return true;
    }

    send(data: unknown, callback?: (error?: Error) => void) {
      if (this.readyState === CONNECTING) {
        const error = new Error(
          "Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.",
        );
        error.name = "InvalidStateError";
        throw error;
      }
      if (this.readyState !== OPEN || !this.peer) {
        // Browsers silently drop messages sent on a closed socket.
        callback?.(
          new Error("WebSocket is not open: readyState " + this.readyState),
        );
        return;
      }
      const text =
        typeof data === "string"
          ? data
          : data instanceof ArrayBuffer || ArrayBuffer.isView(data)
            ? new TextDecoder().decode(data as ArrayBuffer)
            : String(data);
      const peer = this.peer;
      later(() => {
        if (peer.readyState !== OPEN) return;
        peer.receive("message", text);
      });
      later(() => callback?.());
    }

    close(code = 1000, reason = "") {
      if (this.readyState === CLOSING || this.readyState === CLOSED) return;
      if (this.readyState === CONNECTING) {
        this.readyState = CLOSED;
        later(() => this.finish(1006, "", false));
        return;
      }
      this.readyState = CLOSING;
      const peer = this.peer;
      later(() => {
        if (peer && peer.readyState === OPEN) {
          peer.readyState = CLOSING;
          peer.finish(code, String(reason), true);
        }
        this.finish(code, String(reason), true);
      });
    }

    /** ws: closes immediately, without the closing handshake. */
    terminate() {
      if (this.readyState === CLOSED) return;
      this.readyState = CLOSING;
      const peer = this.peer;
      later(() => {
        if (peer && peer.readyState !== CLOSED) peer.finish(1006, "", false);
        this.finish(1006, "", false);
      });
    }

    /** ws: the other end answers pings with a pong automatically. */
    ping(data?: unknown) {
      const peer = this.peer;
      if (this.readyState !== OPEN || !peer) return;
      later(() => {
        if (peer.readyState !== OPEN) return;
        peer.emit("ping", data);
        later(() => {
          if (this.readyState === OPEN) this.emit("pong", data);
        });
      });
    }
    pong(data?: unknown) {
      const peer = this.peer;
      if (this.readyState !== OPEN || !peer) return;
      later(() => {
        if (peer.readyState === OPEN) peer.emit("pong", data);
      });
    }

    /** @internal */
    receive(type: "message", data: string) {
      this.emit(type, data, false);
      this.dispatchEvent({ type, data, target: this } as never);
    }
    /** @internal */
    opened() {
      this.readyState = OPEN;
      this.emit("open");
      this.dispatchEvent({ type: "open", target: this } as never);
    }
    /** @internal */
    finish(code: number, reason: string, wasClean: boolean) {
      if (this.ended) return;
      this.ended = true;
      this.readyState = CLOSED;
      this.peer = null;
      this.emit("close", code, reason);
      this.dispatchEvent({
        type: "close",
        code,
        reason,
        wasClean,
        target: this,
      } as never);
    }
    /** @internal */
    failed(message: string) {
      if (this.ended) return;
      this.ended = true;
      this.readyState = CLOSED;
      const error = new Error(message);
      this.emit("error", error);
      this.dispatchEvent({
        type: "error",
        message,
        error,
        target: this,
      } as never);
      this.emit("close", 1006, "");
      this.dispatchEvent({
        type: "close",
        code: 1006,
        reason: "",
        wasClean: false,
        target: this,
      } as never);
    }
  }

  function connect(client: WebSocket, url: URL, protocols: string[]) {
    if (client.readyState !== CONNECTING) return;
    const port = Number(url.port) || (url.protocol === "wss:" ? 443 : 80);
    const path = url.pathname;
    const server = ports
      .get(port)
      ?.servers.find((s) => !s.path || s.path === path);
    if (!server) {
      client.failed(
        ports.has(port)
          ? `Unexpected server response: 400`
          : `connect ECONNREFUSED 127.0.0.1:${port}`,
      );
      return;
    }
    const socket = new WebSocket(INTERNAL);
    socket.protocol = protocols[0] ?? "";
    client.protocol = protocols[0] ?? "";
    socket.peer = client;
    client.peer = socket;
    socket.readyState = OPEN;
    server.clients.add(socket);
    socket.on("close", () => server.clients.delete(socket));
    const request: UpgradeRequest = {
      url: path + url.search,
      method: "GET",
      headers: {
        host: url.host,
        upgrade: "websocket",
        connection: "Upgrade",
        "sec-websocket-version": "13",
        ...(protocols.length
          ? { "sec-websocket-protocol": protocols.join(", ") }
          : {}),
      },
      socket: { remoteAddress: "127.0.0.1" },
    };
    server.emit("connection", socket, request);
    client.opened();
  }

  type ServerOptions = {
    port?: number;
    server?: FakeHttpServer;
    noServer?: boolean;
    path?: string;
  };

  class WebSocketServer extends Emitter {
    readonly clients = new Set<WebSocket>();
    readonly path: string | undefined;
    readonly options: ServerOptions;
    private port: number | undefined;

    constructor(options: ServerOptions = {}, callback?: () => void) {
      super();
      this.options = options;
      this.path = options.path;
      if (options.port !== undefined) {
        this.listenOn(options.port);
        if (callback) this.once("listening", callback);
        later(() => this.emit("listening"));
      } else if (options.server) {
        attach(options.server, this);
      } else if (!options.noServer) {
        throw new TypeError(
          'One and only one of the "port", "server", or "noServer" options must be specified',
        );
      }
    }

    /** @internal */
    listenOn(port: number) {
      const entry = ports.get(port);
      if (
        entry?.servers.some(
          (s) => !s.path || !this.path || s.path === this.path,
        )
      ) {
        throw Object.assign(
          new Error(`listen EADDRINUSE: address already in use :::${port}`),
          { code: "EADDRINUSE" },
        );
      }
      ports.set(port, { servers: [...(entry?.servers ?? []), this] });
      this.port = port;
    }

    address() {
      return this.port === undefined
        ? null
        : { port: this.port, address: "::", family: "IPv6" };
    }

    close(callback?: (error?: Error) => void) {
      if (this.port !== undefined) {
        const entry = ports.get(this.port);
        const rest = entry?.servers.filter((s) => s !== this) ?? [];
        if (rest.length) ports.set(this.port, { servers: rest });
        else ports.delete(this.port);
        this.port = undefined;
      }
      later(() => {
        this.emit("close");
        callback?.();
      });
    }
  }

  const attached = new WeakMap<FakeHttpServer, WebSocketServer[]>();
  function attach(server: FakeHttpServer, wss: WebSocketServer) {
    const list = attached.get(server) ?? [];
    list.push(wss);
    attached.set(server, list);
    const address = server.address();
    if (server.listening && address) wss.listenOn(address.port);
  }

  /** A minimal `http.createServer()`; app.listen() uses it too. */
  function createServer(handler?: unknown): FakeHttpServer {
    const emitter = new Emitter();
    let port: number | null = null;
    const server: FakeHttpServer = {
      listening: false,
      listen(p = 0, ...rest) {
        port = Number(p) || 3000;
        server.listening = true;
        for (const wss of attached.get(server) ?? []) wss.listenOn(port);
        const callback = rest.find((r) => typeof r === "function") as
          Listener | undefined;
        // Express calls the callback right away; so do we (no real network).
        callback?.();
        later(() => emitter.emit("listening"));
        return server;
      },
      close(callback) {
        server.listening = false;
        for (const wss of attached.get(server) ?? []) wss.close();
        port = null;
        later(() => callback?.());
        return server;
      },
      address: () =>
        port === null ? null : { port, address: "::", family: "IPv6" },
      on(event, fn) {
        emitter.on(event, fn);
        return server;
      },
      once(event, fn) {
        emitter.once(event, fn);
        return server;
      },
      emit: (event, ...args) => emitter.emit(event, ...args),
    };
    void handler;
    return server;
  }

  const ws = Object.assign(WebSocket, {
    WebSocket,
    WebSocketServer,
    Server: WebSocketServer,
  });
  return {
    /** The browser-style global `WebSocket` for this run */
    WebSocket,
    /** `import WebSocket, { WebSocketServer } from "ws"` */
    ws: Object.assign(Object.create(null), {
      WebSocket,
      WebSocketServer,
      Server: WebSocketServer,
      default: ws,
      __esModule: true,
    }),
    /** `import http from "http"` (just enough to attach a WebSocketServer) */
    http: { createServer, default: { createServer }, __esModule: true },
    createServer,
  };
}

const INTERNAL = Symbol("server-side socket") as unknown as string;

function syntaxError(message: string) {
  const error = new Error(message);
  error.name = "SyntaxError";
  return error;
}
