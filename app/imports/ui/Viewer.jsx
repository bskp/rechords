import React, {Component} from 'react';
import PropTypes from 'prop-types';
import RmdParser from '../api/rmd-parser.js';

export default class Viewer extends Component {

	handleContextMenu = (event) => {
		this.props.modeCallback(true);
		event.preventDefault();
	}

	render() {
		return (
			<div id="viewer" className="content" onContextMenu={this.handleContextMenu}>
			<span dangerouslySetInnerHTML={{__html: new RmdParser(this.props.song.text).html}} />
			</div>

		);
	}
}

Viewer.propTypes = {
	song: PropTypes.object.isRequired,
	modeCallback: PropTypes.func.isRequired
};

//export default withRouter(Viewer);  // injects history, location, match
