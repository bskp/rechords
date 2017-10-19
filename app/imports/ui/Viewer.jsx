import React, { Component } from "react";
import PropTypes from "prop-types";
import RmdParser from "../api/rmd-parser.js";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";
export class Widget extends Component {
  render() {
    return <h1>Gagi</h1>;
  }
}
export default class Viewer extends Component {
  constructor() {
    super();
    // Ugly jsx
    this.state = { relTranspose: 3 };
  }

  handleContextMenu = event => {
    this.props.modeCallback(true);
    event.preventDefault();
  };

  // transponieren
  doshit = pitch => {
    console.debug("Shit Done", pitch);

    this.setState({ relTranspose: pitch });

    // What now?
  };

  render() {
    // <TransposeSetter> {this.props.relativeTranspose}</TransposeSetter>
    this.mdParser = new RmdParser(this.props.song.text);
    let chords = this.mdParser.chords;
    console.log(chords);
    let chrodlib = new ChrodLib();
    return (
      <div
        id="viewer"
        className="content"
        onContextMenu={this.handleContextMenu}
      >
        <span
          ref="html"
          dangerouslySetInnerHTML={{ __html: this.mdParser.html }}
        />
        <ul>
          <TranposeSetter doshit={this.doshit} />
          <table className='chordtable'>
            <tr>
              <td>Orig:</td>
              {chords.map(c => <td>{c}</td>)}
            </tr>
            <tr>
              <td>Tran:</td>
              {chrodlib
                .transpose(chords, this.state.relTranspose)
                .map(c => <td>{c}</td>)}
            </tr>
          </table>
        </ul>
      </div>
    );
  }
}
// this probably would belong inside the class
Viewer.propTypes = {
  song: PropTypes.object.isRequired,
  modeCallback: PropTypes.func.isRequired
  // relativeTranspose: PropTypes.number.isRequired
};

//export default withRouter(Viewer);  // injects history, location, match
