# Soundfont

Piano samples for the chord playback in the viewer and the editor, so that the
app does not have to reach out to a CDN for them.

- Source: [FluidR3_GM](https://member.keymusician.com/Member/FluidR3_GM/index.html)
  by Frank Wen, as prepared for MIDI.js by [gleitz](https://github.com/gleitz/midi-js-soundfonts)
  and mirrored by [paulrosen](https://github.com/paulrosen/midi-js-soundfonts),
  whose layout abcjs expects.
- Licence: [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/us/)
  — keep the attribution above when redistributing.

Only the notes the app can actually produce are kept here: E2 (MIDI 40) to Eb6
(MIDI 87). The low end is the bass anchor of `chordToMidiPitches`, the high end
its highest chord anchor plus a thirteenth. Change the anchors in
`imports/api/libchr0d/voicing.ts` and this range has to grow with them:

```sh
cd app/public/soundfonts/acoustic_grand_piano-mp3
for n in $(node -e 'const m=require("../../../node_modules/abcjs/src/synth/pitch-to-note-name.js");
  const o=[]; for (let p=40; p<=87; p++) o.push(m[p]); console.log(o.join(" "))'); do
  curl -sfS -O "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/$n.mp3"
done
```
