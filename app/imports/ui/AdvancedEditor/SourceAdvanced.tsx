import * as React from 'react';
import { Component } from 'react';
import { Revision } from '../../api/collections';

import * as moment from 'moment';
import "moment/locale/de";
import { Change, diffChars } from 'diff';
import { reduceDiff, RevLinkAdvanced } from './RevBrowserAdvanced';
import { blame, IBlameLine } from 'blame-ts';
import { FunctionComponent } from 'react';
import { RefObject } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';

interface SourceAdvancedProps {
  md: string;
  updateHandler: Function;
  readOnly: boolean;
  className: string;
  // todo:origin is an objectwith revision tag, user and caption
  revs?: Revision[]
}

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

    const settingStates = {
      name: useState(false),
      date: useState(false)
    }

    const lineDetail = (l: IBlameLine<Revision>) => {
      let ret = ""
      const ipOrEd = Meteor.users.findOne(l.origin.editor )?.profile.name || l.origin.ip
      ret += settingStates.name[0] ? ipOrEd : ipOrEd.substr(0,2)
      ret += settingStates.date[0] ? " "+moment(l.origin.timestamp).calendar() : ""
      return ret
    }

    const contentLines = content?.split('\n');

    let blamelines: Diffline<Revision>[] = []
    const revs = props.revs.slice()
    const pb = getBlameLines(revs);
    if (contentLines && pb) {
      blamelines = pb.map((l, idx) => {
        if (contentLines[idx] == l.value) {
          return {
            className: "annoline", dataRevid: l.origin._id, info: l,
            display: lineDetail(l)
          }
        } else {
          return { dataRevid: "*", display: "*" }
        }
      });
    }

    const blamelines_grouped = grouping(blamelines, 'dataRevid', id => getDiff(id, props.revs))

    const [isDiff, setDiff] = useState(false)

    const settings = 
      <div className="settings">
        <div>
        <label>
          <input type="checkbox"  checked={isDiff} onChange={ ev => setDiff(ev.target.checked)} />
Blame
          </label>
          </div>
        {isDiff && Object.entries(settingStates).map(
          ([k,v])=> <div><label>
          <input type="checkbox" name={k} checked={v[0]} onChange={ ev => v[1](ev.target.checked)} />
{k}
          </label>
          </div>
        )}
      </div>

    return (
      <div className={"content "+ props.className}>
      {settings}
      <div className="source-adv">
        {props.children}
        { isDiff && <div style={style} className="blameColumn">{blamelines_grouped}</div> }
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
  

function getDiff(last_id: string, revs: Revision[]) {
  if (revs && revs.length) {
    const idx = revs.findIndex(v => v._id === last_id)
    const oldText = idx < revs.length - 1 ? revs[idx + 1].text : ''
    const diff = diffChars(oldText, revs[idx].text)
    return diff
  }
}

function grouping(elements: Diffline<Revision>[], attribute: string, cb: (id: string) => Change[]): React.ReactElement[] {

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

  return returnvalue.map(({ info, lines }, idx) => <DiffGroup info={info} lines={lines} key={idx} cb={cb}></DiffGroup>)
}

export function getBlameLines(versions: Revision[]): IBlameLine<Revision>[] {
  return blame(versions, { getCode: (a: Revision) => a.text, getOrigin: (b: Revision) => b })
}

type Diffline<O> = {
  dataRevid: string;
  className?: string;
  info: IBlameLine<O>;
  display: string;
};

const CharDiff: FunctionComponent<DiffProps> = props => {
  const { info, cb, lines } = props
  const chardiff = []
  const id = info?.origin._id
  const diffs = useMemo(() => id ? cb(id) : [], ['info'])

  let numBr = 0;
  const flatDiffLines: React.ReactElement[] = reduceDiff(diffs);
  for (const [idx, diff] of flatDiffLines.entries()) {
    if (numBr >= info.lineindiff + lines.length + 2) {
      break
    }
    if (numBr >= info.lineindiff - 2) {
      chardiff.push(React.cloneElement(diff, { key: idx }))
    }

    if (diff.type == 'br') {
      numBr += 1
    }

  }
  return <>{chardiff}</>;
}

type DiffProps = { info: IBlameLine<Revision>, lines: Diffline<Revision>[], cb: (id: string) => Change[] }

const DiffGroup: React.FunctionComponent<DiffProps> = props => {
    const { info, lines } = props
    const [pinned, setPinned] = React.useState<boolean>(false)
    const [hover, setHover] = useState(false)

    const visible = pinned || hover

    // Enter and leave of Parent element of tooltip
    // -> the tooltip stays open
    return <div 
      onMouseEnter={ev=>{setHover(true)}} 
      onMouseLeave={()=>setHover(false)} 
      className={'annotation-group' + (pinned ? ' active' : '')}>
      <div className="hover-container" >
        { visible &&
          <div className={'hover'}>
            <div>{info && <RevLinkAdvanced rev={info.origin} ></RevLinkAdvanced>}</div>
            <CharDiff {...props} />
          </div>
        }
      </div>
      <div className='annotation' 

      key={info?.origin._id} onClick={e => setPinned(p => !p)}>
        {lines?.map((el, idx) => <div key={idx} className={el.className}>{el.display}</div>)}
      </div>
    </div>
  }


