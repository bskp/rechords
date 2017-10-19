import React, { Component } from "react";
import PropTypes from "prop-types";

export default class TranposeSetter extends Component {
  constructor(props) {
    super(props);
    this.transpose = 2;
  }

  doSomething = event => {
    console.log(event);
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
    this.props.doshit(Number.parseInt(value));
  };

  // Inherited from React.Component
  render() {
    // TODO: make object and calculate resulting key
    const options = [];
    const selection = 2; //convertthis.props.selection;
    for (var i = -8; i <= 8; i++) {
      var selected = false;
      if (i === selection) {
        const selected = true;
      }
      options.push({ key: i,  });
    }
    return (
      <div name="transposer">
        <select
          name="relTranspose"
          onChange={this.doSomething}
          type="number"
          id="relativeTransposeInput"
          defaultValue="0"
        >
          {options.map(o => (
            <option key={o.key} value={o.key}>
              {o.desc}
            </option>
          ))}
        </select>
        <span>{JSON.stringify(this.state)}</span>
      </div>
    );
  }
}

TranposeSetter.propTypes = {
  doshit: React.PropTypes.func
};
