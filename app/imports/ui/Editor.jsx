import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Songs } from '../api/collections.js';
import {withRouter} from 'react-router-dom';

class Editor extends Component {

  constructor() {
    super();
  }

  handleContextMenu = (event) => {
    this.props.song.parse(this.refs.source.value);

    Meteor.call('saveSong', this.props.song, function (error) {
      console.log(error);
    });

		this.props.history.push('/view/' + this.props.song.author_ + '/' + this.props.song.title_);

    event.preventDefault();
  }

  update = () => {
    /*
    this.props.song = Songs._transform(this.props.song);
    this.props.song.parse(this.refs.source.value);
    */
  }

  render() {
    let md = this.props.song.text;
    return (
      <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
        <h1>Ein Lied: {this.props.song.title}</h1>
        <textarea id="mainTextArea" ref="source" onKeyUp={this.update} defaultValue={md} />
      </div>

    );
  }
}

Editor.propTypes = {
  song: PropTypes.object.isRequired,
};

export default withRouter(Editor);  // injects history, location, match
