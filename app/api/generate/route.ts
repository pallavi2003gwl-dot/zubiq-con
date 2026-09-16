import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_INSTRUCTIONS, DEFAULT_INSTRUCTIONS, type AiModule } from "@/lib/aiPrompts";

interface GenerateRequestBody {
  module?: AiModule;
  dataContext?: string;
  instruction?: string;
}

interface GeminiPart {
  text?: string;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
}

const TIMEOUT_MS = 25000;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured on the server. Set GEMINI_API_KEY in .env.local." },
      { status: 500 }
    );
  }

  let body: GenerateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { module, dataContext, instruction } = body;
  if (!module || !(module in SYSTEM_INSTRUCTIONS) || !dataContext) {
    return NextResponse.json({ error: "Request is missing the module or data context." }, { status: 400 });
  }

  const finalInstruction = instruction?.trim() ? instruction.trim() : DEFAULT_INSTRUCTIONS[module];
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Never pass temperature/top_p/top_k — deprecated on current Gemini models (CLAUDE.md rule 7).
  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTIONS[module] }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `${dataContext}\n\n---\n\nINSTRUCTION:\n${finalInstruction}` }],
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "The request to Gemini timed out. Try again." }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Could not reach Gemini. Check your connection and try again." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 429) {
    return NextResponse.json(
      { error: "Gemini rate limit reached. Wait a moment and try again." },
      { status: 429 }
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Gemini returned an error (HTTP ${res.status}). ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  if (!text.trim()) {
    return NextResponse.json(
      { error: "Gemini returned an empty response. Try again, or adjust the instruction." },
      { status: 502 }
    );
  }

  return NextResponse.json({ text });
}
