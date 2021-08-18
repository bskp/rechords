import Songs, { Revision, Revisions, Song } from '../../api/collections.js';
import * as React from 'react';
import { Component } from 'react';
import Drawer from '../Drawer';
import * as moment from 'moment';
import "moment/locale/de";
import { Change } from 'diff';
import { diffChars } from 'diff';
import { connect, ConnectedProps } from 'react-redux';
import { IEditorStates, revisionReducer } from './EditorAdvanced.js';
import Source from '../Source.jsx'
import { ReactElement } from 'react';

interface RevBrowserAdvancedProps {
  song: Song;
}
interface RevBrowserAdvancedStates {
  diffs: React.ReactElement[]
}

type RevBrowserAdvancedProps_ = RevBrowserAdvancedProps & ConnectedProps<typeof connector>;

const connector = connect((state: IEditorStates) =>
  ({ selectedRev: state.rev }), {
  dispatchSelect: (rev: Revision) => ({ type: 'revision/set', payload: rev }),
  setRevTab: () => ({ type: 'tab/rev' })
})
class RevBrowserAdvanced_ extends React.Component<RevBrowserAdvancedProps_, RevBrowserAdvancedStates> {

  readonly state = {
    diffs: [],
    showDiff: false
  }
  constructor(props: RevBrowserAdvancedProps_) {
    super(props)
  }

  componentDidMount() {
    document.addEventListener("keyup", this.keyHandler, {});
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.keyHandler);
  }

  keyHandler = (e) => {

    // Do not steal focus if on <input>
    if (e.target?.tagName == 'INPUT') return;

    const state = this.state
    const rev = this.props.selectedRev
    const revs = this.props.song.getRevisions();

    const n = revs.length

    if (n > 0) {
      if (e.key == 'j' || e.key == 'ArrowRight') {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex(r => rev?._id == r._id)
          if (idx != -1 && idx < n - 1) {
            this.setRev(revs[idx + 1])
            return
          }
        } else {
          this.setRev(revs[0])
        }
      }

      if (e.key == 'k' || e.key == 'ArrowLeft') {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex(r => rev?._id == r._id)
          if (idx != -1 && idx > 0) {
            this.setRev(revs[idx - 1])
            return
          }
        } else {
          this.setRev(revs[n - 1])
        }
      }
    }
  }


  setRev = (rev: Revision) => {
    this.props.dispatchSelect(rev)
  }

  setRevById = (rev_id: string) => {
    let revs = this.props.song.getRevisions();

    const rev = revs.find(r => r._id == rev_id)
    if (rev) {
      this.setRev(rev)
    }
  }


  computeDiff = (revs: Revision[], selectedRev: { _id: string; }) => {
    const idx_of_current_Diff = revs.findIndex((rev: Revision) => rev._id == selectedRev?._id)

    const to_diff = idx_of_current_Diff >= 0 && idx_of_current_Diff < revs.length - 1 ? revs[idx_of_current_Diff + 1].text : ""
    const current = this.props.selectedRev?.text ? this.props.selectedRev.text : ""

    const diff = diffChars(to_diff, current)

    const spans: ReactElement[] = reduceDiff(diff)
    return spans
  }

  render() {
    let revs = this.props.song.getRevisions();
    let n = revs.length;

    let ts = this.props.selectedRev?.timestamp;
    let label = ts ? <span className="label">Version vom {moment(ts).format('LLLL')}</span>
      : <span className="label">Wähle rechts eine Version zum Vergleichen aus!</span>

    const diffs = this.computeDiff(revs, this.props.selectedRev)


    return (
      <>
        <div className="content revision-colors">
          <div className="settings">
            <label><input type="checkbox" checked={this.state.showDiff} onChange={ev => this.setState((state) => ({ ...state, showDiff: ev.target.checked }))} />
              Diff to previous Version
            </label>
          </div>
          {this.state.showDiff && [label, <div className="source-font"> {diffs} </div>]}
          {!this.state.showDiff && <Source md={this.props.selectedRev?.text || ''} readOnly={true} className="revision-colors"> {label} </Source>}
        </div>
        <Drawer id="revs" className="revisions-colors" open={!ts}>
          {this.props.song._id}
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) =>
              <RevLinkAdvanced rev={rev} idx={n - idx} key={rev._id} />
            )}
          </ol>
        </Drawer>
      </>
    )
  }
}
export const RevBrowserAdvanced = connector(RevBrowserAdvanced_)


interface RevLinkAdvancedProps {
  rev: Revision
  idx: any
}

type RevLinkAdvancedProps_ = ConnectedProps<typeof connector> & RevLinkAdvancedProps
class RevLinkAdvanced_ extends Component<RevLinkAdvancedProps_> {

  render() {
    const r = this.props.rev;
    const who = (Meteor.users.findOne(r.editor)?.profile.name || '???') + ' ';

    return (
      <li value={this.props.idx}
        onClick={() => {
          this.props.dispatchSelect(this.props.rev)
          this.props.setRevTab()
        }}
        // TODOO: read from dispatche
        className={this.props.selectedRev == this.props.rev ? 'active' : undefined}
      >
        {who}{moment(r.timestamp).fromNow()}
      </li>
    );
  }
}

export const RevLinkAdvanced: React.ComponentClass<RevLinkAdvancedProps> = connector(RevLinkAdvanced_)

export function reduceDiff(changes: Change[]): ReactElement[] {
  const all: ReactElement[] = []

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    let classNames = 'diff ';
    let value = change.value;
    if (change.added) {
      classNames += 'added';
      value = value.replaceAll('\n', '⏎\n').replaceAll(' ', '␣')
    } else if (change.removed) {
      classNames += 'removed';
    }

    const changeS = value.split('\n')

    for (let i = 0; i < changeS.length; i++) {

      if (i > 0) all.push(<br />);
      const changeE = changeS[i] || <></>

      all.push(<span className={classNames}>{changeE}</span>)
    }
  }
  return all;
}
