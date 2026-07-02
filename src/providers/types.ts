/**
 * Core translation contract.
 *
 * The core (prompt/lib/providers) does NOT import `@raycast/api`: providers
 * receive apiKey/model as explicit arguments (DI), so the same `translate()`
 * runs both in the UI and headless in scripts/eval.ts. The app uses Gemini only.
 */

export interface TranslateOptions {
  apiKey: string;
  model: string;
  /** Optional external cancellation (the provider adds its own on timeout). */
  signal?: AbortSignal;
}

export interface TranslateResult {
  /** The translation (protected tokens kept verbatim). */
  translation: string;
  /** English synonyms for a single word, or null for a sentence / longer text. */
  synonyms: string[] | null;
}
