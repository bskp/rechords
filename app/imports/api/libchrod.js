var ToBorSharp = {
  None: 0,
  Flat: 1,
  Sharp: 2
};

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
  constructor(name, idx) {
    this.name = name;
    this.idx = (idx + 12) % 12;

    if (name.endsWith("b")) {
      this.beOrNot = ToBorSharp.Flat;
    } else if (name.endsWith("#")) {
      this.beOrNot = ToBorSharp.Sharp;
    } else {
      this.beOrNot = ToBorSharp.None;
    }
    // todo: neutral, flat or sharp?
  }
}

// TODO: Implement all Stuff related to transposing chords in major, minor keys...
/*
var ChordScales = {
  major: new ChordScale('Major', 'C Dm Em F G Am H-')
}
*/

// TODO: better structure (Map or Object[pseudo enum])

var B = new Key("B", 11),
  H = new Key("H", 11),
  Hes = new Key("Hb", 10),
  Bes = new Key("Bb", 10),
  Ais = new Key("A#", 10),
  A = new Key("A", 9),
  As = new Key("Ab", 8),
  Gis = new Key("G#", 8),
  G = new Key("G", 7),
  Ges = new Key("Gb", 6),
  Fis = new Key("F#", 6),
  F = new Key("F", 5),
  E = new Key("E", 4),
  Es = new Key("Eb", 3),
  Dis = new Key("D#", 3),
  D = new Key("D", 2),
  Des = new Key("Db", 1),
  Cis = new Key("C#", 1),
  C = new Key("C", 0);
// new Key('Cb', -1),
var keys = [
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
  Hes,
  B,
  H
];

var forwardMap = new Map(keys.map(k => [k.name, k.idx]));

var bMap = new Map(
  keys.filter(k => k.beOrNot != ToBorSharp.Sharp).map(k => [k.idx, k.name])
);

var shMap = new Map(
  keys.filter(k => k.beOrNot != ToBorSharp.Flat).map(k => [k.idx, k.name])
);

class Scale {
  /**
     * 
     * @param {string} name 
     * @param {Array<number>} pitches 
     */
  constructor(name, pitches, bmap) {
    this.name = name;
    this.pitches = pitches;

    this.bmap = new Map();
    for (var [key, value] of bmap) {
      console.debug(key, value);
      this.bmap.set(key.idx, value);
    }
  }

  /**
   * 
   * @param {number} base 
   * @param {number} pitch 
   */
  // TODO: actually use this function
  test(base, pitch) {
    return pitches
      .map(p_orig => base + p_orig)
      .some(p_shift => p_shift == pitch);
  }
}
var Scales = {
  // Arg, the harmonic depends on which cord is being played
  major: new Scale(
    "major",
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
      [H, ToBorSharp.Sharp],
      [Fis, ToBorSharp.Sharp]
    ])
  ),
  // harmonic is actually more often than "normal" minor
  harmonic: new Scale(
    "major",
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
      [H, ToBorSharp.Sharp],
      [Fis, ToBorSharp.Sharp],
      [Cis, ToBorSharp.Sharp],
      [Gis, ToBorSharp.Sharp]
      // [Dis, ToBorSharp.Sharp]
    ])
  )
  // minor: new Scale("Minor", [0, 2, 3, 5, 7, 8, 10])
};

class Chord {
  // TODO: string rep?
  constructor(key, pitches, str) {
    this.key = key;
    this.idx = key.idx;
    this.keys = pitches;
    this.str = str;
  }

  /**
   * 
   * @param {Key} key 
   */
  static minor(key) {
    base = key.idx;
    keys = [base, base + 3, base + 7].map(p => p % 12);
    return new Chord(key, keys, 'm');
  }

  static major(key) {
    base = key.idx;
    keys = [base, base + 4, base + 7].map(p => p % 12);
    return new Chord(key, keys, '');
  }

  static plus(key) {
    base = key.idx;
    keys = [base, base + 4, base + 8].map(p => p % 12);
    return new Chord(key, keys, '+');
  }
  static minus(key) {
    base = key.idx;
    keys = [base, base + 3, base + 6].map(p => p % 12);
    return new Chord(key, keys, 'dim');
  }

  /**
     * 
     * @param {string} chordString 
     * @returns {Chord} 
     */
  static parseChordString(chordString) {
    let parsedChordString = chordString.match(/([a-h](#|b)?)(-|\+|m?)(.*)/i);

    let keystr = parsedChordString[1].toUpperCase();

    let keydx = forwardMap.get(keystr);

    let key = new Key(keystr, keydx);

    if (parsedChordString[3] == "m") {
      return Chord.minor(key);
    } else if (parsedChordString[3] == "+") {
      return Chord.plus(key);
    } else if (parsedChordString[3] == "-") {
      return Chord.minus(key);
    } else {
      return Chord.major(key);
    }
  }

  get chordString() {
    return this.key + this.str;
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
    let keyss = ChrodLib.covarianceWithScales(chordsList);
    return ChrodLib.selectBest(keyss);
  }
  /**
   * 
   * @param {} keyss List of Scales and 
   */
  static selectBest(keyss) {
    let best_val = -1000;
    let best = {};

    for (scalename of Object.getOwnPropertyNames(keyss)) {
      scale = keyss[scalename];
      for (key of Object.getOwnPropertyNames(scale)) {
        let val = scale[key];
        console.debug(val);
        if (val > best_val) {
          best_val = val;
          best = { scale: scalename, key: key };
          console.debug("setting best", best);
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
    pitches = chordsList
      .map(chstr => Chord.parseChordString(chstr))
      .reduce((ar, chord) => ar.concat(chord.keys), []);
    console.debug(pitches);

    let penalties_byScale = {};
    let pitch_match_byScale = {};
    for (scalename of Object.getOwnPropertyNames(Scales)) {
      scale = Scales[scalename];

      console.debug(scale);
      let penalties = {};
      let pitchmatch = {};
      for (var i = 0; i < 12; i++) {
        let shifted_scale = scale.pitches.map(p => (p + i) % 12);
        console.debug(shifted_scale);
        let matches = pitches
          // TODO: use reduce and weight the grundton more
          .map(shifted => shifted_scale.some(p => p == shifted));

        let pentalty = matches.reduce((sum, val) => (val ? sum + 2 : sum - 1));

        pitchmatch[bMap.get(i)] = matches;
        penalties[bMap.get(i)] = pentalty;
      }
      penalties_byScale[scale.name] = penalties;
    }
    console.log(penalties_byScale);
    return penalties_byScale;
  }

  // Non static function
  // in order to be able to
  /**
     * 
     * @param {Array<String>} chordsList 
     * @param {number} shift
     */

  transpose(chordsList, shift) {
    let scale = ChrodLib.guessKey(chordsList);
    console.debug(scale);

    let current_pitch = forwardMap.get(scale.key);

    // TODO: scales should be a map
    // generated from an external json file, ideally
    let current_scale = Scales[scale.scale];

    let transposed_pitch = (current_pitch + 12 + shift) % 12;

    // TODO: attach a transpose function to Scale object
    let bornot = current_scale.bmap.get(transposed_pitch);
    
    let pitchmap;
    if (bornot == ToBorSharp.Flat) {
      pitchmap = bMap;
    } else {
      pitchmap = shMap;
    }
    let tr_chords = chordsList.map( ch_str => Chord.parseChordString(ch_str))
    .map(ch => pitchmap.get((ch.idx+12+shift)%12)+ch.str)
    console.debug("Transposed Key", transposed_key);
    console.debug(tr_chords);
    return tr_chords;
    // TODO: generate new chords list
  }

  /**
     * 
     * @param {String} chord 
     */
  transposeSingle(chord) {
    if (chord.key.beOrNot) {
    }
  }
}

export { Key, Chord, Scale };
