import * as React from 'react';
import { Revision } from '../../api/collections';

import moment from 'moment';
import 'moment/locale/de';
import { Change } from 'diff';
import { connector, ConvertDiffOptions } from './RevBrowserAdvanced';
import { IBlameLine } from 'blame-ts';
import { FunctionComponent } from 'react';
import { RefObject } from 'react';
import { useState } from 'react';
import { CharDiff, Diffline, DiffProps, getBlameLabel, getBlameLines, getDiff } from './BlameUtils';

interface SourceAdvancedProps {
  md: string;
  updateHandler: Function;
  readOnly?: boolean;
  className: string;
  // todo:origin is an objectwith revision tag, user and caption
  revs?: Revision[]
  sourceOptions: ISourceOptions
  setSourceOptions: (l: (prevSourceOptions: ISourceOptions) => ISourceOptions) => void
}
export interface ISourceOptions extends OnlyBoolean {
  date: boolean;
  name: boolean;
  fullRev: boolean;
  blame: boolean;
  showWhitespace: boolean;
}

// TODO: Blamelines could be an own component
export const SourceAdvanced: FunctionComponent<SourceAdvancedProps> = props => {
  const textAreaRef: RefObject<HTMLTextAreaElement> = React.createRef()


  const callUpdateHandler = () => {
    if ('updateHandler' in props) {
      props.updateHandler(textAreaRef?.current.value);
    }
  }

  // Height estimation
  let rowsMatch = props.md.match(/\n/g)

  let rows: number;
  if (rowsMatch != null) {
    rows = rowsMatch.length * 1.4 + 10;
  }

  rows = Math.max(50, rows);

  let style = {
    minHeight: rows + 'em',
  }

  const content = textAreaRef.current?.value || props.md

  const options = props.sourceOptions;
  const propSetter = props.setSourceOptions;

  const [isDiff, setDiff] = useExternalState(options, propSetter, 'blame')
  const keys: (keyof ISourceOptions)[] = ['fullRev', 'name', 'date', 'showWhitespace']
  const detailStates = Object.fromEntries(keys.map(
    name => [name, useExternalState(options, propSetter, name)]
  ))

  const blamelines_grouped = isDiff ? groupBlameLines(detailStates, content, props) : null

  const settings =
    <div className="settings">
      <div>
        <label>
          <input type="checkbox" checked={isDiff} onChange={ev => setDiff(ev.target.checked)} />
          Blame
        </label>
      </div>
      {isDiff && Object.entries(detailStates).map(
        ([k, v]) => <div><label>
          <input type="checkbox" name={k} checked={v[0]} onChange={ev => v[1](ev.target.checked)} />
          {k}
        </label>
        </div>
      )}
    </div>

  return (
    <div className={"content " + props.className}>
      {settings}
      <div className="source-adv">
        {props.children}
        {isDiff && <div style={style} className="blameColumn">{blamelines_grouped}</div>}
        <textarea
          ref={textAreaRef}
          onChange={callUpdateHandler}
          value={props.md}
          style={style}
          readOnly={props.readOnly}
        />
      </div>
    </div>
  )
}

export type OnlyBoolean = {
  [key: string]: boolean
}

function groupBlameLines(detailStates: { [k: string]: [boolean, (b: boolean) => void]; }, content: string, props: React.PropsWithChildren<SourceAdvancedProps>) {
  const lineDetail = (l: IBlameLine<Revision>) => {
    let ret = "";
    const ipOrEd = Meteor.users.findOne(l.origin.editor)?.profile.name || l.origin.ip;
    const revInfo = l.origin._id;
    ret += detailStates.fullRev[0] ? revInfo : revInfo.substr(0, 3);
    ret += detailStates.name[0] ? ipOrEd : '';
    ret += detailStates.date[0] ? " " + moment(l.origin.timestamp).calendar() : "";
    return ret;
  };

  const contentLines = content?.split('\n');

  let blamelines: Diffline<Revision>[] = [];
  // Defensive Copy
  const revs = props.revs.slice();
  const currentRev: Revision = {
    text: content,
    _id: '*',
    ip: 'xxx',
    of: '',
    timestamp: new Date()
  }

  const revsInclCurrent = [currentRev, ...revs];
  const pb = getBlameLines(revsInclCurrent.slice());
  if (contentLines && pb) {
    blamelines = pb.map((l, idx) => {
        return {
          className: "annoline", dataRevid: l.origin._id, info: l,
          display: lineDetail(l)
        };
    });
  }

  const blamelines_grouped = grouping(blamelines, 'dataRevid', id => getDiff(id, revsInclCurrent), { showWhitespace: detailStates.showWhitespace[0] });
  return blamelines_grouped;
}

function useExternalState<T extends OnlyBoolean>(options: T, propSetter: (l: (prevSourceOptions: T) => T) => void, propName: keyof (T)): [boolean, (b: boolean) => void] {
  return [options[propName], (b: boolean) => propSetter(p => ({ ...p, [propName]: b }))];
}

function grouping(elements: Diffline<Revision>[], attribute: string, cb: (id: string) => Change[], options: ConvertDiffOptions): React.ReactElement[] {

  type BlameGroup = {
    lines: Diffline<Revision>[];
    info?: IBlameLine<Revision>;
  };

  let returnvalue: BlameGroup[] = []
  let last_id: string = null

  let currentParent: BlameGroup
  // Maybe it was better to create a map first
  // not push directly into the children of the reactelements
  for (const el of elements) {
    if (el[attribute] != last_id) {
      last_id = el[attribute]
      currentParent = { info: el.info, lines: [] }
      returnvalue.push(currentParent)
    }
    currentParent.lines.push(el)
  }

  return returnvalue.map(({ info, lines }, idx) => <DiffGroup options={options} info={info} lines={lines} key={idx} cb={cb}></DiffGroup>)
}



export const DiffGroup: React.FunctionComponent<DiffProps> = connector((props: DiffProps) => {
  const { info, lines } = props
  const [hover, setHover] = useState(false)

  if (info) {
    const rev = info.origin

    const label = getBlameLabel(rev, '')

    const selectRev = () => {
      props.dispatchSelect(rev)
      props.setRevTab()
    }


    const hoverOrSelected = props.hoverRev == info.origin || props.selectedRev == info.origin

    // Enter and leave of Parent element of tooltip
    // -> the tooltip stays open
    return <div
      onClick={selectRev}
      onMouseEnter={() => { setHover(true); props.dispatchHover(info.origin) }}
      onMouseLeave={() => { setHover(false); props.dispatchHover(null) }}
      className={'annotation-group'}>
      <div className="hover-container" >
        {hover &&
          <div className={'hover'}>
            <div className="info">{label}</div>
            <CharDiff {...props} />
          </div>
        }
      </div>
      <div className={'annotation' + (hoverOrSelected ? ' hovering' : '')}

        key={info?.origin._id}>
        {lines?.map((el, idx) => <div key={idx} className={el.className}>{el.display}</div>)}
      </div>
    </div>
  }
  else {
    return <div className="annotation-group">
      <div className='annotation'>
        *
      </div>

    </div>
  }
})
