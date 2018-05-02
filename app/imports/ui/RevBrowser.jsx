import Songs, {Revisions} from '../api/collections.js';
import React, { Component } from 'react';
import Source from './Source.jsx';
import Collapsed from './Collapsed.jsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import "moment/locale/de";

export default class RevBrowser extends Component {

  constructor(props) {
    super();
    this.state = {
      revision: props.song.getRevision(0)
    }
  }

  setRev = (rev) => {
    this.setState({
      revision: rev
    });
  }

  render() {
    let revs = this.props.song.getRevisions();
    let n = revs.count();

    let ts = this.state.revision.timestamp;
    let label = ts ? <span className="label">Version vom {moment(ts).format('LLLL')}</span> 
                   : <span className="label">Wähle rechts eine Version zum Vergleichen aus!</span>

    return (
      <>
        <Source md={this.state.revision.text} readOnly={true} className="revision">
          {label}
        </Source>
        <Collapsed id="revs" className="revisions">
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) =>
              <RevLink rev={rev} idx={n - idx} key={rev._id} callback={this.setRev} active={rev._id == this.state.revision._id} />
            )}
          </ol>
        </Collapsed>
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
    let r = this.props.rev;
    return (
      <li value={this.props.idx} 
        onClick={() => {this.props.callback(r)}}
        className={this.props.active ? 'active' : undefined}
        >
          {moment(r.timestamp).fromNow()}
      </li>
    );
  }
}