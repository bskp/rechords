import * as React from "react";
import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { Columns, Landscape, Portrait } from "../GuiElements/SettingIcons";
import { HlbSliderWithInput } from "../GuiElements/HlbSliderWithInput";
import { ReactSVG } from "react-svg";
import Transposer, { useTranspose } from "../Transposer";
import { getTransposeFromTag, parseChords } from "../Viewer";
import { Song } from "/imports/api/collections";
import Chord from "/imports/api/libchr0d/chord";
import { Button } from "../Button";
import { HlbCheckbox } from "../GuiElements/HlbCheckbox";

// Using provider in order to guarantee
// new properties each time
const PdfViewerStates: () => IPdfViewerSettings = () => ({
  numCols: 3,
  orientation: "l",
  compactChordonly: true,
  inlineReferences: false,
  includeComments: false,
  transpose: 0,
  fontSizes: {
    header: 25,
    section: 15,
    text: 13,
    chord: 11,
    footer: 9,
  },
  factors: {
    text: 1,
    chord: 1,
  },
  layoutSettings: {
    margin: 12,
    section: 10,
    colgap: 3,
  },
});

export interface IPdfViewerSettings {
  numCols: number;
  orientation: "l" | "p";
  inlineReferences: boolean;
  includeComments: boolean;
  compactChordonly: boolean;
  fontSizes: ITextSizes;
  layoutSettings: ILayoutSettings;
  transpose: number | undefined;
  factors: {
    text: number;
    chord: number;
  };
}

export interface ILayoutSettings {
  colgap: number;
  margin: number;
  section: number;
}

export interface ITextSizes {
  header: number;
  section: number;
  text: number;
  chord: number;
  footer: number;
}

export const PdfSettings: FunctionComponent<{
  song: Song;
  consumer: (s: IPdfViewerSettings) => void;
}> = ({ song, consumer }) => {
  // on purpose a single state to save / deserialize easily
  const [state, setState] = useState(PdfViewerStates());

  const set = (a: IPdfViewerSettings) => {
    setState(a);
    consumer(a);
  };

  useEffect(() => set(state), []);

  const handleColChange = (cols: number) => {
    set({ ...state, numCols: cols });
  };
  const handleOrientationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    set({ ...state, orientation: event.currentTarget.value });
  };

  const setInlineRefs = (val: boolean) => {
    set({ ...state, inlineReferences: val });
  };

  const setComments = (val: boolean) => {
    set({ ...state, includeComments: val });
  };

  const setCompactness = (val: boolean) => {
    set({ ...state, compactChordonly: val });
  };

  const handleFontSize = (name: keyof ITextSizes, value: number) => {
    const newFontSizes = state.fontSizes;
    newFontSizes[name] = value;
    set(
      // copying object in order not having to detect the state change in deep @componentDidUpdate
      { ...state, fontSizes: newFontSizes },
    );
  };
  const handleLayoutSize = (name: keyof ILayoutSettings, value: number) => {
    const newFontSizes = state.layoutSettings;
    newFontSizes[name] = value;
    set(
      // copying object in order not having to detect the state change in deep @componentDidUpdate
      { ...state, layoutSettings: newFontSizes },
    );
  };
  const handleFactors = (name: "chord" | "text", value: number) => {
    const newFontSizes = state.factors;
    newFontSizes[name] = value;
    set(
      // copying object in order not having to detect the state change in deep @componentDidUpdate
      { ...state, factors: newFontSizes },
    );
  };

  const orientations: [string, ReactElement, string][] = [
    // eslint-disable-next-line react/jsx-key
    ["p", Portrait, "Portrait: 210mm x 297mm"],
    ["l", Landscape, "Landscape: 297mm x 210mm"],
  ];

  const baseSizes = PdfViewerStates();

  // Assuming fontSizes is an object
  const fontSizeHandles = (
    Object.keys(state.fontSizes) as (keyof ITextSizes)[]
  ).map((fs) => (
    <div className="fontsize" key={fs}>
      <label htmlFor={"font" + fs}>{fs}</label>
      <HlbSliderWithInput
        min={0}
        max={baseSizes.fontSizes[fs] * 3 - 1}
        value={state.fontSizes[fs]}
        onChange={(s) => handleFontSize(fs, s)}
        id={"font" + fs}
      />
    </div>
  ));

  const factors = (Object.keys(state.factors) as ("text" | "chord")[]).map(
    (fs) => (
      <div className="fontsize">
        <label htmlFor={"font" + fs}>{fs}</label>
        <HlbSliderWithInput
          min={0.05}
          max={baseSizes.factors[fs] * 3}
          value={state.factors[fs]}
          step={0.1}
          onChange={(s) => handleFactors(fs, s)}
          id={"font" + fs}
        />
      </div>
    ),
  );

  const layoutHandles = (
    Object.keys(state.layoutSettings) as (keyof ILayoutSettings)[]
  ).map((fs) => (
    <div className="fontsize">
      <label htmlFor={"font" + fs}>{fs}</label>
      <HlbSliderWithInput
        min={0}
        max={baseSizes.layoutSettings[fs] * 5}
        value={state.layoutSettings[fs]}
        onChange={(s) => handleLayoutSize(fs, s)}
        step={0.5}
        id={"font" + fs}
        // marks={marks}
      />
    </div>
  ));

  const ts = useTranspose(getTransposeFromTag(song.getTags()));
  useEffect(() => {
    set({ ...state, transpose: ts.transpose.semitones });
  }, [ts.transpose.semitones]);

  return (
    <>
      <div className="pp--settings">
        <div className="grid">
          <div className="title">Transpose</div>
          <div className="setting">
            <div className="fullwidth">
              <div>
                <Button onClick={() => ts.setShowTransposer(true)}>
                  <ReactSVG src="/svg/transposer.svg" />
                </Button>
              </div>
              <div className="display-transpose">{ts.displayTranspose}</div>
            </div>
          </div>

          <div className="title">Orientation</div>
          <div className="setting orientations">
            {orientations.map(([value, icon, help], idx) => (
              <>
                <input
                  alt={help}
                  id={"or" + value}
                  type="radio"
                  name="orientation"
                  value={value}
                  checked={state.orientation == value}
                  onChange={handleOrientationChange}
                />
                <label
                  title={help}
                  className={"orientation-" + value}
                  htmlFor={"or" + value}
                  key={idx}
                >
                  {icon}
                </label>
              </>
            ))}
          </div>
          <div className="title">Columns</div>
          <div className="setting columns">
            <ColumnSetter
              cols={4}
              setCols={handleColChange}
              numCols={state.numCols}
            ></ColumnSetter>
          </div>

          <div className="title">Font Sizes</div>
          <div className="settingtable">{fontSizeHandles}</div>
          <div className="title">Lineheight</div>
          <div className="settingtable">{factors}</div>
          <div className="title">Layout</div>
          <div className="settingtable">{layoutHandles}</div>

          <div className="title">Lyrics</div>
          <div className="setting">
            <div className="fullwidth">
              <HlbCheckbox
                setter={setInlineRefs}
                value={state.inlineReferences}
              >
                Expand Repetitions
              </HlbCheckbox>
            </div>
            <div className="fullwidth">
              <HlbCheckbox setter={setComments} value={state.includeComments}>
                Include Comments
              </HlbCheckbox>
            </div>
            <div className="fullwidth">
              <HlbCheckbox setter={setCompactness} value={state.compactChordonly}>
                Compactize Chord Lines
              </HlbCheckbox>
            </div>
            {/* todo: hide chords */}
          </div>
        </div>
      </div>
      {ts.showTransposer && (
        <Transposer
          transposeSetter={(ev) => ts.setTranspose(ev)}
          transpose={ts.transpose.semitones}
          keyHint={Chord.from(song.getTag("tonart"))}
          close={() => ts.setShowTransposer(false)}
          chords={parseChords(song.getChords())}
        />
      )}
    </>
  );
};

export const ColumnSetter = ({
  cols,
  setCols,
  numCols,
}: {
  cols: number;
  setCols: Function;
  numCols: number;
}) => (
  <>
    {[...new Array(cols).keys()].map((idx) => (
      <>
        <input
          onChange={(ev) => setCols(parseInt(ev.currentTarget.value))}
          checked={idx + 1 === numCols}
          type="radio"
          id={`numColumns${idx}`}
          name="numColumns"
          value={idx + 1}
        />
        <label htmlFor={"numColumns" + idx} title={`${idx + 1}`}>
          <Columns numCols={idx + 1} colWidth={10} gap={2} />
        </label>
      </>
    ))}
  </>
);
