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
      console.error(error);
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
    let rows = md.match(/\n/g).length * 1.4 + 10;
    rows = Math.max(50, rows);

    let style = {
      'min-height': rows + 'em',
    }

    return (
      <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
        <textarea ref="source" onKeyUp={this.update} defaultValue={md} style={style}/>
      </div>

    );
  }
}

Editor.propTypes = {
  song: PropTypes.object.isRequired,
};

export default withRouter(Editor);  // injects history, location, match
