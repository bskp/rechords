import * as React from "react";
import { Song } from "../api/collections";

import Sheet from "./Sheet";
import { navigateCallback, View } from "../api/helpers";
import { Button } from "./Button";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ReactSVG } from "react-svg";
import {
  ColumnSetter,
  HlbCheckbox,
  IPdfViewerSettings,
  PdfSettings,
} from "./PdfViewer/PdfSettings";
import Transposer, { Transpose } from "./Transposer";
import { bool } from "prop-types";
import Chord from "../api/libchr0d/chord";
import { getTransposeFromTag, parseChords } from "./Viewer";

type PrinterProps = {
  song: Song;
};

const Printer = ({ song, history }: PrinterProps & RouteComponentProps) => {
  

  const [cols, setCols] = React.useState(2);
  const [scale, setScale] = React.useState(100);
  const [lineHeight, setLineHeight] = React.useState(1.35);
  const [hideChords, setHideChords] = React.useState(false);
  const [hideFrets, setHideFrets] = React.useState(false);

  const [showTransposer, setShowTransposer] = React.useState(false);
  const [transpose, setTranspose] = React.useState<Transpose>({
    semitones: getTransposeFromTag(song.getTags()),
    notation: "undetermined",
  });

  const refChordsheet = React.createRef<HTMLDivElement>();

  const hideChordsId = React.useId();

  const settings = (
    <aside id="rightSettings">
      <Button onClick={navigateCallback(history, View.view, song)}>
        <ReactSVG src="/svg/cancel.svg" />
      </Button>
      <div className="pdfSettings">
        <div className="grid">
          <div className="title">Columns</div>
          <div className="setting columns">
            <ColumnSetter
              cols={3}
              setCols={setCols}
              numCols={cols}
            ></ColumnSetter>
          </div>
          <div className="title">Misc.</div>
          <div className="setting">
            <div className="fullwidth">
              <HlbCheckbox setter={setHideChords} value={hideChords}>
                Hide Chords
              </HlbCheckbox>
            </div>
            <div className="fullwidth">
              <HlbCheckbox setter={setHideFrets} value={hideFrets}>
                Hide Frets
              </HlbCheckbox>
            </div>
          </div>
        </div>
        <div className="title">Transpose</div>
        <div className="fullwidth">
        <Button onClick={() => setShowTransposer(true)}>
          <ReactSVG src="/svg/transposer.svg" />
        </Button>
        {showTransposer && <Transposer
            transposeSetter={ev => setTranspose(ev)}
            transpose={transpose.semitones}
            keyHint={Chord.from(song.getTag("tonart"))}
            close={() => setShowTransposer(false)}
            chords={parseChords(song.getChords())}
          />}
        </div>
      </div>
    </aside>
  );

  const sheetStyle = {
    columns: cols,
    fontSize: scale + "%",
    lineHeight: lineHeight,
  };

  const colMode = cols == 1 ? " singleCol" : "";

  return (
    <>
      <div className="simulate-print">
        <div className={"content" + colMode} id="chordsheet">
          <Sheet
            song={song}
            transpose={{
              semitones: transpose.semitones,
              notation: transpose.notation
            }}
            hideChords={hideChords}
            style={sheetStyle}
          />
        </div>
      </div>
      {settings}
    </>
  );
};

export default withRouter(Printer);
