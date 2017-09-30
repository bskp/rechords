import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Songs} from '../api/collections.js';
import RmdParser from '../api/rmd-parser.js';

export default class Editor extends Component {

    handleContextMenu = (event) => {
        let ta = this.refs.source;
        Songs.update( this.props.song._id, {$set: { text: ta.value }} );

        this.props.modeCallback(false);
        event.preventDefault();
    }

    songFromDom = () => {
        let song = this.props.song;

        song.text = this.refs.source.innerHTML;
        song.title = song.title;
        song.author = song.author;

        return song
    }

    render() {
        return (
            <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
                <h1>Ein Lied: {this.props.song.title}</h1>
                <textarea ref="source" defaultValue={this.props.song.text} />
            </div>

        );
    }
}

Editor.propTypes = {
    song: PropTypes.object.isRequired,
    modeCallback: PropTypes.func.isRequired
};
