import {Revision, Song} from '../api/collections';
import React, {Component} from 'react';
import Source from './Source';
import Drawer from '../ui/Drawer';
import moment from 'moment';
import 'moment/locale/de';
import { Meteor } from 'meteor/meteor';

type RevBrowserProps = {
  song: Song;
}

export default class RevBrowser extends React.Component<RevBrowserProps, { revision: Revision | undefined }> {

  constructor(props: RevBrowserProps) {
    super(props);
    this.state = {
      revision: undefined,
    };
  }

  setRev = (rev: Revision) => {
    this.setState({
      revision: rev
    });
  };

  componentDidMount() {
    document.addEventListener('keyup', this.keyHandler, {});
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.keyHandler);
  }

  keyHandler = (e) => {
    // Do not steal focus if on <input>
    if (e.target?.tagName == 'INPUT') return;

    const rev = this.state?.revision;
    const revs: Revision[] = this.props.song.getRevisions();

    const n = revs.length;

    if (n > 0) {
      if (e.key == 'j' || e.key == 'ArrowRight') {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex(r => rev?._id == r._id);
          if (idx != -1 && idx < n - 1) {
            this.setRev(revs[idx + 1]);
            return;
          }
        } else {
          this.setRev(revs[0]);
        }
      }

      if (e.key == 'k' || e.key == 'ArrowLeft') {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex(r => rev?._id == r._id);
          if (idx != -1 && idx > 0) {
            this.setRev(revs[idx - 1]);
            return;
          }
        } else {
          this.setRev(revs[n - 1]);
        }
      }
    }

  };

  render() {
    const revs = this.props.song.getRevisions();
    const n = revs.length;

    const ts = this.state.revision?.timestamp;
    const label = ts ? <span className="label">Version vom {moment(ts).format('LLLL')}</span>
      : <span className="label">Wähle rechts eine Version zum Vergleichen aus!</span>;

    return (
      <>
        <Source md={this.state.revision?.text || ''} readOnly={true} className="revision-colors">
          {label}
        </Source>
        <Drawer id="revs" className="revisions-colors" open={this.state.revision === undefined}>
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) =>
              <RevLink rev={rev}
                idx={n - idx}
                key={rev._id}
                showRevision={this.setRev}
                active={rev._id == this.state.revision?._id}/>
            )}
          </ol>
          <p>Schneller:<br/>
            <span className="keyboard">J</span>&nbsp;|&nbsp;<span className="keyboard">→</span><br/>
            <span className="keyboard">K</span>&nbsp;|&nbsp;<span className="keyboard">←</span>
          </p>
        </Drawer>
      </>
    );
  }
}

type RevLinkProps = {
  rev: Revision,
  idx: number,
  key: string,
  showRevision: (rev: Revision) => void,
  active: boolean
};

class RevLink extends Component<RevLinkProps,
    never> {
  constructor(props: RevLinkProps) {
    super(props);
  }

  render() {
    const r = this.props.rev;
    const who = (Meteor.users.findOne(r.editor)?.profile.name || '???') + ' ';

    return (
      <li value={this.props.idx}
        onClick={() => {
          this.props.showRevision(r);
        }}
        className={this.props.active ? 'active' : undefined}
      >
        {who}{moment(r.timestamp).fromNow()}
      </li>
    );
  }
}
