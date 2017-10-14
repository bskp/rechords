// TODO: Implement all Stuff related to transposing chords in major, minor keys...

/*
For Example: Gm

Gm, Cm Dm or D (with F#[not yet relevant])
Bb, Eb, F

*/

export class Key {
  constructor(name, idx) {
    this.name = name;
    this.idx = idx % 12;

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

export var ToBorSharp = {
  None: 0,
  Flat: 1,
  Sharp: 2
};

export class Scale {
    /**
     * 
     * @param {string} name 
     * @param {Array<number>} pitches 
     */
  constructor(name, pitches) {
    this.name = name;
    this.pitches = pitches;
  }

  /**
   * 
   * @param {number} base 
   * @param {number} pitch 
   */
  test(base, pitch) {
      return pitches.map(p_orig => base+p_orig)
      .some(p_shift => p_shift == pitch)

  }
}
export var Scales = {
  major: new Scale("Major", [0, 2, 4, 5, 7, 9, 11]),
  // harmonic is actually more often than "normal" minor
  harmonic: new Scale("Minor", [0, 2, 3, 5, 7, 8, 10]),
  minor: new Scale("Minor", [0, 2, 3, 5, 7, 8, 11])
};

export var keys = [
  // TODO: better structure (Map or Object[pseudo enum])

  new Key("F", 5),
  new Key("E", 4),
  new Key("Eb", 3),
  new Key("D#", 3),
  new Key("D", 2),
  new Key("Db", 1),
  new Key("C#", 1),
  new Key("C", 0),
  // new Key('Cb', -1),
  new Key("B", -1),
  new Key("H", -1),
  new Key("Hb", -1),
  new Key("Bb", -2),
  new Key("A#", -2),
  new Key("Ab", -3),
  new Key("G#", -3),
  new Key("G", -4),
  new Key("Gb", -5),
  new Key("F#", -5)
];

var forwardMap = new Map(keys.map(k => [k.name, k.idx]));

var bMap = new Map(
  keys.filter(k => k.beOrNot != ToBorSharp.Flat).map(k => [k.idx, k.name])
);

var shMap = new Map(
  keys.filter(k => k.beOrNot != ToBorSharp.Sharp).map(k => [k.idx, k.name])
);

class Chord {
  constructor(key, minorMajor) {
    this.key = key;
    this.minorMajor = minorMajor;
  }

  static minor(key) {
    return new Chord(key, Scale.minor);
  }

  static major(key) {
    return new Chord(key, Scale.major);
  }

  /**
     * 
     * @param {string} chordString 
     * @returns {Chord} 
     */
  static parseChordString(chordString) {
    let parsedChordString = chordString.match(/([a-h](#|b)?)(m?)(.+)/gi);

    let key = parsedChordString[0];

    if (parsedChordString[1] == "m") {
      return Chord.minor(key);
    } else {
      return Chords.major(key);
    }
  }

  get chordString() {
    let minMaj = this.scale == Scale.minor ? "m" : "";
    return this.key + minMaj;
  }
}

export default class ChrodLib {
  // tonart, moll, dur
  constructor(key, scale) {
    this.key = key;
    this.scale = scale;
  }

  //

  /**
     * 
     * @param {Array<String>} chordsList 
     */
  static guessKey(chordsList) {
    // just test every key (i mean its only 11)
    // and for every one make a penalty for every
    // "Tonart Fremde Chord"

    // Guessing would be easier using also
    // the minor/major information.
    // However, it should work already like that
    // Pitches are relative to c=0
    pitches = chordsList
      .map(chstr => Chord.parseChordString(chstr))
      .map(chord => chord.idx);

    for (scale in Scales) {
      let name = scale.name;
      for 
      scale.pitches
      
      
    }
  }

  // Non static function
  // in order to be able to
  // make transposing depending on the key of the song
  // so far stupid
  /**
     * 
     * @param {Array<String>} chordsList 
     */
  transpose(chordsList) {
    chords;
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
