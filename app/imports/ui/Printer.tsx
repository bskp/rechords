import * as React from "react";
import { Song } from "../api/collections";

import Sheet from "./Sheet";
import { navigateCallback, View } from "../api/helpers";
import { Button } from "./Button";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ReactSVG } from "react-svg";

type PrinterProps = { song: Song };

const Printer = ({ song, history }: PrinterProps & RouteComponentProps) => {
  const initial_transpose = () => {
    for (const tag of song.getTags()) {
      if (!tag.startsWith("transponierung:")) continue;
      const dT = parseInt(tag.split(":")[1], 10);
      return isNaN(dT) ? 0 : dT;
    }
    return 0;
  };

  const [cols, setCols] = React.useState(2);
  const [scale, setScale] = React.useState(100);
  const [lineHeight, setLineHeight] = React.useState(1.35);
  const [transpose, setTranspose] = React.useState(initial_transpose());
  const [hideChords, setHideChords] = React.useState(false);
  const [hideFrets, setHideFrets] = React.useState(false);

  const refChordsheet = React.createRef<HTMLDivElement>();

  const settings = (
    <aside id="rightSettings">
      <Button onClick={navigateCallback(history, View.view, song)}>
        <ReactSVG src="/svg/cancel.svg" />
      </Button>
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
            transposeSemitones={transpose}
            notationPreference="undetermined"
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
