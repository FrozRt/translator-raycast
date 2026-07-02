/**
 * Read the text to act on: prefer the current selection (so the user can just
 * highlight text and hit the hotkey), falling back to the clipboard when nothing
 * is selected. Reports which source was used so the caller can decide whether to
 * write the result back to the clipboard.
 */

import { Clipboard, getSelectedText } from "@raycast/api";

export type InputSource = "selection" | "clipboard";

export interface Input {
  text: string;
  source: InputSource;
}

export async function readInput(): Promise<Input> {
  try {
    const selected = (await getSelectedText()).trim();
    if (selected !== "") {
      return { text: selected, source: "selection" };
    }
  } catch {
    // No selection / the app doesn't expose one — fall through to the clipboard.
  }
  const clip = (await Clipboard.readText())?.trim() ?? "";
  return { text: clip, source: "clipboard" };
}
