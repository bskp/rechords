import { useEffect } from "react";

/**
 * Warns before the current document is unloaded (reload, tab close, external
 * link) while there are unsaved changes.
 *
 * The wording of the dialog is dictated by the browser and cannot be
 * customised, hence there is no message prop.
 *
 * In-app navigation is not blocked: react-router's `useBlocker` only works
 * inside a data router (`createBrowserRouter`), while this app renders a plain
 * `<BrowserRouter>`. The editor does not link anywhere itself, so the remaining
 * gap is the browser's back button.
 */
export const UnsavedChangesPrompt = ({ when }: { when: boolean }) => {
  useEffect(() => {
    if (!when) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers only honour returnValue.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);

  return null;
};

export default UnsavedChangesPrompt;
