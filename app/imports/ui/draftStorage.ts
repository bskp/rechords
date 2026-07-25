/**
 * Unsaved editor content, mirrored into localStorage so it survives a reload,
 * a closed tab or the browser's back button.
 *
 * `UnsavedChangesPrompt` warns before an unload, but it cannot cover in-app
 * navigation (see the note there). The draft written here is the safety net for
 * the cases the warning misses: whatever was typed is restored the next time
 * the same song is opened for editing.
 *
 * Songs that have never been saved have no `_id`, so they all share the "new"
 * slot — which matches the single `/new` route.
 */

const PREFIX = "rechords.draft.";

const draftKey = (songId?: string) => PREFIX + (songId ?? "new");

/**
 * localStorage is unavailable in some privacy modes and throws once the quota
 * is exhausted. A lost draft is not worth breaking the editor over, so every
 * access degrades to a no-op.
 */
export function readDraft(songId?: string): string | undefined {
  try {
    return window.localStorage.getItem(draftKey(songId)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeDraft(songId: string | undefined, text: string): void {
  try {
    window.localStorage.setItem(draftKey(songId), text);
  } catch {
    /* see above */
  }
}

export function clearDraft(songId?: string): void {
  try {
    window.localStorage.removeItem(draftKey(songId));
  } catch {
    /* see above */
  }
}
