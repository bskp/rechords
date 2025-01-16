import Note from "./note";

export type Quality = "major" | "minor" | "diminished" | "augmented";

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

export default class Chord_ {
  public constructor(
    public readonly key: Note,
    public readonly isOptional: boolean,
    public readonly quality: Quality,
    public readonly tensions: string,
    public readonly slash?: Note,
  ) {}

  public static from(chordString: string): Chord_ | undefined {
    const isOptional = chordString.startsWith("(") && chordString.endsWith(")");

    if (isOptional) {
      chordString = chordString.substring(1, chordString.length - 2);
    }

    const match = chordString.match(
      /([a-h][#b]?)(maj7|m|)([^\s\/]*)(?:\/([a-h][#b]?))?/i,
    );
    if (!match) {
      return undefined;
    }

    let [_, keystr, qualityStr, tensions, slash] = match;

    const quality = ((q: string): Quality => {
      switch (q) {
        case "m":
          return "minor";
        case "maj7":
          tensions = "maj7" + tensions;
          return "major";
        default:
          return "major";
      }
    })(qualityStr);

    const key = Note.from(keystr);
    if (key === undefined) return undefined;

    return new Chord_(key, isOptional, quality, tensions, Note.from(slash));
  }

  public transposed(semitones: number) {
    return new Chord_(
      this.key.transposed(semitones),
      this.isOptional,
      this.quality,
      this.tensions,
      this.slash?.transposed(semitones),
    );
  }

  public asCode() {
    // Used to style the circle of fifths
    return (this.quality === "minor" ? "m" : "M") + this.key.value;
  }

  public toStringKey() {
    let base = this.key.toString();
    if (this.quality === "major") {
      base = capitalize(base);
    } else {
      base = base + "m";
    }
    return base;
  }

  public toStringTensionsAndSlash() {
    return (
      this.tensions ?? "" + (this.slash ? "/" + this.slash.toString() : "")
    );
  }

  public toString() {
    return this.toStringKey() + this.toStringTensionsAndSlash();
  }

  public toStringClasses() {
    return "chord" + (this.isOptional ? " optional" : "");
  }
}
