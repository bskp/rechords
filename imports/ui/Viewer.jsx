import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Viewer extends Component {

    handleContextMenu = (event) => {
        this.props.modeCallback(true);
        event.preventDefault();
    }

    render() {
        return (
            <div id="viewer" className="content" onContextMenu={this.handleContextMenu}>
                <h1>Ein Lied: {this.props.song.title}</h1>
                <div>{this.props.song.text}</div>
            </div>

        );
    }
}

Viewer.propTypes = {
    song: PropTypes.object.isRequired,
    modeCallback: PropTypes.func.isRequired
};

//export default withRouter(Viewer);  // injects history, location, match