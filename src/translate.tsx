import { runTranslate } from "./run-translate";

/**
 * Translator (no-view): translate the selected text (or clipboard) between
 * Russian and English — direction auto-detected — copy the result, and flash a
 * HUD. Single words also get a few English synonyms in brackets.
 */
export default async function Command() {
  await runTranslate();
}
