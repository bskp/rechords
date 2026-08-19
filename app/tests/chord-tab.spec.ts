import { test, expect } from "@playwright/test";
import { METEOR_URL, login, E2E_TIMEOUT } from "./constants";

// Walks the chords of a song in the editor with the keyboard and checks that
// merely passing through them does not rewrite the source.
const tabThrough = async (page, path: string, steps: number) => {
  await page.goto(`${METEOR_URL}${path}`, { waitUntil: "networkidle" });
  const textarea = page.locator("textarea").first();
  await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });
  const before = await textarea.inputValue();

  await page.locator("#chordsheetContent .before").first().click();
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
  }
  // Move focus off the last chord so its blur commits too.
  await page.locator("#chordsheetContent h1").first().click();
  await page.waitForTimeout(200);

  return { before, after: await textarea.inputValue() };
};

test.describe("Tabbing through chords in the editor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("leaves a plain song untouched", async ({ page }) => {
    const { before, after } = await tabThrough(
      page,
      "/edit/emil-luckhard/die-internationale",
      6,
    );
    expect(after).toEqual(before);
  });

  test("leaves chord-only lines and stacked chords untouched", async ({
    page,
  }) => {
    // "Los" has chord-only lines ([C] [dm7] …), chords with no letter between
    // them ([C][Dm7]) and chords sitting after the last letter of a line.
    const { before, after } = await tabThrough(
      page,
      "/edit/patent-ochsner/los",
      20,
    );
    expect(after).toEqual(before);
  });
});

test.describe("Editing a chord in the editor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${METEOR_URL}/edit/patent-ochsner/los`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  // Renames the nth chord that reads `text` and returns the source before and after.
  const rename = async (page, text: string, nth: number, renamed: string) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    const chord = page
      .locator("#chordsheetContent .before")
      .filter({ hasText: new RegExp(`^${text}$`) })
      .nth(nth);
    await chord.fill(renamed);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    return { before, after: await textarea.inputValue() };
  };

  test("renames a chord on a line that has no lyrics", async ({ page }) => {
    const { before, after } = await rename(page, "dm7", 0, "Dm7");
    expect(after).toEqual(before.replace("[C] [dm7]", "[C] [Dm7]"));
  });

  test("renames one of two chords sitting on the same syllable", async ({
    page,
  }) => {
    const { before, after } = await rename(page, "Dm7", 1, "D7");
    expect(after).toEqual(before.replace("[C][Dm7]", "[C][D7]"));
  });

  test("renames a chord behind the last letter of a line", async ({ page }) => {
    const { before, after } = await rename(page, "Fsus4add9", 0, "Fadd9");
    expect(after).toEqual(before.replace("[Fsus4add9]", "[Fadd9]"));
  });
});

test.describe("Nudging a chord with shift and an arrow key", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${METEOR_URL}/edit/patent-ochsner/los`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  // Marks the first chord of a line that either has lyrics or has none at all,
  // so that Playwright can address it without knowing the song by heart.
  const focusChordInLine = async (page, withLyrics: boolean) => {
    const found = await page.evaluate((wantsLyrics) => {
      const lyricsOf = (i: Element) =>
        Array.from(i.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent)
          .join("")
          .trim();

      const line = Array.from(
        document.querySelectorAll("#chordsheetContent .line"),
      ).find((l) => {
        const hasLyrics = Array.from(l.querySelectorAll("i")).some(
          (i) => lyricsOf(i).length > 0,
        );
        return hasLyrics === wantsLyrics && l.querySelector(".before") !== null;
      });

      line?.querySelector(".before")?.setAttribute("data-target", "");
      return line !== undefined;
    }, withLyrics);

    expect(found).toBe(true);
    await page.locator("[data-target]").click();
  };

  test("leaves a line made of chords alone untouched", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    await focusChordInLine(page, false);
    await page.keyboard.press("Shift+ArrowLeft");
    await page.waitForTimeout(150);
    expect(await textarea.inputValue()).toEqual(before);

    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(150);
    expect(await textarea.inputValue()).toEqual(before);
  });

  test("keeps the chord focused, so it can be nudged again", async ({
    page,
  }) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    await focusChordInLine(page, true);
    await page.keyboard.press("Shift+ArrowLeft");
    await page.waitForTimeout(150);
    const once = await textarea.inputValue();

    expect(
      await page.evaluate(() =>
        document.activeElement?.classList.contains("before"),
      ),
    ).toBe(true);

    // A second nudge without clicking again has to take effect as well.
    await page.keyboard.press("Shift+ArrowLeft");
    await page.waitForTimeout(150);
    const twice = await textarea.inputValue();

    expect(once).not.toEqual(before);
    expect(twice).not.toEqual(once);
  });

  const chordCount = (md: string) => md.match(/\[[^\]]*]/g)?.length ?? 0;

  // Clicking a syllable inserts a chord and leaves it focused, ready to be
  // typed into. Nothing but the chord itself may reach the source.
  const insertFreshChord = async (page) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    await page
      .locator("#chordsheetContent .line i:not(.hasChord)")
      .filter({ hasText: /\w/ })
      .first()
      .click();
    await page.waitForTimeout(150);

    const inserted = await textarea.inputValue();
    expect(inserted).not.toContain("|");
    expect(chordCount(inserted)).toEqual(chordCount(before) + 1);

    return before;
  };

  test("types into a fresh chord after nudging it", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    const before = await insertFreshChord(page);

    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(150);
    await page.keyboard.type("Bb");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    const after = await textarea.inputValue();
    expect(after).not.toContain("|");
    expect(after).toContain("[Bb]");
    expect(chordCount(after)).toEqual(chordCount(before) + 1);
  });

  test("drops a nudged chord that was never given a name", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    const before = await insertFreshChord(page);

    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(150);
    await page.locator("#chordsheetContent h1").first().click();
    await page.waitForTimeout(200);

    expect(await textarea.inputValue()).toEqual(before);
  });

  test("makes room at the head of a line and takes it back", async ({
    page,
  }) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    await focusChordInLine(page, true);
    await page.keyboard.press("Shift+ArrowLeft");
    await page.waitForTimeout(150);
    const padded = await textarea.inputValue();

    // Exactly one space more, and not a single chord has moved.
    expect(padded.length).toEqual(before.length + 1);
    expect(padded.replace(/ /g, "")).toEqual(before.replace(/ /g, ""));
    expect(padded.match(/\[[^\]]*]/g)).toEqual(before.match(/\[[^\]]*]/g));

    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(150);
    expect(await textarea.inputValue()).toEqual(before);
  });
});

test.describe("Sounding a chord while editing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // abcjs builds an AudioContext the first time it plays something, so the
    // count of them says whether a chord was sounded — without depending on a
    // soundfont being reachable.
    await page.addInitScript(() => {
      (window as any).__audioContexts = 0;
      const Original = window.AudioContext;
      (window as any).AudioContext = class extends Original {
        constructor(...args: unknown[]) {
          // @ts-expect-error passing through whatever abcjs hands in
          super(...args);
          (window as any).__audioContexts++;
        }
      };
    });
    await page.goto(`${METEOR_URL}/edit/patent-ochsner/los`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  const contexts = (page) =>
    page.evaluate(() => (window as any).__audioContexts as number);

  test("stays silent when a chord is clicked for editing", async ({ page }) => {
    await page.locator("#chordsheetContent .before").first().click();
    await page.waitForTimeout(300);
    expect(await contexts(page)).toEqual(0);

    // Tabbing on to the next chord must not sound either.
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    expect(await contexts(page)).toEqual(0);
  });

  test("sounds on right-click, without saving the song", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    const before = await textarea.inputValue();

    await page
      .locator("#chordsheetContent .before")
      .first()
      .click({ button: "right" });
    await page.waitForTimeout(300);

    expect(await contexts(page)).toBeGreaterThan(0);
    // Right-clicking the editor saves and leaves; a chord must not.
    expect(page.url()).toContain("/edit/");
    expect(await textarea.inputValue()).toEqual(before);
  });
});
