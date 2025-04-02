import { ChordPdfJs, FontRef, Margins } from "/imports/api/comfyPdfJs";
import {
  ILayoutSettings,
  IPdfViewerSettings,
  ITextSizes,
} from "../PdfSettings";
import {
  guessKeyFromChordCounts,
  notationPreferenceFor,
} from "/imports/api/libchr0d/helpers";
import { Song } from "/imports/api/collections";
import Chord from "/imports/api/libchr0d/chord";
import { parseChords } from "../../Viewer";
import { countChords } from "../../Transposer";
import { AllBlocks, Line, parseToIntermediateFormat } from "./JHoeli";
import jsPDF from "jspdf";

const ORANGE = "rgb(221, 68, 7)";
export type JSong = {
  author: string;
  title: string;
  sections: AllBlocks[];
};

/**
 *
 * @param vdom Dom Tree in format of showdown-rechord output
 * @param settings How to render
 * @param debug Print Debuglines for Columns?
 * @returns URL of the generated Blob
 */
export async function jsPdfGenerator(
  song: Song,
  settings: IPdfViewerSettings
): Promise<string> {
  if (!song) return "";

  // starting point would be: intermediate format
  const notation = getNotation(song, settings.transpose || 0);
  const out_ = { ...parseToIntermediateFormat(song) };

  const mapLine: (l: Line) => Line = (l) => ({
    ...l,
    fragments: l.fragments.map((c) => ({
      ...c,
      chordT: Chord.from(c.chord)?.transposed(
        settings.transpose || 0,
        notation
      ),
    })),
  });
  const mapSection = (s: AllBlocks) => {
    if (s.type === "comment") {
      return s;
    } else if (s.type === "chordblock") {
      return {
        ...s,
        content: { ...s.content, lines: s.content.lines?.map(mapLine) },
      };
    } else {
      return {
        ...s,
        content: { ...s.content, lines: s.content.lines?.map(mapLine) },
      };
    }
  };

  const out: typeof out_ = { ...out_, sections: out_.sections.map(mapSection) };

  console.log(out)
  const renderer = new ChordPdfRenderer(settings);

  return await renderer.render(out);

  // Save the Data
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

export type FontRefwS = FontRef & {
  size: number;
};
class ChordPdfRenderer {
  debug = false;
  header = { x: 0, y: 0 };
  f!: { Coo: FontRef; Sh: FontRef; Bric: FontRef; BricBold: FontRef };
  /**
   * current column position
   */
  x0!: number;

  fos: ITextSizes;
  las: ILayoutSettings;
  fas: { text: number; chord: number };
  cdoc: ChordPdfJs;
  doc: jsPDF;
  cols: number;
  colWidth: number;

  constructor(public settings: IPdfViewerSettings) {
    this.fos = settings.fontSizes;
    this.las = settings.layoutSettings;
    this.fas = settings.factors;
    this.cdoc = new ChordPdfJs({ margins: new Margins(this.las.margin) }, [
      settings.orientation,
      "mm",
      "a4",
    ]);
    this.doc = this.cdoc.doc;
    this.cols = settings.numCols;
    this.colWidth =
      (this.cdoc.mediaWidth() - (this.cols - 1) * this.las.colgap) / this.cols;
  }

  async render(o: JSong) {
    const [Coo, Sh, Bric, BricBold] = await loadFonts(this.cdoc);
    this.f = { Coo, Sh, Bric, BricBold };

    this.cdoc.chordFont = { ...Sh, size: this.fos.chord };
    this.cdoc.textFont = { ...Bric, size: this.fos.text };

    this.cdoc.setFont({ ...Coo, size: this.fos.header });

    this.x0 = this.cdoc.minX();
    this.placeHeader(o.author, o.title);
    this.placeSections(o);

    const pdfData = this.doc.output("arraybuffer");
    const pdfBlobUrl = window.URL.createObjectURL(
      new Blob([pdfData], { type: "application/pdf" })
    );
    return pdfBlobUrl;
  }

  private placeSections(o: JSong) {
    for (const section of o.sections) {
      let simHeight = this.placeSection(section, true);
      if (this.debug) {
        const y0 = this.cdoc.cursor.y;
        this.doc.setDrawColor("blue");
        this.doc.setLineWidth(3);
        this.doc.line(this.x0, y0, this.x0, y0 + simHeight);
      }
      const sectionGap =
        (this.las.section + this.fos.chord) /
        this.cdoc.doc.internal.scaleFactor;
      simHeight += sectionGap;

      // would the next section overlap the page?
      if (this.cdoc.cursor.y + simHeight > this.cdoc.maxY()) {
        const c = this.cdoc.cursor;
        const g = this.las.colgap;
        this.x0 += this.colWidth + g;
        this.cdoc.cursor.y =
          this.x0 > this.header.x ? this.cdoc.margins.top : this.header.y;
        if (this.debug) {
          this.doc.line(
            this.x0 - g,
            c.y,
            this.x0 - g,
            c.y + this.cdoc.mediaHeight()
          );
          this.doc.line(this.x0, c.y, this.x0, c.y + this.cdoc.mediaHeight());
        }
        if (this.x0 > this.cdoc.maxX()) {
          this.doc.addPage();
          this.x0 = this.cdoc.margins.left;
          this.header.y = this.cdoc.margins.top;
          this.placeFooter(o.author, o.title);
        }
      }

      if (this.debug) {
        const y0 = this.cdoc.cursor.y;
        this.doc.setDrawColor("red");
        this.doc.setLineWidth(1);
        this.doc.line(this.x0, y0, this.x0, y0 + simHeight);
      }
      this.placeSection(section);
      this.cdoc.cursor.y += sectionGap;
    }
  }

  placeSection(section: AllBlocks, simulate = false): number {
    let advance_y = 0;

    this.resetX();

    this.cdoc.setFont({ ...this.f.BricBold, size: this.fos.section });
    if (section.type === "chordblock") {
      advance_y += this.cdoc.textLine(section?.content?.title, simulate).h;
    }

    if (section.type === "repetition") {
      // line
      if (!simulate) {
        this.cdoc.cursor.y += this.las.section;
        if (!this.settings.inlineReferences) {
          this.doc.setFillColor(ORANGE);
          const w = this.fos.section / 15,
            h = this.fos.section / 2;
          this.doc.rect(
            this.cdoc.cursor.x,
            this.cdoc.cursor.y - h * 0.75,
            w,
            h,
            "F"
          );
          // optically smaller sizes need more gap hence fixed part
          this.cdoc.cursor.x += 2 + this.fos.section / 10;
        }
      }

      const sdf = this.cdoc.textFragment(section.content.ref, simulate);
      if (section.content.adm) {
        this.cdoc.setFont({ ...this.f.Bric, size: this.fos.text });
        const df = this.cdoc.textFragment("  " + section.content.adm, simulate);
      }
      advance_y += sdf.h;
    }
    if (
      section.type === "chordblock" ||
      (section.type === "repetition" && this.settings.inlineReferences)
    ) {
      const lines = section.content.lines;
      if (lines) {
        const dimensions = this.placeLines(lines, simulate);
        advance_y += dimensions;
      }
    }

    if (section.type === "comment" && this.settings.includeComments) {
      this.doc.setTextColor("rgb(120,120,120)");
      this.cdoc.setFont({ ...this.f.Bric, size: this.fos.text });
      const texts: string[] = this.cdoc.doc.splitTextToSize(
        section.content,
        this.colWidth
      );
      advance_y += texts
        .map((l) => this.cdoc.textLine(l, simulate).h)
        .reduce((sum, current) => sum + current, 0);
    }

    this.doc.setTextColor(0);
    return advance_y;
  }
  placeLines(lines: Line[], simulate: boolean) {
    let advance_y = 0;
    for (const line of lines) {
      this.resetX();
      advance_y += this.cdoc.placeLine(
        line.fragments,
        this.colWidth,
        simulate,
        this.fas
      ).advance_y;
    }
    return advance_y;
  }

  placePageNumbers() {
    const total = this.doc.getNumberOfPages();

    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.cdoc.setFont({ ...this.f.Bric, size: this.fos.footer });
      this.doc.text(i + " / " + total, this.cdoc.maxX(), this.cdoc.maxY(), {
        align: "right",
        baseline: "top",
      });
      this.doc.text(
        new Date().toLocaleString(),
        this.cdoc.margins.left,
        this.cdoc.maxY(),
        {
          align: "left",
          baseline: "top",
        }
      );
    }
  }
  private placeHeader(songArtist: string, songTitle: string) {
    if (this.cols > 2) {
      const dima = this.cdoc.textLine(songArtist);
      this.cdoc.cursor.y +=
        (this.fos.header * 0.2) / this.doc.internal.scaleFactor;

      this.cdoc.doc.setTextColor(ORANGE);
      const dimt = this.cdoc.textLine(songTitle);
      this.cdoc.doc.setTextColor(0);

      this.header = {
        y: this.cdoc.cursor.y + dima.h,
        x: this.cdoc.minX() + Math.max(dima.w, dimt.w),
      };
    } else {
      const dim = this.cdoc.textFragment(songArtist, true);
      this.cdoc.cursor.y += dim.h * 0.6;
      const dima = this.cdoc.textFragment(songArtist + "  ");

      this.cdoc.doc.setTextColor(ORANGE);
      const dimt = this.cdoc.textFragment(songTitle);
      this.cdoc.doc.setTextColor(0);
      this.cdoc.cursor.y += dim.h;

      this.header = { y: this.cdoc.cursor.y, x: this.cdoc.cursor.x };
    }
    this.cdoc.cursor.y = this.header.y;
  }

  placeFooter(author: string, title: string) {
    this.placePageNumbers();
    this.cdoc.setFont({ ...this.f.Bric, size: this.fos.footer });
    this.doc.text(
      title + " - " + author,
      this.cdoc.margins.left + this.cdoc.mediaWidth() / 2,
      this.cdoc.maxY(),
      { align: "center", baseline: "top" }
    );
  }
  resetX() {
    this.cdoc.cursor.x = this.x0;
  }
}
