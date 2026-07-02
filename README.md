# Russian ⇄ English Translator — for Raycast

Translate between **Russian and English** without leaving your keyboard. The direction is
**detected automatically** — Cyrillic in → English out, Latin in → Russian out. There's no
target language to pick.

Select text in any app and press the hotkey: the translation is flashed in a **HUD** — no
window, nothing to dismiss. For a **single word** the result also carries a few **English
synonyms in brackets**, e.g. `берег (bank, shore, riverside)`. For a **sentence or longer text**,
just the translation.

Runs on **Google Gemini** (free tier — the key is free, see below).

## Features

- **Auto-direction.** The model picks the direction from the dominant script of the input
  (Cyrillic → English, Latin → Russian). Works for a word, a phrase, or a paragraph.
- **Selection-first, windowless.** Reads the highlighted text in the frontmost app; only if
  nothing is selected does it fall back to the clipboard. The result appears in a HUD.
- **Clipboard rule.** When the input came from a **selection**, the clipboard is left untouched.
  When it came from the **clipboard** (nothing selected), the clipboard is overwritten with the
  translation — so you can paste it straight away.
- **English synonyms for single words.** A single word gets a few English synonyms in brackets;
  sentences and longer text get the translation only.
- **Term protection.** Proper nouns, brands, code, identifiers, URLs, and CLI commands (`push`,
  `merge`, `main`, `CI`, …) are **kept verbatim**.

## Requirements

- **Raycast** (macOS; the extension also declares Windows support).
- **Node.js ≥ 22.22.2** for building (`@raycast/api` 1.104 asks for it in `engines`).
- **A free Gemini API key** — see below.

## Free Gemini key

Gemini has a free tier, but the API is **key-based** — there is no anonymous access. The key is
free: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) → **Create API
key** (a Google account is required). Copy the generated key (it may start with `AIza…` or
`AQ.…`). The key is stored in Raycast's secure preference storage — no `.env`, no hardcoding.

If the key is empty or invalid, the command shows a clear message with **Get a Free Key (AI
Studio)** and **Open Extension Preferences** actions.

## Preferences

| Setting | Type | Default | Purpose |
|---|---|---|---|
| **Gemini API Key** | password | — | Free key — [aistudio.google.com](https://aistudio.google.com/app/apikey). |
| **Gemini Model** | text | `gemini-2.5-flash` | Gemini model ID. |

### Free-tier Gemini models

The **Gemini Model** preference is just a string ID, so you can switch models without touching
code:

| Model ID | Notes |
|---|---|
| `gemini-2.5-flash` | **Default.** Best quality on the free tier; fast enough for everyday use. |
| `gemini-2.5-flash-lite` | **Fastest.** Smaller and quicker — great for quick translations. |
| `gemini-2.0-flash` | Previous-generation flash. Still fast and free. |
| `gemini-2.0-flash-lite` | The leanest 2.0 option. |

The extension disables the model's internal "thinking" step (`thinkingBudget: 0`) since
translation is a direct task — this roughly halves latency with no quality loss. Free-tier
quotas and the model line-up change over time — see
[ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models).

## Install (local dev)

```bash
npm install
npm run dev
```

`npm run dev` builds the extension and registers the **Translate** command in your running
Raycast (with hot reload). Assign a global hotkey: Raycast → Extensions → **Translate** →
*Record Hotkey*. Then select text anywhere and press it.

## Publishing to the Raycast Store

The extension meets the [Store requirements](https://developers.raycast.com/basics/prepare-an-extension-for-store):
Title Case name, single-sentence description, `MIT` license, a category, `platforms`, a 512×512
icon, this README, and a `CHANGELOG.md`.

```bash
npm run build      # validates the extension for distribution
npm run lint       # ESLint + Prettier + manifest validation
npm run publish    # opens a PR against raycast/extensions
```

> The **`author`** field in `package.json` is set to `mikhail_chigrin`. If you publish under a
> different Raycast account, update it (Raycast → Settings → Account). You may also add up to six
> 2000×1250 screenshots under a top-level `metadata/` folder.

## Testing the logic without the UI (eval harness)

The translation logic (the main risk) is validated **headless**, bypassing the Raycast window —
the core `translate()` is called directly, with the key from an env var:

```bash
GEMINI_API_KEY=... npm run eval             # all cases
GEMINI_API_KEY=... npm run eval -- --case 1 # a specific case
GEMINI_API_KEY=... npm run eval -- --model gemini-2.5-flash-lite
npm run eval -- --list                      # list the cases
npm run eval -- --case 6                    # "empty key" — works without a key
```

Several cases are auto-checked (single word gets a block / sentence gets none / direction flips /
terms kept / auth error); the rest are printed for eyeballing. Env key: `GEMINI_API_KEY`.

## Architecture

```
src/
  translate.tsx        # no-view command entry — calls the runner
  run-translate.ts     # the Raycast glue: read selection/clipboard → translate → HUD (+ clipboard)
  prompt.ts            # system prompt: RU⇄EN auto-flip, term protection, single-word synonyms
  providers/
    index.ts           # translate() entry point + default model
    types.ts           # TranslateOptions / TranslateResult
    gemini.ts          # Gemini generateContent (JSON response, key in header)
  lib/
    input.ts           # read selected text (or clipboard); reports which source was used
    http.ts            # postJson: timeout (AbortController) + status mapping
    parse.ts           # defensive JSON parsing with a fallback
    errors.ts          # TranslateError discriminated by kind
scripts/
  eval.ts              # headless test-case runner
```

The **core (`prompt`/`providers`/`lib`) does not depend on `@raycast/api`** — the provider
receives `apiKey`/`model` as explicit arguments (DI), so the same `translate()` runs in both the
command and the eval harness. The translation and the single-word synonyms come back in **one
request** as `{ translation, synonyms: string[] | null }`; parsing is resilient to model
misbehavior (strips ``` fences, extracts the first JSON object, falls back to raw text).

## Credits

This extension is derived from the **Polyglot** RU⇄EN translator by Makar Mishchenko, used under
its MIT license, with a reworked, windowless UI (selection/clipboard input, HUD output) and
behavior (English synonyms for single words instead of a full dictionary block).

## License

[MIT](LICENSE). Copyright © 2026 Makar Mishchenko and Mikhail Chigrin.
