import React, { Component } from "react";
import PropTypes from "prop-types";
import RmdParser from "../api/rmd-parser.js";
import TranposeSetter from "./TransposeSetter.jsx";

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
	console.log(this.mdParser.chords)
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
		{this.mdParser.chords.map((c) => (<li>{c}</li>))}
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
