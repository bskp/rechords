enum ToBorSharp {
  None,
  Flat,
  Sharp
}

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

  constructor(public name: string, idx: number) {
    this.idx = (idx + 48) % 12;

    if (name.endsWith('b')) {
      this.beOrNot = ToBorSharp.Flat;
    } else if (name.endsWith('#')) {
      this.beOrNot = ToBorSharp.Sharp;
    } else {
      this.beOrNot = ToBorSharp.None;
    }
    // todo: neutral, flat or sharp?
  }
  static parseName(name: string) {
    const idx = forwardMap.get(name.toUpperCase());
    return new Key(name, idx); 
  }
}


/* Since the number of notes is limited
and will not be extended, it is legit
to hardcode the notes and makes things
easier in this class.
*/

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
  C = new Key('C', 0);
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
];

const forwardMap: Map<string, number> = new Map();
keys.forEach(k => forwardMap.set(k.name, k.idx));

const bMap: Map<number, string> = new Map();
keys
  .filter(k => k.beOrNot != ToBorSharp.Sharp)
  .forEach(k => bMap.set(k.idx, k.name));

const shMap: Map<number,string> = new Map();
keys
  .filter(k => k.beOrNot != ToBorSharp.Flat)
  .forEach(k => shMap.set(k.idx, k.name));

// TODO: move to another file
class Scale {
  /**
     * 
     * @param {string} name 
     * @param {Array<number>} pitches 
     */
  public bmap: Map<number, ToBorSharp>;
  constructor(
    public name: string,
    public pitches: Array<number>,
    bmap: Map<Key, ToBorSharp>
  ) {
    this.bmap = new Map();
    bmap.forEach((val, key) => this.bmap.set(key.idx, val));
  }

  /**
   * 
   * @param {number} base 
   * @param {number} pitch 
   */
  // TODO: actually use this function
  test(base, pitch) {
    return this.pitches
      .map(p_orig => base + p_orig)
      .some(p_shift => p_shift == pitch);
  }
}
const Scales:{major: Scale, harmonic: Scale} = {
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
};

class Chord {
  idx: number;
  constructor(public key: Key, public keys: Array<number>, public str: string,
     public suff: string = '', public optional: boolean = false) {
    this.idx = key.idx;
  }

  /**
   * 
   * @param {Key} key 
   */
  static minor(key: Key, suff: string, optional: boolean) {
    const base = key.idx;
    const keys = [base, base + 3, base + 7].map(p => p % 12);
    return new Chord(key, keys, 'm', suff, optional);
  }

  static major(key: Key, suff: string, optional: boolean) {
    const base = key.idx;
    const keys = [base, base + 4, base + 7].map(p => p % 12);
    return new Chord(key, keys, '', suff, optional);
  }

  static plus(key: Key, suff: string, optional: boolean) {
    const base = key.idx;
    const keys = [base, base + 4, base + 8].map(p => p % 12);
    return new Chord(key, keys, '+', suff, optional);
  }
  static minus(key: Key, suff: string, optional: boolean) {
    const base = key.idx;
    const keys = [base, base + 3, base + 6].map(p => p % 12);
    return new Chord(key, keys, 'dim', suff, optional);
  }

  /**
     * 
     * @param {string} chordString 
     * @returns {Chord} 
     */
  static parseChordString(chordString) : Chord {

    const checkOptional:Array<string> = chordString.match(/(^\(?)([^)]*)(\)?)/);
    const content = checkOptional[2];
    let optional = false;
    if (checkOptional[1] && checkOptional[3]) {
      optional = true;
    }

    const parsedChordString = content.match(/()([a-h](#|b)?)(-|\+|m?(?!aj))(.*)/i);

    if (parsedChordString == null) return;

    let keystr = parsedChordString[2].charAt(0).toUpperCase();
    if ( parsedChordString[2].length > 1 ){
      keystr+=parsedChordString[2].charAt(1);
    }

    const keydx = forwardMap.get(keystr);
    if (keydx === undefined) return;  // The chord could not be parsed.

    const key = new Key(keystr, keydx);

    const suff = parsedChordString[5];


    if (parsedChordString[4] == 'm') {
      return Chord.minor(key, suff, optional);
    } else if (parsedChordString[4] == '+') {
      return Chord.plus(key, suff, optional);
    } else if (parsedChordString[4] == '-') {
      return Chord.minus(key, suff, optional);
    } else {
      return Chord.major(key, suff, optional);
    }
  }

}

export default class ChrodLib {
  // tonart, moll, dur

  //

  /**
     * 
     * @param {Array<String>} chordsList 
     * @returns { {scale: string, key: string}}
     */
  static guessKey(chordsList) {
    // just test every key (i mean its only 11)
    // and for every one make a penalty for every
    // "Tonart Fremde Chord"

    // Guessing would be easier using also
    // the minor/major information.
    // However, it should work already like that
    // Pitches are relative to c=0

    // Haha, this comment is completely not understandable by me myself after 2 days...
    const keyss = ChrodLib.covarianceWithScales(chordsList);
    return ChrodLib.selectBest(keyss);
  }

  static parseTag(tag: string) : {key: string, scale: string} {
    const res = tag.match(/([A-H]b?#?)-?(\w*)/i);

    const fuzzy_scales = new Map([
      ['m', Scales.harmonic],
      ['', Scales.major],
      ['minor', Scales.harmonic],
      ['dur', Scales.major],
      ['major', Scales.major],
      ['moll', Scales.harmonic]
    ]);

    if (!res) return;

    const scale_str = res[2];
    const scale = fuzzy_scales.get(scale_str.toLowerCase());
    const key = Key.parseName(res[1]);
    return {key: key.name, scale: scale.name};
  }

  /**
   * 
   * @param {} keyss List of Scales and 
   */
  static selectBest(keyss) {
    let best_val = -1000;
    let best: { scale: string; key: string };

    for (const scalename of Object.getOwnPropertyNames(keyss)) {
      const scale = keyss[scalename];
      for (const key of Object.getOwnPropertyNames(scale)) {
        const val = scale[key];
        //console.debug(val);
        if (val > best_val) {
          best_val = val;
          best = { scale: scalename, key: key };
          //console.debug("setting best", best);
        }
      }
    }
    return best;
  }
  /**
   * 
   * @param {Array<String>} chordsList 
   * @returns {*} penalties
   */
  static covarianceWithScales(chordsList) {
    let chords: Chord[] = chordsList.map(chstr =>
      Chord.parseChordString(chstr)
    );
    chords = chords.filter(chord => chord !== undefined);
    const pitches = chords.reduce((ar, chord) => ar.concat(chord.keys), []);
    //console.debug(pitches);

    const penalties_byScale = {};
    const pitch_match_byScale = {};
    for (const scalename of Object.getOwnPropertyNames(Scales)) {
      const scale = Scales[scalename];

      //console.debug(scale);
      const penalties = {};
      const pitchmatch = {};
      for (let i = 0; i < 12; i++) {
        const shifted_scale = scale.pitches.map(p => (p + i) % 12);
        //console.debug(shifted_scale);
        const matches = pitches
          // TODO: use reduce and weight the grundton more
          .map(shifted => shifted_scale.some(p => p == shifted));

        const pentalty = matches.reduce(
          (sum, val) => (val ? sum + 2 : sum - 1),
          0
        );

        pitchmatch[bMap.get(i)] = matches;
        penalties[bMap.get(i)] = pentalty;
      }
      penalties_byScale[scale.name] = penalties;
    }
    //console.log(penalties_byScale);
    return penalties_byScale;
  }

  // Static interface. TMP.
  // TBD: scale/key as instance fields.
  /**
     * 
     * @param {Array<String>} chordsList 
     * @param {number} shift
     */

  transpose(chord: string, meta: {scale: string; key: string}, shift: number) {
    const current_pitch = forwardMap.get(meta.key);
    const current_scale: Scale = Scales[meta.scale];

    const transposed_pitch = (current_pitch + 48 + shift) % 12;
    const ch = Chord.parseChordString(chord);
    if (ch === undefined) return null;

    let bornot = ch.key.beOrNot;
    if( bornot == ToBorSharp.None || current_scale.pitches.indexOf(ch.idx) > -1 ) {
      bornot = current_scale.bmap.get(transposed_pitch);
    } 
    const pitchmap = bornot == ToBorSharp.Sharp ? shMap : bMap;


    let base = pitchmap.get((ch.idx + 48 + shift) % 12);
    // Create pitchmap class to 
    if (ch.str[0] == 'm') {
      base = base.toLowerCase();
    }

    const suff = this.shift_suff(ch.suff, shift, pitchmap);

    let clazz = 'chord';

    if (ch.optional) {
      clazz += ' optional';
    }

    return {
      base: base + ch.str,
      suff: suff,
      className: clazz
    };
    //return <span className="before {clazz}">{base}{ch.str}<sup>{suff}</sup></span>;
  }

  private shift_suff(suff: string, shift:number, pitchmap: Map<number, string>) : string {
    const match = suff.match(/[A-H](b|#)?/);
    if (match == null) {
      return suff;
    } else {
      const orig:string = match[0];
      const orig_idx = forwardMap.get(orig);
      const idx = (orig_idx+48+shift)%12;
      const result = pitchmap.get(idx);

      return suff.replace(orig, result);
       


    }

  }



  transposeAll(chordsList: string[], shift: number) {
    if (!chordsList || chordsList.length == 0) {
      return [];
    }
    const scale = ChrodLib.guessKey(chordsList);
    //console.debug(scale);

    const current_pitch = forwardMap.get(scale.key);

    // TODO: scales should be a map
    // generated from an external json file, ideally
    const current_scale = Scales[scale.scale];

    const transposed_pitch = (current_pitch + 48 + shift) % 12;

    // TODO: attach a transpose function to Scale object
    const bornot = current_scale.bmap.get(transposed_pitch);

    let pitchmap;
    if (bornot == ToBorSharp.Flat) {
      pitchmap = bMap;
    } else {
      pitchmap = shMap;
    }
    // Todo: chord should shift itself -> chord.transpose()
    const tr_chords = chordsList
      .map(ch_str => Chord.parseChordString(ch_str))
      .map(ch => pitchmap.get((ch.idx + 48 + shift) % 12) + ch.str + ch.suff);

    const transposed_key = pitchmap.get(transposed_pitch);
    //console.debug("Transposed Key", transposed_key);
    //console.debug(tr_chords);
    return tr_chords;
    // TODO: generate new chords list
  }

  /**
     * 
     * @param {String} chord 
     */
  shift(scale: {key: string, scale: string}, shift: number) :
  {key: string, scale: string}
  {
    const keyobj = Key.parseName(scale.key);
    const scaleobj: Scale = Scales[scale.scale];

    // TODO: one function for the modulo shit
    const tr_idx = (keyobj.idx+shift+48)%12;
    const bornot = scaleobj.bmap.get(tr_idx);
    let  key: string;
    if (bornot == ToBorSharp.Sharp) {
      key = shMap.get(tr_idx);
    } else {
      key = bMap.get(tr_idx);
    }
    return {key: key, scale: scale.scale};

  }
}

export { Key, Chord, Scale };
