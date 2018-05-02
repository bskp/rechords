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

    let defaultValue = this.props.readOnly ? undefined : this.props.md;
    let value = this.props.readOnly ? this.props.md : undefined;

    return (
      <div className={"content " + this.props.className}>
          {this.props.children}
        <textarea 
          ref="source" 
          className="container"
          onKeyUp={this.callUpdateHandler} 
          value={value} 
          defaultValue={defaultValue} 
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