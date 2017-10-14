import React, {Component} from 'react';
import PropTypes from 'prop-types';
import parse from '../api/rmd-parser.js';

export default class Viewer extends Component {

	handleContextMenu = (event) => {
		this.props.modeCallback(true);
		event.preventDefault();
	}


	// transponieren

	render() {

		return (
			<div id="viewer" className="content" onContextMenu={this.handleContextMenu}>
			<span ref="html" dangerouslySetInnerHTML={{__html: parse(this.props.song).html}} />
			</div>

		);
	}
}

Viewer.propTypes = {
	song: PropTypes.object.isRequired,
	modeCallback: PropTypes.func.isRequired
};

//export default withRouter(Viewer);  // injects history, location, match
