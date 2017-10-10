import React, { Component } from "react";
import PropTypes from "prop-types";

export default class TranposeSetter extends Component {
  // transponieren

  render() {
    return (
      <div name="transposer">
        <input
          onInput={this.doSomething}
          type="number"
          id="relativeTransposeInput"
        />
        <h3>{this.transpose}</h3>
      </div>
    );
  }
}
