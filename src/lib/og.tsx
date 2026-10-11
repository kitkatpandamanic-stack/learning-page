import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

// The panda mark as a data URI so it can be drawn inside generated images.
const pandaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="e" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs><circle cx="10" cy="11" r="6.5" fill="url(#e)"/><circle cx="30" cy="11" r="6.5" fill="url(#e)"/><ellipse cx="20" cy="22.5" rx="14" ry="13" fill="#f5f3ff"/><ellipse cx="14" cy="21.5" rx="4" ry="5" transform="rotate(-28 14 21.5)" fill="#1a1640"/><ellipse cx="26" cy="21.5" rx="4" ry="5" transform="rotate(28 26 21.5)" fill="#1a1640"/><circle cx="14.6" cy="21" r="1.6" fill="#22d3ee"/><circle cx="25.4" cy="21" r="1.6" fill="#22d3ee"/><ellipse cx="20" cy="28" rx="2.2" ry="1.5" fill="#1a1640"/></svg>`;
export const pandaDataUri = `data:image/svg+xml;base64,${Buffer.from(pandaSvg).toString("base64")}`;

// Onest has Latin and Cyrillic letters, so English and Russian share images
// look the same. Files come from @fontsource/onest; images are built at
// build time, when node_modules is available.
const fontDir = join(process.cwd(), "node_modules/@fontsource/onest/files");
let fonts: Promise<ConstructorParameters<typeof ImageResponse>[1]> | null =
  null;

function loadFonts() {
  fonts ??= Promise.all(
    (["latin", "cyrillic"] as const).flatMap((subset) =>
      ([400, 700] as const).map(async (weight) => ({
        name: subset === "latin" ? "Onest" : "Onest Cyrillic",
        weight,
        style: "normal" as const,
        data: await readFile(
          join(fontDir, `onest-${subset}-${weight}-normal.woff`),
        ),
      })),
    ),
  ).then((list) => ({ ...ogSize, fonts: list }));
  return fonts;
}

/** Branded share image: dark space background, glow, panda, big title. */
export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  accent = "#8b5cf6",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: "#070814",
        backgroundImage: `radial-gradient(circle at 15% 0%, ${accent}aa 0%, transparent 45%), radial-gradient(circle at 100% 100%, #22d3ee66 0%, transparent 45%), radial-gradient(circle at 85% 10%, #f472b655 0%, transparent 35%)`,
        color: "white",
        fontFamily: "Onest, Onest Cyrillic",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pandaDataUri} width={64} height={64} alt="" />
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          Panda<span style={{ color: "#c4b5fd" }}>Dev</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 20px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)",
            fontSize: 26,
            color: "#a5f3fc",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 64 : 80,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "rgba(226,232,255,0.7)",
              maxWidth: 980,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          height: 8,
          width: "100%",
          borderRadius: 999,
          backgroundImage: "linear-gradient(90deg, #8b5cf6, #f472b6, #22d3ee)",
        }}
      />
    </div>,
    await loadFonts(),
  );
}

export type DailyCardRow = {
  /** Short badge text, e.g. "Py" */
  monogram: string;
  /** Badge colour */
  color: string;
  title: string;
  difficulty: string;
};

/** The Telegram channel's daily picture: the date and the day's problems. */
export async function renderDailyCard({
  label,
  date,
  rows,
  footer,
}: {
  label: string;
  date: string;
  rows: DailyCardRow[];
  footer: string;
}) {
  const clip = (text: string, max = 46) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 64px",
        backgroundColor: "#070814",
        backgroundImage:
          "radial-gradient(circle at 12% 0%, #8b5cf6aa 0%, transparent 45%), radial-gradient(circle at 100% 100%, #22d3ee66 0%, transparent 45%), radial-gradient(circle at 88% 8%, #f472b655 0%, transparent 35%)",
        color: "white",
        fontFamily: "Onest, Onest Cyrillic",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pandaDataUri} width={56} height={56} alt="" />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            Panda<span style={{ color: "#c4b5fd" }}>Dev</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: "8px 20px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)",
            fontSize: 24,
            color: "#a5f3fc",
          }}
        >
          {label}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1.5,
            marginBottom: 6,
          }}
        >
          {date}
        </div>
        {rows.map((row) => (
          <div
            key={row.monogram}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "12px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 58,
                height: 44,
                borderRadius: 12,
                background: `${row.color}33`,
                color: row.color,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {row.monogram}
            </div>
            <div style={{ display: "flex", flex: 1, fontSize: 30 }}>
              {clip(row.title)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "rgba(226,232,255,0.7)",
              }}
            >
              {row.difficulty}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", fontSize: 24, color: "#fcd34d" }}>
          {footer}
        </div>
        <div
          style={{
            display: "flex",
            height: 8,
            width: "100%",
            borderRadius: 999,
            backgroundImage:
              "linear-gradient(90deg, #8b5cf6, #f472b6, #22d3ee)",
          }}
        />
      </div>
    </div>,
    await loadFonts(),
  );
}
