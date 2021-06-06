import * as React from 'react';
import {  NavLink, RouteComponentProps } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod";
import { Song } from '../api/collections';
import Drawer from './Drawer';
import { Abcjs } from './Abcjs'
import { MobileMenu } from "./MobileMenu";
import Kord from "./Kord.js";
import { userMayWrite } from '../api/helpers';

import { LayoutH, LayoutV, Day, Night, Sharp, Flat, Conveyor } from './Icons.jsx';

import parse, { domToReact }  from 'html-react-parser';
import Sheet from './Sheet.js';

type PrinterProps = {
  song: Song,
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