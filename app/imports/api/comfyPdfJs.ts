import { jsPDF } from "jspdf";
import Chord from "./libchr0d/chord";
import { Line } from "../ui/PdfViewer/PdfRenderer/jsonHoeli";
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
    public y = 0
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

  setFont(name: string, type: string, weight: string, size: number) {
    this.doc.setFont(name, type, weight).setFontSize(size);
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
  maxY = () => this.pageHeight() - this.margins.bottom;
  maxX = () => this.pageWidth() - this.margins.bottom;
  mediaWidth = () => this.doc.internal.pageSize.getWidth() - this.margins.lr();
  mediaHeight = () =>
    this.doc.internal.pageSize.getHeight() - this.margins.tb();

  isTop = () => this.cursor.y * 0.999 < this.margins.top;

  async addFontXhr(
    p,
    fontname,
    style,
    weight
  ): Promise<[string, string, string]> {
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
      return [fontname, style, weight];
    });
  }
}

type ChordBaseSuff = {
  base: string;
  suff: string;
};

export class ChordPdfJs extends ComfyPdfJs {
  // todo: better font object
  chordFont: [string, string, string, number] = ["RoCo", "regular", "bold", 9];
  textFont: [string, string, string, number] = [
    "RoCo",
    "regular",
    "normal",
    12,
  ];

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
    line: { text: string | undefined; chord: Chord | undefined }[],
    width: number,
    simulate = false,
    lineheigts = { chord: 1, text: 1 }
  ): { advance_y: number; numlineBreaksInserted: number; intCursor: Cursor } {
    let br = 0;

    const intCursor = new Cursor(this.cursor.x, this.cursor.y);

    const tfs = this.textFont[3] / this.doc.internal.scaleFactor;
    const cfs = this.chordFont[3] / this.doc.internal.scaleFactor;
    const einzug = 1.5 * tfs;

    // character position in line
    const chordMap = new Map<number, Chord>();
    let charCnt = 0;
    let accText = "";
    for (const { text, chord } of line) {
      if (chord) {
        chordMap.set(charCnt, chord);
      }
      accText += text;
      charCnt += text.length;
    }

    this.setFont(...this.textFont);
    const lines_: string[] = this.doc.splitTextToSize(accText, width);
    const notFirstLines = this.doc.splitTextToSize(
      lines_.slice(1).join(""),
      width - einzug
    );
    const lines = lines_.length > 1 ? [lines_[0], ...notFirstLines] : lines_;

    br = lines.length - 1;

    const keys = Array.from(chordMap.keys());

    const chordLines: [string, [number, Chord][]][] = [];

    let minPos = 0,
      maxPos = 0;
    for (const line of lines) {
      maxPos = minPos + line.length;
      const lineChords: [number, Chord][] = keys
        .filter((v) => minPos <= v && maxPos > v)
        .map((v) => [v - minPos, chordMap.get(v)]);
      minPos = maxPos;
      chordLines.push([line, lineChords]);
    }

    let first = true;
    for (const [line, chords] of chordLines) {
      intCursor.y += tfs * lineheigts.text;
      // may be constant line height (even without chords) is more readable?
      if (chords.length) intCursor.y += cfs * lineheigts.chord;
      this.setFont(...this.chordFont);
      let xpos = intCursor.x,
        lastidx = 0;
      let firstChord = true;
      for (const [idx, chord] of chords) {
        const text = line.substring(lastidx, idx - lastidx) || "";
        this.setFont(...this.textFont);
        const wtext = this.doc.getTextWidth(text);
        this.setFont(...this.chordFont);
        const chord_ = chord.toStringKey() + chord.toStringTensionsAndSlash();
        const wbase = this.doc.getTextWidth(chord.toStringKey());
        xpos += firstChord
          ? wtext
          : Math.max(wtext, this.doc.getTextWidth(chord_) + 0.5 * tfs);
        if (!simulate) {
          this.doc.setTextColor("rgb(221, 68, 7)");
          this.doc.text(chord.toStringKey(), xpos, intCursor.y - tfs);
          this.doc.setFontSize(this.chordFont[3] * 0.7);
          this.doc.text(
            chord.toStringTensionsAndSlash(),
            xpos + wbase,
            intCursor.y - (tfs - cfs * 0.3)
          );
          this.doc.setTextColor(0);
        }
        lastidx = idx;
        firstChord = false;
      }

      this.setFont(...this.textFont);
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
