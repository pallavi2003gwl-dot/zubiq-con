// The AI panels have no hidden server-side system prompt. Each module's composer
// (lib/upsellContext.ts, lib/conversionContext.ts, lib/alignmentContext.ts) builds
// one complete, visible, user-editable prompt string that pre-fills the panel's
// textarea — this file just names the three modules.
export type AiModule = "upsell" | "conversion" | "alignment";
