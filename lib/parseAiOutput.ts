export interface AiSection {
  heading: string;
  body: string;
}

const HEADING_RE = /^[A-Z][A-Z0-9 /&'-]{2,60}$/;

/** Splits Gemini's fixed-heading output (e.g. "PITCH ANGLE\n...") into labeled sections. */
export function parseAiSections(text: string): AiSection[] {
  const lines = text.split("\n");
  const sections: AiSection[] = [];
  let current: AiSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line && HEADING_RE.test(line)) {
      current = { heading: line, body: "" };
      sections.push(current);
    } else if (current) {
      current.body += (current.body ? "\n" : "") + rawLine;
    } else if (line) {
      current = { heading: "", body: rawLine };
      sections.push(current);
    }
  }

  return sections.map((s) => ({ heading: s.heading, body: s.body.trim() })).filter((s) => s.body);
}
