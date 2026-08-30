# Soundfonts

Samples for the chord playback in the viewer and the editor, so that the app
does not have to reach out to a CDN for them: a piano, and a steel-strung
guitar for the chords played as they are fingered.

- Source: [FluidR3_GM](https://member.keymusician.com/Member/FluidR3_GM/index.html)
  by Frank Wen, as prepared for MIDI.js by [gleitz](https://github.com/gleitz/midi-js-soundfonts)
  and mirrored by [paulrosen](https://github.com/paulrosen/midi-js-soundfonts),
  whose layout abcjs expects.
- Licence: [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/us/)
  — keep the attribution above when redistributing.

Only the notes the app can actually produce are kept here: E2 (MIDI 40) to Eb6
(MIDI 87). The low end is the bass anchor of `chordToMidiPitches` and the lowest
string of a guitar alike, the high end that voicing's highest anchor plus a
thirteenth. Change the anchors in `imports/api/libchr0d/voicing.ts` and this
range has to grow with them.

The folder names are what abcjs derives from the General MIDI program numbers in
`imports/ui/audio/chordPlayer.ts` — 0 is the piano, 25 the steel-strung guitar,
24 the nylon-strung one, should it ever be preferred. To fetch a set:

```sh
instrument=acoustic_guitar_steel
mkdir -p "app/public/soundfonts/$instrument-mp3" && cd "$_"
for n in $(node -e 'const m=require("../../../node_modules/abcjs/src/synth/pitch-to-note-name.js");
  const o=[]; for (let p=40; p<=87; p++) o.push(m[p]); console.log(o.join(" "))'); do
  curl -sfS -O "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/$instrument-mp3/$n.mp3"
done
```
