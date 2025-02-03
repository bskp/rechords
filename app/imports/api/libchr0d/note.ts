export type Notation = "bee" | "sharp" | "undetermined";

export default class Note {
  public constructor(
    public readonly value: number,
    public readonly notation: Notation = "undetermined",
  ) {}

  static from(name: string) {
    if (!name) {
      return undefined;
    }

    const match = name.match(/([a-hA-H])(b|#|)/);

    if (!match || match.length !== 3) {
      return undefined;
    }
    const [_, valueStr, accidental] = match;

    let value = ((v: string) => {
      switch (v.toLowerCase()) {
        case "c":
          return 0;
        case "d":
          return 2;
        case "e":
          return 4;
        case "f":
          return 5;
        case "g":
          return 7;
        case "a":
          return 9;
        default: // b or h
          return 11;
      }
    })(valueStr);

    let notation: Notation = "undetermined";

    if (accidental === "b") {
      notation = "bee";
      value += -1;
    } else if (accidental === "#") {
      notation = "sharp";
      value += 1;
    }

    return new Note(value, notation);
  }

  public transposed(semitones: number, notation?: Notation) {
    return new Note(
      (this.value + 12 + (semitones % 12)) % 12,
      notation ?? this.notation,
    );
  }

  public toString() {
    switch (this.notation) {
      case "bee":
        return [
          "C",
          "Db",
          "D",
          "Eb",
          "E",
          "F",
          "Gb",
          "G",
          "Ab",
          "A",
          "Bb",
          "B",
        ][this.value];
      case "undetermined":
        return [
          "C",
          "C#",
          "D",
          "Eb",
          "E",
          "F",
          "F#",
          "G",
          "G#",
          "A",
          "Bb",
          "B",
        ][this.value];
      case "sharp":
        return [
          "C",
          "C#",
          "D",
          "D#",
          "E",
          "F",
          "F#",
          "G",
          "G#",
          "A",
          "A#",
          "B",
        ][this.value];
    }
  }
}
