import * as React from "react";
import { Song } from "../api/collections";

import Sheet from "./Sheet";
import { navigateCallback, View } from "../api/helpers";
import { Button } from "./Button";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ReactSVG } from "react-svg";
import { ColumnSetter } from "./PdfViewer/PdfSettings";
import Transposer, { useTranspose } from "./Transposer";
import Chord from "../api/libchr0d/chord";
import { getTransposeFromTag, parseChords } from "./Viewer";
import { HlbSliderWithInput } from "./GuiElements/HlbSliderWithInput";
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

  const sizeId = React.useId();
  const lineId = React.useId();
  const settings = (
    <aside id="rightSettings" className="printer--settings">
      <Button onClick={navigateCallback(history, View.view, song)}>
        <ReactSVG src="/svg/cancel.svg" />
      </Button>
      <div className="pp--settings">
        <div className="grid">
          <div className="title">Schrift</div>
          <div className="settingtable">
            <div className="fontsize">
              <label htmlFor={sizeId}>Schriftgrösse</label>
              <HlbSliderWithInput
                max={200}
                min={10}
                onChange={setScale}
                value={scale}
                id={sizeId}
              ></HlbSliderWithInput>
            </div>
            <div className="fontsize">
              <label htmlFor={lineId}>Zeilenabstand</label>
              <HlbSliderWithInput
                max={3}
                min={0.1}
                step={0.05}
                onChange={setLineHeight}
                value={lineHeight}
                id={lineId}
              ></HlbSliderWithInput>
            </div>
          </div>
          <div className="title">Spalten</div>
          <div className="setting columns">
            <ColumnSetter
              cols={3}
              setCols={setCols}
              numCols={cols}
            ></ColumnSetter>
          </div>
          <div className="title">Inhalt</div>
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
          <div className="title">Transponieren</div>
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
              semitones: ts.transpose.semitones,
              notation: ts.transpose.notation,
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
