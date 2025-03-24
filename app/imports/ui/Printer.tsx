import * as React from "react";
import { Song } from "../api/collections";

import Sheet from "./Sheet";
import { navigateCallback, View } from "../api/helpers";
import { Button } from "./Button";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ReactSVG } from "react-svg";
import {
  ColumnSetter,
  IPdfViewerSettings,
  PdfSettings,
} from "./PdfViewer/PdfSettings";
import Transposer, { Transpose, useTranspose } from "./Transposer";
import { bool } from "prop-types";
import Chord from "../api/libchr0d/chord";
import { getTransposeFromTag, parseChords } from "./Viewer";
import { Notation } from "../api/libchr0d/note";
import { SliderWithInput } from "./GuiElements/SliderWithInput";
import { HlbCheckbox } from "./GuiElements/HlbCheckbox";

type PrinterProps = {
  song: Song;
};

const Printer = ({ song, history }: PrinterProps & RouteComponentProps) => {
  const ts = useTranspose(getTransposeFromTag(song.getTags()));

  const [cols, setCols] = React.useState(2);
  const [scale, setScale] = React.useState(100);
  const [lineHeight, setLineHeight] = React.useState(1.35);
  const [hideChords, setHideChords] = React.useState(false);
  const [hideFrets, setHideFrets] = React.useState(false);

  const settings = (
    <aside id="rightSettings">
      <Button onClick={navigateCallback(history, View.view, song)}>
        <ReactSVG src="/svg/cancel.svg" />
      </Button>
      <div className="pdfSettings">
        <div className="grid">
          <div className="title">Zoom</div>
          <div className="table">
            <SliderWithInput
              max={200}
              min={10}
              onChange={setScale}
              value={scale}
            ></SliderWithInput>
          </div>
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
          <div className="title">Transpose</div>
          <div className="setting">
            <div className="fullwidth">
              <Button onClick={() => ts.setShowTransposer(true)}>
                <ReactSVG src="/svg/transposer.svg" />
              </Button>
              <div>{ts.displayTranspose}</div>
              {ts.showTransposer && (
                <Transposer
                  transposeSetter={(ev) => ts.setTranspose(ev)}
                  transpose={ts.transpose.semitones}
                  keyHint={Chord.from(song.getTag("tonart"))}
                  close={() => ts.setShowTransposer(false)}
                  chords={parseChords(song.getChords())}
                />
              )}
            </div>
          </div>
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
              notation: transpose.notation,
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
