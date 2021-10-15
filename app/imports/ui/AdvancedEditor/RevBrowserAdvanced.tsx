import {Revision, Song} from '../../api/collections';
import * as React from 'react';
import {Component} from 'react';
import Drawer from '../Drawer';
import moment from 'moment';
import "moment/locale/de";

import { diffChars } from 'diff';
import { connect, ConnectedProps } from 'react-redux';
import { IEditorStates } from './EditorAdvanced';
import Source from '../Source'
import { getBlameLabel } from './BlameUtils';
import { reduceDiff } from './DiffUtils';

interface RevBrowserAdvancedProps {
  song: Song;
}
interface RevBrowserAdvancedStates {
  diffs: React.ReactElement[]
  showDiff: boolean
  showWhitespace: boolean
}

type RevBrowserAdvancedProps_ = RevBrowserAdvancedProps & ConnectedProps<typeof connector>;

// todo: remove redux... 
export const connector = connect((state: IEditorStates) =>
  ({ selectedRev: state.rev, hoverRev: state.revHover }), {
  dispatchSelect: (rev: Revision) => ({ type: 'revision/set', payload: rev }),
  dispatchHover: (rev: Revision) => ({ type: 'revisionHover/set', payload: rev }),
  setRevTab: () => ({ type: 'tab/rev' })
})
class RevBrowserAdvanced_ extends React.Component<RevBrowserAdvancedProps_, RevBrowserAdvancedStates> {

  readonly state = {
    diffs: [],
    showDiff: false,
    showWhitespace: false
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

    return reduceDiff(diff, {showWhitespace: this.state.showWhitespace})
  }

  render() {
    const revs = this.props.song.getRevisions();
    const n = revs.length;

    const rev = this.props.selectedRev
    let label = getBlameLabel(rev);

    const diffs = this.computeDiff(revs, this.props.selectedRev)

    return (
      <>
        <div className="content revision-colors">
          <div className="settings">
            <label><input type="checkbox" checked={this.state.showDiff} onChange={ev => this.setState((state) => ({ ...state, showDiff: ev.target.checked }))} />
              Diff to previous Version
            </label>
            {this.state.showDiff && <label><input type="checkbox" checked={this.state.showWhitespace} onChange={ev => this.setState((state) => ({ ...state, showWhitespace: ev.target.checked }))} />
              Display Whitespace
            </label>}
          </div>
          {this.state.showDiff && [label, <div className="source-font"> {diffs} </div>]}
          {!this.state.showDiff && <Source md={this.props.selectedRev?.text || ''} readOnly={true} className="revision-colors"> {label} </Source>}
        </div>
        <Drawer id="revs" className="revisions-colors" open={!rev}>
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
    const who = (Meteor.users.findOne(r.editor)?.profile.name || r.ip) + ' ';

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

export const RevLinkAdvanced = connector(RevLinkAdvanced_)

export interface ConvertDiffOptions {
  showWhitespace?: boolean;
}



