import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

class Viewer extends Component {

	handleContextMenu = (event) => {
		let m = this.props.match.params;
		this.props.history.push('/edit/' + m.author + '/' + m.title);
		event.preventDefault();
	}


	// transponieren

	render() {

		return (
			<div id="viewer" className="content" onContextMenu={this.handleContextMenu}>
			<span ref="html" dangerouslySetInnerHTML={{__html: this.props.song.getHtml()}} />
			</div>

		);
	}
}

Viewer.propTypes = {
	song: PropTypes.object.isRequired,
};

export default withRouter(Viewer);  // injects history, location, match
