/**
 * Read the text to act on: prefer the current selection (so the user can just
 * highlight text and hit the hotkey), falling back to the clipboard when nothing
 * is selected. Shared by the Translate command.
 */

import { Clipboard, getSelectedText } from "@raycast/api";

export async function readInputText(): Promise<string> {
  try {
    const selected = (await getSelectedText()).trim();
    if (selected !== "") {
      return selected;
    }
  } catch {
    // No selection / the app doesn't expose one — fall through to the clipboard.
  }
  return (await Clipboard.readText())?.trim() ?? "";
}
