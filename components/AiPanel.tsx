"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown, ChevronRight, Copy, Loader2, Sparkles } from "lucide-react";
import { DEFAULT_INSTRUCTIONS, type AiModule } from "@/lib/aiPrompts";
import { parseAiSections } from "@/lib/parseAiOutput";

const BUTTON_LABEL: Record<AiModule, string> = {
  upsell: "Generate Recommendation",
  conversion: "Generate Conversion Plan",
  alignment: "Generate Social & Ad Strategy",
};

type PanelState = "idle" | "loading" | "error" | "result";

export function AiPanel({ module, dataContext }: { module: AiModule; dataContext: string }) {
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTIONS[module]);
  const [state, setState] = useState<PanelState>("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, dataContext, instruction }),
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

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {contextOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Data context sent to the model (locked, read-only)
        </button>
        {contextOpen ? (
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            {dataContext}
          </pre>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500" htmlFor={`instruction-${module}`}>
          Instruction
        </label>
        <textarea
          id={`instruction-${module}`}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 transition-shadow focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={state === "loading"}
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
