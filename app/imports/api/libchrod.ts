enum ToBorSharp {
  None,
  Flat,
  Sharp
}

type Penalties = { [k in KeyLetter]?: number; };
/*
For Example: Gm

Gm, Cm Dm or D (with F#[not yet relevant])
Bb, Eb, F

*/
class Key {
  /**
   * 
   * @param {String} name 
   * @param {Number} idx 
   */
  idx: number;
  beOrNot: ToBorSharp;

  constructor(public name: KeyLetter, idx: number) {
    this.idx = (idx + 48) % 12

    if (name.endsWith('b')) {
      this.beOrNot = ToBorSharp.Flat
    } else if (name.endsWith('#')) {
      this.beOrNot = ToBorSharp.Sharp
    } else {
      this.beOrNot = ToBorSharp.None
    }
    // todo: neutral, flat or sharp?
  }
  static parseName(name: string): Key {
    const key = forwardMapObj.get(<KeyLetter>name.toUpperCase())
    return key
  }
}


/* Since the number of notes is limited
and will not be extended, it is legit
to hardcode the notes and makes things
easier in this class.
*/

type KeyLetter = 'B' | 'H' | 'Bb' | 'A#' | 'A' | 'Ab' | 'G#' | 'G' | 'Gb' | 'F#' | 'F' |
  'E#' | 'E' | 'Eb' | 'D#' | 'D' | 'Db' | 'C#' | 'C'


const B = new Key('B', 11),
  H = new Key('H', 11),
  Bes = new Key('Bb', 10),
  Ais = new Key('A#', 10),
  A = new Key('A', 9),
  As = new Key('Ab', 8),
  Gis = new Key('G#', 8),
  G = new Key('G', 7),
  Ges = new Key('Gb', 6),
  Fis = new Key('F#', 6),
  F = new Key('F', 5),
  E = new Key('E', 4),
  Es = new Key('Eb', 3),
  Dis = new Key('D#', 3),
  D = new Key('D', 2),
  Des = new Key('Db', 1),
  Cis = new Key('C#', 1),
  C = new Key('C', 0)
const keys: Array<Key> = [
  C,
  Cis,
  Des,
  D,
  Dis,
  Es,
  E,
  F,
  Fis,
  Ges,
  G,
  Gis,
  As,
  A,
  Ais,
  Bes,
  H,
  B,
]

const forwardMap: Map<KeyLetter, number> = new Map()
keys.forEach(k => forwardMap.set(k.name, k.idx))

const forwardMapObj: Map<KeyLetter, Key> = new Map(keys.map(k => [k.name, k]))

const bMap: Map<number, KeyLetter> = new Map()
keys
  .filter(k => k.beOrNot != ToBorSharp.Sharp)
  .forEach(k => bMap.set(k.idx, k.name))

const shMap: Map<number, KeyLetter> = new Map()
keys
  .filter(k => k.beOrNot != ToBorSharp.Flat)
  .forEach(k => shMap.set(k.idx, k.name))

// TODO: move to another file
class Scale {
  /**
     * 
     * @param {string} name 
     * @param {Array<number>} pitches 
     */
  public bmap: Map<number, ToBorSharp>;
  constructor(
    public name: keyof Scales,
    public pitches: Array<number>,
    bmap: Map<Key, ToBorSharp>
  ) {
    this.bmap = new Map()
    bmap.forEach((val, key) => this.bmap.set(key.idx, val))
  }

  /**
   * 
   * @param {number} base 
   * @param {number} pitch 
   */
  test(base: number, pitch: number): boolean {
    return this.pitches
      .map(p_orig => base + p_orig)
      .some(p_shift => p_shift == pitch)
  }
}
type Scales = Record<string, Scale>

const Scales: Scales = {
  // Arg, the harmonic depends on which cord is being played
  major: new Scale(
    'major',
    [0, 2, 4, 5, 7, 9, 11],
    new Map([
      [C, ToBorSharp.None],
      [F, ToBorSharp.Flat],
      [Bes, ToBorSharp.Flat],
      [Es, ToBorSharp.Flat],
      [As, ToBorSharp.Flat],
      [Des, ToBorSharp.Flat],
      // [Ges, ToBorSharp.Flat], -> Fis
      // [Ces, ToBorSharp.Flat], -> H
      [G, ToBorSharp.Sharp],
      [D, ToBorSharp.Sharp],
      [A, ToBorSharp.Sharp],
      [E, ToBorSharp.Sharp],
      [B, ToBorSharp.Sharp],
      [Fis, ToBorSharp.Sharp]
    ])
  ),
  // harmonic is actually more often than "normal" minor
  harmonic: new Scale(
    'harmonic',
    [0, 2, 3, 5, 7, 8, 11],
    new Map([
      [A, ToBorSharp.None],
      //B
      [D, ToBorSharp.Flat],
      [G, ToBorSharp.Flat],
      [C, ToBorSharp.Flat],
      [F, ToBorSharp.Flat],
      [Bes, ToBorSharp.Flat],
      [Es, ToBorSharp.Flat],
      // [Ces, ToBorSharp.Flat], -> H
      [E, ToBorSharp.Sharp],
      [B, ToBorSharp.Sharp],
      [Fis, ToBorSharp.Sharp],
      [Cis, ToBorSharp.Sharp],
      [Gis, ToBorSharp.Sharp]
      // [Dis, ToBorSharp.Sharp]
    ])
  )
  // minor: new Scale("Minor", [0, 2, 3, 5, 7, 8, 10])
}

class Chord {
  idx: number;
  constructor(public key: Key, public keys: Array<number>, public str: string,
    public suff: string = '', public optional: boolean = false) {
    this.idx = key.idx
  }

  /**
   * 
   * @param {Key} key 
   */
  static minor(key: Key, suff: string, optional: boolean): Chord {
    const base = key.idx
    const keys = [base, base + 3, base + 7].map(p => p % 12)
    return new Chord(key, keys, 'm', suff, optional)
  }

  static major(key: Key, suff: string, optional: boolean): Chord {
    const base = key.idx
    const keys = [base, base + 4, base + 7].map(p => p % 12)
    return new Chord(key, keys, '', suff, optional)
  }

  static plus(key: Key, suff: string, optional: boolean): Chord {
    const base = key.idx
    const keys = [base, base + 4, base + 8].map(p => p % 12)
    return new Chord(key, keys, '+', suff, optional)
  }
  static minus(key: Key, suff: string, optional: boolean): Chord {
    const base = key.idx
    const keys = [base, base + 3, base + 6].map(p => p % 12)
    return new Chord(key, keys, 'dim', suff, optional)
  }

  /**
     * 
     * @param {string} chordString 
     * @returns {Chord} 
     */
  static parseChordString(chordString: string): Chord {

    const checkOptional: Array<string> = chordString.match(/(^\(?)([^)]*)(\)?)/)
    const content = checkOptional[2]
    let optional = false
    if (checkOptional[1] && checkOptional[3]) {
      optional = true
    }

    const parsedChordString = content.match(/()([a-h](#|b)?)(-|\+|m?(?!aj))(.*)/i)

    if (parsedChordString == null) return

    let keystr = parsedChordString[2].charAt(0).toUpperCase()
    if (parsedChordString[2].length > 1) {
      keystr += parsedChordString[2].charAt(1)
    }

    const key = forwardMapObj.get(<KeyLetter>keystr)
    if (key === undefined) return  // The chord could not be parsed.

    const suff = parsedChordString[5]

    if (parsedChordString[4] == 'm') {
      return Chord.minor(key, suff, optional)
    } else if (parsedChordString[4] == '+') {
      return Chord.plus(key, suff, optional)
    } else if (parsedChordString[4] == '-') {
      return Chord.minus(key, suff, optional)
    } else {
      return Chord.major(key, suff, optional)
    }
  }

}

interface KeyAndScale {
  scaleName: string;
  key: KeyLetter;
}

export default class ChrodLib {
  // tonart, moll, dur

  //

  /**
     * 
     * @param {Array<String>} chordsList 
     */
  static guessKey(chordsList: string[]): KeyAndScale {
    // just test every key (Its only 11)
    // and for every one make a penalty for every
    // "Tonart Fremde Chord"

    // Guessing would be more accurate 
    // the minor/major information as well.
    // However, it should work already like that
    // Pitches are relative to c=0

    const keyss = ChrodLib.covarianceWithScales(chordsList)
    return ChrodLib.selectBest(keyss)
  }

  static parseTag(tag: string): KeyAndScale {
    const res = tag.match(/([A-H]b?#?)-?(\w*)/i)

    const fuzzy_scales = new Map([
      ['m', Scales.harmonic],
      ['', Scales.major],
      ['minor', Scales.harmonic],
      ['dur', Scales.major],
      ['major', Scales.major],
      ['moll', Scales.harmonic]
    ])

    if (!res) return

    const scale_str = res[2]
    const scale = fuzzy_scales.get(scale_str.toLowerCase())
    const key = Key.parseName(res[1])
    return { key: key.name, scaleName: scale.name }
  }

  static selectBest(keyss: { [x: string]: Penalties; }): KeyAndScale {
    let bestValue = -1000
    let best: KeyAndScale
    for (const scalename of Object.keys(keyss)) {
      const scale = keyss[scalename]
      for (const key of (Object.keys(scale) as KeyLetter[])) {
        const currentValue = scale[key]
        //console.debug(val);
        if (currentValue > bestValue) {
          bestValue = currentValue
          best = { scaleName: scalename, key: key }
          //console.debug("setting best", best);
        }
      }
    }
    return best
  }
  /**
   * 
   * @param {Array<String>} chordsList 
   * @returns {*} penalties
   */
  static covarianceWithScales(chordsList: Array<string>): { [k: string]: Penalties; } {
    let chords: Chord[] = chordsList.map(chstr =>
      Chord.parseChordString(chstr)
    )
    chords = chords.filter(chord => chord !== undefined)
    const pitches: number[] = chords.reduce((ar, chord) => ar.concat(chord.keys), new Array<number>())
    //console.debug(pitches);
    const penaltiesByScale: { [k: string]: Penalties } = {}

    for (const scale of Object.values(Scales)) {

      const penalties: Penalties = {}
      const pitchmatch: Record<string, boolean[]> = {}
      for (let i = 0; i < 12; i++) {
        const shiftedScale = scale.pitches.map(p => (p + i) % 12)
        //console.debug(shifted_scale);
        const matches = pitches
          // TODO: use reduce and weight the grundton more
          .map(shifted => shiftedScale.some(p => p == shifted))

        const pentalty = matches.reduce(
          (sum, val) => (val ? sum + 2 : sum - 1),
          0
        )

        const note = bMap.get(i)
        pitchmatch[note] = matches
        penalties[bMap.get(i)] = pentalty
      }
      penaltiesByScale[scale.name] = penalties
    }
    //console.log(penalties_byScale);
    return penaltiesByScale
  }

  // Static interface. TMP.
  // TBD: scale/key as instance fields.
  /**
     * 
     * @param {Array<String>} chordsList 
     * @param {number} shift
     */

  transpose(chord: string, meta: KeyAndScale, shift: number) {
    if (!chord) return undefined
    const currentPitch = forwardMap.get(meta.key)
    const currentScale: Scale = Scales[meta.scaleName]

    const transposedPitch = (currentPitch + 48 + shift) % 12
    const ch = Chord.parseChordString(chord)
    if (ch === undefined) return undefined

    let bornot = ch.key.beOrNot
    if (bornot == ToBorSharp.None || currentScale.pitches.indexOf(ch.idx) > -1) {
      bornot = currentScale.bmap.get(transposedPitch)
    }
    const pitchmap = bornot == ToBorSharp.Sharp ? shMap : bMap

    let base: string = pitchmap.get((ch.idx + 48 + shift) % 12)
    // Create pitchmap class to 
    if (ch.str[0] == 'm') {
      base = base.toLowerCase()
    }

    const suff = this.shiftSuffix(ch.suff, shift, pitchmap)

    let clazz = 'chord'

    if (ch.optional) {
      clazz += ' optional'
    }

    return {
      base: base + ch.str,
      suff: suff,
      className: clazz
    }
    //return <span className="before {clazz}">{base}{ch.str}<sup>{suff}</sup></span>;
  }

  private shiftSuffix(suff: string, shift: number, pitchmap: Map<number, string>): string {
    const match = suff.match(/[A-H](b|#)?/)
    if (match == null) {
      return suff
    } else {
      const orig = <KeyLetter>match[0]
      const origIdx = forwardMap.get(orig)
      const idx = (origIdx + 48 + shift) % 12
      const result = pitchmap.get(idx)

      return suff.replace(orig, result)
    }
  }

  transposeAll(chordsList: string[], shift: number): string[] {
    if (!chordsList || chordsList.length == 0) {
      return []
    }
    const scale = ChrodLib.guessKey(chordsList)
    //console.debug(scale);

    const currentPitch = forwardMap.get(scale.key)

    // TODO: scales should be a map
    // generated from an external json file, ideally
    const currentScale = Scales[scale.scaleName]

    const transposedPitch = (currentPitch + 48 + shift) % 12

    // TODO: attach a transpose function to Scale object
    const bornot = currentScale.bmap.get(transposedPitch)

    let pitchmap: Map<number, KeyLetter>
    if (bornot == ToBorSharp.Flat) {
      pitchmap = bMap
    } else {
      pitchmap = shMap
    }
    // Todo: chord should shift itself -> chord.transpose()
    const transposeChords = chordsList
      .map(s => Chord.parseChordString(s))
      .map(ch => pitchmap.get((ch.idx + 48 + shift) % 12) + ch.str + ch.suff)

    const transposed_key = pitchmap.get(transposedPitch)
    //console.debug("Transposed Key", transposed_key);
    //console.debug(tr_chords);
    return transposeChords
    // TODO: generate new chords list
  }

  /**
     * 
     * @param {String} chord 
     */
  shift(scale: KeyAndScale, shift: number): KeyAndScale {
    const keyObj = Key.parseName(scale.key)
    const scaleObj: Scale = Scales[scale.scaleName]

    const idx = (keyObj.idx + shift + 48) % 12
    const bornot = scaleObj.bmap.get(idx)
    let key: KeyLetter
    if (bornot == ToBorSharp.Sharp) {
      key = shMap.get(idx)
    } else {
      key = bMap.get(idx)
    }
    return { key, scaleName: scale.scaleName }
  }
}

export { Key, Chord, Scale, KeyLetter, KeyAndScale }
