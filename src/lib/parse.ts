/**
 * Defensive parsing of the model's JSON output with a fallback.
 *
 * The model is asked to return strictly {"translation": string, "synonyms": string[]|null}
 * with no preamble and no ``` fences. Models misbehave, so we:
 *   1) strip code fences;
 *   2) try JSON.parse;
 *   3) try to extract the first brace-balanced {...};
 *   4) fall back to: whole text = translation, synonyms = null.
 */

import type { TranslateResult } from "../providers/types";

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

/** Extracts the first brace-balanced object (string/escape aware). */
function extractFirstObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function coerce(parsed: unknown): TranslateResult | null {
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.translation !== "string" || obj.translation.trim() === "") {
    return null;
  }
  const synonyms =
    Array.isArray(obj.synonyms) &&
    obj.synonyms.some((s) => typeof s === "string" && s.trim() !== "")
      ? obj.synonyms
          .filter((s): s is string => typeof s === "string" && s.trim() !== "")
          .map((s) => s.trim())
      : null;
  return { translation: obj.translation.trim(), synonyms };
}

function tryParse(candidate: string): TranslateResult | null {
  try {
    return coerce(JSON.parse(candidate));
  } catch {
    return null;
  }
}

export function parseModelOutput(raw: string): TranslateResult {
  const text = (raw ?? "").trim();
  const cleaned = stripCodeFences(text);

  const direct = tryParse(cleaned);
  if (direct) {
    return direct;
  }

  const extracted = extractFirstObject(cleaned);
  if (extracted) {
    const fromExtract = tryParse(extracted);
    if (fromExtract) {
      return fromExtract;
    }
  }

  // Fallback: the model ignored the format — show the fence-stripped text as-is.
  return { translation: cleaned || text, synonyms: null };
}
