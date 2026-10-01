import { parse } from "acorn";

const LOOPS = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
]);

type AstNode = { type: string; start: number; end: number; body?: AstNode };

/**
 * Adds a `__pandaLoop()` call at the start of every loop body. The preview
 * page defines it to throw when a loop runs too long, because an infinite
 * loop in the preview would otherwise freeze the whole page. Insertions stay
 * on the same line, so error line numbers don't change. Code that doesn't
 * parse is returned unchanged; the browser reports the syntax error itself.
 */
export function addLoopGuards(code: string): string {
  let ast: AstNode;
  try {
    ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
    }) as unknown as AstNode;
  } catch {
    return code;
  }

  const inserts: [position: number, text: string][] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof (node as AstNode).type !== "string") return;
    const n = node as AstNode;
    if (LOOPS.has(n.type) && n.body) {
      if (n.body.type === "BlockStatement") {
        inserts.push([n.body.start + 1, "__pandaLoop();"]);
      } else {
        inserts.push([n.body.start, "{__pandaLoop();"], [n.body.end, "}"]);
      }
    }
    for (const value of Object.values(n)) {
      if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);

  let out = code;
  for (const [position, text] of inserts.sort((a, b) => b[0] - a[0])) {
    out = out.slice(0, position) + text + out.slice(position);
  }
  return out;
}
