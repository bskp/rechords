import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Source extends Component {

  constructor(props) {
    super(props);
  }

  callUpdateHandler = () => {
    if ('updateHandler' in this.props) {
      this.props.updateHandler(this.refs.source.value);
    }
  }

  render() {
    // Height estimation
    let rows = this.props.md.match(/\n/g)

    if (rows != null) {
        rows = rows.length * 1.4 + 10;
    }

    rows = Math.max(50, rows);

    let style = {
        minHeight: rows + 'em',
    }

    return (
      <div className={"content " + this.props.className}>
          {this.props.children}
        <textarea 
          ref="source" 
          className="container"
          onChange={this.callUpdateHandler} 
          value={this.props.md} 
          style={style} 
          readOnly={this.props.readOnly}
        />
      </div>
    )
  }
}


Source.propTypes = {
  md: PropTypes.string.isRequired,
  updateHandler: PropTypes.func,
  readOnly: PropTypes.bool
};