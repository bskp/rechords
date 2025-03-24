import { useTracker } from "meteor/react-meteor-data";
import * as React from "react";
import { useEffect } from "react";
import { FunctionComponent, ReactElement, useState } from "react";
import { Columns, Landscape, Portrait } from "../GuiElements/SettingIcons";
import { SliderWithInput } from "../GuiElements/SliderWithInput";
import { Meteor } from "meteor/meteor";
import { ReactSVG } from "react-svg";
import Transposer, { useTranspose } from "../Transposer";
import { getTransposeFromTag, parseChords } from "../Viewer";
import { Song } from "/imports/api/collections";
import Chord from "/imports/api/libchr0d/chord";
import { Button } from "../Button";

// Using provider in order to guarantee
// new properties each time
const PdfViewerStates: () => IPdfViewerSettings = () => ({
  numCols: 3,
  orientation: "l",
  inlineReferences: false,
  includeComments: false,
  transpose: 0,
  sizes: {
    header: 25,
    section: 16,
    text: 16,
    chord: 11,
    gap: 3,
  },
});

export interface IPdfViewerSettings {
  numCols: number;
  orientation: "l" | "p";
  inlineReferences: boolean;
  includeComments: boolean;
  sizes: ITextSizes;
  transpose: number;
}
export interface ITextSizes extends Record<string, number> {
  header: number;
  section: number;
  text: number;
  chord: number;
  gap: number;
}

export const PdfSettings: FunctionComponent<{
  song: Song;
  consumer: (s: IPdfViewerSettings) => void;
}> = ({ song, consumer }) => {
  const { user } = useTracker(() => ({ user: Meteor.user() }));

  type sug = "s" | "u" | "g";

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
    event: React.ChangeEvent<HTMLInputElement>
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

  const handleFontSize = (name, value) => {
    const newFontSizes = state.sizes;
    newFontSizes[name] = value;
    set(
      // copying object in order not having to detect the state change in deep @componentDidUpdate
      { ...state, sizes: newFontSizes }
    );
  };

  const orientations: [string, ReactElement, string][] = [
    // eslint-disable-next-line react/jsx-key
    ["p", Portrait, "Portrait: 210mm x 297mm"],
    ["l", Landscape, "Landscape: 297mm x 210mm"],
  ];

  const fontSizeHandles = [];

  const baseSizes = PdfViewerStates();
  for (const fs in state.sizes) {
    if (Object.prototype.hasOwnProperty.call(state.sizes, fs)) {
      // const marks = {}
      // for( const k of Object.keys(settings) ) {
      //   if( settings[k]?.sizes ) {
      //     const sizes = settings[k as sug].sizes
      //     const size = sizes[fs]
      //     marks[size]= k
      //   }
      // }

      fontSizeHandles.push(
        <div className="fontsize">
          <label htmlFor={"font" + fs}>{fs}</label>
          <SliderWithInput
            min={1}
            max={baseSizes.sizes[fs] * 3 - 1}
            value={state.sizes[fs]}
            onChange={(s) => handleFontSize(fs, s)}
            id={"font" + fs}
            // marks={marks}
          />
        </div>
      );
    }
  }

  const ok = <ReactSVG src="/svg/ok.svg" />;
  const cancel = <ReactSVG src="/svg/cancel.svg" />;

  const ts = useTranspose(getTransposeFromTag(song.getTags()));

  return (
    <>
      <div className="pdfSettings">
        <div className="grid">
          <div className="title">Transpose</div>
          <div className="setting">
            <div>
              <Button onClick={() => ts.setShowTransposer(true)}>
                <ReactSVG src="/svg/transposer.svg" />
              </Button>
            </div>
            <div className="transpose">{ts.displayTranspose}</div>
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
                <label title={help} htmlFor={"or" + value} key={idx}>
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

          <div className="table">{fontSizeHandles}</div>

          <div className="title">Text</div>
          <div className="setting">
            <div className="fullwidth">
              <HlbCheckbox
                setter={setInlineRefs}
                value={state.inlineReferences}
              >
                Inline References
              </HlbCheckbox>
            </div>
            <div className="fullwidth">
              <HlbCheckbox setter={setComments} value={state.includeComments}>
                Include Comments
              </HlbCheckbox>
            </div>
            {/* todo: chords */}
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

const Cross: React.FC = () => (
  <svg width="20px" height="20px">
    <rect
      className="box"
      x="0"
      y="0"
      width="20px"
      height="20px"
      rx="5px"
      ry="5px"
    />
    <line className="cross" x1="4" y1="4" x2="16px" y2="16px" />
    <line className="cross" x1="4" y2="4" x2="16px" y1="16px" />
  </svg>
);

export const HlbCheckbox = (
  props: {
    value: boolean;
    setter: (a: boolean) => void;
  } & React.PropsWithChildren
) => {
  const id = React.useId();
  return (
    <>
      <input
        id={id}
        checked={props.value}
        type="checkbox"
        onClick={(e) => props.setter(e.currentTarget.checked)}
      />
      <label
        htmlFor={id}
        title="Repeat text of each Reference?"
        className="fullwidth"
      >
        <Cross></Cross> {props.children}
      </label>
    </>
  );
};
