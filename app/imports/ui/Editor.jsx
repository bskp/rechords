import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Songs} from '../api/collections.js';
import RmdParser from '../api/rmd-parser.js';
var slug = require('slug')

export default class Editor extends Component {

  constructor() {
    super();
  }

  handleContextMenu = (event) => {

    let song = {
      text: this.domSong.md,
      title: this.domSong.title,
      title_: slug(this.domSong.title),
      author: this.domSong.author,
      author_: slug(this.domSong.author)
    }


    if ('_id' in this.props.song) {
      if (song.text.match(/^\s*$/) == null) {
        Songs.update( this.props.song._id, {$set: song } );
      } else {
        Songs.remove( this.props.song._id);
      }
    } else {
      Songs.insert( song );
    }

    this.props.modeCallback(false);
    event.preventDefault();
  }

  parse = () => {
    this.domSong = new RmdParser(this.refs.source.value);
  }

  render() {
    let md = this.props.song.text;
    this.domSong = new RmdParser(md);
    return (
      <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
      <h1>Ein Lied: {this.props.song.title}</h1>
      <textarea ref="source" onKeyUp={this.parse} defaultValue={md} />
      </div>

    );
  }
}

Editor.propTypes = {
  song: PropTypes.object.isRequired,
  modeCallback: PropTypes.func.isRequired
};
