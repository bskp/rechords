import Note from "/imports/api/libchr0d/note";

type Quality = 'major' | 'minor' | 'diminished' | 'augmented';

export default class Chord_ {

  public constructor(
    public readonly key: Note,
    public readonly quality: Quality,
    public readonly tensions: string,
    public readonly slash?: Note,
  ) {
  }

  public static from(chordString: string): Chord_ | undefined {
    const isOptional = chordString.startsWith('(') && chordString.endsWith(')');

    if (isOptional) {
      chordString = chordString.substring(1, chordString.length - 2);
    }

    const match = chordString.match(/([a-h][#b]?)(maj7|m|\+|-|°|dim|aug|)([^\s\/]*)(?:\/([a-h][#b]?))?/i);
    if (!match) {
      return undefined;
    }

    const [_, keystr, qualityStr, schmuck, slash] = match;

    const quality = ((q: string): Quality => {
      switch (q) {
        case 'm':
        case '-':
          return 'minor';
        case 'aug':
        case '+':
          return 'augmented';
        case '°':
        case 'dim':
          return 'diminished';
        default:
          return 'major';
      }
    })(qualityStr);

    const key = Note.from(keystr);
    if (key === undefined) return undefined;

    return new Chord_(key, quality, schmuck, Note.from(slash))
  }

  public transposed(semitones: number) {
    return new Chord_(this.key.transposed(semitones), this.quality, this.tensions, this.slash?.transposed(semitones));
  }

  public asCode() {
    // Used to style the circle of fifths
    return (this.quality === 'minor' ? 'm' : 'M') + (this.key.value);
  }

  public asAngle() {
    const offset = (this.quality === 'minor') ? 3 : 0;
    const lookup = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
    return 360 - lookup[this.key.value + offset]*30;
  }
}
