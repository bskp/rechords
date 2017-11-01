import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from 'react-router-dom';
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";
import {RmdHelpers} from "../api/collections.js";
// var DOMParser = require("xmldom").DOMParser;

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
    let rmd_html = this.props.song.getHtml();

    let dom = new DOMParser().parseFromString(rmd_html, "text/html");

    let chords_str = this.props.song.getChords();

    let chords_dom = RmdHelpers.collectChordsDom(dom);

    let chords_str_transposed = chrodlib.transpose(chords_str, this.state.relTranspose);

    for (let i=0; i<chords_dom.length; i++) {
      let chord_dom = chords_dom[i];
      let chord_tr = chords_str_transposed[i];

      console.debug("Old", chord_dom.textContent, "new", chord_tr);
      // chord_dom.appendData(" -> "+chord_tr)
      chord_dom.textContent = chord_tr;
      
    }

    // TODO: maybe better use this wrapper?
    // However, for the moment only the browser  implementation is  working
    // https://www.npmjs.com/package/simple-xml-dom
    let html_transposed = new XMLSerializer().serializeToString(dom);








    return (
      <div
        id="viewer"
        className="content"
        onContextMenu={this.handleContextMenu}
      >
        <section>
          <TranposeSetter
            doshit={this.handleTransposeSetter}
            intialTranspose={this.state.relTranspose}
          />
          {/* Leave Chord Table for the moment */}
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
        <section
          ref="html"
          className="chordsheet"
          dangerouslySetInnerHTML={{ __html:  html_transposed}}
        />
        
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
