import { ChordPdfJs, Margins } from "/imports/api/comfyPdfJs";
import { refPrefix } from "/imports/api/showdown-rechords";
import { IPdfViewerSettings } from "../PdfSettings";
import {
  guessKeyFromChordCounts,
  notationPreferenceFor,
} from "/imports/api/libchr0d/helpers";
import { Song } from "/imports/api/collections";
import Chord from "/imports/api/libchr0d/chord";
import { parseChords } from "../../Viewer";
import { countChords } from "../../Transposer";

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

  /** font sizes  */
  const fos = settings.fontSizes;
  const las = settings.layoutSettings;
  const fas = settings.factors;

  // Hm. Reusing reactParser would make alot more sense...
  // But hey... here we are...
  // There is even a plugin to convert svg (notes + fret diagrams)
  // to PDF. However, if printing via CSS finally succeeds (2030 maybe ;-) )
  // this PDF rendering  will obliviate
  const mdHtml = new DOMParser().parseFromString(song.getHtml(), "text/html");

  const notation = getNotation(song, settings.transpose);

  const sections_ = mdHtml.body.children;

  const sections: Element[] = [];
  for (const el of sections_) {
    if (el.tagName === "SECTION") {
      if (
        !el.classList.contains("inlineReference") ||
        settings.inlineReferences
      ) {
        sections.push(el.cloneNode(true) as Element);
      }
    } else if (settings.includeComments && el.tagName === "P") {
      const div = document.createElement("DIV");
      div.appendChild(el.cloneNode(true));
      sections.push(div);
    } else if (
      !settings.inlineReferences &&
      el.tagName === "DIV" &&
      el.classList.contains("ref")
    ) {
      const div = document.createElement("DIV");
      div.appendChild(el.cloneNode(true));
      sections.push(div as Element);
    }
  }

  const cdoc = new ChordPdfJs({ margins: new Margins(las.margin) }, [
    settings.orientation,
    "mm",
    "a4",
  ]);

  const doc = cdoc.doc;
  const cols = settings.numCols;
  const colWidth = (cdoc.mediaWidth() - (cols - 1) * las.colgap) / cols;

  let x0 = cdoc.margins.left;

  const [Coo, Sh, Bric, BricBold] = await loadFonts(cdoc);

  cdoc.chordFont = [...Sh, fos.chord];
  cdoc.textFont = [...Bric, fos.text];

  cdoc.setFont(...Coo, fos.header);
  const songArtist = mdHtml.querySelector(".sd-header>h2")?.textContent || "";
  const songTitle = mdHtml.querySelector(".sd-header>h1")?.textContent || "";

  let header;
  if (cols > 2) {
    const dima = cdoc.textLine(songArtist);
    cdoc.cursor.y += (fos.header * 0.2) / doc.internal.scaleFactor;

    cdoc.doc.setTextColor("rgb(221, 68, 7)");
    const dimt = cdoc.textLine(songTitle);
    cdoc.doc.setTextColor(0);

    header = { y: cdoc.cursor.y, x: x0 + Math.max(dima.w, dimt.w) };
  } else {
    const dima = cdoc.textFragment(songArtist + "  ");

    cdoc.doc.setTextColor("rgb(221, 68, 7)");
    const dimt = cdoc.textFragment(songTitle);
    cdoc.doc.setTextColor(0);

    header = { y: cdoc.cursor.y, x: x0 + Math.max(dima.w, dimt.w) };
  }

  function placeFooter() {
    cdoc.setFont(...Bric, fos.footer);
    doc.text(
      songTitle + " - " + songArtist,
      cdoc.margins.left + cdoc.mediaWidth() / 2,
      cdoc.maxY(),
      { align: "center", baseline: "top" }
    );
  }
  placeFooter();

  const splitSections = sections.flatMap((s) => [...s.children]);

  for (const section of splitSections) {
    const simHeight = placeSection(section, true);
    if (debug) {
      const y0 = cdoc.cursor.y;
      doc.setDrawColor("green");
      doc.line(x0 - 1, y0, x0 - 1, y0 + simHeight);
    }

    if (cdoc.cursor.y + simHeight > cdoc.maxY()) {
      const c = cdoc.cursor;
      const g = las.colgap;
      x0 += colWidth + g;
      cdoc.cursor.y = x0 > header.x ? cdoc.margins.top : header.y;
      if (debug) {
        // doc.line(x0 - g, c.y, x0 - g, c.y + cdoc.mediaHeight())
        // doc.line(x0, c.y, x0, c.y + cdoc.mediaHeight())
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
  }

  // to think about: instead of simulation flag simulation cursor. that
  // would simplify everthingj
  function placeSection(section: Element, simulate = false): number {
    let advance_y = 0;

    resetX();
    const lineHeight = (las.section + fos.chord) / doc.internal.scaleFactor;
    if (!cdoc.isTop()) {
      advance_y += lineHeight;
      if (!simulate) cdoc.cursor.y += lineHeight; // fonts are in point...
    }

    cdoc.setFont(...BricBold, fos.section);
    advance_y += cdoc.textLine(
      section.querySelector("h3")?.innerText,
      simulate
    ).h;

    if (section.classList.contains("ref")) {
      const [strong, adm] = section.childNodes;
      if (!simulate) {
        doc.triangle(
          cdoc.cursor.x,
          cdoc.cursor.y,
          cdoc.cursor.x,
          cdoc.cursor.y - 4,
          cdoc.cursor.x + 3,
          cdoc.cursor.y - 2,
          "FD"
        );
      }
      cdoc.cursor.x += 5;

      const sdf = cdoc.textFragment(strong.textContent, simulate);
      if (adm) {
        cdoc.setFont(...Bric, fos.text);
        const df = cdoc.textFragment("  " + adm.textContent, simulate);
      }
      advance_y += sdf.h;
    }

    cdoc.setFont(...Bric, fos.text);
    advance_y += cdoc.textLine(
      section.querySelector("h4")?.innerText,
      simulate
    ).h;

    const lines = section.querySelectorAll("span.line");

    for (const line of lines) {
      resetX();
      const chords = line.querySelectorAll("i");
      const fragments = Array.from(chords).map((c) => ({
        text: c.innerText,
        chord: Chord.from(c.dataset?.chord)?.transposed(
          settings.transpose,
          notation
        ), // libChrod.transpose(c.dataset?.chord, key, settings.transpose),
      }));
      advance_y += cdoc.placeChords(
        fragments,
        colWidth,
        simulate,
        fas
      ).advance_y;
    }

    if (settings.includeComments && section.tagName == "P") {
      doc.setTextColor("rgb(120,120,120)")
      cdoc.setFont(...Bric, fos.text);
      const texts: string[] = cdoc.doc.splitTextToSize(
        section.textContent,
        colWidth
      );
      advance_y += texts
        .map((l) => cdoc.textLine(l, simulate).h)
        .reduce((sum, current) => sum + current, 0);
    }

      doc.setTextColor(0)
    return advance_y;
  }

  function placePageNumbers() {
    //@ts-ignore not yet added to types :( )
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
