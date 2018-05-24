import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";
import { RmdHelpers } from "../api/collections.js";
import Collapsed from './Collapsed.jsx';

var Parser = require("html-react-parser");

class Viewer extends Component {
  constructor() {
    super();
    this.state = { relTranspose: 0 };
  }

  handleContextMenu = event => {
    let m = this.props.match.params;
    this.props.history.push("/edit/" + m.author + "/" + m.title);
    event.preventDefault();
  };

  handleTransposeSetter = pitch => {
    this.setState({ relTranspose: pitch });
  };

  render() {
    let chords = this.props.song.getChords();
    let chrodlib = new ChrodLib();
    let rmd_html = this.props.song.getHtml();

    let key = ChrodLib.guessKey(chords);

    // TODO: if key undef, write something there

    let dT = this.state.relTranspose;

    // Parse HTML to react-vdom and replace chord values.
    let vdom = Parser(rmd_html, {
      replace: function(domNode) {
        if (domNode.attribs && domNode.attribs.class == 'chord') {
          let chord = domNode.children[0];
          let html = chrodlib.transpose(chord.data, key, dT);
          let c = Parser(html);
          // return <span className="chord">{c}</span>
          return c;
        }
      }
    });

    // Idee: obige replace-funktion könnte vom TransposeSetter geholt werden. Dadurch könnte der relTranspose-Zustand völlig in 
    // den TransposeSetter wandern. 

    /*
    if (this.state.relTranspose != 0) {
      chordtable = (
        <table className="chordtable">
          <tbody>
            <tr>
              <td>Orig:</td>
              {chords.map((c, i) => <td key={i}>{c}</td>)}
            </tr>
            <tr>
              <td>Tran:</td>
              {chrodlib
                .transpose(chords, this.state.relTranspose)
                .map((c, i) => <td key={i}>{c}</td>)}
            </tr>
          </tbody>
        </table>
      );
    } else {
      chordtable = "";
    }
    */


    return (
      <div className="container">
        <div
          className="content chordsheet"
          id="chordsheet"
          onContextMenu={this.handleContextMenu}
        >
          <section>
            <TranposeSetter
              doshit={this.handleTransposeSetter}
              intialTranspose={this.state.relTranspose}
              keym={key}
            />
          </section>
          <section ref="html">
            {vdom}
          </section>
        </div>
        <Collapsed className="source" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Collapsed>
      </div>
    );
  }
}
// this probably would belong inside the class
Viewer.propTypes = {
  song: PropTypes.object.isRequired
};

export default withRouter(Viewer); // injects history, location, match
