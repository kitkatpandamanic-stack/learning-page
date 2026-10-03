// Type declarations for the libraries the code runner provides (see
// execute.ts, express-shim.ts, vitest-shim.ts and ws-shim.ts), so
// TypeScript lessons can import them. They follow the shape of the real
// packages' types (@types/express, @types/supertest, @types/ws, vitest),
// trimmed to what the runner supports: code that type-checks here also
// type-checks in a real project.

const HTTP = `
declare module "http" {
  export interface IncomingHttpHeaders {
    [name: string]: string | string[] | undefined;
  }
  export interface IncomingMessage {
    url?: string;
    method?: string;
    headers: IncomingHttpHeaders;
  }
  export interface Server {
    listen(port?: number, callback?: () => void): this;
    close(callback?: (error?: Error) => void): this;
  }
  export function createServer(
    handler?: (req: any, res: any, next?: any) => unknown,
  ): Server;
  const http: { createServer: typeof createServer };
  export default http;
}
declare module "node:http" {
  export * from "http";
  export { default } from "http";
}
`;

const WS = `
declare module "ws" {
  import type { IncomingMessage, Server } from "http";

  /** A Buffer in Node; String(data) or data.toString() gives the text. */
  export interface RawData {
    toString(): string;
  }

  class WebSocket {
    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
    constructor(address: string);
    readonly readyState: 0 | 1 | 2 | 3;
    readonly url: string;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
    ping(): void;
    on(event: "open", listener: () => void): this;
    on(event: "message", listener: (data: RawData, isBinary: boolean) => void): this;
    on(event: "close", listener: (code: number, reason: RawData) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "pong", listener: () => void): this;
    once(event: "open", listener: () => void): this;
    once(event: "message", listener: (data: RawData, isBinary: boolean) => void): this;
    once(event: "close", listener: (code: number, reason: RawData) => void): this;
    once(event: "error", listener: (error: Error) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    onopen: ((event: { type: string }) => void) | null;
    onmessage: ((event: { data: string; type: string }) => void) | null;
    onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null;
    onerror: ((event: { type: string; message?: string }) => void) | null;
    addEventListener(type: "open", listener: (event: { type: string }) => void, options?: { once?: boolean }): void;
    addEventListener(type: "message", listener: (event: { data: string; type: string }) => void, options?: { once?: boolean }): void;
    addEventListener(type: "close", listener: (event: { code: number; reason: string; wasClean: boolean }) => void, options?: { once?: boolean }): void;
    addEventListener(type: "error", listener: (event: { type: string; message?: string }) => void, options?: { once?: boolean }): void;
    removeEventListener(type: string, listener: (...args: any[]) => void): void;
  }

  export interface ServerOptions {
    port?: number;
    server?: Server;
    path?: string;
  }

  export class WebSocketServer {
    constructor(options: ServerOptions, callback?: () => void);
    readonly clients: Set<WebSocket>;
    on(event: "connection", listener: (socket: WebSocket, request: IncomingMessage) => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "listening", listener: () => void): this;
    close(callback?: (error?: Error) => void): void;
  }

  export { WebSocket };
  export default WebSocket;
}
`;

const EXPRESS = `
declare namespace Express {
  // Add your own fields with declaration merging, like in a real project:
  // declare global { namespace Express { interface Request { user?: User } } }
  interface Request {}
  interface Response {}
  interface Locals {}
}

declare module "express" {
  import type { Server } from "http";

  export interface ParamsDictionary {
    [key: string]: string;
  }
  export interface ParsedQs {
    [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
  }

  type RemoveTail<S extends string, Tail extends string> =
    S extends \`\${infer P}\${Tail}\` ? P : S;
  type GetRouteParameter<S extends string> = RemoveTail<
    RemoveTail<RemoveTail<S, \`/\${string}\`>, \`-\${string}\`>,
    \`.\${string}\`
  >;
  /** "/users/:id/posts/:postId" → { id: string; postId: string } */
  export type RouteParameters<Route extends string> = string extends Route
    ? ParamsDictionary
    : Route extends \`\${string}:\${infer Rest}\`
      ? (GetRouteParameter<Rest> extends \`\${infer Name}?\`
          ? { [P in Name]?: string }
          : { [P in GetRouteParameter<Rest>]: string }) &
          (Rest extends \`\${GetRouteParameter<Rest>}\${infer Next}\`
            ? RouteParameters<Next>
            : unknown)
      : {};

  export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
  }

  export interface Request<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > extends Express.Request {
    method: string;
    url: string;
    originalUrl: string;
    path: string;
    baseUrl: string;
    params: P;
    query: ReqQuery;
    body: ReqBody;
    headers: Record<string, string | undefined>;
    /** Filled in by cookie-parser */
    cookies: Record<string, string>;
    signedCookies: Record<string, string>;
    app: Application;
    res?: Response<ResBody, LocalsObj>;
    get(name: string): string | undefined;
    header(name: string): string | undefined;
    is(type: string): string | false | null;
  }

  export interface Response<
    ResBody = any,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > extends Express.Response {
    statusCode: number;
    headersSent: boolean;
    locals: LocalsObj & Express.Locals;
    status(code: number): this;
    set(field: string, value?: string): this;
    set(fields: Record<string, string>): this;
    header(field: string, value: string): this;
    get(field: string): string | undefined;
    type(type: string): this;
    json(body?: ResBody): this;
    send(body?: ResBody): this;
    sendStatus(code: number): this;
    end(body?: string): this;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
    cookie(name: string, value: string, options?: CookieOptions): this;
    clearCookie(name: string, options?: CookieOptions): this;
  }

  export type NextFunction = (error?: any) => void;

  export interface RequestHandler<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > {
    (
      req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>,
      res: Response<ResBody, LocalsObj>,
      next: NextFunction,
    ): void | Promise<void>;
  }

  export interface ErrorRequestHandler<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > {
    (
      error: any,
      req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>,
      res: Response<ResBody, LocalsObj>,
      next: NextFunction,
    ): void | Promise<void>;
  }

  type AnyHandler =
    | RequestHandler<any, any, any, any, any>
    | ErrorRequestHandler<any, any, any, any, any>
    | Router;

  export interface RouterMatcher<T> {
    <
      Route extends string,
      P = RouteParameters<Route>,
      ResBody = any,
      ReqBody = any,
      ReqQuery = ParsedQs,
      LocalsObj extends Record<string, any> = Record<string, any>,
    >(
      path: Route,
      ...handlers: RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>[]
    ): T;
  }

  export interface IRoute {
    get(...handlers: RequestHandler[]): this;
    post(...handlers: RequestHandler[]): this;
    put(...handlers: RequestHandler[]): this;
    patch(...handlers: RequestHandler[]): this;
    delete(...handlers: RequestHandler[]): this;
    options(...handlers: RequestHandler[]): this;
    all(...handlers: RequestHandler[]): this;
  }

  export interface Router {
    (req: Request, res: Response, next: NextFunction): void;
    get: RouterMatcher<this>;
    post: RouterMatcher<this>;
    put: RouterMatcher<this>;
    patch: RouterMatcher<this>;
    delete: RouterMatcher<this>;
    options: RouterMatcher<this>;
    all: RouterMatcher<this>;
    route(path: string): IRoute;
    use(...handlers: RequestHandler[]): this;
    use(path: string, ...handlers: RequestHandler[]): this;
    use(...handlers: AnyHandler[]): this;
    use(path: string, ...handlers: AnyHandler[]): this;
  }

  export interface Application extends Router {
    locals: Record<string, any>;
    listen(port?: number, callback?: () => void): Server;
    set(setting: string, value: unknown): this;
  }
  export type Express = Application;

  interface ExpressStatic {
    (): Express;
    Router(): Router;
    json(options?: { limit?: string | number }): RequestHandler;
    urlencoded(options?: { extended?: boolean }): RequestHandler;
  }

  const express: ExpressStatic;
  export const Router: ExpressStatic["Router"];
  export const json: ExpressStatic["json"];
  export const urlencoded: ExpressStatic["urlencoded"];
  export default express;
}

declare module "cookie-parser" {
  import type { RequestHandler } from "express";
  function cookieParser(secret?: string): RequestHandler;
  export default cookieParser;
}

declare module "supertest" {
  import type { Application } from "express";

  export interface Response {
    status: number;
    statusCode: number;
    ok: boolean;
    headers: any;
    header: any;
    type: string;
    text: string;
    body: any;
  }

  export interface Test extends PromiseLike<Response> {
    set(field: string, value: string): this;
    set(fields: Record<string, string>): this;
    query(params: Record<string, unknown>): this;
    send(data: string | object): this;
    expect(status: number, body?: unknown): this;
    expect(field: string, value: string | RegExp): this;
  }

  export interface Agent {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
    head(url: string): Test;
    options(url: string): Test;
  }

  interface SuperTestStatic {
    (app: Application): Agent;
    /** Keeps cookies between requests, like a browser session */
    agent(app: Application): Agent;
  }

  const request: SuperTestStatic;
  export default request;
}
`;

const VITEST = `
declare module "vitest" {
  type Awaitable<T> = T | PromiseLike<T>;
  type Procedure = (...args: any[]) => any;

  interface TestFunction {
    (name: string, fn?: () => Awaitable<unknown>, timeout?: number): void;
    skip: TestFunction;
    only: TestFunction;
    todo(name: string): void;
    each<T extends readonly any[] | [any]>(
      cases: readonly T[],
    ): (name: string, fn: (...args: T) => Awaitable<unknown>) => void;
    each<T>(
      cases: readonly T[],
    ): (name: string, fn: (item: T) => Awaitable<unknown>) => void;
  }

  interface SuiteFunction {
    (name: string, fn: () => void): void;
    skip: SuiteFunction;
    only: SuiteFunction;
    each<T extends readonly any[] | [any]>(
      cases: readonly T[],
    ): (name: string, fn: (...args: T) => void) => void;
    each<T>(cases: readonly T[]): (name: string, fn: (item: T) => void) => void;
  }

  export const describe: SuiteFunction;
  export const it: TestFunction;
  export const test: TestFunction;
  export function beforeAll(fn: () => Awaitable<unknown>): void;
  export function afterAll(fn: () => Awaitable<unknown>): void;
  export function beforeEach(fn: () => Awaitable<unknown>): void;
  export function afterEach(fn: () => Awaitable<unknown>): void;

  interface Matchers<R> {
    toBe(expected: unknown): R;
    toEqual(expected: unknown): R;
    toStrictEqual(expected: unknown): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
    toBeNull(): R;
    toBeUndefined(): R;
    toBeDefined(): R;
    toBeNaN(): R;
    toBeTypeOf(
      type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function",
    ): R;
    toBeInstanceOf(constructor: abstract new (...args: any[]) => any): R;
    toBeGreaterThan(n: number | bigint): R;
    toBeGreaterThanOrEqual(n: number | bigint): R;
    toBeLessThan(n: number | bigint): R;
    toBeLessThanOrEqual(n: number | bigint): R;
    toBeCloseTo(n: number, digits?: number): R;
    toContain(item: unknown): R;
    toContainEqual(item: unknown): R;
    toHaveLength(length: number): R;
    toHaveProperty(path: string | readonly string[], value?: unknown): R;
    toMatch(pattern: RegExp | string): R;
    toMatchObject(expected: object): R;
    toThrow(expected?: string | RegExp | (abstract new (...args: any[]) => Error) | Error): R;
    toThrowError(expected?: string | RegExp | (abstract new (...args: any[]) => Error) | Error): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledTimes(times: number): R;
    toHaveBeenCalledWith(...args: unknown[]): R;
    toHaveBeenLastCalledWith(...args: unknown[]): R;
    toHaveBeenNthCalledWith(n: number, ...args: unknown[]): R;
    toHaveReturnedWith(value: unknown): R;
    toBeCalled(): R;
    toBeCalledTimes(times: number): R;
    toBeCalledWith(...args: unknown[]): R;
  }

  export interface Assertion<T = any> extends Matchers<void> {
    not: Assertion<T>;
    resolves: PromisifyAssertion;
    rejects: PromisifyAssertion;
  }
  export interface PromisifyAssertion extends Matchers<Promise<void>> {
    not: PromisifyAssertion;
  }

  interface ExpectStatic {
    <T>(actual: T, message?: string): Assertion<T>;
    any(constructor: abstract new (...args: any[]) => any): any;
    anything(): any;
    stringContaining(text: string): any;
    stringMatching(pattern: string | RegExp): any;
    objectContaining<T = any>(partial: T): any;
    arrayContaining<T = unknown>(items: readonly T[]): any;
  }
  export const expect: ExpectStatic;

  export interface MockResult<T> {
    type: "return" | "throw";
    value: T;
  }
  export interface MockContext<T extends Procedure> {
    calls: Parameters<T>[];
    results: MockResult<ReturnType<T>>[];
    lastCall: Parameters<T> | undefined;
  }

  export interface Mock<T extends Procedure = Procedure> {
    (...args: Parameters<T>): ReturnType<T>;
    mock: MockContext<T>;
    getMockName(): string;
    mockName(name: string): this;
    mockImplementation(fn: T): this;
    mockImplementationOnce(fn: T): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockReturnValueOnce(value: ReturnType<T>): this;
    mockResolvedValue(value: Awaited<ReturnType<T>>): this;
    mockResolvedValueOnce(value: Awaited<ReturnType<T>>): this;
    mockRejectedValue(error: unknown): this;
    mockRejectedValueOnce(error: unknown): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
  }

  type Methods<T> = {
    [K in keyof T]: T[K] extends Procedure ? K : never;
  }[keyof T];

  export interface VitestUtils {
    fn<T extends Procedure = Procedure>(implementation?: T): Mock<T>;
    spyOn<T, K extends Methods<Required<T>>>(
      object: T,
      method: K,
    ): Required<T>[K] extends Procedure ? Mock<Required<T>[K]> : never;
    isMockFunction(fn: unknown): fn is Mock;
    clearAllMocks(): this;
    resetAllMocks(): this;
    restoreAllMocks(): this;
    useFakeTimers(): this;
    useRealTimers(): this;
    advanceTimersByTime(ms: number): this;
    advanceTimersByTimeAsync(ms: number): Promise<this>;
    runAllTimers(): this;
    runAllTimersAsync(): Promise<this>;
    getTimerCount(): number;
    setSystemTime(time: number | Date): this;
  }
  export const vi: VitestUtils;
}
`;

/** Plain TypeScript runs in a worker with these libraries. */
export const WORKER_MODULE_TYPES = HTTP + WS + EXPRESS + VITEST;

/** React pages bring React (typed by @types/react) and the ws network. */
export const PAGE_MODULE_TYPES = HTTP + WS;
