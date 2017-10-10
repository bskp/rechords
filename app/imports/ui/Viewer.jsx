import React, {Component} from 'react';
import PropTypes from 'prop-types';
import RmdParser from '../api/rmd-parser.js';

export default class Viewer extends Component {

	handleContextMenu = (event) => {
		this.props.modeCallback(true);
		event.preventDefault();
	}


	// transponieren

	render() {

		return (
			<div id="viewer" className="content" onContextMenu={this.handleContextMenu}>
			<span ref="html" dangerouslySetInnerHTML={{__html: new RmdParser(this.props.song.text).html}} />
			<h1>Transpose {this.props.relativeTranspose}</h1>
			</div>

		);
	}
}

Viewer.propTypes = {
	song: PropTypes.object.isRequired,
	modeCallback: PropTypes.func.isRequired,
	relativeTranspose: PropTypes.number.isRequired
};

//export default withRouter(Viewer);  // injects history, location, match
