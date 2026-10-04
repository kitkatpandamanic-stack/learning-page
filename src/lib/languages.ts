/**
 * Languages offered on PandaDev. Phase 3 moves the full curriculum into
 * content files; this list drives the catalog cards until then.
 */
export type Language = {
  slug: string;
  name: string;
  /** Two-letter monogram shown on the language tile */
  monogram: string;
  description: string;
  /** What people build with it, shown as small tags */
  usedFor: string[];
  status: "available" | "coming-soon";
  /** Tailwind classes using the --color-lang-* tokens */
  color: { text: string; bg: string; soft: string; border: string };
};

export const languages: Language[] = [
  {
    slug: "javascript",
    name: "JavaScript",
    monogram: "JS",
    description:
      "The language of the web. Build interactive sites, apps and servers.",
    usedFor: ["Web", "Frontend", "Node.js"],
    status: "available",
    color: {
      text: "text-lang-javascript",
      bg: "bg-lang-javascript",
      soft: "bg-lang-javascript/15",
      border: "hover:border-lang-javascript/50",
    },
  },
  {
    slug: "python",
    name: "Python",
    monogram: "Py",
    description:
      "Readable and powerful. Great first language, and the home of data and AI.",
    usedFor: ["AI & Data", "Automation", "Backend"],
    status: "available",
    color: {
      text: "text-lang-python",
      bg: "bg-lang-python",
      soft: "bg-lang-python/15",
      border: "hover:border-lang-python/50",
    },
  },
  {
    slug: "typescript",
    name: "TypeScript",
    monogram: "TS",
    description:
      "JavaScript with types. Catch bugs early and scale to big codebases.",
    usedFor: ["Web apps", "React", "Tooling"],
    status: "available",
    color: {
      text: "text-lang-typescript",
      bg: "bg-lang-typescript",
      soft: "bg-lang-typescript/15",
      border: "hover:border-lang-typescript/50",
    },
  },
  {
    slug: "java",
    name: "Java",
    monogram: "Jv",
    description:
      "Battle-tested and everywhere: enterprise backends and Android apps.",
    usedFor: ["Enterprise", "Android", "Backend"],
    status: "coming-soon",
    color: {
      text: "text-lang-java",
      bg: "bg-lang-java",
      soft: "bg-lang-java/15",
      border: "hover:border-lang-java/50",
    },
  },
  {
    slug: "csharp",
    name: "C#",
    monogram: "C#",
    description:
      "Modern and versatile. Games with Unity, apps and cloud services.",
    usedFor: ["Games", ".NET", "Desktop"],
    status: "coming-soon",
    color: {
      text: "text-lang-csharp",
      bg: "bg-lang-csharp",
      soft: "bg-lang-csharp/15",
      border: "hover:border-lang-csharp/50",
    },
  },
  {
    slug: "go",
    name: "Go",
    monogram: "Go",
    description:
      "Simple, fast and built for the cloud. Loved for APIs and DevOps tools.",
    usedFor: ["Cloud", "APIs", "DevOps"],
    status: "coming-soon",
    color: {
      text: "text-lang-go",
      bg: "bg-lang-go",
      soft: "bg-lang-go/15",
      border: "hover:border-lang-go/50",
    },
  },
  {
    slug: "rust",
    name: "Rust",
    monogram: "Rs",
    description:
      "Blazing fast and memory safe. Systems, WebAssembly and tooling.",
    usedFor: ["Systems", "WebAssembly", "CLI"],
    status: "coming-soon",
    color: {
      text: "text-lang-rust",
      bg: "bg-lang-rust",
      soft: "bg-lang-rust/15",
      border: "hover:border-lang-rust/50",
    },
  },
  {
    slug: "cpp",
    name: "C++",
    monogram: "C+",
    description:
      "Close to the metal. Game engines, browsers and high-performance code.",
    usedFor: ["Game engines", "Embedded", "Performance"],
    status: "coming-soon",
    color: {
      text: "text-lang-cpp",
      bg: "bg-lang-cpp",
      soft: "bg-lang-cpp/15",
      border: "hover:border-lang-cpp/50",
    },
  },
  {
    slug: "sql",
    name: "SQL",
    monogram: "SQ",
    description: "Talk to databases. Every developer needs it sooner or later.",
    usedFor: ["Databases", "Analytics", "Backend"],
    status: "available",
    color: {
      text: "text-lang-sql",
      bg: "bg-lang-sql",
      soft: "bg-lang-sql/15",
      border: "hover:border-lang-sql/50",
    },
  },
];
