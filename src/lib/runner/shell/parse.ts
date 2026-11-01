/**
 * Reads a terminal script the way bash does, for the parts lessons use:
 * 'single' and "double" quotes, backslashes, $VARIABLES, # comments, pipes
 * (|), lists (; && ||), redirects (> >> < 2> 2>> &> 2>&1) and one command
 * per line. No loops, functions or $(…): those print a friendly error.
 */

/** A piece of a word: text (quoted text isn't globbed) or a $VARIABLE. */
export type Part =
  | { kind: "text"; value: string; quoted: boolean }
  | { kind: "var"; name: string; quoted: boolean };
export type Word = Part[];

export type Redirect = {
  /** 1: stdout, 2: stderr, "both": &> */
  fd: 1 | 2 | "both";
  op: ">" | ">>" | "<" | ">&1";
  target: Word;
};

export type Command = {
  /** NAME=value before the command (or alone, to set a variable) */
  assignments: { name: string; value: Word }[];
  words: Word[];
  redirects: Redirect[];
};

export type Pipeline = Command[];

/** Commands joined by ; && ||, as written on one line. */
export type Statement = {
  /** The line as written, shown after the prompt */
  source: string;
  /** 1-based line where it starts */
  line: number;
  items: { pipeline: Pipeline; next?: ";" | "&&" | "||" }[];
};

export class ShellSyntaxError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(message);
    this.name = "SyntaxError";
  }
}

type Token =
  | { type: "word"; word: Word; start: number; line: number }
  | {
      type: "op";
      op: "|" | ";" | "&&" | "||" | "\n" | "redirect";
      redirect?: Omit<Redirect, "target">;
      start: number;
      line: number;
    };

const UNSUPPORTED: [RegExp, string][] = [
  [/^\$\(/, "$(…) command substitution isn't available here"],
  [/^`/, "`…` command substitution isn't available here"],
];

const VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*/;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  const at = (n = 0) => source[i + n] ?? "";

  while (i < source.length) {
    const c = at();
    if (c === "\n") {
      tokens.push({ type: "op", op: "\n", start: i, line });
      line++;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    // A backslash at the end of a line joins it with the next.
    if (c === "\\" && at(1) === "\n") {
      i += 2;
      line++;
      continue;
    }
    if (c === "#") {
      while (i < source.length && at() !== "\n") i++;
      continue;
    }
    const start = i;
    if (c === "|" && at(1) === "|") {
      tokens.push({ type: "op", op: "||", start, line });
      i += 2;
      continue;
    }
    if (c === "&" && at(1) === "&") {
      tokens.push({ type: "op", op: "&&", start, line });
      i += 2;
      continue;
    }
    if (c === "|" || c === ";") {
      tokens.push({ type: "op", op: c, start, line });
      i++;
      continue;
    }
    if (c === "&" && at(1) === ">") {
      const append = at(2) === ">";
      tokens.push({
        type: "op",
        op: "redirect",
        redirect: { fd: "both", op: append ? ">>" : ">" },
        start,
        line,
      });
      i += append ? 3 : 2;
      continue;
    }
    if (c === "&")
      throw new ShellSyntaxError(
        "background jobs (&) aren't available here",
        line,
      );
    if (c === "2" && at(1) === ">" && at(2) === "&" && at(3) === "1") {
      tokens.push({
        type: "op",
        op: "redirect",
        redirect: { fd: 2, op: ">&1" },
        start,
        line,
      });
      i += 4;
      continue;
    }
    if ((c === "2" || c === "1") && at(1) === ">") {
      const append = at(2) === ">";
      tokens.push({
        type: "op",
        op: "redirect",
        redirect: { fd: c === "2" ? 2 : 1, op: append ? ">>" : ">" },
        start,
        line,
      });
      i += append ? 3 : 2;
      continue;
    }
    if (c === ">" || c === "<") {
      const append = c === ">" && at(1) === ">";
      tokens.push({
        type: "op",
        op: "redirect",
        redirect: { fd: 1, op: c === "<" ? "<" : append ? ">>" : ">" },
        start,
        line,
      });
      i += append ? 2 : 1;
      continue;
    }

    // A word: everything up to unquoted space or an operator.
    const word: Word = [];
    const text = (value: string, quoted: boolean) => {
      const last = word.at(-1);
      if (last?.kind === "text" && last.quoted === quoted) last.value += value;
      else word.push({ kind: "text", value, quoted });
    };
    const variable = (quoted: boolean) => {
      // At "$": $NAME, ${NAME}, $? ; a lone "$" is just a dollar sign.
      if (at(1) === "{") {
        const end = source.indexOf("}", i);
        if (end === -1) throw new ShellSyntaxError("missing } after ${", line);
        word.push({ kind: "var", name: source.slice(i + 2, end), quoted });
        i = end + 1;
        return;
      }
      if (at(1) === "?") {
        word.push({ kind: "var", name: "?", quoted });
        i += 2;
        return;
      }
      for (const [pattern, message] of UNSUPPORTED)
        if (pattern.test(source.slice(i)))
          throw new ShellSyntaxError(message, line);
      const name = VAR_NAME.exec(source.slice(i + 1))?.[0];
      if (!name) {
        text("$", quoted);
        i++;
        return;
      }
      word.push({ kind: "var", name, quoted });
      i += 1 + name.length;
    };

    while (i < source.length) {
      const ch = at();
      if (
        " \t\r\n|;<>".includes(ch) ||
        (ch === "&" && (at(1) === "&" || at(1) === ">"))
      )
        break;
      if (ch === "&")
        throw new ShellSyntaxError(
          "background jobs (&) aren't available here",
          line,
        );
      if (ch === "'") {
        const end = source.indexOf("'", i + 1);
        if (end === -1)
          throw new ShellSyntaxError(
            "unexpected end of file while looking for matching `''",
            line,
          );
        const value = source.slice(i + 1, end);
        line += value.split("\n").length - 1;
        text(value, true);
        i = end + 1;
        continue;
      }
      if (ch === '"') {
        i++;
        let closed = false;
        while (i < source.length) {
          const d = at();
          if (d === '"') {
            closed = true;
            i++;
            break;
          }
          if (d === "\\" && '"\\$`\n'.includes(at(1))) {
            if (at(1) === "\n") line++;
            else text(at(1), true);
            i += 2;
            continue;
          }
          if (d === "$") {
            variable(true);
            continue;
          }
          if (d === "`")
            throw new ShellSyntaxError(
              "`…` command substitution isn't available here",
              line,
            );
          if (d === "\n") line++;
          text(d, true);
          i++;
        }
        if (!closed)
          throw new ShellSyntaxError(
            "unexpected end of file while looking for matching `\"'",
            line,
          );
        // "" is an empty word, not nothing.
        if (!word.length) text("", true);
        continue;
      }
      if (ch === "\\") {
        // \x: a literal x (marked quoted so it isn't globbed).
        if (i + 1 < source.length) text(at(1), true);
        i += 2;
        continue;
      }
      if (ch === "$") {
        variable(false);
        continue;
      }
      if (ch === "`")
        throw new ShellSyntaxError(
          "`…` command substitution isn't available here",
          line,
        );
      if ((ch === "(" || ch === ")") && !word.length)
        throw new ShellSyntaxError(
          `syntax error near unexpected token \`${ch}'`,
          line,
        );
      text(ch, false);
      i++;
    }
    tokens.push({ type: "word", word, start, line });
  }
  return tokens;
}

const RESERVED = new Set([
  "if",
  "then",
  "else",
  "elif",
  "fi",
  "for",
  "while",
  "until",
  "do",
  "done",
  "case",
  "esac",
  "function",
  "select",
]);

const literal = (word: Word) =>
  word.every((p) => p.kind === "text")
    ? word.map((p) => (p as { value: string }).value).join("")
    : null;

/** Splits a script into statements (one per line, or more with ;). */
export function parse(source: string): Statement[] {
  const tokens = tokenize(source);
  const statements: Statement[] = [];
  let i = 0;

  while (i < tokens.length) {
    // Skip blank lines.
    if (tokens[i].type === "op" && (tokens[i] as { op: string }).op === "\n") {
      i++;
      continue;
    }
    const first = tokens[i];
    const items: Statement["items"] = [];
    let end = source.length;
    let pipeline: Pipeline = [];
    let command: Command = { assignments: [], words: [], redirects: [] };

    const closeCommand = (token: Token) => {
      if (
        !command.words.length &&
        !command.assignments.length &&
        !command.redirects.length
      )
        throw new ShellSyntaxError(
          `syntax error near unexpected token \`${(token as { op: string }).op}'`,
          token.line,
        );
      pipeline.push(command);
      command = { assignments: [], words: [], redirects: [] };
    };

    for (; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "word") {
        const text = literal(token.word);
        const assignment = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(
          token.word[0]?.kind === "text" && !token.word[0].quoted
            ? token.word[0].value
            : "",
        );
        if (!command.words.length && text !== null && RESERVED.has(text))
          throw new ShellSyntaxError(
            `${text}: loops and conditions aren't available here`,
            token.line,
          );
        if (!command.words.length && assignment) {
          const [head, ...rest] = token.word;
          const value: Word = [
            {
              ...(head as Extract<Part, { kind: "text" }>),
              value: (head as { value: string }).value.slice(
                assignment[0].length,
              ),
            },
            ...rest,
          ];
          command.assignments.push({ name: assignment[1], value });
          continue;
        }
        command.words.push(token.word);
        continue;
      }
      if (token.op === "redirect") {
        const target = tokens[i + 1];
        if (token.redirect!.op === ">&1") {
          command.redirects.push({ ...token.redirect!, target: [] });
          continue;
        }
        if (!target || target.type !== "word")
          throw new ShellSyntaxError(
            "syntax error near unexpected token `newline'",
            token.line,
          );
        command.redirects.push({ ...token.redirect!, target: target.word });
        i++;
        continue;
      }
      if (token.op === "|") {
        closeCommand(token);
        continue;
      }
      if (token.op === ";" || token.op === "&&" || token.op === "||") {
        closeCommand(token);
        items.push({ pipeline, next: token.op });
        pipeline = [];
        continue;
      }
      // A newline ends the statement unless it follows | && || (bash goes on).
      const previous = tokens[i - 1];
      if (
        previous?.type === "op" &&
        (previous.op === "|" || previous.op === "&&" || previous.op === "||")
      )
        continue;
      end = token.start;
      i++;
      break;
    }
    if (
      command.words.length ||
      command.assignments.length ||
      command.redirects.length
    )
      pipeline.push(command);
    else if (
      pipeline.length ||
      items.at(-1)?.next === "&&" ||
      items.at(-1)?.next === "||"
    )
      throw new ShellSyntaxError(
        "syntax error: unexpected end of line",
        first.line,
      );
    if (pipeline.length) items.push({ pipeline });
    else if (items.length) delete items[items.length - 1].next;
    if (items.length)
      statements.push({
        source: source.slice(first.start, end).trim(),
        line: first.line,
        items,
      });
  }
  return statements;
}
