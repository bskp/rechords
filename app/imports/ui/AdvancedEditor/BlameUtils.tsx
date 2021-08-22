import moment = require("moment");
import { Revision } from "../../api/collections";
import * as React from 'react'
import { FunctionComponent, PropsWithChildren } from "react";

import './blame.less'
import { blame, IBlameLine } from "blame-ts";
import { reduceDiff } from "./DiffUtils";
import { Change } from "diff";
import { connector, ConvertDiffOptions } from "./RevBrowserAdvanced";
import { ConnectedProps } from "react-redux";


const DetailHover: FunctionComponent<{main: string, extra: string}> = props => 
    <span className="extra">
        <span className="main">{props.main}</span>
        <span className="extra">{props.extra}</span>
    </span>


export function getBlameLabel(rev: Revision, className="label") {
  let label;
  if (rev) {
    const ts = rev.timestamp;
    const who = (Meteor.users.findOne(rev.editor)?.profile.name || rev.ip) + ' ';
    label = <span className={className}>{who} | <DetailHover main={moment(ts).fromNow()} extra={moment(ts).format('LLLL')} /> | <DetailHover main={rev._id.substr(0,3)} extra={rev._id} /></span>;
  } else {
    label = <span className={className}>Wähle rechts eine Version zum Vergleichen aus!</span>;
  }
  return label;
}

interface BlameProps {
  versions: { code: string, commit: string }[]
  className: string
}

const Blame: React.FunctionComponent<PropsWithChildren<BlameProps>> = (props) => {
  const versions = props.versions

  const line_list = getBlameLines(versions)

  const rows = line_list.map(r => <tr><td>{r.origin}</td><td>{r.value}</td></tr>)

  return <div className={"content " + props.className}>
    {props.children}
    <table>{rows}</table>
  </div>

}

export function getBlameLines(versions: Revision[]): IBlameLine<Revision>[] {
  return blame(versions, { getCode: (a: Revision) => a.text, getOrigin: (b: Revision) => b })
}

export type Diffline<O> = {
  dataRevid: string;
  className?: string;
  info: IBlameLine<O>;
  display: string;
};

export const CharDiff: FunctionComponent<DiffProps> = props => {
  const { info, cb, lines, options } = props
  const chardiff = []
  const id = info?.origin._id
  const diffs = React.useMemo(() => id ? cb(id) : [], ['info'])

  let numBr = 0;
  const flatDiffLines: React.ReactElement[] = reduceDiff(diffs, options);
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

export type DiffProps = { info: IBlameLine<Revision>, lines: Diffline<Revision>[], cb: (id: string) => Change[], options: ConvertDiffOptions } & ConnectedProps<typeof connector>
