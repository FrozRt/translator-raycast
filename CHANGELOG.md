# Russian ⇄ English Translator Changelog

## [Initial Version] - {PR_MERGE_DATE}

- Translate between Russian and English with a single hotkey. The direction is detected automatically: Cyrillic input → English, Latin input → Russian.
- Reads the **selected text** in any app (falling back to the clipboard when nothing is selected) and shows the translation in a small window.
- **Single words** get a compact details block (in Russian): meanings, part of speech, pronunciation, examples, synonyms/antonyms. Full sentences and longer text get the translation only — no noise.
- Technical terms and identifiers (code, URLs, CLI commands, product names) are kept verbatim.
- Copy the translation (or translation + details) straight from the result window.
- Powered by Google Gemini via a free API key; the model's "thinking" step is disabled for lower latency.
