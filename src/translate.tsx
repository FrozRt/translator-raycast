import {
  Action,
  ActionPanel,
  Detail,
  Icon,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useState } from "react";
import { DEFAULT_MODEL, translate } from "./providers";
import type { TranslateOptions, TranslateResult } from "./providers/types";
import {
  TranslateError,
  type TranslateErrorKind,
  asTranslateError,
} from "./lib/errors";
import { readInputText } from "./lib/input";

const API_KEY_URL = "https://aistudio.google.com/app/apikey";

/** Resolve preferences (manifest -> raycast-env.d.ts) into core options. */
function resolveOptions(): TranslateOptions {
  const prefs = getPreferenceValues<Preferences>();
  return {
    apiKey: (prefs.apiKey ?? "").trim(),
    model: (prefs.model ?? "").trim() || DEFAULT_MODEL,
  };
}

/**
 * Defang markdown images in model-derived text before rendering. Detail loads
 * `![](url)` images automatically, which would beacon out to a URL the model
 * (i.e. arbitrary input) can choose. Escaping `![` turns it into a plain,
 * click-only link instead of an auto-loaded image.
 */
function defangImages(markdown: string): string {
  return markdown.replace(/!\[/g, "\\![");
}

type ViewState =
  | { status: "loading" }
  | { status: "ok"; result: TranslateResult }
  | { status: "error"; error: TranslateError };

/** Translation on top; for single words, the details block below a divider. */
function composeResult(result: TranslateResult): string {
  return result.explanation
    ? `${result.translation}\n\n---\n\n${result.explanation}`
    : result.translation;
}

function errorTitle(error: TranslateError): string {
  switch (error.kind) {
    case "empty":
      return "Nothing to translate";
    case "auth":
      return "Gemini API key required";
    case "rateLimit":
      return "Rate limit";
    case "timeout":
      return "Timed out";
    case "network":
      return "No connection";
    case "parse":
      return "Empty model response";
    case "api":
      return "API error";
  }
}

const ERROR_HINTS: Record<TranslateErrorKind, string> = {
  empty:
    "Select some text (or copy it to the clipboard), then run the command again.",
  auth: `A Gemini API key is required — it's **free**: get one at [aistudio.google.com](${API_KEY_URL}) (Get API key) and paste it into the extension preferences.`,
  rateLimit: "Too many requests. Wait a few seconds and try again.",
  timeout:
    "Gemini did not respond within 30 seconds. Check your connection or try again.",
  network: "Could not reach Gemini. Check your internet connection.",
  parse: "Gemini returned an empty or unreadable response. Try again.",
  api: "Gemini returned an error. Details below.",
};

function errorMarkdown(error: TranslateError): string {
  const lines = [`# ⚠️ ${errorTitle(error)}`, "", ERROR_HINTS[error.kind]];
  // Only the generic "api" kind carries extra info beyond the hint (the HTTP status).
  if (error.kind === "api") {
    lines.push("", "```", error.message, "```");
  }
  return lines.join("\n");
}

/**
 * The command: read the selected text (or clipboard), translate, and show the
 * result in a Detail window. Direction is auto-detected (Cyrillic → English,
 * Latin → Russian); a single word also gets a details block. Copy the result,
 * or press Esc to dismiss.
 */
export default function Command() {
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const input = await readInputText();
        if (cancelled) {
          return;
        }
        if (input === "") {
          throw new TranslateError(
            "empty",
            "No selected text and nothing on the clipboard to translate.",
          );
        }
        const result = await translate(input, {
          ...resolveOptions(),
          signal: controller.signal,
        });
        if (!cancelled) {
          setState({ status: "ok", result });
        }
      } catch (raw) {
        if (cancelled) {
          return;
        }
        const error = asTranslateError(raw);
        setState({ status: "error", error });
        void showFailureToast(error, { title: errorTitle(error) });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <Detail isLoading navigationTitle="Translate" markdown="_Translating…_" />
    );
  }

  if (state.status === "error") {
    const { error } = state;
    return (
      <Detail
        navigationTitle="Translate — error"
        markdown={errorMarkdown(error)}
        actions={
          <ActionPanel>
            <Action
              title="Open Extension Preferences"
              icon={Icon.Gear}
              onAction={openExtensionPreferences}
            />
            {error.kind === "auth" && (
              <Action.OpenInBrowser
                title="Get a Free Key (AI Studio)"
                url={API_KEY_URL}
                icon={Icon.Key}
              />
            )}
            <Action.CopyToClipboard
              title="Copy Error Text"
              content={error.message}
            />
          </ActionPanel>
        }
      />
    );
  }

  const { result } = state;
  const composed = composeResult(result);
  return (
    <Detail
      navigationTitle="Translate"
      markdown={defangImages(composed)}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Translation"
            content={result.translation}
          />
          {result.explanation && (
            <Action.CopyToClipboard
              title="Copy Translation and Details"
              content={composed}
            />
          )}
          <Action
            title="Open Extension Preferences"
            icon={Icon.Gear}
            onAction={openExtensionPreferences}
          />
        </ActionPanel>
      }
    />
  );
}
