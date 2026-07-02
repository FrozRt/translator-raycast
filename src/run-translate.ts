/**
 * The no-view command runner: translate the SELECTED text (or clipboard) with no
 * window. On the hotkey it grabs the current selection (falling back to the
 * clipboard), translates it, copies the result to the clipboard, and flashes a
 * HUD line — the whole interaction is windowless and auto-dismisses.
 *
 * For a single word the HUD/clipboard also carries a few English synonyms in
 * brackets, e.g. «shore (bank, riverside, embankment)».
 */

import { Clipboard, getPreferenceValues, showHUD } from "@raycast/api";
import { DEFAULT_MODEL, translate } from "./providers";
import type { TranslateOptions, TranslateResult } from "./providers/types";
import { asTranslateError, type TranslateError } from "./lib/errors";
import { readInput } from "./lib/input";

/** Resolve preferences (manifest -> raycast-env.d.ts) into core options. */
function resolveOptions(): TranslateOptions {
  const prefs = getPreferenceValues<Preferences>();
  return {
    apiKey: (prefs.apiKey ?? "").trim(),
    model: (prefs.model ?? "").trim() || DEFAULT_MODEL,
  };
}

/** Full result string: translation, plus English synonyms in brackets for a word. */
function formatResult(result: TranslateResult): string {
  const synonyms = result.synonyms ?? [];
  if (synonyms.length > 0) {
    return `${result.translation} (${synonyms.join(", ")})`;
  }
  return result.translation;
}

/** Short, human HUD message for a failed run. */
function hudForError(error: TranslateError): string {
  switch (error.kind) {
    case "empty":
      return "⚠️ Nothing to translate — select some text or copy it first";
    case "auth":
      return "⚠️ Set your Gemini API key in the extension preferences";
    case "rateLimit":
      return "⚠️ Rate limit — wait a few seconds and try again";
    case "timeout":
      return "⚠️ Gemini timed out — try again";
    case "network":
      return "⚠️ No connection to Gemini";
    case "parse":
      return "⚠️ Gemini returned an empty response — try again";
    case "api":
      return "⚠️ Gemini error — check the extension and try again";
  }
}

/** Entry point for the no-view Translate command. */
export async function runTranslate(): Promise<void> {
  try {
    const { text, source } = await readInput();
    if (text === "") {
      await showHUD(
        "⚠️ Nothing to translate — select some text or copy it first",
      );
      return;
    }

    await showHUD("Translating…");
    const result = await translate(text, resolveOptions());
    const output = formatResult(result);

    // The result always shows in the HUD. Only overwrite the clipboard when the
    // input CAME from the clipboard — a selection is left untouched.
    if (source === "clipboard") {
      await Clipboard.copy(output);
    }
    await showHUD(`✅ ${output}`);
  } catch (raw) {
    await showHUD(hudForError(asTranslateError(raw)));
  }
}
