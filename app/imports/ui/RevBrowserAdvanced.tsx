import Songs, {Revision, Revisions, Song} from '../api/collections.js';
import * as React from 'react';
import { Component } from 'react';
import Source from './Source.jsx';
import Drawer from './Drawer';
import * as moment from 'moment';
import "moment/locale/de";
import { Change } from 'diff';
const Diff = require('diff');

type RevBrowserAdvancedProps = {
  song: Song;
};

type RevBrowserAdvancedState = {
  revision: Revision
}

export default class RevBrowserAdvanced extends React.Component<RevBrowserAdvancedProps, RevBrowserAdvancedState> {

  constructor(props: RevBrowserAdvancedProps) {
    super(props)
    this.state = {
      revision: undefined,
    }

  }

  setRev = (rev) => {
    this.setState({
      revision: rev,
    });
  }

  setRevById = (rev_id) => {
    let revs = this.props.song.getRevisions();

    const rev = revs.find( r => r._id == rev_id )
    if( rev ) {
      this.setRev(rev)
    }
  }

  render() {
    let revs = this.props.song.getRevisions();
    let n = revs.length;

    let ts = this.state.revision?.timestamp;
    let label = ts ? <span className="label">Version vom {moment(ts).format('LLLL')}</span> 
                   : <span className="label">Wähle rechts eine Version zum Vergleichen aus!</span>

    const to_diff = this.state.revision?.text
    let diff
    if(to_diff) {
      diff = Diff.diffChars(to_diff,this.props.song.text)
    } else {
      diff = []
    }


    const spans = diff.map((t: Change) => convertDiff(t) )
    return (
      <>
        {/* <Source md={diff} readOnly={true} className="revision-colors">
          {label}
        </Source> */}
        <div className="content source-colors">
          {spans}
        </div>
        <Drawer id="revs" className="revisions-colors">
          {this.props.song._id}
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) =>
              <RevLinkAdvanced rev={rev} idx={n - idx} key={rev._id} callback={this.setRev} active={rev._id == this.state.revision?._id} />
            )}
          </ol>
        </Drawer>
      </>
    )
  }
}

type RevLinkAdvancedProps = {
  rev: Revision
  idx: any
  active: boolean
  callback: Function
}
class RevLinkAdvanced extends Component<RevLinkAdvancedProps> {

  render() {
    const r = this.props.rev;
    const who = (Meteor.users.findOne(r.editor)?.profile.name || '???') + ' ';

    return (
      <li value={this.props.idx} 
        onClick={() => {this.props.callback(r)}}
        className={this.props.active ? 'active' : undefined}
        >
          {who}{moment(r.timestamp).fromNow()}
      </li>
    );
  }
}

export function convertDiff(t: Change): React.ReactElement[] {
      let classNames = '';
      if (t.added) {
        classNames = 'added';
      } else if (t.removed) {
        classNames = 'removed';
      }
      const lines = t.value.split('\n');


    return lines.map( l => <span className={classNames}>{l}</span> )
        .reduce((p,v,idx) => {if(idx>0) p.push(<br/>);p.push(v); return p} , [])
}