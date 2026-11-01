import { describe, expect, it } from "vitest";

import { executeShell } from "./execute-shell";
import { diffLines, hunks } from "./shell/diff";
import { parse } from "./shell/parse";

/** What a script printed, as text (prompts included). */
async function sh(code: string, setup?: string) {
  const result = await executeShell(code, { setup });
  return {
    ...result,
    text: result.output.map((l) => l.text).join("\n"),
    errors: result.output.filter((l) => l.level === "error").map((l) => l.text),
    printed: result.output.filter((l) => l.level === "log").map((l) => l.text),
  };
}

/** A project folder with a first commit, as exercises' setup would make it. */
const PROJECT = `mkdir project && cd project
git init
echo 'print("hello")' > app.py
echo "# Menu app" > README.md
git add .
git commit -m "First commit"`;

describe("the shell", () => {
  it("shows a prompt before each command, with where you are", async () => {
    const r = await sh("pwd\nmkdir notes\ncd notes\npwd");
    expect(r.output.map((l) => [l.level, l.text])).toEqual([
      ["info", "~ $ pwd"],
      ["log", "/home/panda"],
      ["info", "~ $ mkdir notes"],
      ["info", "~ $ cd notes"],
      ["info", "~/notes $ pwd"],
      ["log", "/home/panda/notes"],
    ]);
  });

  it("makes, lists, copies, moves and deletes files", async () => {
    const r = await sh(`mkdir -p shop/src
touch shop/README.md shop/src/app.js
echo "hi" > shop/notes.txt
ls shop
cp shop/notes.txt shop/copy.txt
mv shop/copy.txt shop/src/
ls shop/src
rm shop/notes.txt
ls -a shop
tree shop`);
    expect(r.errors).toEqual([]);
    expect(r.printed).toEqual([
      "notes.txt  README.md  src",
      "app.js  copy.txt",
      ".  ..  README.md  src",
      "shop",
      "├── README.md",
      "└── src",
      "    ├── app.js",
      "    └── copy.txt",
      "",
      "1 directory, 3 files",
    ]);
  });

  it("prints errors like bash and coreutils", async () => {
    const r = await sh(
      "cd nowhere\nls missing\ncat nope.txt\nrm dir\nmkdir dir\nmkdir dir\nrm dir\nfrobnicate\nnano notes.txt",
    );
    expect(r.errors).toEqual([
      "bash: cd: nowhere: No such file or directory",
      "ls: cannot access 'missing': No such file or directory",
      "cat: nope.txt: No such file or directory",
      "rm: cannot remove 'dir': No such file or directory",
      "mkdir: cannot create directory 'dir': File exists",
      "rm: cannot remove 'dir': Is a directory",
      "bash: frobnicate: command not found",
      "bash: nano: command not found",
      'hint: text editors don\'t open here. Write files with echo "text" > file',
    ]);
  });

  it("pipes, redirects and filters text", async () => {
    const r = await sh(`echo "apple" > fruit.txt
echo "banana" >> fruit.txt
echo "apple" >> fruit.txt
echo "cherry" >> fruit.txt
cat fruit.txt | sort | uniq -c
grep -n an fruit.txt
grep -c apple fruit.txt
wc -l fruit.txt
cat fruit.txt | wc -l
head -n 2 fruit.txt
tail -1 fruit.txt
sort -r fruit.txt | head -1
grep x fruit.txt || echo "no x"
cat missing.txt 2> /dev/null && echo yes || echo no
echo hidden > /dev/null`);
    expect(r.errors).toEqual([]);
    expect(r.printed).toEqual([
      "      2 apple",
      "      1 banana",
      "      1 cherry",
      "2:banana",
      "2",
      "4 fruit.txt",
      "4",
      "apple",
      "banana",
      "cherry",
      "cherry",
      "no x",
      "no",
    ]);
  });

  it("expands variables, ~ and globs; quotes stop them", async () => {
    const r = await sh(`NAME=Panda
echo "Hi, $NAME" 'and $NAME' \\$HOME
echo ~ $HOME
touch a.txt b.txt c.md
echo *.txt
echo '*.txt' "*.md"
echo z*
false; echo $?`);
    expect(r.printed).toEqual([
      "Hi, Panda and $NAME $HOME",
      "/home/panda /home/panda",
      "a.txt b.txt",
      "*.txt *.md",
      "z*",
      "1",
    ]);
  });

  it("reports syntax errors with the line, and runs nothing", async () => {
    const r = await sh('echo one\necho "two');
    expect(r.error).toMatchObject({ name: "SyntaxError", line: 2 });
    expect(r.text).not.toContain("one\n");
    expect((await sh("for f in *; do echo $f; done")).errors[0]).toContain(
      "loops and conditions aren't available here",
    );
    expect((await sh("ls |")).error?.name).toBe("SyntaxError");
  });

  it("parses one statement per line, with lists and comments", () => {
    const statements = parse(
      "cd a && ls # look\n\necho x; echo y\nls |\n  wc -l",
    );
    expect(statements.map((s) => [s.line, s.source])).toEqual([
      [1, "cd a && ls # look"],
      [3, "echo x; echo y"],
      [4, "ls |\n  wc -l"],
    ]);
  });

  it("keeps runaway files small", async () => {
    const r = await sh(
      `echo ${"x".repeat(1000)} > big\n${"cat big big big big big big big big big big >> big2 && mv big2 big\n".repeat(4)}`,
    );
    expect(r.errors.some((e) => e.includes("File too large"))).toBe(true);
  });
});

describe("git", () => {
  it("starts a repository, stages and commits, with git's messages", async () => {
    const r = await sh(`mkdir menu && cd menu
git init
echo "pizza" > menu.txt
git status
git add menu.txt
git status
git commit -m "Add the menu"
git status
git log`);
    expect(r.errors).toEqual([]);
    expect(r.text).toContain(
      "Initialized empty Git repository in /home/panda/menu/.git/",
    );
    expect(r.text).toContain(
      'On branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tmenu.txt\n\nnothing added to commit but untracked files present (use "git add" to track)',
    );
    expect(r.text).toContain(
      'Changes to be committed:\n  (use "git rm --cached <file>..." to unstage)\n\tnew file:   menu.txt',
    );
    expect(r.text).toMatch(
      /\[main \(root-commit\) [0-9a-f]{7}\] Add the menu\n 1 file changed, 1 insertion\(\+\)\n create mode 100644 menu\.txt/,
    );
    expect(r.text).toContain("nothing to commit, working tree clean");
    expect(r.text).toMatch(
      /commit [0-9a-f]{40} \(HEAD -> main\)\nAuthor: Panda <panda@pandadev\.dev>\nDate: {3}Mon Jan 5 09:01:00 2026 \+0000\n\n {4}Add the menu/,
    );
  });

  it("makes the same commit hashes every time", async () => {
    const a = await sh("git log --oneline", PROJECT);
    const b = await sh("git log --oneline", PROJECT);
    expect(a.printed).toEqual(b.printed);
    expect(a.printed[0]).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) First commit$/);
  });

  it("shows modified, staged and deleted files, long and short", async () => {
    const r = await sh(
      `echo 'print("bye")' >> app.py
echo "notes" > notes.txt
rm README.md
git status -s
git add app.py
git status`,
      PROJECT,
    );
    // Sorted like git: capitals first.
    expect(r.printed.slice(0, 3)).toEqual([
      " D README.md",
      " M app.py",
      "?? notes.txt",
    ]);
    expect(r.text).toContain(
      'Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   app.py',
    );
    expect(r.text).toContain("Changes not staged for commit:");
    expect(r.text).toContain("\tdeleted:    README.md");
  });

  it("diffs the working tree, the staging area and commits", async () => {
    const r = await sh(
      `echo 'print("bye")' >> app.py
git diff
git add app.py
git diff
git diff --staged
git commit -m "Say bye"
git show`,
      PROJECT,
    );
    expect(r.text).toMatch(
      /diff --git a\/app\.py b\/app\.py\nindex [0-9a-f]{7}\.\.[0-9a-f]{7} 100644\n--- a\/app\.py\n\+\+\+ b\/app\.py\n@@ -1 \+1,2 @@\n print\("hello"\)\n\+print\("bye"\)/,
    );
    expect(r.text).toMatch(
      /\[main [0-9a-f]{7}\] Say bye\n 1 file changed, 1 insertion\(\+\)/,
    );
    expect(r.text).toContain("    Say bye");
  });

  it("restores files and unstages", async () => {
    const r = await sh(
      `echo "oops" > app.py
git restore app.py
cat app.py
echo "change" >> README.md
git add README.md
git restore --staged README.md
git status -s`,
      PROJECT,
    );
    expect(r.printed).toEqual(['print("hello")', " M README.md"]);
  });

  it("explains empty commits and missing messages", async () => {
    const r = await sh("git commit -m nothing\ngit commit", PROJECT);
    expect(r.text).toContain("nothing to commit, working tree clean");
    expect(r.errors[0]).toBe("Aborting commit due to empty commit message.");
  });

  it("ignores files in .gitignore, and says so when you add one", async () => {
    const r = await sh(
      `echo "secret" > .env
echo ".env" > .gitignore
git status -s
git add .env`,
      PROJECT,
    );
    expect(r.printed).toEqual(["?? .gitignore"]);
    expect(r.errors[0]).toBe(
      "The following paths are ignored by one of your .gitignore files:",
    );
  });

  it("works with branches: create, switch, list, delete", async () => {
    const r = await sh(
      `git switch -c feature
echo "pasta" > pasta.txt
git add pasta.txt
git commit -m "Add pasta"
git branch
git switch main
ls
git branch -d feature
git branch -D feature
git branch`,
      PROJECT,
    );
    expect(r.text).toContain("Switched to a new branch 'feature'");
    expect(r.text).toContain("* feature\n  main");
    expect(r.printed).toContain("app.py  README.md");
    expect(r.errors).toEqual([
      "error: the branch 'feature' is not fully merged",
      "hint: If you are sure you want to delete it, run 'git branch -D feature'",
      'hint: Disable this message with "git config set advice.forceDeleteBranch false"',
    ]);
    expect(r.text).toMatch(/Deleted branch feature \(was [0-9a-f]{7}\)\./);
  });

  it("fast-forwards a merge", async () => {
    const r = await sh(
      `git switch -c feature
echo "pasta" > pasta.txt
git add . && git commit -m "Add pasta"
git switch main
git merge feature
git log --oneline`,
      PROJECT,
    );
    expect(r.text).toMatch(
      /Updating [0-9a-f]{7}\.\.[0-9a-f]{7}\nFast-forward\n pasta\.txt \| 1 \+\n 1 file changed, 1 insertion\(\+\)\n create mode 100644 pasta\.txt/,
    );
    expect(r.printed.at(-2)).toMatch(/\(HEAD -> main, feature\) Add pasta$/);
  });

  it("stops on a conflict, then finishes the merge after you fix it", async () => {
    const result = await executeShell(
      `git switch -c feature
echo 'print("hi")' > app.py
git commit -am "Say hi"
git switch main
echo 'print("hey")' > app.py
git commit -am "Say hey"
git merge feature
cat app.py
git status
git commit -m "Merge"
echo 'print("hi and hey")' > app.py
git add app.py
git status -s
git commit -m "Merge feature"
git log --oneline -n 1`,
      {
        setup: PROJECT,
        tests: [
          {
            name: "merged",
            check: "(await git.log())[0].parents.length === 2",
          },
          {
            name: "no conflicts left",
            check: "(await git.conflicts()).length === 0",
          },
          {
            name: "the file is fixed",
            check: 'file("app.py") === \'print("hi and hey")\\n\'',
          },
          {
            name: "clean",
            check: "Object.keys(await git.status()).length === 0",
          },
        ],
      },
    );
    const text = result.output.map((l) => l.text).join("\n");
    expect(text).toContain(
      "Auto-merging app.py\nCONFLICT (content): Merge conflict in app.py\nAutomatic merge failed; fix conflicts and then commit the result.",
    );
    expect(text).toContain(
      '<<<<<<< HEAD\nprint("hey")\n=======\nprint("hi")\n>>>>>>> feature',
    );
    expect(text).toContain("You have unmerged paths.");
    expect(text).toContain(
      'You have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)\n\tboth modified:   app.py\n\nno changes added to commit (use "git add" and/or "git commit -a")',
    );
    expect(text).toContain(
      "error: Committing is not possible because you have unmerged files.",
    );
    expect(text).toMatch(/[0-9a-f]{7} \(HEAD -> main\) Merge feature/);
    expect(result.tests).toEqual([
      { name: "merged", passed: true },
      { name: "no conflicts left", passed: true },
      { name: "the file is fixed", passed: true },
      { name: "clean", passed: true },
    ]);
  });

  it("refuses to switch when changes would be lost", async () => {
    const r = await sh(
      `git switch -c feature
echo "v2" > README.md
git commit -am "v2"
git switch main
echo "local edit" > README.md
git switch feature`,
      PROJECT,
    );
    expect(r.errors[0]).toBe(
      "error: Your local changes to the following files would be overwritten by checkout:",
    );
  });

  it("checks out an old commit as a detached HEAD", async () => {
    const r = await sh(
      `echo two >> README.md
git commit -am "Second"
git checkout HEAD~1
git status
git switch main`,
      PROJECT,
    );
    expect(r.text).toMatch(
      /You are in 'detached HEAD' state[\s\S]*HEAD is now at [0-9a-f]{7} First commit/,
    );
    expect(r.text).toMatch(/HEAD detached at [0-9a-f]{7}/);
    expect(r.text).toContain("Switched to branch 'main'");
  });

  it("explains being outside a repository and commands that come later", async () => {
    const r = await sh("git status\ngit stash\ngit frob");
    expect(r.errors).toEqual([
      "fatal: not a git repository (or any of the parent directories): .git",
      "git: 'stash' isn't in this practice terminal yet. It comes in later lessons.",
      "git: 'frob' is not a git command. See 'git --help'.",
    ]);
  });

  it("uses the name and email from git config", async () => {
    const r = await sh(
      `git config --global user.name "Anora"
git config --global user.email "anora@example.com"
mkdir p && cd p && git init
touch a && git add a && git commit -m one
git log -n 1`,
    );
    expect(r.text).toContain("Author: Anora <anora@example.com>");
  });
});

describe("matches real git and bash where lessons noticed a difference", () => {
  it("spaces git status like git: no blank line after the branch once there are commits", async () => {
    const r = await sh(
      "echo more >> app.py\ngit status\ngit add app.py\ngit commit -m x\ngit status",
      PROJECT,
    );
    expect(r.text).toContain(
      '~/project $ git status\nOn branch main\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   app.py\n\nno changes added to commit (use "git add" and/or "git commit -a")',
    );
    expect(r.text).toMatch(
      /~\/project \$ git status\nOn branch main\nnothing to commit, working tree clean$/,
    );
  });

  it("prints git status's report when there's nothing to commit", async () => {
    const r = await sh("touch notes.txt\ngit commit -m x", PROJECT);
    expect(r.text).toContain(
      'On branch main\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tnotes.txt\n\nnothing added to commit but untracked files present (use "git add" to track)',
    );
    const first = await sh(
      "mkdir p && cd p && git init\ntouch a\ngit commit -m x",
    );
    expect(first.text).toContain(
      "On branch main\n\nInitial commit\n\nUntracked files:",
    );
  });

  it("reads an unquoted commit message's extra words as file names", async () => {
    const r = await sh("echo x >> app.py\ngit commit -am Add soup", PROJECT);
    expect(r.errors).toEqual([
      "error: pathspec 'soup' did not match any file(s) known to git",
    ]);
  });

  it("reads global git config anywhere", async () => {
    const r = await sh(
      'git config --global user.name "Anora"\ngit config user.name',
    );
    expect(r.printed).toEqual(["Anora"]);
  });

  it("shows a commit's summary with git show --stat", async () => {
    const r = await sh("git show --stat", PROJECT);
    expect(r.text).toContain(
      " README.md | 1 +\n app.py    | 1 +\n 2 files changed, 2 insertions(+)",
    );
  });

  it("sorts ls arguments and wildcard matches like ls and bash", async () => {
    const r = await sh(
      "touch Beach.jpg apple.jpg zoo.txt .hidden\nmkdir docs\nls zoo.txt Beach.jpg apple.jpg\necho *.jpg\nls -A\nls -l",
    );
    expect(r.printed.slice(0, 3)).toEqual([
      "apple.jpg  Beach.jpg  zoo.txt",
      "apple.jpg Beach.jpg",
      ".hidden  apple.jpg  Beach.jpg  docs  zoo.txt",
    ]);
    expect(r.text).toMatch(
      /drwxr-xr-x 2 panda panda +\d+ Jan +5 \d\d:\d\d docs/,
    );
  });

  it("refuses to move into a folder that isn't there", async () => {
    const r = await sh("touch a.css\nmv a.css css/\nls");
    expect(r.errors).toEqual([
      "mv: cannot move 'a.css' to 'css/': Not a directory",
    ]);
    expect(r.printed).toEqual(["a.css"]);
  });

  it("explains tree on a file like tree does", async () => {
    const r = await sh("touch a\ntree a");
    expect(r.printed).toEqual([
      "a [error opening dir]",
      "",
      "0 directories, 0 files",
    ]);
  });
});

describe("exercise checks", () => {
  it("see files, folders, git state and what the learner ran", async () => {
    const result = await executeShell(
      "mkdir docs\necho hi > docs/a.txt\ncd docs",
      {
        setup: PROJECT,
        tests: [
          { name: "file", check: 'file("docs/a.txt") === "hi\\n"' },
          { name: "missing file", check: 'file("nope") === null' },
          { name: "dir", check: 'isDir("docs") && ls("docs").length === 1' },
          { name: "cwd", check: 'cwd === "~/project/docs"' },
          { name: "commands", check: 'commands.includes("cd docs")' },
          { name: "run", check: '(await run("ls")).includes("docs")' },
          {
            name: "repo",
            check: 'git.isRepo() && (await git.branch()) === "main"',
          },
          {
            name: "status",
            check: '(await git.status())["docs/a.txt"] === "??"',
          },
          {
            name: "log",
            check:
              '(await git.log()).map(c => c.message).join() === "First commit"',
          },
          {
            name: "show",
            check:
              '(await git.show("HEAD", "app.py")) === \'print("hello")\\n\'',
          },
          { name: "fails", check: "1 === 2" },
        ],
      },
    );
    expect(result.tests?.map((t) => [t.name, t.passed])).toEqual([
      ["file", true],
      ["missing file", true],
      ["dir", true],
      ["cwd", true],
      ["commands", true],
      ["run", true],
      ["repo", true],
      ["status", true],
      ["log", true],
      ["show", true],
      ["fails", false],
    ]);
  });

  it("fail with a clear reason after a syntax error", async () => {
    const result = await executeShell('echo "oops', {
      tests: [{ name: "x", check: "true" }],
    });
    expect(result.tests).toEqual([
      { name: "x", passed: false, error: "Fix the error in your code first." },
    ]);
  });
});

describe("line diffs", () => {
  it("finds added, removed and kept lines", () => {
    expect(diffLines("a\nb\nc\n", "a\nc\nd\n")).toEqual([
      { op: " ", text: "a" },
      { op: "-", text: "b" },
      { op: " ", text: "c" },
      { op: "+", text: "d" },
    ]);
  });

  it("writes unified hunks with context", () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join(
      "\n",
    );
    const after = before
      .replace("line 2\n", "line two\n")
      .replace("line 18\n", "");
    expect(hunks(before, after)).toEqual([
      "@@ -1,5 +1,5 @@",
      " line 1",
      "-line 2",
      "+line two",
      " line 3",
      " line 4",
      " line 5",
      "@@ -15,6 +15,5 @@ line 14",
      " line 15",
      " line 16",
      " line 17",
      "-line 18",
      " line 19",
      " line 20",
    ]);
  });
});

describe("Level 1 commands", () => {
  // The repository the outputs were checked against in git 2.50.
  const MENU = PROJECT.replace("# Menu app", "# Menu");

  it("amends like git: same author date, a Date line, no root-commit", async () => {
    const r = await sh(
      `echo more >> README.md
git add README.md
git commit --amend -m "First commit, fixed"
echo x > b.txt
git add b.txt
git commit -m "Add b"
echo y >> b.txt
git commit -a --amend --no-edit`,
      MENU,
    );
    // Hashes and output checked against git 2.50.
    expect(r.printed.slice(0, 2)).toEqual([
      "[main 33e0abf] First commit, fixed",
      " Date: Mon Jan 5 09:01:00 2026 +0000",
    ]);
    expect(r.printed).toContain("[main 9531a46] Add b");
    expect(r.printed).toContain(" Date: Mon Jan 5 09:03:00 2026 +0000");
  });

  it("lists branches with -v, renames with -m and goes back with switch -", async () => {
    const r = await sh(
      `git switch -
git branch menu
git branch feature-long
git branch -v
git branch -m feature-long main
git branch -m feature-long food
git branch -m nope new
git switch menu
git switch -
git checkout -
git branch`,
      MENU,
    );
    expect(r.printed.slice(0, 3)).toEqual([
      "  feature-long 4a4936d First commit",
      "* main         4a4936d First commit",
      "  menu         4a4936d First commit",
    ]);
    expect(r.errors).toEqual([
      "fatal: invalid reference: @{-1}",
      "fatal: a branch named 'main' already exists",
      "fatal: no branch named 'nope'",
    ]);
    expect(r.printed.slice(3)).toEqual([
      "Switched to branch 'menu'",
      "Switched to branch 'main'",
      "Switched to branch 'menu'",
      "  food",
      "  main",
      "* menu",
    ]);
  });

  it("diffs against commits and between them", async () => {
    const r = await sh(
      `echo x > b.txt
git add b.txt
git commit -m "Add b"
echo z >> app.py
git add app.py
echo w >> app.py
git diff HEAD
git diff HEAD~1 HEAD --stat
git diff HEAD~1..HEAD --stat
git diff nothing`,
      MENU,
    );
    expect(r.printed.slice(3)).toEqual([
      "diff --git a/app.py b/app.py",
      "index 11b15b1..3501232 100644",
      "--- a/app.py",
      "+++ b/app.py",
      "@@ -1 +1,3 @@",
      ' print("hello")',
      "+z",
      "+w",
      " b.txt | 1 +",
      " 1 file changed, 1 insertion(+)",
      " b.txt | 1 +",
      " 1 file changed, 1 insertion(+)",
    ]);
    expect(r.errors[0]).toBe(
      "fatal: ambiguous argument 'nothing': unknown revision or path not in the working tree.",
    );
  });

  it("checks what .gitignore leaves out", async () => {
    const r = await sh(
      `echo "*.log" > .gitignore
touch debug.log
git check-ignore debug.log app.py
echo $?
git check-ignore app.py
echo $?`,
      MENU,
    );
    expect(r.printed).toEqual(["debug.log", "0", "1"]);
  });

  it("cuts, translates, tees and printfs like coreutils", async () => {
    const r = await sh(`printf "a,b\\nc,d\\n" | cut -d, -f2
echo panda | cut -c1-3
echo "a b  c" | cut -d" " -f2,3
echo hello | tr -d l
echo hello | tr el ip
echo "a:b" | tr ":" "\\n"
echo hi | tr a-z A-Z
echo hi | tee t.txt
echo more | tee -a t.txt
cat t.txt
printf "%s is %d\\n" panda 5 koala 7
printf "100%%\\n"`);
    expect(r.printed).toEqual([
      "b",
      "d",
      "pan",
      "b ",
      "heo",
      "hippo",
      "a",
      "b",
      "HI",
      "hi",
      "more",
      "hi",
      "more",
      "panda is 5",
      "koala is 7",
      "100%",
    ]);
  });
});

describe("a merge that stops on a conflict", () => {
  // Omar adds a page and edits README; both sides change index.html.
  const SETUP = `mkdir club && cd club
git init
echo "nav: Home" > index.html
echo "# Club" > README.md
git add .
git commit -m "First"
git switch -c omar
echo "nav: Films" > index.html
echo "members" > members.html
echo "more" >> README.md
git add .
git commit -m "Omar"
git switch main
echo "nav: Schedule" > index.html
git commit -am "Mine"`;

  it("stages the other side's clean changes, like git", async () => {
    const r = await sh(
      `git merge omar
git status
git switch omar
echo "nav: both" > index.html
git add index.html
git status
git merge --continue
git show --stat HEAD`,
      SETUP,
    );
    expect(r.printed.slice(3, 15)).toEqual([
      "On branch main",
      "You have unmerged paths.",
      '  (fix conflicts and run "git commit")',
      '  (use "git merge --abort" to abort the merge)',
      "",
      "Changes to be committed:",
      "\tmodified:   README.md",
      "\tnew file:   members.html",
      "",
      "Unmerged paths:",
      '  (use "git add <file>..." to mark resolution)',
      "\tboth modified:   index.html",
    ]);
    expect(r.errors).toEqual([
      "fatal: cannot switch branch while merging",
      'Consider "git merge --quit" or "git worktree add".',
    ]);
    expect(r.text).toContain(`All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
\tmodified:   README.md
\tmodified:   index.html
\tnew file:   members.html`);
    expect(r.text).toContain("[main ");
    expect(r.text).toContain("] Merge branch 'omar'");
  });

  it("keeps every change in the merge commit", async () => {
    const { tests } = await executeShell(
      `git merge omar
echo "nav: both" > index.html
git add index.html
git commit -m "Merge omar"`,
      {
        setup: SETUP,
        tests: [
          {
            name: "page",
            check: "(await git.show('HEAD', 'members.html')) === 'members\\n'",
          },
          {
            name: "readme",
            check:
              "(await git.show('HEAD', 'README.md')) === '# Club\\nmore\\n'",
          },
          {
            name: "clean",
            check: "Object.keys(await git.status()).length === 0",
          },
        ],
      },
    );
    expect(tests?.map((t) => t.passed)).toEqual([true, true, true]);
  });

  it("goes back exactly with --abort", async () => {
    const r = await sh(
      `git merge omar\ngit merge --abort\ngit status -s\nls`,
      SETUP,
    );
    expect(r.printed.slice(3)).toEqual(["index.html  README.md"]);
  });

  it("lists merged and unmerged branches", async () => {
    const r = await sh(
      `git branch side
git branch --merged
git branch --no-merged`,
      SETUP,
    );
    expect(r.printed).toEqual(["* main", "  side", "  omar"]);
  });
});

describe("matching git's smaller messages", () => {
  it("keeps unrelated edits through a merge and says what it auto-merged", async () => {
    const r = await sh(
      `printf "1 tea\\n2 soup\\n3 cake\\n4 pie\\n5 bun\\n6 jam\\n7 egg\\n" > menu.txt
git add menu.txt
git commit -m menu
git switch -c b
echo "1 TEA" > top.txt
printf "1 TEA\\n2 soup\\n3 cake\\n4 pie\\n5 bun\\n6 jam\\n7 egg\\n" > menu.txt
git commit -am b1
git switch main
printf "1 tea\\n2 soup\\n3 cake\\n4 pie\\n5 bun\\n6 jam\\n7 EGG\\n" > menu.txt
git commit -am m1
echo x >> README.md
git merge b -m "Merge b"
git status -s
git switch b
git branch -d`,
      PROJECT,
    );
    expect(r.text).toContain(`Auto-merging menu.txt
Merge made by the 'ort' strategy.`);
    expect(r.text).toContain("~/project $ git status -s\n M README.md");
    expect(r.text).toContain("M\tREADME.md\nSwitched to branch 'b'");
    expect(r.errors).toEqual(["fatal: branch name required"]);
  });

  it("lists tracked changes before untracked files", async () => {
    const r = await sh(
      `touch a.txt\necho x >> README.md\ngit status -s`,
      PROJECT,
    );
    expect(r.printed).toEqual([" M README.md", "?? a.txt"]);
  });

  it("ends a blocked commit with the files still in conflict", async () => {
    const r = await sh(
      `git switch -c b
echo one > app.py
git commit -am b
git switch main
echo two > app.py
git commit -am m
git merge b
git merge b
git commit -m x`,
      PROJECT,
    );
    expect(r.errors.slice(0, 1)).toEqual([
      "error: Merging is not possible because you have unmerged files.",
    ]);
    expect(r.printed.at(-1)).toBe("U\tapp.py");
  });

  it("checks out files silently after --, and skips tracked files in check-ignore", async () => {
    const r = await sh(
      `echo "*.py" > .gitignore
echo bad > app.py
git checkout -- app.py
git check-ignore app.py
echo $?`,
      PROJECT,
    );
    expect(r.printed).toEqual(["1"]);
  });
});

describe("the commit graph", () => {
  /** Each row as "lane message (labels)", newest first. */
  async function graph(code: string, setup = PROJECT) {
    const { graph } = await executeShell(code, { setup });
    return {
      graph,
      rows: graph?.commits.map(
        (c) =>
          `${c.lane} ${c.message}${c.labels.length ? ` (${c.labels.map((l) => l.name).join(", ")})` : ""}`,
      ),
      edges: graph?.edges
        .map(
          (e) =>
            `${e.from}->${e.to ?? "…"} ${e.fromLane}/${e.lane}/${e.toLane}`,
        )
        .sort(),
    };
  }

  it("is left out without a repository or commits", async () => {
    expect((await graph("ls", "")).graph).toBeUndefined();
    expect((await graph("git init", "")).graph).toBeUndefined();
  });

  it("draws a straight line of commits, HEAD on the newest", async () => {
    const {
      graph: g,
      rows,
      edges,
    } = await graph(`echo more >> README.md\ngit commit -am "Second"`);
    expect(rows).toEqual(["0 Second (main)", "0 First commit"]);
    expect(edges).toEqual(["0->1 0/0/0"]);
    expect(g?.commits.map((c) => c.head)).toEqual([true, false]);
    expect(g?.commits[0].labels[0].kind).toBe("head");
    expect(g?.branch).toBe("main");
    expect(g?.lanes).toBe(1);
  });

  it("puts branches side by side and joins them at a merge", async () => {
    const {
      rows,
      edges,
      graph: g,
    } = await graph(`git switch -c menu
echo soup > menu.txt
git add menu.txt
git commit -m "Add menu"
git switch main
echo hi >> README.md
git commit -am "Update README"
git merge menu -m "Merge menu"`);
    expect(rows).toEqual([
      "0 Merge menu (main)",
      "0 Update README",
      "1 Add menu (menu)",
      "0 First commit",
    ]);
    // The merge's second line leaves into lane 1; both lines meet at the
    // first commit, where lane 1 bends back into lane 0.
    expect(edges).toEqual([
      "0->1 0/0/0",
      "0->2 0/1/1",
      "1->3 0/0/0",
      "2->3 1/1/0",
    ]);
    expect(g?.lanes).toBe(2);
  });

  it("labels tags and a detached HEAD", async () => {
    const { rows, graph: g } = await graph(`git tag v1
echo more >> README.md
git commit -am "Second"
git checkout v1`);
    expect(rows).toEqual(["0 Second (main)", "0 First commit (HEAD, v1)"]);
    expect(g?.branch).toBeNull();
    expect(g?.commits[1].head).toBe(true);
  });

  it("shows the newest commits and counts the rest", async () => {
    const commits = Array.from(
      { length: 30 },
      (_, i) => `echo ${i} > n.txt\ngit add n.txt\ngit commit -m "Commit ${i}"`,
    ).join("\n");
    const { graph: g } = await graph(commits);
    expect(g?.commits).toHaveLength(24);
    expect(g?.more).toBe(7);
    expect(g?.edges.at(-1)?.to).toBeNull();
  });

  it("is drawn before checks run more commands", async () => {
    const { graph: g } = await executeShell("", {
      setup: PROJECT,
      tests: [
        {
          name: "x",
          check: `(await run('git commit --allow-empty -m Later'), true)`,
        },
      ],
    });
    expect(g?.commits.map((c) => c.message)).toEqual(["First commit"]);
  });
});
