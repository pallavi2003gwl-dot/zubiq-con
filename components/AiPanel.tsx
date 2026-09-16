"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Loader2, RotateCcw, Sparkles } from "lucide-react";
import type { AiModule } from "@/lib/aiPrompts";
import { parseAiSections } from "@/lib/parseAiOutput";

const BUTTON_LABEL: Record<AiModule, string> = {
  upsell: "Generate Recommendation",
  conversion: "Generate Conversion Plan",
  alignment: "Generate Social & Ad Strategy",
};

type PanelState = "idle" | "loading" | "error" | "result";

// One fully editable prompt, pre-filled with a sensible default (data + instruction,
// composed by the module's builder in lib/*Context.ts). There is no hidden system
// prompt and no locked/read-only panel — whatever is in the textarea when Generate
// is clicked is exactly what gets sent to Gemini, nothing appended server-side.
//
// When the underlying record can change (a different client/lead selected), the
// caller must pass a `key` tied to that record's id so React remounts this
// component with a fresh default — that's the React-recommended way to reset
// state on a prop change, rather than syncing via an effect.
export function AiPanel({ module, defaultPrompt }: { module: AiModule; defaultPrompt: string }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [state, setState] = useState<PanelState>("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Try again.");
        setState("error");
        return;
      }
      setResult(json.text as string);
      setState("result");
    } catch {
      setError("Network error reaching the server. Check your connection and try again.");
      setState("error");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked by the browser; silently ignore, copy button just won't confirm.
    }
  }

  const sections = state === "result" ? parseAiSections(result) : [];
  const isEdited = prompt !== defaultPrompt;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500" htmlFor={`prompt-${module}`}>
            Prompt — edit anything before generating, including the data
          </label>
          {isEdited ? (
            <button
              type="button"
              onClick={() => {
                setPrompt(defaultPrompt);
                setState("idle");
                setError("");
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-navy-700"
            >
              <RotateCcw size={11} /> Reset to default
            </button>
          ) : null}
        </div>
        <textarea
          id={`prompt-${module}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={14}
          className="mt-1 w-full resize-y rounded-lg border border-slate-200 p-2.5 font-mono text-xs leading-relaxed text-slate-800 transition-shadow focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={state === "loading" || !prompt.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-navy-700 to-navy-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-navy-900/25 transition-all hover:from-navy-800 hover:to-navy-700 hover:shadow-md hover:shadow-navy-900/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {state === "loading" ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={15} /> {BUTTON_LABEL[module]}
            </>
          )}
        </button>
      </div>

      {state === "error" ? (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {state === "result" ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              {copied ? (
                <>
                  <Check size={12} /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {sections.map((section, i) => (
              <div key={i}>
                {section.heading ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-800">
                    {section.heading}
                  </p>
                ) : null}
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
