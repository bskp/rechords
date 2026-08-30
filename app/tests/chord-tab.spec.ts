import { test, expect } from "@playwright/test";
import { METEOR_URL, login, E2E_TIMEOUT } from "./constants";

// A song carrying the shapes that chord editing used to get wrong: a line of
// chords alone, chords with no letter between them, a chord behind the last
// letter of a line, and a space between a chord and the word it belongs to.
//
// It is typed into a fresh editor and never saved, so these tests bring their
// own material instead of relying on a song being in the database.
const FIXTURE = `Akkordformen
Fixture
========

Intro:
[C] [dm7] [Cmaj7/E] [F]

1:
[C]eins, [Dm7]zwei drei
[Fsus4] vier fuenf sechs [G]sieben acht
[C][Dm7]ne u[Cmaj7/E]n u a u zehn el[Fsus4add9]
ab[C]cd[Dm7]ef

2:
[F][G7]a bcde fghi[Gsus4]
[C] [dm7] [F]
`;

const openFixture = async (page) => {
  await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });
  const textarea = page.locator("textarea").first();
  await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

  await textarea.fill(FIXTURE);
  await expect(page.locator("#chordsheetContent .before").first()).toBeVisible({
    timeout: E2E_TIMEOUT,
  });

  return textarea;
};

const chordCount = (md: string) => md.match(/\[[^\]]*]/g)?.length ?? 0;

// Walks the chords with the keyboard and reports what that did to the source.
const tabThrough = async (page, textarea, steps: number) => {
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

  test("leaves a stored song untouched", async ({ page }) => {
    await page.goto(`${METEOR_URL}/edit/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

    const { before, after } = await tabThrough(page, textarea, 6);
    expect(after).toEqual(before);
  });

  test("leaves chord-only lines and stacked chords untouched", async ({
    page,
  }) => {
    const textarea = await openFixture(page);
    const { before, after } = await tabThrough(page, textarea, 20);
    expect(after).toEqual(before);
  });
});

test.describe("Editing a chord in the editor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Renames the nth chord that reads `text` and reports before and after.
  const rename = async (page, text: string, nth: number, renamed: string) => {
    const textarea = await openFixture(page);
    const before = await textarea.inputValue();

    await page
      .locator("#chordsheetContent .before")
      .filter({ hasText: new RegExp(`^${text}$`) })
      .nth(nth)
      .fill(renamed);
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
  });

  // Focuses the first chord of a line that either carries lyrics or does not,
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
    const textarea = await openFixture(page);
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
    const textarea = await openFixture(page);
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

  test("makes room at the head of a line and takes it back", async ({
    page,
  }) => {
    const textarea = await openFixture(page);
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

  // Clicking a syllable inserts a chord and leaves it focused, ready to be
  // typed into. Nothing but the chord itself may reach the source.
  const insertFreshChord = async (page, textarea) => {
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
    const textarea = await openFixture(page);
    const before = await insertFreshChord(page, textarea);

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
    const textarea = await openFixture(page);
    const before = await insertFreshChord(page, textarea);

    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(150);
    await page.locator("#chordsheetContent h1").first().click();
    await page.waitForTimeout(200);

    expect(await textarea.inputValue()).toEqual(before);
  });
});

test.describe("Sounding a chord while editing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // abcjs builds an AudioContext the first time it plays something, so the
    // number of them tells whether a chord was sounded — without depending on
    // the soundfont being reachable.
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
  });

  const contexts = (page) =>
    page.evaluate(() => (window as any).__audioContexts as number);

  test("stays silent when a chord is clicked for editing", async ({ page }) => {
    await openFixture(page);

    await page.locator("#chordsheetContent .before").first().click();
    await page.waitForTimeout(300);
    expect(await contexts(page)).toEqual(0);

    // Tabbing on to the next chord must not sound either.
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    expect(await contexts(page)).toEqual(0);
  });

  test("sounds on right-click, without saving the song", async ({ page }) => {
    const textarea = await openFixture(page);
    const before = await textarea.inputValue();

    await page
      .locator("#chordsheetContent .before")
      .first()
      .click({ button: "right" });
    await page.waitForTimeout(300);

    expect(await contexts(page)).toBeGreaterThan(0);
    // Right-clicking the editor saves and leaves; a chord must not.
    expect(page.url()).toContain("/new");
    expect(await textarea.inputValue()).toEqual(before);
  });
});
