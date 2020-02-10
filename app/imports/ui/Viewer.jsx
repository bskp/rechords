import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";
import { RmdHelpers } from "../api/collections.js";
import Collapsed from './Collapsed.jsx';
import ReactDOM from 'react-dom';
import Drawer from '../ui/Drawer';

var Parser = require("html-react-parser");

class Viewer extends Component {
  constructor() {
    super();
    this.state = { relTranspose: 0 };
  }

  componentDidUpdate(prevProps) {
    if (this.props.song == prevProps.song) return;
      
    // Song has changed.
    const node = ReactDOM.findDOMNode(this);
    node.children[0].scrollTop = 0;
    this.setState({ relTranspose: 0 });
  }

  handleContextMenu = event => {
    let m = this.props.match.params;
    this.props.history.push("/edit/" + m.author + "/" + m.title);
    event.preventDefault();
  };

  transposeSetter = pitch => {
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
        if (domNode.name && domNode.name == 'i' && 'data-chord' in domNode.attribs) {
          let chord = domNode.attribs['data-chord'];
          let t = chrodlib.transpose(chord, key, dT);
          let chord_;
          if (t == null) {
            chord_ = <span className="before">{chord}</span>;
          } else {
            chord_ = <span className={"before " + t.className}>{t.base}<sup>{t.suff}</sup></span>;
          }
          return <i>{chord_}{domNode.children[0].data}</i>;
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
          className="content chordsheet-colors"
          id="chordsheet"
          onContextMenu={this.handleContextMenu}
        >
          <section>
            <TranposeSetter
              transposeSetter={this.transposeSetter}
              transpose={this.state.relTranspose}
              keym={key}
            />
          </section>
          <section ref="html">
            {vdom}
          </section>
        </div>
        <Drawer className="source" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Drawer>
      </div>
    );
  }
}

Viewer.propTypes = {
  song: PropTypes.object.isRequired
};

export default withRouter(Viewer); // injects history, location, match
