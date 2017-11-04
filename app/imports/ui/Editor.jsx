import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Songs } from '../api/collections.js';
import {withRouter} from 'react-router-dom';

class Editor extends Component {

  constructor(props) {
    super();
    this.state = {song: props.song};
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
    this.setState((previous, props) =>  {
      this.state.song.parse(this.refs.source.value);
      return {song: this.state.song};
    })
    console.log('song updated');
  }

  render() {
    let md = this.state.song.text;
    let rows = md.match(/\n/g).length * 1.4 + 10;
    rows = Math.max(50, rows);

    let style = {
      minHeight: rows + 'em',
    }

    return (
      <div id="editor" className="content" onContextMenu={this.handleContextMenu}>
        <section
          className="chordsheet"
          ref="html"
          dangerouslySetInnerHTML={{ __html: this.state.song.getHtml() }}
        />
        <textarea ref="source" onKeyUp={this.update} defaultValue={md} style={style}/>
      </div>

    );
  }
}

Editor.propTypes = {
  song: PropTypes.object.isRequired,
};

export default withRouter(Editor);  // injects history, location, match
