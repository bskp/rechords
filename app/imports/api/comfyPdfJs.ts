import { jsPDF } from "jspdf";
import Chord from "./libchr0d/chord";
import { FontRefwS } from "../ui/PdfViewer/PdfRenderer/PdfRenderer";
import { Fragment } from "../ui/PdfViewer/PdfRenderer/JHoeli";
export class Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  constructor(scale: number) {
    this.top = 0.8 * scale;
    this.right = 1 * scale;
    this.bottom = 1 * scale;
    this.left = 1 * scale;
  }

  tb = () => this.top + this.bottom;
  lr = () => this.left + this.right;
}

export class Cursor {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

export class ComfyPdfJs {
  /** exposing jsDocument */
  public doc: jsPDF;

  cursor = new Cursor();
  margins = new Margins();

  constructor(params, jsPdfParams: any[]) {
    if (params.margins) {
      Object.assign(this.margins, params.margins);
    }

    this.doc = new jsPDF(...jsPdfParams);
    Object.assign(this.cursor, { x: this.margins.top, y: this.margins.left });
  }

  setFont({ fontname, style, weight, size }: FontRefwS) {
    this.doc.setFont(fontname, style, weight).setFontSize(size);
  }

  /**
   * Advances the cursor in y-direction
   * @param content
   */
  textLine(content?: string, simulate = false): { w: number; h: number } {
    if (!content) {
      return { w: 0, h: 0 };
    }
    const dims = this.doc.getTextDimensions(content);
    if (!simulate) {
      this.doc.text(content, this.cursor.x, this.cursor.y, { baseline: "top" });
      this.cursor.y += dims.h;
    }
    return dims;
  }

  /**
   * Advances the cursor in x-direction
   * @param content
   */
  textFragment(content: string, simulate = false): { w: number; h: number } {
    const dims = this.doc.getTextDimensions(content);
    if (!simulate) {
      this.doc.text(content, this.cursor.x, this.cursor.y);
      this.cursor.x += dims.w;
    }
    return dims;
  }
  pageHeight = () => this.doc.internal.pageSize.getHeight();
  pageWidth = () => this.doc.internal.pageSize.getWidth();
  // todo: minX, minY
  maxX = () => this.pageWidth() - this.margins.right;
  maxY = () => this.pageHeight() - this.margins.bottom;
  minX = () => this.margins.left;
  minY = () => this.margins.top;
  mediaWidth = () => this.doc.internal.pageSize.getWidth() - this.margins.lr();
  mediaHeight = () =>
    this.doc.internal.pageSize.getHeight() - this.margins.tb();

  isTop = () => this.cursor.y * 0.999 < this.margins.top;

  async addFontXhr(
    p: string,
    fontname: string,
    style: string,
    weight: string,
  ): Promise<FontRef> {
    const filename = basename(p);
    const blob = await fetch(p).then((response) => response.blob());

    return new Promise<string>((res, rej) => {
      const fr = new FileReader();
      // @ts-ignore: we know the result is a string by calling readAsDataURL
      fr.onload = () => res(fr.result.replace(/^data:.+;base64,/, ""));
      fr.readAsDataURL(blob);
    }).then((font) => {
      this.doc.addFileToVFS(filename, font);
      this.doc.addFont(filename, fontname, style, weight);
      return { fontname, style, weight };
    });
  }
}

export class ChordPdfJs extends ComfyPdfJs {
  // todo: better font object
  chordFont!: FontRefwS;
  textFont!: FontRefwS;
  /**
   *
   * @param fragments
   * @param width
   * @param simulate if true, cursor will not be modified
   *
   * @returns distance moved in y direction // tbd internal cursor?
   */
  // todo: why is this here?
  placeLine(
    line: Fragment[],
    width: number,
    simulate = false,
    lineheigts = { chord: 1, text: 1 },
  ): { advance_y: number; numlineBreaksInserted: number; intCursor: Cursor } {
    let br = 0;

    const intCursor = new Cursor(this.cursor.x, this.cursor.y);

    const tfs = this.textFont.size / this.doc.internal.scaleFactor;
    const cfs = this.chordFont.size / this.doc.internal.scaleFactor;
    const einzug = 1.5 * tfs;

    // character position in line
    const chordMap = new Map<number, Chord>();
    let charCnt = 0;
    let accText = "";
    for (const { text, chordT: chord } of line) {
      if (chord) {
        chordMap.set(charCnt, chord);
      }
      accText += text;
      charCnt += text?.length || 0;
    }

    this.setFont(this.textFont);
    const textLines_: string[] = this.doc.splitTextToSize(accText, width);
    const notFirstLines = this.doc.splitTextToSize(
      textLines_.slice(1).join(""),
      width - einzug,
    ) as string[];
    const textLines =
      textLines_.length > 1 ? [textLines_[0], ...notFirstLines] : textLines_;

    br = textLines.length - 1;

    const keys = Array.from(chordMap.keys());

    const chordLines: [string, [number, Chord][]][] = [];

    let minPos = 0,
      maxPos = 0;
    for (const line of textLines) {
      maxPos = minPos + line.length;
      const lineChords: [number, Chord][] = keys
        .filter((v) => minPos <= v && maxPos > v)
        .flatMap((v) => {
          const c = chordMap.get(v);
          return c ? [[v - minPos, c]] : [];
        });
      minPos = maxPos;
      chordLines.push([line, lineChords]);
    }

    let first = true;
    for (const [line, chords] of chordLines) {
      intCursor.y += tfs * lineheigts.text;
      // may be constant line height (even without chords) is more readable?
      if (chords.length) intCursor.y += cfs * lineheigts.chord;
      this.setFont(this.chordFont);
      let xpos = intCursor.x,
        lastidx = 0;
      let firstChord = true;
      for (const [idx, chord] of chords) {
        const text = line.substring(lastidx, idx - lastidx) || "";
        this.setFont(this.textFont);
        const wtext = this.doc.getTextWidth(text);
        this.setFont(this.chordFont);
        const chord_ = chord.toStringKey() + chord.toStringTensionsAndSlash();
        const wbase = this.doc.getTextWidth(chord.toStringKey());
        xpos += firstChord
          ? wtext
          : Math.max(wtext, this.doc.getTextWidth(chord_) + 0.5 * tfs);
        if (!simulate) {
          this.doc.setTextColor("rgb(221, 68, 7)");
          this.doc.text(chord.toStringKey(), xpos, intCursor.y - tfs);
          this.doc.setFontSize(this.chordFont.size * 0.7);
          this.doc.text(
            chord.toStringTensionsAndSlash(),
            xpos + wbase,
            intCursor.y - (tfs - cfs * 0.3),
          );
          this.doc.setTextColor(0);
        }
        lastidx = idx;
        firstChord = false;
      }

      this.setFont(this.textFont);
      if (!simulate) this.doc.text(line, intCursor.x, intCursor.y);
      if (first) {
        intCursor.x += einzug;
        first = false;
      }
    }

    const returnValue = {
      advance_y: intCursor.y - this.cursor.y,
      numlineBreaksInserted: br,
      intCursor: intCursor,
    };
    if (!simulate) Object.assign(this.cursor, intCursor);

    return returnValue;
  }
}
function basename(path: string) {
  return path.split("/").reverse()[0];
}

export type FontRef = {
  fontname: string;
  style: string;
  weight: string;
};
