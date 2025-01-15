type Notation = 'bee' | 'sharp' | 'undetermined';

export default class Note {

  public constructor(
    public readonly value: number,
    public readonly notation: Notation
  ) {
  }

  static from(name: string) {
    if (!name) {
      return undefined
    }

    const match = name.match(/([a-hA-H])(b|#|)/);

    if (!match || match.length !== 3) {
      return undefined;
    }
    const [_, valueStr, accidental] = match;

    let value = ((v: string) => {
      switch (v.toLowerCase()) {
        case 'c':
          return 0;
        case 'd':
          return 2;
        case 'e':
          return 4;
        case 'f':
          return 5;
        case 'g':
          return 7;
        case 'a':
          return 9;
        default:
          return 11;
      }
    })(valueStr);

    let notation: Notation = 'undetermined';

    if (accidental === 'b') {
      notation = 'bee';
      value += -1;
    } else if (accidental === '#') {
      notation = 'sharp';
      value += 1;
    }

    return new Note(value, notation)
  }

  public transposed(semitones: number) {
    return new Note((this.value + 12 + semitones%12)%12, this.notation);
  }
}

