import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Songs} from '../api/collections.js';
import RmdParser from '../api/rmd-parser.js';

export default class Editor extends Component {

    handleContextMenu = (event) => {
        Songs.upsert( this.songFromDom() );

        this.props.modeCallback(false);
        event.preventDefault();
    }

    songFromDom = () => {
        let song = this.props.song;

        song.text = this.refs.source.innerHTML;
        let parser = new RmdParser(song.text);
        song.title = parser.title;
        song.author = parser.author;

        Songs.upsert(song);
    }

    render() {
        return (
            <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
                <h1>Ein Lied: {this.props.song.title}</h1>
                <pre ref="source" contentEditable={true}>{this.props.song.text}</pre>
            </div>

        );
    }
}

Editor.propTypes = {
    song: PropTypes.object.isRequired,
    modeCallback: PropTypes.func.isRequired
};
