import React, { Component } from "react";
import PropTypes from "prop-types";
import RmdParser from "../api/rmd-parser.js";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from '../api/libchrod.js'
export class Widget extends Component {
  render() {
    return <h1>Gagi</h1>;
  }
}
export default class Viewer extends Component {
  constructor() {
    super();
  }

  handleContextMenu = event => {
    this.props.modeCallback(true);
    event.preventDefault();
  };

  // transponieren
  handleTranspose = event => {
    // What now?
  };

  render() {
    // <TransposeSetter> {this.props.relativeTranspose}</TransposeSetter>
	this.mdParser = new RmdParser(this.props.song.text);
	let chords = this.mdParser.chords;
	console.log(chords);
	let ed_guess = ChrodLib.guessKey(this.mdParser.chords);
	let chrodlib = new ChrodLib(ed_guess);
    return (
      <div
        id="viewer"
        className="content"
        onContextMenu={this.handleContextMenu}
      >
        <TranposeSetter onChange={this.handleTranspose} />
        <span ref="html" dangerouslySetInnerHTML={{ __html: this.mdParser.html }} />
		<ul>
		{/* no unique key */}
		{chords.map((c) => (<li>{c}</li>))}
		{chrodlib.transpose(chords, -3).join('|')}
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
