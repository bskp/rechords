import { ChordPdfJs, Margins } from "/imports/api/comfyPdfJs";
import { IPdfViewerSettings } from "../PdfSettings";
import {
  guessKeyFromChordCounts,
  notationPreferenceFor,
} from "/imports/api/libchr0d/helpers";
import { Song } from "/imports/api/collections";
import Chord from "/imports/api/libchr0d/chord";
import { parseChords } from "../../Viewer";
import { countChords } from "../../Transposer";
import { AllBlocks, Line, parseToIntermediateFormat } from "./jsonHoeli";

const ORANGE = "rgb(221, 68, 7)";

/**
 *
 * @param vdom Dom Tree in format of showdown-rechord output
 * @param settings How to render
 * @param debug Print Debuglines for Columns?
 * @returns URL of the generated Blob
 */
export async function jsPdfGenerator(
  song: Song,
  settings: IPdfViewerSettings,
  debug = false
): Promise<string> {
  if (!song) return "";

  const fos = settings.fontSizes;
  const las = settings.layoutSettings;
  const fas = settings.factors;

  // starting point would be: intermediate format
  const out = parseToIntermediateFormat(song);

  const notation = getNotation(song, settings.transpose || 0);

  const cdoc = new ChordPdfJs({ margins: new Margins(las.margin) }, [
    settings.orientation,
    "mm",
    "a4",
  ]);

  const doc = cdoc.doc;
  const cols = settings.numCols;
  const colWidth = (cdoc.mediaWidth() - (cols - 1) * las.colgap) / cols;

  function placeFooter() {
    cdoc.setFont(...Bric, fos.footer);
    doc.text(
      songTitle + " - " + songArtist,
      cdoc.margins.left + cdoc.mediaWidth() / 2,
      cdoc.maxY(),
      { align: "center", baseline: "top" }
    );
  }

  let x0 = cdoc.margins.left;

  const [Coo, Sh, Bric, BricBold] = await loadFonts(cdoc);

  cdoc.chordFont = [...Sh, fos.chord];
  cdoc.textFont = [...Bric, fos.text];

  cdoc.setFont(...Coo, fos.header);
  const songArtist = out.author;
  const songTitle = out.title;

  let header;
  if (cols > 2) {
    const dima = cdoc.textLine(songArtist);
    cdoc.cursor.y += (fos.header * 0.2) / doc.internal.scaleFactor;

    cdoc.doc.setTextColor(ORANGE);
    const dimt = cdoc.textLine(songTitle);
    cdoc.doc.setTextColor(0);

    header = { y: cdoc.cursor.y + dima.h, x: x0 + Math.max(dima.w, dimt.w) };
  } else {
    const dim = cdoc.textFragment(songArtist, true);
    cdoc.cursor.y += dim.h * 0.6;
    const dima = cdoc.textFragment(songArtist + "  ");

    cdoc.doc.setTextColor(ORANGE);
    const dimt = cdoc.textFragment(songTitle);
    cdoc.doc.setTextColor(0);
    cdoc.cursor.y += dim.h;

    header = { y: cdoc.cursor.y, x: cdoc.cursor.x };
  }
  cdoc.cursor.y = header.y;

  placeFooter();

  for (const section of out.sections) {
    let simHeight = placeSection(section, true);
    if (debug) {
      const y0 = cdoc.cursor.y;
      doc.setDrawColor("green");
      doc.line(x0, y0, x0, y0 + simHeight);
    }
    const lineHeight =
      (las.section + fos.chord) / cdoc.doc.internal.scaleFactor;
    simHeight += lineHeight;

    if (cdoc.cursor.y + simHeight > cdoc.maxY()) {
      const c = cdoc.cursor;
      const g = las.colgap;
      x0 += colWidth + g;
      cdoc.cursor.y = x0 > header.x ? cdoc.margins.top : header.y;
      if (debug) {
        doc.line(x0 - g, c.y, x0 - g, c.y + cdoc.mediaHeight());
        doc.line(x0, c.y, x0, c.y + cdoc.mediaHeight());
      }
      if (x0 > cdoc.maxX()) {
        doc.addPage();
        x0 = cdoc.margins.left;
        header.y = cdoc.margins.top;
        placeFooter();
      }
    }

    if (debug) {
      const y0 = cdoc.cursor.y;
      doc.setDrawColor("red");
      doc.line(x0, y0, x0, y0 + simHeight);
    }
    placeSection(section);
    cdoc.cursor.y += lineHeight; // fonts are in point...
  }

  // to think about: instead of simulation flag simulation cursor. that
  // would simplify everthingj
  function placeSection(section: AllBlocks, simulate = false): number {
    let advance_y = 0;

    resetX();

    if (section.type === "chordblock") {
      cdoc.setFont(...BricBold, fos.section);
      advance_y += cdoc.textLine(section?.content?.title, simulate).h;
    }

    if (section.type === "repetition") {
      if (!simulate) {
        cdoc.cursor.y += las.section;
        doc.setFillColor(ORANGE);
        const w = fos.section / 15,
          h = fos.section / 2;
        doc.rect(cdoc.cursor.x, cdoc.cursor.y - h * 0.75, w, h, "F");
      }
      // optically smaller sizes need more gap hence fixed part
      cdoc.cursor.x += 2 + fos.section / 10;

      const sdf = cdoc.textFragment(section.content.ref, simulate);
      if (section.content.adm) {
        cdoc.setFont(...Bric, fos.text);
        const df = cdoc.textFragment("  " + section.content.adm, simulate);
      }
      advance_y += sdf.h;
    }
    if (section.type === "chordblock" || section.type === "repetition") {
      const lines = section.content.lines;
      if (lines) {
        placeLines(lines, simulate);
      }
    }

    if (section.type === "comment" && settings.includeComments) {
      doc.setTextColor("rgb(120,120,120)");
      cdoc.setFont(...Bric, fos.text);
      const texts: string[] = cdoc.doc.splitTextToSize(
        section.content,
        colWidth
      );
      advance_y += texts
        .map((l) => cdoc.textLine(l, simulate).h)
        .reduce((sum, current) => sum + current, 0);
    }

    doc.setTextColor(0);
    return advance_y;
  }

  function placeLines(lines: Line[], simulate: boolean) {
    let advance_y = 0;
    for (const line of lines) {
      resetX();
      const fragments = Array.from(line.fragments).map((c) => ({
        text: c.text,
        chord: Chord.from(c.chord)?.transposed(
          settings.transpose || 0,
          notation
        ),
      }));
      advance_y += cdoc.placeLine(fragments, colWidth, simulate, fas).advance_y;
    }
  }

  function placePageNumbers() {
    const total = doc.getNumberOfPages();

    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      cdoc.setFont(...Bric, fos.footer);
      doc.text(i + " / " + total, cdoc.maxX(), cdoc.maxY(), {
        align: "right",
        baseline: "top",
      });
      doc.text(new Date().toLocaleString(), cdoc.margins.left, cdoc.maxY(), {
        align: "left",
        baseline: "top",
      });
    }
  }

  placePageNumbers();

  // Save the Data
  const pdfData = doc.output("arraybuffer");
  const pdfBlobUrl = window.URL.createObjectURL(
    new Blob([pdfData], { type: "application/pdf" })
  );
  return pdfBlobUrl;

  function resetX() {
    cdoc.cursor.x = x0;
  }
}
async function loadFonts(cdoc: ChordPdfJs) {
  const out = Promise.all([
    cdoc.addFontXhr("/fonts/pdf/CooperK-Black-w.ttf", "Coo", "normal", "light"),
    cdoc.addFontXhr(
      "/fonts/pdf/ShantellSans-SemiBold.ttf",
      "Sh",
      "normal",
      "light"
    ),
    cdoc.addFontXhr(
      "/fonts/pdf/BricolageGrotesque_Condensed-Regular.ttf",
      "Bric",
      "normal",
      "regular"
    ),
    cdoc.addFontXhr(
      "/fonts/pdf/BricolageGrotesque_Condensed-Bold.ttf",
      "Bric",
      "normal",
      "bold"
    ),
  ]);
  return out;
}

function getNotation(song: Song, semitones: number) {
  const chords = parseChords(song.getChords());
  const counts = countChords(chords);
  const keyTag = song.getTag("tonart");
  const keyHint = Chord.from(keyTag);
  const { isMinor, keyValue } =
    keyHint === undefined
      ? guessKeyFromChordCounts(Object.entries(counts))
      : {
          keyValue:
            (keyHint.key.value + (keyHint.quality === "minor" ? 3 : 0)) % 12,
          isMinor: keyHint.quality === "minor",
        };

  const targetKeyValue =
    (((keyValue + semitones - (isMinor ? 3 : 0)) % 12) + 12) % 12;
  const notation = notationPreferenceFor(targetKeyValue, isMinor);
  return notation;
}
