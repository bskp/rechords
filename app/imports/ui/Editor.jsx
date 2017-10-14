import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Songs} from '../api/collections.js';
import parse from '../api/rmd-parser.js';
var slug = require('slug')

export default class Editor extends Component {

  constructor() {
    super();
  }

  handleContextMenu = (event) => {
    this.update();
    Meteor.call('save', this.props.song);

    this.props.modeCallback(false);
    event.preventDefault();
  }

  update = () => {
    //this.domSong = new RmdParser(this.refs.source.value);
    this.props.song.text = this.refs.source.value;
    this.props.song = parse(this.props.song);
  }

  render() {
    let md = this.props.song.text;
    return (
      <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
      <h1>Ein Lied: {this.props.song.title}</h1>
      <textarea ref="source" onKeyUp={this.update} defaultValue={md} />
      </div>

    );
  }
}

Editor.propTypes = {
  song: PropTypes.object.isRequired,
  modeCallback: PropTypes.func.isRequired
};
