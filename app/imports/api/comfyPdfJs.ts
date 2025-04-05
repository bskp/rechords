import { jsPDF } from "jspdf";
import Chord from "./libchr0d/chord";
import { FontRefwS } from "../ui/PdfViewer/PdfRenderer/PdfRenderer";
import { Fragment } from "../ui/PdfViewer/PdfRenderer/JHoeli";
import { keys } from "underscore";
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
    weight: string
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
  placeLine(
    line_: Fragment[],
    width: number,
    simulate = false,
    lineheigts = { chord: 1, text: 1 },
    debug=false
  ): { advance_y: number; numlineBreaksInserted: number; intCursor: Cursor } {
    let br = 0;

    const line = line_.flatMap((f) => {
      if (f.text) {
        const splits = f.text.split(/(\s)/);
        const [first, ...others] = splits;
        if (others.length) {
          return [{ ...f, text: first }, ...others.map((t) => ({ text: t }))];
        }
      }
      return [f];
    });

    const tfs = this.textFont.size / this.doc.internal.scaleFactor;
    const cfs = this.chordFont.size / this.doc.internal.scaleFactor;

    const cumy = tfs * lineheigts.text + cfs * lineheigts.chord;
    // may be constant line height (even without chords) is more readable?
    const intCursor = {
      xchord: this.cursor.x,
      xtext: this.cursor.x,
      y: this.cursor.y,
    };
    intCursor.y += cumy;

    for (const { chordT, text, chord: c } of line) {
      let wbase = 0,
        wtext = 0,
        wchord = 0;

      if (text) {
        this.setFont(this.textFont);
        wtext = this.doc.getTextWidth(text);
      }

      if (chordT) {
        const chord = chordT;
        this.setFont(this.chordFont);
        const key = chord.toStringKey();
        const sup = chord.toStringTensionsAndSlash();
        wbase = this.doc.getTextWidth(key);
        this.doc.setFontSize(this.chordFont.size * 0.7);
        const wsup = this.doc.getTextWidth(sup);
        wchord = wbase + wsup + lineheigts.chord;
      }

      let x;

      if (chordT) {
        x = Math.max(intCursor.xchord, intCursor.xtext);
        intCursor.xchord = x;
        intCursor.xtext = x;
      } else {
        x = intCursor.xtext;
      }

      const wmax = Math.max(wtext, wchord);
      if (x + wmax - this.cursor.x > width) {
        intCursor.xchord = this.cursor.x;
        intCursor.xtext = this.cursor.x;
        intCursor.y += cumy;
      }

      if (!simulate && chordT) {
        if(debug) {
          const height = this.chordFont.size / this.doc.internal.scaleFactor;
          this.doc.setFillColor('beige')
          this.doc.rect(x, intCursor.y-height-tfs, wchord, height, "F")
        }
        const chord = chordT;
        const key = chord.toStringKey();
        const sup = chord.toStringTensionsAndSlash();
        this.doc.setFontSize(this.chordFont.size);
        this.doc.setTextColor("rgb(221, 68, 7)");
        this.doc.text(key, x, intCursor.y - tfs);
        this.doc.setFontSize(this.chordFont.size * 0.7);
        this.doc.text(sup, x + wbase, intCursor.y - tfs);
        this.doc.setTextColor(0);
      }
      if (!simulate && text) {
        if(debug) {
          const height = this.textFont.size / this.doc.internal.scaleFactor;
          this.doc.setFillColor('beige')
          this.doc.rect(x, intCursor.y-height, wtext, height, "F")
        }
        this.setFont(this.textFont);
        this.doc.text(text, x, intCursor.y);
      }

      intCursor.xchord += wchord;
      intCursor.xtext += wtext;
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
