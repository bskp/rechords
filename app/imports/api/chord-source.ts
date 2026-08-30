/**
 * Editing chords in the markdown source of a song.
 *
 * Everything here addresses the source by exact character offsets and splices
 * it, so anything that is not the chord in question stays byte for byte the
 * same. Callers name a position the way the rendered sheet can report it:
 *
 *   - an existing chord by its ordinal within its verse, and
 *   - a place to put a new one by the number of lyric characters before it.
 *
 * Only non-whitespace lyric characters are counted. The renderer rewrites
 * whitespace — a chord at the end of a line is given a blank stem, a leading
 * space becomes a five-space indent — while every non-whitespace character
 * survives rendering one to one, prosodic annotations included ("_" becomes a
 * single "‿").
 */
import { verseRegex } from "./showdown-rechords";

export interface Span {
  start: number;
  end: number;
}

/** Where to put a chord: at, or just behind, the nth lyric character. */
export interface Anchor {
  lyric: number;
  behind?: boolean;
  /**
   * How many chords of the verse the new one has to end up behind. Lyrics
   * settle this on their own, but a line made of chords alone has no character
   * to anchor to, and there the order of the chords is all there is.
   */
  afterChord?: number;
}

/** The bodies of all verses, in source order. */
export function verseBodies(md: string): Span[] {
  return Array.from(md.matchAll(verseRegex), (match) => {
    const start = match.index + match[0].length - match[2].length;
    return { start, end: start + match[2].length };
  });
}

/** The chords of one verse, in source order, brackets included. */
export function chordSpans(md: string, verse: number): Span[] {
  const body = verseBodies(md)[verse];
  if (body === undefined) return [];

  return Array.from(
    md.slice(body.start, body.end).matchAll(/\[[^\]]*]/g),
    (match) => ({
      start: body.start + match.index,
      end: body.start + match.index + match[0].length,
    }),
  );
}

/** The text of the nth chord of a verse, without its brackets. */
export function chordText(
  md: string,
  verse: number,
  chord: number,
): string | undefined {
  const span = chordSpans(md, verse)[chord];
  return span && md.slice(span.start + 1, span.end - 1);
}

/** Renames the nth chord of a verse, leaving its position untouched. */
export function setChordText(
  md: string,
  verse: number,
  chord: number,
  text: string,
): string {
  const span = chordSpans(md, verse)[chord];
  if (span === undefined) return md;
  return md.slice(0, span.start) + "[" + text + "]" + md.slice(span.end);
}

/** Drops the nth chord of a verse, leaving the lyrics untouched. */
export function deleteChord(md: string, verse: number, chord: number): string {
  const span = chordSpans(md, verse)[chord];
  if (span === undefined) return md;
  return md.slice(0, span.start) + md.slice(span.end);
}

/** Inserts a chord at the given anchor. */
export function insertChord(
  md: string,
  verse: number,
  anchor: Anchor,
  text: string,
): string {
  const at = anchorIndex(md, verse, anchor);
  if (at === undefined) return md;
  return md.slice(0, at) + "[" + text + "]" + md.slice(at);
}

/** Which place in the verse's order a chord inserted at this anchor takes. */
export function chordIndexForAnchor(
  md: string,
  verse: number,
  anchor: Anchor,
): number {
  const at = anchorIndex(md, verse, anchor);
  if (at === undefined) return 0;
  return chordSpans(md, verse).filter((span) => span.start < at).length;
}

/** How many lyric characters precede the nth chord of a verse. */
export function chordLyricIndex(
  md: string,
  verse: number,
  chord: number,
): number | undefined {
  const span = chordSpans(md, verse)[chord];
  if (span === undefined) return undefined;

  let lyric = 0;
  forEachLyricChar(md, verse, (index) => {
    if (index < span.start) lyric++;
  });
  return lyric;
}

/**
 * Nudges a chord by whole lyric characters, to the right for a positive delta.
 *
 * A chord only ever moves within the lyrics of its own line, and never past a
 * neighbouring chord. A line made of chords alone therefore has no room at all
 * and stays as it is.
 *
 * The one exception is the head of a line, where there is nothing to the left to
 * move onto: there the lyrics make room instead, by a space that the renderer
 * turns into an indent. Going right takes that space back again.
 */
export function moveChord(
  md: string,
  verse: number,
  chord: number,
  delta: number,
): string {
  const chords = chordSpans(md, verse);
  const span = chords[chord];
  const line = lineAround(md, verse, span?.start);
  if (span === undefined || line === undefined || delta === 0) return md;

  const lyrics = lyricIndices(md, line);
  if (lyrics.length === 0) return md; // a line of chords alone

  if (lyrics[0] > span.start) {
    // At the head of the line, where no letter precedes the chord.
    if (delta < 0) return splice(md, span.end, span.end, " ");
    if (md[span.end] === " ") return splice(md, span.end, span.end + 1);
  }

  const previous = chords[chord - 1];
  const next = chords[chord + 1];
  const room = lyrics.filter(
    (index) =>
      // Sitting right next to a neighbour is fine, passing it is not.
      (previous === undefined || index >= previous.end) &&
      (next === undefined || index < next.start),
  );

  const passed = room.filter((index) => index < span.start).length;
  const target = passed + delta;
  if (target < 0 || target > room.length || room.length === 0) return md;

  // Landing behind the last character it may reach is a position of its own.
  const at = target === room.length ? room[room.length - 1] + 1 : room[target];

  const text = md.slice(span.start + 1, span.end - 1);
  const shift = at > span.start ? span.end - span.start : 0;
  return splice(
    splice(md, span.start, span.end),
    at - shift,
    at - shift,
    `[${text}]`,
  );
}

/** How many lyric characters a verse has. */
export function lyricCount(md: string, verse: number): number {
  let count = 0;
  forEachLyricChar(md, verse, () => count++);
  return count;
}

/** The line of a verse that contains the given source index. */
function lineAround(
  md: string,
  verse: number,
  at: number | undefined,
): Span | undefined {
  const body = verseBodies(md)[verse];
  if (body === undefined || at === undefined) return undefined;

  const previousBreak = md.lastIndexOf("\n", at);
  const nextBreak = md.indexOf("\n", at);
  return {
    start: Math.max(body.start, previousBreak + 1),
    end: nextBreak === -1 ? body.end : Math.min(body.end, nextBreak),
  };
}

/** Source indices of the lyric characters within a span. */
function lyricIndices(md: string, span: Span): number[] {
  const indices: number[] = [];
  for (let i = span.start; i < span.end; i++) {
    if (md[i] === "[") {
      const close = md.indexOf("]", i);
      if (close !== -1 && close < span.end) {
        i = close;
        continue;
      }
    }
    if (!/\s/.test(md[i])) indices.push(i);
  }
  return indices;
}

function splice(md: string, start: number, end: number, insert = ""): string {
  return md.slice(0, start) + insert + md.slice(end);
}

/** Calls back with the source index of every lyric character of a verse. */
function forEachLyricChar(
  md: string,
  verse: number,
  visit: (index: number, lyric: number) => void,
): void {
  const body = verseBodies(md)[verse];
  if (body === undefined) return;

  let lyric = 0;
  for (let i = body.start; i < body.end; i++) {
    if (md[i] === "[") {
      const close = md.indexOf("]", i);
      if (close !== -1 && close < body.end) {
        i = close; // skip the chord, it is not part of the lyrics
        continue;
      }
    }
    if (/\s/.test(md[i])) continue;
    visit(i, lyric++);
  }
}

function anchorIndex(
  md: string,
  verse: number,
  anchor: Anchor,
): number | undefined {
  const body = verseBodies(md)[verse];
  if (body === undefined) return undefined;

  let at: number | undefined;
  let behindLast = body.start;
  forEachLyricChar(md, verse, (index, lyric) => {
    behindLast = index + 1;
    if (at !== undefined || lyric !== anchor.lyric) return;
    at = anchor.behind ? index + 1 : index;
  });

  // Past the last lyric character a chord still belongs to that character, not
  // beyond the trailing newlines of the verse.
  at = at ?? behindLast;

  // Never slip in front of a chord the new one is supposed to follow.
  const predecessor = chordSpans(md, verse)[(anchor.afterChord ?? 0) - 1];
  return predecessor === undefined ? at : Math.max(at, predecessor.end);
}
