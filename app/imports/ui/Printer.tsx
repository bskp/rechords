import * as React from 'react';
import { Song } from '../api/collections';


import Sheet from './Sheet';

type PrinterProps = {
  song: Song,
  toggleTheme: () => void
  themeDark: boolean
}

interface ViewerStates {
  relTranspose: number,
  inlineReferences: boolean,
  showChords: boolean,
  columns: boolean,
  autoscroll: any
}

const Printer = ({song}: PrinterProps) => {

  const initial_transpose = () => {
    for (let tag of song.getTags()) {
      if (!tag.startsWith('transponierung:')) continue;
      let dT = parseInt(tag.split(':')[1], 10);
      return isNaN(dT) ? 0 : dT;
    }
    return 0;
  }

  const [cols, setCols] = React.useState(2);
  const [scale, setScale] = React.useState(100);
  const [lineHeight, setLineHeight] = React.useState(1.35);
  const [transpose, setTranspose] = React.useState(initial_transpose());
  const [hideChords, setHideChords] = React.useState(false);
  const [hideFrets, setHideFrets] = React.useState(false);

  const refChordsheet = React.createRef<HTMLDivElement>();

  const settings = <></>;


  const sheetStyle = {
    columns: cols,
    fontSize: scale + '%',
    lineHeight: lineHeight
  };

  const colMode = cols == 1 ? ' singleCol' : ''

  return (
    <>
      <div className="simulate-print">
        <div className={'content' + colMode} id="chordsheet">
          <Sheet song={song} transpose={transpose} hideChords={hideChords} style={sheetStyle} />
        </div>
      </div>
      {settings}
    </>
  );
}

export default Printer;