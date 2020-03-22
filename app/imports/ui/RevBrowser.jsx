import Songs, {Revisions} from '../api/collections.js';
import React, { Component } from 'react';
import Source from './Source.jsx';
import PropTypes from 'prop-types';
import Drawer from '../ui/Drawer';
import moment from 'moment';
import "moment/locale/de";

export default class RevBrowser extends React.Component {

  constructor(props) {
    super();
    this.state = {
      revision: undefined,
    }
  }

  setRev = (rev) => {
    this.setState({
      revision: rev
    });
  }

  render() {
    let revs = this.props.song.getRevisions();
    let n = revs.length;

    let ts = this.state.revision?.timestamp;
    let label = ts ? <span className="label">Version vom {moment(ts).format('LLLL')}</span> 
                   : <span className="label">Wähle rechts eine Version zum Vergleichen aus!</span>

    return (
      <>
        <Source md={this.state.revision?.text || ''} readOnly={true} className="revision-colors">
          {label}
        </Source>
        <Drawer id="revs" className="revisions-colors">
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) =>
              <RevLink rev={rev} idx={n - idx} key={rev._id} callback={this.setRev} active={rev._id == this.state.revision?._id} />
            )}
          </ol>
        </Drawer>
      </>
    )
  }
}

RevBrowser.propTypes = {
  song: PropTypes.object.isRequired
};

class RevLink extends Component {
  constructor(props) {
    super(props);
  }

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