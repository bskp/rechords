import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from 'react-router-dom';
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";

class Viewer extends Component {
  constructor() {
    super();
    this.state = { relTranspose: 0 };
  }

  handleContextMenu = event => {
    let m = this.props.match.params;
    this.props.history.push('/edit/' + m.author + '/' + m.title);
    event.preventDefault();
  };

  // transponieren
  handleTransposeSetter = pitch => {
    this.setState({ relTranspose: pitch });

    // What now?
  };

  render() {
    let chords = this.props.song.getChords();
    let chrodlib = new ChrodLib();
    return (
      <div
        id="viewer"
        className="content"
        onContextMenu={this.handleContextMenu}
      >
        <section
          ref="html"
          dangerouslySetInnerHTML={{ __html: this.props.song.getHtml() }}
        />
        
        <section>
          <TranposeSetter
            doshit={this.handleTransposeSetter}
            intialTranspose={this.state.relTranspose}
          />
          <table className="chordtable">
            <tbody>
              <tr>
                <td>Orig:</td>
                {chords.map((c, i) =>
                  <td key={i}>{c}</td>
                )}
              </tr>
              <tr>
                <td>Tran:</td>
                {chrodlib.transpose(chords, this.state.relTranspose).map((c, i) =>
                  <td key={i}>{c}</td>
                )}
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}
// this probably would belong inside the class
Viewer.propTypes = {
  song: PropTypes.object.isRequired,
  // relativeTranspose: PropTypes.number.isRequired
};

export default withRouter(Viewer);  // injects history, location, match
