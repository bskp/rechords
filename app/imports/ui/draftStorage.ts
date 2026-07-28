/**
 * Unsaved editor content, mirrored into localStorage so it survives a reload,
 * a closed tab or the browser's back button.
 *
 * `UnsavedChangesPrompt` warns before an unload, but it cannot cover in-app
 * navigation (see the note there). The draft written here is the safety net for
 * the cases the warning misses: whatever was typed is restored the next time
 * the same song is opened for editing, and listed alongside the server
 * revisions in `RevBrowser`.
 *
 * Songs that have never been saved have no `_id`, so they all share the "new"
 * slot — which matches the single `/new` route.
 */

const PREFIX = "rechords.draft.";

const draftKey = (songId?: string) => PREFIX + (songId ?? "new");

export interface Draft {
  text: string;
  /**
   * When the draft was last written. Absent only for drafts stored before
   * drafts carried a timestamp.
   */
  savedAt?: Date;
}

/**
 * Drafts used to be stored as the bare markdown. Those parse as JSON only by
 * accident, so anything unexpected is taken at face value rather than thrown
 * away — losing someone's unsaved song to a format change would be the worst
 * possible outcome here.
 */
function parseDraft(raw: string): Draft {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "text" in parsed &&
      typeof (parsed as { text: unknown }).text === "string"
    ) {
      const { text, savedAt } = parsed as { text: string; savedAt?: string };
      const parsedDate = savedAt ? new Date(savedAt) : undefined;
      return {
        text,
        savedAt:
          parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined,
      };
    }
  } catch {
    /* not JSON — fall through */
  }
  return { text: raw };
}

/**
 * localStorage is unavailable in some privacy modes and throws once the quota
 * is exhausted. A lost draft is not worth breaking the editor over, so every
 * access degrades to a no-op.
 */
export function readDraft(songId?: string): Draft | undefined {
  try {
    const raw = window.localStorage.getItem(draftKey(songId));
    return raw === null ? undefined : parseDraft(raw);
  } catch {
    return undefined;
  }
}

/** Returns the timestamp it stamped, so callers can display it. */
export function writeDraft(
  songId: string | undefined,
  text: string,
): Date | undefined {
  const savedAt = new Date();
  try {
    window.localStorage.setItem(
      draftKey(songId),
      JSON.stringify({ text, savedAt: savedAt.toISOString() }),
    );
    return savedAt;
  } catch {
    return undefined;
  }
}

export function clearDraft(songId?: string): void {
  try {
    window.localStorage.removeItem(draftKey(songId));
  } catch {
    /* see above */
  }
}
