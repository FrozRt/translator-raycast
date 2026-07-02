# Russian ⇄ English Translator Changelog

## [Initial Version] - {PR_MERGE_DATE}

- Translate between Russian and English with a single hotkey. The direction is detected automatically: Cyrillic input → English, Latin input → Russian.
- Windowless: reads the **selected text** in any app (falling back to the clipboard when nothing is selected) and shows the translation in a HUD — no window to dismiss.
- Clipboard rule: a **selection** leaves the clipboard untouched; input taken from the **clipboard** is overwritten with the translation so you can paste it right away.
- **Single words** also get a few **English synonyms in brackets** (e.g. `берег (bank, shore, riverside)`). Sentences and longer text get the translation only.
- Technical terms and identifiers (code, URLs, CLI commands, product names) are kept verbatim.
- Powered by Google Gemini via a free API key; the model's "thinking" step is disabled for lower latency.
